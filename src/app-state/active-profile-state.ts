import {Profile} from '../lib/profile'
import {getProfileToView} from './getters'
import {flattenRecursionAtom, profileGroupAtom} from '.'
import {FlamechartViewState, SandwichViewState} from './profile-group'
import {useAtom} from '../lib/atom'

export interface ApplicationState {}

export interface ActiveProfileState {
  profile: Profile
  index: number
  chronoViewState: FlamechartViewState
  leftHeavyViewState: FlamechartViewState
  sandwichViewState: SandwichViewState
}

export function useActiveProfileState(): ActiveProfileState | null {
  const flattenRecursion = useAtom(flattenRecursionAtom)
  const profileGroupState = useAtom(profileGroupAtom)

  if (!profileGroupState) return null
  if (profileGroupState.indexToView >= profileGroupState.profiles.length) return null

  const index = profileGroupState.indexToView
  const profileState = profileGroupState.profiles[index]
  return {
    ...profileGroupState.profiles[profileGroupState.indexToView],
    profile: getProfileToView({
      profile: profileState.profile,
      flattenRecursion,
    }),
    index: profileGroupState.indexToView,
  }
}
