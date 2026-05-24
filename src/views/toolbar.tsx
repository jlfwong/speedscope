import {ApplicationProps} from './application'
import {h, JSX, Fragment} from 'preact'
import {useCallback, useState, useEffect} from 'preact/hooks'
import {StyleSheet, css} from 'aphrodite'
import {Sizes, FontFamily, FontSize, Duration, ZIndex} from './style'
import {ProfileSelect} from './profile-select'
import {Profile} from '../lib/profile'
import {objectsHaveShallowEquality} from '../lib/utils'
import {colorSchemeToString, useTheme, withTheme} from './themes/theme'
import {ViewMode} from '../lib/view-mode'
import {
  copiedUrlAtom,
  diffModeAtom,
  diffNormalizedAtom,
  diffViewModeAtom,
  DiffViewMode,
  displayMinimapAtom,
  displayTableAtom,
  reverseFlamegraphAtom,
  selectedFrameNameAtom,
  viewModeAtom
} from '../app-state'
import {ProfileGroupState} from '../app-state/profile-group'
import {colorSchemeAtom} from '../app-state/color-scheme'
import {useAtom} from '../lib/atom'
import {FlamechartSearchView} from './flamechart-search-view'
import {SandwichSearchView} from './sandwich-search-view'
import {FlamechartEventCallback} from './flamechart-pan-zoom-view'
import {inSpeedscopeWindow} from '../widgetUtils'
import {reloadDiffProfile, toggleLoadingPage} from './application-container'
import {Flamechart} from '../lib/flamechart'
import {BAS_COLOR, REG_COLOR} from '../lib/color'
import {CopiedNotification} from './profile-table-view'

interface ToolbarProps extends ApplicationProps {
  browseForFile(): void

  saveFile(): void

  flamechart: Flamechart
}

function useSetViewMode(setViewMode: (viewMode: ViewMode) => void, viewMode: ViewMode, reload: boolean = false) {
  return useCallback(() => {
    setViewMode(viewMode)
    if (reload) toggleLoadingPage()
  }, [setViewMode, viewMode])
}

function setFlag(flag: (flag: boolean) => void, value: boolean) {
  return useCallback(() => flag(value), [flag, value])
}

function ToolbarLeftContent(props: ToolbarProps) {
  const style = getStyle(useTheme())
  const diffMode = useAtom(diffModeAtom)
  const setChronoFlameChart =
          useSetViewMode(viewModeAtom.set, ViewMode.CHRONO_FLAME_CHART, props.viewMode == ViewMode.LEFT_HEAVY_FLAME_GRAPH)
  const setLeftHeavyFlameGraph =
          useSetViewMode(viewModeAtom.set, ViewMode.LEFT_HEAVY_FLAME_GRAPH, props.viewMode == ViewMode.CHRONO_FLAME_CHART)
  const setSandwichView = useSetViewMode(viewModeAtom.set, ViewMode.SANDWICH_VIEW)

  if (!props.activeProfileState) return null


  const setDisplayMinimap = setFlag(displayMinimapAtom.set, !props.displayMinimap)
  const setDisplayTable = setFlag(displayTableAtom.set, !props.displayTable)
  const reverse = useAtom(reverseFlamegraphAtom)

  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setEnabled(true), 300)
    return () => clearTimeout(timer);
  })
  const setReverse = () => {
    if (enabled) {
      setFlag(reverseFlamegraphAtom.set, !reverse)()
      toggleLoadingPage()
    }
  }

  const displayTable = props.viewMode !== ViewMode.SANDWICH_VIEW && <div
          className={css(style.toolbarTab)}
          title="Toggle the left-side table showing frame statistics sorted by weight"
          onClick={setDisplayTable}
  >
    {props.displayTable ? "☑Table" : "☐Table"}
  </div>

  const displayMinimap = props.viewMode !== ViewMode.SANDWICH_VIEW && <div
          className={css(style.toolbarTab)}
          title="Toggle the minimap overview at the top of the flamegraph"
          onClick={setDisplayMinimap}
  >
    {props.displayMinimap ? "☑Minimap" : "☐Minimap"}
  </div>

  const reverseFlamegraph = <div
          className={css(style.toolbarTab)}
          title="Flip the flamegraph upside down (icicle graph)"
          onClick={setReverse}
  >
    {reverse ? "☑Reverse" : "☐Reverse"}
  </div>

  return (
          <div className={css(style.toolbarLeft)}>
            {!diffMode &&
                    <div
                            className={css(
                                    style.toolbarTab,
                                    props.viewMode === ViewMode.CHRONO_FLAME_CHART && style.toolbarTabActive,
                            )}
                            title="Time Order view: stacks ordered chronologically as they were sampled"
                            onClick={setChronoFlameChart}
                    >
                      <span className={css(style.emoji)}>🕰</span>Time Order
                    </div>
            }
            <div
                    className={css(
                            style.toolbarTab,
                            props.viewMode === ViewMode.LEFT_HEAVY_FLAME_GRAPH && style.toolbarTabActive,
                    )}
                    title="Left Heavy view: stacks merged and sorted by weight, heaviest on the left"
                    onClick={setLeftHeavyFlameGraph}
            >
              <span className={css(style.emoji)}>⬅️</span>Left Heavy
            </div>
            <div
                    className={css(
                            style.toolbarTab,
                            props.viewMode === ViewMode.SANDWICH_VIEW && style.toolbarTabActive,
                    )}
                    title="Sandwich view: show callers above and callees below the selected frame"
                    onClick={setSandwichView}
            >
              <span className={css(style.emoji)}>🥪</span>Sandwich
            </div>
            {props.viewMode === ViewMode.SANDWICH_VIEW ? <SandwichSearchView/> : <FlamechartSearchView/>}
            <div className={css(style.toolbarToggle)}>
              {displayTable}
              {displayMinimap}
              {reverseFlamegraph}
            </div>
          </div>

  )
}

