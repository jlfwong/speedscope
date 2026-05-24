import {Rect, AffineTransform, Vec2, clamp} from '../lib/math'
import {CallTreeNode} from '../lib/profile'
import {Flamechart, FlamechartFrame} from '../lib/flamechart'
import {CanvasContext, getWH} from '../gl/canvas-context'
import {FlamechartRenderer} from '../gl/flamechart-renderer'
import {Sizes, FontSize, FontFamily, commonStyle, ZIndex} from './style'
import {
  cachedMeasureTextWidth,
  remapRangesToTrimmedText,
  trimTextEnd,
} from '../lib/text-utils'
import {getFlamechartStyle} from './flamechart-style'
import {h, Component} from 'preact'
import {css} from 'aphrodite'
import {ProfileSearchResults} from '../lib/profile-search'
import {BatchCanvasTextRenderer, BatchCanvasRectRenderer} from '../lib/canvas-2d-batch-renderers'
import {Color} from '../lib/color'
import {Theme} from './themes/theme'
import {getSpeedscopeWindow, inSpeedscopeWindow} from '../widgetUtils'
import {formatPercent} from '../lib/utils'
import {moreInformationFrameAtom, profileGroupAtom, searchQueryAtom, viewModeAtom} from '../app-state'
import {CopiedNotification} from './profile-table-view'
import {ViewMode} from '../lib/view-mode'
import {useAtom} from '../lib/atom'
import {resizeApp} from './application-container'
import {flamechartScheduler} from './sandwich-view'

interface FlamechartFrameLabel {
  configSpaceBounds: Rect
  node: CallTreeNode
}

/**
 * Component to visualize a Flamechart and interact with it via hovering,
 * zooming, and panning.
 *
 * There are 3 vector spaces involved:
 * - Configuration Space: In this space, the horizontal unit is ms, and the
 *   vertical unit is stack depth. Each stack frame is one unit high.
 * - Logical view space: Origin is top-left, with +y downwards. This represents
 *   the coordinate space of the view as specified in CSS: horizontal and vertical
 *   units are both "logical" pixels.
 * - Physical view space: Origin is top-left, with +y downwards. This represents
 *   the coordinate space of the view as specified in hardware pixels: horizontal
 *   and vertical units are both "physical" pixels.
 *
 * We use two canvases to draw the flamechart itself: one for the rectangles,
 * which we render via WebGL, and one for the labels, which we render via 2D
 * canvas primitives.
 */
export interface FlamechartPanZoomViewProps {
  flamechart: Flamechart
  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  displayMinimap: boolean
  displayTable: boolean
  selectedNode: CallTreeNode | null
  theme: Theme
  diffMode: boolean
  useRegWeights?: boolean
  isBothMode?: boolean

  onNodeHover: (hover: { node: CallTreeNode; event: MouseEvent } | null) => void
  onNodeSelect: (node: CallTreeNode | null) => void

  configSpaceViewportRect: Rect
  transformViewport: (transform: AffineTransform) => void
  setConfigSpaceViewportRect: (rect: Rect) => void

  logicalSpaceViewportSize: Vec2
  setLogicalSpaceViewportSize: (size: Vec2) => void

  searchResults: ProfileSearchResults | null
}

type FlamechartEvents = {
  resetView: Array<() => void>;
};

const handlers: Partial<FlamechartEvents> = {
  resetView: [],
};

export const FlamechartEventCallback = {
  onResetView: (cb: () => void) => {
    if (handlers.resetView) {
      handlers.resetView.push(cb);
    }
  },
  emitResetView: () => {
    if (handlers.resetView) {
      handlers.resetView.forEach(cb => cb());
    }
    profileGroupAtom.setSelectedFrame(null);
    profileGroupAtom.setSelectedFrameName("");
  },
  resetViewKeepFrameName: () => {
    if (handlers.resetView) {
      handlers.resetView.forEach(cb => cb());
    }
  }
};

interface FlamechartPanZoomViewState {
  contextMenuPos: null | { x: number; y: number }
  rightClickedLabel: FlamechartFrameLabel | null
  copied: boolean,
}

export class FlamechartPanZoomView extends Component<FlamechartPanZoomViewProps, FlamechartPanZoomViewState> {
  private container: Element | null = null
  private containerRef = (element: Element | null) => {
    this.container = element || null
  }

  // right click
  state: FlamechartPanZoomViewState = {
    contextMenuPos: null,
    rightClickedLabel: null,
    copied: false
  };

  private overlayCanvas: HTMLCanvasElement | null = null
  private overlayCtx: CanvasRenderingContext2D | null = null

  private hoveredLabel: FlamechartFrameLabel | null = null
  private currentMode = useAtom(viewModeAtom)

  private getStyle() {
    return getFlamechartStyle(this.props.theme)
  }

  private setConfigSpaceViewportRect(r: Rect) {
    this.props.setConfigSpaceViewportRect(r)
  }

  private overlayCanvasRef = (element: Element | null) => {
    if (element) {
      this.overlayCanvas = element as HTMLCanvasElement
      this.overlayCtx = this.overlayCanvas.getContext('2d')
      this.renderCanvas()
    } else {
      this.overlayCanvas = null
      this.overlayCtx = null
    }
  }

  private configSpaceSize() {
    return new Vec2(
            this.props.flamechart.getTotalWeight(),
            this.props.flamechart.getLayers().length,
    )
  }

