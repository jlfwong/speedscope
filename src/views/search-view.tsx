import {StyleSheet, css} from 'aphrodite'
import {h, createContext, ComponentChildren, Fragment} from 'preact'
import {useCallback, useRef, useEffect, useMemo} from 'preact/hooks'
import {memo} from 'preact/compat'
import {Sizes, FontSize, defaultTheme} from './style'
import {ProfileSearchResults} from '../lib/profile-search'
import {Profile} from '../lib/profile'
import {useActiveProfileState, useAppSelector} from '../store'
import {useActionCreator} from '../lib/preact-redux'
import {actions} from '../store/actions'

function stopPropagation(ev: Event) {
  ev.stopPropagation()
}

export const ProfileSearchContext = createContext<ProfileSearchResults | null>(null)

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

const {setSearchQuery: setSearchQueryAction, setSearchIsActive: setSearchIsActiveAction} = actions

interface SearchViewProps {
  resultIndex: number | null
  numResults: number | null
  selectNext: () => void
  selectPrev: () => void
}

export const SearchView = memo(
  ({numResults, resultIndex, selectNext, selectPrev}: SearchViewProps) => {
    const searchQuery = useAppSelector(state => state.searchQuery, [])
    const searchIsActive = useAppSelector(state => state.searchIsActive, [])
    const setSearchQuery = useActionCreator(setSearchQueryAction, [])
    const setSearchIsActive = useActionCreator(setSearchIsActiveAction, [])

    const onInput = useCallback(
      (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value
        setSearchQuery(value)
      },
      [setSearchQuery],
    )

    const inputRef = useRef<HTMLInputElement | null>(null)

    const close = useCallback(() => setSearchIsActive(false), [setSearchIsActive])

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
          <Fragment>
            <span className={css(style.resultCount)}>
              {resultIndex == null ? '?' : resultIndex + 1}/{numResults}
            </span>
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
            stroke={defaultTheme.altFgSecondaryColor}
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
    width: 16 * 13,
    borderWidth: 2,
    borderColor: defaultTheme.altFgPrimaryColor,
    borderStyle: 'solid',
    fontSize: FontSize.LABEL,
    boxSizing: 'border-box',
    background: defaultTheme.altBgSecondaryColor,
    color: defaultTheme.altFgPrimaryColor,
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
    color: defaultTheme.altFgPrimaryColor,
    ':focus': {
      border: 'none',
      outline: 'none',
    },
    '::selection': {
      color: defaultTheme.altFgPrimaryColor,
      background: defaultTheme.selectionPrimaryColor,
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
