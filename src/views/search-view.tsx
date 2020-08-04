import {StyleSheet, css} from 'aphrodite'
import {h, createContext, ComponentChildren, Fragment} from 'preact'
import {useCallback, useRef, useEffect, useMemo, useContext} from 'preact/hooks'
import {memo} from 'preact/compat'
import {Sizes, Colors, FontSize} from './style'
import {
  FlamechartSearchResults,
  ProfileSearchResults,
  FlamechartSearchMatch,
} from '../lib/profile-search'
import {CallTreeNode, Profile} from '../lib/profile'
import {useActiveProfileState, useAppSelector} from '../store'
import {Flamechart} from '../lib/flamechart'
import {useActionCreator} from '../lib/preact-redux'
import {actions} from '../store/actions'
import {Rect, Vec2} from '../lib/math'

function stopPropagation(ev: Event) {
  ev.stopPropagation()
}

export const ProfileSearchContext = createContext<ProfileSearchResults | null>(null)
export const FlamechartSearchContext = createContext<FlamechartSearchData | null>(null)

export const ProfileSearchContextProvider = ({children}: {children: ComponentChildren}) => {
  const activeProfileState = useActiveProfileState()
  const profile: Profile | null = activeProfileState ? activeProfileState.profile : null
  const searchIsActive = useAppSelector(state => state.searchIsActive, [])
  const searchQuery = useAppSelector(state => state.searchQuery, [])

  const searchResults = useMemo(() => {
    if (!profile || !searchIsActive || searchQuery.length === 0) {
      return null
    }
    return new ProfileSearchResults(profile, searchQuery)
  }, [searchIsActive, searchQuery, profile])

  return (
    <ProfileSearchContext.Provider value={searchResults}>{children}</ProfileSearchContext.Provider>
  )
}

export interface FlamechartSearchProps {
  flamechart: Flamechart
  selectedNode: CallTreeNode | null
  setSelectedNode: (node: CallTreeNode | null) => void
  configSpaceViewportRect: Rect
  setConfigSpaceViewportRect: (rect: Rect) => void
  children: ComponentChildren
}

interface FlamechartSearchData {
  results: FlamechartSearchResults | null
  flamechart: Flamechart
  selectedNode: CallTreeNode | null
  setSelectedNode: (node: CallTreeNode | null) => void
  configSpaceViewportRect: Rect
  setConfigSpaceViewportRect: (rect: Rect) => void
}

export const FlamechartSearchContextProvider = ({
  flamechart,
  selectedNode,
  setSelectedNode,
  configSpaceViewportRect,
  setConfigSpaceViewportRect,
  children,
}: FlamechartSearchProps) => {
  const profileSearchResults: ProfileSearchResults | null = useContext(ProfileSearchContext)
  const flamechartSearchResults: FlamechartSearchResults | null = useMemo(() => {
    if (profileSearchResults == null) {
      return null
    }
    return new FlamechartSearchResults(flamechart, profileSearchResults)
  }, [flamechart, profileSearchResults])

  return (
    <FlamechartSearchContext.Provider
      value={{
        results: flamechartSearchResults,
        flamechart,
        selectedNode,
        setSelectedNode,
        configSpaceViewportRect,
        setConfigSpaceViewportRect,
      }}
    >
      {children}
    </FlamechartSearchContext.Provider>
  )
}

const {setSearchQuery: setSearchQueryAction, setSearchIsActive: setSearchIsActiveAction} = actions

