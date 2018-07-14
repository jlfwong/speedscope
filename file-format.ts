import {
  Profile,
  CallTreeNode,
  Frame,
  CallTreeProfileBuilder,
  FrameInfo,
  StackListProfileBuilder,
} from './profile'
import {TimeFormatter, ByteFormatter, RawValueFormatter} from './value-formatters'
import {FileFormat} from './file-format-spec'

export function exportProfile(profile: Profile): FileFormat.File {
  const frames: FileFormat.Frame[] = []

  const eventedProfile: FileFormat.EventedProfile = {
    type: FileFormat.ProfileType.EVENTED,
    name: profile.getName(),
    unit: profile.getWeightUnit(),
    startValue: 0,
    endValue: profile.getTotalWeight(),
    events: [],
  }

  const file: FileFormat.File = {
    version: require('./package.json').version,
    $schema: 'https://www.speedscope.app/file-format-schema.json',
    shared: {frames},
    profiles: [eventedProfile],
  }

  const indexForFrame = new Map<Frame, number>()
  function getIndexForFrame(frame: Frame): number {
    let index = indexForFrame.get(frame)
    if (index == null) {
      const serializedFrame: FileFormat.Frame = {
        name: frame.name,
      }
      if (frame.file != null) serializedFrame.file = frame.file
      if (frame.line != null) serializedFrame.line = frame.line
      if (frame.col != null) serializedFrame.col = frame.col

      index = frames.length
      indexForFrame.set(frame, index)
      frames.push(serializedFrame)
    }
    return index
  }

  const openFrame = (node: CallTreeNode, value: number) => {
    eventedProfile.events.push({
      type: FileFormat.EventType.OPEN_FRAME,
      frame: getIndexForFrame(node.frame),
      at: value,
    })
  }
  const closeFrame = (node: CallTreeNode, value: number) => {
    eventedProfile.events.push({
      type: FileFormat.EventType.CLOSE_FRAME,
      frame: getIndexForFrame(node.frame),
      at: value,
    })
  }
  profile.forEachCall(openFrame, closeFrame)

  return file
}

function importSpeedscopeProfile(
  serialized: FileFormat.Profile,
  frames: FileFormat.Frame[],
): Profile {
  function setCommonProperties(p: Profile) {
    const {name, unit} = serialized

    switch (unit) {
      case 'nanoseconds':
      case 'microseconds':
      case 'milliseconds':
      case 'seconds':
        p.setValueFormatter(new TimeFormatter(unit))
        break

      case 'bytes':
        p.setValueFormatter(new ByteFormatter())
        break

      case 'none':
        p.setValueFormatter(new RawValueFormatter())
        break
    }
    p.setName(name)
  }

  function importEventedProfile(evented: FileFormat.EventedProfile) {
    const {startValue, endValue, events} = evented

    const profile = new CallTreeProfileBuilder(endValue - startValue)
    setCommonProperties(profile)

    const frameInfos: FrameInfo[] = frames.map((frame, i) => ({key: i, ...frame}))

    for (let ev of events) {
      switch (ev.type) {
        case FileFormat.EventType.OPEN_FRAME: {
          profile.enterFrame(frameInfos[ev.frame], ev.at - startValue)
          break
        }
        case FileFormat.EventType.CLOSE_FRAME: {
          profile.leaveFrame(frameInfos[ev.frame], ev.at - startValue)
          break
        }
      }
    }
    return profile.build()
  }

  function importSampledProfile(sampled: FileFormat.SampledProfile) {
    const {startValue, endValue, samples, weights} = sampled
    const profile = new StackListProfileBuilder(endValue - startValue)
    setCommonProperties(profile)

    const frameInfos: FrameInfo[] = frames.map((frame, i) => ({key: i, ...frame}))

    if (samples.length !== weights.length) {
      throw new Error(
        `Expected samples.length (${samples.length}) to equal weights.length (${weights.length})`,
      )
    }

    for (let i = 0; i < samples.length; i++) {
      const stack = samples[i]
      const weight = weights[i]
      profile.appendSample(stack.map(n => frameInfos[n]), weight)
    }

    return profile.build()
  }

  switch (serialized.type) {
    case FileFormat.ProfileType.EVENTED:
      return importEventedProfile(serialized)
    case FileFormat.ProfileType.SAMPLED:
      return importSampledProfile(serialized)
  }
}

export function importSpeedscopeProfiles(serialized: FileFormat.File): Profile[] {
  return serialized.profiles.map(p => importSpeedscopeProfile(p, serialized.shared.frames))
}

export function saveToFile(profile: Profile): void {
  const blob = new Blob([JSON.stringify(exportProfile(profile))], {type: 'text/json'})

  const nameWithoutExt = profile.getName().split('.')[0]!
  const filename = `${nameWithoutExt.replace(/\W+/g, '_')}.speedscope.json`

  console.log('Saving', filename)

  const a = document.createElement('a')
  a.download = filename
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')

  // For this to work in Firefox, the <a> must be in the DOM
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
