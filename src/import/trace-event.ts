import {sortBy, zeroPad, getOrInsert, lastOf} from '../lib/utils'
import {
  ProfileGroup,
  CallTreeProfileBuilder,
  FrameInfo,
  Profile,
  StackListProfileBuilder,
} from '../lib/profile'
import {TimeFormatter} from '../lib/value-formatters'

// This file concerns import from the "Trace Event Format", authored by Google
// and used for Google's own chrome://trace.
//
// The file format is extremely general, and we only support the parts of it
// that logically map onto speedscope's visualization capabilities.
// Specifically, we only support the "B", "E", and "X" event types. Everything
// else is ignored. We do, however, support import of profiles that are
// multi-process/multi-threaded. Each process is split into a separate profile.
//
// Note that Chrome Developer Tools uses this format as well, but all the
// relevant data used in those profiles is stored in events with the name
// "CpuProfile", "Profile", or "ProfileChunk". If we detect those, we prioritize
// importing the profile as a Chrome Developer Tools profile. Otherwise,
// we try to import it as a "Trace Event Format" file.
//
// Spec: https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview

interface TraceEvent {
  // The process ID for the process that output this event.
  pid: number

  // The thread ID for the thread that output this event.
  tid: number

  // The event type. This is a single character which changes depending on the type of event being output. The valid values are listed in the table below. We will discuss each phase type below.
  ph: string

  // The tracing clock timestamp of the event. The timestamps are provided at microsecond granularity.
  ts: number

  // The thread clock timestamp of the event. The timestamps are provided at microsecond granularity.
  tts?: number

  // The name of the event, as displayed in Trace Viewer
  name?: string

  // The event categories. This is a comma separated list of categories for the event. The categories can be used to hide events in the Trace Viewer UI.
  cat?: string

  // Any arguments provided for the event. Some of the event types have required argument fields, otherwise, you can put any information you wish in here. The arguments are displayed in Trace Viewer when you view an event in the analysis section.
  args?: any

  // A fixed color name to associate with the event. If provided, cname must be one of the names listed in trace-viewer's base color scheme's reserved color names list
  cname?: string
}

enum ExporterSource {
  HERMES = 'HERMES',
  UNKNOWN = 'UNKNOWN',
}

interface HermesTraceEventArgs {
  line: number | null
  column: number | null
  funcLine?: string | null
  funcColumn?: string | null
  name: string
  category: string
  parent?: number
  url: string | null
  params: string | null
  allocatedCategory: string
  allocatedName: string
}

const requiredHermesArguments: Array<keyof HermesTraceEventArgs> = [
  'line',
  'column',
  'name',
  'category',
  'url',
  'params',
  'allocatedCategory',
  'allocatedName',
]

type HermesTraceEvent = TraceEvent & {
  args: HermesTraceEventArgs
}

interface BTraceEvent extends TraceEvent {
  ph: 'B'
}

interface ETraceEvent extends TraceEvent {
  ph: 'E'
}

interface XTraceEvent extends TraceEvent {
  ph: 'X'
  dur?: number
  tdur?: number
}

// The trace format supports a number of event types that we ignore.
type ImportableTraceEvent = BTraceEvent | ETraceEvent | XTraceEvent

interface StackFrame {
  line: string
  column: string
  funcLine: string
  funcColumn: string
  name: string
  category: string
  // A parent function may or may not exist
  parent?: number
}

interface Sample {
  cpu: string
  name: string
  ts: string
  pid: number
  tid: string
  weight: string
  // Will refer to an element in the stackFrames object
  sf: number
  stackFrameData?: StackFrame
}

interface TraceWithSamples {
  traceEvents: TraceEvent[]
  samples: Sample[]
  stackFrames: {[key: string]: StackFrame}
}

interface TraceEventObject {
  traceEvents: TraceEvent[]
}

type Trace = TraceEvent[] | TraceEventObject | TraceWithSamples

