import {lastOf, KeyedSet} from './utils'
import {ValueFormatter, RawValueFormatter} from './value-formatters'
const demangleCppModule = import('./demangle-cpp')

// Force eager loading of the module
demangleCppModule.then(() => {})

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
  getSelfWeight() {
    return this.selfWeight
  }
  getTotalWeight() {
    return this.totalWeight
  }
  addToTotalWeight(delta: number) {
    this.totalWeight += delta
  }
  addToSelfWeight(delta: number) {
    this.selfWeight += delta
  }
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

  private constructor(info: FrameInfo) {
    super()
    this.key = info.key
    this.name = info.name
    this.file = info.file
    this.line = info.line
    this.col = info.col
  }

  static root = new Frame({
    key: '(speedscope root)',
    name: '(speedscope root)',
  })

  static getOrInsert(set: KeyedSet<Frame>, info: FrameInfo) {
    return set.getOrInsert(new Frame(info))
  }
}

export class CallTreeNode extends HasWeights {
  children: CallTreeNode[] = []

  isRoot() {
    return this.frame === Frame.root
  }

  constructor(readonly frame: Frame, readonly parent: CallTreeNode | null) {
    super()
  }
}

export class Profile {
  protected name: string = ''

  protected totalWeight: number

  protected frames = new KeyedSet<Frame>()
  protected appendOrderCalltreeRoot = new CallTreeNode(Frame.root, null)
  protected groupedCalltreeRoot = new CallTreeNode(Frame.root, null)

  // List of references to CallTreeNodes at the top of the
  // stack at the time of the sample.
  protected samples: CallTreeNode[] = []
  protected weights: number[] = []

  protected valueFormatter: ValueFormatter = new RawValueFormatter()

  constructor(totalWeight: number = 0) {
    this.totalWeight = totalWeight
  }

  formatValue(v: number) {
    return this.valueFormatter.format(v)
  }
  setValueFormatter(f: ValueFormatter) {
    this.valueFormatter = f
  }

  getName() {
    return this.name
  }
  setName(name: string) {
    this.name = name
  }

  getTotalWeight() {
    return this.totalWeight
  }

  private totalNonIdleWeight: number | null = null
  getTotalNonIdleWeight() {
    if (this.totalNonIdleWeight === null) {
      this.totalNonIdleWeight = this.groupedCalltreeRoot.children.reduce(
        (n, c) => n + c.getTotalWeight(),
        0,
      )
    }
    return this.totalNonIdleWeight
  }

  forEachCallGrouped(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
  ) {
    function visit(node: CallTreeNode, start: number) {
      if (node.frame !== Frame.root) {
        openFrame(node, start)
      }

      let childTime = 0

      const children = [...node.children]
      children.sort((a, b) => (a.getTotalWeight() > b.getTotalWeight() ? -1 : 1))

      children.forEach(function(child) {
        visit(child, start + childTime)
        childTime += child.getTotalWeight()
      })

      if (node.frame !== Frame.root) {
        closeFrame(node, start + node.getTotalWeight())
      }
    }
    visit(this.groupedCalltreeRoot, 0)
  }

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
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
        lca && lca.frame != Frame.root && prevStack.indexOf(lca) === -1;
        lca = lca.parent
      ) {}

      // Close frames that are no longer open
      while (prevStack.length > 0 && lastOf(prevStack) != lca) {
        const node = prevStack.pop()!
        closeFrame(node, value)
      }

      // Open frames that are now becoming open
      const toOpen: CallTreeNode[] = []
      for (
        let node: CallTreeNode | null = stackTop;
        node && node.frame != Frame.root && node != lca;
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
      closeFrame(prevStack[i], value)
    }
  }

  forEachFrame(fn: (frame: Frame) => void) {
    this.frames.forEach(fn)
  }

  flattenRecursion(): Profile {
    const builder = new CallTreeProfileBuilder()

    const stack: (CallTreeNode | null)[] = []
    const framesInStack = new Set<Frame>()

    function openFrame(node: CallTreeNode, value: number) {
      if (framesInStack.has(node.frame)) {
        stack.push(null)
      } else {
        framesInStack.add(node.frame)
        stack.push(node)
        builder.enterFrame(node.frame, value)
      }
    }
    function closeFrame(node: CallTreeNode, value: number) {
      const stackTop = stack.pop()
      if (stackTop) {
        framesInStack.delete(stackTop.frame)
        builder.leaveFrame(stackTop.frame, value)
      }
    }

    this.forEachCall(openFrame, closeFrame)

    const flattenedProfile = builder.build()
    flattenedProfile.name = this.name
    flattenedProfile.valueFormatter = this.valueFormatter
    return flattenedProfile
  }

  // Demangle symbols for readability
  async demangle() {
    let demangleCpp: ((name: string) => string) | null = null

    for (let frame of this.frames) {
      // This function converts a mangled C++ name such as "__ZNK7Support6ColorFeqERKS0_"
      // into a human-readable symbol (in this case "Support::ColorF::==(Support::ColorF&)")
      if (frame.name.startsWith('__Z')) {
        if (!demangleCpp) {
          demangleCpp = (await demangleCppModule).demangleCpp
        }
        frame.name = demangleCpp(frame.name)
      }
    }
  }

  remapNames(callback: (name: string) => string) {
    for (let frame of this.frames) {
      frame.name = callback(frame.name);
    }
  }
}

