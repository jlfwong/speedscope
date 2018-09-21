import {perftools} from './profile.proto.js'

export function importAsPprofProfile(rawProfile: ArrayBuffer): void {
  try {
    const protoProfile = perftools.profiles.Profile.decode(new Uint8Array(rawProfile))
    console.log(protoProfile)

    const {sample, sampleType} = protoProfile

    function atIndex<V>(map: {[key: number]: V}, k: any): V {
      return map[k]
    }

    function stringVal(key: any) {
      return atIndex(protoProfile.stringTable, key)
    }

    const sampleTypes = sampleType.map(type => [stringVal(type.type), stringVal(type.unit)])
    const preferredType = sampleTypes.find(t => t[1] === 'cpu' || t[1] === 'wall') || sampleTypes[0]
    const preferredTypeIndex = sampleTypes.indexOf(preferredType)

    for (let s of sample) {
      const stack = s.locationId ? s.locationId.map(l => atIndex(protoProfile.location, l)) : []
      console.log(stack, s.value![preferredTypeIndex])
    }
  } catch (e) {
    // TODO(jlfwong): Remove this console.error
    console.error(e)
    return
  }
}
