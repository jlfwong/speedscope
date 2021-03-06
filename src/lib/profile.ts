import {lastOf, KeyedSet} from './utils'
import {ValueFormatter, RawValueFormatter} from './value-formatters'
import {FileFormat} from './file-format-spec'
const demangleCppModule = import('./demangle-cpp')

export interface FrameInfo {
  key: string | number

  // Name of the frame. May be a method name, e.g.
  // "ActiveRecord##to_hash"
  name: string

  // File path of the code corresponding to this
  // call stack frame.
  file?: string

  // Line in the given file where this frame occurs, 1-based.
  line?: number

  // Column in the file, 1-based.
  col?: number
}

export type SymbolRemapper = (
  frame: Frame,
) => {name?: string; file?: string; line?: number; col?: number} | null

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

  overwriteWeightWith(other: HasWeights) {
    this.selfWeight = other.selfWeight
    this.totalWeight = other.totalWeight
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

  // If a node is "frozen", it means it should no longer be mutated.
  private frozen = false
  isFrozen() {
    return this.frozen
  }
  freeze() {
    this.frozen = true
  }

  constructor(readonly frame: Frame, readonly parent: CallTreeNode | null) {
    super()
  }
}

export interface ProfileGroup {
  name: string
  indexToView: number
  profiles: Profile[]
}

export class Profile {
  protected name: string = ''

  protected totalWeight: number

  protected frames = new KeyedSet<Frame>()

  // Profiles store two call-trees.
  //
  // The "append order" call tree is the one in which nodes are ordered in
  // whatever order they were appended to their parent.
  //
  // The "grouped" call tree is one in which each node has at most one child per
  // frame. Nodes are ordered in decreasing order of weight
  protected appendOrderCalltreeRoot = new CallTreeNode(Frame.root, null)
  protected groupedCalltreeRoot = new CallTreeNode(Frame.root, null)

  public getAppendOrderCalltreeRoot() {
    return this.appendOrderCalltreeRoot
  }
  public getGroupedCalltreeRoot() {
    return this.groupedCalltreeRoot
  }

  // List of references to CallTreeNodes at the top of the
  // stack at the time of the sample.
  protected samples: CallTreeNode[] = []
  protected weights: number[] = []

  protected valueFormatter: ValueFormatter = new RawValueFormatter()

  constructor(totalWeight: number = 0) {
    this.totalWeight = totalWeight
  }

  shallowClone(): Profile {
    const profile = new Profile(this.totalWeight)
    Object.assign(profile, this)
    return profile
  }

