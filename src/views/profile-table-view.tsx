import {h, Component, JSX, ComponentChild} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {Profile, Frame} from '../lib/profile'
import {formatPercent} from '../lib/utils'
import {FontSize, Sizes, commonStyle, defaultTheme} from './style'
import {ColorChit} from './color-chit'
import {ListItem, ScrollableListView} from './scrollable-list-view'
import {actions} from '../store/actions'
import {createGetCSSColorForFrame, getFrameToColorBucket} from '../store/getters'
import {useActionCreator} from '../lib/preact-redux'
import {useAppSelector, ActiveProfileState} from '../store'
import {memo} from 'preact/compat'
import {useCallback, useMemo, useContext} from 'preact/hooks'
import {SandwichViewContext} from './sandwich-view'
import { Color } from '../lib/color'

export enum SortField {
  SYMBOL_NAME,
  SELF,
  TOTAL,
}

export enum SortDirection {
  ASCENDING,
  DESCENDING,
}

export interface SortMethod {
  field: SortField
  direction: SortDirection
}

interface HBarProps {
  perc: number
}

function HBarDisplay(props: HBarProps) {
  return (
    <div className={css(style.hBarDisplay)}>
      <div className={css(style.hBarDisplayFilled)} style={{width: `${props.perc}%`}} />
    </div>
  )
}

interface SortIconProps {
  activeDirection: SortDirection | null
}

class SortIcon extends Component<SortIconProps, {}> {
  render() {
    const {activeDirection} = this.props
    const upFill = activeDirection === SortDirection.ASCENDING ? defaultTheme.fgPrimaryColor : defaultTheme.fgSecondaryColor
    const downFill = activeDirection === SortDirection.DESCENDING ? defaultTheme.fgPrimaryColor : defaultTheme.fgSecondaryColor

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
              matchedRanges: match == null ? null : match.matchedRanges,
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

const style = StyleSheet.create({
  profileTableView: {
    background: defaultTheme.bgPrimaryColor,
    height: '100%',
  },
  scrollView: {
    overflowY: 'auto',
    overflowX: 'hidden',
    flexGrow: 1,
    '::-webkit-scrollbar': {
      background: defaultTheme.bgPrimaryColor,
    },
    '::-webkit-scrollbar-thumb': {
      background: defaultTheme.fgSecondaryColor,
      borderRadius: 20,
      border: `3px solid ${defaultTheme.bgPrimaryColor}`,
      ':hover': {
        background: defaultTheme.fgPrimaryColor,
      },
    },
  },
  tableView: {
    width: '100%',
    fontSize: FontSize.LABEL,
    background: defaultTheme.bgPrimaryColor,
  },
  tableHeader: {
    borderBottom: `2px solid ${defaultTheme.bgSecondaryColor}`,
    textAlign: 'left',
    color: defaultTheme.fgPrimaryColor,
    userSelect: 'none',
  },
  sortIcon: {
    position: 'relative',
    top: 1,
    marginRight: Sizes.FRAME_HEIGHT / 4,
  },
  tableRow: {
    background: defaultTheme.bgPrimaryColor,
    height: Sizes.FRAME_HEIGHT,
  },
  tableRowEven: {
    background: defaultTheme.bgSecondaryColor,
  },
  tableRowSelected: {
    background: defaultTheme.selectionPrimaryColor,
    color: defaultTheme.altFgPrimaryColor,
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
    background: Color.fromCSSHex(defaultTheme.weightColor).withAlpha(0.2).toCSS(),
    bottom: 2,
    height: 2,
    width: `calc(100% - ${2 * Sizes.FRAME_HEIGHT}px)`,
    right: Sizes.FRAME_HEIGHT,
  },
  hBarDisplayFilled: {
    height: '100%',
    position: 'absolute',
    background: defaultTheme.weightColor,
    right: 0,
  },
  matched: {
    borderBottom: `2px solid ${defaultTheme.fgPrimaryColor}`,
  },
  matchedSelected: {
    borderColor: defaultTheme.altFgPrimaryColor,
  },
  emptyState: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
})

interface ProfileTableViewContainerProps {
  activeProfileState: ActiveProfileState
}

const {setTableSortMethod} = actions.sandwichView

export const ProfileTableViewContainer = memo((ownProps: ProfileTableViewContainerProps) => {
  const {activeProfileState} = ownProps
  const {profile, sandwichViewState, index} = activeProfileState
  if (!profile) throw new Error('profile missing')
  const tableSortMethod = useAppSelector(state => state.tableSortMethod, [])
  const {callerCallee} = sandwichViewState
  const selectedFrame = callerCallee ? callerCallee.selectedFrame : null
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

  const setSelectedFrame = useActionCreator(
    (selectedFrame: Frame | null) => {
      return actions.sandwichView.setSelectedFrame({profileIndex: index, args: selectedFrame})
    },
    [index],
  )
  const setSortMethod = useActionCreator(setTableSortMethod, [])
  const searchIsActive = useAppSelector(state => state.searchIsActive, [])
  const searchQuery = useAppSelector(state => state.searchQuery, [])

  return (
    <ProfileTableView
      profile={profile}
      selectedFrame={selectedFrame}
      getCSSColorForFrame={getCSSColorForFrame}
      sortMethod={tableSortMethod}
      setSelectedFrame={setSelectedFrame}
      setSortMethod={setSortMethod}
      searchIsActive={searchIsActive}
      searchQuery={searchQuery}
    />
  )
})
