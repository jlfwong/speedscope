import {Profile} from '../lib/profile'
import {h, JSX, ComponentChild, Ref} from 'preact'
import {useCallback, useState, useMemo, useEffect, useRef} from 'preact/hooks'
import {StyleSheet, css} from 'aphrodite'
import {ZIndex, Sizes} from './style'
import {fuzzyMatchStrings} from '../lib/fuzzy-find'
import {sortBy} from '../lib/utils'
import {useTheme, withTheme} from './themes/theme'

interface ProfileSelectRowProps {
  setProfileIndexToView: (profileIndex: number) => void
  setHoveredProfileIndex: (profileIndex: number) => void
  profile: Profile
  matchedRanges: [number, number][]
  hovered: boolean
  selected: boolean
  indexInProfileGroup: number
  indexInFilteredListView: number
  profileCount: number
  nodeRef?: Ref<HTMLDivElement>
  closeProfileSelect: () => void
}

function highlightRanges(
  text: string,
  ranges: [number, number][],
  highlightedClassName: string,
): JSX.Element {
  const spans: ComponentChild[] = []
  let last = 0
  for (let range of ranges) {
    spans.push(text.slice(last, range[0]))
    spans.push(<span className={highlightedClassName}>{text.slice(range[0], range[1])}</span>)
    last = range[1]
  }
  spans.push(text.slice(last))

  return <span>{spans}</span>
}