  private physicalViewSize() {
    return new Vec2(
            this.overlayCanvas ? this.overlayCanvas.width : 0,
            this.overlayCanvas ? this.overlayCanvas.height : 0,
    )
  }

  private physicalBounds(): Rect {
    if (this.props.renderInverted) {
      // If we're rendering inverted and the flamegraph won't fill the viewport,
      // we want to stick the flamegraph to the bottom of the viewport, not the top.

      const physicalViewportHeight = this.physicalViewSize().y
      const physicalFlamegraphHeight =
              (this.configSpaceSize().y + 1) *
              this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT *
              window.devicePixelRatio

      if (physicalFlamegraphHeight < physicalViewportHeight) {
        return new Rect(
                new Vec2(0, physicalViewportHeight - physicalFlamegraphHeight),
                this.physicalViewSize(),
        )
      }
    }

    return new Rect(new Vec2(0, 0), this.physicalViewSize())
  }

  private LOGICAL_VIEW_SPACE_FRAME_HEIGHT = Sizes.FRAME_HEIGHT

  private configSpaceToPhysicalViewSpace() {
    return AffineTransform.betweenRects(this.props.configSpaceViewportRect, this.physicalBounds())
  }

  private logicalToPhysicalViewSpace() {
    return AffineTransform.withScale(new Vec2(window.devicePixelRatio, window.devicePixelRatio))
  }

  private resizeOverlayCanvasIfNeeded() {
    if (!this.overlayCanvas) return
    let {width, height} = getWH(this.overlayCanvas)
    {
      /*
      We render text at a higher resolution then scale down to
      ensure we're rendering at 1:1 device pixel ratio.
      This ensures our text is rendered crisply.
    */
    }
    width = Math.floor(width)
    height = Math.floor(height)

    // Still initializing: don't resize yet
    if (width === 0 || height === 0) return

    const scaledWidth = width * window.devicePixelRatio
    const scaledHeight = height * window.devicePixelRatio

    if (scaledWidth === this.overlayCanvas.width && scaledHeight === this.overlayCanvas.height)
      return

    this.overlayCanvas.width = scaledWidth
    this.overlayCanvas.height = scaledHeight
  }


  private formatValue(node: CallTreeNode) {
    const weight = this.props.useRegWeights ? node.getRegTotalWeight() : node.getTotalWeight()
    const diffStr = this.props.diffMode ? `, D: ${node.frame.getDiffPercStr()}` : ""
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = (100 * weight) / totalWeight
    const formattedPercent = formatPercent(percent)
    return ` (${formattedPercent} ${this.props.flamechart.formatValue(weight)}${diffStr})`
  }


  // static overlays, without toolip
  shouldRerenderOverlays = true;
  labelBatch = new BatchCanvasTextRenderer()
  fadedLabelBatch = new BatchCanvasTextRenderer()
  matchedTextHighlightBatch = new BatchCanvasRectRenderer()
  directlySelectedOutlineBatch = new BatchCanvasRectRenderer()
  indirectlySelectedOutlineBatch = new BatchCanvasRectRenderer()
  fadedRactBatch = new BatchCanvasRectRenderer()
  tinyFadedRectBatch = new BatchCanvasRectRenderer()
  highlightedRactBatch = new BatchCanvasRectRenderer()

