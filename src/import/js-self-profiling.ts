import {importSpeedscopeProfiles} from '../lib/file-format'
import {FileFormat} from '../lib/file-format-spec'
import {ProfileGroup} from '../lib/profile'

type Sample = {
  timestamp: number
  stackId?: number
}
type Frame = {
  name: string
  column?: number
  line?: number
  resourceId?: number
}
type StackNode = {
  frameId: number
  parentId?: number
}
type JSSelfProfilingData = {
  samples: Sample[]
  resources: string[]
  frames: Frame[]
  stacks: StackNode[]
}

function jsspToSpeedscope(json: JSSelfProfilingData): FileFormat.File {
  function getFrames(stackId: number | undefined): number[] {
    if (stackId == null) return []
    const {frameId, parentId} = json.stacks[stackId]
    return [...getFrames(parentId), frameId]
  }

  const profile = {
    type: FileFormat.ProfileType.SAMPLED,
    name: 'profile',
    unit: 'milliseconds',
    startValue: Math.min.apply(
      null,
      json.samples.map(s => s.timestamp),
    ),
    endValue: Math.max.apply(
      null,
      json.samples.map(s => s.timestamp),
    ),
    samples: json.samples.map(({stackId}) => getFrames(stackId)),
    weights: json.samples.map(({timestamp}, i) =>
      i === 0 ? 0 : timestamp - json.samples[i - 1].timestamp,
    ),
  } as FileFormat.Profile

  const frames = json.frames.map(f => {
    return {
      name: f.name,
      line: f.line,
      col: f.column,
      file: f.resourceId != null ? json.resources[f.resourceId] : '(unknown)',
    }
  })

  return {
    $schema: 'https://www.speedscope.app/file-format-schema.json',
    shared: {
      frames,
    },
    profiles: [profile],
  }
}

export function importFromJSSelfProfiling(serialized: JSSelfProfilingData): ProfileGroup {
  return importSpeedscopeProfiles(jsspToSpeedscope(serialized))
}
