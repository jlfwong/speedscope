import {h} from 'preact'
import {css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import { CallTreeNode } from './profile'
import { Flamechart } from './flamechart'

import * as regl from 'regl'
import { vec3, ReglCommand, ReglCommandConstructor } from 'regl'

import { Rect, Vec2, AffineTransform } from './math'
import { atMostOnceAFrame } from "./utils";
import { rectangleBatchRenderer, RectangleBatchRendererProps } from "./rectangle-batch-renderer"
import { FlamechartMinimapView } from "./flamechart-minimap-view"

import { style, Sizes, FontSize, FontFamily } from './flamechart-style'

interface FlamechartFrameLabel {
  configSpaceBounds: Rect
  node: CallTreeNode
}

function binarySearch(lo: number, hi: number, f: (val: number) => number, target: number, targetRangeSize = 1): [number, number] {
  while (true) {
    if (hi - lo <= targetRangeSize) return [lo, hi]
    const mid = (hi + lo) / 2
    const val = f(mid)
    if (val < target) lo = mid
    if (val > target) hi = mid
  }
}

const ELLIPSIS = '\u2026'

function buildTrimmedText(text: string, length: number) {
  const prefixLength = Math.floor(length / 2)
  const prefix = text.substr(0, prefixLength)
  const suffix = text.substr(text.length - prefixLength, prefixLength)
  return prefix + ELLIPSIS + suffix
}

const measureTextCache = new Map<string, number>()
function cachedMeasureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  if (!measureTextCache.has(text)) {
    measureTextCache.set(text, ctx.measureText(text).width)
  }
  return measureTextCache.get(text)!
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
  setNodeHover: (node: CallTreeNode | null, logicalViewSpaceMouse: Vec2) => void
  setConfigSpaceViewportRect: (rect: Rect) => void
}

