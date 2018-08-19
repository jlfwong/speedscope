import {Rect, AffineTransform, Vec2, clamp} from '../lib/math'
import {CallTreeNode} from '../lib/profile'
import {Flamechart, FlamechartFrame} from '../lib/flamechart'
import {CanvasContext} from '../gl/canvas-context'
import {FlamechartRenderer} from '../gl/flamechart-renderer'
import {Sizes, FontSize, Colors, FontFamily, commonStyle} from './style'
import {cachedMeasureTextWidth, ELLIPSIS, trimTextMid} from '../lib/text-utils'
import {style} from './flamechart-style'
import {h, Component} from 'preact'
import {css} from 'aphrodite'

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
  selectedNode: CallTreeNode | null

  onNodeHover: (hover: {node: CallTreeNode; event: MouseEvent} | null) => void
  onNodeSelect: (node: CallTreeNode | null) => void

  configSpaceViewportRect: Rect
  transformViewport: (transform: AffineTransform) => void
  setConfigSpaceViewportRect: (rect: Rect) => void

  logicalSpaceViewportSize: Vec2
  setLogicalSpaceViewportBounds: (size: Vec2) => void
}

export class FlamechartPanZoomView extends Component<FlamechartPanZoomViewProps, {}> {
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
      const y = this.props.renderInverted ? this.configSpaceSize().y - 1 - depth : depth
      const configSpaceBounds = new Rect(new Vec2(frame.start, y), new Vec2(width, 1))

      if (width < minConfigSpaceWidthToRender) return
      if (configSpaceBounds.left() > this.props.configSpaceViewportRect.right()) return
      if (configSpaceBounds.right() < this.props.configSpaceViewportRect.left()) return

      if (this.props.renderInverted) {
        if (configSpaceBounds.bottom() < this.props.configSpaceViewportRect.top()) return
      } else {
        if (configSpaceBounds.top() > this.props.configSpaceViewportRect.bottom()) return
      }

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

        if (physicalLabelBounds.width() > minWidthToRender) {
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
      const y = this.props.renderInverted ? this.configSpaceSize().y - 1 - depth : depth
      const configSpaceBounds = new Rect(new Vec2(frame.start, y), new Vec2(width, 1))

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
      const y = this.props.renderInverted ? physicalViewSize.y - physicalViewSpaceFrameHeight : 0

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(0, y, physicalViewSize.x, physicalViewSpaceFrameHeight)
      ctx.fillStyle = Colors.DARK_GRAY
      ctx.textBaseline = 'top'
      for (let x = Math.ceil(left / interval) * interval; x < right; x += interval) {
        // TODO(jlfwong): Ensure that labels do not overlap
        const pos = Math.round(configToPhysical.transformPosition(new Vec2(x, 0)).x)
        const labelText = this.props.flamechart.formatValue(x)
        const textWidth = cachedMeasureTextWidth(ctx, labelText)
        ctx.fillText(labelText, pos - textWidth - labelPaddingPx, y + labelPaddingPx)
        ctx.fillRect(pos, 0, 1, physicalViewSize.y)
      }
    }
  }

  private updateConfigSpaceViewport() {
    if (!this.container) return
    const {logicalSpaceViewportSize} = this.props
    const bounds = this.container.getBoundingClientRect()
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
    this.props.setLogicalSpaceViewportBounds(new Vec2(width, height))
  }

  onWindowResize = () => {
    this.updateConfigSpaceViewport()
    this.onBeforeFrame()
  }

  private renderRects() {
    if (!this.container) return
    this.updateConfigSpaceViewport()

    if (this.props.configSpaceViewportRect.isEmpty()) return

    this.props.canvasContext.renderBehind(this.container, () => {
      this.props.flamechartRenderer.render({
        physicalSpaceDstRect: this.physicalBounds(),
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
  private mouseDownPos: Vec2 | null = null
  private onMouseDown = (ev: MouseEvent) => {
    this.mouseDownPos = this.lastDragPos = new Vec2(ev.offsetX, ev.offsetY)
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
      this.props.onNodeHover(null)
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
    const logicalMousePos = new Vec2(ev.offsetX, ev.offsetY)
    const mouseDownPos = this.mouseDownPos
    this.mouseDownPos = null

    if (mouseDownPos && logicalMousePos.minus(mouseDownPos).length() > 5) {
      // If the cursor is more than 5 logical space pixels away from the mouse
      // down location, then don't interpret this event as a click.
      return
    }

    if (this.hoveredLabel) {
      this.props.onNodeSelect(this.hoveredLabel.node)
      this.renderCanvas()
    } else {
      this.props.onNodeSelect(null)
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

      for (let child of frame.children) {
        setHoveredLabel(child, depth + 1)
      }
    }

    for (let frame of this.props.flamechart.getLayers()[0] || []) {
      setHoveredLabel(frame)
    }

    if (this.hoveredLabel) {
      this.props.onNodeHover({node: this.hoveredLabel!.node, event: ev})
    } else {
      this.props.onNodeHover(null)
    }

    this.renderCanvas()
  }

  private onMouseLeave = (ev: MouseEvent) => {
    this.hoveredLabel = null
    this.props.onNodeHover(null)
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
    }

    if (ev.ctrlKey || ev.shiftKey || ev.metaKey) return

    if (ev.key === '0') {
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
      this.props.onNodeSelect(null)
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
