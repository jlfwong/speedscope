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

import {CallTreeProfileBuilder, ProfileGroup} from '../lib/profile'

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
export function importFromCallgrind(contents: string): ProfileGroup | null {
  const lines = contents.split('\n')

  let profiles: CallTreeProfileBuilder[] | null = null
  let eventsLine: string | null = null

  let filename: string | null = null
  let functionName: string | null = null
  let calledFilename: string | null = null
  let calledFunctionName: string | null = null

  const savedFileNames: {[id: string]: string} = {}
  const savedFunctionNames: {[id: string]: string} = {}

  let lineNum = 0

  while (lineNum < lines.length) {
    const line = lines[lineNum++]

    if (/^\s*#/.exec(line)) {
      // Line is a comment. Ignore it.
      continue
    }

    if (/^\s*$/.exec(line)) {
      // Line is empty. Ignore it.
      continue
    }

    if (parseHeaderLine(line)) {
      continue
    }

    if (parseAssignmentLine(line)) {
      continue
    }

    if (parseCostLine(line)) {
      continue
    }

    throw new Error(`Unrecognized line "${line}" on line ${lineNum}`)
  }

  function parseHeaderLine(line: string): boolean {
    const headerMatch = /^\s*(\w+):\s*(.*)+$/.exec(line)
    if (!headerMatch) return false

    if (headerMatch[1] !== 'events') {
      // We don't care about other headers. Ignore this line.
      return true
    }

    // Line specifies the formatting of subsequent cost lines.
    const fields = headerMatch[2].split(' ')
    console.log('found fields', fields)

    if (profiles != null) {
      throw new Error(
        `Duplicate "events: " lines specified. First was "${eventsLine}", now received "${line}" on ${lineNum}.`,
      )
    }

    profiles = fields.map(f => {
      const profile = new CallTreeProfileBuilder()

      // TODO(jlfwong): Make this name also incldue the imported file name.
      profile.setName(f)

      return profile
    })

    return true
  }

  function parseAssignmentLine(line: string): boolean {
    const assignmentMatch = /^(\w+)=\s*(.*)$/.exec(line)
    if (!assignmentMatch) return false

    const key = assignmentMatch[1]
    const value = assignmentMatch[2]

    switch (key) {
      case 'fi':
      case 'fe':
      case 'fl': {
        filename = parseNameWithCompression(value, savedFileNames)
        break
      }

      case 'fn': {
        functionName = parseNameWithCompression(value, savedFunctionNames)
        break
      }

      case 'cfi':
      case 'cfl': {
        calledFilename = parseNameWithCompression(value, savedFileNames)
        break
      }

      case 'cfn': {
        calledFunctionName = parseNameWithCompression(value, savedFunctionNames)
        break
      }

      case 'calls': {
        // TODO(jlfwong): Implement this
        break
      }

      default: {
        console.log(`Ignoring assignment to unrecognized key "${key}"`)
      }
    }

    return true
  }

  function parseNameWithCompression(name: string, saved: {[id: string]: string}): string {
    {
      const nameDefinitionMatch = /^\((\d+)\)\s*(.+)$/.exec(name)

      if (nameDefinitionMatch) {
        const id = nameDefinitionMatch[1]
        const name = nameDefinitionMatch[2]
        if (id in saved) {
          throw new Error(
            `Redefinition of name with id: ${id}. Original value was "${saved[id]}". Tried to redefine as "${name}" on line ${lineNum}.`,
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
            `Tried to use name with id ${id} on line ${lineNum} before it was defined.`,
          )
        }
        return saved[id]
      }
    }

    return name
  }

  function parseCostLine(line: string): boolean {
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
    // TODO(jlfwong): remove this
    console.log(`fl=${filename} fn=${functionName} cost line=${nums.join(',')}`)

    // TODO(jlfwong): Handle custom positions format w/ multiple parts
    const line = nums[0]

    return true
  }

  return null
}
