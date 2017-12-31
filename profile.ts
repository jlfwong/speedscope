import { lastOf } from './utils'

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
  getSelfTime() { return this.selfWeight }
  getTotalTime() { return this.totalWeight }
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

export interface ProfilingEvent {
  // Name of the event, e.g. "SQL Query"
  name: string

  // Details (e.g. the SQL query)
  details?: string

  // Bottom of the stack of the call-tree
  stack: CallTreeNode

  // Elapsed time since the start of the profile,
  // in microseconds
  start: number
  end: number

  // Color, if specified to associate with this event.
  // If unspecified, will be generated based on the name.
  color?: string
}

function getOrInsert<K, V>(map: Map<K, V>, k: K, v: V): V {
  if (!map.has(k)) map.set(k, v)
  return map.get(k)!
}

export class Profile {
  // Duration of the entire profile, in microseconds
  private duration: number

  private frames = new Map<string | number, Frame>()
  private calltreeRoots: CallTreeNode[] = []

  // List of references to CallTreeNodes at the top of the
  // stack at the time of the sample.
  private samples: CallTreeNode[] = []
  private weights: number[] = []

  constructor(duration: number) {
    this.duration = duration
  }

  getTotalWeight() { return this.duration }

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (value: number) => void
  ) {
    let prevStack: CallTreeNode[] = []
    let value = 0

    let sampleIndex = 0
    for (let stackTop of this.samples) {
      // Close frames that are no longer open
      while (prevStack.length > 0 && lastOf(prevStack) != stackTop) {
        prevStack.pop()
        closeFrame(value)
      }

      // Open frames that are now becoming open
      const toOpen: CallTreeNode[] = []
      for (let node: CallTreeNode | null = stackTop; node && node != lastOf(prevStack); node = node.parent) {
        toOpen.push(node)
      }

      for (let i = toOpen.length - 1; i >= 0; i--) {
        const node = toOpen[i]
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

  appendSample(stack: FrameInfo[], weight: number) {
    if (isNaN(weight)) throw new Error('invalid weight')
    let node: CallTreeNode | null = null
    let children = this.calltreeRoots

    for (let frameInfo of stack) {
      const frame = getOrInsert(this.frames, frameInfo.key, new Frame(frameInfo))
      const last = lastOf(children)
      if (last && last.frame == frame) {
        node = last
      } else {
        node = new CallTreeNode(frame, node)
        children.push(node)
      }
      node.addToTotalWeight(weight)

      // TODO(jlfwong): Do this in a set to avoid
      // multiple-counting recursive calls
      node.frame.addToTotalWeight(weight)

      children = node.children
    }

    if (node) {
      node.addToSelfWeight(weight)
      node.frame.addToSelfWeight(weight)
      this.samples.push(node)
      this.weights.push(weight)
    }
  }
}