function pidTidKey(pid: number, tid: number): string {
  // We zero-pad the PID and TID to make sorting them by pid/tid pair later easier.
  return `${zeroPad('' + pid, 10)}:${zeroPad('' + tid, 10)}`
}

function partitionByPidTid<T extends {tid: number | string; pid: number | string}>(
  events: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>()

  for (let ev of events) {
    const list = getOrInsert(map, pidTidKey(Number(ev.pid), Number(ev.tid)), () => [])
    list.push(ev)
  }

  return map
}

function selectQueueToTakeFromNext(
  bEventQueue: BTraceEvent[],
  eEventQueue: ETraceEvent[],
): 'B' | 'E' {
  if (bEventQueue.length === 0 && eEventQueue.length === 0) {
    throw new Error('This method should not be given both queues empty')
  }
  if (eEventQueue.length === 0) return 'B'
  if (bEventQueue.length === 0) return 'E'

  const bFront = bEventQueue[0]
  const eFront = eEventQueue[0]

  const bts = bFront.ts
  const ets = eFront.ts

  if (bts < ets) return 'B'
  if (ets < bts) return 'E'

  // If we got here, the 'B' event queue and the 'E' event queue have events at
  // the front with equal timestamps.

  // If the front of the 'E' queue matches the front of the 'B' queue by key,
  // then it means we have a zero duration event. Process the 'B' queue first
  // to ensure it opens before we try to close it.
  //
  // Otherwise, process the 'E' queue first.
  return keyForEvent(bFront) === keyForEvent(eFront) ? 'B' : 'E'
}

function convertToEventQueues(events: ImportableTraceEvent[]): [BTraceEvent[], ETraceEvent[]] {
  const beginEvents: BTraceEvent[] = []
  const endEvents: ETraceEvent[] = []

  // Rebase all of the timestamps on the lowest timestamp
  if (events.length > 0) {
    let firstTs = Number.MAX_SAFE_INTEGER
    for (let ev of events) {
      firstTs = Math.min(firstTs, ev.ts)
    }
    for (let ev of events) {
      ev.ts -= firstTs
    }
  }

  // Next, combine B, E, and X events into two timestamp ordered queues.
  const xEvents: XTraceEvent[] = []
  for (let ev of events) {
    switch (ev.ph) {
      case 'B': {
        beginEvents.push(ev)
        break
      }

      case 'E': {
        endEvents.push(ev)
        break
      }

      case 'X': {
        xEvents.push(ev)
        break
      }

      default: {
        const _exhaustiveCheck: never = ev
        return _exhaustiveCheck
      }
    }
  }

  function dur(x: XTraceEvent): number {
    return x.dur ?? x.tdur ?? 0
  }

  xEvents.sort((a, b) => {
    if (a.ts < b.ts) return -1
    if (a.ts > b.ts) return 1

    // Super weird special case: if we have two 'X' events with the same 'ts'
    // but different 'dur' the only valid interpretation is to put the one with
    // the longer 'dur' first, because you can't nest longer things in shorter
    // things.
    const aDur = dur(a)
    const bDur = dur(b)
    if (aDur > bDur) return -1
    if (aDur < bDur) return 1

    // Otherwise, retain the original order by relying upon a stable sort here.
    return 0
  })

  for (let x of xEvents) {
    const xDur = dur(x)
    beginEvents.push({...x, ph: 'B'} as BTraceEvent)
    endEvents.push({...x, ph: 'E', ts: x.ts + xDur} as ETraceEvent)
  }

  function compareTimestamps(a: TraceEvent, b: TraceEvent) {
    if (a.ts < b.ts) return -1
    if (a.ts > b.ts) return 1

    // Important: if the timestamps are the same, return zero. We're going to
    // rely upon a stable sort here.
    return 0
  }

  beginEvents.sort(compareTimestamps)
  endEvents.sort(compareTimestamps)

  return [beginEvents, endEvents]
}

function filterIgnoredEventTypes(events: TraceEvent[]): ImportableTraceEvent[] {
  const ret: ImportableTraceEvent[] = []
  for (let ev of events) {
    switch (ev.ph) {
      case 'B':
      case 'E':
      case 'X':
        ret.push(ev as ImportableTraceEvent)
    }
  }
  return ret
}

