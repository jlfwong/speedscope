import {Profile} from '../lib/profile'
import {h, JSX, ComponentChild, Ref} from 'preact'
import {useCallback, useState, useMemo, useEffect, useRef} from 'preact/hooks'
import {StyleSheet, css} from 'aphrodite'
import {ZIndex, Sizes, FontSize} from './style'
import {fuzzyMatchStrings} from '../lib/fuzzy-find'
import {sortBy, formatPercent} from '../lib/utils'
import {useTheme, withTheme} from './themes/theme'

enum SortField {
  NAME = 'name',
  WEIGHT = 'weight',
}

enum SortDirection {
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
}

interface SortMethod {
  field: SortField
  direction: SortDirection
}

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
  nodeRef?: Ref<HTMLTableRowElement>
  closeProfileSelect: () => void
  totalNonIdleWeightSum: number
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

function SortIcon({activeDirection}: {activeDirection: SortDirection | null}) {
  const theme = useTheme()
  const style = getStyle(theme)

  const upFill =
    activeDirection === SortDirection.ASCENDING ? theme.fgPrimaryColor : theme.fgSecondaryColor
  const downFill =
    activeDirection === SortDirection.DESCENDING ? theme.fgPrimaryColor : theme.fgSecondaryColor

  return (
    <svg
      width="8"
      height="10"
      viewBox="0 0 8 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={css(style.sortIcon)}
    >
      <path d="M0 4L4 0L8 4H0Z" fill={upFill} />
      <path d="M0 4L4 0L8 4H0Z" transform="translate(0 10) scale(1 -1)" fill={downFill} />
    </svg>
  )
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
  totalNonIdleWeightSum,
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
  const weight = profile.getTotalNonIdleWeight()
  const weightPerc = totalNonIdleWeightSum > 0 ? (100.0 * weight) / totalNonIdleWeightSum : 0

  const highlightedClassName = css(style.highlighted)
  const highlighted = useMemo(() => {
    const result = highlightRanges(name, matchedRanges, highlightedClassName)
    return result
  }, [name, matchedRanges, highlightedClassName])

  return (
    <tr
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
      <td className={css(style.nameCell)}>{highlighted}</td>
      <td className={css(style.weightCell)}>
        {profile.formatValue(weight)} ({formatPercent(weightPerc)})
      </td>
    </tr>
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

function getSortedFilteredProfiles(
  profiles: Profile[],
  filterText: string,
  sortMethod: SortMethod,
): FilteredProfile[] {
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

  // Apply sorting
  if (sortMethod.field === SortField.NAME) {
    filtered.sort((a, b) => {
      const nameA = a.profile.getName().toLowerCase()
      const nameB = b.profile.getName().toLowerCase()
      if (sortMethod.direction === SortDirection.ASCENDING) {
        return nameA.localeCompare(nameB)
      } else {
        return nameB.localeCompare(nameA)
      }
    })
  } else if (sortMethod.field === SortField.WEIGHT) {
    sortBy(filtered, p =>
      sortMethod.direction === SortDirection.ASCENDING
        ? p.profile.getTotalNonIdleWeight()
        : -p.profile.getTotalNonIdleWeight(),
    )
  } else {
    // Default to fuzzy search score
    sortBy(filtered, p => -p.score)
  }

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
  const [sortMethod, setSortMethod] = useState<SortMethod>({
    field: SortField.WEIGHT,
    direction: SortDirection.DESCENDING,
  })

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

  const onSortClick = useCallback(
    (field: SortField, ev: MouseEvent) => {
      ev.preventDefault()
      ev.stopPropagation()

      if (sortMethod.field === field) {
        // Toggle direction
        setSortMethod({
          field,
          direction:
            sortMethod.direction === SortDirection.ASCENDING
              ? SortDirection.DESCENDING
              : SortDirection.ASCENDING,
        })
      } else {
        // Set new field with default direction
        const direction =
          field === SortField.NAME ? SortDirection.ASCENDING : SortDirection.DESCENDING
        setSortMethod({field, direction})
      }
    },
    [sortMethod, setSortMethod],
  )

  const totalNonIdleWeightSum = useMemo(() => {
    return profiles.reduce((sum, profile) => sum + profile.getTotalNonIdleWeight(), 0)
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    return getSortedFilteredProfiles(profiles, filterText, sortMethod)
  }, [profiles, filterText, sortMethod])

  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(0)

  const selectedNodeRef = useRef<HTMLTableRowElement | null>(null)
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
    (hoveredNode: HTMLTableRowElement | null) => {
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
    (node: HTMLTableRowElement | null) => {
      selectedNodeRef.current = node
      hoveredNodeRef(node)
    },
    [selectedNodeRef, hoveredNodeRef],
  )

  const onNameClick = useCallback(
    (ev: MouseEvent) => onSortClick(SortField.NAME, ev),
    [onSortClick],
  )

  const onWeightClick = useCallback(
    (ev: MouseEvent) => onSortClick(SortField.WEIGHT, ev),
    [onSortClick],
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
          <table className={css(style.tableView)}>
            <thead className={css(style.tableHeader)}>
              <tr>
                <th className={css(style.nameHeaderCell)} onClick={onNameClick}>
                  <SortIcon
                    activeDirection={
                      sortMethod.field === SortField.NAME ? sortMethod.direction : null
                    }
                  />
                  Profile Name
                </th>
                <th className={css(style.weightHeaderCell)} onClick={onWeightClick}>
                  <SortIcon
                    activeDirection={
                      sortMethod.field === SortField.WEIGHT ? sortMethod.direction : null
                    }
                  />
                  Total Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map(
                ({profile, matchedRanges, indexInProfileGroup}, indexInList) => {
                  let ref: Ref<HTMLTableRowElement> | undefined = undefined
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
                      key={indexInList}
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
                      totalNonIdleWeightSum={totalNonIdleWeightSum}
                    />
                  )
                },
              )}
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={2} className={css(style.noResultsRow)}>
                    No results match filter "{filterText}"
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
    tableView: {
      width: '100%',
      fontSize: FontSize.LABEL,
      background: theme.altBgPrimaryColor,
      borderCollapse: 'collapse',
    },
    tableHeader: {
      borderBottom: `2px solid ${theme.altBgSecondaryColor}`,
      textAlign: 'left',
      color: theme.altFgPrimaryColor,
      userSelect: 'none',
    },
    nameHeaderCell: {
      cursor: 'pointer',
      padding: '8px 10px',
      textAlign: 'left',
      fontWeight: 'bold',
    },
    weightHeaderCell: {
      cursor: 'pointer',
      padding: '8px 10px',
      textAlign: 'right',
      fontWeight: 'bold',
      width: '150px',
    },
    sortIcon: {
      position: 'relative',
      top: 1,
      marginRight: 4,
    },
    profileRow: {
      height: Sizes.FRAME_HEIGHT - 2,
      background: theme.altBgPrimaryColor,
      cursor: 'pointer',
      ':hover': {
        background: theme.altBgSecondaryColor,
      },
    },
    profileRowHovered: {
      background: theme.altBgSecondaryColor,
    },
    profileRowSelected: {
      background: theme.selectionPrimaryColor,
      color: theme.altFgPrimaryColor,
    },
    profileRowEven: {
      background: theme.altBgSecondaryColor,
    },
    nameCell: {
      padding: '4px 10px',
      textAlign: 'left',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '300px',
    },
    weightCell: {
      padding: '4px 10px',
      textAlign: 'right',
      whiteSpace: 'nowrap',
      width: '150px',
      fontFamily: 'monospace',
    },
    noResultsRow: {
      padding: '20px',
      textAlign: 'center',
      color: theme.altFgSecondaryColor,
      fontStyle: 'italic',
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
      maxWidth: 600,
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
