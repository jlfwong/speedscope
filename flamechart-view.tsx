import {h} from 'preact'
import {css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {CallTreeNode, Frame} from './profile'
import {Flamechart} from './flamechart'

import {Rect, Vec2, AffineTransform} from './math'
import {formatPercent} from './utils'
import {FlamechartMinimapView} from './flamechart-minimap-view'

import {style} from './flamechart-style'
import {Sizes, commonStyle} from './style'
import {CanvasContext} from './canvas-context'
import {FlamechartRenderer} from './flamechart-renderer'
import {FlamechartDetailView} from './flamechart-detail-view'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'

interface FlamechartViewProps {
  flamechart: Flamechart
  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
  getCSSColorForFrame: (frame: Frame) => string
}

interface FlamechartViewState {
  hoveredNode: CallTreeNode | null
  selectedNode: CallTreeNode | null
  configSpaceViewportRect: Rect
  logicalSpaceMouse: Vec2
}

export class FlamechartView extends ReloadableComponent<FlamechartViewProps, FlamechartViewState> {
  container: HTMLDivElement | null = null

  constructor() {
    super()
    this.state = {
      hoveredNode: null,
      selectedNode: null,
      configSpaceViewportRect: Rect.empty,
      logicalSpaceMouse: Vec2.zero,
    }
  }

  private configSpaceSize() {
    return new Vec2(
      this.props.flamechart.getTotalWeight(),
      this.props.flamechart.getLayers().length,
    )
  }

  private minConfigSpaceViewportRectWidth() {
    return Math.min(
      this.props.flamechart.getTotalWeight(),
      3 * this.props.flamechart.getMinFrameWidth(),
    )
  }

  private setConfigSpaceViewportRect = (viewportRect: Rect): void => {
    const configSpaceDetailViewHeight = Sizes.DETAIL_VIEW_HEIGHT / Sizes.FRAME_HEIGHT

    const configSpaceOriginBounds = new Rect(
      new Vec2(0, -1),
      Vec2.max(
        new Vec2(0, 0),
        this.configSpaceSize()
          .minus(viewportRect.size)
          .plus(new Vec2(0, configSpaceDetailViewHeight + 1)),
      ),
    )

    const configSpaceSizeBounds = new Rect(
      new Vec2(this.minConfigSpaceViewportRectWidth(), viewportRect.height()),
      new Vec2(this.configSpaceSize().x, viewportRect.height()),
    )

    this.setState({
      configSpaceViewportRect: new Rect(
        configSpaceOriginBounds.closestPointTo(viewportRect.origin),
        configSpaceSizeBounds.closestPointTo(viewportRect.size),
      ),
    })
  }

  private transformViewport = (transform: AffineTransform): void => {
    const viewportRect = transform.transformRect(this.state.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  onNodeHover = (node: CallTreeNode | null, logicalSpaceMouse: Vec2) => {
    this.setState({
      hoveredNode: node,
      logicalSpaceMouse: logicalSpaceMouse.plus(new Vec2(0, Sizes.MINIMAP_HEIGHT)),
    })
  }

  onNodeClick = (node: CallTreeNode | null) => {
    this.setState({
      selectedNode: node,
    })
  }

  formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
  }

  renderTooltip() {
    if (!this.container) return null

    const {hoveredNode, logicalSpaceMouse} = this.state
    if (!hoveredNode) return null

    const {width, height} = this.container.getBoundingClientRect()

    const positionStyle: {
      left?: number
      right?: number
      top?: number
      bottom?: number
    } = {}

    const OFFSET_FROM_MOUSE = 7
    if (logicalSpaceMouse.x + OFFSET_FROM_MOUSE + Sizes.TOOLTIP_WIDTH_MAX < width) {
      positionStyle.left = logicalSpaceMouse.x + OFFSET_FROM_MOUSE
    } else {
      positionStyle.right = width - logicalSpaceMouse.x + 1
    }

    if (logicalSpaceMouse.y + OFFSET_FROM_MOUSE + Sizes.TOOLTIP_HEIGHT_MAX < height) {
      positionStyle.top = logicalSpaceMouse.y + OFFSET_FROM_MOUSE
    } else {
      positionStyle.bottom = height - logicalSpaceMouse.y + 1
    }

    return (
      <div className={css(style.hoverTip)} style={positionStyle}>
        <div className={css(style.hoverTipRow)}>
          <span className={css(style.hoverCount)}>
            {this.formatValue(hoveredNode.getTotalWeight())}
          </span>{' '}
          {hoveredNode.frame.name}
        </div>
      </div>
    )
  }

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
          configSpaceViewportRect={this.state.configSpaceViewportRect}
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
          setNodeHover={this.onNodeHover}
          setSelectedNode={this.onNodeClick}
          selectedNode={this.state.selectedNode}
          transformViewport={this.transformViewport}
          configSpaceViewportRect={this.state.configSpaceViewportRect}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        {this.state.selectedNode && (
          <FlamechartDetailView
            flamechart={this.props.flamechart}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            selectedNode={this.state.selectedNode}
          />
        )}
        {this.renderTooltip()}
      </div>
    )
  }
}
