import {h, Fragment} from 'preact'
import {css} from 'aphrodite'

import {CallTreeNode} from '../lib/profile'

import {Rect, Vec2, AffineTransform} from '../lib/math'
import {formatPercent} from '../lib/utils'
import {FlamechartMinimapView} from './flamechart-minimap-view'

import {Sizes, commonStyle} from './style'
import {FlamechartPanZoomView} from './flamechart-pan-zoom-view'
import {Hovertip} from './hovertip'
import {FlamechartViewProps} from './flamechart-view-container'
import {ProfileSearchContext} from './search-view'
import {getFlamechartStyle} from './flamechart-style'
import {StatelessComponent} from '../lib/preact-helpers'
import {getWH} from '../gl/canvas-context'

export function explainName(node: CallTreeNode) {
  const name = node.frame.name;
  // TODO: design an interface that allows callers to set predicates or rules
  const async = name.startsWith('@') ? 'async method' : '';

  const regex = /.*_(\d+)_(\d+)/;
  const match = name.match(regex);

  let lineNum = '';
  if (match) {
    const line = match[1];
    const pos = match[2];
    lineNum = `at line ${line} col ${pos}`;
  }

  const explain = [lineNum, async].filter(Boolean).join(', ');

  return explain;
}

export class FlamechartView extends StatelessComponent<FlamechartViewProps> {
  private getStyle() {
    return getFlamechartStyle(this.props.theme)
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

    const width = this.props.flamechart.getClampedViewportWidth(viewportRect.size.x)
    const size = viewportRect.size.withX(width)

    const origin = Vec2.clamp(
            viewportRect.origin,
            new Vec2(0, -1),
            Vec2.max(
                    Vec2.zero,
                    configSpaceSize.minus(size).plus(new Vec2(0, configSpaceDetailViewHeight + 1)),
            ),
    )

    this.props.setConfigSpaceViewportRect(new Rect(origin, viewportRect.size.withX(width)))
  }

  private setLogicalSpaceViewportSize = (logicalSpaceViewportSize: Vec2): void => {
    this.props.setLogicalSpaceViewportSize(logicalSpaceViewportSize)
  }

  private transformViewport = (transform: AffineTransform): void => {
    const viewportRect = transform.transformRect(this.props.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  private onNodeHover = (hover: { node: CallTreeNode; event: MouseEvent } | null) => {
    this.props.setNodeHover(hover)
  }

  onNodeClick = (node: CallTreeNode | null) => {
    this.props.setSelectedNode(node)
  }

  formatValue(node: CallTreeNode) {
    // this node
    const weight = node.getTotalWeight()
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = (100 * weight) / totalWeight
    const formattedPercent = formatPercent(percent)
    // all nodes (frame)
    const weightF = node.frame.getTotalWeight()
    const percentF = (100 * weightF) / totalWeight
    const formattedPercentF = formatPercent(percentF)
    const hoverTip = weight !== weightF ? `This: ${this.props.flamechart.formatValue(weight)} (${formattedPercent}), All: ${this.props.flamechart.formatValue(weightF)} (${formattedPercentF})`
            : `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
    return hoverTip
  }

  formatDiffInfo(node: CallTreeNode): string | null {
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

  renderTooltip() {
    if (!this.container) return null

    const {hover} = this.props
    if (!hover) return null
    const {width, height, left, top} = getWH(this.container)
    const offset = new Vec2(hover.event.clientX - left, hover.event.clientY - top)
    const frame = hover.node.frame

    const style = this.getStyle()

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

  render() {
    const style = this.getStyle()

    return (
            <div className={css(style.fill, commonStyle.vbox)} ref={this.containerRef}>
              {this.props.displayMinimap && (
                      <FlamechartMinimapView
                              theme={this.props.theme}
                              configSpaceViewportRect={this.props.configSpaceViewportRect}
                              transformViewport={this.transformViewport}
                              flamechart={this.props.flamechart}
                              flamechartRenderer={this.props.flamechartRenderer}
                              canvasContext={this.props.canvasContext}
                              diffMode={this.props.diffMode}
                              setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
                      />
              )}
              <ProfileSearchContext.Consumer>
                {searchResults => (
                        <Fragment>
                          <FlamechartPanZoomView
                                  theme={this.props.theme}
                                  canvasContext={this.props.canvasContext}
                                  flamechart={this.props.flamechart}
                                  flamechartRenderer={this.props.flamechartRenderer}
                                  renderInverted={false}
                                  displayMinimap={this.props.displayMinimap}
                                  displayTable={this.props.displayTable}
                                  diffMode={this.props.diffMode}
                                  useRegWeights={this.props.useRegWeights}
                                  isBothMode={this.props.isBothMode}
                                  onNodeHover={this.onNodeHover}
                                  onNodeSelect={this.onNodeClick}
                                  selectedNode={this.props.selectedNode}
                                  transformViewport={this.transformViewport}
                                  configSpaceViewportRect={this.props.configSpaceViewportRect}
                                  setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
                                  logicalSpaceViewportSize={this.props.logicalSpaceViewportSize}
                                  setLogicalSpaceViewportSize={this.setLogicalSpaceViewportSize}
                                  searchResults={searchResults}
                          />
                        </Fragment>
                )}
              </ProfileSearchContext.Consumer>
              {this.renderTooltip()}
              {/* {this.props.selectedNode && (
          <FlamechartDetailView
            flamechart={this.props.flamechart}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            selectedNode={this.props.selectedNode}
          />
        )} */}
            </div>
    )
  }
}
