import {h, render, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'

import {Profile, Frame} from './profile'
import regl, {vec2, vec3, mat3, ReglCommand, ReglCommandConstructor} from 'regl'
import { Rect, Vec2, AffineTransform, clamp } from './math'
import { atMostOnceAFrame } from "./utils";

interface FlamechartFrame {
  frame: Frame
  start: number
  end: number
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

  private appendFrame(layerIndex: number, frame: Frame, timeDelta: number) {
    while (layerIndex >= this.layers.length) this.layers.push([])
    this.layers[layerIndex].push({
      frame: frame,
      start: this.duration,
      end: this.duration + timeDelta
    })
  }

  private appendSample(stack: Frame[], timeDelta: number) {
    for (let i = 0; i < stack.length; i++) {
      this.appendFrame(i, stack[i], timeDelta)
    }
    this.duration += timeDelta
  }

  private static mergeAdjacentFrames(layer: StackLayer): StackLayer {
    const ret: StackLayer = []
    for (let flamechartFrame of layer) {
      const prev = ret.length > 0 ? ret[ret.length - 1] : null
      if (prev && prev.frame === flamechartFrame.frame && prev.end === flamechartFrame.start) {
        prev.end = flamechartFrame.end
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

      const matching = 0
      const minLength = Math.min(aParts.length, bParts.length)
      const maxLength = Math.max(aParts.length, bParts.length)

      let prefixMatchLength = 0
      for (let i = 0; i < minLength; i++) {
        if (aParts[i] === bParts[i]) prefixMatchLength++
        else break
      }

      // Weight matches at the beginning of the string more heavily
      const score = Math.pow(0.95, prefixMatchLength)

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
      // For each frame, select a random saturation in [0.1, 0.2]
      // and a random value in [0.8, 0.9]. This helps visually
      // differentiate otherwise very similar colors.
      const S = 0.10 + 0.10 * Math.random()
      const V = 0.80 + 0.10 * Math.random()

      // TODO(jlfwong): Move this into color routines in a different file
      // https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV

      const C = V * S
      const hPrime = Math.floor(hues[i] / 60)
      const X = C * (1 - Math.abs(hPrime % 2 - 1))
      const [R1, G1, B1] = (
        hPrime < 1 ? [C, X, 0] :
        hPrime < 2 ? [X, C, 0] :
        hPrime < 3 ? [0, C, X] :
        hPrime < 4 ? [0, X, C] :
        hPrime < 5 ? [X, 0, C] :
        [C, 0, X]
      )

      const m = V - C
      this.frameColors.set(frames[i], [R1 + m, G1 + m, B1 + m])
    }
  }

  constructor(private profile: Profile) {
    profile.forEachSample(this.appendSample.bind(this))
    this.layers = this.layers.map(Flamechart.mergeAdjacentFrames)
    this.selectFrameColors(profile)
  }
}

interface FlamechartViewProps {
  width: number
  height: number
  flamechart: Flamechart
}

interface FlamechartFrameLabel {
  configSpaceBounds: Rect
  frame: Frame
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
  const suffixLength = Math.ceil(length / 2)
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
  const [lo, hi] = binarySearch(0, text.length, (n) => {
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
export class FlamechartView extends Component<FlamechartViewProps, void> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null

  ctx: WebGLRenderingContext | null = null
  canvas: HTMLCanvasElement | null = null

  overlayCanvas: HTMLCanvasElement | null = null
  overlayCtx: CanvasRenderingContext2D | null = null

  configSpaceViewportRect = new Rect()
  labels: FlamechartFrameLabel[] = []
  hoveredLabel: FlamechartFrameLabel | null = null

  private preprocess() {
    if (!this.canvas) return

    const {flamechart} = this.props
    const configSpaceRects: Rect[] = []
    const colors: vec3[] = []

    const layers = flamechart.getLayers()
    const duration = flamechart.getDuration()
    const maxStackHeight = layers.length

    const frameColors = flamechart.getFrameColors()

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      for (let flamechartFrame of layer) {
        const configSpaceBounds = new Rect(
          new Vec2(flamechartFrame.start, i),
          new Vec2(flamechartFrame.end - flamechartFrame.start, 1)
        )
        configSpaceRects.push(configSpaceBounds)
        colors.push(frameColors.get(flamechartFrame.frame) || [0, 0, 0])

        this.labels.push({
          configSpaceBounds,
          frame: flamechartFrame.frame
        })
      }
    }

    this.ctx = this.canvas.getContext('webgl')!
    this.renderer = rectangleBatchRenderer(this.ctx, configSpaceRects, colors)
  }

  private canvasRef = (element?: Element) => {
    if (element) {
      this.canvas = element as HTMLCanvasElement
      this.preprocess()
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
  private LOGICAL_VIEW_SPACE_LABEL_FONT_SIZE = 12

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

    const physicalViewSpaceFontSize = this.LOGICAL_VIEW_SPACE_LABEL_FONT_SIZE * DEVICE_PIXEL_RATIO
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

    ctx.font = `${physicalViewSpaceFontSize}px/${physicalViewSpaceFrameHeight}px Courier, monospace`
    ctx.fillStyle = 'rgba(15, 10, 5, 1)'
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

      const trimmedText = trimTextMid(ctx, label.frame.name, physicalLabelBounds.width())
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

    // Already at the right size
    if (width === this.canvas.width && height === this.canvas.height) return

    const oldWidth = this.canvas.width
    const oldHeight = this.canvas.height
    this.canvas.width = width
    this.canvas.height = height

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
      this.renderRects()
      this.renderLabels()
    }
  })

  private transformViewport(transform: AffineTransform) {
    const viewportRect = transform.transformRect(this.configSpaceViewportRect)

    const configSpaceOriginBounds = new Rect(
      new Vec2(0, 0),
      this.configSpaceSize().minus(viewportRect.size)
    )

    const configSpaceSizeBounds = new Rect(
      new Vec2(1, viewportRect.height()),
      new Vec2(this.configSpaceSize().x, viewportRect.height())
    )

    this.configSpaceViewportRect = new Rect(
      configSpaceOriginBounds.closestPointTo(viewportRect.origin),
      configSpaceSizeBounds.closestPointTo(viewportRect.size)
    )
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

  private onMouseMove = (ev: MouseEvent) => {
    this.hoveredLabel = null
    const logicalViewSpaceMouse = new Vec2(ev.offsetX, ev.offsetY)
    const physicalViewSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceMouse)
    const configSpaceMouse = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalViewSpaceMouse)

    if (!configSpaceMouse) return

    let labelUnderMouse: FlamechartFrameLabel | null = null

    // This could be sped up significantly
    for (let label of this.labels) {
      if (label.configSpaceBounds.contains(configSpaceMouse)) {
        this.hoveredLabel = label
        break
      }
    }

    this.renderCanvas()
  }

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault()

    // TODO(jlfwong): When scrolling and adding or releasing
    // a modifier key, any momentum scrolling from previous
    // initiated momentum scrolling may still take effect.
    // Figure out how to prevent this.
    //
    // Also, support drag-based panning.
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
    }

    this.renderCanvas()
  }

  componentDidUpdate() { this.renderCanvas() }
  componentDidMount() { this.renderCanvas() }

  render() {
    const {width, height} = this.props

    return (
      <div
        className={css(style.fill)}
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

const style = StyleSheet.create({
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