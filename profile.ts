import { lastOf, getOrInsert } from './utils'

export interface FrameInfo {
  key: string | number

  // Name of the frame. May be a method name, e.g.
  // "ActiveRecord##to_hash"
  name: string

  // File path of the code corresponding to this
  // call stack frame.
  file?: string

  // Line in the given file where this frame occurs
  line?: number

  // Column in the file
  col?: number
}

export class HasWeights {
  private selfWeight = 0
  private totalWeight = 0
  getSelfWeight() { return this.selfWeight }
  getTotalWeight() { return this.totalWeight }
  addToTotalWeight(delta: number) { this.totalWeight += delta }
  addToSelfWeight(delta: number) { this.selfWeight += delta }
}

export class Frame extends HasWeights {
  key: string | number

  // Name of the frame. May be a method name, e.g.
  // "ActiveRecord##to_hash"
  name: string

  // File path of the code corresponding to this
  // call stack frame.
  file?: string

  // Line in the given file where this frame occurs
  line?: number

  // Column in the file
  col?: number

  constructor(info: FrameInfo) {
    super()
    this.key = info.key
    this.name = info.name
    this.file = info.file
    this.line = info.line
    this.col = info.col
  }
}

export class CallTreeNode extends HasWeights {
  children: CallTreeNode[] = []
  constructor(readonly frame: Frame, readonly parent: CallTreeNode | null) {
    super()
  }
}

const rootFrame = new Frame({
  key: '(speedscope root)',
  name: '(speedscope root)',
})

export interface ValueFormatter {
  format(v: number): string
}

export class RawValueFormatter implements ValueFormatter {
  format(v: number) {
    return v.toLocaleString()
  }
}

export class TimeFormatter implements ValueFormatter {
  private multiplier : number

  constructor(unit: 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds') {
    if (unit === 'nanoseconds') this.multiplier = 1e-9
    else if (unit === 'microseconds') this.multiplier = 1e-6
    else if (unit === 'milliseconds') this.multiplier = 1e-3
    else this.multiplier = 1
  }

  format(v: number) {
    const s = v * this.multiplier

    if (s / 1e0 >= 1) return `${s.toFixed(2)}s`
    if (s / 1e-3 >= 1) return `${(s / 1e-3).toFixed(2)}ms`
    if (s / 1e-6 >= 1) return `${(s / 1e-6).toFixed(2)}µs`
    else return `${(s / 1e-9).toFixed(2)}ms`
  }
}

export class Profile {
  private name: string

  private totalWeight: number

  private frames = new Map<string | number, Frame>()
  private appendOrderCalltreeRoot = new CallTreeNode(rootFrame, null)
  private groupedCalltreeRoot = new CallTreeNode(rootFrame, null)

  // List of references to CallTreeNodes at the top of the
  // stack at the time of the sample.
  private samples: CallTreeNode[] = []
  private weights: number[] = []

  private valueFormatter: ValueFormatter = new RawValueFormatter()

  constructor(totalWeight: number) {
    this.totalWeight = totalWeight
  }

  formatValue(v: number) { return this.valueFormatter.format(v) }
  setValueFormatter(f: ValueFormatter) { this.valueFormatter = f }

  getName() { return this.name }
  setName(name: string) { this.name = name }

  getTotalWeight() { return this.totalWeight }
  getTotalNonIdleWeight() {
    return this.groupedCalltreeRoot.children.reduce((n, c) => n + c.getTotalWeight(), 0)
  }

