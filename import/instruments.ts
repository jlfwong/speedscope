// This file contains methods to import data from OS X Instruments.app
// https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/index.html

import {Profile, FrameInfo, ByteFormatter, TimeFormatter} from '../profile'

function parseTSV<T>(contents: string): T[] {
  const lines = contents.split('\n').map(l => l.split('\t'))

  const headerLine = lines.shift()
  if (!headerLine) return []

  const indexToField = new Map<number, string>()
  for (let i = 0; i < headerLine.length; i++) {
    indexToField.set(i, headerLine[i])
  }

  const ret: T[] = []
  for (let line of lines) {
    const row = {} as T
    for (let i = 0; i < line.length; i++) {
      ;(row as any)[indexToField.get(i)!] = line[i]
    }
    ret.push(row)
  }
  return ret
}

interface PastedTimeProfileRow {
  Weight?: string
  'Source Path'?: string
  'Symbol Name'?: string
}

interface PastedAllocationsProfileRow {
  'Bytes Used'?: string
  'Source Path'?: string
  'Symbol Name'?: string
}

interface FrameInfoWithWeight extends FrameInfo {
  endValue: number
}

function getWeight(deepCopyRow: any): number {
  if ('Bytes Used' in deepCopyRow) {
    const bytesUsedString = deepCopyRow['Bytes Used']
    const parts = /\s*(\d+(?:[.]\d+)?) (\w+)\s+(?:\d+(?:[.]\d+))%/.exec(bytesUsedString)
    if (!parts) return 0
    const value = parseInt(parts[1], 10)
    const units = parts[2]

    switch (units) {
      case 'Bytes':
        return value
      case 'KB':
        return 1024 * value
      case 'MB':
        return 1024 * 1024 * value
      case 'GB':
        return 1024 * 1024 * 1024 * value
    }
    throw new Error(`Unrecognized units ${units}`)
  }

  if ('Weight' in deepCopyRow) {
    const weightString = deepCopyRow['Weight']
    const parts = /\s*(\d+(?:[.]\d+)?) (\w+)\s+(?:\d+(?:[.]\d+))%/.exec(weightString)
    if (!parts) return 0
    const value = parseInt(parts[1], 10)
    const units = parts[2]

    switch (units) {
      case 'ms':
        return value
      case 's':
        return 1000 * value
      case 'min':
        return 1000 * value
    }
    throw new Error(`Unrecognized units ${units}`)
  }

  return -1
}

// Import from a deep copy made of a profile
export function importFromInstrumentsDeepCopy(contents: string): Profile {
  const profile = new Profile()
  const rows = parseTSV<PastedTimeProfileRow | PastedAllocationsProfileRow>(contents)

  const stack: FrameInfoWithWeight[] = []
  let cumulativeValue: number = 0

  for (let row of rows) {
    const symbolName = row['Symbol Name']
    if (!symbolName) continue
    const trimmedSymbolName = symbolName.trim()
    let stackDepth = symbolName.length - trimmedSymbolName.length

    if (stack.length - stackDepth < 0) {
      console.log(stack, symbolName)
      throw new Error('Invalid format')
    }

    let framesToLeave: FrameInfoWithWeight[] = []

    while (stackDepth < stack.length) {
      const stackTop = stack.pop()!
      framesToLeave.push(stackTop)
    }

    for (let frameToLeave of framesToLeave) {
      cumulativeValue = Math.max(cumulativeValue, frameToLeave.endValue)
      profile.leaveFrame(frameToLeave, cumulativeValue)
    }

    const newFrameInfo: FrameInfoWithWeight = {
      key: `${row['Source Path'] || ''}:${trimmedSymbolName}`,
      name: trimmedSymbolName,
      file: row['Source Path'],
      endValue: cumulativeValue + getWeight(row),
    }

    profile.enterFrame(newFrameInfo, cumulativeValue)
    stack.push(newFrameInfo)
  }

  while (stack.length > 0) {
    const frameToLeave = stack.pop()!
    cumulativeValue = Math.max(cumulativeValue, frameToLeave.endValue)
    profile.leaveFrame(frameToLeave, cumulativeValue)
  }

  if ('Bytes Used' in rows[0]) {
    profile.setValueFormatter(new ByteFormatter())
  } else if ('Weight' in rows[0]) {
    profile.setValueFormatter(new TimeFormatter('milliseconds'))
  }

  return profile
}
