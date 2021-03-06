import {h, Component} from 'preact'
import {css} from 'aphrodite'
import {Flamechart} from '../lib/flamechart'
import {Rect, Vec2, AffineTransform, clamp} from '../lib/math'
import {FlamechartRenderer} from '../gl/flamechart-renderer'
import {getFlamechartStyle} from './flamechart-style'
import {FontFamily, FontSize, Sizes, commonStyle} from './style'
import {CanvasContext} from '../gl/canvas-context'
import {cachedMeasureTextWidth} from '../lib/text-utils'
import {Color} from '../lib/color'
import {Theme} from './themes/theme'

interface FlamechartMinimapViewProps {
  theme: Theme

  flamechart: Flamechart
  configSpaceViewportRect: Rect

  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer

  transformViewport: (transform: AffineTransform) => void
  setConfigSpaceViewportRect: (rect: Rect) => void
}

enum DraggingMode {
  DRAW_NEW_VIEWPORT,
  TRANSLATE_VIEWPORT,
}

export class FlamechartMinimapView extends Component<FlamechartMinimapViewProps, {}> {
  container: Element | null = null
  containerRef = (element: Element | null) => {
    this.container = element || null
  }

  overlayCanvas: HTMLCanvasElement | null = null
  overlayCtx: CanvasRenderingContext2D | null = null

  private physicalViewSize() {
    return new Vec2(
      this.overlayCanvas ? this.overlayCanvas.width : 0,
      this.overlayCanvas ? this.overlayCanvas.height : 0,
    )
  }

  private getStyle() {
    return getFlamechartStyle(this.props.theme)
  }

  private minimapOrigin() {
    return new Vec2(0, Sizes.FRAME_HEIGHT * window.devicePixelRatio)
  }

  private configSpaceSize() {
    return new Vec2(
      this.props.flamechart.getTotalWeight(),
      this.props.flamechart.getLayers().length,
    )
  }

  private configSpaceToPhysicalViewSpace() {
    const minimapOrigin = this.minimapOrigin()

    return AffineTransform.betweenRects(
      new Rect(new Vec2(0, 0), this.configSpaceSize()),
      new Rect(minimapOrigin, this.physicalViewSize().minus(minimapOrigin)),
    )
  }

  private logicalToPhysicalViewSpace() {
    return AffineTransform.withScale(new Vec2(window.devicePixelRatio, window.devicePixelRatio))
  }

  private windowToLogicalViewSpace() {
    if (!this.container) return new AffineTransform()
    const bounds = this.container.getBoundingClientRect()
    return AffineTransform.withTranslation(new Vec2(-bounds.left, -bounds.top))
  }

  private renderRects() {
    if (!this.container) return

    // Hasn't resized yet -- no point in rendering yet
    if (this.physicalViewSize().x < 2) return

    this.props.canvasContext.renderBehind(this.container, () => {
      this.props.flamechartRenderer.render({
        configSpaceSrcRect: new Rect(new Vec2(0, 0), this.configSpaceSize()),
        physicalSpaceDstRect: new Rect(
          this.minimapOrigin(),
          this.physicalViewSize().minus(this.minimapOrigin()),
        ),
        renderOutlines: false,
      })

      this.props.canvasContext.viewportRectangleRenderer.render({
        configSpaceViewportRect: this.props.configSpaceViewportRect,
        configSpaceToPhysicalViewSpace: this.configSpaceToPhysicalViewSpace(),
      })
    })
  }

