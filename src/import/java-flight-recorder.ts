import {FrameInfo, Profile, ProfileGroup, StackListProfileBuilder} from '../lib/profile'
import init, {Frame, interpret_jfr} from 'jfrview'
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

function create_profile(data: ArrayBuffer, includeNative: boolean): Profile {
  const result = interpret_jfr(new Uint8Array(data), includeNative)

  const builder = new StackListProfileBuilder(result.length)
  if (includeNative) {
    builder.setName('with native')
  } else {
    builder.setName('Without native')
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
