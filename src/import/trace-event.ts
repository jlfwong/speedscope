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

function isTraceEventList(maybeEventList: any): boolean {
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

export function isTraceEventFormatted(rawProfile: any): boolean {
  // We're only going to suppor the JSON formatted profiles for now.
  // The spec also discusses support for data embedded in ftrace supported data: https://lwn.net/Articles/365835/.

  // TODO(jlfwong): The spec also specifies that it's valid for the trace to not contain a terminating `]`.
  // That complicates things a bit for us, so let's just ignore that for now until someone writes in with a
  // bug report from real data.

  return (
    isTraceEventList(rawProfile) ||
    ('traceEvents' in rawProfile && isTraceEventList(rawProfile['traceEvents']))
  )
}
