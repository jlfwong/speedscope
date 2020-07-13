import {StyleSheet, css} from 'aphrodite'
import {h} from 'preact'
import {useCallback, useRef} from 'preact/hooks'
import {memo} from 'preact/compat'
import {Sizes, Colors} from './style'
import {useWindowListener} from '../lib/preact-utils'

function stopPropagation(ev: Event) {
  ev.stopPropagation()
}

interface SearchViewProps {
  searchQuery: string
  searchIsActive: boolean

  setSearchQuery: (query: string | null) => void
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

        if (ev.key === 'Escape') {
          setSearchIsActive(false)
        }
      },
      [setSearchQuery],
    )

    useWindowListener(
      'keydown',
      (ev: KeyboardEvent) => {
        if (ev.key == 'f' && (ev.metaKey || ev.ctrlKey)) {
          // Prevent the browser's search menu from appearing
          ev.preventDefault()

          if (inputRef.current) {
            inputRef.current.select()
          } else {
            setSearchIsActive(true)
          }
        }
      },
      [searchQuery, setSearchQuery],
    )

    const focusInput = useCallback((node: HTMLInputElement | null) => {
      if (node) {
        requestAnimationFrame(() => {
          node.select()
        })
      }
      inputRef.current = node
    }, [])

    if (!searchIsActive) return null

    return (
      <div className={css(style.searchView)}>
        <input
          className={css(style.input)}
          value={searchQuery}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          ref={focusInput}
        />
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
    boxSizing: 'border-box',
    background: Colors.DARK_GRAY,
    color: Colors.WHITE,
    display: 'flex',
  },
  input: {
    border: 'none',
    background: 'none',
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
})
