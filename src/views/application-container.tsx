import {createRef, h} from 'preact'
import {getCanvasContext} from '../app-state/getters'
import {memo, useMemo} from 'preact/compat'
import {useActiveProfileState} from '../app-state/active-profile-state'
import {useTheme} from './themes/theme'
import {
  dragActiveAtom,
  errorAtom,
  flattenRecursionAtom,
  displayMinimapAtom,
  glCanvasAtom,
  hashParamsAtom,
  loadingAtom,
  profileGroupAtom,
  viewModeAtom,
  displayTableAtom,
} from '../app-state'
import {useAtom} from '../lib/atom'
import {ProfileSearchContextProvider} from './search-view'
import {Application, ApplicationAPI} from './application'

export const appApi = createRef<ApplicationAPI>();

export function resizeApp(force: boolean = false) {
  appApi.current?.resize(force);
}

export function loadNewInput(folded: string) {
  appApi.current?.loadFoldedStr(folded);
}

export function toggleLoadingPage() {
  appApi.current?.setLoadingState(true);
}

export function reloadWithInvertedDiff(inverted: boolean) {
  appApi.current?.reloadWithInvertedDiff(inverted);
}

export function reloadDiffProfile(options: {
  diffNormalized?: boolean,
  diffInverted?: boolean,
  keepSelectedFrame?: boolean
}) {
  appApi.current?.reloadDiffProfile(options);
}

export const ApplicationContainer = memo(() => {
  const canvas = useAtom(glCanvasAtom)
  const theme = useTheme()
  const canvasContext = useMemo(
    () => (canvas ? getCanvasContext({theme, canvas}) : null),
    [theme, canvas],
  )

  return (
    <ProfileSearchContextProvider>
      <Application
        ref={appApi}
        activeProfileState={useActiveProfileState()}
        canvasContext={canvasContext}
        setGLCanvas={glCanvasAtom.set}
        setLoading={loadingAtom.set}
        setError={errorAtom.set}
        setProfileGroup={profileGroupAtom.setProfileGroup}
        setDragActive={dragActiveAtom.set}
        setViewMode={viewModeAtom.set}
        setFlattenRecursion={flattenRecursionAtom.set}
        setDisplayMinimap={displayMinimapAtom.set}
        setDisplayTable={displayTableAtom.set}
        setProfileIndexToView={profileGroupAtom.setProfileIndexToView}
        profileGroup={useAtom(profileGroupAtom)}
        theme={theme}
        flattenRecursion={useAtom(flattenRecursionAtom)}
        displayMinimap={useAtom(displayMinimapAtom)}
        displayTable={useAtom(displayTableAtom)}
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
