import {Frame} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableViewContainer} from './profile-table-view'
import {Component, h, JSX} from 'preact'
import {memo} from 'preact/compat'
import {useCallback, useState} from 'preact/hooks'
import {commonStyle, Sizes, FontSize, ZIndex} from './style'
import {InvertedCallerFlamegraphView} from './inverted-caller-flamegraph-view'
import {InvertedCallerFlamegraphViewReg} from './inverted-caller-flamegraph-view-reg'
import {CalleeFlamegraphView} from './callee-flamegraph-view'
import {CalleeFlamegraphViewReg} from './callee-flamegraph-view-reg'
import {ActiveProfileState} from '../app-state/active-profile-state'
import {Theme, useTheme, withTheme} from './themes/theme'
import {profileGroupAtom, diffModeAtom, diffViewModeAtom, DiffViewMode, diffNormalizedAtom} from '../app-state'
import {useAtom} from '../lib/atom'
import {BAS_COLOR, REG_COLOR} from '../lib/color'
import {inSpeedscopeWindow, windowWidthCache} from '../widgetUtils'

type Listener = (opts: { reset: boolean }) => void;

class FlamechartScheduler {
  private listeners = new Set<Listener>();
  private scheduled = false;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  resetAllViews() {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.scheduled = false;
        this.listeners.forEach(l => l({reset: true}));
      })
    })
  }
}

export const flamechartScheduler = new FlamechartScheduler();

interface SandwichViewProps {
  selectedFrame: Frame | null
  profileIndex: number
  theme: Theme
  activeProfileState: ActiveProfileState
  setSelectedFrame: (selectedFrame: Frame | null) => void
  glCanvas: HTMLCanvasElement
  isBothMode: boolean
}

interface SandwichViewState {
  showCaller: boolean;
  showCallee: boolean;
}

class SandwichView extends Component<SandwichViewProps, SandwichViewState> {
  constructor(props: SandwichViewProps) {
    super(props);
    this.state = {
      showCaller: true,
      showCallee: true
    }
  };

  toggleCaller = () => {
    // we have to refresh both caller & callee
    flamechartScheduler.resetAllViews()
    this.setState(
            prev => ({
              showCaller: this.state.showCallee ? !prev.showCaller : prev.showCaller
            })
    );
  };

  toggleCallee = () => {
    flamechartScheduler.resetAllViews()
    this.setState(
            prev => ({
              showCallee: this.state.showCaller ? !prev.showCallee : prev.showCallee
            })
    );
  };

