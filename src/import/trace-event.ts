import {sortBy, zeroPad, lastOf} from '../lib/utils'
import {ProfileGroup, CallTreeProfileBuilder, FrameInfo} from '../lib/profile'
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
type DurationEvent = {ev: BTraceEvent | ETraceEvent; sortIndex: number}

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

function convertToDurationEvents(events: ImportableTraceEvent[]): DurationEvent[] {
  const ret: DurationEvent[] = []
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]

    switch (ev.ph) {
      case 'B':
        ret.push({ev, sortIndex: i})
        break

      case 'E':
        ret.push({ev, sortIndex: i})
        break

      case 'X':
        let dur: number | null = null
        if (ev.dur != null) dur = ev.dur
        else if (ev.tdur != null) dur = ev.tdur

        if (dur == null) {
          console.warn('Found a complete event (X) with no duration. Skipping: ', ev)
          continue
        }

        // We convert 'X' events into 'B' & 'E' event pairs. We need to be careful
        // with how we handle pairs of 'X' events with exactly the same ts & dur.
        //
        // For example, consider the following two events:
        //
        //  { "pid": 0, "tid": 0, "ph": "X", "ts": 0, "dur": 10, "name": "A" },
        //  { "pid": 0, "tid": 0, "ph": "X", "ts": 0, "dur": 10, "name": "B" },
        //
        // The equivalent resulting event sequence we want is:
        //
        //  { "pid": 0, "tid": 0, "ph": "B", "ts": 0, "name": "A" },
        //  { "pid": 0, "tid": 0, "ph": "B", "ts": 0, "name": "B" },
        //  { "pid": 0, "tid": 0, "ph": "E", "ts": 10, "name": "B" },
        //  { "pid": 0, "tid": 0, "ph": "E", "ts": 10, "name": "A" },
        //
        // Note that this is *not* equivalent to the following:
        //
        //  { "pid": 0, "tid": 0, "ph": "B", "ts": 0, "name": "B" },
        //  { "pid": 0, "tid": 0, "ph": "B", "ts": 0, "name": "A" },
        //  { "pid": 0, "tid": 0, "ph": "E", "ts": 10, "name": "A" },
        //  { "pid": 0, "tid": 0, "ph": "E", "ts": 10, "name": "B" },
        //
        // To support this, we need to carefully manage the sort order of pairs of
        // 'B' events, and do so differently than how we manage the corresponding
        // 'E' events
        const eventB = {...ev, ph: 'B'} as BTraceEvent
        const eventE = {...ev, ph: 'E', ts: ev.ts + dur} as ETraceEvent
        ret.push({ev: eventB, sortIndex: i})
        ret.push({ev: eventE, sortIndex: -i})
        break

      default:
        const _exhaustiveCheck: never = ev
        return _exhaustiveCheck
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
      const key = `${ev.pid}:${ev.tid}`
      threadNameByPidTid.set(key, ev.args.name)
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

type TraceEventProfileState = {profile: CallTreeProfileBuilder; eventStack: BTraceEvent[]}

function eventListToProfileGroup(events: TraceEvent[]): ProfileGroup {
  const stateByPidTid = new Map<string, TraceEventProfileState>()

  const importableEvents = filterIgnoredEventTypes(events)
  const durationEvents = convertToDurationEvents(importableEvents)

  const processNamesByPid = getProcessNamesByPid(events)
  const threadNamesByPidTid = getThreadNamesByPidTid(events)

  durationEvents.sort((a, b) => {
    const aEv = a.ev
    const bEv = b.ev
    if (aEv.pid < bEv.pid) return -1
    if (aEv.pid > bEv.pid) return 1
    if (aEv.tid < bEv.tid) return -1
    if (aEv.tid > bEv.tid) return 1
    if (aEv.ts < bEv.ts) return -1
    if (aEv.ts > bEv.ts) return 1

    // We have to be careful with events that have the same timestamp
    // and the same pid/tid
    const aKey = keyForEvent(aEv)
    const bKey = keyForEvent(bEv)
    if (aKey === bKey) {
      // If the two elements have the same key, we need to process the begin
      // event before the end event. This will be a zero-duration event.
      if (aEv.ph === 'B' && bEv.ph === 'E') return -1
      if (aEv.ph === 'E' && bEv.ph === 'B') return 1
    } else {
      // If the two elements have *different* keys, we want to process
      // the end of an event before the beginning of the event to prevent
      // out-of-order push/pops from the call-stack.
      if (aEv.ph === 'B' && bEv.ph === 'E') return 1
      if (aEv.ph === 'E' && bEv.ph === 'B') return -1
    }

    if (a.sortIndex < b.sortIndex) return -1
    if (a.sortIndex > b.sortIndex) return 1
    return 0
  })

  if (durationEvents.length > 0) {
    let firstTs = Number.MAX_VALUE
    for (let {ev} of durationEvents) {
      firstTs = Math.min(firstTs, ev.ts)
    }
    for (let {ev} of durationEvents) {
      ev.ts -= firstTs
    }
  }

  function getOrCreateProfileState(pid: number, tid: number): TraceEventProfileState {
    // We zero-pad the PID and TID to make sorting them by pid/tid pair later easier.
    const pidTid = `${zeroPad('' + pid, 10)}:${zeroPad('' + tid, 10)}`

    let state = stateByPidTid.get(pidTid)
    if (state != null) return state
    let profile = new CallTreeProfileBuilder()
    state = {profile, eventStack: []}
    profile.setValueFormatter(new TimeFormatter('microseconds'))
    stateByPidTid.set(pidTid, state)

    const processName = processNamesByPid.get(pid)
    const threadName = threadNamesByPidTid.get(`${pid}:${tid}`)

    if (processName != null && threadName != null) {
      profile.setName(`${processName} (pid ${pid}), ${threadName} (tid ${tid})`)
    } else if (processName != null) {
      profile.setName(`${processName} (pid ${pid}, tid ${tid})`)
    } else if (threadName != null) {
      profile.setName(`${threadName} (pid ${pid}, tid ${tid})`)
    } else {
      profile.setName(`pid ${pid}, tid ${tid}`)
    }

    return state
  }

  for (let {ev} of durationEvents) {
    const {profile, eventStack} = getOrCreateProfileState(ev.pid, ev.tid)
    const frameInfo = frameInfoForEvent(ev)
    switch (ev.ph) {
      case 'B':
        eventStack.push(ev)
        profile.enterFrame(frameInfo, ev.ts)
        break

      case 'E':
        const topFrame = lastOf(eventStack)
        if (topFrame == null) {
          console.warn(
            `ts=${ev.ts}: Request to end "${frameInfo?.key}" when stack is empty. Doing nothing instead.`,
          )
          break
        }

        const topFrameInfo = frameInfoForEvent(topFrame)

        // We treat mismatched names & mismatched keys differently, because it's
        // unclear from the spec what to do when you receive an "E" event when
        // the corresponding "B" event is not at the top of the stack, and also
        // unclear whether "B" and "E" events should be matched just based on
        // "name", or should also includes all of "args".
        //
        // Based on
        // https://github.com/catapult-project/catapult/blob/7874beb5c5a18ed8ba1264fac8dc4e857be23e35/tracing/tracing/extras/importer/trace_event_importer.html#L531-L542,
        // it seems like chrome://tracing warns on mismatching names, but
        // doesn't warn on mismatching args.
        //
        // As a rough compromise, if the names mismatch, we assume this is
        // definitely a mistake, and discard the event. If the names match, but
        // the args mismatch, we assume the args aren't supposed to match, and
        // warn, but close the top-of-stack frame anyway.
        if (ev.name !== topFrame.name) {
          console.warn(
            `ts=${ev.ts}: Request to end "${frameInfo.key}" when "${topFrameInfo.key}" was on the top of the stack. Doing nothing instead.`,
          )
          break
        }

        if (frameInfo.key !== topFrameInfo.key) {
          console.warn(
            `ts=${ev.ts}: Request to end "${frameInfo.key}" when "${topFrameInfo.key}" was on the top of the stack. Ending "${topFrameInfo.key} instead.`,
          )
        }

        profile.leaveFrame(topFrameInfo, ev.ts)
        eventStack.pop()
        break

      default:
        const _exhaustiveCheck: never = ev
        return _exhaustiveCheck
    }
  }

  // For now, we just sort processes by pid & tid.
  // TODO: The standard specifies that metadata events with the name
  // "process_sort_index" and "thread_sort_index" can be used to influence the
  // order, but for simplicity we'll ignore that until someone complains :)
  const profilePairs = Array.from(stateByPidTid.entries())
  sortBy(profilePairs, p => p[0])

  return {
    name: '',
    indexToView: 0,
    profiles: profilePairs.map(p => {
      const {eventStack, profile} = p[1]
      if (eventStack.length > 0) {
        for (let i = eventStack.length - 1; i >= 0; i--) {
          const frame = frameInfoForEvent(eventStack[i])
          console.warn(
            `Frame "${frame.key}" was still open at end of profile. Closing automatically.`,
          )
          profile.leaveFrame(frame, profile.getTotalWeight())
        }
      }
      return profile.build()
    }),
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
