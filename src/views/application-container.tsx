import {h} from 'preact'
import {Application, ActiveProfileState} from './application'
import {getProfileToView, getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {useActionCreator} from '../lib/preact-redux'
import {memo} from 'preact/compat'
import {useAppSelector} from '../store'

const {
  setLoading,
  setError,
  setProfileGroup,
  setDragActive,
  setViewMode,
  setGLCanvas,
  setFlattenRecursion,
  setProfileIndexToView,
} = actions

export const ApplicationContainer = memo(() => {
  const appState = useAppSelector(state => state, [])
  const canvasContext = useAppSelector(
    state => (state.glCanvas ? getCanvasContext(state.glCanvas) : null),
    [],
  )

  const activeProfileState: ActiveProfileState | null = useAppSelector(state => {
    const {profileGroup} = state
    if (!profileGroup) return null
    if (profileGroup.indexToView >= profileGroup.profiles.length) return null

    const index = profileGroup.indexToView
    const profileState = profileGroup.profiles[index]
    return {
      ...profileGroup.profiles[profileGroup.indexToView],
      profile: getProfileToView({
        profile: profileState.profile,
        flattenRecursion: state.flattenRecursion,
      }),
      index: profileGroup.indexToView,
    }
  }, [])

  return (
    <Application
      activeProfileState={activeProfileState}
      canvasContext={canvasContext}
      setGLCanvas={useActionCreator(setGLCanvas, [])}
      setLoading={useActionCreator(setLoading, [])}
      setError={useActionCreator(setError, [])}
      setProfileGroup={useActionCreator(setProfileGroup, [])}
      setDragActive={useActionCreator(setDragActive, [])}
      setViewMode={useActionCreator(setViewMode, [])}
      setFlattenRecursion={useActionCreator(setFlattenRecursion, [])}
      setProfileIndexToView={useActionCreator(setProfileIndexToView, [])}
      {...appState}
    />
  )
})