  private renderOverlays() {
    const ctx = this.overlayCtx
    if (!ctx) return
    if (this.props.configSpaceViewportRect.isEmpty()) return

    const configToPhysical = this.configSpaceToPhysicalViewSpace()

    const physicalViewSpaceFontSize = FontSize.LABEL * window.devicePixelRatio
    const physicalViewSpaceFrameHeight =
            this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT * window.devicePixelRatio

    const physicalViewSize = this.physicalViewSize()

    ctx.clearRect(0, 0, physicalViewSize.x, physicalViewSize.y)

    ctx.font = `${physicalViewSpaceFontSize}px/${physicalViewSpaceFrameHeight}px ${FontFamily.FRAME}`
    ctx.textBaseline = 'alphabetic'

    const minWidthToRender = cachedMeasureTextWidth(ctx, 'op')
    const minConfigSpaceWidthToRender = (
            configToPhysical.inverseTransformVector(new Vec2(minWidthToRender, 0)) || new Vec2(0, 0)
    ).x

    const LABEL_PADDING_PX = 5 * window.devicePixelRatio

    const renderFrameLabelAndChildren = (frame: FlamechartFrame, bounds: Rect) => {

      let physicalLabelBounds = bounds

      if (physicalLabelBounds.left() < 0) {
        physicalLabelBounds = physicalLabelBounds
                .withOrigin(physicalLabelBounds.origin.withX(0))
                .withSize(
                        physicalLabelBounds.size.withX(
                                physicalLabelBounds.size.x + physicalLabelBounds.left(),
                        ),
                )
      }
      if (physicalLabelBounds.right() > physicalViewSize.x) {
        physicalLabelBounds = physicalLabelBounds.withSize(
                physicalLabelBounds.size.withX(physicalViewSize.x - physicalLabelBounds.left()),
        )
      }

      const match = this.props.searchResults?.getMatchForFrame(frame.node.frame, true)
      const trimmedText = trimTextEnd(
              ctx,
              frame.node.frame.name + this.formatValue(frame.node),
              physicalLabelBounds.width() - 2 * LABEL_PADDING_PX,
      )

      if (match) {
        const rangesToHighlightInTrimmedText = remapRangesToTrimmedText(trimmedText, match)

        // Once we have the character ranges to highlight, we need to
        // actually do the highlighting.
        let lastEndIndex = 0
        let left = physicalLabelBounds.left() + LABEL_PADDING_PX

        const padding = (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2 - 2
        for (let [startIndex, endIndex] of rangesToHighlightInTrimmedText) {
          left += cachedMeasureTextWidth(
                  ctx,
                  trimmedText.trimmedString.substring(lastEndIndex, startIndex),
          )
          const highlightWidth = cachedMeasureTextWidth(
                  ctx,
                  trimmedText.trimmedString.substring(startIndex, endIndex),
          )
          this.matchedTextHighlightBatch.rect({
            x: left,
            y: physicalLabelBounds.top() + padding,
            w: highlightWidth,
            h: physicalViewSpaceFrameHeight - 2 * padding,
          })

          left += highlightWidth
          lastEndIndex = endIndex
        }
      }

      const batch = this.props.searchResults != null && !match ? this.fadedLabelBatch : this.labelBatch
      // In diff mode, use white text for red backgrounds (REG) when intensity is high
      let textColor: string | undefined
      if (this.props.diffMode) {
        const diffRatio = frame.node.frame.getDiffRatio()
        // Only for red (positive ratio / REG), use white text when over threshold
        if (diffRatio > 0.75) {
          textColor = '#ffffff'
        }
      }
      batch.text({
        text: trimmedText.trimmedString,

        // This is specifying the position of the starting text baseline.
        x: physicalLabelBounds.left() + LABEL_PADDING_PX,
        y: Math.round(
                physicalLabelBounds.bottom() -
                (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2,
        ),
        color: textColor,
      })
    }

    const fadedMinRenderRatio = 0.1
    const minWidth = 1 * window.devicePixelRatio
    const frameOutlineWidth = 2 * window.devicePixelRatio
    const selectedRectOutlineWidth = 4 * window.devicePixelRatio
    ctx.strokeStyle = this.props.theme.selectionSecondaryColor
    const minConfigSpaceWidthToRenderOutline = (
            configToPhysical.inverseTransformVector(new Vec2(2, 0)) || new Vec2(0, 0)
    ).x

    const renderSpecialFrameOutlines = (frame: FlamechartFrame, physicalRectBounds: Rect, width: number) => {
      if (!this.props.searchResults?.getMatchForFrame(frame.node.frame) && !this.props.selectedNode && !this.dbClicked) {
        const newFaded = {
          x: Math.round(physicalRectBounds.left() + frameOutlineWidth / 2 - 1),
          y: Math.round(physicalRectBounds.top() + frameOutlineWidth / 2),
          w: Math.round(Math.max(minWidth, physicalRectBounds.width()) - 1),
          h: Math.round(Math.max(minWidth, physicalRectBounds.height() - 1)),
        }
        if (width >= minConfigSpaceWidthToRenderOutline)
          this.fadedRactBatch.rect(newFaded)
        else if (width >= fadedMinRenderRatio * minConfigSpaceWidthToRenderOutline) this.tinyFadedRectBatch.rect(newFaded)
      }

      const shouldHighlight = this.props.searchResults?.getMatchForFrame(frame.node.frame) && !this.props.selectedNode
      if (shouldHighlight && !this.dbClicked) {
        const hightlightedRect = {
          x: Math.round(physicalRectBounds.left() + frameOutlineWidth / 2 - 1),
          y: Math.round(physicalRectBounds.top() + frameOutlineWidth / 2),
          w: Math.round(Math.max(minWidth, physicalRectBounds.width() - 1)),
          h: Math.round(Math.max(minWidth, physicalRectBounds.height() - 1)),
        }
        this.highlightedRactBatch.rect(hightlightedRect)
      }

      if (this.dbClicked) {
        const selected = {
          x: Math.round(physicalRectBounds.left() + 1 + frameOutlineWidth / 2),
          y: Math.round(physicalRectBounds.top() + 1 + frameOutlineWidth / 2),
          w: Math.round(Math.max(minWidth, physicalRectBounds.width() - 2 - frameOutlineWidth)),
          h: Math.round(Math.max(minWidth, physicalRectBounds.height() - 2 - frameOutlineWidth)),
        }
        if (this.dbClicked === frame.node)
          this.directlySelectedOutlineBatch.rect(selected)
        if (shouldHighlight)
          this.indirectlySelectedOutlineBatch.rect(selected)
      }

      if (this.props.selectedNode != null && frame.node.frame === this.props.selectedNode.frame) {
        let batch =
                frame.node === this.props.selectedNode
                        ? this.directlySelectedOutlineBatch
                        : this.indirectlySelectedOutlineBatch

        batch.rect({
          x: Math.round(physicalRectBounds.left() + 1 + frameOutlineWidth / 2),
          y: Math.round(physicalRectBounds.top() + 1 + frameOutlineWidth / 2),
          w: Math.round(Math.max(minWidth, physicalRectBounds.width() - 2 - frameOutlineWidth)),
          h: Math.round(Math.max(minWidth, physicalRectBounds.height() - 2 - frameOutlineWidth)),
        })
      }
    }


    const layers = this.props.flamechart.getLayers()
    if (!layers.length) return

    const view = this.props.configSpaceViewportRect
    const left = view.left()
    const right = view.right()

    const depthStart = this.props.renderInverted ? 0 : Math.max(0, Math.floor(view.top()))
    this.props.searchResults?.searchQueryFromInputBox
    const withSpecialOutlines = this.props.selectedNode != null || this.props.searchResults != null;

    const renderVisiableNodesDFS = (node: FlamechartFrame, depth: number) => {
      if (node.start > right || node.end < left) return;
      const width = node.end - node.start;

      const y = this.props.renderInverted ? this.configSpaceSize().y - 1 - depth : depth
      const configSpaceBounds = new Rect(new Vec2(node.start, y), new Vec2(width, 1))
      const physicalRectBounds = configToPhysical.transformRect(configSpaceBounds)
      if (!this.props.renderInverted && !configSpaceBounds.hasIntersectionWith(this.props.configSpaceViewportRect)) return;

      if (withSpecialOutlines) renderSpecialFrameOutlines(node, physicalRectBounds, width)

      const noLabel = physicalRectBounds.width() < minWidthToRender && width < minConfigSpaceWidthToRender
      if (!noLabel) renderFrameLabelAndChildren(node, physicalRectBounds)

      for (const kid of node.children) {
        renderVisiableNodesDFS(kid, depth + 1)
      }
    }

    if (this.shouldRerenderOverlays) {
      this.labelBatch.clean()
      this.fadedLabelBatch.clean()
      this.matchedTextHighlightBatch.clean()
      this.directlySelectedOutlineBatch.clean()
      this.indirectlySelectedOutlineBatch.clean()
      this.fadedRactBatch.clean()
      this.tinyFadedRectBatch.clean()
      this.highlightedRactBatch.clean()

      const inViewRoots = this.props.flamechart.getLayers()[depthStart]
      for (const f of inViewRoots) {
        renderVisiableNodesDFS(f, depthStart)
      }
    }

    const theme = this.props.theme

    // render faded background before matched
    this.tinyFadedRectBatch.columnFill(ctx, theme.searchFadedFrameColor)
    this.fadedRactBatch.fill(ctx, theme.searchFadedFrameColor)
    this.highlightedRactBatch.fill(ctx, theme.searchMatchSecondaryColor)
    this.matchedTextHighlightBatch.fill(ctx, theme.searchMatchSecondaryColor)
    this.fadedLabelBatch.fill(ctx, theme.searchFadedTextColor)
    this.indirectlySelectedOutlineBatch.stroke(ctx, theme.selectionSecondaryColor, selectedRectOutlineWidth)
    this.directlySelectedOutlineBatch.stroke(ctx, theme.selectionPrimaryColor, selectedRectOutlineWidth)
    this.labelBatch.fill(
            ctx,
            this.props.searchResults != null ? theme.searchMatchTextColor : theme.frameNodeNameColor,
    )

    if (this.hoveredLabel) {
      let color: string = theme.fgPrimaryColor
      if (this.props.selectedNode === this.hoveredLabel.node) {
        color = theme.selectionPrimaryColor
      }

      ctx.lineWidth = 2 * devicePixelRatio
      ctx.strokeStyle = color

      const physicalViewBounds = configToPhysical.transformRect(this.hoveredLabel.configSpaceBounds)
      ctx.strokeRect(
              Math.round(physicalViewBounds.left()),
              Math.round(physicalViewBounds.top()),
              Math.round(Math.max(0, physicalViewBounds.width())),
              Math.round(Math.max(0, physicalViewBounds.height())),
      )
    }

    // this.renderTimeIndicators()
  }

  private renderTimeIndicators() {
    const ctx = this.overlayCtx
    if (!ctx) return

    const physicalViewSpaceFrameHeight =
            this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT * window.devicePixelRatio
    const physicalViewSize = this.physicalViewSize()
    const configToPhysical = this.configSpaceToPhysicalViewSpace()
    const physicalViewSpaceFontSize = FontSize.LABEL * window.devicePixelRatio
    const labelPaddingPx = (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2

    const left = this.props.configSpaceViewportRect.left()
    const right = this.props.configSpaceViewportRect.right()
    // We want about 10 gridlines to be visible, and want the unit to be
    // 1eN, 2eN, or 5eN for some N
    // Ideally, we want an interval every 100 logical screen pixels
    const logicalToConfig = (
            this.configSpaceToPhysicalViewSpace().inverted() || new AffineTransform()
    ).times(this.logicalToPhysicalViewSpace())
    const targetInterval = logicalToConfig.transformVector(new Vec2(200, 1)).x
    const minInterval = Math.pow(10, Math.floor(Math.log10(targetInterval)))
    let interval = minInterval
    if (targetInterval / interval > 5) {
      interval *= 5
    } else if (targetInterval / interval > 2) {
      interval *= 2
    }

    const theme = this.props.theme

    {
      const y = this.props.renderInverted ? physicalViewSize.y - physicalViewSpaceFrameHeight : 0

      ctx.fillStyle = Color.fromCSSHex(theme.bgPrimaryColor).withAlpha(0.8).toCSS()
      ctx.fillRect(0, y, physicalViewSize.x, physicalViewSpaceFrameHeight)
      ctx.textBaseline = 'top'
      for (let x = Math.ceil(left / interval) * interval; x < right; x += interval) {
        // TODO(jlfwong): Ensure that labels do not overlap
        const pos = Math.round(configToPhysical.transformPosition(new Vec2(x, 0)).x)
        const labelText = this.props.flamechart.formatValue(x)
        const textWidth = cachedMeasureTextWidth(ctx, labelText)
        ctx.fillStyle = theme.frameNodeNameColor
        ctx.fillText(labelText, pos - textWidth - labelPaddingPx, y + labelPaddingPx)
        ctx.fillStyle = theme.fgSecondaryColor
        ctx.fillRect(pos, 0, 1, physicalViewSize.y)
      }
    }
  }

  private updateConfigSpaceViewport() {
    if (!this.container) return
    const {logicalSpaceViewportSize} = this.props
    const bounds = getWH(this.container)
    const {width, height} = bounds

    // Still initializing: don't resize yet
    if (width < 2 || height < 2) return

    if (this.props.configSpaceViewportRect.isEmpty()) {
      const configSpaceViewportHeight = height / this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT
      if (this.props.renderInverted) {
        this.setConfigSpaceViewportRect(
                new Rect(
                        new Vec2(0, this.configSpaceSize().y - configSpaceViewportHeight + 1),
                        new Vec2(this.configSpaceSize().x, configSpaceViewportHeight),
                ),
        )
      } else {
        this.setConfigSpaceViewportRect(
                new Rect(new Vec2(0, -1), new Vec2(this.configSpaceSize().x, configSpaceViewportHeight)),
        )
      }
    } else if (
            !logicalSpaceViewportSize.equals(Vec2.zero) &&
            (logicalSpaceViewportSize.x !== width || logicalSpaceViewportSize.y !== height)
    ) {
      // Resize the viewport rectangle to match the window size aspect
      // ratio.
      this.setConfigSpaceViewportRect(
              this.props.configSpaceViewportRect.withSize(
                      this.props.configSpaceViewportRect.size.timesPointwise(
                              new Vec2(width / logicalSpaceViewportSize.x, height / logicalSpaceViewportSize.y),
                      ),
              ),
      )
    }

    const newSize = new Vec2(width, height)

    if (!newSize.equals(logicalSpaceViewportSize)) {
      this.props.setLogicalSpaceViewportSize(newSize)
    }
  }

  onWindowResize = () => {
    this.updateConfigSpaceViewport()
    this.onBeforeFrame()
  }

  private renderRects() {
    if (!this.container) return
    this.updateConfigSpaceViewport()

    if (this.props.configSpaceViewportRect.isEmpty()) return

    if (this.props.searchResults && !this.props.selectedNode && !this.dbClicked) return

    this.props.canvasContext.renderBehind(this.container, () => {
      this.props.flamechartRenderer.render({
        physicalSpaceDstRect: this.physicalBounds(),
        configSpaceSrcRect: this.props.configSpaceViewportRect,
        renderOutlines: true,
        diffMode: this.props.diffMode,
      })
    })
  }

  // Inertial scrolling introduces tricky interaction problems.
  // Namely, if you start panning, and hit the edge of the scrollable
  // area, the browser continues to receive WheelEvents from inertial
  // scrolling. If we start zooming by holding Cmd + scrolling, then
  // release the Cmd key, this can cause us to interpret the incoming
  // inertial scrolling events as panning. To prevent this, we introduce
  // a concept of an "Interaction Lock". Once a certain interaction has
  // begun, we don't allow the other type of interaction to begin until
  // we've received two frames with no inertial wheel events. This
  // prevents us from accidentally switching between panning & zooming.
  private frameHadWheelEvent = false
  private framesWithoutWheelEvents = 0
  private interactionLock: 'pan' | 'zoom' | null = null
  private maybeClearInteractionLock = () => {
    if (this.interactionLock) {
      if (!this.frameHadWheelEvent) {
        this.framesWithoutWheelEvents++
        if (this.framesWithoutWheelEvents >= 2) {
          this.interactionLock = null
          this.framesWithoutWheelEvents = 0
        }
      }
      this.props.canvasContext.requestFrame()
    }
    this.frameHadWheelEvent = false
  }

  private onBeforeFrame = () => {
    this.resizeOverlayCanvasIfNeeded()
    this.renderRects()
    this.renderOverlays()
    this.maybeClearInteractionLock()
  }

  private renderCanvas = () => {
    this.props.canvasContext.requestFrame()
  }

  private pan(logicalViewSpaceDelta: Vec2) {
    this.interactionLock = 'pan'

    const physicalDelta = this.logicalToPhysicalViewSpace().transformVector(logicalViewSpaceDelta)
    const configDelta = this.configSpaceToPhysicalViewSpace().inverseTransformVector(physicalDelta)

    if (this.hoveredLabel) {
      this.props.onNodeHover(null)
    }

    if (!configDelta) return
    this.props.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(logicalViewSpaceCenter: Vec2, multiplier: number) {
    this.interactionLock = 'zoom'

    const physicalCenter =
            this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceCenter)
    const configSpaceCenter =
            this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalCenter)
    if (!configSpaceCenter) return

    const zoomTransform = AffineTransform.withTranslation(configSpaceCenter.times(-1))
            .scaledBy(new Vec2(multiplier, 1))
            .translatedBy(configSpaceCenter)

    this.props.transformViewport(zoomTransform)
  }

  private lastDragPos: Vec2 | null = null
  private mouseDownPos: Vec2 | null = null
  private onMouseDown = (ev: MouseEvent) => {
    this.mouseDownPos = this.lastDragPos = new Vec2(ev.offsetX, ev.offsetY)
    this.updateCursor()
    window.addEventListener('mouseup', this.onWindowMouseUp)
  }

  private dragging = false
  private dragDelta: Vec2 | null = null
  private dragThreshold = 10
  private dragSpeed = 1.5
  private onMouseDrag = (ev: MouseEvent) => {
    if (!this.lastDragPos) return
    const logicalMousePos = new Vec2(ev.offsetX, ev.offsetY)
    const delta = this.lastDragPos.minus(logicalMousePos)

    if (Math.abs(delta.x) < this.dragThreshold && Math.abs(delta.y) < this.dragThreshold) return

    this.dragDelta = new Vec2(delta.x * this.dragSpeed, delta.y * this.dragSpeed)
    this.lastDragPos = logicalMousePos


    // When panning by scrolling, the element under
    // the cursor will change, so clear the hovered label.
    if (this.hoveredLabel) {
      this.props.onNodeHover(null)
    }

    if (!this.dragging) {
      this.dragging = true
      if (this.dragDelta) {
        this.pan(this.dragDelta)
        this.dragDelta = null
      }
      this.dragging = false
    }

  }

  private prevZoomedNode: FlamechartFrameLabel | null = null;
  private dbClicked: CallTreeNode | null = null;
  private onDbClick = (ev: MouseEvent) => {
    if (this.hoveredLabel) {
      this.dbClicked = this.hoveredLabel.node
      if (this.prevZoomedNode?.node === this.hoveredLabel.node) {
        this.prevZoomedNode = null;
        this.resetView()
        return
      }
      const hoveredBounds = this.hoveredLabel.configSpaceBounds
      const viewportRect = new Rect(
              hoveredBounds.origin.minus(new Vec2(0, 1)),
              hoveredBounds.size.withY(this.props.configSpaceViewportRect.height()),
      )
      this.prevZoomedNode = this.hoveredLabel;
      this.props.setConfigSpaceViewportRect(viewportRect)
    }
  }

  private openInSandwichView = (ev: MouseEvent) => {
    ev.preventDefault();
    const frame = this.state.rightClickedLabel?.node.frame;

    if (frame) {
      profileGroupAtom.setSelectedFrameName(frame.name)
      profileGroupAtom.setSelectedFrame(frame)
      viewModeAtom.set(ViewMode.SANDWICH_VIEW)
      this.closeMenu()
    }
  }
  private moreInformation = (ev: MouseEvent) => {
    ev.preventDefault();
    const name = this.state.rightClickedLabel?.node.frame.name;
    if (!name) return '';
    moreInformationFrameAtom.set(name);
    this.closeMenu()
  }
  private searchFrameMethod = (ev: MouseEvent) => {
    ev.preventDefault();
    const name = this.state.rightClickedLabel?.node.frame.name;
    if (!name) return '';
    const lastDotIndex = name.lastIndexOf('.');
    const methodName = lastDotIndex !== -1 ? name.substring(lastDotIndex + 1) : name;

    if (methodName) {
      searchQueryAtom.set(methodName)
      this.closeMenu()
    }
  }
  private copyRightClickedLabelName = (ev: MouseEvent) => {
    ev.preventDefault();
    const name = this.state.rightClickedLabel?.node.frame.name;

    if (name) {
      navigator.clipboard.writeText(name).then(() => {
        this.setState({
          contextMenuPos: null,
          copied: true
        })
        setTimeout(() => this.setState({copied: false}), 2000);
      });
    }
  }
  private onRightClick = (ev: MouseEvent) => {
    ev.preventDefault();
    if (this.hoveredLabel) {
      this.setState(
              {
                contextMenuPos: {x: ev.clientX, y: ev.clientY},
                rightClickedLabel: this.hoveredLabel,
              }
      );
    }
  }

  // private onClick = (ev: MouseEvent) => {
  //   const logicalMousePos = new Vec2(ev.offsetX, ev.offsetY)
  //   const mouseDownPos = this.mouseDownPos
  //   this.mouseDownPos = null

  //   if (mouseDownPos && logicalMousePos.minus(mouseDownPos).length() > 5) {
  //     // If the cursor is more than 5 logical space pixels away from the mouse
  //     // down location, then don't interpret this event as a click.
  //     return
  //   }

  //   if (this.hoveredLabel) {
  //     this.props.onNodeSelect(this.hoveredLabel.node)
  //     this.renderCanvas()
  //   } else {
  //     this.props.onNodeSelect(null)
  //   }
  // }

  private updateCursor() {
    if (this.lastDragPos) {
      getSpeedscopeWindow().style.cursor = 'grabbing'
      getSpeedscopeWindow().style.cursor = '-webkit-grabbing'
    } else {
      getSpeedscopeWindow().style.cursor = 'default'
    }
  }

  private onWindowMouseUp = (ev: MouseEvent) => {
    this.lastDragPos = null
    this.updateCursor()
    window.removeEventListener('mouseup', this.onWindowMouseUp)
  }

  prevHoveredLabel: FlamechartFrameLabel | null = null
  private onMouseMove = (ev: MouseEvent) => {
    this.shouldRerenderOverlays = false
    this.updateCursor()
    if (this.lastDragPos) {
      ev.preventDefault()
      this.onMouseDrag(ev)
      this.shouldRerenderOverlays = true
      return
    }

    const logicalViewSpaceMouse = new Vec2(ev.offsetX, ev.offsetY)
    const physicalViewSpaceMouse =
            this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceMouse)
    const configSpaceMouse =
            this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalViewSpaceMouse)

    if (!configSpaceMouse) return

    function binaryLocateFrame(frames: FlamechartFrame[], x: number): FlamechartFrame | null {
      let lo = 0
      let hi = frames.length - 1

      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        const frame = frames[mid]

        if (x < frame.start) hi = mid - 1
        else if (x > frame.end) lo = mid + 1
        else return frame
      }

      return null
    }

