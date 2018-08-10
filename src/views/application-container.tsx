import {createContainer, Dispatch} from '../lib/typed-redux'
import {Application, ActiveProfileState} from './application'
import {ApplicationState} from '../store'
import {getProfileToView} from '../store/getters'

export const ApplicationContainer = createContainer(
  Application,
  (state: ApplicationState, dispatch: Dispatch) => {
    const {flattenRecursion, profiles} = state

    let activeProfileState: ActiveProfileState | null = null
    if (profiles) {
      if (profiles.profiles.length > profiles.indexToView) {
        const index = profiles.indexToView
        const profileState = profiles.profiles[index]
        activeProfileState = {
          ...profiles.profiles[profiles.indexToView],
          profile: getProfileToView({profile: profileState.profile, flattenRecursion}),
          index: profiles.indexToView,
        }
      }
    }

    return {
      activeProfileState,
      dispatch,
      ...state,
    }
  },
)
