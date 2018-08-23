import {createContainer, Dispatch, bindActionCreator, ActionCreator} from '../lib/typed-redux'
import {Application, ActiveProfileState} from './application'
import {ApplicationState} from '../store'
import {getProfileToView, getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {Graphics} from '../gl/graphics'

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

    // TODO(jlfwong): Cache this and resizeCanvas below to prevent re-renders
    // due to changing props.
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
      canvasContext: state.glCanvas ? getCanvasContext(state.glCanvas) : null,
      resizeCanvas: (
        widthInPixels: number,
        heightInPixels: number,
        widthInAppUnits: number,
        heightInAppUnits: number,
      ) => {
        if (state.glCanvas) {
          const gl = getCanvasContext(state.glCanvas).gl
          gl.resize(widthInPixels, heightInPixels, widthInAppUnits, heightInAppUnits)
          gl.clear(new Graphics.Color(1, 1, 1, 1))
        }
      },
      ...setters,
      ...state,
    }
  },
)
