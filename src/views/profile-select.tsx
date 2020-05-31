import {Profile} from '../lib/profile'
import {h, JSX, ComponentChild} from 'preact'
import {useCallback, useState, useMemo} from 'preact/hooks'
import {StyleSheet, css} from 'aphrodite'
import {Colors, ZIndex, Sizes} from './style'
import {fuzzyMatchStrings} from '../lib/fuzzy-find'
import {sortBy} from '../lib/utils'

interface ProfileSelectRowProps {
  setProfileIndexToView: (profileIndex: number) => void
  profile: Profile
  matchedRanges: [number, number][]
  selected: boolean
  indexInProfileGroup: number
  indexInFilteredListView: number
  profileCount: number
  selectIsVisible: boolean
  closeProfileSelect: () => void
}

function highlightRanges(text: string, ranges: [number, number][]): JSX.Element {
  const spans: ComponentChild[] = []
  let last = 0
  for (let range of ranges) {
    spans.push(text.slice(last, range[0]))
    spans.push(<span className={css(style.highlighted)}>{text.slice(range[0], range[1])}</span>)
    last = range[1]
  }
  spans.push(text.slice(last))

  return <span>{spans}</span>
}

export function ProfileSelectRow({
  setProfileIndexToView,
  profile,
  selected,
  profileCount,
  selectIsVisible,
  closeProfileSelect,
  indexInProfileGroup,
  matchedRanges,
  indexInFilteredListView: indexInListView,
}: ProfileSelectRowProps) {
  const onMouseUp = useCallback(() => {
    closeProfileSelect()
    setProfileIndexToView(indexInProfileGroup)
  }, [closeProfileSelect, setProfileIndexToView, indexInProfileGroup])

  const scrollIntoView = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      let shouldScrollIntoView = false

      if (matchedRanges.length === 0 && selectIsVisible && selected) {
        // When the given row has no matched ranges, it means there's no active
        // filter query. If that's the case, then we should scroll whatever is
        // currently selected into view.
        shouldScrollIntoView = true
      } else if (matchedRanges.length > 0 && indexInListView === 0) {
        // When we *do* have filtered matches, we should make sure the best
        // match is in view, even if we've previous scrolled.
        shouldScrollIntoView = true
      }

      if (shouldScrollIntoView) {
        requestAnimationFrame(() => {
          node.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'nearest',
          })
        })
      }
    },
    [selected, selectIsVisible, matchedRanges, indexInListView],
  )

  const name = profile.getName()

  const maxDigits = 1 + Math.floor(Math.log10(profileCount))

  const highlighted = useMemo(() => {
    const result = highlightRanges(name, matchedRanges)
    return result
  }, [name, matchedRanges])

  // TODO(jlfwong): There's a really gnarly edge-case here where the highlighted
  // ranges are part of the text truncated by ellipsis. I'm just going to punt
  // on solving for that.
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
      {highlighted}
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

interface FilteredProfile {
  indexInProfileGroup: number
  profile: Profile
  matchedRanges: [number, number][]
  score: number
}

function getSortedFilteredProfiles(profiles: Profile[], filterText: string): FilteredProfile[] {
  const filtered: FilteredProfile[] = []
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]
    const match = fuzzyMatchStrings(profile.getName(), filterText)
    if (!match) continue
    filtered.push({
      indexInProfileGroup: i,
      profile,
      ...match,
    })
  }
  sortBy(filtered, p => -p.score)
  return filtered
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

  const filteredProfiles = useMemo(() => {
    return getSortedFilteredProfiles(profiles, filterText)
  }, [profiles, filterText])

  // We allow ProfileSelect to be aware of its own visibility in order to retain
  // its scroll offset state between times when it's hidden & shown, and also to
  // scroll the selected node into view once it becomes shown again after the
  // selected profile has changed.
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
          {filteredProfiles.map(({profile, matchedRanges, indexInProfileGroup}, indexInList) => {
            return (
              <ProfileSelectRow
                indexInProfileGroup={indexInProfileGroup}
                indexInFilteredListView={indexInList}
                selected={indexInProfileGroup === indexToView}
                profile={profile}
                profileCount={profiles.length}
                selectIsVisible={visible}
                matchedRanges={matchedRanges}
                setProfileIndexToView={setProfileIndexToView}
                closeProfileSelect={closeProfileSelect}
              />
            )
          })}
          {filteredProfiles.length === 0 ? (
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
  highlighted: {
    background: Colors.PALE_DARK_BLUE,
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
