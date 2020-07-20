import {StyleSheet, css} from 'aphrodite'
import {h} from 'preact'
import {useCallback, useRef, useEffect} from 'preact/hooks'
import {memo} from 'preact/compat'
import {Sizes, Colors, FontSize} from './style'

function stopPropagation(ev: Event) {
  ev.stopPropagation()
}

export interface SearchViewProps {
  searchQuery: string
  searchIsActive: boolean

  setSearchQuery: (query: string) => void
  setSearchIsActive: (active: boolean) => void
}

export const SearchView = memo(
  ({searchQuery, setSearchQuery, searchIsActive, setSearchIsActive}: SearchViewProps) => {
    const onInput = useCallback(
      (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value
        setSearchQuery(value)
      },
      [setSearchQuery],
    )

    const inputRef = useRef<HTMLInputElement | null>(null)

    const onKeyDown = useCallback(
      (ev: KeyboardEvent) => {
        ev.stopPropagation()

        // Hitting Esc should close the search box
        if (ev.key === 'Escape') {
          setSearchIsActive(false)
        }

        if (ev.key == 'f' && (ev.metaKey || ev.ctrlKey)) {
          // It seems like when an input is focused, the browser find menu pops
          // up without this line. It seems like it's not sufficient to only
          // preventDefault in the window keydown handler.
          ev.preventDefault()
        }
      },
      [setSearchIsActive],
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

    const close = useCallback(() => setSearchIsActive(false), [setSearchIsActive])

    if (!searchIsActive) return null

    return (
      <div className={css(style.searchView)}>
        <span className={css(style.icon)}>🔍</span>
        <input
          className={css(style.input)}
          value={searchQuery}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          ref={inputRef}
        />

        <svg
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
    width: 150,
    borderWidth: 2,
    borderColor: Colors.BLACK,
    borderStyle: 'solid',
    fontSize: FontSize.LABEL,
    boxSizing: 'border-box',
    background: Colors.DARK_GRAY,
    color: Colors.WHITE,
    display: 'flex',
  },
  input: {
    border: 'none',
    background: 'none',
    fontSize: FontSize.LABEL,
    flex: 1,
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
  icon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    paddingTop: '0px',
    margin: '0 2px 0 4px',
  },
})