  forEachCallGrouped(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (value: number) => void
  ) {
    function visit(node: CallTreeNode, start: number) {
      if (node.frame !== rootFrame) {
        openFrame(node, start)
      }

      let childTime = 0

      const children = [...node.children]
      children.sort((a, b) => a.getTotalWeight() > b.getTotalWeight() ? -1 : 1)

      children.forEach(function (child) {
        visit(child, start + childTime)
        childTime += child.getTotalWeight()
      })

      if (node.frame !== rootFrame) {
        closeFrame(start + node.getTotalWeight())
      }
    }
    visit(this.groupedCalltreeRoot, 0)
  }

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (value: number) => void
  ) {
    let prevStack: CallTreeNode[] = []
    let value = 0

    let sampleIndex = 0
    for (let stackTop of this.samples) {
      // Find lowest common ancestor of the current stack and the previous one
      let lca: CallTreeNode | null = null

      // This is O(n^2), but n should be relatively small here (stack height),
      // so hopefully this isn't much of a problem
      for (
        lca = stackTop;
        lca && lca.frame != rootFrame && prevStack.indexOf(lca) === -1;
        lca = lca.parent
      ) {}

      // Close frames that are no longer open
      while (prevStack.length > 0 && lastOf(prevStack) != lca) {
        prevStack.pop()
        closeFrame(value)
      }

      // Open frames that are now becoming open
      const toOpen: CallTreeNode[] = []
      for (
        let node: CallTreeNode | null = stackTop;
        node && node.frame != rootFrame && node != lca;
        node = node.parent
      ) {
        toOpen.push(node)
      }
      toOpen.reverse()

      for (let node of toOpen) {
        openFrame(node, value)
      }

      prevStack = prevStack.concat(toOpen)
      value += this.weights[sampleIndex++]
    }

    // Close frames that are open at the end of the trace
    for (let i = prevStack.length - 1; i >= 0; i--) {
      closeFrame(value)
    }
  }

  forEachFrame(fn: (frame: Frame) => void) {
    this.frames.forEach(fn)
  }

  _appendSample(stack: FrameInfo[], weight: number, useAppendOrder: boolean) {
    if (isNaN(weight)) throw new Error('invalid weight')
    let node = useAppendOrder ? this.appendOrderCalltreeRoot : this.groupedCalltreeRoot

    let framesInStack = new Set<Frame>()

    for (let frameInfo of stack) {
      const frame = getOrInsert(this.frames, frameInfo.key, () => new Frame(frameInfo))
      const last = useAppendOrder ? lastOf(node.children) : node.children.find(c => c.frame === frame)
      if (last && last.frame == frame) {
        node = last
      } else {
        const parent = node
        node = new CallTreeNode(frame, node)
        parent.children.push(node)
      }
      node.addToTotalWeight(weight)

      // It's possible for the same frame to occur multiple
      // times in the same call stack due to either direct
      // or indirect recursion. We want to avoid counting that
      // frame multiple times for a single sample, we so just
      // track all of the unique frames that participated in
      // this call stack, then add to their weight at the end.
      framesInStack.add(node.frame)
    }
    node.addToSelfWeight(weight)

    if (useAppendOrder) {
      node.frame.addToSelfWeight(weight)

      for (let frame of framesInStack) {
        frame.addToTotalWeight(weight)
      }

      this.samples.push(node)
      this.weights.push(weight)
    }
  }

  appendSample(stack: FrameInfo[], weight: number) {
    this._appendSample(stack, weight, true)
    this._appendSample(stack, weight, false)
  }

  // As an alternative API for importing profiles more efficiently, provide a
  // way to open & close frames directly without needing to construct tons of
  // arrays as intermediaries.
  private appendOrderStack: CallTreeNode[] = [this.appendOrderCalltreeRoot]
  private groupedOrderStack: CallTreeNode[] = [this.groupedCalltreeRoot]
  private framesInStack = new Map<Frame, number>()
  private stack: Frame[] = []

  private lastValue: number | null = null
  private addWeightsToFrames(value: number) {
    if (this.lastValue == null) this.lastValue = value
    const delta = value - this.lastValue!
    for (let frame of this.framesInStack.keys()) {
      frame.addToTotalWeight(delta)
    }
    const stackTop = lastOf(this.stack)
    if (stackTop) {
      stackTop.addToSelfWeight(delta)
    }
  }
  private addWeightsToNodes(value: number, stack: CallTreeNode[]) {
    const delta = value - this.lastValue!
    for (let node of stack) {
      node.addToTotalWeight(delta)
    }
    const stackTop = lastOf(stack)
    if (stackTop) {
      stackTop.addToSelfWeight(delta)
    }
  }

  private _enterFrame(frame: Frame, value: number, useAppendOrder: boolean) {
    let stack = useAppendOrder ? this.appendOrderStack : this.groupedOrderStack
    this.addWeightsToNodes(value, stack)

    let node = lastOf(stack)
    if (node) {
      const last = useAppendOrder ? lastOf(node.children) : node.children.find(c => c.frame === frame)
      if (last && last.frame == frame) {
        node = last
      } else {
        const parent = node
        node = new CallTreeNode(frame, node)
        parent.children.push(node)
      }
    }
  }
  enterFrame(frameInfo: FrameInfo, value: number) {
    const frame = getOrInsert(this.frames, frameInfo.key, () => new Frame(frameInfo))
    this.addWeightsToFrames(value)
    this._enterFrame(frame, value, true)
    this._enterFrame(frame, value, false)

    this.stack.push(frame)
    const frameCount = this.framesInStack.get(frame) || 0
    this.framesInStack.set(frame, frameCount + 1)
    this.lastValue = value
  }

  private _leaveFrame(frame: Frame, value: number, useAppendOrder: boolean) {
    let stack = useAppendOrder ? this.appendOrderStack : this.groupedOrderStack
    this.addWeightsToNodes(value, stack)

    if (useAppendOrder) {
      this.appendOrderStack.pop()
    } else {
      this.groupedOrderStack.pop()
    }
  }
  leaveFrame(frameInfo: FrameInfo, value: number) {
    const frame = getOrInsert(this.frames, frameInfo.key, () => new Frame(frameInfo))
    this.addWeightsToFrames(value)
    this._leaveFrame(frame, value, true)
    this._leaveFrame(frame, value, false)

    this.stack.pop()
    const frameCount = this.framesInStack.get(frame)
    if (frameCount == null) return
    if (frameCount === 1) {
      this.framesInStack.delete(frame)
    } else {
      this.framesInStack.set(frame, frameCount)
    }
    this.lastValue = value
  }
}