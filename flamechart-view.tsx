import {h, Component} from 'preact'
import {css} from 'aphrodite'

import {CallTreeNode, Frame} from './profile'

import {Rect, Vec2, AffineTransform, clamp} from './math'
import {formatPercent} from './utils'
import {FlamechartMinimapView} from './flamechart-minimap-view'

import {style} from './flamechart-style'
import {Sizes, commonStyle} from './style'
import {CanvasContext} from './canvas-context'
import {FlamechartDetailView} from './flamechart-detail-view'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'
import {Hovertip} from './hovertip'
import {FlamechartAppState} from './app-state/flamechart-view-state'

interface FlamechartViewProps {
  canvasContext: CanvasContext
  appState: FlamechartAppState
  getCSSColorForFrame: (frame: Frame) => string
}

interface FlamechartViewState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
  selectedNode: CallTreeNode | null
  configSpaceViewportRect: Rect
}

export class FlamechartView extends Component<FlamechartViewProps, FlamechartViewState> {
  constructor() {
    super()
    this.state = {
      hover: null,
      selectedNode: null,
      configSpaceViewportRect: Rect.empty,
    }
  }

  private configSpaceSize() {
    return new Vec2(
      this.props.appState.flamechart.getTotalWeight(),
      this.props.appState.flamechart.getLayers().length,
    )
  }

  private setConfigSpaceViewportRect = (viewportRect: Rect): void => {
    const configSpaceDetailViewHeight = Sizes.DETAIL_VIEW_HEIGHT / Sizes.FRAME_HEIGHT

    const configSpaceSize = this.configSpaceSize()

    const width = clamp(
      viewportRect.size.x,
      Math.min(configSpaceSize.x, 3 * this.props.appState.flamechart.getMinFrameWidth()),
      configSpaceSize.x,
    )

    const size = viewportRect.size.withX(width)

    const origin = Vec2.clamp(
      viewportRect.origin,
      new Vec2(0, -1),
      Vec2.max(
        Vec2.zero,
        configSpaceSize.minus(size).plus(new Vec2(0, configSpaceDetailViewHeight + 1)),
      ),
    )

    this.setState({
      configSpaceViewportRect: new Rect(origin, viewportRect.size.withX(width)),
    })
  }

  private transformViewport = (transform: AffineTransform): void => {
    const viewportRect = transform.transformRect(this.state.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  onNodeHover = (hover: {node: CallTreeNode; event: MouseEvent} | null) => {
    this.setState({hover})
  }

  onNodeClick = (node: CallTreeNode | null) => {
    this.setState({
      selectedNode: node,
    })
  }

  formatValue(weight: number) {
    const totalWeight = this.props.appState.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.appState.flamechart.formatValue(weight)} (${formattedPercent})`
  }

  renderTooltip() {
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

  render() {
    return (
      <div className={css(style.fill, commonStyle.vbox)} ref={this.containerRef}>
        <FlamechartMinimapView
          configSpaceViewportRect={this.state.configSpaceViewportRect}
          transformViewport={this.transformViewport}
          flamechart={this.props.appState.flamechart}
          flamechartRenderer={this.props.appState.flamechartRenderer}
          canvasContext={this.props.canvasContext}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        <FlamechartPanZoomView
          canvasContext={this.props.canvasContext}
          flamechart={this.props.appState.flamechart}
          flamechartRenderer={this.props.appState.flamechartRenderer}
          renderInverted={false}
          onNodeHover={this.onNodeHover}
          onNodeSelect={this.onNodeClick}
          selectedNode={this.state.selectedNode}
          transformViewport={this.transformViewport}
          configSpaceViewportRect={this.state.configSpaceViewportRect}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        {this.renderTooltip()}
        {this.state.selectedNode && (
          <FlamechartDetailView
            flamechart={this.props.appState.flamechart}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            selectedNode={this.state.selectedNode}
          />
        )}
      </div>
    )
  }
}
