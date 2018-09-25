import {perftools} from './profile.proto.js'
import {FrameInfo, StackListProfileBuilder, Profile} from '../lib/profile'
import {lastOf} from '../lib/utils'
import {TimeFormatter, ByteFormatter} from '../lib/value-formatters'

interface SampleType {
  type: string
  unit: string
}

export function importAsPprofProfile(rawProfile: ArrayBuffer): Profile | null {
  if (rawProfile.byteLength === 0) return null

  let protoProfile: perftools.profiles.Profile
  try {
    protoProfile = perftools.profiles.Profile.decode(new Uint8Array(rawProfile))
  } catch (e) {
    return null
  }

  function i32(n: number | Long): number {
    return typeof n === 'number' ? n : (n as Long).low
  }

  function stringVal(key: number | Long): string | null {
    return protoProfile.stringTable[i32(key)] || null
  }

  const frameInfoByFunctionID = new Map<number, FrameInfo>()

  function frameInfoForFunction(f: perftools.profiles.IFunction): FrameInfo | null {
    const {name, filename, startLine} = f

    const nameString = (name != null && stringVal(name)) || '(unknown)'
    const fileNameString = filename != null ? stringVal(filename) : null
    const line = startLine != null ? +startLine : null

    const key = `${nameString}:${fileNameString}:${line}`

    const frameInfo: FrameInfo = {
      key,
      name: nameString,
    }

    if (fileNameString != null) {
      frameInfo.file = fileNameString
    }

    if (line != null) {
      frameInfo.line = line
    }

    return frameInfo
  }

  for (let f of protoProfile.function) {
    if (f.id) {
      const frameInfo = frameInfoForFunction(f)
      if (frameInfo != null) {
        frameInfoByFunctionID.set(i32(f.id), frameInfo)
      }
    }
  }

  function frameInfoForLocation(location: perftools.profiles.ILocation): FrameInfo | null {
    const {line} = location
    if (line == null) return null

    // From a comment on profile.proto:
    //
    //   Multiple line indicates this location has inlined functions,
    //   where the last entry represents the caller into which the
    //   preceding entries were inlined.
    //
    //   E.g., if memcpy() is inlined into printf:
    //      line[0].function_name == "memcpy"
    //      line[1].function_name == "printf"
    //
    // Let's just take the last line then
    const lastLine = lastOf(line)
    if (lastLine == null) return null

    if (lastLine.functionId) {
      return frameInfoByFunctionID.get(i32(lastLine.functionId)) || null
    } else {
      return null
    }
  }

  const frameByLocationID = new Map<number, FrameInfo>()

  for (let l of protoProfile.location) {
    if (l.id != null) {
      const frameInfo = frameInfoForLocation(l)
      if (frameInfo) {
        frameByLocationID.set(i32(l.id), frameInfo)
      }
    }
  }

  const sampleTypes: SampleType[] = protoProfile.sampleType.map(type => ({
    type: (type.type && stringVal(type.type)) || 'samples',
    unit: (type.unit && stringVal(type.unit)) || 'count',
  }))

  const sampleTypeIndex = protoProfile.defaultSampleType
    ? +protoProfile.defaultSampleType
    : sampleTypes.length - 1
  const sampleType = sampleTypes[sampleTypeIndex]

  const profileBuilder = new StackListProfileBuilder()

  switch (sampleType.unit) {
    case 'nanoseconds':
    case 'microseconds':
    case 'milliseconds':
    case 'seconds':
      profileBuilder.setValueFormatter(new TimeFormatter(sampleType.unit))
      break

    case 'bytes':
      profileBuilder.setValueFormatter(new ByteFormatter())
      break
  }

  for (let s of protoProfile.sample) {
    const stack = s.locationId ? s.locationId.map(l => frameByLocationID.get(i32(l))) : []
    stack.reverse()
    const value = s.value![sampleTypeIndex]
    profileBuilder.appendSampleWithWeight(stack.filter(f => f != null) as FrameInfo[], +value)
  }

  return profileBuilder.build()
}
