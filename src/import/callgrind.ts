// https://www.valgrind.org/docs/manual/cl-format.html
//
// Larger example files can be found by searching on github:
// https://github.com/search?q=cfn%3D&type=code
//
// Converting callgrind files into flamegraphs is challenging because callgrind
// formatted profiles contain call graphs with weighted nodes and edges, and
// such a weighted call graph does not uniquely define a flamegraph.
//
// Consider a program that looks like this:
//
//    // example.js
//    function backup(read) {
//      if (read) {
//        read()
//      } else {
//        write()
//      }
//    }
//
//    function start() {
//       backup(true)
//    }
//
//    function end() {
//       backup(false)
//    }
//
//    start()
//    end()
//
// Profiling this program might result in a profile that looks like the
// following flame graph defined in Brendan Gregg's plaintext format:
//
//    start;backup;read 4
//    end;backup;write 4
//
// When we convert this execution into a call-graph, we get the following:
//
//      +------------------+     +---------------+
//      | start (self: 0)  |     | end (self: 0) |
//      +------------------+     +---------------|
//                   \               /
//        (total: 4)  \             / (total: 4)
//                     v           v
//                 +------------------+
//                 | backup (self: 0) |
//                 +------------------+
//                    /            \
//       (total: 4)  /              \ (total: 4)
//                  v                v
//      +----------------+      +-----------------+
//      | read (self: 4) |      | write (self: 4) |
//      +----------------+      +-----------------+
//
// In the process of the conversion, we've lost information about the ratio of
// time spent in read v.s. write in the start call v.s. the end call. The
// following flame graph would yield the exact same call-graph, and therefore
// the exact sample call-grind formatted profile:
//
//    start;backup;read 3
//    start;backup;write 1
//    end;backup;read 1
//    end;backup;write 3
//
// This is unfortunate, since it means we can't produce a flamegraph that isn't
// potentially lying about the what the actual execution behavior was. To
// produce a flamegraph at all from the call graph representation, we have to
// decide how much weight each sub-call should have. Given that we know the
// total weight of each node, we'll make the incorrect assumption that every
// invocation of a function will have the average distribution of costs among
// the sub-function invocations. In the example given, this means we assume that
// every invocation of backup() is assumed to spend half its time in read() and
// half its time in write().
//
// So the flamegraph we'll produce from the given call-graph will actually be:
//
//    start;backup;read 2
//    start;backup;write 2
//    end;backup;read 2
//    end;backup;write 2
//
// A particularly bad consequence is that the resulting flamegraph will suggest
// that there was at some point a call stack that looked like
// strat;backup;write, even though that never happened in the real program
// execution.

import {CallTreeProfileBuilder, Frame, FrameInfo, Profile, ProfileGroup} from '../lib/profile'
import {getOrElse, getOrInsert, KeyedSet} from '../lib/utils'
import {ByteFormatter, TimeFormatter} from '../lib/value-formatters'
import {TextFileContent} from './utils'

class CallGraph {
  private frameSet = new KeyedSet<Frame>()
  private totalWeights = new Map<Frame, number>()
  private childrenTotalWeights = new Map<Frame, Map<Frame, number>>()

  constructor(
    private fileName: string,
    private fieldName: string,
  ) {}

  private getOrInsertFrame(info: FrameInfo): Frame {
    return Frame.getOrInsert(this.frameSet, info)
  }

  private addToTotalWeight(frame: Frame, weight: number) {
    if (!this.totalWeights.has(frame)) {
      this.totalWeights.set(frame, weight)
    } else {
      this.totalWeights.set(frame, this.totalWeights.get(frame)! + weight)
    }
  }

  addSelfWeight(frameInfo: FrameInfo, weight: number) {
    this.addToTotalWeight(this.getOrInsertFrame(frameInfo), weight)
  }

  addChildWithTotalWeight(parentInfo: FrameInfo, childInfo: FrameInfo, weight: number) {
    const parent = this.getOrInsertFrame(parentInfo)
    const child = this.getOrInsertFrame(childInfo)

    const childMap = getOrInsert(this.childrenTotalWeights, parent, k => new Map())

    if (!childMap.has(child)) {
      childMap.set(child, weight)
    } else {
      childMap.set(child, childMap.get(child) + weight)
    }

    this.addToTotalWeight(parent, weight)
  }

