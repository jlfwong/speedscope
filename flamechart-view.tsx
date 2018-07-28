import {h, Component} from 'preact'
import {css} from 'aphrodite'

import {CallTreeNode} from './profile'

import {Rect, Vec2, AffineTransform, clamp} from './math'
import {formatPercent} from './utils'
import {FlamechartMinimapView} from './flamechart-minimap-view'

import {style} from './flamechart-style'
import {Sizes, commonStyle} from './style'
import {FlamechartDetailView} from './flamechart-detail-view'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'
import {Hovertip} from './hovertip'
import {actions} from './app-state/actions'
import {FlamechartViewProps} from './flamechart-view-container'

interface EmptyState {
  __dummy: 1
}

export class FlamechartView extends Component<FlamechartViewProps, EmptyState> {
  private configSpaceSize() {
    return new Vec2(
      this.props.flamechart.getTotalWeight(),
      this.props.flamechart.getLayers().length,
    )
  }

  private setConfigSpaceViewportRect = (viewportRect: Rect): void => {
    const configSpaceDetailViewHeight = Sizes.DETAIL_VIEW_HEIGHT / Sizes.FRAME_HEIGHT

    const configSpaceSize = this.configSpaceSize()

    const width = clamp(
      viewportRect.size.x,
      Math.min(configSpaceSize.x, 3 * this.props.flamechart.getMinFrameWidth()),
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

    this.props.dispatch(
      actions.flamechart.setConfigSpaceViewportRect({
        id: this.props.id,
        configSpaceViewportRect: new Rect(origin, viewportRect.size.withX(width)),
      }),
    )
  }

  private setLogicalSpaceViewportSize = (logicalSpaceViewportSize: Vec2): void => {
    this.props.dispatch(
      actions.flamechart.setLogicalSpaceViewportSize({id: this.props.id, logicalSpaceViewportSize}),
    )
  }

  private transformViewport = (transform: AffineTransform): void => {
    const viewportRect = transform.transformRect(this.props.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  onNodeHover = (hover: {node: CallTreeNode; event: MouseEvent} | null) => {
    this.props.dispatch(
      actions.flamechart.setHoveredNode({
        id: this.props.id,
        hover,
      }),
    )
  }

  onNodeClick = (node: CallTreeNode | null) => {
    this.props.dispatch(actions.flamechart.setSelectedNode({id: this.props.id, selectedNode: node}))
  }

  formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
  }

  renderTooltip() {
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

  render() {
    return (
      <div className={css(style.fill, commonStyle.vbox)} ref={this.containerRef}>
        <FlamechartMinimapView
          configSpaceViewportRect={this.props.configSpaceViewportRect}
          transformViewport={this.transformViewport}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          canvasContext={this.props.canvasContext}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        <FlamechartPanZoomView
          canvasContext={this.props.canvasContext}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          renderInverted={false}
          onNodeHover={this.onNodeHover}
          onNodeSelect={this.onNodeClick}
          selectedNode={this.props.selectedNode}
          transformViewport={this.transformViewport}
          configSpaceViewportRect={this.props.configSpaceViewportRect}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
          logicalSpaceViewportSize={this.props.logicalSpaceViewportSize}
          setLogicalSpaceViewportBounds={this.setLogicalSpaceViewportSize}
        />
        {this.renderTooltip()}
        {this.props.selectedNode && (
          <FlamechartDetailView
            flamechart={this.props.flamechart}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            selectedNode={this.props.selectedNode}
          />
        )}
      </div>
    )
  }
}
