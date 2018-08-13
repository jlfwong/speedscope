import {Profile} from '../lib/profile'
import {
  FlamechartViewState,
  createFlamechartViewStateReducer,
  FlamechartID,
} from './flamechart-view-state'
import {SandwichViewState, createSandwichView} from './sandwich-view-state'
import {Reducer, actionCreator, setter} from '../lib/typed-redux'
import {actions} from './actions'
import {clamp} from '../lib/math'
import {objectsHaveShallowEquality} from '../lib/utils'

export type ProfileGroupState = {
  name: string
  indexToView: number
  profiles: ProfileState[]
} | null

export interface ProfileWithIndex {
  profile: Profile
  index: number
}

export interface ProfileState {
  profile: Profile
  chronoViewState: FlamechartViewState
  leftHeavyViewState: FlamechartViewState
  sandwichViewState: SandwichViewState
}

export function actionCreatorWithIndex<T>(name: string) {
  return actionCreator<{profileIndex: number; args: T}>(name)
}

function createProfileReducer(profile: Profile, index: number): Reducer<ProfileState> {
  const chronoViewStateReducer = createFlamechartViewStateReducer(FlamechartID.CHRONO, index)
  const leftHeavyViewStateReducer = createFlamechartViewStateReducer(FlamechartID.LEFT_HEAVY, index)
  const sandwichViewStateReducer = createSandwichView(index)

  return (state = undefined, action) => {
    if (state === undefined) {
      return {
        profile,
        chronoViewState: chronoViewStateReducer(undefined, action),
        leftHeavyViewState: leftHeavyViewStateReducer(undefined, action),
        sandwichViewState: sandwichViewStateReducer(undefined, action),
      }
    }

    const nextState = {
      profile,
      chronoViewState: chronoViewStateReducer(state.chronoViewState, action),
      leftHeavyViewState: leftHeavyViewStateReducer(state.leftHeavyViewState, action),
      sandwichViewState: sandwichViewStateReducer(state.sandwichViewState, action),
    }

    if (objectsHaveShallowEquality(state, nextState)) {
      return state
    }

    return nextState
  }
}

export const profileGroup: Reducer<ProfileGroupState> = (state = null, action) => {
  if (actions.setProfileGroup.matches(action)) {
    const {indexToView, profiles, name} = action.payload
    return {
      indexToView,
      name,
      profiles: profiles.map((p, i) => {
        return createProfileReducer(p, i)(undefined, action)
      }),
    }
  }

  if (state != null) {
    const {indexToView, profiles} = state

    const nextIndexToView = clamp(
      setter(actions.setProfileIndexToView, 0)(indexToView, action),
      0,
      profiles.length - 1,
    )
    const nextProfiles = profiles.map((profileState, profileIndex) => {
      return createProfileReducer(profileState.profile, profileIndex)(profileState, action)
    })

    if (indexToView === nextIndexToView && objectsHaveShallowEquality(profiles, nextProfiles)) {
      return state
    }

    return {
      ...state,
      indexToView: nextIndexToView,
      profiles: nextProfiles,
    }
  }
  return state
}
