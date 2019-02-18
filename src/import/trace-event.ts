import {sortBy, zeroPad} from '../lib/utils'
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
type DurationEvent = BTraceEvent | ETraceEvent

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
  for (let ev of events) {
    switch (ev.ph) {
      case 'B':
        ret.push(ev)
        break

      case 'E':
        ret.push(ev)
        break

      case 'X':
        let dur: number | null = null
        if (ev.dur != null) dur = ev.dur
        else if (ev.tdur != null) dur = ev.tdur

        if (dur == null) {
          console.warn('Found a complete event (X) with no duration. Skipping: ', ev)
          continue
        }

        ret.push({...ev, ph: 'B'} as BTraceEvent)
        ret.push({...ev, ph: 'E', ts: ev.ts + dur} as ETraceEvent)
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

function eventListToProfileGroup(events: TraceEvent[]): ProfileGroup {
  const profileByPidTid = new Map<string, CallTreeProfileBuilder>()

  const importableEvents = filterIgnoredEventTypes(events)
  const durationEvents = convertToDurationEvents(importableEvents)

  const processNamesByPid = getProcessNamesByPid(events)
  const threadNamesByPidTid = getThreadNamesByPidTid(events)

  durationEvents.sort((a, b) => {
    if (a.ts < b.ts) return -1
    if (a.ts > b.ts) return 1

    // We have to be careful with events that have the same timestamp
    if (a.pid === b.pid && a.tid === b.tid) {
      const aKey = keyForEvent(a)
      const bKey = keyForEvent(b)

      if (aKey === bKey) {
        // If the two elements have the same key, we need to process the begin
        // event before the end event. This will be a zero-duration event.
        if (a.ph === 'B' && b.ph === 'E') return -1
        if (a.ph === 'E' && b.ph === 'B') return 1
      } else {
        // If the two elements have *different* keys, we want to process
        // the end of an event before the beginning of the event to prevent
        // out-of-order push/pops from the callstack.
        if (a.ph === 'B' && b.ph === 'E') return 1
        if (a.ph === 'E' && b.ph === 'B') return -1
      }
    }

    return -1
  })

  if (durationEvents.length > 0) {
    const firstTs = durationEvents[0].ts
    for (let ev of durationEvents) {
      ev.ts -= firstTs
    }
  }

  function getOrCreateProfile(pid: number, tid: number) {
    // We zero-pad the PID and TID to make sorting them by pid/tid pair later easier.
    const pidTid = `${zeroPad('' + pid, 10)}:${zeroPad('' + tid, 10)}`

    let profile = profileByPidTid.get(pidTid)
    if (profile != null) return profile
    profile = new CallTreeProfileBuilder()
    profile.setValueFormatter(new TimeFormatter('microseconds'))
    profileByPidTid.set(pidTid, profile)

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

    return profile
  }

  for (let ev of durationEvents) {
    const profile = getOrCreateProfile(ev.pid, ev.tid)
    const key = keyForEvent(ev)
    const frameInfo: FrameInfo = {
      key: key,
      name: key,
    }
    switch (ev.ph) {
      case 'B':
        profile.enterFrame(frameInfo, ev.ts)
        break

      case 'E':
        profile.leaveFrame(frameInfo, ev.ts)
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
  const profilePairs = Array.from(profileByPidTid.entries())
  sortBy(profilePairs, p => p[0])

  return {name: '', indexToView: 0, profiles: profilePairs.map(p => p[1])}
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