function getProcessNamesByPid(events: TraceEvent[]): Map<number, string> {
  const processNamesByPid = new Map<number, string>()
  for (let ev of events) {
    if (ev.ph === 'M' && ev.name === 'process_name' && ev.args && ev.args.name) {
      processNamesByPid.set(ev.pid, ev.args.name)
    }
  }
  return processNamesByPid
}

function getThreadNamesByPidTid(events: TraceEvent[]): Map<string, string> {
  const threadNameByPidTid = new Map<string, string>()

  for (let ev of events) {
    if (ev.ph === 'M' && ev.name === 'thread_name' && ev.args && ev.args.name) {
      threadNameByPidTid.set(pidTidKey(ev.pid, ev.tid), ev.args.name)
    }
  }
  return threadNameByPidTid
}

function getEventName(event: TraceEvent): string {
  return `${event.name || '(unnamed)'}`
}

function keyForEvent(event: TraceEvent): string {
  let key = getEventName(event)
  if (event.args) {
    key += ` ${JSON.stringify(event.args)}`
  }
  return key
}

function frameInfoForEvent(
  event: TraceEvent,
  exporterSource: ExporterSource = ExporterSource.UNKNOWN,
): FrameInfo {
  const key = keyForEvent(event)

  // In Hermes profiles we have additional guaranteed metadata we can use to
  // more accurately populate profiles with info such as line + col number
  if (exporterSource === ExporterSource.HERMES) {
    return {
      name: getEventName(event),
      key: key,
      file: event.args.url,
      line: event.args.line,
      col: event.args.column,
    }
  }

  return {
    name: key,
    key: key,
  }
}

/**
 * Constructs an array mapping pid-tid keys to profile builders. Both the traceEvent[]
 * format and the sample + stack frame based object format specify the process and thread
 * names based on metadata so we share this logic.
 *
 * See https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#heading=h.xqopa5m0e28f
 */
function getProfileNameByPidTid(
  events: TraceEvent[],
  partitionedTraceEvents: Map<string, TraceEvent[]>,
): Map<string, string> {
  const processNamesByPid = getProcessNamesByPid(events)
  const threadNamesByPidTid = getThreadNamesByPidTid(events)

  const profileNamesByPidTid = new Map<string, string>()

  partitionedTraceEvents.forEach(importableEvents => {
    if (importableEvents.length === 0) return

    const {pid, tid} = importableEvents[0]

    const profileKey = pidTidKey(pid, tid)
    const processName = processNamesByPid.get(pid)
    const threadName = threadNamesByPidTid.get(profileKey)

    if (processName != null && threadName != null) {
      profileNamesByPidTid.set(
        profileKey,
        `${processName} (pid ${pid}), ${threadName} (tid ${tid})`,
      )
    } else if (processName != null) {
      profileNamesByPidTid.set(profileKey, `${processName} (pid ${pid}, tid ${tid})`)
    } else if (threadName != null) {
      profileNamesByPidTid.set(profileKey, `${threadName} (pid ${pid}, tid ${tid})`)
    } else {
      profileNamesByPidTid.set(profileKey, `pid ${pid}, tid ${tid}`)
    }
  })

  return profileNamesByPidTid
}

