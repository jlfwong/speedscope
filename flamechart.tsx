import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {Profile, Frame, CallTreeNode} from './profile'
import * as regl from 'regl'
import { vec2, vec3, ReglCommand } from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { atMostOnceAFrame } from "./utils";

enum FontFamily {
  MONOSPACE = "Courier, monospace"
}

enum FontSize {
  LABEL = 10
}

interface FlamechartFrame {
  node: CallTreeNode
  start: number
  end: number
  parent: FlamechartFrame | null
  children: FlamechartFrame[]
}

type StackLayer = FlamechartFrame[]

export class Flamechart {
  // Bottom to top
  private layers: StackLayer[] = []
  private duration: number = 0

  private frameColors = new Map<Frame, [number, number, number]>()

  getDuration() { return this.duration }
  getLayers() { return this.layers }
  getFrameColors() { return this.frameColors }

  private appendFrame(layerIndex: number, node: CallTreeNode, timeDelta: number, parent: FlamechartFrame | null) {
    while (layerIndex >= this.layers.length) this.layers.push([])
    const flamechartFrame: FlamechartFrame = {
      node: node,
      start: this.duration,
      end: this.duration + timeDelta,
      parent,
      children: []
    }
    this.layers[layerIndex].push(flamechartFrame)
    if (parent) {
      parent.children.push(flamechartFrame)
    }
    return flamechartFrame
  }

  private appendSample(stack: CallTreeNode[], timeDelta: number) {
    let parent: FlamechartFrame | null = null
    for (let i = 0; i < stack.length; i++) {
      parent = this.appendFrame(i, stack[i], timeDelta, parent)
    }
    this.duration += timeDelta
  }

  private static shouldMergeFrames(first: FlamechartFrame, second: FlamechartFrame): boolean {
    if (first.node !== second.node) return false
    if (first.parent !== second.parent) return false
    if (first.end !== second.start) return false
    return true
  }

  private static mergeFrames(first: FlamechartFrame, second: FlamechartFrame): FlamechartFrame {
    const frame: FlamechartFrame = {
      node: first.node,
      start: first.start,
      end: second.end,
      parent: first.parent,
      children: first.children.concat(second.children)
    }
    for (let child of frame.children) {
      child.parent = frame
    }
    return frame
  }

  private static mergeAdjacentFrames(layer: StackLayer): StackLayer {
    const ret: StackLayer = []
    for (let flamechartFrame of layer) {
      const prev = ret.length > 0 ? ret[ret.length - 1] : null
      if (prev && Flamechart.shouldMergeFrames(prev, flamechartFrame)) {
        ret.pop()
        ret.push(Flamechart.mergeFrames(prev, flamechartFrame))
      } else {
        ret.push(flamechartFrame)
      }
    }
    return ret
  }

  private selectFrameColors(profile: Profile) {
    const frames: Frame[] = []

    function parts(f: Frame) {
      return (f.file || '').split('/').concat(f.name.split(/\W/))
    }

    function compare(a: Frame, b: Frame) {
      const aParts = parts(a)
      const bParts = parts(b)

      const minLength = Math.min(aParts.length, bParts.length)

      let prefixMatchLength = 0
      for (let i = 0; i < minLength; i++) {
        if (aParts[i] === bParts[i]) prefixMatchLength++
        else break
      }

      // Weight matches at the beginning of the string more heavily
      const score = Math.pow(0.90, prefixMatchLength)

      return aParts.join() > bParts.join() ? score : -score
    }

    this.profile.forEachFrame(f => frames.push(f))
    frames.sort(compare)

    const cumulativeScores: number[] = []
    let lastScore = 0
    for (let i = 0; i < frames.length; i++) {
      const score = lastScore + Math.abs(compare(frames[i], frames[(i + 1)%frames.length]))
      cumulativeScores.push(score)
      lastScore = score
    }

    // We now have a sorted list of frames s.t. frames with similar
    // file paths and method names are clustered together.
    //
    // Now, to assign them colors, we map normalized cumulative
    // score values onto the full range of hue values.
    const hues: number[] = []
    const totalScore = cumulativeScores[cumulativeScores.length - 1] || 1
    for (let i = 0; i < cumulativeScores.length; i++) {
      hues.push(360 * cumulativeScores[i] / totalScore)
    }

    for (let i = 0; i < hues.length; i++) {
      const H = hues[i]

      const delta = 0.20 * Math.random() - 0.1
      const C = 0.20 + delta
      const Y = 0.85 - delta

      // TODO(jlfwong): Move this into color routines in a different file
      // https://en.wikipedia.org/wiki/HSL_and_HSV#From_luma/chroma/hue

      const hPrime = H / 60
      const X = C * (1 - Math.abs(hPrime % 2 - 1))
      const [R1, G1, B1] = (
        hPrime < 1 ? [C, X, 0] :
        hPrime < 2 ? [X, C, 0] :
        hPrime < 3 ? [0, C, X] :
        hPrime < 4 ? [0, X, C] :
        hPrime < 5 ? [X, 0, C] :
        [C, 0, X]
      )

      const m = Y - (0.30 * R1 + 0.59 * G1 + 0.11 * B1)
      this.frameColors.set(frames[i], [R1 + m, G1 + m, B1 + m])
    }
  }

