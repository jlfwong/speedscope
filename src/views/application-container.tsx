import {h} from 'preact'
import {Application} from './application'
import {getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {useActionCreator} from '../lib/preact-redux'
import {memo} from 'preact/compat'
import {useAppSelector, useActiveProfileState} from '../store'
import {ProfileSearchResultsContextProvider} from './search-view'

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

  return (
    <ProfileSearchResultsContextProvider>
      <Application
        activeProfileState={useActiveProfileState()}
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
    </ProfileSearchResultsContextProvider>
  )
})