function eventListToProfile(
  importableEvents: ImportableTraceEvent[],
  name: string,
  exporterSource: ExporterSource = ExporterSource.UNKNOWN,
): Profile {
  // The trace event format is hard to deal with because it specifically
  // allows events to be recorded out of order, *but* event ordering is still
  // important for events with the same timestamp. Because of this, rather
  // than thinking about the entire event stream as a single queue of events,
  // we're going to first construct two time-ordered lists of events:
  //
  // 1. ts ordered queue of 'B' events
  // 2. ts ordered queue of 'E' events
  //
  // We deal with 'X' events by converting them to one entry in the 'B' event
  // queue and one entry in the 'E' event queue.
  //
  // The high level goal is to deal with 'B' events in 'ts' order, breaking
  // ties by the order the events occurred in the file, and deal with 'E'
  // events in 'ts' order, breaking ties in whatever order causes the 'E'
  // events to match whatever is on the top of the stack.
  const [bEventQueue, eEventQueue] = convertToEventQueues(importableEvents)

  const profileBuilder = new CallTreeProfileBuilder()
  profileBuilder.setValueFormatter(new TimeFormatter('microseconds'))
  profileBuilder.setName(name)

  const frameStack: BTraceEvent[] = []
  const enterFrame = (b: BTraceEvent) => {
    frameStack.push(b)
    profileBuilder.enterFrame(frameInfoForEvent(b, exporterSource), b.ts)
  }

  const tryToLeaveFrame = (e: ETraceEvent) => {
    const b = lastOf(frameStack)

    if (b == null) {
      console.warn(
        `Tried to end frame "${
          frameInfoForEvent(e, exporterSource).key
        }", but the stack was empty. Doing nothing instead.`,
      )
      return
    }

    const eFrameInfo = frameInfoForEvent(e, exporterSource)
    const bFrameInfo = frameInfoForEvent(b, exporterSource)

    if (e.name !== b.name) {
      console.warn(
        `ts=${e.ts}: Tried to end "${eFrameInfo.key}" when "${bFrameInfo.key}" was on the top of the stack. Doing nothing instead.`,
      )
      return
    }

    if (eFrameInfo.key !== bFrameInfo.key) {
      console.warn(
        `ts=${e.ts}: Tried to end "${eFrameInfo.key}" when "${bFrameInfo.key}" was on the top of the stack. Ending ${bFrameInfo.key} instead.`,
      )
    }

    frameStack.pop()
    profileBuilder.leaveFrame(bFrameInfo, e.ts)
  }

  while (bEventQueue.length > 0 || eEventQueue.length > 0) {
    const queueName = selectQueueToTakeFromNext(bEventQueue, eEventQueue)
    switch (queueName) {
      case 'B': {
        enterFrame(bEventQueue.shift()!)
        break
      }
      case 'E': {
        // Before we take the first event in the 'E' queue, let's first see if
        // there are any e events that exactly match the top of the stack.
        // We'll prioritize first by key, then by name if we can't find a key
        // match.
        const stackTop = lastOf(frameStack)
        if (stackTop != null) {
          const bFrameInfo = frameInfoForEvent(stackTop, exporterSource)

          let swapped: boolean = false

          for (let i = 1; i < eEventQueue.length; i++) {
            const eEvent = eEventQueue[i]
            if (eEvent.ts > eEventQueue[0].ts) {
              // Only consider 'E' events with the same ts as the front of the queue.
              break
            }

            const eFrameInfo = frameInfoForEvent(eEvent, exporterSource)
            if (bFrameInfo.key === eFrameInfo.key) {
              // We have a match! Process this one first.
              const temp = eEventQueue[0]
              eEventQueue[0] = eEventQueue[i]
              eEventQueue[i] = temp
              swapped = true
              break
            }
          }

          if (!swapped) {
            // There was no key match, let's see if we can find a name match
            for (let i = 1; i < eEventQueue.length; i++) {
              const eEvent = eEventQueue[i]
              if (eEvent.ts > eEventQueue[0].ts) {
                // Only consider 'E' events with the same ts as the front of the queue.
                break
              }

              if (eEvent.name === stackTop.name) {
                // We have a match! Process this one first.
                const temp = eEventQueue[0]
                eEventQueue[0] = eEventQueue[i]
                eEventQueue[i] = temp
                swapped = true
                break
              }
            }
          }

          // If swapped is still false at this point, it means we're about to
          // pop a stack frame that doesn't even match by name. Bummer.
        }

        const e = eEventQueue.shift()!

        tryToLeaveFrame(e)
        break
      }

      default:
        const _exhaustiveCheck: never = queueName
        return _exhaustiveCheck
    }
  }

  for (let i = frameStack.length - 1; i >= 0; i--) {
    const frame = frameInfoForEvent(frameStack[i], exporterSource)
    console.warn(`Frame "${frame.key}" was still open at end of profile. Closing automatically.`)
    profileBuilder.leaveFrame(frame, profileBuilder.getTotalWeight())
  }

  return profileBuilder.build()
}