const getCachedProfileList = (() => {
  // TODO(jlfwong): It would be nice to just implement this as useMemo, but if
  // we do that using profileGroup or profileGroup.profiles as the cache key,
  // then it will invalidate whenever *anything* changes, because
  // profileGroup.profiles is ProfileState[], which contains component state
  // information for each tab for each profile. So whenever any property in any
  // persisted view state changes for *any* view in *any* profile, the profiles
  // list will get re-generated.
  let cachedProfileList: Profile[] | null = null

  return (profileGroup: ProfileGroupState): Profile[] | null => {
    let nextProfileList = profileGroup?.profiles.map(p => p.profile) || null

    if (
            cachedProfileList === null ||
            (nextProfileList != null && !objectsHaveShallowEquality(cachedProfileList, nextProfileList))
    ) {
      cachedProfileList = nextProfileList
    }

    return cachedProfileList
  }
})()

function ToolbarCenterContent(props: ToolbarProps): JSX.Element {
  const style = getStyle(useTheme())

  const {activeProfileState, profileGroup, viewMode} = props
  const profiles = getCachedProfileList(profileGroup)
  const [profileSelectShown, setProfileSelectShown] = useState(false)
  const diffMode = useAtom(diffModeAtom)
  const diffViewMode = useAtom(diffViewModeAtom)
  const diffNormalized = useAtom(diffNormalizedAtom)
  const selectedFrameName = useAtom(selectedFrameNameAtom)
  const isSandwichWithSelection = viewMode === ViewMode.SANDWICH_VIEW && selectedFrameName != null

  const openProfileSelect = useCallback(() => {
    setProfileSelectShown(true)
  }, [setProfileSelectShown])

  const closeProfileSelect = useCallback(() => {
    setProfileSelectShown(false)
  }, [setProfileSelectShown])

  useEffect(() => {

    const onWindowKeyPress = (ev: KeyboardEvent) => {
      if (!inSpeedscopeWindow()) return;
      if (ev.key === 't') {
        ev.preventDefault()
        setProfileSelectShown(true)
      }
    }
    window.addEventListener('keypress', onWindowKeyPress)
    return () => {
      window.removeEventListener('keypress', onWindowKeyPress)
    }
  }, [setProfileSelectShown])

  useEffect(() => {
    const onWindowKeyPress = (ev: KeyboardEvent) => {
      if (!inSpeedscopeWindow()) return;
      if (ev.key === 't') {
        ev.preventDefault()
        setProfileSelectShown(true)
      }
    }
    window.addEventListener('keypress', onWindowKeyPress)
    return () => {
      window.removeEventListener('keypress', onWindowKeyPress)
    }
  }, [setProfileSelectShown])

  const getDiffTitle = (): string | null => {
    if (!activeProfileState || !diffMode || !props.flamechart?.hasDiffData()) return null

    const profile = activeProfileState.profile
    const isBothMode = diffViewMode === DiffViewMode.BOTH
    const isInverted = profile.isInverted()

    const primaryWeight = profile.getTotalWeight()
    const comparisonWeight = profile.getTotalRegWeight()

    // When inverted, primaryWeight is REG and comparisonWeight is BAS
    // Always display as BAS -> REG for user clarity
    const basWeight = isInverted ? comparisonWeight : primaryWeight
    const regWeight = isInverted ? primaryWeight : comparisonWeight

    const basFormatted = profile.formatValue(basWeight)
    const regFormatted = profile.formatValue(regWeight)
    const rawRegTotal = profile.getRawRegTotalWeight()
    const rawRegFormatted = rawRegTotal != null && diffNormalized ? ` (${profile.formatValue(rawRegTotal)})` : ''

    let diffPct: string
    if (basWeight === 0) {
      diffPct = '+∞%'
    } else if (regWeight === 0) {
      diffPct = '-100%'
    } else {
      const delta = (regWeight - basWeight)
      const maxWeight = Math.max(basWeight, regWeight)
      const pctChange = Math.max(-1, Math.min(1, delta / maxWeight)) * 100
      const sign = pctChange >= 0 ? '+' : ''
      diffPct = `${sign}${pctChange.toFixed(1)}%`
    }

    const normalizedSuffix = diffNormalized
            ? (isSandwichWithSelection ? ' (normalized by selected name)' : ' (normalized)')
            : ''
    return (
            <span>
        [<span style={{color: BAS_COLOR}}>BAS</span> → <span style={{color: REG_COLOR}}>REG</span>]{' '}
              <span style={{color: BAS_COLOR}}>BAS: {basFormatted}</span>,{' '}
              <span style={{color: REG_COLOR}}>REG: {regFormatted}{rawRegFormatted}</span>, diff: {diffPct}{normalizedSuffix}
      </span>
    )
  }

  const diffTitle = getDiffTitle()

  if (activeProfileState && profileGroup && profiles) {
    const titleContent = diffTitle || `${activeProfileState.profile.getName()}${props.flamechart.getTitle()}`

    if (profileGroup.profiles.length === 1) {
      return (
              <div className={css(style.toolbarCenter)}>
                {titleContent}
              </div>
      )
    } else {
      return (
              <div className={css(style.toolbarCenter)} onMouseLeave={closeProfileSelect}>
          <span onMouseOver={openProfileSelect}>
            {titleContent}{' '}
            <span className={css(style.toolbarProfileIndex)}>
              ({activeProfileState.index + 1}/{profileGroup.profiles.length})
            </span>
          </span>
                <div style={{display: profileSelectShown ? 'block' : 'none'}}>
                  <ProfileSelect
                          setProfileIndexToView={props.setProfileIndexToView}
                          indexToView={profileGroup.indexToView}
                          profiles={profiles}
                          closeProfileSelect={closeProfileSelect}
                          visible={profileSelectShown}
                  />
                </div>
              </div>
      )
    }
  }
  return <Fragment>{'🔬speedscope'}</Fragment>
}

