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

interface BaseTraceEvent {
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

interface BTraceEvent extends BaseTraceEvent {
  ph: 'B'
}

interface ETraceEvent extends BaseTraceEvent {
  ph: 'E'
}

interface XTraceEvent extends BaseTraceEvent {
  ph: 'X'
  dur: number
}

// NOTE: This type union is a bit of a lie because there are other 'ph' values that exist but we ignore.
type TraceEvent = BTraceEvent | ETraceEvent | XTraceEvent

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

export function isTraceEventFormatted(rawProfile: any): boolean {
  // We're only going to suppor the JSON formatted profiles for now.
  // The spec also discusses support for data embedded in ftrace supported data: https://lwn.net/Articles/365835/.

  // TODO(jlfwong): The spec also specifies that it's valid for the trace to not contain a terminating `]`.
  // That complicates things a bit for us, so let's just ignore that for now until someone writes in with a
  // bug report from real data.

  return isTraceEventObject(rawProfile) || isTraceEventList(rawProfile)
}
