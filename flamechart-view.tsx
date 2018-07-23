import {h} from 'preact'
import {css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {CallTreeNode, Frame} from './profile'
import {Flamechart} from './flamechart'

import {Rect, Vec2, AffineTransform, clamp} from './math'
import {formatPercent} from './utils'
import {FlamechartMinimapView} from './flamechart-minimap-view'

import {style} from './flamechart-style'
import {Sizes, commonStyle} from './style'
import {CanvasContext} from './canvas-context'
import {FlamechartRenderer} from './flamechart-renderer'
import {FlamechartDetailView} from './flamechart-detail-view'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'
import {Hovertip} from './hovertip'
import {FlamechartViewModel} from './flamechart-view-model'

interface FlamechartViewProps {
  flamechart: Flamechart
  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
  getCSSColorForFrame: (frame: Frame) => string
  model: FlamechartViewModel
}

interface FlamechartViewState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
}

export class FlamechartView extends ReloadableComponent<FlamechartViewProps, FlamechartViewState> {
  constructor() {
    super()
    this.state = {
      hover: null,
    }
  }

  get model() {
    return this.props.model
  }

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

    this.model.setConfigSpaceViewportRect(new Rect(origin, viewportRect.size.withX(width)))
  }

  private transformViewport = (transform: AffineTransform): void => {
    const viewportRect = transform.transformRect(this.model.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  onNodeHover = (hover: {node: CallTreeNode; event: MouseEvent} | null) => {
    this.setState({hover})
  }

  onNodeClick = (node: CallTreeNode | null) => {
    this.model.setSelectedNode(node)
  }

  formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
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

  panZoomView: FlamechartPanZoomView | null = null
  panZoomRef = (view: FlamechartPanZoomView | null) => {
    this.panZoomView = view
  }
  subcomponents() {
    return {
      panZoom: this.panZoomView,
    }
  }

  render() {
    return (
      <div className={css(style.fill, commonStyle.vbox)} ref={this.containerRef}>
        <FlamechartMinimapView
          configSpaceViewportRect={this.model.configSpaceViewportRect}
          transformViewport={this.transformViewport}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          canvasContext={this.props.canvasContext}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        <FlamechartPanZoomView
          ref={this.panZoomRef}
          canvasContext={this.props.canvasContext}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          renderInverted={false}
          onNodeHover={this.onNodeHover}
          onNodeSelect={this.onNodeClick}
          selectedNode={this.model.selectedNode}
          transformViewport={this.transformViewport}
          configSpaceViewportRect={this.model.configSpaceViewportRect}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        {this.renderTooltip()}
        {this.model.selectedNode && (
          <FlamechartDetailView
            flamechart={this.props.flamechart}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            selectedNode={this.model.selectedNode}
          />
        )}
      </div>
    )
  }
}
