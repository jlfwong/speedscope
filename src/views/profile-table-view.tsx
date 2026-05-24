import {ComponentChild, createContext, h, JSX} from 'preact'
import {css, StyleSheet} from 'aphrodite'
import {Frame, Profile} from '../lib/profile'
import {formatPercent, sortBy} from '../lib/utils'
import {commonStyle, FontSize, Sizes, ZIndex} from './style'
import {ColorChit} from './color-chit'
import {ListItem, ScrollableListView} from './scrollable-list-view'
import {createGetCSSColorForFrame, getFrameToColorBucket} from '../app-state/getters'
import {memo} from 'preact/compat'
import {useCallback, useContext, useMemo, useState} from 'preact/hooks'
import {BAS_COLOR, Color, REG_COLOR} from '../lib/color'
import {useTheme, withTheme} from './themes/theme'
import {
  diffModeAtom,
  nameAlignRightAtom,
  profileGroupAtom,
  searchIsActiveAtom,
  searchQueryAtom,
  selectedFrameNameAtom,
  SortDirection,
  SortField,
  SortMethod,
  tableSortMethodAtom,
  viewModeAtom
} from '../app-state'
import {useAtom} from '../lib/atom'
import {ActiveProfileState} from '../app-state/active-profile-state'
import {ProfileSearchContext} from './search-view'
import {ViewMode} from '../lib/view-mode'
import {FlamechartEventCallback} from './flamechart-pan-zoom-view'
import {prettyPrintNumber} from '../lib/value-formatters'

interface HBarProps {
  perc: number
}

function HBarDisplay(props: HBarProps) {
  const style = getStyle(useTheme())

  return (
          <div className={css(style.hBarDisplay)}>
            <div className={css(style.hBarDisplayFilled)} style={{width: `${props.perc}%`}}/>
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
            <path d="M0 4L4 0L8 4H0Z" fill={upFill}/>
            <path d="M0 4L4 0L8 4H0Z" transform="translate(0 10) scale(1 -1)" fill={downFill}/>
          </svg>
  )
}

export interface TableContextData {
  rowList: Frame[]
  selectedFrame: Frame | null
  setSelectedFrame: (frame: Frame | null) => void
  getIndexForFrame: (frame: Frame) => number | null
  getSearchMatchForFrame: (frame: Frame) => [number, number][] | null
}

export const TableViewContext = createContext<TableContextData | null>(null)

