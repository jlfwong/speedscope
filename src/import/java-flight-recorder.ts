import {FrameInfo, Profile, ProfileGroup, StackListProfileBuilder} from '../lib/profile'
import init, {Frame, interpret_jfr} from 'jfrview'
// @ts-ignore
import wasm_data from 'jfrview/jfrview_bg.wasm'

export async function importFromJfr(fileName: string, data: ArrayBuffer): Promise<ProfileGroup> {
  await init({module_or_path: wasm_data})
  const withoutNative = create_profile(data, false)
  const withNative = create_profile(data, true)

  return {
    indexToView: 0,
    name: fileName,
    profiles: [withoutNative, withNative],
  }
}

export function isJfrRecording(buffer: ArrayBuffer) {
  const b = buffer.slice(0, 3)
  const bytes = new Uint8Array(b)
  return bytes[0] == 0x46 && bytes[1] == 0x4c && bytes[2] == 0x52
}

function create_profile(data: ArrayBuffer, includeNative: boolean): Profile {
  const result = interpret_jfr(new Uint8Array(data), includeNative)

  const builder = new StackListProfileBuilder(result.length)
  if (includeNative) {
    builder.setName('With native calls')
  } else {
    builder.setName('Without native calls')
  }

  function to_fi(input: Frame): FrameInfo {
    return {
      name: input.name,
      key: input.name,
    }
  }

  for (const sample of result) {
    builder.appendSampleWithWeight(sample.frames.map(to_fi), 1)
  }

  return builder
}
