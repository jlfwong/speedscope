import {h, Component} from 'preact'
import { css } from 'aphrodite'
import { Flamechart } from './flamechart'
import { Rect, Vec2, AffineTransform } from './math'
import { vec3, ReglCommand } from 'regl'
import { rectangleBatchRenderer, RectangleBatchRendererProps } from "./rectangle-batch-renderer"
import { atMostOnceAFrame } from "./utils";
import { style } from "./flamechart-style";

const DEVICE_PIXEL_RATIO = window.devicePixelRatio

interface FlamechartMinimapViewProps {
  flamechart: Flamechart
  configSpaceViewportRect: Rect
}

export class FlamechartMinimapView extends Component<FlamechartMinimapViewProps, {}> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null
  overlayRenderer: ReglCommand<RectangleBatchRendererProps> | null = null

  ctx: WebGLRenderingContext | null = null
  canvas: HTMLCanvasElement | null = null

  private physicalViewSize() {
    return new Vec2(
      this.canvas ? this.canvas.width : 0,
      this.canvas ? this.canvas.height : 0
    )
  }

  private configSpaceSize() {
    return new Vec2(
      this.props.flamechart.getDuration(),
      this.props.flamechart.getLayers().length
    )
  }

  private configSpaceToPhysicalViewSpace() {
    return AffineTransform.betweenRects(
      new Rect(new Vec2(0, 0), this.configSpaceSize()),
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

  private renderRects() {
    if (!this.renderer || !this.canvas) return
    this.resizeCanvasIfNeeded()

    const configSpaceToNDC = this.physicalViewSpaceToNDC().times(this.configSpaceToPhysicalViewSpace())

    this.renderer({
      configSpaceToNDC: configSpaceToNDC,
      physicalSize: this.physicalViewSize()
    })

  }

  private resizeCanvasIfNeeded() {
    if (!this.canvas || !this.ctx) return
    let { width, height } = this.canvas.getBoundingClientRect()
    width = Math.floor(width) * DEVICE_PIXEL_RATIO
    height = Math.floor(height) * DEVICE_PIXEL_RATIO

    // Still initializing: don't resize yet
    if (width === 0 || height === 0) return
    const oldWidth = this.canvas.width
    const oldHeight = this.canvas.height

    // Already at the right size
    if (width === oldWidth && height === oldHeight) return

    this.canvas.width = width
    this.canvas.height = height

    this.ctx.viewport(0, 0, width, height)
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
    }
  })

  private canvasRef = (element?: Element) => {
    if (element) {
      this.canvas = element as HTMLCanvasElement
      this.ctx = this.canvas.getContext('webgl')!
      this.renderCanvas()
    } else {
      this.canvas = null
    }
  }

  private preprocess(flamechart: Flamechart) {
    if (!this.canvas || !this.ctx) return
    const configSpaceRects: Rect[] = []
    const colors: vec3[] = []

    const layers = flamechart.getLayers()
    const frameColors = flamechart.getFrameColors()

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      for (let flamechartFrame of layer) {
        const configSpaceBounds = new Rect(
          new Vec2(flamechartFrame.start, i),
          new Vec2(flamechartFrame.end - flamechartFrame.start, 1)
        )
        configSpaceRects.push(configSpaceBounds)
        colors.push(frameColors.get(flamechartFrame.node.frame) || [0, 0, 0])
      }
    }

    this.renderer = rectangleBatchRenderer(this.ctx, configSpaceRects, colors, 0)
  }

  render() {
    return (
      <div
        className={css(style.minimap)} >
        <canvas
          width={1} height={1}
          ref={this.canvasRef}
          className={css(style.fill)} />
      </div>
    )
  }
}