export class StackListProfileBuilder extends Profile {
  _appendSample(stack: FrameInfo[], weight: number, useAppendOrder: boolean) {
    if (isNaN(weight)) throw new Error('invalid weight')
    let node = useAppendOrder ? this.appendOrderCalltreeRoot : this.groupedCalltreeRoot

    let framesInStack = new Set<Frame>()

    for (let frameInfo of stack) {
      const frame = Frame.getOrInsert(this.frames, frameInfo)
      const last = useAppendOrder
        ? lastOf(node.children)
        : node.children.find(c => c.frame === frame)
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

  build(): Profile {
    this.totalWeight = Math.max(this.totalWeight, this.weights.reduce((a, b) => a + b, 0))
    return this
  }
}

// As an alternative API for importing profiles more efficiently, provide a
// way to open & close frames directly without needing to construct tons of
// arrays as intermediaries.
export class CallTreeProfileBuilder extends Profile {
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

    let prevTop = lastOf(stack)

    if (prevTop) {
      if (useAppendOrder) {
        const delta = value - this.lastValue!
        if (delta > 0) {
          this.samples.push(prevTop)
          this.weights.push(value - this.lastValue!)
        }
      }

      const last = useAppendOrder
        ? lastOf(prevTop.children)
        : prevTop.children.find(c => c.frame === frame)
      let node: CallTreeNode
      if (last && last.frame == frame) {
        node = last
      } else {
        node = new CallTreeNode(frame, prevTop)
        prevTop.children.push(node)
      }
      stack.push(node)
    }
  }
  enterFrame(frameInfo: FrameInfo, value: number) {
    const frame = Frame.getOrInsert(this.frames, frameInfo)
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
      const leavingStackTop = this.appendOrderStack.pop()
      const delta = value - this.lastValue!
      if (delta > 0) {
        this.samples.push(leavingStackTop!)
        this.weights.push(value - this.lastValue!)
      }
    } else {
      this.groupedOrderStack.pop()
    }
  }

  leaveFrame(frameInfo: FrameInfo, value: number) {
    const frame = Frame.getOrInsert(this.frames, frameInfo)
    this.addWeightsToFrames(value)

    this._leaveFrame(frame, value, true)
    this._leaveFrame(frame, value, false)

    this.stack.pop()
    const frameCount = this.framesInStack.get(frame)
    if (frameCount == null) return
    if (frameCount === 1) {
      this.framesInStack.delete(frame)
    } else {
      this.framesInStack.set(frame, frameCount - 1)
    }
    this.lastValue = value

    this.totalWeight = Math.max(this.totalWeight, this.lastValue)
  }

  build(): Profile {
    return this
  }
}