export class FlamechartPanZoomView extends ReloadableComponent<FlamechartPanZoomViewProps, {}> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null

  ctx: WebGLRenderingContext | null = null
  regl: ReglCommandConstructor | null = null
  canvas: HTMLCanvasElement | null = null

  overlayCanvas: HTMLCanvasElement | null = null
  overlayCtx: CanvasRenderingContext2D | null = null

  configSpaceViewportRect = new Rect()
  labels: FlamechartFrameLabel[] = []
  hoveredLabel: FlamechartFrameLabel | null = null

  private setConfigSpaceViewportRect(r: Rect) {
    this.configSpaceViewportRect = r
    this.props.setConfigSpaceViewportRect(r)
  }

  private preprocess(flamechart: Flamechart) {
    if (!this.canvas || !this.regl) return
    const configSpaceRects: Rect[] = []
    const colors: vec3[] = []

    const layers = flamechart.getLayers()
    const frameColors = flamechart.getFrameColors()

    this.labels = []
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      for (let flamechartFrame of layer) {
        const configSpaceBounds = new Rect(
          new Vec2(flamechartFrame.start, i),
          new Vec2(flamechartFrame.end - flamechartFrame.start, 1)
        )
        configSpaceRects.push(configSpaceBounds)
        colors.push(frameColors.get(flamechartFrame.node.frame) || [0, 0, 0])

        this.labels.push({
          configSpaceBounds,
          node: flamechartFrame.node
        })
      }
    }

    this.renderer = rectangleBatchRenderer(this.regl, configSpaceRects, colors)
    this.setConfigSpaceViewportRect(new Rect())
    this.hoveredLabel = null
  }

  private canvasRef = (element?: Element) => {
    if (element) {
      this.canvas = element as HTMLCanvasElement
      this.ctx = this.canvas.getContext('webgl')!
      this.regl = regl(this.ctx)
      this.renderCanvas()
    } else {
      this.canvas = null
    }
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
      this.props.flamechart.getDuration(),
      this.props.flamechart.getLayers().length
    )
  }

  private physicalViewSize() {
    return new Vec2(
      this.canvas ? this.canvas.width : 0,
      this.canvas ? this.canvas.height : 0
    )
  }

  private LOGICAL_VIEW_SPACE_FRAME_HEIGHT = 16

  private configSpaceToPhysicalViewSpace() {
    return AffineTransform.betweenRects(
      this.configSpaceViewportRect,
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

  private renderLabels() {
    const ctx = this.overlayCtx
    if (!ctx) return
    this.resizeOverlayCanvasIfNeeded()

    const configToPhysical = this.configSpaceToPhysicalViewSpace()

    const physicalViewSpaceFontSize = FontSize.LABEL * DEVICE_PIXEL_RATIO
    const physicalViewSpaceFrameHeight = this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT * DEVICE_PIXEL_RATIO

    const physicalViewSize = this.physicalViewSize()
    const physicalViewBounds = new Rect(new Vec2(0, 0), physicalViewSize)

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
    ctx.fillStyle = 'rgba(80, 70, 70, 1)'
    ctx.textBaseline = 'top'

    const minWidthToRender = cachedMeasureTextWidth(ctx, 'M' + ELLIPSIS + 'M')
    for (let label of this.labels) {
      const LABEL_PADDING_PX = 2 * DEVICE_PIXEL_RATIO
      let physicalLabelBounds = configToPhysical.transformRect(label.configSpaceBounds)

      physicalLabelBounds = physicalLabelBounds
        .withOrigin(physicalLabelBounds.origin.plus(new Vec2(LABEL_PADDING_PX, LABEL_PADDING_PX)))
        .withSize(physicalLabelBounds.size.minus(new Vec2(2 * LABEL_PADDING_PX, 2 * LABEL_PADDING_PX)))
        .intersectWith(new Rect(
          new Vec2(LABEL_PADDING_PX, -Infinity),
          new Vec2(physicalViewSize.x, Infinity)
        ))

      if (physicalLabelBounds.width() < minWidthToRender) continue

      // Cull text outside the viewport
      if (physicalViewBounds.intersectWith(physicalLabelBounds).isEmpty()) continue

      if (physicalLabelBounds.origin.x < 0) {
        physicalLabelBounds = physicalLabelBounds.withOrigin(
          new Vec2(0, physicalLabelBounds.origin.y)
        )
      }

      const trimmedText = trimTextMid(ctx, label.node.frame.name, physicalLabelBounds.width())
      ctx.fillText(trimmedText, physicalLabelBounds.left(), physicalLabelBounds.top())
    }
  }

  private resizeCanvasIfNeeded() {
    if (!this.canvas || !this.ctx) return
    let { width, height } = this.canvas.getBoundingClientRect()
    const logicalHeight = height
    width = Math.floor(width) * DEVICE_PIXEL_RATIO
    height = Math.floor(height) * DEVICE_PIXEL_RATIO

    // Still initializing: don't resize yet
    if (width === 0 || height === 0) return
    const oldWidth = this.canvas.width
    const oldHeight = this.canvas.height

    if (this.configSpaceViewportRect.isEmpty()) {
      this.setConfigSpaceViewportRect(new Rect(
        new Vec2(0, 0),
        new Vec2(this.configSpaceSize().x, logicalHeight / this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT)
      ))
    } else {
      // Resize the viewport rectangle to match the window size aspect
      // ratio.
      this.setConfigSpaceViewportRect(this.configSpaceViewportRect.withSize(
        this.configSpaceViewportRect.size.timesPointwise(new Vec2(
          width / oldWidth,
          height / oldHeight
        ))
      ))
    }

    // Already at the right size
    if (width === oldWidth && height === oldHeight) return

    this.canvas.width = width
    this.canvas.height = height

    this.ctx.viewport(0, 0, width, height)
  }

  private renderRects() {
    if (!this.renderer || !this.canvas) return
    this.resizeCanvasIfNeeded()

    const configSpaceToNDC = this.physicalViewSpaceToNDC().times(this.configSpaceToPhysicalViewSpace())

    this.renderer({
      configSpaceToNDC: configSpaceToNDC,
      physicalSize: this.physicalViewSize()
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
      requestAnimationFrame(this.renderCanvas)
    }
    this.frameHadWheelEvent = false
  }

  private renderCanvas = atMostOnceAFrame(() => {
    this.maybeClearInteractionLock()

    if (!this.canvas || this.canvas.getBoundingClientRect().width < 2) {
      // If the canvas is still tiny, it means browser layout hasn't had
      // a chance to run yet. Defer rendering until we have the real canvas
      // size.
      requestAnimationFrame(() => this.renderCanvas())
    } else {
      if (!this.renderer) this.preprocess(this.props.flamechart)
      this.renderRects()
      this.renderLabels()
    }
  })

  private minConfigSpaceViewportRectWidth() { return 3 * this.props.flamechart.getMinFrameWidth(); }

  private transformViewport(transform: AffineTransform) {
    const viewportRect = transform.transformRect(this.configSpaceViewportRect)

    const configSpaceOriginBounds = new Rect(
      new Vec2(0, 0),
      Vec2.max(new Vec2(0, 0), this.configSpaceSize().minus(viewportRect.size))
    )

    const configSpaceSizeBounds = new Rect(
      new Vec2(this.minConfigSpaceViewportRectWidth(), viewportRect.height()),
      new Vec2(this.configSpaceSize().x, viewportRect.height())
    )

    this.setConfigSpaceViewportRect(new Rect(
      configSpaceOriginBounds.closestPointTo(viewportRect.origin),
      configSpaceSizeBounds.closestPointTo(viewportRect.size)
    ))

    this.renderCanvas()
  }

  private pan(logicalViewSpaceDelta: Vec2) {
    this.interactionLock = 'pan'

    const physicalDelta = this.logicalToPhysicalViewSpace().transformVector(logicalViewSpaceDelta)
    const configDelta = this.configSpaceToPhysicalViewSpace().inverseTransformVector(physicalDelta)

    if (!configDelta) return
    this.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(logicalViewSpaceCenter: Vec2, multiplier: number) {
    this.interactionLock = 'zoom'

    const physicalCenter = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceCenter)
    const configSpaceCenter = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalCenter)

    if (!configSpaceCenter) return

    if (multiplier < 1 && this.configSpaceViewportRect.width() <= this.minConfigSpaceViewportRectWidth()) {
      return
    }

    const zoomTransform = AffineTransform
      .withTranslation(configSpaceCenter.times(-1))
      .scaledBy(new Vec2(multiplier, 1))
      .translatedBy(configSpaceCenter)

    this.transformViewport(zoomTransform)
  }

  private lastDragPos: Vec2 | null = null

  private onMouseDown = (ev: MouseEvent) => {
    this.lastDragPos = new Vec2(ev.offsetX, ev.offsetY)
  }

  private onMouseDrag = (ev: MouseEvent) => {
    if (!this.lastDragPos) return
    const logicalMousePos = new Vec2(ev.offsetX, ev.offsetY)
    this.pan(this.lastDragPos.minus(logicalMousePos))
    this.lastDragPos = logicalMousePos
  }

  private onMouseMove = (ev: MouseEvent) => {
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

    // This could be sped up significantly
    for (let label of this.labels) {
      if (label.configSpaceBounds.contains(configSpaceMouse)) {
        this.hoveredLabel = label
        break
      }
    }

    this.props.setNodeHover(this.hoveredLabel ? this.hoveredLabel.node : null, logicalViewSpaceMouse)

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

      this.zoom(new Vec2(ev.offsetX, ev.offsetY), multiplier)
    } else if (this.interactionLock !== 'zoom') {
      this.pan(new Vec2(ev.deltaX, ev.deltaY))

      // When panning by scrolling, the element under
      // the cursor will change, so clear the hovered label.
      this.hoveredLabel = null
      this.props.setNodeHover(null, new Vec2())
    }

    this.renderCanvas()
  }

  private onWindowMouseUp = (ev: MouseEvent) => {
    this.lastDragPos = null
  }

  shouldComponentUpdate() { return false }
  componentWillReceiveProps(nextProps: FlamechartPanZoomViewProps) {
    if (this.props.flamechart !== nextProps.flamechart) {
      this.renderer = null
      this.renderCanvas()
    }
  }
  componentDidMount() {
    window.addEventListener('mouseup', this.onWindowMouseUp)
  }
  componentWillUnmount() {
    window.removeEventListener('mouseup', this.onWindowMouseUp)
  }

  render() {
    return (
      <div
        className={css(style.panZoomView)}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onWheel={this.onWheel}>
        <canvas
          width={1} height={1}
          ref={this.canvasRef}
          className={css(style.fill)} />
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

  onNodeHover = (hoveredNode: CallTreeNode | null, logicalSpaceMouse: Vec2) => {
    this.setState({
      hoveredNode,
      logicalSpaceMouse: logicalSpaceMouse.plus(new Vec2(0, Sizes.MINIMAP_HEIGHT))
    });
  }

  formatTime(timeInNs: number) {
    const totalTimeNs = this.props.flamechart.getDuration()
    return `${(timeInNs / 1000).toFixed(2)}ms (${(100 * timeInNs/totalTimeNs).toFixed()}%)`
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
        <div className={css(style.hoverTipRow)}>{hoveredNode.frame.name}</div>
        <div className={css(style.hoverTipRow)}>Total Time: {this.formatTime(hoveredNode.getTotalTime())}</div>
        <div className={css(style.hoverTipRow)}>Self Time: {this.formatTime(hoveredNode.getSelfTime())}</div>
        <div className={css(style.hoverTipRow)}>Cum. Total Time: {this.formatTime(hoveredNode.frame.getTotalTime())}</div>
        <div className={css(style.hoverTipRow)}>Cum. Self Time: {this.formatTime(hoveredNode.frame.getSelfTime())}</div>
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

  setConfigSpaceViewportRect = (r: Rect) => {
    this.setState({ configSpaceViewportRect: r })
  }

  render() {
    return (
      <div className={css(style.fill, style.clip)} ref={this.containerRef}>
        <FlamechartMinimapView
          configSpaceViewportRect={this.state.configSpaceViewportRect}
          flamechart={this.props.flamechart} />
        <FlamechartPanZoomView
          ref={this.panZoomRef}
          flamechart={this.props.flamechart}
          setNodeHover={this.onNodeHover}
          setConfigSpaceViewportRect={this.setConfigSpaceViewportRect}
        />
        {this.renderTooltip()}
      </div>
      )
  }
}