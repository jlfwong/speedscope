import {CallTreeNode} from './profile'
import {StyleSheet, css} from 'aphrodite'
import {h} from 'preact'
import {commonStyle, Colors} from './style'
import {Rect, AffineTransform, Vec2, clamp} from './math'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'
import {noop, formatPercent} from './utils'
import {Hovertip} from './hovertip'
import {actions} from './app-state/actions'
import {FlamechartViewProps} from './flamechart-view-container'
import {StatelessComponent} from './app-state/typed-redux'

export class FlamechartWrapper extends StatelessComponent<FlamechartViewProps> {
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
  private setLogicalSpaceViewportSize = (logicalSpaceViewportSize: Vec2): void => {
    this.props.dispatch(
      actions.flamechart.setLogicalSpaceViewportSize({id: this.props.id, logicalSpaceViewportSize}),
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
  private setNodeHover = (
    hover: {
      node: CallTreeNode
      event: MouseEvent
    } | null,
  ) => {
    this.props.dispatch(actions.flamechart.setHoveredNode({id: this.props.id, hover}))
  }
  render() {
    return (
      <div
        className={css(commonStyle.fillY, commonStyle.fillX, commonStyle.vbox)}
        ref={this.containerRef}
      >
        <FlamechartPanZoomView
          selectedNode={null}
          onNodeHover={this.setNodeHover}
          onNodeSelect={noop}
          configSpaceViewportRect={this.props.configSpaceViewportRect}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
          transformViewport={this.transformViewport}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          canvasContext={this.props.canvasContext}
          renderInverted={this.props.renderInverted}
          logicalSpaceViewportSize={this.props.logicalSpaceViewportSize}
          setLogicalSpaceViewportBounds={this.setLogicalSpaceViewportSize}
        />
        {this.renderTooltip()}
      </div>
    )
  }
}

export const style = StyleSheet.create({
  hoverCount: {
    color: Colors.GREEN,
  },
})