  constructor(private profile: Profile) {
    profile.forEachSample(this.appendSample.bind(this))
    this.layers = this.layers.map(Flamechart.mergeAdjacentFrames)
    this.selectFrameColors(profile)
  }
}

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
  setNodeHover: (node: CallTreeNode | null, logicalViewSpacemous: Vec2) => void
}

export class FlamechartPanZoomView extends Component<FlamechartPanZoomViewProps, {}> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null

  ctx: WebGLRenderingContext | null = null
  canvas: HTMLCanvasElement | null = null

  overlayCanvas: HTMLCanvasElement | null = null
  overlayCtx: CanvasRenderingContext2D | null = null

  configSpaceViewportRect = new Rect()
  labels: FlamechartFrameLabel[] = []
  hoveredLabel: FlamechartFrameLabel | null = null

  private preprocess(flamechart: Flamechart) {
    if (!this.canvas || !this.ctx) return
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

    this.renderer = rectangleBatchRenderer(this.ctx, configSpaceRects, colors)
    this.configSpaceViewportRect = new Rect()
    this.hoveredLabel = null
  }

  private canvasRef = (element?: Element) => {
    if (element) {
      this.canvas = element as HTMLCanvasElement
      this.ctx = this.canvas.getContext('webgl')!
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
      this.configSpaceViewportRect = new Rect(
        new Vec2(0, 0),
        new Vec2(this.configSpaceSize().x, logicalHeight / this.LOGICAL_VIEW_SPACE_FRAME_HEIGHT)
      )
    } else {
      // Resize the viewport rectangle to match the window size aspect
      // ratio.
      this.configSpaceViewportRect = this.configSpaceViewportRect.withSize(
        this.configSpaceViewportRect.size.timesPointwise(new Vec2(
          width / oldWidth,
          height / oldHeight
        ))
      )
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

  private renderCanvas = atMostOnceAFrame(() => {
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

  private transformViewport(transform: AffineTransform) {
    const viewportRect = transform.transformRect(this.configSpaceViewportRect)

    const configSpaceOriginBounds = new Rect(
      new Vec2(0, 0),
      Vec2.max(new Vec2(0, 0), this.configSpaceSize().minus(viewportRect.size))
    )

    const configSpaceSizeBounds = new Rect(
      new Vec2(1, viewportRect.height()),
      new Vec2(this.configSpaceSize().x, viewportRect.height())
    )

    this.configSpaceViewportRect = new Rect(
      configSpaceOriginBounds.closestPointTo(viewportRect.origin),
      configSpaceSizeBounds.closestPointTo(viewportRect.size)
    )

    this.renderCanvas()
  }

  private pan(logicalViewSpaceDelta: Vec2) {
    const physicalDelta = this.logicalToPhysicalViewSpace().transformVector(logicalViewSpaceDelta)
    const configDelta = this.configSpaceToPhysicalViewSpace().inverseTransformVector(physicalDelta)

    if (!configDelta) return
    this.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(logicalViewSpaceCenter: Vec2, multiplier: number) {
    const physicalCenter = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceCenter)
    const configSpaceCenter = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalCenter)

    if (!configSpaceCenter) return

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

    // TODO(jlfwong): When scrolling and adding or releasing
    // a modifier key, any momentum scrolling from previous
    // initiated momentum scrolling may still take effect.
    // Figure out how to prevent this.
    if (ev.metaKey || ev.ctrlKey) {
      let multiplier = 1 + (ev.deltaY / 100)

      // On Chrome & Firefox, pinch-to-zoom maps to
      // WheelEvent + Ctrl Key. We'll accelerate it in
      // this case, since it feels a bit sluggish otherwise.
      if (ev.ctrlKey) {
        multiplier = 1 + (ev.deltaY / 40)
      }

      this.zoom(new Vec2(ev.offsetX, ev.offsetY), multiplier)
    } else {
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
    }
    this.renderCanvas()
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
        className={css(style.fill)}
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
  logicalSpaceMouse: Vec2
}

export class FlamechartView extends ReloadableComponent<FlamechartViewProps, FlamechartViewState> {
  container: HTMLDivElement | null = null

  constructor() {
    super()
    this.state = {
      hoveredNode: null,
      logicalSpaceMouse: new Vec2()
    }
  }

  onNodeHover = (hoveredNode: CallTreeNode | null, logicalSpaceMouse: Vec2) => {
    this.setState({ hoveredNode, logicalSpaceMouse })
  }

  static TOOLTIP_WIDTH_MAX = 300
  static TOOLTIP_HEIGHT_MAX = 75

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
    if (logicalSpaceMouse.x + OFFSET_FROM_MOUSE + FlamechartView.TOOLTIP_WIDTH_MAX < width) {
      positionStyle.left = logicalSpaceMouse.x + OFFSET_FROM_MOUSE
    } else {
      positionStyle.right = (width - logicalSpaceMouse.x) + 1
    }

    if (logicalSpaceMouse.y + OFFSET_FROM_MOUSE + FlamechartView.TOOLTIP_HEIGHT_MAX < height) {
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

  render() {
    return (
      <div className={css(style.fill, style.clip)} ref={this.containerRef}>
        <FlamechartPanZoomView
          flamechart={this.props.flamechart}
          setNodeHover={this.onNodeHover}
        />
        {this.renderTooltip()}
      </div>
      )
  }
}

const HOVERTIP_PADDING = 2
const style = StyleSheet.create({
  hoverTip: {
    position: 'absolute',
    background: 'white',
    border: '1px solid black',
    maxWidth: FlamechartView.TOOLTIP_WIDTH_MAX,
    overflow: 'hidden',
    paddingTop: HOVERTIP_PADDING,
    paddingBottom: HOVERTIP_PADDING,
    pointerEvents: 'none',
    userSelect: 'none',
    fontSize: FontSize.LABEL,
    fontFamily: FontFamily.MONOSPACE
  },
  hoverTipRow: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    paddingLeft: HOVERTIP_PADDING,
    paddingRight: HOVERTIP_PADDING,
    maxWidth: FlamechartView.TOOLTIP_WIDTH_MAX,
  },
  clip: {
    overflow: 'hidden'
  },
  fill: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0
  }
})

interface RectangleBatchRendererProps {
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
}

export const rectangleBatchRenderer = (ctx: WebGLRenderingContext, rects: Rect[], colors: vec3[]) => {
  const positions: vec2[] = []
  const vertexColors: vec3[] = []

  const addRectangle = (r: Rect, color: vec3) => {
    function addVertex(v: Vec2) {
      positions.push(v.flatten())
      vertexColors.push(color)
    }

    addVertex(r.topLeft())
    addVertex(r.bottomLeft())
    addVertex(r.topRight())

    addVertex(r.bottomLeft())
    addVertex(r.topRight())
    addVertex(r.bottomRight())
  }

  for (let i = 0; i < rects.length; i++) {
    addRectangle(rects[i], colors[i])
  }

  return regl(ctx)<RectangleBatchRendererProps>({
    vert: `
      uniform mat3 configSpaceToNDC;
      uniform vec2 physicalSize;
      attribute vec2 position;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec2 roundedPosition = (configSpaceToNDC * vec3(position, 1)).xy;
        vec2 halfSize = physicalSize / 2.0;
        roundedPosition = floor(roundedPosition * halfSize) / halfSize;
        gl_Position = vec4(roundedPosition, 0, 1);
      }
    `,

    frag: `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1);
      }
    `,

    attributes: {
      position: positions,
      color: vertexColors
    },

    uniforms: {
      configSpaceToNDC: (context, props) => {
        return props.configSpaceToNDC.flatten()
      },
      physicalSize: (context, props) => {
        return props.physicalSize.flatten()
      }
    },

    primitive: 'triangles',

    count: vertexColors.length
  })
}