/**
 * Returns an array containing the time difference in microseconds between the current
 * sample and the next sample
 */
function getTimeDeltasForSamples(samples: Sample[]): number[] {
  const timeDeltas: number[] = []
  let lastTimeStamp = Number(samples[0].ts)

  samples.forEach((sample: Sample, idx: number) => {
    if (idx === 0) return

    const timeDiff = Number(sample.ts) - lastTimeStamp
    lastTimeStamp = Number(sample.ts)
    timeDeltas.push(timeDiff)
  })

  timeDeltas.push(0)

  return timeDeltas
}

/**
 * The chrome json trace event spec only specifies name and category
 * as required stack frame properties
 *
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#heading=h.b4y98p32171
 */
function frameInfoForSampleFrame({name, category}: StackFrame): FrameInfo {
  return {
    key: `${name}:${category}`,
    name: name,
  }
}

function getActiveFramesForSample(
  stackFrames: {[key: string]: StackFrame},
  frameId: number,
): FrameInfo[] {
  const frames = []
  let parent: number | undefined = frameId

  while (parent) {
    const frame: StackFrame = stackFrames[parent]

    if (!frame) {
      throw new Error(`Could not find frame for id ${parent}`)
    }

    frames.push(frameInfoForSampleFrame(frame))
    parent = frame.parent
  }

  return frames.reverse()
}

function sampleListToProfile(contents: TraceWithSamples, samples: Sample[], name: string): Profile {
  const profileBuilder = new StackListProfileBuilder()

  profileBuilder.setValueFormatter(new TimeFormatter('microseconds'))
  profileBuilder.setName(name)

  const timeDeltas = getTimeDeltasForSamples(samples)

  samples.forEach((sample, index) => {
    const timeDelta = timeDeltas[index]
    const activeFrames = getActiveFramesForSample(contents.stackFrames, sample.sf)

    profileBuilder.appendSampleWithWeight(activeFrames, timeDelta)
  })

  return profileBuilder.build()
}

function eventListToProfileGroup(
  events: TraceEvent[],
  exporterSource: ExporterSource = ExporterSource.UNKNOWN,
): ProfileGroup {
  const importableEvents = filterIgnoredEventTypes(events)
  const partitionedTraceEvents = partitionByPidTid(importableEvents)
  const profileNamesByPidTid = getProfileNameByPidTid(events, partitionedTraceEvents)

  const profilePairs: [string, Profile][] = []

  profileNamesByPidTid.forEach((name, profileKey) => {
    const importableEventsForPidTid = partitionedTraceEvents.get(profileKey)

    if (!importableEventsForPidTid) {
      throw new Error(`Could not find events for key: ${importableEventsForPidTid}`)
    }

    profilePairs.push([
      profileKey,
      eventListToProfile(importableEventsForPidTid, name, exporterSource),
    ])
  })

  // For now, we just sort processes by pid & tid.
  // TODO: The standard specifies that metadata events with the name
  // "process_sort_index" and "thread_sort_index" can be used to influence the
  // order, but for simplicity we'll ignore that until someone complains :)
  sortBy(profilePairs, p => p[0])

  return {
    name: '',
    indexToView: 0,
    profiles: profilePairs.map(p => p[1]),
  }
}

