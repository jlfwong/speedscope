import {h} from 'preact'
import {css, StyleDeclarationValue} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {CallTreeNode, Frame} from './profile'
import {Flamechart, FlamechartFrame} from './flamechart'

import {Rect, Vec2, AffineTransform, clamp} from './math'
import {cachedMeasureTextWidth, formatPercent} from './utils'
import {FlamechartMinimapView} from './flamechart-minimap-view'

import {style} from './flamechart-style'
import {FontSize, FontFamily, Colors, Sizes, commonStyle} from './style'
import {CanvasContext} from './canvas-context'
import {FlamechartRenderer} from './flamechart-renderer'
import {ColorChit} from './color-chit'

interface FlamechartFrameLabel {
  configSpaceBounds: Rect
  node: CallTreeNode
}

function binarySearch(
  lo: number,
  hi: number,
  f: (val: number) => number,
  target: number,
  targetRangeSize = 1,
): [number, number] {
  console.assert(!isNaN(targetRangeSize) && !isNaN(target))
  while (true) {
    if (hi - lo <= targetRangeSize) return [lo, hi]
    const mid = (hi + lo) / 2
    const val = f(mid)
    if (val < target) lo = mid
    else hi = mid
  }
}

const ELLIPSIS = '\u2026'

function buildTrimmedText(text: string, length: number) {
  const prefixLength = Math.floor(length / 2)
  const prefix = text.substr(0, prefixLength)
  const suffix = text.substr(text.length - prefixLength, prefixLength)
  return prefix + ELLIPSIS + suffix
}

