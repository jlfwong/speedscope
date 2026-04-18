import {Flamechart} from '../lib/flamechart'
import {Frame, Profile} from '../lib/profile'
import {FlamechartSearchResults, ProfileSearchResults} from '../lib/profile-search'

// This module is the compatibility seam for the first experimental slice.
// The implementations currently delegate to the existing JS core so the
// experimental import path can land behind a stable interface before the
// hot paths are replaced with Rust/WASM-backed code.

export function getProfileToView(profile: Profile, flattenRecursion: boolean): Profile {
  return flattenRecursion ? profile.getProfileWithRecursionFlattened() : profile
}

export function getProfileForCallersOf(
  profile: Profile,
  frame: Frame,
  flattenRecursion: boolean,
): Profile {
  const callers = profile.getInvertedProfileForCallersOf(frame)
  return getProfileToView(callers, flattenRecursion)
}

export function getProfileForCalleesOf(
  profile: Profile,
  frame: Frame,
  flattenRecursion: boolean,
): Profile {
  const callees = profile.getProfileForCalleesOf(frame)
  return getProfileToView(callees, flattenRecursion)
}

export function createChronoFlamechart(
  profile: Profile,
  getColorBucketForFrame: (frame: Frame) => number,
): Flamechart {
  return new Flamechart({
    getTotalWeight: profile.getTotalWeight.bind(profile),
    forEachCall: profile.forEachCall.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame,
  })
}

export function createLeftHeavyFlamechart(
  profile: Profile,
  getColorBucketForFrame: (frame: Frame) => number,
): Flamechart {
  return new Flamechart({
    getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
    forEachCall: profile.forEachCallGrouped.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame,
  })
}

export function createProfileSearchResults(
  profile: Profile | null,
  searchQuery: string,
  searchIsActive: boolean,
): ProfileSearchResults | null {
  if (!profile || !searchIsActive || searchQuery.length === 0) {
    return null
  }
  return new ProfileSearchResults(profile, searchQuery)
}

export function createFlamechartSearchResults(
  flamechart: Flamechart,
  profileSearchResults: ProfileSearchResults | null,
): FlamechartSearchResults | null {
  if (profileSearchResults == null) {
    return null
  }
  return new FlamechartSearchResults(flamechart, profileSearchResults)
}