function sampleListToProfileGroup(contents: TraceWithSamples): ProfileGroup {
  const importableEvents = filterIgnoredEventTypes(contents.traceEvents)
  const partitionedTraceEvents = partitionByPidTid(importableEvents)
  const partitionedSamples = partitionByPidTid(contents.samples)
  const profileNamesByPidTid = getProfileNameByPidTid(contents.traceEvents, partitionedTraceEvents)

  const profilePairs: [string, Profile][] = []

  profileNamesByPidTid.forEach((name, profileKey) => {
    const samplesForPidTid = partitionedSamples.get(profileKey)

    if (!samplesForPidTid) {
      throw new Error(`Could not find samples for key: ${samplesForPidTid}`)
    }

    if (samplesForPidTid.length === 0) {
      return
    }

    profilePairs.push([profileKey, sampleListToProfile(contents, samplesForPidTid, name)])
  })

  // For now, we just sort processes by pid & tid.
  // TODO: The standard specifies that metadata events with the name
  // "process_sort_index" and "thread_sort_index" can be used to influence the
  // order, but for simplicity we'll ignore that until someone complains :)
  sortBy(profilePairs, p => p[0])

  return {
    name: '',
    indexToView: 0,
    profiles: profilePairs.map(p => p[1]),
  }
}

function isTraceEventList(maybeEventList: any): maybeEventList is TraceEvent[] {
  if (!Array.isArray(maybeEventList)) return false
  if (maybeEventList.length === 0) return false

  // Both ph and ts should be provided for every event. In theory, many other
  // fields are mandatory, but without these fields, we won't usefully be able
  // to import the data, so we'll rely upon these.
  for (let el of maybeEventList) {
    if (!('ph' in el)) {
      return false
    }

    switch (el.ph) {
      case 'B':
      case 'E':
      case 'X':
        // All B, E, and X events must have a timestamp specified, otherwise we
        // won't be able to import correctly.
        if (!('ts' in el)) {
          return false
        }

      case 'M':
        // It's explicitly okay for "M" (metadata) events not to specify a "ts"
        // field, since usually there is no logical timestamp for them to have
        break
    }
  }

  return true
}

function isHermesTraceEvent(traceEventArgs: any): traceEventArgs is HermesTraceEventArgs {
  if (!traceEventArgs) {
    return false
  }

  return requiredHermesArguments.every(prop => prop in traceEventArgs)
}

function isHermesTraceEventList(maybeEventList: any): maybeEventList is HermesTraceEvent[] {
  if (!isTraceEventList(maybeEventList)) return false

  // We just check the first element to avoid iterating over all trace events,
  // and asumme that if the first one is formatted like a hermes profile then
  // all events will be
  return isHermesTraceEvent(maybeEventList[0].args)
}

function isTraceEventObject(maybeTraceEventObject: any): maybeTraceEventObject is TraceEventObject {
  if (!('traceEvents' in maybeTraceEventObject)) return false
  return isTraceEventList(maybeTraceEventObject['traceEvents'])
}

function isTraceEventWithSamples(
  maybeTraceEventObject: any,
): maybeTraceEventObject is TraceWithSamples {
  return (
    'traceEvents' in maybeTraceEventObject &&
    'stackFrames' in maybeTraceEventObject &&
    'samples' in maybeTraceEventObject &&
    isTraceEventList(maybeTraceEventObject['traceEvents'])
  )
}

export function isTraceEventFormatted(rawProfile: any): rawProfile is Trace {
  // We're only going to support the JSON formatted profiles for now.
  // The spec also discusses support for data embedded in ftrace supported data: https://lwn.net/Articles/365835/.

  return isTraceEventObject(rawProfile) || isTraceEventList(rawProfile)
}

export function importTraceEvents(rawProfile: Trace): ProfileGroup {
  if (isTraceEventWithSamples(rawProfile)) {
    return sampleListToProfileGroup(rawProfile)
  } else if (isTraceEventObject(rawProfile)) {
    return eventListToProfileGroup(rawProfile.traceEvents)
  } else if (isHermesTraceEventList(rawProfile)) {
    return eventListToProfileGroup(rawProfile, ExporterSource.HERMES)
  } else if (isTraceEventList(rawProfile)) {
    return eventListToProfileGroup(rawProfile)
  } else {
    const _exhaustiveCheck: never = rawProfile
    return _exhaustiveCheck
  }
}
