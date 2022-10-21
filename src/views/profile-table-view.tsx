import {h, JSX, ComponentChild} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {Profile, Frame} from '../lib/profile'
import {formatPercent} from '../lib/utils'
import {FontSize, Sizes, commonStyle} from './style'
import {ColorChit} from './color-chit'
import {ListItem, ScrollableListView} from './scrollable-list-view'
import {createGetCSSColorForFrame, getFrameToColorBucket} from '../app-state/getters'
import {memo} from 'preact/compat'
import {useCallback, useMemo, useContext} from 'preact/hooks'
import {SandwichViewContext} from './sandwich-view'
import {Color} from '../lib/color'
import {useTheme, withTheme} from './themes/theme'
import {
  SortDirection,
  SortMethod,
  SortField,
  profileGroupAtom,
  tableSortMethodAtom,
  searchIsActiveAtom,
  searchQueryAtom,
} from '../app-state'
import {useAtom} from '../lib/atom'
import {ActiveProfileState} from '../app-state/active-profile-state'

interface HBarProps {
  perc: number
}

function HBarDisplay(props: HBarProps) {
  const style = getStyle(useTheme())

  return (
    <div className={css(style.hBarDisplay)}>
      <div className={css(style.hBarDisplayFilled)} style={{width: `${props.perc}%`}} />
    </div>
  )
}

interface SortIconProps {
  activeDirection: SortDirection | null
}

