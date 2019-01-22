import {sortBy, zeroPad} from '../lib/utils'
import {ProfileGroup, CallTreeProfileBuilder} from '../lib/profile'
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
  dur: number
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
        ret.push({...ev, ph: 'B'} as BTraceEvent)
        ret.push({...ev, ph: 'E', ts: ev.ts + ev.dur} as ETraceEvent)
        break

      default:
        const _exhaustiveCheck: never = ev
        return _exhaustiveCheck
    }
  }
  return ret
}

function eventListToProfileGroup(events: TraceEvent[]): ProfileGroup {
  const profileByPidTid = new Map<string, CallTreeProfileBuilder>()

  const importableEvents = filterIgnoredEventTypes(events)
  const durationEvents = convertToDurationEvents(importableEvents)
  sortBy(durationEvents, ev => ev.ts)

  function getOrCreateProfile(pid: number, tid: number) {
    // We zero-pad the PID and TID to make sorting them by pid/tid pair later easier.
    const pidTid = `${zeroPad('' + pid, 10)}:${zeroPad('' + tid, 10)}`

    let profile = profileByPidTid.get(pidTid)
    if (profile != null) return profile
    profile = new CallTreeProfileBuilder()
    profile.setValueFormatter(new TimeFormatter('microseconds'))
    profileByPidTid.set(pidTid, profile)
    profile.setName(`pid: ${pid}, tid: ${tid}`)
    return profile
  }

  for (let ev of durationEvents) {
    const profile = getOrCreateProfile(ev.pid, ev.tid)
    let name = `${ev.name || '(unnamed)'}`
    if (ev.args) {
      name += ` ${JSON.stringify(ev.args)}`
    }

    switch (ev.ph) {
      case 'B':
        profile.enterFrame(
          {
            key: name,
            name: name,
          },
          ev.ts,
        )
        break

      case 'E':
        profile.leaveFrame(
          {
            key: name,
            name: name,
          },
          ev.ts,
        )
        break

      default:
        const _exhaustiveCheck: never = ev
        return _exhaustiveCheck
    }
  }

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
    if (!('ph' in el) || !('ts' in el)) return false
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
  // We're only going to suppor the JSON formatted profiles for now.
  // The spec also discusses support for data embedded in ftrace supported data: https://lwn.net/Articles/365835/.

  // TODO(jlfwong): The spec also specifies that it's valid for the trace to not contain a terminating `]`.
  // That complicates things a bit for us, so let's just ignore that for now until someone writes in with a
  // bug report from real data.

  return isTraceEventObject(rawProfile) || isTraceEventList(rawProfile)
}

export function importTrace(rawProfile: {traceEvents: TraceEvent[]} | TraceEvent[]): ProfileGroup {
  if (isTraceEventObject(rawProfile)) {
    return eventListToProfileGroup(rawProfile.traceEvents)
  } else if (isTraceEventList(rawProfile)) {
    return eventListToProfileGroup(rawProfile)
  } else {
    const _exhaustiveCheck: never = rawProfile
    return _exhaustiveCheck
  }
}