    const setHoveredLabel = () => {
      const mouseY = Math.floor(configSpaceMouse.y)
      const depth = this.props.renderInverted ? this.configSpaceSize().y - 1 - mouseY : mouseY
      const row = this.props.flamechart.getLayers()[depth] || []
      if (!row) {
        this.hoveredLabel = null
        return
      }

      const frame = binaryLocateFrame(row, configSpaceMouse.x)
      if (!frame) {
        this.hoveredLabel = null
        return
      }

      const width = frame.end - frame.start
      const y = this.props.renderInverted ? this.configSpaceSize().y - 1 - depth : depth
      const configSpaceBounds = new Rect(new Vec2(frame.start, y), new Vec2(width, 1))

      if (configSpaceMouse.x < configSpaceBounds.left()) return null
      if (configSpaceMouse.x > configSpaceBounds.right()) return null

      if (configSpaceBounds.contains(configSpaceMouse)) {
        this.hoveredLabel = {
          configSpaceBounds,
          node: frame.node,
        }
      }
    }

    // This is a dumb hack to get around what appears to be a bug in
    // TypeScript's reachability analysis. If I do the this.hoveredLabel = null
    // in the outer function body, the code below accessing
    // this.hoveredLabel!.node inside of the `if (this.hoveredLabel) {`
    // complains that "no property node on never", indicating that it thinks
    // that codepath is unreachable.
    //
    // Because this.hoveredLabel is accessed in the bound function
    // setHoveredLabel, the codepath is obviously reachable, but the type
    // checker is confused about this for some reason.
    const clearHoveredLabel = () => {
      this.hoveredLabel = null
    }
    clearHoveredLabel()