function trimTextMid(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (cachedMeasureTextWidth(ctx, text) <= maxWidth) return text
  const [lo] = binarySearch(
    0,
    text.length,
    n => {
      return cachedMeasureTextWidth(ctx, buildTrimmedText(text, n))
    },
    maxWidth,
  )
  return buildTrimmedText(text, lo)
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
interface FlamechartPanZoomViewProps {
  flamechart: Flamechart

  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
  selectedNode: CallTreeNode | null

  setNodeHover: (node: CallTreeNode | null, logicalViewSpaceMouse: Vec2) => void
  setSelectedNode: (node: CallTreeNode | null) => void
  configSpaceViewportRect: Rect
  transformViewport: (transform: AffineTransform) => void
  setConfigSpaceViewportRect: (rect: Rect) => void
}

export class FlamechartPanZoomView extends ReloadableComponent<FlamechartPanZoomViewProps, {}> {
  private container: Element | null = null
  private containerRef = (element?: Element) => {
    this.container = element || null
  }

  private overlayCanvas: HTMLCanvasElement | null = null
  private overlayCtx: CanvasRenderingContext2D | null = null

  private hoveredLabel: FlamechartFrameLabel | null = null

  private setConfigSpaceViewportRect(r: Rect) {
    this.props.setConfigSpaceViewportRect(r)
  }

  private overlayCanvasRef = (element?: Element) => {
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

  private LOGICAL_VIEW_SPACE_FRAME_HEIGHT = Sizes.FRAME_HEIGHT

  private configSpaceToPhysicalViewSpace() {
    return AffineTransform.betweenRects(
      this.props.configSpaceViewportRect,
      new Rect(new Vec2(0, 0), this.physicalViewSize()),
    )
  }

  private logicalToPhysicalViewSpace() {
    return AffineTransform.withScale(new Vec2(window.devicePixelRatio, window.devicePixelRatio))
  }

  private resizeOverlayCanvasIfNeeded() {
    if (!this.overlayCanvas) return
    let {width, height} = this.overlayCanvas.getBoundingClientRect()
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

  private renderOverlays() {
    const ctx = this.overlayCtx
    if (!ctx) return
    this.resizeOverlayCanvasIfNeeded()
    if (this.props.configSpaceViewportRect.isEmpty()) return

    const configToPhysical = this.configSpaceToPhysicalViewSpace()

    const physicalViewSpaceFontSize = FontSize.LABEL * window.devicePixelRatio
    const physicalViewSpaceFrameHeight =
      this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT * window.devicePixelRatio

    const physicalViewSize = this.physicalViewSize()

    ctx.clearRect(0, 0, physicalViewSize.x, physicalViewSize.y)

    if (this.hoveredLabel) {
      let color = Colors.DARK_GRAY
      if (this.props.selectedNode === this.hoveredLabel.node) {
        color = Colors.DARK_BLUE
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

    ctx.font = `${physicalViewSpaceFontSize}px/${physicalViewSpaceFrameHeight}px ${
      FontFamily.MONOSPACE
    }`
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = Colors.DARK_GRAY

    const minWidthToRender = cachedMeasureTextWidth(ctx, 'M' + ELLIPSIS + 'M')
    const minConfigSpaceWidthToRender = (
      configToPhysical.inverseTransformVector(new Vec2(minWidthToRender, 0)) || new Vec2(0, 0)
    ).x

    const LABEL_PADDING_PX = 5 * window.devicePixelRatio

    const renderFrameLabelAndChildren = (frame: FlamechartFrame, depth = 0) => {
      const width = frame.end - frame.start
      const configSpaceBounds = new Rect(new Vec2(frame.start, depth), new Vec2(width, 1))

      if (width < minConfigSpaceWidthToRender) return
      if (configSpaceBounds.left() > this.props.configSpaceViewportRect.right()) return
      if (configSpaceBounds.right() < this.props.configSpaceViewportRect.left()) return
      if (configSpaceBounds.top() > this.props.configSpaceViewportRect.bottom()) return

      if (configSpaceBounds.hasIntersectionWith(this.props.configSpaceViewportRect)) {
        let physicalLabelBounds = configToPhysical.transformRect(configSpaceBounds)

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

        const trimmedText = trimTextMid(
          ctx,
          frame.node.frame.name,
          physicalLabelBounds.width() - 2 * LABEL_PADDING_PX,
        )

        // Note that this is specifying the position of the starting text
        // baseline.
        ctx.fillText(
          trimmedText,
          physicalLabelBounds.left() + LABEL_PADDING_PX,
          Math.round(
            physicalLabelBounds.bottom() -
              (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2,
          ),
        )
      }
      for (let child of frame.children) {
        renderFrameLabelAndChildren(child, depth + 1)
      }
    }

    for (let frame of this.props.flamechart.getLayers()[0] || []) {
      renderFrameLabelAndChildren(frame)
    }

    const frameOutlineWidth = 2 * window.devicePixelRatio
    ctx.strokeStyle = Colors.PALE_DARK_BLUE
    ctx.lineWidth = frameOutlineWidth
    const minConfigSpaceWidthToRenderOutline = (
      configToPhysical.inverseTransformVector(new Vec2(1, 0)) || new Vec2(0, 0)
    ).x
    const renderIndirectlySelectedFrameOutlines = (frame: FlamechartFrame, depth = 0) => {
      if (!this.props.selectedNode) return
      const width = frame.end - frame.start
      const configSpaceBounds = new Rect(new Vec2(frame.start, depth), new Vec2(width, 1))

      if (width < minConfigSpaceWidthToRenderOutline) return
      if (configSpaceBounds.left() > this.props.configSpaceViewportRect.right()) return
      if (configSpaceBounds.right() < this.props.configSpaceViewportRect.left()) return
      if (configSpaceBounds.top() > this.props.configSpaceViewportRect.bottom()) return

      if (configSpaceBounds.hasIntersectionWith(this.props.configSpaceViewportRect)) {
        const physicalRectBounds = configToPhysical.transformRect(configSpaceBounds)

        if (frame.node.frame === this.props.selectedNode.frame) {
          if (frame.node === this.props.selectedNode) {
            if (ctx.strokeStyle !== Colors.DARK_BLUE) {
              ctx.stroke()
              ctx.beginPath()
              ctx.strokeStyle = Colors.DARK_BLUE
            }
          } else {
            if (ctx.strokeStyle !== Colors.PALE_DARK_BLUE) {
              ctx.stroke()
              ctx.beginPath()
              ctx.strokeStyle = Colors.PALE_DARK_BLUE
            }
          }

          // Identify the flamechart frames with a function that matches the
          // selected flamechart frame.
          ctx.rect(
            Math.round(physicalRectBounds.left() + 1 + frameOutlineWidth / 2),
            Math.round(physicalRectBounds.top() + 1 + frameOutlineWidth / 2),
            Math.round(Math.max(0, physicalRectBounds.width() - 2 - frameOutlineWidth)),
            Math.round(Math.max(0, physicalRectBounds.height() - 2 - frameOutlineWidth)),
          )
        }
      }

      for (let child of frame.children) {
        renderIndirectlySelectedFrameOutlines(child, depth + 1)
      }
    }

    ctx.beginPath()
    for (let frame of this.props.flamechart.getLayers()[0] || []) {
      renderIndirectlySelectedFrameOutlines(frame)
    }
    ctx.stroke()

    this.renderTimeIndicators()
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

    {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(0, 0, physicalViewSize.x, physicalViewSpaceFrameHeight)
      ctx.fillStyle = Colors.DARK_GRAY
      ctx.textBaseline = 'top'
      for (let x = Math.ceil(left / interval) * interval; x < right; x += interval) {
        // TODO(jlfwong): Ensure that labels do not overlap
        const pos = Math.round(configToPhysical.transformPosition(new Vec2(x, 0)).x)
        const labelText = this.props.flamechart.formatValue(x)
        const textWidth = cachedMeasureTextWidth(ctx, labelText)
        ctx.fillText(labelText, pos - textWidth - labelPaddingPx, labelPaddingPx)
        ctx.fillRect(pos, 0, 1, physicalViewSize.y)
      }
    }
  }

  private lastBounds: ClientRect | null = null
  private updateConfigSpaceViewport() {
    if (!this.container) return
    const bounds = this.container.getBoundingClientRect()
    const {width, height} = bounds

    // Still initializing: don't resize yet
    if (width < 2 || height < 2) return

    if (this.lastBounds == null) {
      this.setConfigSpaceViewportRect(
        new Rect(
          new Vec2(0, -1),
          new Vec2(this.configSpaceSize().x, height / this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT),
        ),
      )
    } else if (this.lastBounds.width !== width || this.lastBounds.height !== height) {
      // Resize the viewport rectangle to match the window size aspect
      // ratio.
      this.setConfigSpaceViewportRect(
        this.props.configSpaceViewportRect.withSize(
          this.props.configSpaceViewportRect.size.timesPointwise(
            new Vec2(width / this.lastBounds.width, height / this.lastBounds.height),
          ),
        ),
      )
    }
    this.lastBounds = bounds
  }

  onWindowResize = () => {
    this.updateConfigSpaceViewport()
    this.onBeforeFrame()
  }

  private renderRects() {
    if (!this.container) return
    this.updateConfigSpaceViewport()

    if (this.props.configSpaceViewportRect.isEmpty()) return

    this.props.canvasContext.renderInto(this.container, context => {
      this.props.flamechartRenderer.render({
        physicalSpaceDstRect: new Rect(Vec2.zero, this.physicalViewSize()),
        configSpaceSrcRect: this.props.configSpaceViewportRect,
        renderOutlines: true,
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
      this.props.setNodeHover(null, Vec2.zero)
    }

    if (!configDelta) return
    this.props.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(logicalViewSpaceCenter: Vec2, multiplier: number) {
    this.interactionLock = 'zoom'

    const physicalCenter = this.logicalToPhysicalViewSpace().transformPosition(
      logicalViewSpaceCenter,
    )
    const configSpaceCenter = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(
      physicalCenter,
    )
    if (!configSpaceCenter) return

    const zoomTransform = AffineTransform.withTranslation(configSpaceCenter.times(-1))
      .scaledBy(new Vec2(multiplier, 1))
      .translatedBy(configSpaceCenter)

    this.props.transformViewport(zoomTransform)
  }

  private lastDragPos: Vec2 | null = null
  private onMouseDown = (ev: MouseEvent) => {
    this.lastDragPos = new Vec2(ev.offsetX, ev.offsetY)
    this.updateCursor()
    window.addEventListener('mouseup', this.onWindowMouseUp)
  }

  private onMouseDrag = (ev: MouseEvent) => {
    if (!this.lastDragPos) return
    const logicalMousePos = new Vec2(ev.offsetX, ev.offsetY)
    this.pan(this.lastDragPos.minus(logicalMousePos))
    this.lastDragPos = logicalMousePos

    // When panning by scrolling, the element under
    // the cursor will change, so clear the hovered label.
    if (this.hoveredLabel) {
      this.props.setNodeHover(null, logicalMousePos)
    }
  }

  private onDblClick = (ev: MouseEvent) => {
    if (this.hoveredLabel) {
      const hoveredBounds = this.hoveredLabel.configSpaceBounds
      const viewportRect = new Rect(
        hoveredBounds.origin.minus(new Vec2(0, 1)),
        hoveredBounds.size.withY(this.props.configSpaceViewportRect.height()),
      )
      this.props.setConfigSpaceViewportRect(viewportRect)
    }
  }

  private onClick = (ev: MouseEvent) => {
    if (this.hoveredLabel) {
      this.props.setSelectedNode(this.hoveredLabel.node)
      this.renderCanvas()
    } else {
      this.props.setSelectedNode(null)
    }
  }

  private updateCursor() {
    if (this.lastDragPos) {
      document.body.style.cursor = 'grabbing'
      document.body.style.cursor = '-webkit-grabbing'
    } else {
      document.body.style.cursor = 'default'
    }
  }

  private onWindowMouseUp = (ev: MouseEvent) => {
    this.lastDragPos = null
    this.updateCursor()
    window.removeEventListener('mouseup', this.onWindowMouseUp)
  }

  private onMouseMove = (ev: MouseEvent) => {
    this.updateCursor()
    if (this.lastDragPos) {
      ev.preventDefault()
      this.onMouseDrag(ev)
      return
    }
    this.hoveredLabel = null
    const logicalViewSpaceMouse = new Vec2(ev.offsetX, ev.offsetY)
    const physicalViewSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(
      logicalViewSpaceMouse,
    )
    const configSpaceMouse = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(
      physicalViewSpaceMouse,
    )

    if (!configSpaceMouse) return

    const setHoveredLabel = (frame: FlamechartFrame, depth = 0) => {
      const width = frame.end - frame.start
      const configSpaceBounds = new Rect(new Vec2(frame.start, depth), new Vec2(width, 1))
      if (configSpaceMouse.x < configSpaceBounds.left()) return null
      if (configSpaceMouse.x > configSpaceBounds.right()) return null

      if (configSpaceBounds.contains(configSpaceMouse)) {
        this.hoveredLabel = {
          configSpaceBounds,
          node: frame.node,
        }
      }

      for (let child of frame.children) {
        setHoveredLabel(child, depth + 1)
      }
    }

    for (let frame of this.props.flamechart.getLayers()[0] || []) {
      setHoveredLabel(frame)
    }

    if (this.hoveredLabel) {
      this.props.setNodeHover(this.hoveredLabel!.node, logicalViewSpaceMouse)
    } else {
      this.props.setNodeHover(null, logicalViewSpaceMouse)
    }

    this.renderCanvas()
  }

  private onMouseLeave = (ev: MouseEvent) => {
    this.hoveredLabel = null
    this.props.setNodeHover(null, Vec2.zero)
    this.renderCanvas()
  }

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault()
    this.frameHadWheelEvent = true

    const isZoom = ev.metaKey || ev.ctrlKey

    let deltaY = ev.deltaY
    let deltaX = ev.deltaX
    if (ev.deltaMode === ev.DOM_DELTA_LINE) {
      deltaY *= this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT
      deltaX *= this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT
    }

    if (isZoom && this.interactionLock !== 'pan') {
      let multiplier = 1 + deltaY / 100

      // On Chrome & Firefox, pinch-to-zoom maps to
      // WheelEvent + Ctrl Key. We'll accelerate it in
      // this case, since it feels a bit sluggish otherwise.
      if (ev.ctrlKey) {
        multiplier = 1 + deltaY / 40
      }

      multiplier = clamp(multiplier, 0.1, 10.0)

      this.zoom(new Vec2(ev.offsetX, ev.offsetY), multiplier)
    } else if (this.interactionLock !== 'zoom') {
      this.pan(new Vec2(deltaX, deltaY))
    }

    this.renderCanvas()
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (!this.container) return
    const {width, height} = this.container.getBoundingClientRect()

    if (ev.key === '=' || ev.key === '+') {
      this.zoom(new Vec2(width / 2, height / 2), 0.5)
      ev.preventDefault()
    } else if (ev.key === '-' || ev.key === '_') {
      this.zoom(new Vec2(width / 2, height / 2), 2)
      ev.preventDefault()
    } else if (ev.key === '0') {
      this.zoom(new Vec2(width / 2, height / 2), 1e9)
    } else if (ev.key === 'ArrowRight' || ev.key === 'd') {
      this.pan(new Vec2(100, 0))
    } else if (ev.key === 'ArrowLeft' || ev.key === 'a') {
      this.pan(new Vec2(-100, 0))
    } else if (ev.key === 'ArrowUp' || ev.key === 'w') {
      this.pan(new Vec2(0, -100))
    } else if (ev.key === 'ArrowDown' || ev.key === 's') {
      this.pan(new Vec2(0, 100))
    } else if (ev.key === 'Escape') {
      this.props.setSelectedNode(null)
      this.renderCanvas()
    }
  }

  shouldComponentUpdate() {
    return false
  }
  componentWillReceiveProps(nextProps: FlamechartPanZoomViewProps) {
    if (this.props.flamechart !== nextProps.flamechart) {
      this.hoveredLabel = null
      this.renderCanvas()
    } else if (this.props.selectedNode !== nextProps.selectedNode) {
      this.renderCanvas()
    } else if (this.props.configSpaceViewportRect !== nextProps.configSpaceViewportRect) {
      this.renderCanvas()
    }
  }
  componentDidMount() {
    this.props.canvasContext.addBeforeFrameHandler(this.onBeforeFrame)
    window.addEventListener('resize', this.onWindowResize)
    window.addEventListener('keydown', this.onWindowKeyPress)
  }
  componentWillUnmount() {
    this.props.canvasContext.removeBeforeFrameHandler(this.onBeforeFrame)
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('keydown', this.onWindowKeyPress)
  }

  render() {
    return (
      <div
        className={css(style.panZoomView, commonStyle.vbox)}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
        onClick={this.onClick}
        onDblClick={this.onDblClick}
        onWheel={this.onWheel}
        ref={this.containerRef}
      >
        <canvas width={1} height={1} ref={this.overlayCanvasRef} className={css(style.fill)} />
      </div>
    )
  }
}

interface StatisticsTableProps {
  title: string
  grandTotal: number
  selectedTotal: number
  selectedSelf: number
  cellStyle: StyleDeclarationValue
  formatter: (v: number) => string
}

class StatisticsTable extends ReloadableComponent<StatisticsTableProps, {}> {
  render() {
    const total = this.props.formatter(this.props.selectedTotal)
    const self = this.props.formatter(this.props.selectedSelf)
    const totalPerc = 100.0 * this.props.selectedTotal / this.props.grandTotal
    const selfPerc = 100.0 * this.props.selectedSelf / this.props.grandTotal

    return (
      <div className={css(style.statsTable)}>
        <div className={css(this.props.cellStyle, style.statsTableCell, style.statsTableHeader)}>
          {this.props.title}
        </div>

        <div className={css(this.props.cellStyle, style.statsTableCell)}>Total</div>
        <div className={css(this.props.cellStyle, style.statsTableCell)}>Self</div>

        <div className={css(this.props.cellStyle, style.statsTableCell)}>{total}</div>
        <div className={css(this.props.cellStyle, style.statsTableCell)}>{self}</div>

        <div className={css(this.props.cellStyle, style.statsTableCell)}>
          {formatPercent(totalPerc)}
          <div className={css(style.barDisplay)} style={{height: `${totalPerc}%`}} />
        </div>
        <div className={css(this.props.cellStyle, style.statsTableCell)}>
          {formatPercent(selfPerc)}
          <div className={css(style.barDisplay)} style={{height: `${selfPerc}%`}} />
        </div>
      </div>
    )
  }
}

interface StackTraceViewProps {
  getFrameColor: (frame: Frame) => string
  node: CallTreeNode
}
class StackTraceView extends ReloadableComponent<StackTraceViewProps, {}> {
  render() {
    const rows: JSX.Element[] = []
    let node: CallTreeNode | null = this.props.node
    for (; node && !node.isRoot(); node = node.parent) {
      const row: (JSX.Element | string)[] = []
      const {frame} = node

      row.push(<ColorChit color={this.props.getFrameColor(frame)} />)

      if (rows.length) {
        row.push(<span className={css(style.stackFileLine)}>> </span>)
      }
      row.push(frame.name)

      if (frame.file) {
        let pos = frame.file
        if (frame.line) {
          pos += `:${frame.line}`
          if (frame.col) {
            pos += `:${frame.col}`
          }
        }
        row.push(<span className={css(style.stackFileLine)}> ({pos})</span>)
      }
      rows.push(<div className={css(style.stackLine)}>{row}</div>)
    }
    return (
      <div className={css(style.stackTraceView)}>
        <div className={css(style.stackTraceViewPadding)}>{rows}</div>
      </div>
    )
  }
}

interface FlamechartDetailViewProps {
  flamechart: Flamechart
  getCSSColorForFrame: (frame: Frame) => string
  selectedNode: CallTreeNode
}

class FlamechartDetailView extends ReloadableComponent<FlamechartDetailViewProps, {}> {
  render() {
    const {flamechart, selectedNode} = this.props
    const {frame} = selectedNode

    return (
      <div className={css(style.detailView)}>
        <StatisticsTable
          title={'This Instance'}
          cellStyle={style.thisInstanceCell}
          grandTotal={flamechart.getTotalWeight()}
          selectedTotal={selectedNode.getTotalWeight()}
          selectedSelf={selectedNode.getSelfWeight()}
          formatter={flamechart.formatValue.bind(flamechart)}
        />
        <StatisticsTable
          title={'All Instances'}
          cellStyle={style.allInstancesCell}
          grandTotal={flamechart.getTotalWeight()}
          selectedTotal={frame.getTotalWeight()}
          selectedSelf={frame.getSelfWeight()}
          formatter={flamechart.formatValue.bind(flamechart)}
        />
        <StackTraceView node={selectedNode} getFrameColor={this.props.getCSSColorForFrame} />
      </div>
    )
  }
}

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
