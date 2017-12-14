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

export class HasTimings {
  private selfTime = 0
  private totalTime = 0
  getSelfTime() { return this.selfTime }
  getTotalTime() { return this.totalTime }
  addToTotalTime(delta: number) { this.totalTime += delta }
  addToSelfTime(delta: number) { this.selfTime += delta }
}

export class Frame extends HasTimings {
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

export class CallTreeNode extends HasTimings {
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

function lastOf<T>(ts: T[]): T | undefined {
  return ts[ts.length-1]
}

export class Profile {
  // Duration of the entire profile, in microseconds
  private duration: number

  private frames = new Map<string | number, Frame>()
  private calltreeRoots: CallTreeNode[] = []

  // List of references to CallTreeNodes at the top of the
  // stack at the time of the sample.
  private samples: CallTreeNode[] = []

  // List of time elapsed since the preceding sample was taken.
  // The first elements it the time elapsed since the beginning
  // of recording that the sample was taken.
  // Times are in microseconds.
  // This array should be the same length as the "samples" array.
  private timeDeltas: number[] = []

  // List of events recorded in parallel with the call
  // stack samples. Useful for overlaying IO events on
  // the same time axis as the sampling profile.
  private events: ProfilingEvent[] = []

  constructor(duration: number) {
    this.duration = duration
  }

  getDuration() { return this.duration }
  getEvents() { return this.events }

  forEachSample(fn: (stack: CallTreeNode[], timeDelta: number) => void) {
    const nodeToStack = new Map<CallTreeNode, CallTreeNode[]>()
    for (let i = 0; i < this.samples.length; i++) {
      let topOfStackNode: CallTreeNode = this.samples[i]

      // Memoize
      if (!nodeToStack.has(topOfStackNode)) {
        const stack: CallTreeNode[] = []
        for (let node: CallTreeNode | null = topOfStackNode; node; node = node.parent) {
          stack.push(node)
        }

        // Reverse to order from bottom-to-top
        stack.reverse()

        nodeToStack.set(topOfStackNode, stack)
      }

      fn(nodeToStack.get(topOfStackNode)!, this.timeDeltas[i])
    }
  }

  forEachFrame(fn: (frame: Frame) => void) {
    this.frames.forEach(fn)
  }

  appendSample(stack: FrameInfo[], timeDelta: number) {
    if (isNaN(timeDelta)) throw new Error('invalid timeDelta')
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
      node.addToTotalTime(timeDelta)
      node.frame.addToTotalTime(timeDelta)
      children = node.children
    }

    if (node) {
      node.addToSelfTime(timeDelta)
      node.frame.addToSelfTime(timeDelta)
      this.samples.push(node)
      this.timeDeltas.push(timeDelta)
    }
  }
}