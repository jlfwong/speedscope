// https://www.valgrind.org/docs/manual/cl-format.html
//
// Larger example files can be found by searching on github:
// https://github.com/search?q=cfn%3D&type=code

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

    // TODO(jlfwong): remove this
    console.log(`fl=${filename} fn=${functionName} cost line=${nums.join(',')}`)

    return true
  }

  return null
}
