import {CallTreeNode} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {h} from 'preact'
import {commonStyle} from './style'
import {Rect, AffineTransform, Vec2} from '../lib/math'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'
import {noop, formatPercent} from '../lib/utils'
import {Hovertip} from './hovertip'
import {FlamechartViewProps} from './flamechart-view-container'
import {withTheme} from './themes/theme'
import {StatelessComponent} from '../lib/preact-helpers'

export class FlamechartWrapper extends StatelessComponent<FlamechartViewProps> {
  private clampViewportToFlamegraph(viewportRect: Rect) {
    const {flamechart, renderInverted} = this.props
    return flamechart.getClampedConfigSpaceViewportRect({
      configSpaceViewportRect: viewportRect,
      renderInverted,
    })
  }
  private setConfigSpaceViewportRect = (configSpaceViewportRect: Rect) => {
    this.props.setConfigSpaceViewportRect(this.clampViewportToFlamegraph(configSpaceViewportRect))
  }
  private setLogicalSpaceViewportSize = (logicalSpaceViewportSize: Vec2): void => {
    this.props.setLogicalSpaceViewportSize(logicalSpaceViewportSize)
  }

  private transformViewport = (transform: AffineTransform) => {
    this.setConfigSpaceViewportRect(transform.transformRect(this.props.configSpaceViewportRect))
  }
  private formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = (100 * weight) / totalWeight
    const formattedPercent = formatPercent(percent)
    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
  }
  private renderTooltip() {
    if (!this.container) return null
    const {hover} = this.props
    if (!hover) return null
    const {width, height, left, top} = this.container.getBoundingClientRect()
    const offset = new Vec2(hover.event.clientX - left, hover.event.clientY - top)
    const style = getStyle(this.props.theme)
    const frame = hover.node.frame

    return (
      <Hovertip containerSize={new Vec2(width, height)} offset={offset}>
        <span className={css(style.hoverCount)}>
          {this.formatValue(hover.node.getTotalWeight())}
        </span>{' '}
        {frame.name}
        {frame.file ? (
          <div>
            {frame.file}:{frame.line}
          </div>
        ) : undefined}
      </Hovertip>
    )
  }
  container: HTMLDivElement | null = null
  containerRef = (container: Element | null) => {
    this.container = (container as HTMLDivElement) || null
  }
  private setNodeHover = (
    hover: {
      node: CallTreeNode
      event: MouseEvent
    } | null,
  ) => {
    this.props.setNodeHover(hover)
  }
  render() {
    return (
      <div
        className={css(commonStyle.fillY, commonStyle.fillX, commonStyle.vbox)}
        ref={this.containerRef}
      >
        <FlamechartPanZoomView
          theme={this.props.theme}
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
          setLogicalSpaceViewportSize={this.setLogicalSpaceViewportSize}
          searchResults={null}
        />
        {this.renderTooltip()}
      </div>
    )
  }
}

export const getStyle = withTheme(theme =>
  StyleSheet.create({
    hoverCount: {
      color: theme.weightColor,
    },
  }),
)