  private setSelectedFrame = (selectedFrame: Frame | null) => {
    this.props.setSelectedFrame(selectedFrame)
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (!inSpeedscopeWindow()) return;

    if (ev.key === 'Escape') {
      this.setSelectedFrame(null)
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyPress)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyPress)
  }

  render() {
    const style = getStyle(this.props.theme)
    const theme = useTheme()
    const {selectedFrame} = this.props
    let flamegraphViews: JSX.Element | null = null

    const {isBothMode} = this.props
    const profile = this.props.activeProfileState.profile
    const diffNormalized = useAtom(diffNormalizedAtom)

    const regLabel = <span style={{color: REG_COLOR}}>REG</span>

    if (selectedFrame) {
      const renderCallerSection = (label: JSX.Element, ViewComponent: typeof InvertedCallerFlamegraphView | typeof InvertedCallerFlamegraphViewReg) => (
              <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
                {isBothMode && <div style={{
                  padding: "2px 8px",
                  background: theme.altBgSecondaryColor,
                  color: theme.altFgPrimaryColor,
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center"
                }}>{label}</div>}
                <div style={{flex: 1, overflow: "hidden"}}>
                  <ViewComponent
                          glCanvas={this.props.glCanvas}
                          activeProfileState={this.props.activeProfileState}
                          displayMinimap={false}
                          displayTable={true}
                  />
                </div>
              </div>
      )

      const renderCalleeSection = (label: React.ReactNode, ViewComponent: typeof CalleeFlamegraphView | typeof CalleeFlamegraphViewReg) => (
              <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
                {isBothMode && <div style={{
                  padding: "2px 8px",
                  background: this.props.theme.altBgSecondaryColor,
                  color: this.props.theme.altFgPrimaryColor,
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center"
                }}>{label}</div>}
                <div style={{flex: 1, overflow: "hidden"}}>
                  <ViewComponent
                          glCanvas={this.props.glCanvas}
                          activeProfileState={this.props.activeProfileState}
                          displayMinimap={false}
                          displayTable={true}
                  />
                </div>
              </div>
      )

      flamegraphViews = (
              <div className={css(commonStyle.fillY, style.callersAndCallees, commonStyle.vbox)}>

                {this.state.showCaller && (
                        <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
                          <div className={css(style.flamechartLabelParent)} onClick={this.toggleCaller}
                               style={{cursor: 'pointer'}}>
                            <div className={css(style.flamechartLabel)}>
                              ▶Callers
                            </div>
                          </div>
                          {isBothMode ? (
                                  <div style={{flex: 1, display: "flex", flexDirection: "row", overflow: "hidden"}}>
                                    {renderCallerSection(<span
                                            style={{color: BAS_COLOR}}>BAS</span>, InvertedCallerFlamegraphView)}
                                    <div style={{width: "2px", background: this.props.theme.fgSecondaryColor}}/>
                                    {renderCallerSection(regLabel, InvertedCallerFlamegraphViewReg)}
                                  </
                                          div>
                          ) : (
                                  <InvertedCallerFlamegraphView
                                          glCanvas={this.props.glCanvas}
                                          activeProfileState={this.props.activeProfileState}
                                          displayMinimap={false}
                                          displayTable={true}
                                  />
                          )}
                        </div>
                )}
                {!this.state.showCaller && (
                        <div className={css(style.flamechartLabelParent)} onClick={this.toggleCaller}
                             style={{cursor: 'pointer'}}>
                          <div className={css(
                                  style.flamechartLabel,
                                  style.flamechartLabelActivate
                          )}>
                            ◀Callers
                          </div>
                        </div>
                )}

                <div className={css(style.divider)}/>

                {this.state.showCallee && (
                        <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
                          <div className={css(style.flamechartLabelParent, style.flamechartLabelParentBottom)}
                               onClick={this.toggleCallee} style={{cursor: 'pointer'}}>
                            <div className={css(style.flamechartLabel, style.flamechartLabelBottom)}>
                              Callees◀
                            </div>
                          </div>
                          {isBothMode ? (
                                  <div style={{flex: 1, display: "flex", flexDirection: "row", overflow: "hidden"}}>
                                    {renderCalleeSection(<span
                                            style={{color: BAS_COLOR}}>BAS</span>, CalleeFlamegraphView)}
                                    <div style={{width: "2px", background: this.props.theme.fgSecondaryColor}}/>
                                    {renderCalleeSection(regLabel, CalleeFlamegraphViewReg)}
                                  </div>
                          ) : (
                                  <CalleeFlamegraphView
                                          glCanvas={this.props.glCanvas}
                                          activeProfileState={this.props.activeProfileState}
                                          displayMinimap={false}
                                          displayTable={true}
                                  />
                          )}
                        </div>
                )}
                {!this.state.showCallee && (
                        <div className={css(style.flamechartLabelParent, style.flamechartLabelParentBottom)}
                             onClick={this.toggleCallee} style={{cursor: 'pointer'}}>
                          <div className={css(
                                  style.flamechartLabel,
                                  style.flamechartLabelBottom,
                                  style.flamechartLabelActivate,
                          )}>
                            Callees▶
                          </div>
                        </div>
                )}
              </div>
      )
    }

    const [isTableHovered, setIsTableHovered] = useState(false);
    const [shouldExpand, setShouldExpand] = useState(false);

    const handleMouseEnter = () => {
      const dpr = window.devicePixelRatio || 1
      const threshold = (this.props.isBothMode ? 1300 : 1000) * dpr
      if (windowWidthCache < threshold) {
        setShouldExpand(true);
      }
      setIsTableHovered(true);
    };

    const handleMouseLeave = () => {
      setShouldExpand(false);
      setIsTableHovered(false);
    };

    return (
            <div className={css(commonStyle.hbox, commonStyle.fillY)}>


              <div className={css(style.tableView)} style={{flex: 3, overflow: "relative"}}>
                <div
                        style={{
                          width: "100%",
                          height: "100%",
                          visibility: "hidden",
                          zIndex: ZIndex.GRAPH
                        }}
                />
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: isTableHovered && shouldExpand ? "150%" : "100%",
                  height: "100%",
                  zIndex: ZIndex.TABLE,
                  transition: "width 0.1s, position 0s"
                }}
                     onMouseEnter={handleMouseEnter}
                     onMouseLeave={handleMouseLeave}
                >
                  <ProfileTableViewContainer activeProfileState={this.props.activeProfileState}/>
                </div>
              </div>

              {selectedFrame && <div style={{flex: 2, overflow: "auto"}}>
                {flamegraphViews}
              </div>
              }
            </div>
    )
  }
}

const getStyle = withTheme(theme =>
        StyleSheet.create({
          tableView: {
            position: 'relative',
            flex: 1,
          },
          panZoomViewWraper: {
            flex: 1,
          },
          flamechartLabelParent: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            fontSize: FontSize.TITLE,
            width: FontSize.TITLE * 1.2,
            borderRight: `1px solid ${theme.fgSecondaryColor}`,
            ':hover': {
              background: theme.selectionSecondaryColor,
            },
          },
          flamechartLabelParentBottom: {
            justifyContent: 'flex-start',
          },
          flamechartLabel: {
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50% 0',
            width: FontSize.TITLE * 1.2,
            flexShrink: 1,
          },
          flamechartLabelBottom: {
            transform: 'rotate(-90deg)',
            display: 'flex',
            justifyContent: 'flex-end',
          },
          flamechartLabelActivate: {
            background: theme.selectionPrimaryColor,
            ':hover': {
              background: theme.selectionPrimaryColor,
            },
          },
          callersAndCallees: {
            flex: 1,
            borderLeft: `${Sizes.SEPARATOR_HEIGHT}px solid ${theme.fgSecondaryColor}`,
          },
          divider: {
            height: 2,
            background: theme.fgSecondaryColor,
          },
        }),
)

interface SandwichViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
}

export const SandwichViewContainer = memo((ownProps: SandwichViewContainerProps) => {
  const {activeProfileState, glCanvas} = ownProps
  const {sandwichViewState, index, profile} = activeProfileState
  const {callerCallee} = sandwichViewState

  const theme = useTheme()
  const diffMode = useAtom(diffModeAtom)
  const diffViewMode = useAtom(diffViewModeAtom)
  const isBothMode = diffViewMode === DiffViewMode.BOTH && diffMode && profile.hasDiffData()

  const setSelectedFrame = useCallback((selectedFrame: Frame | null) => {
    profileGroupAtom.setSelectedFrame(selectedFrame)
  }, [])

  const selectedFrame = callerCallee ? callerCallee.selectedFrame : null

  return (
          <SandwichView
                  theme={theme}
                  activeProfileState={activeProfileState}
                  glCanvas={glCanvas}
                  setSelectedFrame={setSelectedFrame}
                  selectedFrame={selectedFrame}
                  profileIndex={index}
                  isBothMode={isBothMode}
          />
  )
})