  toProfile(): Profile {
    const profile = new CallTreeProfileBuilder()

    let unitMultiplier = 1

    // These are common field names used by Xdebug. Let's give them special
    // treatment to more helpfully display units.
    if (this.fieldName === 'Time_(10ns)') {
      profile.setName(`${this.fileName} -- Time`)
      unitMultiplier = 10
      profile.setValueFormatter(new TimeFormatter('nanoseconds'))
    } else if (this.fieldName == 'Memory_(bytes)') {
      profile.setName(`${this.fileName} -- Memory`)
      profile.setValueFormatter(new ByteFormatter())
    } else {
      profile.setName(`${this.fileName} -- ${this.fieldName}`)
    }

    let totalCumulative = 0

    const currentStack = new Set<Frame>()

    // Sum of root weights; used as the pruning threshold in visit().
    let maxWeight = 0

    // Tracks fully-expanded frames; subsequent visits collapse to a leaf to avoid exponential blowup in highly-connected graphs.
    const visitedGlobally = new Set<Frame>()

    let cycleDetected = false
    const visit = (frame: Frame, subtreeTotalWeight: number) => {
      if (currentStack.has(frame)) {
        // Call-graphs are allowed to have cycles. Call-trees are not. In case
        // we run into a cycle, we'll just avoid recursing into the same subtree
        // more than once in a call stack. The result will be that the time
        // spent in the recursive call will instead be attributed as self time
        // in the parent.
        cycleDetected = true
        return
      }

      // We need to calculate how much weight to give to a particular node in
      // the call-tree based on information from the call-graph. A given node
      // from the call-graph might correspond to several nodes in the call-tree,
      // so we need to decide how to distribute the weight of the call-graph
      // node to the various call-tree nodes.
      //
      // We assume that the weighting is evenly distributed. If a call-tree node
      // X occurs with weights x1 and x2, and we know from the call-graph that
      // child Y of X has a total weight y, then we assume the child Y of X has
      // weight y*x1/(x1 + x2) for the first occurrence, and y*x2(y1 + x2) for
      // the second occurrence.
      //
      // This assumption is incorrectly (sometimes wildly so), but we need to
      // make *some* assumption, and this seems to me the sanest option.
      //
      // See the comment at the top of the file for an example where this
      // assumption can yield especially misleading results.

      if (subtreeTotalWeight < 1e-4 * maxWeight) {
        // This assumption about even distribution can cause us to generate a
        // call tree with dramatically more nodes than the call graph.
        //
        // Consider a function which is called 1000 times, where the result is
        // cached. The first invocation has a complex call tree and may take
        // 100ms. Let's say that this complex call tree has 250 nodes.
        //
        // Subsequent calls use the cached result, so take only 1ms, and have no
        // children in their call trees. So we have, in total, (1 + 250) + 999
        // nodes in the call-tree for a total of 1250 nodes.
        //
        // The information specific to each invocation is, however, lost in the
        // call-graph representation.
        //
        // Because of the even distribution assumption we make, this means that
        // the call-trees of each invocation will have the same shape. Each 1ms
        // call-tree will look identical to the 100ms call-tree, just
        // horizontally compacted. So instead of 1251 nodes, we have
        // 1000*250=250,000 nodes in the resulting call graph.
        //
        // To mitigate this explosion of the # of nodes, we ignore subtrees
        // whose weights are less than 0.01% of the heaviest node in the call
        // graph.
        return
      }

      const totalWeightForFrameInCallgraph = getOrElse(this.totalWeights, frame, () => 0)
      if (totalWeightForFrameInCallgraph === 0) {
        return
      }

      // If this frame has already been fully expanded from an earlier call
      // path, show it as a leaf here (weight becomes self-time) rather than
      // re-expanding its entire subtree a second time.
      if (visitedGlobally.has(frame)) {
        profile.enterFrame(frame, Math.round(totalCumulative * unitMultiplier))
        totalCumulative += subtreeTotalWeight
        profile.leaveFrame(frame, Math.round(totalCumulative * unitMultiplier))
        return
      }
      visitedGlobally.add(frame)

      let selfWeightForNodeInCallTree = subtreeTotalWeight

      profile.enterFrame(frame, Math.round(totalCumulative * unitMultiplier))

      currentStack.add(frame)
      for (let [child, totalWeightAsChild] of this.childrenTotalWeights.get(frame) || []) {
        // To determine the weight of the child in the call tree, we look at the
        // weight of the child in the call graph relative to its parent.
        const childCallTreeWeight =
          subtreeTotalWeight * (totalWeightAsChild / totalWeightForFrameInCallgraph)

        let prevTotalCumulative = totalCumulative
        visit(child, childCallTreeWeight)

        // Even though we tried to add a child with total weight equal to
        // childCallTreeWeight, we might have failed for a variety of data
        // consistency reasons, or due to cycles.
        //
        // We want to avoid losing weight in the call tree by subtracting from
        // the self weight on the assumption it was added to the subtree, so we
        // only subtree from the self weight the amount that was *actually* used
        // by the subtree, rather than the amount we *intended* for it to use.
        const actualChildCallTreeWeight = totalCumulative - prevTotalCumulative
        selfWeightForNodeInCallTree -= actualChildCallTreeWeight
      }
      currentStack.delete(frame)

      totalCumulative += selfWeightForNodeInCallTree
      profile.leaveFrame(frame, Math.round(totalCumulative * unitMultiplier))
    }

    // It's surprisingly hard to figure out which nodes in the call graph
    // constitute the root nodes of call trees.
    //
    // Here are a few intuitive options, and reasons why they're not always
    // correct or good.
    //
    // ## 1. (natural-roots) Find nodes in the call graph that have no callers
    //
    // This is probably right 99% of the time in practice, but since the
    // callgrind is totally general, it's totally valid to have a file
    // representing a profile for the following code:
    //
    //    function a() {
    //      b()
    //    }
    //    function b() {
    //    }
    //    a()
    //    b()
    //
    // In this case, even though b has a caller, some of the real calltree for
    // an execution trace of the program will have b on the top of the stack.
    //
    // ## 2. (residual-weight) Find nodes in the call graph that still have weight if you
    //       subtract all of the weight caused by callers.
    //
    // The callgraph format, in theory, provides inclusive times for every
    // function call. That means if you have a function `alpha` with a total
    // weight of 20, and its only in-edge in the call-graph has weight of 10,
    // that should indicate that `alpha` exists both as the root-node of a
    // calltree, and as a node in some other call-tree.
    //
    // In theory, you should be able to figure out the weight of it as a root
    // node by subtracting the weights of all the in-edges. In practice, real
    // callgrind files are inconsistent in how they do accounting for in-edges
    // where you end up in weird situations where the weight of in-edges
    // *exceeds* the weight of nodes (where the weight of a node is its
    // self-weight plus the weight of all its out-edges).
    //
    // ## 3. Find the heaviest node in the call graph, build its call-tree, and
    //       decrease the weights of other nodes in the call graph while you
    //       build the call tree. After you've done this, repeat with the new
    //       heaviest.
    //
    // I think this version is probably fully correct, but the performance is
    // awful. The naive-version is O(n^2) because you have to re-determine which
    // node is the heaviest after each time you finish building a call-tree. You
    // can't just sort, because the relative ordering also changes with the
    // construction of each call tree.
    //
    // There's probably a clever solution here which puts all of the nodes into
    // a min-heap and then deletes and re-inserts nodes as their weights change,
    // but reasoning about the performance of that is a big pain in the butt.
    //
    // Despite not always being correct, I'm opting for option (1) (natural-roots), with a
    // fallback to option (2) (residual-weight) when no natural roots exist (e.g. cyclic call graphs).

    const rootNodes = new Set<Frame>(this.frameSet)

    for (let [_, childMap] of this.childrenTotalWeights) {
      for (let [child, _] of childMap) {
        rootNodes.delete(child)
      }
    }

    let useResidualWeight = false
    if (rootNodes.size === 0) {
      useResidualWeight = true
    }

    if (rootNodes.size > 0) {
      for (let rootNode of rootNodes) {
        maxWeight += this.totalWeights.get(rootNode)!
      }
      for (let rootNode of rootNodes) {
        visit(rootNode, this.totalWeights.get(rootNode)!)
      }
    } else if (useResidualWeight) {
      // Compute incoming call weights to find residual-weight entry points.
      const incomingWeights = new Map<Frame, number>()
      for (const childMap of this.childrenTotalWeights.values()) {
        for (const [child, weight] of childMap) {
          incomingWeights.set(child, (incomingWeights.get(child) || 0) + weight)
        }
      }
      const residuals: Array<[Frame, number]> = []
      for (const [frame, totalWeight] of this.totalWeights) {
        const residual = totalWeight - (incomingWeights.get(frame) || 0)
        if (residual > 0) residuals.push([frame, residual])
      }
      // Visit heaviest residual roots first so the flame graph is ordered.
      residuals.sort((a, b) => b[1] - a[1])
      for (const [, residual] of residuals) {
        maxWeight += residual
      }
      for (const [frame, residual] of residuals) {
        visit(frame, residual)
      }
    }

    if (cycleDetected) {
      console.warn(
        `[callgrind] ${this.fileName} (${this.fieldName}): cycle(s) detected in call graph — recursive call weights are attributed as self time in the caller`,
      )
    }
    return profile.build()
  }
}

