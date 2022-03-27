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

  constructor(private fileName: string, private fieldName: string) {}

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
    // To convert a call graph into a profile, we first need to identify what
    // the "root weights" are. "root weights" are the total weight of each frame
    // while at the bottom of the call-stack. The majority of functions will have
    // zero weight while at the bottom of the call-stack, since most functions
    // are never at the bottom of the call-stack.
    const rootWeights = new Map<Frame, number>()
    for (let [frame, totalWeight] of this.totalWeights) {
      rootWeights.set(frame, totalWeight)
    }
    for (let [_, childMap] of this.childrenTotalWeights) {
      for (let [child, weight] of childMap) {
        rootWeights.set(child, getOrElse(rootWeights, child, () => weight) - weight)
      }
    }

    let totalProfileWeight = 0
    for (let [_, rootWeight] of rootWeights) {
      totalProfileWeight += rootWeight
    }

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

    const visit = (frame: Frame, callTreeWeight: number) => {
      if (currentStack.has(frame)) {
        // Call-graphs are allowed to have cycles. Call-trees are not. In case
        // we run into a cycle, we'll just avoid recursing into the same subtree
        // more than once in a call stack. The result will be that the time
        // spent in the recursive call will instead be attributed as self time
        // in the parent.
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

      if (callTreeWeight < 1e-4 * totalProfileWeight) {
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
        // whose weights are less than 0.01% of the total weight of the profile.
        return
      }

      // totalWeightForFrame is the total weight for the given frame in the
      // entire call graph.
      const callGraphWeightForFrame = getOrElse(this.totalWeights, frame, () => 0)
      if (callGraphWeightForFrame === 0) {
        return
      }

      // This is the portion of the total time the given child spends within the
      // given parent that we'll attribute to this specific path in the call
      // tree.
      const ratio = callTreeWeight / callGraphWeightForFrame

      let selfWeightForFrame = callGraphWeightForFrame

      profile.enterFrame(frame, totalCumulative * unitMultiplier)

      currentStack.add(frame)
      for (let [child, callGraphEdgeWeight] of this.childrenTotalWeights.get(frame) || []) {
        selfWeightForFrame -= callGraphEdgeWeight
        const childCallTreeWeight = callGraphEdgeWeight * ratio
        visit(child, childCallTreeWeight)
      }
      currentStack.delete(frame)

      totalCumulative += selfWeightForFrame * ratio
      profile.leaveFrame(frame, totalCumulative * unitMultiplier)
    }

    for (let [rootFrame, rootWeight] of rootWeights) {
      if (rootWeight <= 0) {
        continue
      }
      // If we've reached here, it means that the given root frame has some
      // weight while at the top of the call-stack.
      visit(rootFrame, rootWeight)
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
  private lines: string[]
  private lineNum: number

  private callGraphs: CallGraph[] | null = null
  private eventsLine: string | null = null

  private filename: string | null = null
  private functionName: string | null = null
  private calleeFilename: string | null = null
  private calleeFunctionName: string | null = null

  private savedFileNames: {[id: string]: string} = {}
  private savedFunctionNames: {[id: string]: string} = {}

  constructor(contents: TextFileContent, private importedFileName: string) {
    this.lines = contents.splitLines()
    this.lineNum = 0
  }

  parse(): ProfileGroup | null {
    while (this.lineNum < this.lines.length) {
      const line = this.lines[this.lineNum++]

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
    const file = this.calleeFilename || '(unknown)'
    const name = this.calleeFunctionName || '(unknown)'
    const key = `${file}:${name}`
    return {key, name, file}
  }

  private parseHeaderLine(line: string): boolean {
    const headerMatch = /^\s*(\w+):\s*(.*)+$/.exec(line)
    if (!headerMatch) return false

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
      case 'fi':
      case 'fl': {
        this.filename = this.parseNameWithCompression(value, this.savedFileNames)
        this.calleeFilename = this.filename
        break
      }

      case 'fn': {
        this.functionName = this.parseNameWithCompression(value, this.savedFunctionNames)
        break
      }

      case 'cfi':
      case 'cfl': {
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
        this.parseCostLine(this.lines[this.lineNum++], 'child')
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

  private parseCostLine(line: string, costType: 'self' | 'child'): boolean {
    // TODO(jlfwong): Handle "Subposition compression"
    // TODO(jlfwong): Allow hexadecimal encoding

    const parts = line.split(/\s+/)
    const nums: number[] = []
    for (let part of parts) {
      // As far as I can tell from the specification, the callgrind format does
      // not accept floating point numbers.
      const asNum = parseInt(part)
      if (isNaN(asNum)) {
        return false
      }

      nums.push(asNum)
    }

    if (nums.length == 0) {
      return false
    }

    // TODO(jlfwong): Handle custom positions format w/ multiple parts
    const numPositionFields = 1

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

    return true
  }
}

export function importFromCallgrind(
  contents: TextFileContent,
  importedFileName: string,
): ProfileGroup | null {
  return new CallgrindParser(contents, importedFileName).parse()
}
