import {perftools} from './profile.proto.js'

export function importAsPprofProfile(rawProfile: ArrayBuffer): void {
  try {
    const protoProfile = perftools.profiles.Profile.decode(new Uint8Array(rawProfile))
    console.log(protoProfile)
  } catch (e) {
    // TODO(jlfwong): Remove this console.error
    console.error(e)
    return
  }
}
