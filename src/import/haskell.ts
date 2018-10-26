import {ProfileGroup, FrameInfo, CallTreeProfileBuilder} from '../lib/profile'
import {TimeFormatter, ByteFormatter} from '../lib/value-formatters'

// See https://downloads.haskell.org/~ghc/latest/docs/html/users_guide/profiling.html#json-profile-format
// for information on the GHC profiler JSON output format.

interface CostCentre {
  id: number
  label: string
  module: string
  src_loc: string
  is_caf: boolean
}

interface ProfileTree {
  id: number
  entries: number
  alloc: number
  ticks: number
  children: ProfileTree[]
}

interface HaskellProfile {
  program: string
  arguments: string[]
  rts_arguments: string[]
  end_time: string
  initial_capabilities: number
  total_time: number
  total_ticks: number
  tick_interval: number
  total_alloc: number
  cost_centres: CostCentre[]
  profile: ProfileTree
}

// The profiler already collapses recursion before output so using the JS stack here should be fine
function addToProfile(
  tree: ProfileTree,
  startVal: number,
  profile: CallTreeProfileBuilder,
  infos: Map<number, FrameInfo>,
  attribute: (tree: ProfileTree) => number,
): number {
  // If the expression never did anything we don't care about it
  if (tree.ticks === 0 && tree.entries === 0 && tree.alloc === 0 && tree.children.length === 0)
    return startVal

  let curVal = startVal
  let frameInfo = infos.get(tree.id)!

  profile.enterFrame(frameInfo, curVal)

  for (let child of tree.children) {
    curVal = addToProfile(child, curVal, profile, infos, attribute)
  }

  curVal += attribute(tree)

  profile.leaveFrame(frameInfo, curVal)

  return curVal
}

export function importFromHaskell(haskellProfile: HaskellProfile): ProfileGroup {
  const idToFrameInfo = new Map<number, FrameInfo>()
  for (let centre of haskellProfile.cost_centres) {
    const frameInfo: FrameInfo = {
      key: centre.id,
      name: `${centre.module}.${centre.label}`,
    }

    // Ignore things like <entire-module> and <no location info>
    if (!centre.src_loc.startsWith('<')) {
      // This also contains line and column information, but sometimes it contains ranges,
      // and in varying formats, so it's a better experience just to leave it as is
      frameInfo.file = centre.src_loc
    }

    idToFrameInfo.set(centre.id, frameInfo)
  }

  const timeProfile = new CallTreeProfileBuilder(haskellProfile.total_ticks)
  addToProfile(haskellProfile.profile, 0, timeProfile, idToFrameInfo, tree => tree.ticks)
  timeProfile.setValueFormatter(new TimeFormatter('milliseconds'))
  timeProfile.setName(`${haskellProfile.program} time`)

  const allocProfile = new CallTreeProfileBuilder(haskellProfile.total_ticks)
  addToProfile(haskellProfile.profile, 0, allocProfile, idToFrameInfo, tree => tree.alloc)
  allocProfile.setValueFormatter(new ByteFormatter())
  allocProfile.setName(`${haskellProfile.program} allocation`)

  return {
    name: haskellProfile.program,
    indexToView: 0,
    profiles: [timeProfile.build(), allocProfile.build()],
  }
}
