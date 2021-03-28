import {h} from 'preact'
import {Application} from './application'
import {getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {useActionCreator} from '../lib/preact-redux'
import {memo} from 'preact/compat'
import {useAppSelector, useActiveProfileState} from '../store'
import {ProfileSearchContextProvider} from './search-view'
import {useTheme} from './themes/theme'
import {profileGroupAtom} from '../app-state'
import {useAtom} from '../lib/atom'

const {setLoading, setError, setDragActive, setViewMode, setGLCanvas, setFlattenRecursion} = actions

export const ApplicationContainer = memo(() => {
  const appState = useAppSelector(state => state, [])
  const theme = useTheme()
  const canvasContext = useAppSelector(
    state => (state.glCanvas ? getCanvasContext({theme, canvas: state.glCanvas}) : null),
    [theme],
  )

  return (
    <ProfileSearchContextProvider>
      <Application
        activeProfileState={useActiveProfileState()}
        canvasContext={canvasContext}
        setGLCanvas={useActionCreator(setGLCanvas, [])}
        setLoading={useActionCreator(setLoading, [])}
        setError={useActionCreator(setError, [])}
        setProfileGroup={profileGroupAtom.setProfileGroup}
        setDragActive={useActionCreator(setDragActive, [])}
        setViewMode={useActionCreator(setViewMode, [])}
        setFlattenRecursion={useActionCreator(setFlattenRecursion, [])}
        setProfileIndexToView={profileGroupAtom.setProfileIndexToView}
        profileGroup={useAtom(profileGroupAtom)}
        theme={theme}
        {...appState}
      />
    </ProfileSearchContextProvider>
  )
})