interface ProfileTableRowViewProps {
  frame: Frame
  matchedRanges: [number, number][] | null
  index: number
  profile: Profile
  selectedFrame: Frame | null
  setSelectedFrame: (f: Frame) => void
  getCSSColorForFrame: (frame: Frame) => string
  setCopied: (f: boolean) => void
  diffMode: boolean
  nameAlignRight: boolean
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

export const CopiedNotification = () => (
        <div
                style={{
                  fontSize: "12px",
                  position: "fixed",
                  Top: "20px",
                  left: "50%",
                  transform: "translate(-50%)",
                  background: "rgba(0, 0, 0, 0.8)",
                  color: "#fff",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 10px 24px rgba(0,0,0,.35)",
                  padding: "6px 12px",
                  zIndex: ZIndex.INFO
                }}
        >
          Copied!
        </div>
)

const ProfileTableRowView = ({
                               frame,
                               matchedRanges,
                               profile,
                               index,
                               selectedFrame,
                               setSelectedFrame,
                               getCSSColorForFrame,
                               setCopied,
                               diffMode,
                               nameAlignRight
                             }: ProfileTableRowViewProps) => {
  const theme = useTheme();
  const style = getStyle(theme);

  const count = profile.getNameCount(frame.name)
  const totalWeight = frame.getTotalWeight();
  const selfWeight = frame.getSelfWeight();
  const regTotalWeight = frame.getRegTotalWeight();
  const regSelfWeight = frame.getRegSelfWeight();
  const totalPerc = (100.0 * totalWeight) / profile.getTotalNonIdleWeight();
  const selfPerc = (100.0 * selfWeight) / profile.getTotalNonIdleWeight();
  const regTotalPerc = (100.0 * regTotalWeight) / profile.getTotalNonIdleRegWeight();
  const regSelfPerc = (100.0 * regSelfWeight) / profile.getTotalNonIdleRegWeight();
  const selected = frame.name === selectedFrame?.name;

  // Diff calculations - use theme's colorForDiffRatio for consistency with flamegraph
  const diffRatio = frame.getDiffRatio();
  const diffPercent = Math.abs(diffRatio * 100);
  const diffSign = diffRatio >= 0 ? '+' : '-';
  const encodedRatio = (diffRatio + 1) / 2;
  const diffColor = diffRatio !== 0 ? theme.colorForDiffRatio(encodedRatio).toCSS() : 'inherit';

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(frame.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSingleValue = (value: number, perc: number) => {
    if (value === 0 || perc === 0) return '0';
    const formattedValue = profile.formatValue(value);
    return `${formattedValue} (${formatPercent(perc)})`;
  };

  const formatDiffValue = (basValue: number, regValue: number, basPerc: number, regPerc: number) => {
    if (!diffMode) return formatSingleValue(basValue, basPerc);
    const basStr = formatSingleValue(basValue, basPerc);
    const regStr = formatSingleValue(regValue, regPerc);
    if (!basStr && !regStr) return '';
    const leftStr = profile.isInverted() ? regStr : basStr;
    const rightStr = profile.isInverted() ? basStr : regStr;
    const leftColor = profile.isInverted() ? REG_COLOR : BAS_COLOR;
    const rightColor = profile.isInverted() ? BAS_COLOR : REG_COLOR;
    return (
            <span style={{display: 'inline-flex', width: '100%'}}>
        <span style={{color: leftColor, flex: 1, textAlign: 'right'}}>{leftStr}</span>
        <span style={{width: '1em', textAlign: 'center'}}>|</span>
        <span style={{color: rightColor, flex: 1, textAlign: 'left'}}>{rightStr}</span>
      </span>
    );
  };

  return (
          <tr
                  key={`${index}`}
                  onClick={setSelectedFrame.bind(null, frame)}
                  className={css(
                          style.tableRow,
                          index % 2 === 0 && style.tableRowEven,
                          selected && style.tableRowSelected,
                  )}
          >
            <td className={css(style.numericCountCell)}>
              {prettyPrintNumber(count)}
            </td>
            <td className={css(style.numericCell)}>
              {formatDiffValue(totalWeight, regTotalWeight, totalPerc, regTotalPerc)}
              <HBarDisplay perc={totalPerc}/>
            </td>
            <td className={css(style.numericCell)}>
              {formatDiffValue(selfWeight, regSelfWeight, selfPerc, regSelfPerc)}
              <HBarDisplay perc={selfPerc}/>
            </td>
            {diffMode && (
                    <td className={css(style.diffCell)} style={{color: diffColor}}>
                      {diffSign}{formatPercent(diffPercent)}
                    </td>
            )}
            <td
                    title={frame.file ? frame.file : frame.name}
                    className={css(style.textCell)}
                    onContextMenu={handleContextMenu}
            >
              <div className={css(style.textCellInner)}>
                <ColorChit color={getCSSColorForFrame(frame)}/>
                <span className={css(nameAlignRight ? style.textContentRight : style.textContent)}>
                  {matchedRanges
                          ? highlightRanges(
                                  frame.name,
                                  matchedRanges,
                                  css(style.matched, selected && style.matchedSelected),
                          )
                          : frame.name}
                </span>
              </div>
            </td>
          </tr>
  );
};

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
          const diffMode = useAtom(diffModeAtom) && profile.hasDiffData()
          const nameAlignRight = useAtom(nameAlignRightAtom)

          const [copied, setCopied] = useState(false);

          const toggleNameAlign = useCallback((ev: MouseEvent) => {
            ev.stopPropagation()
            nameAlignRightAtom.set(!nameAlignRight)
          }, [nameAlignRight])

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
                        case SortField.COUNT: {
                          setSortMethod({field, direction: SortDirection.DESCENDING})
                          break
                        }
                        case SortField.DIFF: {
                          setSortMethod({field, direction: SortDirection.DESCENDING})
                          break
                        }
                      }
                    }
                  },
                  [sortMethod, setSortMethod],
          )

          const displayedContext = useContext(TableViewContext)

          const renderItems = useCallback(
                  (firstIndex: number, lastIndex: number) => {
                    if (!displayedContext) return null

                    const rows: JSX.Element[] = []

                    for (let i = firstIndex; i <= lastIndex; i++) {
                      const frame = displayedContext.rowList[i]
                      const match = displayedContext.getSearchMatchForFrame(frame)
                      rows.push(
                              ProfileTableRowView({
                                frame,
                                matchedRanges: match == null ? null : match,
                                index: i,
                                profile: profile,
                                selectedFrame: selectedFrame,
                                setSelectedFrame: setSelectedFrame,
                                getCSSColorForFrame: getCSSColorForFrame,
                                setCopied: setCopied,
                                diffMode: diffMode,
                                nameAlignRight: nameAlignRight
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
                    displayedContext,
                    profile,
                    selectedFrame,
                    setSelectedFrame,
                    getCSSColorForFrame,
                    searchIsActive,
                    searchQuery,
                    style.emptyState,
                    style.tableView,
                    diffMode,
                    nameAlignRight,
                  ],
          )

          const listItems: ListItem[] = useMemo(
                  () =>
                          displayedContext == null
                                  ? []
                                  : Array.from({length: displayedContext.rowList.length}, () => ({size: Sizes.FRAME_HEIGHT})),
                  [displayedContext],
          )

          const onCountClick = useCallback(
                  (ev: MouseEvent) => onSortClick(SortField.COUNT, ev),
                  [onSortClick],
          )
          const onTotalClick = useCallback(
                  (ev: MouseEvent) => onSortClick(SortField.TOTAL, ev),
                  [onSortClick],
          )
          const onSelfClick = useCallback(
                  (ev: MouseEvent) => onSortClick(SortField.SELF, ev),
                  [onSortClick],
          )
          const onSymbolNameClick = useCallback(
                  (ev: MouseEvent) => onSortClick(SortField.SYMBOL_NAME, ev),
                  [onSortClick],
          )
          const onDiffClick = useCallback(
                  (ev: MouseEvent) => onSortClick(SortField.DIFF, ev),
                  [onSortClick],
          )

          return (
                  <div className={css(commonStyle.vbox, style.profileTableView)}>
                    <table className={css(style.tableView)}>
                      <thead className={css(style.tableHeader)}>
                      {copied && <CopiedNotification/>}
                      <tr>
                        <th className={css(style.numericCountCell)} onClick={onCountClick}>
                          <SortIcon
                                  activeDirection={
                                    sortMethod.field === SortField.COUNT ? sortMethod.direction : null
                                  }
                          />
                          Count
                        </th>
                        <th className={css(diffMode ? style.diffTotalSelfCell : style.numericCell)}
                            onClick={onTotalClick}>
                          <SortIcon
                                  activeDirection={
                                    sortMethod.field === SortField.TOTAL ? sortMethod.direction : null
                                  }
                          />
                          {diffMode ? <span>Total (<span style={{color: BAS_COLOR}}>Bas</span>|<span
                                  style={{color: REG_COLOR}}>Reg</span>)</span> : "Total"}
                        </th>
                        <th className={css(diffMode ? style.diffTotalSelfCell : style.numericCell)}
                            onClick={onSelfClick}>
                          <SortIcon
                                  activeDirection={
                                    sortMethod.field === SortField.SELF ? sortMethod.direction : null
                                  }
                          />
                          {diffMode ? <span>Self (<span style={{color: BAS_COLOR}}>Bas</span>|<span
                                  style={{color: REG_COLOR}}>Reg</span>)</span> : 'Self'}
                        </th>
                        {diffMode && (
                                <th className={css(style.diffCell)} onClick={onDiffClick}>
                                  <SortIcon
                                          activeDirection={
                                            sortMethod.field === SortField.DIFF ? sortMethod.direction : null
                                          }
                                  />
                                  Diff
                                </th>
                        )}
                        <th className={css(style.textCell)} onClick={onSymbolNameClick}>
                          <SortIcon
                                  activeDirection={
                                    sortMethod.field === SortField.SYMBOL_NAME ? sortMethod.direction : null
                                  }
                          />
                          Name
                          <button
                                  className={css(style.alignToggle)}
                                  onClick={toggleNameAlign}
                                  title={nameAlignRight ? "Align left (head first)" : "Align right (tail first)"}
                          >
                            {nameAlignRight ? "⇤" : "⇥"}
                          </button>
                          <span className={css(style.totalSize)}>{prettyPrintNumber(profile.getSize())}</span>
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
                              selectedFrame == null ? null : displayedContext?.getIndexForFrame(selectedFrame)
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
          numericCountCell: {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            textAlign: 'center',
            width: 3 * Sizes.FRAME_HEIGHT,
            minWidth: 3 * Sizes.FRAME_HEIGHT,
          },
          numericCell: {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            textAlign: 'right',
            paddingRight: 0.5 * Sizes.FRAME_HEIGHT,
            width: 6 * Sizes.FRAME_HEIGHT,
            minWidth: 6 * Sizes.FRAME_HEIGHT,
          },
          diffTotalSelfCell: {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            textAlign: 'right',
            paddingRight: 0.5 * Sizes.FRAME_HEIGHT,
            width: 8 * Sizes.FRAME_HEIGHT,
            minWidth: 8 * Sizes.FRAME_HEIGHT,
          },
          diffCell: {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            textAlign: 'right',
            paddingRight: 0.5 * Sizes.FRAME_HEIGHT,
            width: 4 * Sizes.FRAME_HEIGHT,
            minWidth: 4 * Sizes.FRAME_HEIGHT,
          },
          textCell: {
            overflow: 'hidden',
            width: '100%',
            maxWidth: 0,
          },
          textCellInner: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          },
          textContent: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          },
          textContentRight: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
            direction: 'rtl',
            textAlign: 'left',
          },
          alignToggle: {
            marginLeft: 8,
            padding: '2px 6px',
            fontSize: FontSize.LABEL,
            background: theme.bgSecondaryColor,
            border: `1px solid ${theme.fgSecondaryColor}`,
            borderRadius: 3,
            color: theme.fgPrimaryColor,
            cursor: 'pointer',
            ':hover': {
              background: theme.selectionSecondaryColor,
            },
          },
          totalSize: {
            float: `right`,
            fontWeight: 'lighter',
            paddingRight: Sizes.FRAME_HEIGHT,
            color: theme.altFgSecondaryColor
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
  const diffMode = useAtom(diffModeAtom)
  const theme = useTheme()
  const selectedFrameInSandwich = sandwichViewState.callerCallee?.selectedFrame ?? null
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getCSSColorForFrame = createGetCSSColorForFrame({theme, frameToColorBucket, diffMode})
  const curSelected = useAtom(selectedFrameNameAtom)
  const [prevSelected, setPrevSelected] = useState(curSelected);
  const currentMode = useAtom(viewModeAtom)

  const setSelectedFrame = useCallback((selectedFrame: Frame | null) => {
    const selectedName = selectedFrame?.name ? selectedFrame.name : ""
    const unselect = prevSelected === selectedName
    const newSelectedName = unselect ? "" : selectedName
    const newSelectedFrame = unselect ? null : selectedFrame
    setPrevSelected(newSelectedName)

    FlamechartEventCallback.emitResetView()
    profileGroupAtom.setSelectedFrame(newSelectedFrame)
    // for non-sandwich views
    profileGroupAtom.setSelectedFrameName(newSelectedName)
  }, [currentMode, prevSelected])
  const searchIsActive = useAtom(searchIsActiveAtom)
  const searchQuery = useAtom(searchQueryAtom)

  const profileSearchResults = useContext(ProfileSearchContext)
  const selectedFrameName = (activeProfileState?.chronoViewState.selectedFrameName || activeProfileState?.leftHeavyViewState.selectedFrameName)?.trim()
  const rowList: Frame[] = useMemo(() => {
    const rowList: Frame[] = []
    const fromInputBox = searchQuery.length > 0
    const fromTableSelect = selectedFrameName ? selectedFrameName : ""
    const shouldTrimTableRows = fromInputBox || fromTableSelect.length < 1 || currentMode === ViewMode.SANDWICH_VIEW

    profile.forEachFrame(frame => {
      if (!shouldTrimTableRows) {
        rowList.push(frame)
        return
      }
      const filtered = fromInputBox ? profileSearchResults && !profileSearchResults.getMatchFromInputBoxForFrame(frame) :
              profileSearchResults && !profileSearchResults.getMatchForFrame(frame)
      if (filtered) return
      rowList.push(frame)
    })

    switch (tableSortMethod.field) {
      case SortField.SYMBOL_NAME: {
        sortBy(rowList, f => f.name.toLowerCase())
        break
      }
      case SortField.SELF: {
        sortBy(rowList, f => f.getSelfWeight())
        break
      }
      case SortField.TOTAL: {
        sortBy(rowList, f => f.getTotalWeight())
        break
      }
      case SortField.COUNT: {
        sortBy(rowList, f => profile.getNameCount(f.name))
        break
      }
      case SortField.DIFF: {
        sortBy(rowList, f => f.getWeightedDiffRatio())
        break
      }
    }
    if (tableSortMethod.direction === SortDirection.DESCENDING) {
      rowList.reverse()
    }

    return rowList
  }, [profile, currentMode, profileSearchResults, selectedFrameName, tableSortMethod])

  const getIndexForFrame: (frame: Frame) => number | null = useMemo(() => {
    const indexByFrame = new Map<Frame, number>()
    for (let i = 0; i < rowList.length; i++) {
      indexByFrame.set(rowList[i], i)
    }
    return (frame: Frame) => {
      const index = indexByFrame.get(frame)
      return index == null ? null : index
    }
  }, [rowList])

  const getSearchMatchForFrame: (frame: Frame) => [number, number][] | null = useMemo(() => {
    return (frame: Frame) => {
      if (profileSearchResults == null) return null
      return profileSearchResults.getMatchForFrame(frame)
    }
  }, [profileSearchResults])

  const contextData: TableContextData = {
    rowList,
    selectedFrame: selectedFrameInSandwich,
    setSelectedFrame,
    getIndexForFrame,
    getSearchMatchForFrame,
  }


  return (
          <TableViewContext.Provider value={contextData}>
            <ProfileTableView
                    profile={profile}
                    selectedFrame={selectedFrameInSandwich}
                    getCSSColorForFrame={getCSSColorForFrame}
                    sortMethod={tableSortMethod}
                    setSelectedFrame={setSelectedFrame}
                    setSortMethod={tableSortMethodAtom.set}
                    searchIsActive={searchIsActive}
                    searchQuery={searchQuery}
            />
          </TableViewContext.Provider>
  )
})
