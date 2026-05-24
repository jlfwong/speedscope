import {lastOf, KeyedSet} from './utils'
import {ValueFormatter} from './value-formatters'
import {FileFormat} from './file-format-spec'
import {defaultFormatter} from '../app-state'

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
) => { name?: string; file?: string; line?: number; col?: number } | null

export class HasWeights {
  private selfWeight = 0
  private totalWeight = 0
  private regSelfWeight = 0
  private regTotalWeight = 0
  private inverted = false

  setInverted(inverted: boolean) {
    this.inverted = inverted
  }

  isInverted(): boolean {
    return this.inverted
  }

  getSelfWeight() {
    return this.inverted ? this.regSelfWeight : this.selfWeight
  }

  getTotalWeight() {
    return this.inverted ? this.regTotalWeight : this.totalWeight
  }

  addToTotalWeight(delta: number) {
    this.totalWeight += delta
  }

  addToSelfWeight(delta: number) {
    this.selfWeight += delta
  }

  getRegSelfWeight() {
    return this.inverted ? this.selfWeight : this.regSelfWeight
  }

  getRegTotalWeight() {
    return this.inverted ? this.totalWeight : this.regTotalWeight
  }

  addToRegTotalWeight(delta: number) {
    this.regTotalWeight += delta
  }

  addToRegSelfWeight(delta: number) {
    this.regSelfWeight += delta
  }

  overwriteWeightWith(other: HasWeights) {
    this.selfWeight = other.selfWeight
    this.totalWeight = other.totalWeight
    this.regSelfWeight = other.regSelfWeight
    this.regTotalWeight = other.regTotalWeight
    this.inverted = other.inverted
  }

  getDiffPercStr(): string {
    const newStr = '+∞ (new in regression)'
    const removeStr = '-100% (removed)'
    if (this.getTotalWeight() === 0) {
      return this.inverted ? removeStr : newStr
    } else if (this.getRegTotalWeight() === 0) {
      return this.inverted ? newStr : removeStr
    } else {
      const pctChange = this.getDiffRatio() * 100
      const sign = pctChange > 0 ? '+' : ''
      return `${sign}${parseFloat(pctChange.toFixed(1))}%`
    }
  }

  // inverted is a sandwich view diffRegMode special flag, to keep in sync with load inverted profile
  getDiffRatio(inverted: Boolean = false): number {
    // When inverted, swap bas/reg so diff is always calculated as REG - BAS
    const bas = inverted ? this.regTotalWeight : this.totalWeight
    const reg = inverted ? this.totalWeight : this.regTotalWeight
    if (bas === 0 && reg === 0) return 0
    if (bas === 0) return 1
    if (reg === 0) return -1
    const delta = reg - bas
    const maxWeight = Math.max(bas, reg)
    return Math.max(-1, Math.min(1, delta / maxWeight))
  }