function SortIcon(props: SortIconProps) {
  const theme = useTheme()
  const style = getStyle(theme)

  const {activeDirection} = props
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

interface ProfileTableRowViewProps {
  frame: Frame
  matchedRanges: [number, number][] | null
  index: number
  profile: Profile
  selectedFrame: Frame | null
  setSelectedFrame: (f: Frame) => void
  getCSSColorForFrame: (frame: Frame) => string
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

const ProfileTableRowView = ({
  frame,
  matchedRanges,
  profile,
  index,
  selectedFrame,
  setSelectedFrame,
  getCSSColorForFrame,
}: ProfileTableRowViewProps) => {
  const style = getStyle(useTheme())

  const totalWeight = frame.getTotalWeight()
  const selfWeight = frame.getSelfWeight()
  const totalPerc = (100.0 * totalWeight) / profile.getTotalNonIdleWeight()
  const selfPerc = (100.0 * selfWeight) / profile.getTotalNonIdleWeight()

  const selected = frame === selectedFrame

  // We intentionally use index rather than frame.key here as the tr key
  // in order to re-use rows when sorting rather than creating all new elements.
  return (
    <tr
      key={`${index}`}
      onClick={setSelectedFrame.bind(null, frame)}
      className={css(
        style.tableRow,
        index % 2 == 0 && style.tableRowEven,
        selected && style.tableRowSelected,
      )}
    >
      <td className={css(style.numericCell)}>
        {profile.formatValue(totalWeight)} ({formatPercent(totalPerc)})
        <HBarDisplay perc={totalPerc} />
      </td>
      <td className={css(style.numericCell)}>
        {profile.formatValue(selfWeight)} ({formatPercent(selfPerc)})
        <HBarDisplay perc={selfPerc} />
      </td>
      <td title={frame.file} className={css(style.textCell)}>
        <ColorChit color={getCSSColorForFrame(frame)} />
        {matchedRanges
          ? highlightRanges(
              frame.name,
              matchedRanges,
              css(style.matched, selected && style.matchedSelected),
            )
          : frame.name}
      </td>
    </tr>
  )
}

interface ProfileTableViewProps {
  profile: Profile
  selectedFrame: Frame | null
  getCSSColorForFrame: (frame: Frame) => string
  sortMethod: SortMethod
  setSelectedFrame: (frame: Frame | null) => void
  setSortMethod: (sortMethod: SortMethod) => void
  searchQuery: string
  searchIsActive: boolean
}

export const ProfileTableView = memo(
  ({
    profile,
    sortMethod,
    setSortMethod,
    selectedFrame,
    setSelectedFrame,
    getCSSColorForFrame,
    searchQuery,
    searchIsActive,
  }: ProfileTableViewProps) => {
    const style = getStyle(useTheme())

    const onSortClick = useCallback(
      (field: SortField, ev: MouseEvent) => {
        ev.preventDefault()

        if (sortMethod.field == field) {
          // Toggle
          setSortMethod({
            field,
            direction:
              sortMethod.direction === SortDirection.ASCENDING
                ? SortDirection.DESCENDING
                : SortDirection.ASCENDING,
          })
        } else {
          // Set a sane default
          switch (field) {
            case SortField.SYMBOL_NAME: {
              setSortMethod({field, direction: SortDirection.ASCENDING})
              break
            }
            case SortField.SELF: {
              setSortMethod({field, direction: SortDirection.DESCENDING})
              break
            }
            case SortField.TOTAL: {
              setSortMethod({field, direction: SortDirection.DESCENDING})
              break
            }
          }
        }
      },
      [sortMethod, setSortMethod],
    )

    const sandwichContext = useContext(SandwichViewContext)

    const renderItems = useCallback(
      (firstIndex: number, lastIndex: number) => {
        if (!sandwichContext) return null

        const rows: JSX.Element[] = []

        for (let i = firstIndex; i <= lastIndex; i++) {
          const frame = sandwichContext.rowList[i]
          const match = sandwichContext.getSearchMatchForFrame(frame)
          rows.push(
            ProfileTableRowView({
              frame,
              matchedRanges: match == null ? null : match,
              index: i,
              profile: profile,
              selectedFrame: selectedFrame,
              setSelectedFrame: setSelectedFrame,
              getCSSColorForFrame: getCSSColorForFrame,
            }),
          )
        }

        if (rows.length === 0) {
          if (searchIsActive) {
            rows.push(
              <tr>
                <td className={css(style.emptyState)}>
                  No symbol names match query "{searchQuery}".
                </td>
              </tr>,
            )
          } else {
            rows.push(
              <tr>
                <td className={css(style.emptyState)}>No symbols found.</td>
              </tr>,
            )
          }
        }

        return <table className={css(style.tableView)}>{rows}</table>
      },
      [
        sandwichContext,
        profile,
        selectedFrame,
        setSelectedFrame,
        getCSSColorForFrame,
        searchIsActive,
        searchQuery,
        style.emptyState,
        style.tableView,
      ],
    )

    const listItems: ListItem[] = useMemo(
      () =>
        sandwichContext == null
          ? []
          : sandwichContext.rowList.map(f => ({size: Sizes.FRAME_HEIGHT})),
      [sandwichContext],
    )

    const onTotalClick = useCallback((ev: MouseEvent) => onSortClick(SortField.TOTAL, ev), [
      onSortClick,
    ])
    const onSelfClick = useCallback((ev: MouseEvent) => onSortClick(SortField.SELF, ev), [
      onSortClick,
    ])
    const onSymbolNameClick = useCallback(
      (ev: MouseEvent) => onSortClick(SortField.SYMBOL_NAME, ev),
      [onSortClick],
    )

    return (
      <div className={css(commonStyle.vbox, style.profileTableView)}>
        <table className={css(style.tableView)}>
          <thead className={css(style.tableHeader)}>
            <tr>
              <th className={css(style.numericCell)} onClick={onTotalClick}>
                <SortIcon
                  activeDirection={
                    sortMethod.field === SortField.TOTAL ? sortMethod.direction : null
                  }
                />
                Total
              </th>
              <th className={css(style.numericCell)} onClick={onSelfClick}>
                <SortIcon
                  activeDirection={
                    sortMethod.field === SortField.SELF ? sortMethod.direction : null
                  }
                />
                Self
              </th>
              <th className={css(style.textCell)} onClick={onSymbolNameClick}>
                <SortIcon
                  activeDirection={
                    sortMethod.field === SortField.SYMBOL_NAME ? sortMethod.direction : null
                  }
                />
                Symbol Name
              </th>
            </tr>
          </thead>
        </table>
        <ScrollableListView
          axis={'y'}
          items={listItems}
          className={css(style.scrollView)}
          renderItems={renderItems}
          initialIndexInView={
            selectedFrame == null ? null : sandwichContext?.getIndexForFrame(selectedFrame)
          }
        />
      </div>
    )
  },
)

const getStyle = withTheme(theme =>
  StyleSheet.create({
    profileTableView: {
      background: theme.bgPrimaryColor,
      height: '100%',
    },
    scrollView: {
      overflowY: 'auto',
      overflowX: 'hidden',
      flexGrow: 1,
      '::-webkit-scrollbar': {
        background: theme.bgPrimaryColor,
      },
      '::-webkit-scrollbar-thumb': {
        background: theme.fgSecondaryColor,
        borderRadius: 20,
        border: `3px solid ${theme.bgPrimaryColor}`,
        ':hover': {
          background: theme.fgPrimaryColor,
        },
      },
    },
    tableView: {
      width: '100%',
      fontSize: FontSize.LABEL,
      background: theme.bgPrimaryColor,
    },
    tableHeader: {
      borderBottom: `2px solid ${theme.bgSecondaryColor}`,
      textAlign: 'left',
      color: theme.fgPrimaryColor,
      userSelect: 'none',
    },
    sortIcon: {
      position: 'relative',
      top: 1,
      marginRight: Sizes.FRAME_HEIGHT / 4,
    },
    tableRow: {
      background: theme.bgPrimaryColor,
      height: Sizes.FRAME_HEIGHT,
    },
    tableRowEven: {
      background: theme.bgSecondaryColor,
    },
    tableRowSelected: {
      background: theme.selectionPrimaryColor,
      color: theme.altFgPrimaryColor,
    },
    numericCell: {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      position: 'relative',
      textAlign: 'right',
      paddingRight: Sizes.FRAME_HEIGHT,
      width: 6 * Sizes.FRAME_HEIGHT,
      minWidth: 6 * Sizes.FRAME_HEIGHT,
    },
    textCell: {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      maxWidth: 0,
    },
    hBarDisplay: {
      position: 'absolute',
      background: Color.fromCSSHex(theme.weightColor).withAlpha(0.2).toCSS(),
      bottom: 2,
      height: 2,
      width: `calc(100% - ${2 * Sizes.FRAME_HEIGHT}px)`,
      right: Sizes.FRAME_HEIGHT,
    },
    hBarDisplayFilled: {
      height: '100%',
      position: 'absolute',
      background: theme.weightColor,
      right: 0,
    },
    matched: {
      borderBottom: `2px solid ${theme.fgPrimaryColor}`,
    },
    matchedSelected: {
      borderColor: theme.altFgPrimaryColor,
    },
    emptyState: {
      textAlign: 'center',
      fontWeight: 'bold',
    },
  }),
)

interface ProfileTableViewContainerProps {
  activeProfileState: ActiveProfileState
}

export const ProfileTableViewContainer = memo((ownProps: ProfileTableViewContainerProps) => {
  const {activeProfileState} = ownProps
  const {profile, sandwichViewState} = activeProfileState
  if (!profile) throw new Error('profile missing')
  const tableSortMethod = useAtom(tableSortMethodAtom)
  const theme = useTheme()
  const {callerCallee} = sandwichViewState
  const selectedFrame = callerCallee ? callerCallee.selectedFrame : null
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getCSSColorForFrame = createGetCSSColorForFrame({theme, frameToColorBucket})

  const setSelectedFrame = useCallback((selectedFrame: Frame | null) => {
    profileGroupAtom.setSelectedFrame(selectedFrame)
  }, [])
  const searchIsActive = useAtom(searchIsActiveAtom)
  const searchQuery = useAtom(searchQueryAtom)

  return (
    <ProfileTableView
      profile={profile}
      selectedFrame={selectedFrame}
      getCSSColorForFrame={getCSSColorForFrame}
      sortMethod={tableSortMethod}
      setSelectedFrame={setSelectedFrame}
      setSortMethod={tableSortMethodAtom.set}
      searchIsActive={searchIsActive}
      searchQuery={searchQuery}
    />
  )
})