// In writing this, I initially tried to use the formal grammar described in
// section 3.2 of https://www.valgrind.org/docs/manual/cl-format.html, but
// stopped because most of the information isn't relevant for visualization, and
// because there's inconsistency between the grammar and subsequence
// descriptions.
//
// For example, the grammar for headers specifies all the valid header names,
// but then the writing below that mentions there may be a "totals" or "summary"
// header, which should be disallowed by the formal grammar.
//
// So, instead, I'm not going to bother with a formal parse. Since there are no
// real recursive structures in this file format, that should be okay.
class CallgrindParser {
  private lineIterator: Iterator<string>
  private lineNum: number = 0

  private callGraphs: CallGraph[] | null = null
  private eventsLine: string | null = null

  private filename: string | null = null
  private functionName: string | null = null
  private calleeFilename: string | null = null
  private calleeFunctionName: string | null = null

  private savedFileNames: {[id: string]: string} = {}
  private savedFunctionNames: {[id: string]: string} = {}

  // Tracks the number of position fields per cost line (default 1 = "line" only).
  // "positions: instr line" means 2 position fields; "positions: instr" means 1.
  private numPositionFields: number = 1

  constructor(
    contents: TextFileContent,
    private importedFileName: string,
  ) {
    this.lineIterator = contents.splitLines()[Symbol.iterator]()
  }