export function ProfileSelectRow({
  setProfileIndexToView,
  setHoveredProfileIndex,
  profile,
  selected,
  hovered,
  profileCount,
  nodeRef,
  closeProfileSelect,
  indexInProfileGroup,
  matchedRanges,
  indexInFilteredListView,
}: ProfileSelectRowProps) {
  const style = getStyle(useTheme())

  const onMouseUp = useCallback(() => {
    closeProfileSelect()
    setProfileIndexToView(indexInProfileGroup)
  }, [closeProfileSelect, setProfileIndexToView, indexInProfileGroup])

  const onMouseEnter = useCallback(
    (ev: Event) => {
      setHoveredProfileIndex(indexInProfileGroup)
    },
    [setHoveredProfileIndex, indexInProfileGroup],
  )

  const name = profile.getName()

  const maxDigits = 1 + Math.floor(Math.log10(profileCount))

  const highlightedClassName = css(style.highlighted)
  const highlighted = useMemo(() => {
    const result = highlightRanges(name, matchedRanges, highlightedClassName)
    return result
  }, [name, matchedRanges, highlightedClassName])

  // TODO(jlfwong): There's a really gnarly edge-case here where the highlighted
  // ranges are part of the text truncated by ellipsis. I'm just going to punt
  // on solving for that.
  return (
    <div
      ref={nodeRef}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      title={name}
      className={css(
        style.profileRow,
        indexInFilteredListView % 2 === 0 && style.profileRowEven,
        selected && style.profileRowSelected,
        hovered && style.profileRowHovered,
      )}
    >
      <span
        className={css(style.profileIndex, selected && style.profileIndexSelected)}
        style={{width: maxDigits + 'em'}}
      >
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
  const style = getStyle(useTheme())

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
          node.select()
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

  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(0)

  const selectedNodeRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (visible) {
      // Whenever the profile select becomes visible...

      // Clear any hovered element
      setHoveredProfileIndex(null)

      // And scroll the selected profile into view, if possible
      if (selectedNodeRef.current !== null) {
        selectedNodeRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        })
      }
    }
  }, [visible])

  // TODO(jlfwong): Hi-jacking the behavior of enter and the arrow keys won't
  // work well for some composition methods (e.g. a Chinese character
  // composition keyboard input method).
  const onFilterKeyUp = useCallback(
    (ev: KeyboardEvent) => {
      // Prevent the key-press from propagating to other keyboard shortcut
      // handlers in other components.
      ev.stopPropagation()

      let newHoveredIndexInFilteredList: number | null = null

      switch (ev.key) {
        case 'Enter': {
          if (hoveredProfileIndex != null) {
            closeProfileSelect()
            setProfileIndexToView(hoveredProfileIndex)
          }
          break
        }
        case 'Escape': {
          closeProfileSelect()
          break
        }
        case 'ArrowDown': {
          ev.preventDefault()
          newHoveredIndexInFilteredList = 0
          if (hoveredProfileIndex != null) {
            const indexInFilteredList = filteredProfiles.findIndex(
              p => p.indexInProfileGroup === hoveredProfileIndex,
            )
            if (indexInFilteredList !== -1) {
              newHoveredIndexInFilteredList = indexInFilteredList + 1
            }
          }
          break
        }
        case 'ArrowUp': {
          ev.preventDefault()
          newHoveredIndexInFilteredList = filteredProfiles.length - 1
          if (hoveredProfileIndex != null) {
            const indexInFilteredList = filteredProfiles.findIndex(
              p => p.indexInProfileGroup === hoveredProfileIndex,
            )
            if (indexInFilteredList !== -1) {
              newHoveredIndexInFilteredList = indexInFilteredList - 1
            }
          }
          break
        }
      }

      if (
        newHoveredIndexInFilteredList != null &&
        newHoveredIndexInFilteredList >= 0 &&
        newHoveredIndexInFilteredList < filteredProfiles.length
      ) {
        const indexInProfileGroup =
          filteredProfiles[newHoveredIndexInFilteredList].indexInProfileGroup
        setHoveredProfileIndex(indexInProfileGroup)
        setPendingForcedScroll(true)
      }
    },
    [closeProfileSelect, setProfileIndexToView, hoveredProfileIndex, filteredProfiles],
  )

  const [pendingForcedScroll, setPendingForcedScroll] = useState(false)
  useEffect(() => {
    // Whenever the list of filtered profiles changes, set the first element hovered.
    if (filteredProfiles.length > 0) {
      setHoveredProfileIndex(filteredProfiles[0].indexInProfileGroup)
      setPendingForcedScroll(true)
    }
  }, [setHoveredProfileIndex, filteredProfiles])

  const hoveredNodeRef = useCallback(
    (hoveredNode: HTMLDivElement | null) => {
      if (pendingForcedScroll && hoveredNode) {
        hoveredNode.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        })
        setPendingForcedScroll(false)
      }
    },
    [pendingForcedScroll, setPendingForcedScroll],
  )

  const selectedHoveredRef = useCallback(
    (node: HTMLDivElement | null) => {
      selectedNodeRef.current = node
      hoveredNodeRef(node)
    },
    [selectedNodeRef, hoveredNodeRef],
  )

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
            className={css(style.filterInput)}
            ref={focusFilterInput}
            placeholder={'Filter...'}
            value={filterText}
            onInput={onFilterTextChange}
            onKeyDown={onFilterKeyUp}
            onKeyUp={stopPropagation}
            onKeyPress={stopPropagation}
          />
        </div>
        <div className={css(style.profileSelectScrolling)}>
          {filteredProfiles.map(({profile, matchedRanges, indexInProfileGroup}, indexInList) => {
            let ref: Ref<HTMLDivElement> | undefined = undefined
            const selected = indexInProfileGroup === indexToView
            const hovered = indexInProfileGroup === hoveredProfileIndex
            if (selected && hovered) {
              ref = selectedHoveredRef
            } else if (selected) {
              ref = selectedNodeRef
            } else if (hovered) {
              ref = hoveredNodeRef
            }
            return (
              <ProfileSelectRow
                setHoveredProfileIndex={setHoveredProfileIndex}
                indexInProfileGroup={indexInProfileGroup}
                indexInFilteredListView={indexInList}
                hovered={indexInProfileGroup == hoveredProfileIndex}
                selected={indexInProfileGroup === indexToView}
                profile={profile}
                profileCount={profiles.length}
                nodeRef={ref}
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

const getStyle = withTheme(theme =>
  StyleSheet.create({
    filterInputContainer: {
      display: 'flex',
      flexDirection: 'column',
      padding: 5,
      alignItems: 'stretch',
    },
    filterInput: {
      color: theme.altFgPrimaryColor,
      background: theme.altBgSecondaryColor,
      borderRadius: 5,
      padding: 5,
      ':focus': {
        border: 'none',
        outline: 'none',
      },
      '::selection': {
        color: theme.altFgPrimaryColor,
        background: theme.selectionPrimaryColor,
      },
    },
    caret: {
      width: 0,
      height: 0,
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderBottom: '5px solid black',
    },
    highlighted: {
      background: theme.selectionSecondaryColor,
    },
    padding: {
      height: paddingHeight,
      background: theme.altBgPrimaryColor,
    },
    profileRow: {
      height: Sizes.FRAME_HEIGHT - 2,
      border: '1px solid transparent',
      textAlign: 'left',
      paddingLeft: 10,
      paddingRight: 10,
      background: theme.altBgPrimaryColor,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
    },
    profileRowHovered: {
      border: `1px solid ${theme.selectionPrimaryColor}`,
    },
    profileRowSelected: {
      background: theme.selectionPrimaryColor,
    },
    profileRowEven: {
      background: theme.altBgSecondaryColor,
    },
    profileSelectScrolling: {
      maxHeight: `min(calc(100vh - ${Sizes.TOOLBAR_HEIGHT - 2 * paddingHeight}px), ${
        20 * Sizes.FRAME_HEIGHT
      }px)`,
      overflow: 'auto',
      '::-webkit-scrollbar': {
        background: theme.altBgPrimaryColor,
      },
      '::-webkit-scrollbar-thumb': {
        background: theme.altFgSecondaryColor,
        borderRadius: 20,
        border: `3px solid ${theme.altBgPrimaryColor}`,
        ':hover': {
          background: theme.altBgPrimaryColor,
        },
      },
    },
    profileSelectBox: {
      width: '100%',
      paddingBottom: 10,
      background: theme.altBgPrimaryColor,
      color: theme.altFgPrimaryColor,
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
      color: theme.altFgSecondaryColor,
    },
    profileIndexSelected: {
      color: theme.altFgPrimaryColor,
    },
  }),
)
