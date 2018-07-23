import {ReloadableComponent} from './reloadable'
import {Profile, Frame, CallTreeNode} from './profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableView} from './profile-table-view'
import {h} from 'preact'
import {commonStyle, Sizes, Colors, FontSize} from './style'
import {CanvasContext} from './canvas-context'
import {FlamechartRenderer, FlamechartRowAtlasKey} from './flamechart-renderer'
import {Flamechart} from './flamechart'
import {RowAtlas} from './row-atlas'
import {Rect, AffineTransform, Vec2, clamp} from './math'
import {FlamechartPanZoomView, FlamechartPanZoomViewProps} from './flamechart-pan-zoom-view'
import {noop, formatPercent} from './utils'
import {Hovertip} from './hovertip'
import {SandwichViewModel} from './sandwich-view-model'

interface FlamechartWrapperProps {
  flamechart: Flamechart
  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
}

interface FlamechartWrapperState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
  configSpaceViewportRect: Rect
}

export class FlamechartWrapper extends ReloadableComponent<
  FlamechartWrapperProps,
  FlamechartWrapperState
> {
  constructor(props: FlamechartWrapperProps) {
    super(props)
    this.state = {
      hover: null,
      configSpaceViewportRect: Rect.empty,
    }
  }

  private clampViewportToFlamegraph(viewportRect: Rect, flamegraph: Flamechart, inverted: boolean) {
    const configSpaceSize = new Vec2(flamegraph.getTotalWeight(), flamegraph.getLayers().length)

    const width = clamp(
      viewportRect.size.x,
      Math.min(configSpaceSize.x, 3 * flamegraph.getMinFrameWidth()),
      configSpaceSize.x,
    )

    const size = viewportRect.size.withX(width)

    const origin = Vec2.clamp(
      viewportRect.origin,
      new Vec2(0, inverted ? 0 : -1),
      Vec2.max(Vec2.zero, configSpaceSize.minus(size).plus(new Vec2(0, 1))),
    )

    return new Rect(origin, viewportRect.size.withX(width))
  }

  private setConfigSpaceViewportRect = (viewportRect: Rect) => {
    this.setState({
      configSpaceViewportRect: this.clampViewportToFlamegraph(
        viewportRect,
        this.props.flamechart,
        this.props.renderInverted,
      ),
    })
  }

  private transformViewport = (transform: AffineTransform) => {
    this.setConfigSpaceViewportRect(transform.transformRect(this.state.configSpaceViewportRect))
  }

  private formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
  }

  private renderTooltip() {
    if (!this.container) return null

    const {hover} = this.state
    if (!hover) return null
    const {width, height, left, top} = this.container.getBoundingClientRect()
    const offset = new Vec2(hover.event.clientX - left, hover.event.clientY - top)

    return (
      <Hovertip containerSize={new Vec2(width, height)} offset={offset}>
        <span className={css(style.hoverCount)}>
          {this.formatValue(hover.node.getTotalWeight())}
        </span>{' '}
        {hover.node.frame.name}
      </Hovertip>
    )
  }

  container: HTMLDivElement | null = null
  containerRef = (container?: Element) => {
    this.container = (container as HTMLDivElement) || null
  }

  private setNodeHover = (hover: {node: CallTreeNode; event: MouseEvent} | null) => {
    this.setState({hover})
  }

  render() {
    const props: FlamechartPanZoomViewProps = {
      ...(this.props as FlamechartWrapperProps),
      selectedNode: null,
      onNodeHover: this.setNodeHover,
      onNodeSelect: noop,
      configSpaceViewportRect: this.state.configSpaceViewportRect,
      setConfigSpaceViewportRect: this.setConfigSpaceViewportRect,
      transformViewport: this.transformViewport,
    }
    return (
      <div
        className={css(commonStyle.fillY, commonStyle.fillX, commonStyle.vbox)}
        ref={this.containerRef}
      >
        <FlamechartPanZoomView {...props} />
        {this.renderTooltip()}
      </div>
    )
  }
}

interface SandwichViewProps {
  profile: Profile
  flattenRecursion: boolean

  // TODO(jlfwong): It's kind of awkward requiring both of these
  getColorBucketForFrame: (frame: Frame) => number
  getCSSColorForFrame: (frame: Frame) => string

  model: SandwichViewModel
  canvasContext: CanvasContext
  rowAtlas: RowAtlas<FlamechartRowAtlasKey>
}

interface CallerCalleeState {
  selectedFrame: Frame

  invertedCallerFlamegraph: Flamechart
  invertedCallerFlamegraphRenderer: FlamechartRenderer

  calleeFlamegraph: Flamechart
  calleeFlamegraphRenderer: FlamechartRenderer
}

interface SandwichViewState {
  callerCallee: CallerCalleeState | null
}

