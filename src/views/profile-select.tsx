import {Profile} from '../lib/profile'
import {h} from 'preact'
import {useCallback, useState, useEffect} from 'preact/hooks'
import {StyleSheet, css} from 'aphrodite'
import {Colors, ZIndex, Sizes} from './style'

interface ProfileSelectRowProps {
  setProfileIndexToView: (profileIndex: number) => void
  profile: Profile
  selected: boolean
  indexInProfileGroup: number
  indexInFilteredListView: number
  profileCount: number
  selectIsVisible: boolean
  closeProfileSelect: () => void
}

export function ProfileSelectRow({
  setProfileIndexToView,
  profile,
  selected,
  profileCount,
  selectIsVisible,
  closeProfileSelect,
  indexInProfileGroup,
  indexInFilteredListView: indexInListView,
}: ProfileSelectRowProps) {
  const onMouseUp = useCallback(() => {
    closeProfileSelect()
    setProfileIndexToView(indexInProfileGroup)
  }, [closeProfileSelect, setProfileIndexToView, indexInProfileGroup])

  const scrollIntoView = useCallback(
    (node: HTMLElement | null) => {
      if (selectIsVisible && node && selected) {
        requestAnimationFrame(() => {
          node.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'nearest',
          })
        })
      }
    },
    [selected, selectIsVisible],
  )

  const name = profile.getName()

  const maxDigits = 1 + Math.floor(Math.log10(profileCount))

  return (
    <div
      ref={scrollIntoView}
      onMouseUp={onMouseUp}
      title={name}
      className={css(
        style.profileRow,
        indexInListView % 2 === 0 && style.profileRowEven,
        selected && style.profileRowSelected,
      )}
    >
      <span className={css(style.profileIndex)} style={{width: maxDigits + 'em'}}>
        {indexInProfileGroup + 1}:
      </span>{' '}
      {name}
    </div>
  )
}

interface ProfileSelectProps {
  setProfileIndexToView: (profileIndex: number) => void
  indexToView: number
  profiles: Profile[]
  closeProfileSelect: () => void
  visible: boolean
}

function stopPropagation(ev: Event) {
  ev.stopPropagation()
}

function profileSatisfiesFilter(profile: Profile, filterText: string) {
  if (filterText.length === 0) return true
  return profile.getName().indexOf(filterText) !== -1
}

export function ProfileSelect({
  profiles,
  closeProfileSelect,
  indexToView,
  visible,
  setProfileIndexToView,
}: ProfileSelectProps) {
  const [filterText, setFilterText] = useState('')

  const onFilterTextChange = useCallback(
    (ev: Event) => {
      const value = (ev.target as HTMLInputElement).value
      setFilterText(value)
    },
    [setFilterText],
  )

  const focusFilterInput = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) {
        if (visible) {
          node.focus()
        } else {
          node.blur()
        }
      }
    },
    [visible],
  )

  // We allow ProfileSelect to be aware of its own visibility in order to retain
  // its scroll offset state between times when it's hidden & shown, and also to
  // scroll the selected node into view once it becomes shown again after the
  // selected profile has changed.
  let indexInList = 0
  return (
    <div className={css(style.profileSelectOuter)}>
      <div className={css(style.caret)} />
      <div className={css(style.profileSelectBox)}>
        {/* We stop event propagation for key events on the input to prevent
            this from triggering keyboard shortcuts. */}
        <div className={css(style.filterInputContainer)}>
          <input
            type="text"
            ref={focusFilterInput}
            placeholder={'Filter...'}
            value={filterText}
            onInput={onFilterTextChange}
            onKeyDown={stopPropagation}
            onKeyUp={stopPropagation}
            onKeyPress={stopPropagation}
          />
        </div>
        <div className={css(style.profileSelectScrolling)}>
          {profiles.map((profile, i) => {
            if (!profileSatisfiesFilter(profile, filterText)) return null
            return (
              <ProfileSelectRow
                indexInProfileGroup={i}
                indexInFilteredListView={indexInList++}
                selected={i === indexToView}
                profile={profile}
                profileCount={profiles.length}
                selectIsVisible={visible}
                setProfileIndexToView={setProfileIndexToView}
                closeProfileSelect={closeProfileSelect}
              />
            )
          })}
          {indexInList === 0 ? (
            <div className={css(style.profileRow)}>No results match filter "{filterText}"</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const paddingHeight = 10

const style = StyleSheet.create({
  filterInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    alignItems: 'stretch',
  },
  caret: {
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: '5px solid black',
  },
  padding: {
    height: paddingHeight,
    background: Colors.BLACK,
  },
  profileRow: {
    height: Sizes.FRAME_HEIGHT - 2,
    border: '1px solid transparent',
    textAlign: 'left',
    paddingLeft: 10,
    paddingRight: 10,
    background: Colors.BLACK,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    ':hover': {
      border: `1px solid ${Colors.DARK_BLUE}`,
    },
  },
  profileRowSelected: {
    background: Colors.DARK_BLUE,
  },
  profileRowEven: {
    background: Colors.DARK_GRAY,
  },
  profileSelectScrolling: {
    maxHeight: `min(calc(100vh - ${Sizes.TOOLBAR_HEIGHT - 2 * paddingHeight}px), ${
      20 * Sizes.FRAME_HEIGHT
    }px)`,
    overflow: 'auto',
  },
  profileSelectBox: {
    width: '100%',
    paddingBottom: 10,
    background: Colors.BLACK,
    color: Colors.WHITE,
  },
  profileSelectOuter: {
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
    position: 'relative',
    zIndex: ZIndex.PROFILE_SELECT,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  profileIndex: {
    textAlign: 'right',
    display: 'inline-block',
    color: Colors.LIGHT_GRAY,
  },
})
