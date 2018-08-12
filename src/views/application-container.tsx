import {createContainer, Dispatch, bindActionCreator, ActionCreator} from '../lib/typed-redux'
import {Application, ActiveProfileState} from './application'
import {ApplicationState} from '../store'
import {getProfileToView} from '../store/getters'
import {actions} from '../store/actions'

export const ApplicationContainer = createContainer(
  Application,
  (state: ApplicationState, dispatch: Dispatch) => {
    const {flattenRecursion, profileGroup} = state

    let activeProfileState: ActiveProfileState | null = null
    if (profileGroup) {
      if (profileGroup.profiles.length > profileGroup.indexToView) {
        const index = profileGroup.indexToView
        const profileState = profileGroup.profiles[index]
        activeProfileState = {
          ...profileGroup.profiles[profileGroup.indexToView],
          profile: getProfileToView({profile: profileState.profile, flattenRecursion}),
          index: profileGroup.indexToView,
        }
      }
    }

    function wrapActionCreator<T>(actionCreator: ActionCreator<T>): (t: T) => void {
      return bindActionCreator(dispatch, actionCreator)
    }

    const setters = {
      setGLCanvas: wrapActionCreator(actions.setGLCanvas),
      setLoading: wrapActionCreator(actions.setLoading),
      setError: wrapActionCreator(actions.setError),
      setProfileGroup: wrapActionCreator(actions.setProfileGroup),
      setDragActive: wrapActionCreator(actions.setDragActive),
      setViewMode: wrapActionCreator(actions.setViewMode),
      setFlattenRecursion: wrapActionCreator(actions.setFlattenRecursion),
      setProfileIndexToView: wrapActionCreator(actions.setProfileIndexToView),
    }

    return {
      activeProfileState,
      dispatch,
      ...setters,
      ...state,
    }
  },
)