  private consumeLine(): string | null {
    const result = this.lineIterator.next()
    if (result.done) return null
    this.lineNum++
    return result.value
  }

  // Lines parsed per chunk before yielding to the event loop.
  private static readonly YIELD_EVERY = 10_000

  async parse(): Promise<ProfileGroup | null> {
    let linesUntilYield = CallgrindParser.YIELD_EVERY
    let line: string | null
    while ((line = this.consumeLine()) !== null) {
      if (--linesUntilYield <= 0) {
        await new Promise<void>(resolve => setTimeout(resolve, 0))
        linesUntilYield = CallgrindParser.YIELD_EVERY
      }

      if (/^\s*#/.exec(line)) {
        // Line is a comment. Ignore it.
        continue
      }

      if (/^\s*$/.exec(line)) {
        // Line is empty. Ignore it.
        continue
      }

      if (this.parseHeaderLine(line)) {
        continue
      }

      if (this.parseAssignmentLine(line)) {
        continue
      }

      if (this.parseCostLine(line, 'self')) {
        continue
      }

      throw new Error(`Unrecognized line "${line}" on line ${this.lineNum}`)
    }

    if (!this.callGraphs) {
      return null
    }
    return {
      name: this.importedFileName,
      indexToView: 0,
      profiles: this.callGraphs.map(cg => cg.toProfile()),
    }
  }

  private frameInfo(): FrameInfo {
    const file = this.filename || '(unknown)'
    const name = this.functionName || '(unknown)'
    const key = `${file}:${name}`
    return {key, name, file}
  }