export const SearchView = memo(() => {
  const searchQuery = useAppSelector(state => state.searchQuery, [])
  const searchIsActive = useAppSelector(state => state.searchIsActive, [])
  const setSearchQuery = useActionCreator(setSearchQueryAction, [])
  const setSearchIsActive = useActionCreator(setSearchIsActiveAction, [])

  const flamechartData = useContext(FlamechartSearchContext)

  // TODO(jlfwong): This pattern is pretty gross, but I really don't want values
  // that can be undefined or null.
  const searchResults = flamechartData == null ? null : flamechartData.results
  const selectedNode = flamechartData == null ? null : flamechartData.selectedNode
  const setSelectedNode = flamechartData == null ? null : flamechartData.setSelectedNode
  const configSpaceViewportRect =
    flamechartData == null ? null : flamechartData.configSpaceViewportRect
  const setConfigSpaceViewportRect =
    flamechartData == null ? null : flamechartData.setConfigSpaceViewportRect
  const flamechart = flamechartData == null ? null : flamechartData.flamechart

  const onInput = useCallback(
    (ev: Event) => {
      const value = (ev.target as HTMLInputElement).value
      setSearchQuery(value)
    },
    [setSearchQuery],
  )

  const inputRef = useRef<HTMLInputElement | null>(null)

  const close = useCallback(() => setSearchIsActive(false), [setSearchIsActive])

  const numResults = searchResults == null ? null : searchResults.count()
  const resultIndex: number | null = useMemo(() => {
    if (searchResults == null) return null
    if (selectedNode == null) return null
    return searchResults.indexOf(selectedNode)
  }, [searchResults, selectedNode])

  const selectAndZoomToMatch = useCallback(
    (match: FlamechartSearchMatch) => {
      if (!setSelectedNode) return
      if (!flamechart) return
      if (!configSpaceViewportRect) return
      if (!setConfigSpaceViewportRect) return

      // After the node is selected, we want to set the viewport so that the new
      // node can be seen clearly.
      //
      // TODO(jlfwong): The lack of animation here can be kind of jarring. It
      // would be nice to have some easier way for people to orient themselves
      // after the viewport shifted.
      const configSpaceResultBounds = match.configSpaceBounds

      const viewportRect = new Rect(
        configSpaceResultBounds.origin.minus(new Vec2(0, 1)),
        configSpaceResultBounds.size.withY(configSpaceViewportRect.height()),
      )

      setSelectedNode(match.node)
      setConfigSpaceViewportRect(
        flamechart.getClampedConfigSpaceViewportRect({configSpaceViewportRect: viewportRect}),
      )
    },
    [configSpaceViewportRect, setConfigSpaceViewportRect, setSelectedNode, flamechart],
  )

  const selectPrev = useCallback(() => {
    if (!searchResults?.at) return
    if (numResults == null || numResults === 0) return

    let index = resultIndex == null ? numResults - 1 : resultIndex - 1
    if (index < 0) index = numResults - 1
    const result = searchResults.at(index)
    selectAndZoomToMatch(result)
  }, [numResults, resultIndex, searchResults, searchResults?.at, selectAndZoomToMatch])

  const selectNext = useCallback(() => {
    if (!searchResults?.at) return
    if (numResults == null || numResults === 0) return

    let index = resultIndex == null ? 0 : resultIndex + 1
    if (index >= numResults) index = 0
    const result = searchResults.at(index)
    selectAndZoomToMatch(result)
  }, [numResults, resultIndex, searchResults, searchResults?.at, selectAndZoomToMatch])

  const selectPrevOrNextResult = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.shiftKey) {
        selectPrev()
      } else {
        selectNext()
      }
    },
    [selectPrev, selectNext],
  )

  const onKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      ev.stopPropagation()

      // Hitting Esc should close the search box
      if (ev.key === 'Escape') {
        setSearchIsActive(false)
      }

      if (ev.key === 'Enter') {
        selectPrevOrNextResult(ev)
      }

      if (ev.key == 'f' && (ev.metaKey || ev.ctrlKey)) {
        if (inputRef.current) {
          // If the input is already focused, select all
          inputRef.current.select()
        }

        // It seems like when an input is focused, the browser find menu pops
        // up without this line. It seems like it's not sufficient to only
        // preventDefault in the window keydown handler.
        ev.preventDefault()
      }
    },
    [setSearchIsActive, selectPrevOrNextResult],
  )

  useEffect(() => {
    const onWindowKeyDown = (ev: KeyboardEvent) => {
      // Cmd+F or Ctrl+F open the search box
      if (ev.key == 'f' && (ev.metaKey || ev.ctrlKey)) {
        // Prevent the browser's search menu from appearing
        ev.preventDefault()

        if (inputRef.current) {
          // If the search box is already open, then re-select it immediately.
          inputRef.current.select()
        } else {
          // Otherwise, focus the search, then focus the input on the next
          // frame, when the search box should have mounted.
          setSearchIsActive(true)
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.select()
            }
          })
        }
      }
    }

    window.addEventListener('keydown', onWindowKeyDown)
    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
    }
  }, [setSearchIsActive])

  if (!searchIsActive) return null

  return (
    <div className={css(style.searchView)}>
      <span className={css(style.icon)}>🔍</span>
      <span className={css(style.inputContainer)}>
        <input
          className={css(style.input)}
          value={searchQuery}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          ref={inputRef}
        />
      </span>
      {numResults != null && (
        <span className={css(style.resultCount)}>
          {resultIndex == null ? '?' : resultIndex + 1}/{numResults}
        </span>
      )}
      {setSelectedNode != null && numResults != null && (
        <Fragment>
          <button className={css(style.icon, style.button)} onClick={selectPrev}>
            ⬅️
          </button>
          <button className={css(style.icon, style.button)} onClick={selectNext}>
            ➡️
          </button>
        </Fragment>
      )}
      <svg
        className={css(style.icon)}
        onClick={close}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.99999 4.16217L11.6427 10.8048M11.6427 4.16217L4.99999 10.8048"
          stroke="#BDBDBD"
        />
      </svg>
    </div>
  )
})

const style = StyleSheet.create({
  searchView: {
    position: 'absolute',
    top: 0,
    right: 10,
    height: Sizes.TOOLBAR_HEIGHT,
    width: 16 * 13,
    borderWidth: 2,
    borderColor: Colors.BLACK,
    borderStyle: 'solid',
    fontSize: FontSize.LABEL,
    boxSizing: 'border-box',
    background: Colors.DARK_GRAY,
    color: Colors.WHITE,
    display: 'flex',
    alignItems: 'center',
  },
  inputContainer: {
    flexShrink: 1,
    flexGrow: 1,
    display: 'flex',
  },
  input: {
    width: '100%',
    border: 'none',
    background: 'none',
    fontSize: FontSize.LABEL,
    lineHeight: `${Sizes.TOOLBAR_HEIGHT}px`,
    color: Colors.WHITE,
    ':focus': {
      border: 'none',
      outline: 'none',
    },
    '::selection': {
      color: Colors.WHITE,
      background: Colors.DARK_BLUE,
    },
  },
  resultCount: {
    verticalAlign: 'middle',
  },
  icon: {
    flexShrink: 0,
    verticalAlign: 'middle',
    height: '100%',
    margin: '0px 2px 0px 2px',
    fontSize: FontSize.LABEL,
  },
  button: {
    display: 'inline',
    background: 'none',
    border: 'none',
    padding: 0,
    ':focus': {
      outline: 'none',
    },
  },
})