  formatValue(v: number) {
    return this.valueFormatter.format(v)
  }
  setValueFormatter(f: ValueFormatter) {
    this.valueFormatter = f
  }
  getWeightUnit(): FileFormat.ValueUnit {
    return this.valueFormatter.unit
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

  // This is private because it should only be called in the ProfileBuilder
  // classes. Once a Profile instance has been constructed, it should be treated
  // as immutable.
  protected sortGroupedCallTree() {
    function visit(node: CallTreeNode) {
      node.children.sort((a, b) => -(a.getTotalWeight() - b.getTotalWeight()))
      node.children.forEach(visit)
    }
    visit(this.groupedCalltreeRoot)
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

      node.children.forEach(function (child) {
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

  getProfileWithRecursionFlattened(): Profile {
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

    // When constructing a profile with recursion flattened,
    // counter-intuitive things can happen to "self time" measurements
    // for functions.
    // For example, given the following list of stacks w/ weights:
    //
    // a 1
    // a;b;a 1
    // a;b;a;b;a 1
    // a;b;a 1
    //
    // The resulting profile with recursion flattened out will look like this:
    //
    // a 1
    // a;b 3
    //
    // Which is useful to view, but it's counter-intuitive to move self-time
    // for frames around, since analyzing the self-time of functions is an important
    // thing to be able to do accurately, and we don't want this to change when recursion
    // is flattened. To work around that, we'll just copy the weights directly from the
    // un-flattened profile.
    this.forEachFrame(f => {
      flattenedProfile.frames.getOrInsert(f).overwriteWeightWith(f)
    })

    return flattenedProfile
  }

  getInvertedProfileForCallersOf(focalFrameInfo: FrameInfo): Profile {
    const focalFrame = Frame.getOrInsert(this.frames, focalFrameInfo)
    const builder = new StackListProfileBuilder()

    // TODO(jlfwong): Could construct this at profile
    // construction time rather than on demand.
    const nodes: CallTreeNode[] = []

    function visit(node: CallTreeNode) {
      if (node.frame === focalFrame) {
        nodes.push(node)
      } else {
        for (let child of node.children) {
          visit(child)
        }
      }
    }

    visit(this.appendOrderCalltreeRoot)

    for (let node of nodes) {
      const stack: FrameInfo[] = []
      for (let n: CallTreeNode | null = node; n != null && n.frame !== Frame.root; n = n.parent) {
        stack.push(n.frame)
      }
      builder.appendSampleWithWeight(stack, node.getTotalWeight())
    }

    const ret = builder.build()
    ret.name = this.name
    ret.valueFormatter = this.valueFormatter
    return ret
  }

  getProfileForCalleesOf(focalFrameInfo: FrameInfo): Profile {
    const focalFrame = Frame.getOrInsert(this.frames, focalFrameInfo)
    const builder = new StackListProfileBuilder()

    function recordSubtree(focalFrameNode: CallTreeNode) {
      const stack: FrameInfo[] = []

      function visit(node: CallTreeNode) {
        stack.push(node.frame)
        builder.appendSampleWithWeight(stack, node.getSelfWeight())
        for (let child of node.children) {
          visit(child)
        }
        stack.pop()
      }

      visit(focalFrameNode)
    }

    function findCalls(node: CallTreeNode) {
      if (node.frame === focalFrame) {
        recordSubtree(node)
      } else {
        for (let child of node.children) {
          findCalls(child)
        }
      }
    }

    findCalls(this.appendOrderCalltreeRoot)

    const ret = builder.build()
    ret.name = this.name
    ret.valueFormatter = this.valueFormatter
    return ret
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

  remapSymbols(callback: SymbolRemapper) {
    for (let frame of this.frames) {
      const remapped = callback(frame)
      if (remapped == null) {
        continue
      }
      const {name, file, line, col} = remapped
      if (name != null) {
        frame.name = name
      }
      if (file != null) {
        frame.file = file
      }
      if (line != null) {
        frame.line = line
      }
      if (col != null) {
        frame.col = col
      }
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
      if (last && !last.isFrozen() && last.frame == frame) {
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
      for (let child of node.children) {
        child.freeze()
      }
    }

    if (useAppendOrder) {
      node.frame.addToSelfWeight(weight)

      for (let frame of framesInStack) {
        frame.addToTotalWeight(weight)
      }

      if (node === lastOf(this.samples)) {
        this.weights[this.weights.length - 1] += weight
      } else {
        this.samples.push(node)
        this.weights.push(weight)
      }
    }
  }

  appendSampleWithWeight(stack: FrameInfo[], weight: number) {
    if (weight === 0) {
      // Samples with zero weight have no effect, so let's ignore them
      return
    }
    if (weight < 0) {
      throw new Error('Samples must have positive weights')
    }

    this._appendSample(stack, weight, true)
    this._appendSample(stack, weight, false)
  }

  private pendingSample: {
    stack: FrameInfo[]
    startTimestamp: number
    centralTimestamp: number
  } | null = null
  appendSampleWithTimestamp(stack: FrameInfo[], timestamp: number) {
    if (this.pendingSample) {
      if (timestamp < this.pendingSample.centralTimestamp) {
        throw new Error('Timestamps received out of order')
      }
      const endTimestamp = (timestamp + this.pendingSample.centralTimestamp) / 2
      this.appendSampleWithWeight(
        this.pendingSample.stack,
        endTimestamp - this.pendingSample.startTimestamp,
      )
      this.pendingSample = {stack, startTimestamp: endTimestamp, centralTimestamp: timestamp}
    } else {
      this.pendingSample = {stack, startTimestamp: timestamp, centralTimestamp: timestamp}
    }
  }

  build(): Profile {
    if (this.pendingSample) {
      if (this.samples.length > 0) {
        this.appendSampleWithWeight(
          this.pendingSample.stack,
          this.pendingSample.centralTimestamp - this.pendingSample.startTimestamp,
        )
      } else {
        // There is only a single sample. In this case, units will be meaningless,
        // so we'll append with a weight of 1 and also clear any value formatter
        this.appendSampleWithWeight(this.pendingSample.stack, 1)
        this.setValueFormatter(new RawValueFormatter())
      }
    }
    this.totalWeight = Math.max(
      this.totalWeight,
      this.weights.reduce((a, b) => a + b, 0),
    )
    this.sortGroupedCallTree()
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

  private lastValue: number = 0
  private addWeightsToFrames(value: number) {
    const delta = value - this.lastValue
    for (let frame of this.framesInStack.keys()) {
      frame.addToTotalWeight(delta)
    }
    const stackTop = lastOf(this.stack)
    if (stackTop) {
      stackTop.addToSelfWeight(delta)
    }
  }
  private addWeightsToNodes(value: number, stack: CallTreeNode[]) {
    const delta = value - this.lastValue
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
        const delta = value - this.lastValue
        if (delta > 0) {
          this.samples.push(prevTop)
          this.weights.push(value - this.lastValue)
        } else if (delta < 0) {
          throw new Error(
            `Samples must be provided in increasing order of cumulative value. Last sample was ${this.lastValue}, this sample was ${value}`,
          )
        }
      }

      const last = useAppendOrder
        ? lastOf(prevTop.children)
        : prevTop.children.find(c => c.frame === frame)
      let node: CallTreeNode
      if (last && !last.isFrozen() && last.frame == frame) {
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
    this.totalWeight = Math.max(this.totalWeight, this.lastValue)
  }

  private _leaveFrame(frame: Frame, value: number, useAppendOrder: boolean) {
    let stack = useAppendOrder ? this.appendOrderStack : this.groupedOrderStack
    this.addWeightsToNodes(value, stack)

    if (useAppendOrder) {
      const leavingStackTop = this.appendOrderStack.pop()
      if (leavingStackTop == null) {
        throw new Error(`Trying to leave ${frame.key} when stack is empty`)
      }
      if (this.lastValue == null) {
        throw new Error(`Trying to leave a ${frame.key} before any have been entered`)
      }
      leavingStackTop.freeze()

      if (leavingStackTop.frame.key !== frame.key) {
        throw new Error(
          `Tried to leave frame "${frame.name}" while frame "${leavingStackTop.frame.name}" was at the top at ${value}`,
        )
      }

      const delta = value - this.lastValue
      if (delta > 0) {
        this.samples.push(leavingStackTop)
        this.weights.push(value - this.lastValue)
      } else if (delta < 0) {
        throw new Error(
          `Samples must be provided in increasing order of cumulative value. Last sample was ${this
            .lastValue!}, this sample was ${value}`,
        )
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
    // Each stack is expected to contain a single node which we initialize to be
    // the root node.
    if (this.appendOrderStack.length > 1 || this.groupedOrderStack.length > 1) {
      throw new Error('Tried to complete profile construction with a non-empty stack')
    }
    this.sortGroupedCallTree()
    return this
  }
}