  private calleeFrameInfo(): FrameInfo {
    const file = this.calleeFilename || this.filename || '(unknown)'
    const name = this.calleeFunctionName || '(unknown)'
    const key = `${file}:${name}`
    return {key, name, file}
  }

  private parseHeaderLine(line: string): boolean {
    const headerMatch = /^\s*(\w+):\s*(.*)+$/.exec(line)
    if (!headerMatch) return false

    if (headerMatch[1] === 'positions') {
      // "positions:" declares how many position columns appear before the cost
      // values on each cost line. Each token is a position type: "line" or "instr".
      // e.g. "positions: line"       => 1 position field  (default)
      //      "positions: instr line" => 2 position fields
      //      "positions: instr"      => 1 position field
      this.numPositionFields = headerMatch[2].trim().split(/\s+/).length
      return true
    }

    if (headerMatch[1] !== 'events') {
      // We don't care about other headers. Ignore this line.
      return true
    }

    // Line specifies the formatting of subsequent cost lines.
    const fields = headerMatch[2].split(' ')

    if (this.callGraphs != null) {
      throw new Error(
        `Duplicate "events: " lines specified. First was "${this.eventsLine}", now received "${line}" on ${this.lineNum}.`,
      )
    }

    this.callGraphs = fields.map(fieldName => {
      return new CallGraph(this.importedFileName, fieldName)
    })

    return true
  }

  private parseAssignmentLine(line: string): boolean {
    const assignmentMatch = /^(\w+)=\s*(.*)$/.exec(line)
    if (!assignmentMatch) return false

    const key = assignmentMatch[1]
    const value = assignmentMatch[2]

    switch (key) {
      case 'fe':
      case 'fi': {
        // fe/fi are used to indicate the source-file of a function definition
        // changed mid-definition. This is for inlined code, but doesn't
        // indicate that we've actually switched to referring to a different
        // function, so we mostly ignore it.
        //
        // We still need to do the parseNameWithCompression call in case a name
        // is defined and then referenced later on for name compression.
        this.parseNameWithCompression(value, this.savedFileNames)
        break
      }

      case 'fl': {
        this.filename = this.parseNameWithCompression(value, this.savedFileNames)
        break
      }

      case 'fn': {
        this.functionName = this.parseNameWithCompression(value, this.savedFunctionNames)
        break
      }

      case 'cfi':
      case 'cfl': {
        // NOTE: unlike the fe/fi distinction described above, cfi and cfl are
        // interchangeable.
        this.calleeFilename = this.parseNameWithCompression(value, this.savedFileNames)
        break
      }

      case 'cfn': {
        this.calleeFunctionName = this.parseNameWithCompression(value, this.savedFunctionNames)
        break
      }

      case 'calls': {
        // TODO(jlfwong): This is currently ignoring the number of calls being
        // made. Accounting for the number of calls might be unhelpful anyway,
        // since it'll just be copying the exact same frame over-and-over again,
        // but that might be better than ignoring it.
        const callsLine = this.consumeLine()
        if (callsLine !== null) this.parseCostLine(callsLine, 'child')

        // This isn't specified anywhere in the spec, but empirically the and
        // "cfn" scope should only persist for a single "call".
        //
        // This seems to be what KCacheGrind does too:
        //
        // https://github.com/KDE/kcachegrind/blob/ea4314db2785cb8f279fe884ee7f82445642b692/libcore/cachegrindloader.cpp#L1259
        this.calleeFilename = null
        this.calleeFunctionName = null
        break
      }

      case 'cob':
      case 'ob': {
        // We ignore these for now. They're valid lines, but we don't capture or
        // display information about them.
        break
      }

      case 'jcnd':
      case 'jump': {
        // Jumps aren't modeled; consume the following cost line to stay in sync.
        this.consumeLine()
        break
      }

      case 'jfi':
      case 'jfl': {
        // Jump target file — analogous to cfi/cfl but for jumps.
        // We ignore jump targets, but still parse the name for compression table.
        this.parseNameWithCompression(value, this.savedFileNames)
        break
      }

      case 'jfn': {
        // Jump target function — analogous to cfn but for jumps. Ignored.
        this.parseNameWithCompression(value, this.savedFunctionNames)
        break
      }

      default: {
        console.log(`Ignoring assignment to unrecognized key "${line}" on line ${this.lineNum}`)
      }
    }

    return true
  }

