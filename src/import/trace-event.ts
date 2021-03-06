import {sortBy, zeroPad, getOrInsert, lastOf} from '../lib/utils'
import {ProfileGroup, CallTreeProfileBuilder, FrameInfo, Profile} from '../lib/profile'
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
  args: any

  // A fixed color name to associate with the event. If provided, cname must be one of the names listed in trace-viewer's base color scheme's reserved color names list
  cname?: string
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

function pidTidKey(pid: number, tid: number): string {
  // We zero-pad the PID and TID to make sorting them by pid/tid pair later easier.
  return `${zeroPad('' + pid, 10)}:${zeroPad('' + tid, 10)}`
}

function partitionByPidTid(events: ImportableTraceEvent[]): Map<string, ImportableTraceEvent[]> {
  const map = new Map<string, ImportableTraceEvent[]>()

  for (let ev of events) {
    const list = getOrInsert(map, pidTidKey(ev.pid, ev.tid), () => [])
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

  // If the front of the 'E' queue matches the front of the 'B' queue by name,
  // then it means we have a zero duration event. Process the 'B' queue first
  // to ensure it opens before we try to close it.
  //
  // Otherwise, process the 'E' queue first.
  return bFront.name === eFront.name ? 'B' : 'E'
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

function keyForEvent(event: TraceEvent): string {
  let name = `${event.name || '(unnamed)'}`
  if (event.args) {
    name += ` ${JSON.stringify(event.args)}`
  }
  return name
}

function frameInfoForEvent(event: TraceEvent): FrameInfo {
  const key = keyForEvent(event)
  return {
    name: key,
    key: key,
  }
}

function eventListToProfileGroup(events: TraceEvent[]): ProfileGroup {
  const importableEvents = filterIgnoredEventTypes(events)
  const partitioned = partitionByPidTid(importableEvents)

  const processNamesByPid = getProcessNamesByPid(events)
  const threadNamesByPidTid = getThreadNamesByPidTid(events)

  const profilePairs: [string, Profile][] = []

  partitioned.forEach(eventsForThread => {
    if (eventsForThread.length === 0) return

    const {pid, tid} = eventsForThread[0]

    const profile = new CallTreeProfileBuilder()
    profile.setValueFormatter(new TimeFormatter('microseconds'))

    const processName = processNamesByPid.get(pid)
    const threadName = threadNamesByPidTid.get(pidTidKey(pid, tid))

    if (processName != null && threadName != null) {
      profile.setName(`${processName} (pid ${pid}), ${threadName} (tid ${tid})`)
    } else if (processName != null) {
      profile.setName(`${processName} (pid ${pid}, tid ${tid})`)
    } else if (threadName != null) {
      profile.setName(`${threadName} (pid ${pid}, tid ${tid})`)
    } else {
      profile.setName(`pid ${pid}, tid ${tid}`)
    }

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
    const [bEventQueue, eEventQueue] = convertToEventQueues(eventsForThread)

    const frameStack: BTraceEvent[] = []
    const enterFrame = (b: BTraceEvent) => {
      frameStack.push(b)
      profile.enterFrame(frameInfoForEvent(b), b.ts)
    }

    const tryToLeaveFrame = (e: ETraceEvent) => {
      const b = lastOf(frameStack)

      if (b == null) {
        console.warn(
          `Tried to end frame "${
            frameInfoForEvent(e).key
          }", but the stack was empty. Doing nothing instead.`,
        )
        return
      }

      const eFrameInfo = frameInfoForEvent(e)
      const bFrameInfo = frameInfoForEvent(b)

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
      profile.leaveFrame(bFrameInfo, e.ts)
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
            const bFrameInfo = frameInfoForEvent(stackTop)

            let swapped: boolean = false

            for (let i = 1; i < eEventQueue.length; i++) {
              const eEvent = eEventQueue[i]
              if (eEvent.ts > eEventQueue[0].ts) {
                // Only consider 'E' events with the same ts as the front of the queue.
                break
              }

              const eFrameInfo = frameInfoForEvent(eEvent)
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
      const frame = frameInfoForEvent(frameStack[i])
      console.warn(`Frame "${frame.key}" was still open at end of profile. Closing automatically.`)
      profile.leaveFrame(frame, profile.getTotalWeight())
    }

    profilePairs.push([pidTidKey(pid, tid), profile.build()])
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

function isTraceEventObject(
  maybeTraceEventObject: any,
): maybeTraceEventObject is {traceEvents: TraceEvent[]} {
  if (!('traceEvents' in maybeTraceEventObject)) return false
  return isTraceEventList(maybeTraceEventObject['traceEvents'])
}

export function isTraceEventFormatted(
  rawProfile: any,
): rawProfile is {traceEvents: TraceEvent[]} | TraceEvent[] {
  // We're only going to support the JSON formatted profiles for now.
  // The spec also discusses support for data embedded in ftrace supported data: https://lwn.net/Articles/365835/.

  return isTraceEventObject(rawProfile) || isTraceEventList(rawProfile)
}

export function importTraceEvents(
  rawProfile: {traceEvents: TraceEvent[]} | TraceEvent[],
): ProfileGroup {
  if (isTraceEventObject(rawProfile)) {
    return eventListToProfileGroup(rawProfile.traceEvents)
  } else if (isTraceEventList(rawProfile)) {
    return eventListToProfileGroup(rawProfile)
  } else {
    const _exhaustiveCheck: never = rawProfile
    return _exhaustiveCheck
  }
}
