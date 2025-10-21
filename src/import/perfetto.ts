import {perfetto} from './perfetto.proto.js'
import {FrameInfo, StackListProfileBuilder, Profile} from '../lib/profile'
import {TimeFormatter} from '../lib/value-formatters'

export function importFromPerfettoTrace(rawTrace: ArrayBuffer): Profile | null {
  if (rawTrace.byteLength === 0) return null

  let protoTrace: perfetto.protos.Trace
  try {
    protoTrace = perfetto.protos.Trace.decode(new Uint8Array(rawTrace))
  } catch (e) {
    console.warn('Failed to decode Perfetto trace:', e)
    return null
  }

  if (!protoTrace.packet || protoTrace.packet.length === 0) {
    return null
  }

  const profileBuilder = new StackListProfileBuilder()
  profileBuilder.setName('Perfetto Trace')
  profileBuilder.setValueFormatter(new TimeFormatter('microseconds'))

  // Maps for interned data
  const internedStrings = new Map<number, string>()
  const internedCallstacks = new Map<number, number[]>()
  const internedFrames = new Map<number, FrameInfo>()
  const internedFunctionNames = new Map<number, string>()
  const internedMappingPaths = new Map<number, string>()

  // Process packets in chronological order
  const sortedPackets = protoTrace.packet
    .filter(p => p.timestamp != null)
    .sort((a, b) => Number(a.timestamp!) - Number(b.timestamp!))

  // First pass: collect all interned data
  for (const packet of protoTrace.packet) {
    if (packet.internedData) {
      const data = packet.internedData

      // Process interned strings
      if (data.eventNames) {
        for (const item of data.eventNames) {
          if (item.iid != null && item.str != null) {
            internedStrings.set(Number(item.iid), item.str.toString())
          }
        }
      }

      if (data.eventCategories) {
        for (const item of data.eventCategories) {
          if (item.iid != null && item.str != null) {
            internedStrings.set(Number(item.iid), item.str.toString())
          }
        }
      }

      // Process function names
      if (data.functionNames) {
        for (const item of data.functionNames) {
          if (item.iid != null && item.str != null) {
            internedFunctionNames.set(Number(item.iid), item.str.toString())
          }
        }
      }

      // Process mapping paths
      if (data.mappingPaths) {
        for (const item of data.mappingPaths) {
          if (item.iid != null && item.str != null) {
            internedMappingPaths.set(Number(item.iid), item.str.toString())
          }
        }
      }

      // Process frames
      if (data.frames) {
        for (const frame of data.frames) {
          if (frame.iid != null) {
            const functionName =
              frame.functionNameId != null
                ? internedFunctionNames.get(Number(frame.functionNameId)) || '(unknown)'
                : '(unknown)'

            const mappingPath =
              frame.mappingId != null
                ? internedMappingPaths.get(Number(frame.mappingId))
                : undefined

            const frameInfo: FrameInfo = {
              key: `${functionName}:${mappingPath || ''}:${frame.relPc || 0}`,
              name: functionName,
            }

            if (mappingPath) {
              frameInfo.file = mappingPath
            }

            internedFrames.set(Number(frame.iid), frameInfo)
          }
        }
      }

      // Process callstacks
      if (data.callstacks) {
        for (const callstack of data.callstacks) {
          if (callstack.iid != null && callstack.frameIds) {
            internedCallstacks.set(
              Number(callstack.iid),
              callstack.frameIds.map(id => Number(id)),
            )
          }
        }
      }
    }
  }

  // Second pass: process sampling data
  for (const packet of sortedPackets) {
    if (packet.perfSample) {
      processPerfSample(
        packet.perfSample,
        packet.timestamp,
        internedCallstacks,
        internedFrames,
        profileBuilder,
      )
    } else if (packet.trackEvent) {
      processTrackEvent(packet.trackEvent, packet.timestamp, internedStrings, profileBuilder)
    } else if (packet.chromeEvents && packet.chromeEvents.events) {
      for (const event of packet.chromeEvents.events) {
        processChromeEvent(event, profileBuilder)
      }
    }
  }

  const profile = profileBuilder.build()

  if (profile.getTotalWeight() === 0) {
    // If we didn't get any samples, return null
    return null
  }

  return profile
}

function processPerfSample(
  perfSample: perfetto.protos.IPerfSample,
  timestamp: number | Long | null | undefined,
  internedCallstacks: Map<number, number[]>,
  internedFrames: Map<number, FrameInfo>,
  profileBuilder: StackListProfileBuilder,
) {
  if (!perfSample.callstackIid || perfSample.callstackIid.length === 0) {
    return
  }

  const weight = 1 // Each sample represents 1 unit of time

  for (const callstackId of perfSample.callstackIid) {
    const frameIds = internedCallstacks.get(Number(callstackId))
    if (!frameIds) continue

    const stack: FrameInfo[] = []
    for (const frameId of frameIds) {
      const frameInfo = internedFrames.get(frameId)
      if (frameInfo) {
        stack.push(frameInfo)
      }
    }

    if (stack.length > 0) {
      // Stack is typically in reverse order (leaf first), so reverse it
      profileBuilder.appendSampleWithWeight(stack.reverse(), weight)
    }
  }
}

function processTrackEvent(
  trackEvent: perfetto.protos.ITrackEvent,
  timestamp: number | Long | null | undefined,
  internedStrings: Map<number, string>,
  profileBuilder: StackListProfileBuilder,
) {
  // For now, we'll treat track events as simple call stacks
  // This is a simplified approach - more sophisticated handling would
  // track the begin/end events to build proper call trees

  if (!trackEvent.nameIid) return

  const eventName = internedStrings.get(Number(trackEvent.nameIid)) || '(unknown)'
  const categories = trackEvent.categoryIids
    ? trackEvent.categoryIids.map(id => internedStrings.get(Number(id)) || '').join(',')
    : ''

  const frameInfo: FrameInfo = {
    key: `${eventName}:${categories}`,
    name: categories ? `${eventName} [${categories}]` : eventName,
  }

  // Create a simple single-frame stack for the track event
  profileBuilder.appendSampleWithWeight([frameInfo], 1)
}

function processChromeEvent(
  chromeEvent: perfetto.protos.IChromeEvent,
  profileBuilder: StackListProfileBuilder,
) {
  if (!chromeEvent.name) return

  const name = chromeEvent.name
  const category = chromeEvent.category || 'unknown'

  const frameInfo: FrameInfo = {
    key: `${name}:${category}`,
    name: category ? `${name} [${category}]` : name,
  }

  // Duration in microseconds (Chrome events typically use microseconds)
  const weight = chromeEvent.duration ? Number(chromeEvent.duration) : 1

  profileBuilder.appendSampleWithWeight([frameInfo], weight)
}
