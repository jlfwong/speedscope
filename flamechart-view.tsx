import {h} from 'preact'
import {css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import { CallTreeNode } from './profile'
import { Flamechart, FlamechartFrame } from './flamechart'

import { Rect, Vec2, AffineTransform, clamp } from './math'
import { cachedMeasureTextWidth } from "./utils";
import { FlamechartMinimapView } from "./flamechart-minimap-view"

import { style, Sizes } from './flamechart-style'
import { FontSize, FontFamily, Colors } from './style'
import { CanvasContext } from './canvas-context'
import { FlamechartRenderer } from './flamechart-renderer'

interface FlamechartFrameLabel {
  configSpaceBounds: Rect
  node: CallTreeNode
}

function binarySearch(lo: number, hi: number, f: (val: number) => number, target: number, targetRangeSize = 1): [number, number] {
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
  const [lo,] = binarySearch(0, text.length, (n) => {
    return cachedMeasureTextWidth(ctx, buildTrimmedText(text, n))
  }, maxWidth)
  return buildTrimmedText(text, lo)
}

const DEVICE_PIXEL_RATIO = window.devicePixelRatio

/**
 * Component to visualize a Flamechart and interact with it via hovering,
 * zooming, and panning.
 *
 * There are 4 vector spaces involved:
 * - Configuration Space: In this space, the horizontal unit is ms, and the
 *   vertical unit is stack depth. Each stack frame is one unit high.
 * - Logical view space: Origin is top-left, with +y downwards. This represents
 *   the coordinate space of the view as specified in CSS: horizontal and vertical
 *   units are both "logical" pixels.
 * - Physical view space: Origin is top-left, with +y downwards. This represents
 *   the coordinate space of the view as specified in hardware pixels: horizontal
 *   and vertical units are both "physical" pixels.
 * - Normalized device coordinates: Origin is center, +y upwards. This is the
 *   coordinate space used by GL, which we use to render the frame rectangles
 *   efficiently.
 *
 * We use two canvases to draw the flamechart itself: one for the rectangles,
 * which we render via WebGL, and one for the labels, which we render via 2D
 * canvas primitives.
 */
interface FlamechartPanZoomViewProps {
  flamechart: Flamechart

  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer

  setNodeHover: (node: CallTreeNode | null, logicalViewSpaceMouse: Vec2) => void
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
      this.props.flamechart.getLayers().length
    )
  }

  private physicalViewSize() {
    return new Vec2(
      this.overlayCanvas ? this.overlayCanvas.width : 0,
      this.overlayCanvas ? this.overlayCanvas.height : 0
    )
  }

  private LOGICAL_VIEW_SPACE_FRAME_HEIGHT = 16

  private configSpaceToPhysicalViewSpace() {
    return AffineTransform.betweenRects(
      this.props.configSpaceViewportRect,
      new Rect(new Vec2(0, 0), this.physicalViewSize())
    )
  }
  private physicalViewSpaceToNDC() {
    return AffineTransform.withScale(new Vec2(1, -1)).times(
      AffineTransform.betweenRects(
        new Rect(new Vec2(0, 0), this.physicalViewSize()),
        new Rect(new Vec2(-1, -1), new Vec2(2, 2))
      )
    )
  }

  private logicalToPhysicalViewSpace() {
    return AffineTransform.withScale(new Vec2(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO))
  }

  private resizeOverlayCanvasIfNeeded() {
    if (!this.overlayCanvas) return
    let {width, height} = this.overlayCanvas.getBoundingClientRect()
    {/*
      We render text at a higher resolution then scale down to
      ensure we're rendering at 1:1 device pixel ratio.
      This ensures our text is rendered crisply.
    */}
    width = Math.floor(width)
    height = Math.floor(height)

    // Still initializing: don't resize yet
    if (width === 0 || height === 0) return

    const scaledWidth = width * DEVICE_PIXEL_RATIO
    const scaledHeight = height * DEVICE_PIXEL_RATIO

    if (scaledWidth === this.overlayCanvas.width &&
        scaledHeight === this.overlayCanvas.height) return

    this.overlayCanvas.width = scaledWidth
    this.overlayCanvas.height = scaledHeight
  }

  private renderOverlays() {
    const ctx = this.overlayCtx
    if (!ctx) return
    this.resizeOverlayCanvasIfNeeded()
    if (this.props.configSpaceViewportRect.isEmpty()) return

    const configToPhysical = this.configSpaceToPhysicalViewSpace()

    const physicalViewSpaceFontSize = FontSize.LABEL * DEVICE_PIXEL_RATIO
    const physicalViewSpaceFrameHeight = this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT * DEVICE_PIXEL_RATIO

    const physicalViewSize = this.physicalViewSize()

    ctx.clearRect(0, 0, physicalViewSize.x, physicalViewSize.y)

    ctx.strokeStyle = 'rgba(15, 10, 5, 0.5)'
    ctx.lineWidth = 2

    if (this.hoveredLabel) {
      const physicalViewBounds = configToPhysical.transformRect(this.hoveredLabel.configSpaceBounds)
      ctx.strokeRect(
        Math.floor(physicalViewBounds.left()), Math.floor(physicalViewBounds.top()),
        Math.floor(physicalViewBounds.width()), Math.floor(physicalViewBounds.height())
      )
    }

    ctx.font = `${physicalViewSpaceFontSize}px/${physicalViewSpaceFrameHeight}px ${FontFamily.MONOSPACE}`
    ctx.fillStyle = Colors.GRAY
    ctx.textBaseline = 'top'

    const minWidthToRender = cachedMeasureTextWidth(ctx, 'M' + ELLIPSIS + 'M')
    const minConfigSpaceWidthToRender = (configToPhysical.inverseTransformVector(new Vec2(minWidthToRender, 0)) || new Vec2(0, 0)).x
    const LABEL_PADDING_PX = (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2
    const PADDING_OFFSET = new Vec2(LABEL_PADDING_PX, LABEL_PADDING_PX)
    const SIZE_OFFSET = new Vec2(2 * LABEL_PADDING_PX, 2 * LABEL_PADDING_PX)

    const renderFrameLabelAndChildren = (frame: FlamechartFrame, depth = 0) => {
      const width = frame.end - frame.start
      const configSpaceBounds = new Rect(
        new Vec2(frame.start, depth + 1),
        new Vec2(width, 1)
      )

      if (width < minConfigSpaceWidthToRender) return
      if (configSpaceBounds.left() > this.props.configSpaceViewportRect.right()) return
      if (configSpaceBounds.right() < this.props.configSpaceViewportRect.left()) return
      if (configSpaceBounds.top() > this.props.configSpaceViewportRect.bottom()) return

      if (configSpaceBounds.hasIntersectionWith(this.props.configSpaceViewportRect)) {
        let physicalLabelBounds = configToPhysical.transformRect(configSpaceBounds)

        if (physicalLabelBounds.left() < 0) {
          physicalLabelBounds = physicalLabelBounds
            .withOrigin(physicalLabelBounds.origin.withX(0))
            .withSize(physicalLabelBounds.size.withX(physicalLabelBounds.size.x + physicalLabelBounds.left()))
        }
        if (physicalLabelBounds.right() > physicalViewSize.x) {
          physicalLabelBounds = physicalLabelBounds
            .withSize(physicalLabelBounds.size.withX(physicalViewSize.x - physicalLabelBounds.left()))
        }

        physicalLabelBounds = physicalLabelBounds
          .withOrigin(physicalLabelBounds.origin.plus(PADDING_OFFSET))
          .withSize(physicalLabelBounds.size.minus(SIZE_OFFSET))

        const trimmedText = trimTextMid(ctx, frame.node.frame.name, physicalLabelBounds.width())
        ctx.fillText(trimmedText, physicalLabelBounds.left(), physicalLabelBounds.top())
      }

      for (let child of frame.children) {
        renderFrameLabelAndChildren(child, depth + 1)
      }
    }

    for (let frame of (this.props.flamechart.getLayers()[0] || [])) {
      renderFrameLabelAndChildren(frame)
    }

    const left = this.props.configSpaceViewportRect.left()
    const right = this.props.configSpaceViewportRect.right()

    // We want about 10 gridlines to be visible, and want the unit to be
    // 1eN, 2eN, or 5eN for some N

    // Ideally, we want an interval every 100 logical screen pixels
    const logicalToConfig = (this.configSpaceToPhysicalViewSpace().inverted() || new AffineTransform()).times(this.logicalToPhysicalViewSpace())
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

      ctx.fillStyle = Colors.GRAY
      for (let x = Math.ceil(left / interval) * interval; x < right; x += interval) {
        // TODO(jlfwong): Ensure that labels do not overlap
        const pos = Math.round(configToPhysical.transformPosition(new Vec2(x, 0)).x)
        const labelText = this.props.flamechart.formatValue(x)
        const textWidth = cachedMeasureTextWidth(ctx, labelText)

        ctx.fillText(labelText, pos - textWidth - 5, 2)
        ctx.fillRect(pos, 0, 1, physicalViewSize.y)
      }
    }
  }

  private lastBounds: ClientRect | null = null
  private updateConfigSpaceViewport(windowResized = false) {
    if (!this.container) return
    const bounds = this.container.getBoundingClientRect()
    const { width, height } = bounds

    // Still initializing: don't resize yet
    if (width < 2 || height < 2) return

    if (this.lastBounds == null) {
      this.setConfigSpaceViewportRect(new Rect(
        new Vec2(0, 0),
        new Vec2(this.configSpaceSize().x, height / this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT)
      ))
    } else if (windowResized) {
      // Resize the viewport rectangle to match the window size aspect
      // ratio.
      this.setConfigSpaceViewportRect(this.props.configSpaceViewportRect.withSize(
        this.props.configSpaceViewportRect.size.timesPointwise(new Vec2(
          width / this.lastBounds.width,
          height / this.lastBounds.height
        ))
      ))
    }
    this.lastBounds = bounds
  }

  onWindowResize = () => {
    this.updateConfigSpaceViewport(true)
    this.renderCanvas()
  }

  private renderRects() {
    if (!this.container) return
    this.updateConfigSpaceViewport()

    if (this.props.configSpaceViewportRect.isEmpty()) return

    const configSpaceToNDC = this.physicalViewSpaceToNDC().times(this.configSpaceToPhysicalViewSpace())

    // console.trace('main view render')

    this.props.canvasContext.renderInto(this.container, () => {
      this.props.flamechartRenderer.render({
        configSpaceToNDC: configSpaceToNDC,
        physicalSize: this.physicalViewSize(),
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
        this.framesWithoutWheelEvents++;
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

    if (!configDelta) return
    this.props.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(logicalViewSpaceCenter: Vec2, multiplier: number) {
    this.interactionLock = 'zoom'

    const physicalCenter = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceCenter)
    const configSpaceCenter = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalCenter)
    if (!configSpaceCenter) return

    const zoomTransform = AffineTransform
      .withTranslation(configSpaceCenter.times(-1))
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
      this.props.setNodeHover(this.hoveredLabel.node, logicalMousePos)
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
    const physicalViewSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceMouse)
    const configSpaceMouse = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalViewSpaceMouse)

    if (!configSpaceMouse) return

    const setHoveredLabel = (frame: FlamechartFrame, depth = 0) => {
      const width = frame.end - frame.start
      const configSpaceBounds = new Rect(
        new Vec2(frame.start, depth + 1),
        new Vec2(width, 1)
      )
      if (configSpaceMouse.x < configSpaceBounds.left()) return null
      if (configSpaceMouse.x > configSpaceBounds.right()) return null

      if (configSpaceBounds.contains(configSpaceMouse)) {
        this.hoveredLabel = {
          configSpaceBounds,
          node: frame.node
        }
      }

      for (let child of frame.children) {
        setHoveredLabel(child, depth + 1)
      }
    }

    for (let frame of (this.props.flamechart.getLayers()[0] || [])) {
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
    this.props.setNodeHover(null, new Vec2())
    this.renderCanvas()
  }

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault()
    this.frameHadWheelEvent = true

    const isZoom = ev.metaKey || ev.ctrlKey

    if (isZoom && this.interactionLock !== 'pan') {
      let multiplier = 1 + (ev.deltaY / 100)

      // On Chrome & Firefox, pinch-to-zoom maps to
      // WheelEvent + Ctrl Key. We'll accelerate it in
      // this case, since it feels a bit sluggish otherwise.
      if (ev.ctrlKey) {
        multiplier = 1 + (ev.deltaY / 40)
      }

      multiplier = clamp(multiplier, 0.1, 10.0)

      this.zoom(new Vec2(ev.offsetX, ev.offsetY), multiplier)
    } else if (this.interactionLock !== 'zoom') {
      this.pan(new Vec2(ev.deltaX, ev.deltaY))
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
    }
  }


  shouldComponentUpdate() { return false }
  componentWillReceiveProps(nextProps: FlamechartPanZoomViewProps) {
    if (this.props.flamechart !== nextProps.flamechart) {
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
        className={css(style.panZoomView, style.vbox)}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
        onWheel={this.onWheel}
        ref={this.containerRef}>
        <canvas
          width={1} height={1}
          ref={this.overlayCanvasRef}
          className={css(style.fill)} />
      </div>
    )
  }
}