function ToolbarRightContent(props: ToolbarProps) {
  const style = getStyle(useTheme())
  const colorScheme = useAtom(colorSchemeAtom)
  const diffMode = useAtom(diffModeAtom)
  const hasDiffData = props.flamechart?.hasDiffData() ?? false
  const resetView = useCallback(() => {
    if (props.viewMode === ViewMode.SANDWICH_VIEW) FlamechartEventCallback.resetViewKeepFrameName()
    else FlamechartEventCallback.emitResetView()
  }, [props.viewMode])

  const exportFile = (
          <div className={css(style.toolbarTab)} onClick={props.saveFile}>
            <span className={css(style.emoji)}>⤴️</span>Export
          </div>
  )
  const importFile = (
          <div className={css(style.toolbarTab)} onClick={props.browseForFile}>
            <span className={css(style.emoji)}>⤵️</span>Import
          </div>
  )

  const colorSchemeToggle = (
          <div
                  className={css(style.toolbarTab)}
                  title="Cycle through color schemes for the flamegraph"
                  onClick={colorSchemeAtom.cycleToNextColorScheme}
          >
            <span className={css(style.emoji)}>🎨</span>
            <span className={css(style.toolbarTabColorSchemeToggle)}>
        {colorSchemeToString(colorScheme)}
      </span>
          </div>
  )

  const help = (
          <div className={css(style.toolbarTab)}>
            <a
                    href="https://github.com/jlfwong/speedscope/wiki"
                    className={css(style.noLinkStyle)}
                    target="_blank"
            >
              <span className={css(style.emoji)}>❓</span>Help
            </a>
          </div>
  )

  const [copied, setCopied] = useState(false);
  const copyLink = (
          <div className={css(style.toolbarTab)}
               onClick={() => {
                 if (copied) return;
                 const url = window.location.href;
                 const title = document.title;
                 const html = `<a href="${url}">${title}</a>`;
                 copiedUrlAtom.set(url)
                 navigator.clipboard.write([
                   new ClipboardItem({
                     "text/plain": new Blob([url], {type: "text/plain"}),
                     "text/html": new Blob([html], {type: "text/html"})
                   })
                 ]).then(() => {
                   setCopied(true)
                   setTimeout(() => {
                     setCopied(false)
                     copiedUrlAtom.set('')
                   }, 1000);
                 })
               }}
          >
            <span className={css(style.emoji)}>🔗</span>Copy Link
            {copied && <CopiedNotification/>}
          </div>
  )

  const reset = (
          <div
                  className={css(style.toolbarTab)}
                  title="Reset zoom and pan to show the full flamegraph"
                  onClick={resetView}
          >
            <span className={css(style.emoji)}>🔄</span>Reset
          </div>
  )

  const diffViewMode = useAtom(diffViewModeAtom)
  const diffNormalized = useAtom(diffNormalizedAtom)

  const handleDiffViewModeChange = (e: Event) => {
    const target = e.target as HTMLSelectElement
    const newMode = target.value as DiffViewMode
    diffViewModeAtom.set(newMode)
    const diffInverted = newMode === DiffViewMode.REG
    const keepSelectedFrame = props.viewMode === ViewMode.SANDWICH_VIEW
    reloadDiffProfile({diffNormalized, diffInverted, keepSelectedFrame})
  }

  const diffViewModeDropdown = hasDiffData && diffMode ? (
          <div className={css(style.toolbarTab)}
               title="Select diff view mode: BAS (baseline structure), REG (regression structure), or Both (side by side)">
            <span className={css(style.emoji)}>📊</span>
            <select
                    value={diffViewMode}
                    onChange={handleDiffViewModeChange}
                    className={css(style.diffDropdown)}
            >
              <option value={DiffViewMode.BOTH}>Both</option>
              <option value={DiffViewMode.BAS}>BAS graph</option>
              <option value={DiffViewMode.REG}>REG graph</option>
            </select>
          </div>
  ) : null

  const normalizeTitle = props.viewMode === ViewMode.SANDWICH_VIEW
          ? "In sandwich view, data is normalized by the selected method. All samples for the target method are aggregated and both BAS and REG totals are scaled to 100%, allowing direct comparison of their relative callee distributions to highlight code changes within the method."
          : "Normalize samples so both profiles have the same total. Useful when comparing profiles from different hardware or durations."

  const diffNormalizeToggle = hasDiffData && diffMode ? (
          <div
                  className={css(style.toolbarTab)}
                  title={normalizeTitle}
                  onClick={() => {
                    const newNormalized = !diffNormalized
                    diffNormalizedAtom.set(newNormalized)
                    const diffInverted = diffViewMode === DiffViewMode.REG
                    const keepSelectedFrame = props.viewMode === ViewMode.SANDWICH_VIEW
                    reloadDiffProfile({diffNormalized: newNormalized, diffInverted, keepSelectedFrame})
                  }}>
            <span className={css(style.emoji)}>⚖️</span>
            <span>{diffNormalized ? '☑Normalized' : '☐Normalize'}</span>
          </div>
  ) : null

  // {props.activeProfileState && exportFile}
  // {importFile}

  return (
          <div className={css(style.toolbarRight)}>
            {diffViewModeDropdown}
            {diffNormalizeToggle}
            {reset}
            {colorSchemeToggle}
          </div>
  )
}

