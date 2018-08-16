import {StackListProfileBuilder, ProfileGroup} from '../lib/profile'
import {itMap, getOrInsert} from '../lib/utils'
import {TimeFormatter} from '../lib/value-formatters'

// This imports the output of the "perf script" command on linux.
//
// Reference: https://github.com/torvalds/linux/blob/0fbc4aea/tools/perf/builtin-script.c#L1622
// Reference: https://github.com/brendangregg/FlameGraph/blob/18c3dea/stackcollapse-perf.pl#L163

interface PerfStackFrame {
  address: string
  symbolName: string
  file: string
}

interface PerfEvent {
  command: string | null
  processID: number | null
  threadID: number | null
  time: number | null
  eventType: string
  stack: PerfStackFrame[]
}

function parseEvent(rawEvent: string): PerfEvent | null {
  const lines = rawEvent.split('\n').filter(l => !/^\s*#/.exec(l))

  const event: PerfEvent = {
    command: null,
    processID: null,
    threadID: null,
    time: null,
    eventType: '',
    stack: [],
  }

  const firstLine = lines.shift()
  if (!firstLine) return null

  // Note: command name may contain spaces, e.g.
  //
  //  V8 WorkerThread 25607 4794564.109216: cycles:
  const eventStartMatch = /^(\S.+?)\s+(\d+)(?:\/?(\d+))?\s+/.exec(firstLine)
  if (!eventStartMatch) return null

  event.command = eventStartMatch[1]

  // default "perf script" output has TID but not PID
  if (eventStartMatch[3]) {
    event.processID = parseInt(eventStartMatch[2], 10)
    event.threadID = parseInt(eventStartMatch[3], 10)
  } else {
    event.threadID = parseInt(eventStartMatch[2], 10)
  }

  const timeMatch = /\s+(\d+\.\d+):\s+/.exec(firstLine)
  if (timeMatch) {
    event.time = parseFloat(timeMatch[1])
  }

  const evName = /(\S+):\s*$/.exec(firstLine)
  if (evName) {
    event.eventType = evName[1]
  }

  for (let line of lines) {
    const lineMatch = /^\s*(\w+)\s*(.+) \((\S*)\)/.exec(line)
    if (!lineMatch) continue
    let [, address, symbolName, file] = lineMatch

    // Linux 4.8 included symbol offsets in perf script output by default, eg:
    // 7fffb84c9afc cpu_startup_entry+0x800047c022ec ([kernel.kallsyms])
    // strip these off:
    symbolName = symbolName.replace(/\+0x[\da-f]+$/, '')

    event.stack.push({address: `0x${address}`, symbolName, file})
  }
  event.stack.reverse()

  return event
}

export function importFromLinuxPerf(contents: string): ProfileGroup | null {
  const profiles = new Map<string, StackListProfileBuilder>()

  let eventType: string | null = null
  const events = contents.split('\n\n').map(parseEvent)

  for (let event of events) {
    if (event == null) continue
    if (eventType != null && eventType != event.eventType) continue
    if (event.time == null) continue
    eventType = event.eventType

    let profileNameParts = []
    if (event.command) profileNameParts.push(event.command)
    if (event.processID) profileNameParts.push(`pid: ${event.processID}`)
    if (event.threadID) profileNameParts.push(`tid: ${event.threadID}`)
    const profileName = profileNameParts.join(' ')
    const builderState = getOrInsert(profiles, profileName, () => {
      const builder = new StackListProfileBuilder()
      builder.setName(profileName)
      builder.setValueFormatter(new TimeFormatter('seconds'))
      return builder
    })

    const builder = builderState

    builder.appendSampleWithTimestamp(
      event.stack.map(({symbolName, file}) => {
        return {
          key: `${symbolName} (${file})`,
          name: symbolName === '[unknown]' ? `??? (${file})` : symbolName,
          file: file,
        }
      }),
      event.time!,
    )
  }

  if (profiles.size === 0) {
    return null
  }

  return {
    name: profiles.size === 1 ? Array.from(profiles.keys())[0] : '',
    indexToView: 0,
    profiles: Array.from(itMap(profiles.values(), builder => builder.build())),
  }
}
