import {Frame, CallTreeNode} from './profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableView} from './profile-table-view'
import {h, Component} from 'preact'
import {commonStyle, Sizes, Colors, FontSize} from './style'
import {Rect, AffineTransform, Vec2, clamp} from './math'
import {FlamechartPanZoomView, FlamechartPanZoomViewProps} from './flamechart-pan-zoom-view'
import {noop, formatPercent} from './utils'
import {Hovertip} from './hovertip'
import {SandwichViewProps} from './sandwich-view-container'
import {actions} from './app-state/actions'
import {FlamechartViewProps} from './app-state/flamechart-view-state'

export class FlamechartWrapper extends Component<FlamechartViewProps, EmptyState> {
  private clampViewportToFlamegraph(viewportRect: Rect) {
    const {flamechart, renderInverted} = this.props

    const configSpaceSize = new Vec2(flamechart.getTotalWeight(), flamechart.getLayers().length)

    const width = clamp(
      viewportRect.size.x,
      Math.min(configSpaceSize.x, 3 * flamechart.getMinFrameWidth()),
      configSpaceSize.x,
    )

    const size = viewportRect.size.withX(width)

    const origin = Vec2.clamp(
      viewportRect.origin,
      new Vec2(0, renderInverted ? 0 : -1),
      Vec2.max(Vec2.zero, configSpaceSize.minus(size).plus(new Vec2(0, 1))),
    )

    return new Rect(origin, viewportRect.size.withX(width))
  }

  private setConfigSpaceViewportRect = (configSpaceViewportRect: Rect) => {
    this.props.dispatch(
      actions.flamechart.setConfigSpaceViewportRect({
        id: this.props.id,
        configSpaceViewportRect: this.clampViewportToFlamegraph(configSpaceViewportRect),
      }),
    )
  }

  private transformViewport = (transform: AffineTransform) => {
    this.setConfigSpaceViewportRect(transform.transformRect(this.props.configSpaceViewportRect))
  }

  private formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
  }

  private renderTooltip() {
    if (!this.container) return null

    const {hover} = this.props
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
    this.props.dispatch(actions.flamechart.setHoveredNode({id: this.props.id, hover}))
  }

  render() {
    const props: FlamechartPanZoomViewProps = {
      selectedNode: null,
      onNodeHover: this.setNodeHover,
      onNodeSelect: noop,
      configSpaceViewportRect: this.props.configSpaceViewportRect,
      setConfigSpaceViewportRect: this.setConfigSpaceViewportRect,
      transformViewport: this.transformViewport,
      flamechart: this.props.flamechart,
      flamechartRenderer: this.props.flamechartRenderer,
      canvasContext: this.props.canvasContext,
      renderInverted: this.props.renderInverted,
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

interface EmptyState {
  __dummy: 1
}

export class SandwichView extends Component<SandwichViewProps, EmptyState> {
  private setSelectedFrame = (selectedFrame: Frame | null) => {
    this.props.dispatch(actions.sandwichView.setSelectedFrame(selectedFrame))
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
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
    const {callerCallee} = this.props

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
            <FlamechartWrapper {...callerCallee.invertedCallerFlamegraph} />
          </div>
          <div className={css(style.divider)} />
          <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
            <div className={css(style.flamechartLabelParent, style.flamechartLabelParentBottom)}>
              <div className={css(style.flamechartLabel, style.flamechartLabelBottom)}>Callees</div>
            </div>
            <FlamechartWrapper {...callerCallee.calleeFlamegraph} />
          </div>
        </div>
      )
    }

    return (
      <div className={css(commonStyle.hbox, commonStyle.fillY)}>
        <div className={css(style.tableView)}>
          <ProfileTableView
            selectedFrame={selectedFrame}
            profile={this.props.profile}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            sortMethod={this.props.tableSortMethod}
            dispatch={this.props.dispatch}
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
