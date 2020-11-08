import {h} from 'preact'
import {Application} from './application'
import {getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {useActionCreator} from '../lib/preact-redux'
import {memo} from 'preact/compat'
import {useAppSelector, useActiveProfileState} from '../store'
import {ProfileSearchContextProvider} from './search-view'
import { useTheme } from './themes/theme'

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
  const theme = useTheme()
  const canvasContext = useAppSelector(
    state => (state.glCanvas ? getCanvasContext(theme)(state.glCanvas) : null),
    [],
  )

  return (
    <ProfileSearchContextProvider>
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
        theme={theme}
        {...appState}
      />
    </ProfileSearchContextProvider>
  )
})
