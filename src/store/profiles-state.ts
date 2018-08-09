import {Profile} from '../lib/profile'
import {
  FlamechartViewState,
  createFlamechartViewStateReducer,
  FlamechartID,
} from './flamechart-view-state'
import {SandwichViewState, createSandwichView} from './sandwich-view-state'
import {Reducer, Action, actionCreator, setter} from '../lib/typed-redux'
import {actions} from './actions'

export type ProfileGroupState = {
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

export function actionProfileIndex(action: Action<any>): number | null {
  const {payload} = action
  if ('profileIndex' in payload) {
    return parseInt(payload.profileIndex, 0)
  } else {
    return null
  }
}

export const profiles: Reducer<ProfileGroupState> = (state = null, action) => {
  if (actions.setProfileGroup.matches(action)) {
    const {indexToView, profiles} = action.payload
    return {
      indexToView,
      profiles: profiles.map((p, i) => {
        return {
          profile: p,
          frameToColorBucket: new Map(),
          chronoViewState: createFlamechartViewStateReducer(FlamechartID.CHRONO, i)(
            undefined,
            action,
          ),
          leftHeavyViewState: createFlamechartViewStateReducer(FlamechartID.LEFT_HEAVY, i)(
            undefined,
            action,
          ),
          sandwichViewState: createSandwichView(i)(undefined, action),
        }
      }),
    }
  }

  if (state != null) {
    const {indexToView, profiles} = state

    const nextIndexToView = setter(actions.setProfileIndexToView, 0)(indexToView, action)
    let nextProfiles = profiles

    const profileIndexFromAction = actionProfileIndex(action)
    if (profileIndexFromAction != null) {
      nextProfiles = profiles.map((profileState, profileIndex) => {
        return {
          profile: profileState.profile,
          chronoViewState: createFlamechartViewStateReducer(FlamechartID.CHRONO, profileIndex)(
            profileState.chronoViewState,
            action,
          ),
          leftHeavyViewState: createFlamechartViewStateReducer(
            FlamechartID.LEFT_HEAVY,
            profileIndex,
          )(profileState.leftHeavyViewState, action),
          sandwichViewState: createSandwichView(profileIndex)(
            profileState.sandwichViewState,
            action,
          ),
        }
      })
    }

    if (indexToView !== nextIndexToView || profiles !== nextProfiles) {
      return {
        indexToView: nextIndexToView,
        profiles: nextProfiles,
      }
    }
  }
  return state
}
