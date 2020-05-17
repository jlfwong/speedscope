import {h} from 'preact'
import {Application, ActiveProfileState} from './application'
import {ApplicationState} from '../store'
import {getProfileToView, getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {Graphics} from '../gl/graphics'
import {useSelector, useActionCreator} from '../lib/preact-redux'
import {memo} from 'preact/compat'

export function useAppSelector<T>(selector: (t: ApplicationState) => T, selectorDeps?: any[]): T {
  return useSelector(selector, selectorDeps)
}

export const ApplicationContainer = memo(() => {
  const appState = useAppSelector(state => state)
  const flattenRecursion = useAppSelector(state => state.flattenRecursion)
  const glCanvas = useAppSelector(state => state.glCanvas)

  const activeProfileState: ActiveProfileState | null = useAppSelector(
    state => {
      const {profileGroup} = state
      if (!profileGroup) return null
      if (profileGroup.indexToView >= profileGroup.profiles.length) return null

      const index = profileGroup.indexToView
      const profileState = profileGroup.profiles[index]
      return {
        ...profileGroup.profiles[profileGroup.indexToView],
        profile: getProfileToView({profile: profileState.profile, flattenRecursion}),
        index: profileGroup.indexToView,
      }
    },
    [flattenRecursion],
  )

  // TODO(jlfwong): Cache this and resizeCanvas below to prevent re-renders
  // due to changing props.
  const setters = {
    setGLCanvas: useActionCreator(actions.setGLCanvas),
    setLoading: useActionCreator(actions.setLoading),
    setError: useActionCreator(actions.setError),
    setProfileGroup: useActionCreator(actions.setProfileGroup),
    setDragActive: useActionCreator(actions.setDragActive),
    setViewMode: useActionCreator(actions.setViewMode),
    setFlattenRecursion: useActionCreator(actions.setFlattenRecursion),
    setProfileIndexToView: useActionCreator(actions.setProfileIndexToView),
  }

  return (
    <Application
      {...{
        ...appState,
        activeProfileState,
        canvasContext: glCanvas ? getCanvasContext(glCanvas) : null,
        resizeCanvas: (
          widthInPixels: number,
          heightInPixels: number,
          widthInAppUnits: number,
          heightInAppUnits: number,
        ) => {
          if (glCanvas) {
            const gl = getCanvasContext(glCanvas).gl
            gl.resize(widthInPixels, heightInPixels, widthInAppUnits, heightInAppUnits)
            gl.clear(new Graphics.Color(1, 1, 1, 1))
          }
        },
        ...setters,
      }}
    />
  )
})
