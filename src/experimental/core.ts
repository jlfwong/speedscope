import {Flamechart} from '../lib/flamechart'
import {Frame, Profile, ProfileFlamechartOrder, ProfileFlamechartWeight} from '../lib/profile'
import {FlamechartSearchResults, ProfileSearchResults} from '../lib/profile-search'

// This module is the compatibility seam for the first experimental slice.
// The implementations currently delegate to the existing JS core so the
// experimental import path can land behind a stable interface before the
// hot paths are replaced with Rust/WASM-backed code.

export function getProfileToView(profile: Profile, flattenRecursion: boolean): Profile {
  return profile.getProfileForView(flattenRecursion)
}

export function getProfileForCallersOf(
  profile: Profile,
  frame: Frame,
  flattenRecursion: boolean,
): Profile {
  return profile.getProfileForCallersView(frame, flattenRecursion)
}

export function getProfileForCalleesOf(
  profile: Profile,
  frame: Frame,
  flattenRecursion: boolean,
): Profile {
  return profile.getProfileForCalleesView(frame, flattenRecursion)
}

function createProfileFlamechart(
  profile: Profile,
  getColorBucketForFrame: (frame: Frame) => number,
  order: ProfileFlamechartOrder,
  weight: ProfileFlamechartWeight,
): Flamechart {
  return new Flamechart(
    profile.createFlamechartDataSource({
      getColorBucketForFrame,
      order,
      weight,
    }),
  )
}

export function createChronoFlamechart(
  profile: Profile,
  getColorBucketForFrame: (frame: Frame) => number,
): Flamechart {
  return createProfileFlamechart(profile, getColorBucketForFrame, 'append-order', 'total')
}

export function createLeftHeavyFlamechart(
  profile: Profile,
  getColorBucketForFrame: (frame: Frame) => number,
): Flamechart {
  return createProfileFlamechart(profile, getColorBucketForFrame, 'grouped', 'non-idle')
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
