import {StyleSheet, css} from 'aphrodite'
import {h} from 'preact'
import {useCallback, useRef, useEffect, useMemo} from 'preact/hooks'
import {memo} from 'preact/compat'
import {Sizes, Colors, FontSize} from './style'
import {ProfileSearchResults, FlamechartType} from '../lib/profile-search'
import {ViewMode} from '../store'
import {CallTreeNode} from '../lib/profile'

function stopPropagation(ev: Event) {
  ev.stopPropagation()
}

// TODO(jlfwong): This is getting to be a lot.
//
// Consider making a container component to get more state calculation re-use,
// and also decouple more of the logic in here.
export interface SearchViewProps {
  searchQuery: string
  searchIsActive: boolean
  searchResults: ProfileSearchResults | null
  viewMode: ViewMode

  setSearchQuery: (query: string) => void
  setSearchIsActive: (active: boolean) => void

  selectedNode: CallTreeNode | null
  setSelectedNode: ((node: CallTreeNode | null) => void) | null
}

export const SearchView = memo(
  ({
    searchQuery,
    setSearchQuery,
    searchIsActive,
    setSearchIsActive,
    searchResults,
    viewMode,
    selectedNode,
    setSelectedNode,
  }: SearchViewProps) => {
    const onInput = useCallback(
      (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value
        setSearchQuery(value)
      },
      [setSearchQuery],
    )

    const inputRef = useRef<HTMLInputElement | null>(null)

    const close = useCallback(() => setSearchIsActive(false), [setSearchIsActive])

    const flamechartType: FlamechartType | null = useMemo(() => {
      switch (viewMode) {
        case ViewMode.CHRONO_FLAME_CHART: {
          return FlamechartType.CHRONO_FLAME_CHART
        }
        case ViewMode.LEFT_HEAVY_FLAME_GRAPH: {
          return FlamechartType.LEFT_HEAVY_FLAME_GRAPH
        }
        case ViewMode.SANDWICH_VIEW: {
          return null
        }
      }
    }, [viewMode])

    const numResults: number | null = useMemo(() => {
      if (searchResults == null) return null
      return flamechartType != null
        ? searchResults.getMatchedCallTreeNodeCount(flamechartType)
        : null
    }, [searchResults, flamechartType])

    const resultIndex: number | null = useMemo(() => {
      if (searchResults == null) return null
      if (selectedNode == null) return null
      return flamechartType != null
        ? searchResults.getIndexInSearchResults(flamechartType, selectedNode)
        : null
    }, [searchResults, selectedNode, flamechartType])

    const selectPrevOrNextResult = useCallback(
      (ev: KeyboardEvent) => {
        if (!setSelectedNode) return
        if (!searchResults?.getResultAtIndex) return
        if (flamechartType == null) return
        if (numResults == null || numResults === 0) return

        let index: number
        if (ev.shiftKey) {
          index = resultIndex == null ? numResults - 1 : resultIndex - 1
          if (index < 0) index = numResults - 1
        } else {
          index = resultIndex == null ? 0 : resultIndex + 1
          if (index >= numResults) index = 0
        }
        setSelectedNode(searchResults?.getResultAtIndex(flamechartType, index))
      },
      [setSelectedNode, flamechartType, numResults, resultIndex, searchResults?.getResultAtIndex],
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
            {resultIndex || '?'}/{numResults}
          </span>
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
  },
)

const style = StyleSheet.create({
  searchView: {
    position: 'absolute',
    top: 0,
    right: 10,
    height: Sizes.TOOLBAR_HEIGHT,
    width: 180,
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
    display: 'inline-block',
    verticalAlign: 'middle',
    paddingTop: '0px',
    margin: '0 2px 0 2px',
  },
})