export class SandwichView extends ReloadableComponent<SandwichViewProps, SandwichViewState> {
  constructor(props: SandwichViewProps) {
    super(props)
    this.state = {
      callerCallee: null,
    }
  }

  private setSelectedFrame = (
    selectedFrame: Frame | null,
    props: SandwichViewProps = this.props,
  ) => {
    const {profile, canvasContext, rowAtlas, getColorBucketForFrame, flattenRecursion} = props

    if (!selectedFrame) {
      this.setState({callerCallee: null})
      return
    }

    let invertedCallerProfile = profile.getInvertedProfileForCallersOf(selectedFrame)
    if (flattenRecursion) {
      invertedCallerProfile = invertedCallerProfile.getProfileWithRecursionFlattened()
    }

    const invertedCallerFlamegraph = new Flamechart({
      getTotalWeight: invertedCallerProfile.getTotalNonIdleWeight.bind(invertedCallerProfile),
      forEachCall: invertedCallerProfile.forEachCallGrouped.bind(invertedCallerProfile),
      formatValue: invertedCallerProfile.formatValue.bind(invertedCallerProfile),
      getColorBucketForFrame,
    })
    const invertedCallerFlamegraphRenderer = new FlamechartRenderer(
      canvasContext,
      rowAtlas,
      invertedCallerFlamegraph,
      {inverted: true},
    )

    let calleeProfile = profile.getProfileForCalleesOf(selectedFrame)

    if (flattenRecursion) {
      calleeProfile = calleeProfile.getProfileWithRecursionFlattened()
    }

    const calleeFlamegraph = new Flamechart({
      getTotalWeight: calleeProfile.getTotalNonIdleWeight.bind(calleeProfile),
      forEachCall: calleeProfile.forEachCallGrouped.bind(calleeProfile),
      formatValue: calleeProfile.formatValue.bind(calleeProfile),
      getColorBucketForFrame,
    })
    const calleeFlamegraphRenderer = new FlamechartRenderer(
      canvasContext,
      rowAtlas,
      calleeFlamegraph,
    )

    this.setState({
      callerCallee: {
        selectedFrame,
        invertedCallerFlamegraph,
        invertedCallerFlamegraphRenderer,
        calleeFlamegraph,
        calleeFlamegraphRenderer,
      },
    })
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.setState({callerCallee: null})
    }
  }

  componentWillReceiveProps(nextProps: SandwichViewProps) {
    if (this.props.flattenRecursion !== nextProps.flattenRecursion) {
      if (this.state.callerCallee) {
        this.setSelectedFrame(this.state.callerCallee.selectedFrame, nextProps)
      }
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyPress)
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyPress)
  }

  render() {
    const {canvasContext} = this.props
    const {callerCallee} = this.state

    let selectedFrame: Frame | null = null
    let flamegraphViews: JSX.Element | null = null

    if (callerCallee) {
      selectedFrame = callerCallee.selectedFrame
      flamegraphViews = (
        <div className={css(commonStyle.fillY, style.callersAndCallees, commonStyle.vbox)}>
          <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
            <div className={css(style.flamechartLabelParent)}>
              <div className={css(style.flamechartLabel)}>Callers</div>
            </div>
            <FlamechartWrapper
              flamechart={callerCallee.invertedCallerFlamegraph}
              canvasContext={canvasContext}
              flamechartRenderer={callerCallee.invertedCallerFlamegraphRenderer}
              renderInverted={true}
            />
          </div>
          <div className={css(style.divider)} />
          <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
            <div className={css(style.flamechartLabelParent, style.flamechartLabelParentBottom)}>
              <div className={css(style.flamechartLabel, style.flamechartLabelBottom)}>Callees</div>
            </div>
            <FlamechartWrapper
              flamechart={callerCallee.calleeFlamegraph}
              canvasContext={canvasContext}
              flamechartRenderer={callerCallee.calleeFlamegraphRenderer}
              renderInverted={false}
            />
          </div>
        </div>
      )
    }

    return (
      <div className={css(commonStyle.hbox, commonStyle.fillY)}>
        <div className={css(style.tableView)}>
          <ProfileTableView
            selectedFrame={selectedFrame}
            setSelectedFrame={this.setSelectedFrame}
            profile={this.props.profile}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            model={this.props.model}
          />
        </div>
        {flamegraphViews}
      </div>
    )
  }
}

const style = StyleSheet.create({
  tableView: {
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
    borderRight: `1px solid ${Colors.LIGHT_GRAY}`,
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
  callersAndCallees: {
    flex: 1,
    borderLeft: `${Sizes.SEPARATOR_HEIGHT}px solid ${Colors.LIGHT_GRAY}`,
  },
  divider: {
    height: 2,
    background: Colors.LIGHT_GRAY,
  },
  hoverCount: {
    color: Colors.GREEN,
  },
})