  getWeightedDiffRatio(): number {
    const baseRatio = this.getDiffRatio()
    const bas = this.inverted ? this.regTotalWeight : this.totalWeight
    const reg = this.inverted ? this.totalWeight : this.regTotalWeight
    if (bas === 0 && reg === 0) return 0
    const absDelta = Math.abs(reg - bas)
    const weightF = Math.log10(absDelta + 1)

    return baseRatio * weightF
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

  constructor(
          readonly frame: Frame,
          readonly parent: CallTreeNode | null,
  ) {
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

  protected frameNameCounts = new Map<string, number>();

  public getNameCount(name: string): number {
    return this.frameNameCounts.get(name) ?? 1;
  }

  public getSize(): number {
    return this.frames.size()
  }

  public getFrameByName(name: string): Frame | undefined {
    const byKey = this.frames.get(name)
    if (byKey) return byKey
    else {
      for (const f of this.frames) {
        if (f.name === name) return f;
      }
    }
  }

  // Profiles store two call-trees.
  //
  // The "append order" call tree is the one in which nodes are ordered in
  // whatever order they were appended to their parent.
  //
  // The "grouped" call tree is one in which each node has at most one child per
  // frame. Nodes are ordered in decreasing order of weight
  protected appendOrderCalltreeRoot = new CallTreeNode(Frame.root, null)
  protected groupedCalltreeRoot = new CallTreeNode(Frame.root, null)

  public dispose() {
    // console.log('profile disposed!')
    this.name = ''
    this.totalWeight = 0
    this.frames = new KeyedSet<Frame>()
    this.appendOrderCalltreeRoot = new CallTreeNode(Frame.root, null)
    this.groupedCalltreeRoot = new CallTreeNode(Frame.root, null)
  }

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
  protected regWeights: number[] = []
  protected inverted = false

  protected valueFormatter: ValueFormatter = defaultFormatter
  protected rawRegTotalWeight: number | null = null

  setInverted(inverted: boolean) {
    this.inverted = inverted
    for (const frame of this.frames) {
      frame.setInverted(inverted)
    }
    const visitNode = (node: CallTreeNode) => {
      node.setInverted(inverted)
      for (const child of node.children) {
        visitNode(child)
      }
    }
    visitNode(this.appendOrderCalltreeRoot)
    visitNode(this.groupedCalltreeRoot)
  }

  isInverted(): boolean {
    return this.inverted
  }

  hasDiffData(): boolean {
    return this.regWeights.length > 0 && this.regWeights.some(w => w > 0)
  }

  getWeights(): number[] {
    return this.inverted ? this.regWeights : this.weights
  }

  getRegWeights(): number[] {
    return this.inverted ? this.weights : this.regWeights
  }

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

  private cachedTotalRegWeight: number | null = null

  getTotalWeight() {
    return this.inverted ? this.computeTotalRegWeight() : this.totalWeight
  }

  getTotalRegWeight(): number {
    return this.inverted ? this.totalWeight : this.computeTotalRegWeight()
  }

  setRawRegTotalWeight(weight: number) {
    this.rawRegTotalWeight = weight
  }

  getRawRegTotalWeight(): number | null {
    return this.rawRegTotalWeight
  }

  private computeTotalRegWeight(): number {
    if (this.cachedTotalRegWeight === null) {
      this.cachedTotalRegWeight = this.regWeights.reduce((sum, w) => sum + w, 0)
    }
    return this.cachedTotalRegWeight
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

  private totalNonIdleRegWeight: number | null = null

  getTotalNonIdleRegWeight() {
    if (this.totalNonIdleRegWeight === null) {
      this.totalNonIdleRegWeight = this.groupedCalltreeRoot.children.reduce(
              (n, c) => n + c.getRegTotalWeight(),
              0,
      )
    }
    return this.totalNonIdleRegWeight
  }

  // This is private because it should only be called in the ProfileBuilder
  // classes. Once a Profile instance has been constructed, it should be treated
  // as immutable.
  protected sortGroupedCallTree() {
    const counts = new Map<string, number>();

    function visit(node: CallTreeNode) {
      // Count Frame.name
      const name = node.frame.name;
      counts.set(name, (counts.get(name) ?? 0) + 1);
      // Sort children by total weight descending
      node.children.sort((a, b) => -(a.getTotalWeight() - b.getTotalWeight()));
      // Traverse children
      node.children.forEach(visit);
    }

    visit(this.groupedCalltreeRoot);
    this.frameNameCounts = counts;
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

  forEachCallGroupedByRegWeight(
          openFrame: (node: CallTreeNode, value: number) => void,
          closeFrame: (node: CallTreeNode, value: number) => void,
  ) {
    function visit(node: CallTreeNode, start: number) {
      if (node.frame !== Frame.root) {
        openFrame(node, start)
      }

      let childTime = 0
      const sortedChildren = [...node.children].sort(
              (a, b) => b.getRegTotalWeight() - a.getRegTotalWeight()
      )

      sortedChildren.forEach(function (child) {
        visit(child, start + childTime)
        childTime += child.getRegTotalWeight()
      })

      if (node.frame !== Frame.root) {
        closeFrame(node, start + node.getRegTotalWeight())
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
      ) {
      }

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
    if (this.inverted) {
      flattenedProfile.setInverted(true)
    }

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

  getInvertedProfileForCallersOf(focalFrameInfo: FrameInfo, normalized: boolean): Profile {
    const focalFrame = Frame.getOrInsert(this.frames, focalFrameInfo)
    const builder = new StackListProfileBuilder()

    // Find all nodes matching the focal frame
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

    // Compute normalization ratio if needed
    let regScale = 1.0
    if (normalized && nodes.length > 0) {
      let basSum = 0
      let regSum = 0
      for (const node of nodes) {
        basSum += node.getTotalWeight()
        regSum += node.getRegTotalWeight()
      }
      if (regSum > 0) regScale = basSum / regSum
    }

    for (let node of nodes) {
      const stack: FrameInfo[] = []
      for (let n: CallTreeNode | null = node; n != null && n.frame !== Frame.root; n = n.parent) {
        stack.push(n.frame)
      }
      const bas = node.getTotalWeight()
      const reg = node.getRegTotalWeight() * regScale
      builder.appendSampleWithWeight(
              stack,
              this.inverted ? reg : bas,
              this.inverted ? bas : reg
      )
    }

    const ret = builder.build()
    ret.name = this.name
    ret.valueFormatter = this.valueFormatter
    if (this.inverted) {
      ret.setInverted(true)
    }
    return ret
  }


  getProfileForCalleesOf(focalFrameInfo: FrameInfo, normalized: boolean): Profile {
    const focalFrame = Frame.getOrInsert(this.frames, focalFrameInfo)
    const builder = new StackListProfileBuilder()

    // Collect all matching nodes (skip nested occurrences to avoid double counting)
    const matchingNodes: CallTreeNode[] = []

    function findMatching(node: CallTreeNode) {
      if (node.frame === focalFrame) {
        matchingNodes.push(node)
        // Don't recurse into children - nested occurrences of focalFrame
        // will be included in this subtree already
        return
      }
      for (let child of node.children) {
        findMatching(child)
      }
    }

    findMatching(this.appendOrderCalltreeRoot)

    // Sum all self weights for normalization
    function sumSelfWeights(nodes: CallTreeNode[], getter: (n: CallTreeNode) => number): number {
      let sum = 0

      function visit(node: CallTreeNode) {
        sum += getter(node)
        for (let child of node.children) visit(child)
      }

      for (const node of nodes) visit(node)
      return sum
    }

    let regScale = 1.0
    if (normalized && matchingNodes.length > 0) {
      const basSelf = sumSelfWeights(matchingNodes, n => n.getSelfWeight())
      const regSelf = sumSelfWeights(matchingNodes, n => n.getRegSelfWeight())
      if (regSelf > 0) {
        regScale = basSelf / regSelf
        if (regScale === 0) regScale = 1.0
      }
    }

    const inv = this.inverted

    // Record all subtrees with the same scale
    function recordSubtree(node: CallTreeNode) {
      const stack: FrameInfo[] = []

      function visit(n: CallTreeNode) {
        stack.push(n.frame)
        const bas = n.getSelfWeight()
        const reg = n.getRegSelfWeight() * regScale
        builder.appendSampleWithWeight(
                stack,
                inv ? reg : bas,
                inv ? bas : reg
        )
        for (let child of n.children) visit(child)
        stack.pop()
      }

      visit(node)
    }

    for (const node of matchingNodes) {
      recordSubtree(node)
    }

    const ret = builder.build()
    ret.name = this.name
    ret.valueFormatter = this.valueFormatter
    if (this.inverted) {
      ret.setInverted(true)
    }
    return ret
  }

  // Demangle symbols for readability
  async demangle() {
    let demangle: ((name: string) => string) | null = null

    for (let frame of this.frames) {
      // This function converts a mangled C++ and Rust name into a human-readable symbol.
      if (
              frame.name.startsWith('__Z') ||
              frame.name.startsWith('_R') ||
              frame.name.startsWith('_Z')
      ) {
        if (!demangle) {
          const demangleModule = await import('./demangle')
          demangle = await demangleModule.loadDemangling()
        }
        frame.name = demangle(frame.name)
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
  _appendSample(stack: Frame[], weight: number, regWeight: number, useAppendOrder: boolean) {
    if (isNaN(weight)) throw new Error('invalid weight')
    let node = useAppendOrder ? this.appendOrderCalltreeRoot : this.groupedCalltreeRoot

    let framesInStack = new Set<Frame>()

    for (let frame of stack) {
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
      node.addToRegTotalWeight(regWeight)

      // It's possible for the same frame to occur multiple
      // times in the same call stack due to either direct
      // or indirect recursion. We want to avoid counting that
      // frame multiple times for a single sample, we so just
      // track all of the unique frames that participated in
      // this call stack, then add to their weight at the end.
      framesInStack.add(node.frame)
    }
    node.addToSelfWeight(weight)
    node.addToRegSelfWeight(regWeight)

    if (useAppendOrder) {
      for (let child of node.children) {
        child.freeze()
      }
    }

    if (useAppendOrder) {
      node.frame.addToSelfWeight(weight)
      node.frame.addToRegSelfWeight(regWeight)

      for (let frame of framesInStack) {
        frame.addToTotalWeight(weight)
        frame.addToRegTotalWeight(regWeight)
      }

      if (node === lastOf(this.samples)) {
        this.weights[this.weights.length - 1] += weight
        this.regWeights[this.regWeights.length - 1] += regWeight
      } else {
        this.samples.push(node)
        this.weights.push(weight)
        this.regWeights.push(regWeight)
      }
    }
  }

  appendSampleWithWeight(stack: FrameInfo[], weight: number, regWeight: number = 0) {
    if (weight === 0 && regWeight === 0) {
      // Samples with zero weight have no effect, so let's ignore them
      return
    }
    if (weight < 0 || regWeight < 0) {
      throw new Error('Samples must have non-negative weights')
    }

    const frames = stack.map(fr => Frame.getOrInsert(this.frames, fr))
    this._appendSample(frames, weight, regWeight, true)
    this._appendSample(frames, weight, regWeight, false)
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
        this.setValueFormatter(defaultFormatter)
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