interface FlamechartViewProps {
  flamechart: Flamechart
  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
}

interface FlamechartViewState {
  hoveredNode: CallTreeNode | null
  configSpaceViewportRect: Rect
  logicalSpaceMouse: Vec2
}

export class FlamechartView extends ReloadableComponent<FlamechartViewProps, FlamechartViewState> {
  container: HTMLDivElement | null = null

  constructor() {
    super()
    this.state = {
      hoveredNode: null,
      configSpaceViewportRect: new Rect(),
      logicalSpaceMouse: new Vec2()
    }
  }

  private configSpaceSize() {
    return new Vec2(
      this.props.flamechart.getTotalWeight(),
      this.props.flamechart.getLayers().length
    )
  }

  private minConfigSpaceViewportRectWidth() { return 3 * this.props.flamechart.getMinFrameWidth(); }

  private setConfigSpaceViewportRect = (viewportRect: Rect): void => {
    const configSpaceOriginBounds = new Rect(
      new Vec2(0, 0),
      Vec2.max(new Vec2(0, 0), this.configSpaceSize().minus(viewportRect.size))
    )

    const configSpaceSizeBounds = new Rect(
      new Vec2(this.minConfigSpaceViewportRectWidth(), viewportRect.height()),
      new Vec2(this.configSpaceSize().x, viewportRect.height())
    )

    this.setState({
      configSpaceViewportRect: new Rect(
        configSpaceOriginBounds.closestPointTo(viewportRect.origin),
        configSpaceSizeBounds.closestPointTo(viewportRect.size)
      )
    })
  }

