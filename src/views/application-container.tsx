import {h} from 'preact'
import {getCanvasContext} from '../app-state/getters'
import {memo, useMemo} from 'preact/compat'
import {useActiveProfileState} from '../app-state/active-profile-state'
import {useTheme} from './themes/theme'
import {
  dragActiveAtom,
  errorAtom,
  flattenRecursionAtom,
  glCanvasAtom,
  hashParamsAtom,
  loadingAtom,
  profileGroupAtom,
  viewModeAtom,
} from '../app-state'
import {useAtom} from '../lib/atom'
import {ProfileSearchContextProvider} from './search-view'
import {Application} from './application'

export const ApplicationContainer = memo(() => {
  const canvas = useAtom(glCanvasAtom)
  const theme = useTheme()
  const canvasContext = useMemo(() => (canvas ? getCanvasContext({theme, canvas}) : null), [
    theme,
    canvas,
  ])

  return (
    <ProfileSearchContextProvider>
      <Application
        activeProfileState={useActiveProfileState()}
        canvasContext={canvasContext}
        setGLCanvas={glCanvasAtom.set}
        setLoading={loadingAtom.set}
        setError={errorAtom.set}
        setProfileGroup={profileGroupAtom.setProfileGroup}
        setDragActive={dragActiveAtom.set}
        setViewMode={viewModeAtom.set}
        setFlattenRecursion={flattenRecursionAtom.set}
        setProfileIndexToView={profileGroupAtom.setProfileIndexToView}
        profileGroup={useAtom(profileGroupAtom)}
        theme={theme}
        flattenRecursion={useAtom(flattenRecursionAtom)}
        viewMode={useAtom(viewModeAtom)}
        hashParams={useAtom(hashParamsAtom)}
        glCanvas={canvas}
        dragActive={useAtom(dragActiveAtom)}
        loading={useAtom(loadingAtom)}
        error={useAtom(errorAtom)}
      />
    </ProfileSearchContextProvider>
  )
})