    setHoveredLabel()

    if (this.hoveredLabel) {
      this.props.onNodeHover({node: this.hoveredLabel!.node, event: ev})
      // only refresh flamegraph when label node actually updated, to avoid performance issue
      if (this.hoveredLabel.node != this.prevHoveredLabel?.node) {
        this.prevHoveredLabel = this.hoveredLabel // save last rendered label
        this.renderOverlays()
      }
    } else {
      this.props.onNodeHover(null)
    }

    this.shouldRerenderOverlays = true
  }

  private onMouseLeave = (ev: MouseEvent) => {
    this.hoveredLabel = null
    this.props.onNodeHover(null)
    this.renderOverlays()
  }

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault()
    this.frameHadWheelEvent = true

    const isZoom = ev.metaKey || ev.ctrlKey

    let deltaX = ev.deltaX
    let deltaY = ev.deltaY
    if (ev.deltaMode === ev.DOM_DELTA_LINE) {
      deltaY *= this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT
      deltaX *= this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT
    }

    if (isZoom && this.interactionLock !== 'pan') {
      let multiplier = 1 + deltaY / 400

      // On Chrome & Firefox, pinch-to-zoom maps to
      // WheelEvent + Ctrl Key. We'll accelerate it in
      // this case, since it feels a bit sluggish otherwise.
      if (ev.ctrlKey) {
        multiplier = 1 + deltaY / 240
      }

      multiplier = clamp(multiplier, 0.1, 10.0)

      this.zoom(new Vec2(ev.offsetX, ev.offsetY), multiplier)
    } else if (this.interactionLock !== 'zoom') {
      this.pan(new Vec2(deltaX, deltaY))
    }
    this.renderCanvas()
  }

  public resetView(): void {
    this.dbClicked = null;
    if (!this.container) return
    const {width, height} = getWH(this.container)
    const zoomCenter = this.props.renderInverted ? new Vec2(0, height) : new Vec2(width / 2, 0)
    const zoomMultiplier = 1e9
    const panOffset = this.props.renderInverted ? new Vec2(0, 1000) : new Vec2(0, -1000)

    const center = this.logicalToPhysicalViewSpace().transformPosition(zoomCenter)
    const configSpaceCenter = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(center)
    if (!configSpaceCenter) return
    const zoomTrans = AffineTransform.withTranslation(configSpaceCenter.times(-1))
            .scaledBy(new Vec2(zoomMultiplier, 1))
            .translatedBy(configSpaceCenter)
    const merged = zoomTrans.translatedBy(panOffset)
    this.props.transformViewport(merged)
    this.props.onNodeSelect(null)
    resizeApp(true)
  }

  private closeMenu = () => this.setState({contextMenuPos: null, rightClickedLabel: null, copied: false})

  private handleGlobalClick = (ev: MouseEvent) => {
    const menu = document.getElementById("context-menu")
    if (menu && !menu.contains(ev.target as Node)) this.closeMenu()
  }

  private copiedNotification() {
    const copied = this.state.copied
    if (!copied) return null
    return <CopiedNotification/>
  }

  private renderContextMenu() {
    const pos = this.state.contextMenuPos
    if (pos == null) return null

    const isSandwich = this.currentMode === ViewMode.SANDWICH_VIEW
    const commonItems = [
      {key: "copy", label: "🗐 Copy Name", onClick: this.copyRightClickedLabelName},
      {key: "explain", label: "💡 More Information", onClick: this.moreInformation},
      {key: "search", label: "🔍 Search Similar Nodes", onClick: this.searchFrameMethod},
    ]
    const sandwichItems = commonItems
    const flamegraphItems = [
      ...commonItems,
      {key: "toSandwich", label: "🥪 Open In Sandwich View", onClick: this.openInSandwichView}
    ];
    const items = isSandwich ? sandwichItems : flamegraphItems

    const menuStyle = {
      position: "fixed",
      top: pos.y,
      left: pos.x,
      transform: "translate(6px, 6px)",
      background: "rgba(28,31,38,0.96)",
      color: "#fff",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.3)",
      boxShadow: "0 10px 24px rgba(0,0,0,.35)",
      padding: 4,
      zIndex: ZIndex.MENU,
      PointerEvents: "auto",
      userSelect: "none"
    }

    const itemStyle = {
      fontSize: "12px",
      display: "block",
      padding: "8px 12px",
      borderRadius: 6,
      whiteSpace: "nowrap",
      cursor: "pointer",
    }

    const hoverStyle = {background: "rgba(255,255,255,0.1)"}

    return <div id="context-menu" style={menuStyle} onContextMenu={e => e.preventDefault()}>
      {items.map(item => (
              <div
                      key={item.key}
                      style={itemStyle}
                      onClick={item.onClick}
                      onMouseEnter={e => Object.assign(e.currentTarget.style, hoverStyle)}
                      onMouseLeave={e => Object.assign(e.currentTarget.style, {background: ""})}
              >
                {item.label}
              </div>
      ))}
    </div>
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (!this.container) return

    if (!inSpeedscopeWindow()) return;

    const {width, height} = getWH(this.container)

    if (ev.key === '=' || ev.key === '+') {
      this.zoom(new Vec2(width / 2, height / 2), 0.5)
      ev.preventDefault()
    } else if (ev.key === '-' || ev.key === '_') {
      this.zoom(new Vec2(width / 2, height / 2), 2)
      ev.preventDefault()
    }

    if (ev.ctrlKey || ev.shiftKey || ev.metaKey) return

    // NOTE: We intentionally use ev.code rather than ev.key for
    // WASD in order to have the keys retain the same layout even
    // if the keyboard layout is not QWERTY.
    //
    // See: https://github.com/jlfwong/speedscope/pull/184
    if (ev.key === '0') {
      this.resetView()
    } else if (ev.key === 'ArrowRight' || ev.code === 'KeyD') {
      this.pan(new Vec2(100, 0))
    } else if (ev.key === 'ArrowLeft' || ev.code === 'KeyA') {
      this.pan(new Vec2(-100, 0))
    } else if (ev.key === 'ArrowUp' || ev.code === 'KeyW') {
      this.pan(new Vec2(0, -100))
    } else if (ev.key === 'ArrowDown' || ev.code === 'KeyS') {
      this.pan(new Vec2(0, 100))
    } else if (ev.key === 'Escape') {
      this.props.onNodeSelect(null)
      this.renderCanvas()
    }
  }

  private unsubscribe?: () => void;

  componentWillReceiveProps(nextProps: FlamechartPanZoomViewProps) {
    if (this.props.flamechart !== nextProps.flamechart) {
      this.hoveredLabel = null
      this.renderCanvas()
    } else if (this.props.searchResults !== nextProps.searchResults) {
      this.renderCanvas()
    } else if (this.props.selectedNode !== nextProps.selectedNode) {
      this.renderCanvas()
    } else if (this.props.configSpaceViewportRect !== nextProps.configSpaceViewportRect) {
      this.renderCanvas()
    } else if (this.props.displayMinimap !== nextProps.displayMinimap) {
      this.renderCanvas()
      this.resetView()
    } else if (this.props.displayTable !== nextProps.displayTable) {
      this.renderCanvas()
      setTimeout(() => {
        this.resetView()
      }, 50);
    } else if (this.props.canvasContext !== nextProps.canvasContext) {
      if (this.props.canvasContext) {
        this.props.canvasContext.removeBeforeFrameHandler(this.onBeforeFrame)
      }
      if (nextProps.canvasContext) {
        nextProps.canvasContext.addBeforeFrameHandler(this.onBeforeFrame)
        nextProps.canvasContext.requestFrame()
      }
    }
  }

  componentDidMount() {
    this.props.canvasContext.addBeforeFrameHandler(this.onBeforeFrame)
    window.addEventListener('resize', this.onWindowResize)
    window.addEventListener('keydown', this.onWindowKeyPress)
    FlamechartEventCallback.onResetView(() => this.resetView())
    document.addEventListener("click", this.handleGlobalClick)
    this.unsubscribe = flamechartScheduler.subscribe(({reset}) => {
      this.resetView()
    })
  }

  componentWillUnmount() {
    this.props.canvasContext.removeBeforeFrameHandler(this.onBeforeFrame)
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('keydown', this.onWindowKeyPress)
    document.removeEventListener("click", this.handleGlobalClick)
    this.unsubscribe?.()
  }

  render() {
    const style = this.getStyle()

    return (
            <div
                    className={css(style.panZoomView, commonStyle.vbox)}
                    onMouseDown={this.onMouseDown}
                    onMouseMove={this.onMouseMove}
                    onMouseLeave={this.onMouseLeave}
                    // onClick={this.onDbClick}
                    onDblClick={this.onDbClick}
                    onContextMenu={this.onRightClick}
                    onWheel={this.onWheel}
                    ref={this.containerRef}
            >
              {this.copiedNotification()}
              {this.renderContextMenu()}
              <canvas width={1} height={1} ref={this.overlayCanvasRef} className={css(style.fill)}/>
            </div>
    )
  }
}
