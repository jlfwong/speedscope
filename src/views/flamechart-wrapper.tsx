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
import {explainName} from './flamechart-view'
import {getWH} from '../gl/canvas-context'

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

  private formatDiffInfo(node: CallTreeNode): string | null {
    if (!this.props.diffMode) return null
    let basWeight = node.isInverted() ? node.frame.getRegTotalWeight() : node.frame.getTotalWeight()
    let regWeight = node.isInverted() ? node.frame.getTotalWeight() : node.frame.getRegTotalWeight()
    if (basWeight === 0 && regWeight === 0) return null

    const basFormatted = this.props.flamechart.formatValue(basWeight)
    const regFormatted = this.props.flamechart.formatValue(regWeight)
    const normalizedSuffix = this.props.diffNormalized ? ' (normalized)' : ''
    const changeStr = node.frame.getDiffPercStr()

    return `Baseline: ${basFormatted}, Regression: ${regFormatted}${normalizedSuffix}, Diff: ${changeStr}`
  }

  private formatValue(node: CallTreeNode) {
    const useRegWeights = this.props.useRegWeights ?? false
    // this node
    const weight = useRegWeights ? node.getRegTotalWeight() : node.getTotalWeight()
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = (100 * weight) / totalWeight
    const formattedPercent = formatPercent(percent)
    // all nodes (frame)
    const weightF = useRegWeights ? node.frame.getRegTotalWeight() : node.frame.getTotalWeight()
    const percentF = (100 * weightF) / totalWeight
    const formattedPercentF = formatPercent(percentF)
    const hoverTip = weight !== weightF ? `This: ${this.props.flamechart.formatValue(weight)} (${formattedPercent}), All: ${this.props.flamechart.formatValue(weightF)} (${formattedPercentF})`
            : `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
    return hoverTip
  }

  private renderTooltip() {
    if (!this.container) return null
    const {hover} = this.props
    if (!hover) return null
    const {width, height, left, top} = getWH(this.container)
    const offset = new Vec2(hover.event.clientX - left, hover.event.clientY - top)
    const style = getStyle(this.props.theme)
    const frame = hover.node.frame
    const diffInfo = this.formatDiffInfo(hover.node)

    return (
            <Hovertip containerSize={new Vec2(width, height)} offset={offset}>
              <div>{frame.name}</div>
              <div className={css(style.hoverCount)}>
                {this.formatValue(hover.node)}
              </div>
              {diffInfo && (
                      <div className={css(style.hoverCount)}>
                        {diffInfo}
                      </div>
              )}
              <div className={css(style.hoverCount)}>
                {explainName(hover.node)}
              </div>
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
                      displayMinimap={this.props.displayMinimap}
                      displayTable={this.props.displayTable}
                      diffMode={this.props.diffMode}
                      useRegWeights={this.props.useRegWeights}
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