  private transformViewport = (transform: AffineTransform): void => {
    const viewportRect = transform.transformRect(this.state.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  onNodeHover = (hoveredNode: CallTreeNode | null, logicalSpaceMouse: Vec2) => {
    this.setState({
      hoveredNode,
      logicalSpaceMouse: logicalSpaceMouse.plus(new Vec2(0, Sizes.MINIMAP_HEIGHT))
    });
  }

  formatValue(weight: number) {
    const totalWeight = this.props.flamechart.getTotalWeight()
    const percent = 100 * weight / totalWeight
    let formattedPercent = `${percent.toFixed(0)}%`
    if (percent === 100) formattedPercent = '100%'
    else if (percent > 99) formattedPercent = '>99%'
    else if (percent < 0.01) formattedPercent = '<0.01%'
    else if (percent < 1) formattedPercent = `${percent.toFixed(2)}%`
    else if (percent < 10) formattedPercent = `${percent.toFixed(1)}%`

    return `${this.props.flamechart.formatValue(weight)} (${formattedPercent})`
  }

  renderTooltip() {
    if (!this.container) return null

    const { hoveredNode, logicalSpaceMouse } = this.state
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
      positionStyle.right = (width - logicalSpaceMouse.x) + 1
    }

    if (logicalSpaceMouse.y + OFFSET_FROM_MOUSE + Sizes.TOOLTIP_HEIGHT_MAX < height) {
      positionStyle.top = logicalSpaceMouse.y + OFFSET_FROM_MOUSE
    } else {
      positionStyle.bottom = (height - logicalSpaceMouse.y) + 1
    }

    return (
      <div className={css(style.hoverTip)} style={positionStyle}>
        <div className={css(style.hoverTipRow)}>
          <span className={css(style.hoverCount)}>{this.formatValue(hoveredNode.getTotalWeight())}</span>{' '}
          {hoveredNode.frame.name}
        </div>
      </div>
    )
  }

  containerRef = (container?: Element) => { this.container = container as HTMLDivElement || null }

  panZoomView: FlamechartPanZoomView | null
  panZoomRef = (view: FlamechartPanZoomView | null) => {
    this.panZoomView = view
  }
  subcomponents() {
    return {
      panZoom: this.panZoomView
    }
  }

  render() {
    return (
      <div className={css(style.fill, style.clip, style.vbox)} ref={this.containerRef}>
        <FlamechartMinimapView
          configSpaceViewportRect={this.state.configSpaceViewportRect}
          transformViewport={this.transformViewport}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          canvasContext={this.props.canvasContext}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect} />
        <FlamechartPanZoomView
          ref={this.panZoomRef}
          canvasContext={this.props.canvasContext}
          flamechart={this.props.flamechart}
          flamechartRenderer={this.props.flamechartRenderer}
          setNodeHover={this.onNodeHover}
          transformViewport={this.transformViewport}
          configSpaceViewportRect={this.state.configSpaceViewportRect}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        {this.renderTooltip()}
      </div>
      )
  }
}