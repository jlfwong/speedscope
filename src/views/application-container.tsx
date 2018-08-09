import {createContainer, WithoutDispatch} from '../lib/typed-redux'
import {Application, ApplicationProps, ActiveProfileState} from './application'
import {ApplicationState} from '../store'
import {getProfileToView} from '../store/getters'

export const ApplicationContainer = createContainer<
  {},
  ApplicationState,
  WithoutDispatch<ApplicationProps>,
  Application
>(Application, (state: ApplicationState) => {
  let activeProfileState: ActiveProfileState | null = null
  if (state.profiles) {
    if (state.profiles.profiles.length > state.profiles.indexToView) {
      activeProfileState = {
        ...state.profiles.profiles[state.profiles.indexToView],
        index: state.profiles.indexToView,
      }
    }
  }
  if (activeProfileState && state.flattenRecursion) {
    const {flattenRecursion} = state
    activeProfileState = {
      profile: getProfileToView({profile: activeProfileState.profile, flattenRecursion}),
      ...activeProfileState,
    }
  }

  return {
    activeProfileState,
    ...state,
  }
})