  private parseNameWithCompression(name: string, saved: {[id: string]: string}): string {
    {
      const nameDefinitionMatch = /^\((\d+)\)\s*(.+)$/.exec(name)

      if (nameDefinitionMatch) {
        const id = nameDefinitionMatch[1]
        const name = nameDefinitionMatch[2]
        if (id in saved) {
          throw new Error(
            `Redefinition of name with id: ${id}. Original value was "${saved[id]}". Tried to redefine as "${name}" on line ${this.lineNum}.`,
          )
        }

        saved[id] = name
        return name
      }
    }

    {
      const nameUseMatch = /^\((\d+)\)$/.exec(name)
      if (nameUseMatch) {
        const id = nameUseMatch[1]
        if (!(id in saved)) {
          throw new Error(
            `Tried to use name with id ${id} on line ${this.lineNum} before it was defined.`,
          )
        }
        return saved[id]
      }
    }

    return name
  }

  private prevCostLineNumbers: number[] = []

  private parseCostLine(line: string, costType: 'self' | 'child'): boolean {
    // trimEnd() strips trailing whitespace before splitting. Without this,
    // callgrind lines with trailing spaces produce a spurious empty token
    // in the split result (e.g. "* * " -> ["*","*",""]), causing valid
    // subposition-compressed cost lines to be incorrectly rejected.
    const parts = line.replace(/\s+$/, '').split(/\s+/)
    const nums: number[] = []

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      if (part.length === 0) {
        return false
      }

      if (part === '*' || part[0] === '-' || part[0] === '+') {
        // This handles "Subposition compression"
        // See: https://valgrind.org/docs/manual/cl-format.html#cl-format.overview.compression2
        if (this.prevCostLineNumbers.length <= i) {
          throw new Error(
            `Line ${this.lineNum} has a subposition on column ${i} but ` +
              `previous cost line has only ${this.prevCostLineNumbers.length} ` +
              `columns. Line contents: ${line}`,
          )
        }
        const prevCostForSubposition = this.prevCostLineNumbers[i]
        if (part === '*') {
          nums.push(prevCostForSubposition)
        } else {
          // This handles both the '-' and '+' cases
          const offset = parseInt(part)
          if (isNaN(offset)) {
            throw new Error(
              `Line ${this.lineNum} has a subposition on column ${i} but ` +
                `the offset is not a number. Line contents: ${line}`,
            )
          }
          nums.push(prevCostForSubposition + offset)
        }
      } else if (/^0x[0-9a-fA-F]+$/.test(part)) {
        // Hexadecimal instruction address used as a position field.
        // Parse it so subposition compression works on subsequent lines,
        // but the value itself is only used as a position (not a cost).
        nums.push(parseInt(part, 16))
      } else {
        const asNum = parseInt(part, 10)
        if (isNaN(asNum)) {
          return false
        }
        nums.push(asNum)
      }
    }

    if (nums.length == 0) {
      return false
    }

    const numPositionFields = this.numPositionFields

    // NOTE: We intentionally do not include the line number here because
    // callgrind uses the line number of the function invocation, not the
    // line number of the function definition, which conflicts with how
    // speedscope uses line numbers.
    //
    // const lineNum = nums[0]

    if (!this.callGraphs) {
      throw new Error(
        `Encountered a cost line on line ${this.lineNum} before event specification was provided.`,
      )
    }
    for (let i = 0; i < this.callGraphs.length; i++) {
      if (costType === 'self') {
        this.callGraphs[i].addSelfWeight(this.frameInfo(), nums[numPositionFields + i])
      } else if (costType === 'child') {
        this.callGraphs[i].addChildWithTotalWeight(
          this.frameInfo(),
          this.calleeFrameInfo(),
          nums[numPositionFields + i] || 0,
        )
      }
    }

    this.prevCostLineNumbers = nums
    return true
  }
}

export function importFromCallgrind(
  contents: TextFileContent,
  importedFileName: string,
): Promise<ProfileGroup | null> {
  return new CallgrindParser(contents, importedFileName).parse()
}