  private renderOverlays() {
    const ctx = this.overlayCtx
    if (!ctx) return
    const physicalViewSize = this.physicalViewSize()
    ctx.clearRect(0, 0, physicalViewSize.x, physicalViewSize.y)

    const configToPhysical = this.configSpaceToPhysicalViewSpace()

    const left = 0
    const right = this.configSpaceSize().x

    // TODO(jlfwong): There's a huge amount of code duplication here between
    // this and the FlamechartView.renderOverlays(). Consolidate.

    // We want about 10 gridlines to be visible, and want the unit to be
    // 1eN, 2eN, or 5eN for some N

    // Ideally, we want an interval every 100 logical screen pixels
    const logicalToConfig = (
      this.configSpaceToPhysicalViewSpace().inverted() || new AffineTransform()
    ).times(this.logicalToPhysicalViewSpace())
    const targetInterval = logicalToConfig.transformVector(new Vec2(200, 1)).x

    const physicalViewSpaceFrameHeight = Sizes.FRAME_HEIGHT * window.devicePixelRatio
    const physicalViewSpaceFontSize = FontSize.LABEL * window.devicePixelRatio
    const labelPaddingPx = (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2

    ctx.font = `${physicalViewSpaceFontSize}px/${physicalViewSpaceFrameHeight}px ${FontFamily.MONOSPACE}`
    ctx.textBaseline = 'top'

    const minInterval = Math.pow(10, Math.floor(Math.log10(targetInterval)))
    let interval = minInterval

    if (targetInterval / interval > 5) {
      interval *= 5
    } else if (targetInterval / interval > 2) {
      interval *= 2
    }

    const theme = this.props.theme

    {
      ctx.fillStyle = Color.fromCSSHex(theme.bgPrimaryColor).withAlpha(0.8).toCSS()
      ctx.fillRect(0, 0, physicalViewSize.x, physicalViewSpaceFrameHeight)
      ctx.textBaseline = 'top'

      for (let x = Math.ceil(left / interval) * interval; x < right; x += interval) {
        // TODO(jlfwong): Ensure that labels do not overlap
        const pos = Math.round(configToPhysical.transformPosition(new Vec2(x, 0)).x)
        const labelText = this.props.flamechart.formatValue(x)
        const textWidth = Math.ceil(cachedMeasureTextWidth(ctx, labelText))

        ctx.fillStyle = theme.fgPrimaryColor
        ctx.fillText(labelText, pos - textWidth - labelPaddingPx, labelPaddingPx)
        ctx.fillStyle = theme.fgSecondaryColor
        ctx.fillRect(pos, 0, 1, physicalViewSize.y)
      }
    }
  }

  onWindowResize = () => {
    this.onBeforeFrame()
  }

  componentWillReceiveProps(nextProps: FlamechartMinimapViewProps) {
    if (this.props.flamechart !== nextProps.flamechart) {
      this.renderCanvas()
    } else if (this.props.configSpaceViewportRect != nextProps.configSpaceViewportRect) {
      this.renderCanvas()
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
    window.addEventListener('resize', this.onWindowResize)
    this.props.canvasContext.addBeforeFrameHandler(this.onBeforeFrame)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
    this.props.canvasContext.removeBeforeFrameHandler(this.onBeforeFrame)
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

  private onBeforeFrame = () => {
    this.maybeClearInteractionLock()
    this.resizeOverlayCanvasIfNeeded()
    this.renderRects()
    this.renderOverlays()
  }

  private renderCanvas = () => {
    this.props.canvasContext.requestFrame()
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

  private pan(logicalViewSpaceDelta: Vec2) {
    this.interactionLock = 'pan'
    const physicalDelta = this.logicalToPhysicalViewSpace().transformVector(logicalViewSpaceDelta)
    const configDelta = this.configSpaceToPhysicalViewSpace().inverseTransformVector(physicalDelta)

    if (!configDelta) return
    this.props.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(multiplier: number) {
    this.interactionLock = 'zoom'
    const configSpaceViewport = this.props.configSpaceViewportRect
    const configSpaceCenter = configSpaceViewport.origin.plus(configSpaceViewport.size.times(1 / 2))
    if (!configSpaceCenter) return

    const zoomTransform = AffineTransform.withTranslation(configSpaceCenter.times(-1))
      .scaledBy(new Vec2(multiplier, 1))
      .translatedBy(configSpaceCenter)

    this.props.transformViewport(zoomTransform)
  }

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault()

    this.frameHadWheelEvent = true

    const isZoom = ev.metaKey || ev.ctrlKey

    if (isZoom && this.interactionLock !== 'pan') {
      let multiplier = 1 + ev.deltaY / 100

      // On Chrome & Firefox, pinch-to-zoom maps to
      // WheelEvent + Ctrl Key. We'll accelerate it in
      // this case, since it feels a bit sluggish otherwise.
      if (ev.ctrlKey) {
        multiplier = 1 + ev.deltaY / 40
      }

      multiplier = clamp(multiplier, 0.1, 10.0)

      this.zoom(multiplier)
    } else if (this.interactionLock !== 'zoom') {
      this.pan(new Vec2(ev.deltaX, ev.deltaY))
    }

    this.renderCanvas()
  }

  private configSpaceMouse(ev: MouseEvent): Vec2 | null {
    const logicalSpaceMouse = this.windowToLogicalViewSpace().transformPosition(
      new Vec2(ev.clientX, ev.clientY),
    )
    const physicalSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(
      logicalSpaceMouse,
    )
    return this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalSpaceMouse)
  }

  private dragStartConfigSpaceMouse: Vec2 | null = null
  private dragConfigSpaceViewportOffset: Vec2 | null = null
  private draggingMode: DraggingMode | null = null
  private onMouseDown = (ev: MouseEvent) => {
    const configSpaceMouse = this.configSpaceMouse(ev)

    if (configSpaceMouse) {
      if (this.props.configSpaceViewportRect.contains(configSpaceMouse)) {
        // If dragging starting inside the viewport rectangle,
        // we'll move the existing viewport
        this.draggingMode = DraggingMode.TRANSLATE_VIEWPORT
        this.dragConfigSpaceViewportOffset = configSpaceMouse.minus(
          this.props.configSpaceViewportRect.origin,
        )
      } else {
        // If dragging starts outside the the viewport rectangle,
        // we'll start drawing a new viewport
        this.draggingMode = DraggingMode.DRAW_NEW_VIEWPORT
      }

      this.dragStartConfigSpaceMouse = configSpaceMouse
      window.addEventListener('mousemove', this.onWindowMouseMove)
      window.addEventListener('mouseup', this.onWindowMouseUp)
      this.updateCursor(configSpaceMouse)
    }
  }

  private onWindowMouseMove = (ev: MouseEvent) => {
    if (!this.dragStartConfigSpaceMouse) return
    let configSpaceMouse = this.configSpaceMouse(ev)

    if (!configSpaceMouse) return
    this.updateCursor(configSpaceMouse)

    // Clamp the mouse position to avoid weird behavior when outside the canvas bounds
    configSpaceMouse = new Rect(new Vec2(0, 0), this.configSpaceSize()).closestPointTo(
      configSpaceMouse,
    )

    if (this.draggingMode === DraggingMode.DRAW_NEW_VIEWPORT) {
      const configStart = this.dragStartConfigSpaceMouse
      let configEnd = configSpaceMouse

      if (!configStart || !configEnd) return
      const left = Math.min(configStart.x, configEnd.x)
      const right = Math.max(configStart.x, configEnd.x)

      const width = right - left
      const height = this.props.configSpaceViewportRect.height()

      this.props.setConfigSpaceViewportRect(
        new Rect(new Vec2(left, configEnd.y - height / 2), new Vec2(width, height)),
      )
    } else if (this.draggingMode === DraggingMode.TRANSLATE_VIEWPORT) {
      if (!this.dragConfigSpaceViewportOffset) return

      const newOrigin = configSpaceMouse.minus(this.dragConfigSpaceViewportOffset)
      this.props.setConfigSpaceViewportRect(
        this.props.configSpaceViewportRect.withOrigin(newOrigin),
      )
    }
  }

  private updateCursor = (configSpaceMouse: Vec2) => {
    if (this.draggingMode === DraggingMode.TRANSLATE_VIEWPORT) {
      document.body.style.cursor = 'grabbing'
      document.body.style.cursor = '-webkit-grabbing'
    } else if (this.draggingMode === DraggingMode.DRAW_NEW_VIEWPORT) {
      document.body.style.cursor = 'col-resize'
    } else if (this.props.configSpaceViewportRect.contains(configSpaceMouse)) {
      document.body.style.cursor = 'grab'
      document.body.style.cursor = '-webkit-grab'
    } else {
      document.body.style.cursor = 'col-resize'
    }
  }

  private onMouseLeave = () => {
    if (this.draggingMode == null) {
      document.body.style.cursor = 'default'
    }
  }

  private onMouseMove = (ev: MouseEvent) => {
    const configSpaceMouse = this.configSpaceMouse(ev)
    if (!configSpaceMouse) return
    this.updateCursor(configSpaceMouse)
  }

  private onWindowMouseUp = (ev: MouseEvent) => {
    this.draggingMode = null
    window.removeEventListener('mousemove', this.onWindowMouseMove)
    window.removeEventListener('mouseup', this.onWindowMouseUp)

    const configSpaceMouse = this.configSpaceMouse(ev)
    if (!configSpaceMouse) return
    this.updateCursor(configSpaceMouse)
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

  render() {
    const style = this.getStyle()

    return (
      <div
        ref={this.containerRef}
        onWheel={this.onWheel}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
        className={css(style.minimap, commonStyle.vbox)}
      >
        <canvas width={1} height={1} ref={this.overlayCanvasRef} className={css(style.fill)} />
      </div>
    )
  }
}