export function Toolbar(props: ToolbarProps) {
  const style = getStyle(useTheme())
  return (
          <div className={css(style.toolbar)}>
            <ToolbarLeftContent {...props} />
            <ToolbarCenterContent {...props} />
            <ToolbarRightContent {...props} />
          </div>
  )
}

const getStyle = withTheme(theme =>
        StyleSheet.create({
          toolbar: {
            display: 'flex',
            justifyContent: 'space-between',
            height: Sizes.TOOLBAR_HEIGHT,
            flexShrink: 0,
            background: theme.altBgPrimaryColor,
            color: theme.altFgPrimaryColor,
            textAlign: 'center',
            fontFamily: FontFamily.MONOSPACE,
            fontSize: FontSize.TITLE,
            lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
            userSelect: 'none',
            position: 'relative',
            zIndex: ZIndex.TOOLBAR
          },
          toolbarLeft: {
            display: 'flex',
            alighItems: 'center',
            height: Sizes.TOOLBAR_HEIGHT,
            overflow: 'hidden',
            top: 0,
            left: 0,
            marginRight: 2,
            textAlign: 'left',
          },
          toolbarCenter: {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: Sizes.TOOLBAR_HEIGHT,
            zIndex: ZIndex.GRAPH,
            whiteSpace: "nowrap",
            overflow: "visible"
          },
          toolbarRight: {
            display: 'flex',
            alignItems: 'center',
            height: Sizes.TOOLBAR_HEIGHT,
            overflow: 'hidden',
            top: 0,
            right: 0,
            marginRight: 2,
            textAlign: 'right',
          },
          toolbarProfileIndex: {
            color: theme.altFgSecondaryColor,
          },
          toolbarTab: {
            background: theme.altBgSecondaryColor,
            marginTop: Sizes.SEPARATOR_HEIGHT,
            height: Sizes.TOOLBAR_TAB_HEIGHT,
            lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
            paddingLeft: 2,
            paddingRight: 8,
            display: 'inline-block',
            marginLeft: 2,
            transition: `all ${Duration.HOVER_CHANGE} ease-in`,
            ':hover': {
              background: theme.selectionSecondaryColor,
            },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          },
          toolbarTabActive: {
            background: theme.selectionPrimaryColor,
            ':hover': {
              background: theme.selectionPrimaryColor,
            },
          },
          toolbarTabColorSchemeToggle: {
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '50px',
          },
          toolbarToggle: {
            display: 'flex',
            alighItems: 'center',
            height: Sizes.TOOLBAR_HEIGHT,
            overflow: 'hidden',
            top: 0,
            left: 0,
            marginLeft: 6,
            marginRight: 2,
            textAlign: 'left',
          },
          emoji: {
            display: 'inline-block',
            verticalAlign: 'middle',
            paddingTop: '0px',
            marginRight: '0.3em',
          },
          noLinkStyle: {
            textDecoration: 'none',
            color: 'inherit',
          },
          diffDropdown: {
            background: theme.altBgSecondaryColor,
            color: theme.altFgPrimaryColor,
            border: 'none',
            borderRadius: 2,
            padding: '2px 4px',
            fontSize: FontSize.LABEL,
            cursor: 'pointer',
            outline: 'none',
          },
        }),
)
