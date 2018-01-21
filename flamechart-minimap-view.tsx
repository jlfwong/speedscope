import * as regl from 'regl'
import { vec3, ReglCommand } from 'regl'
import { h, Component } from 'preact'
import { css } from 'aphrodite'
import { Flamechart } from './flamechart'
import { Rect, Vec2, AffineTransform, clamp } from './math'
import { rectangleBatchRenderer, RectangleBatchRendererProps } from "./rectangle-batch-renderer"
import { atMostOnceAFrame, cachedMeasureTextWidth } from "./utils";
import { style, Sizes } from "./flamechart-style";
import { FontFamily, FontSize, Colors } from "./style"

const DEVICE_PIXEL_RATIO = window.devicePixelRatio

interface FlamechartMinimapViewProps {
  flamechart: Flamechart
  configSpaceViewportRect: Rect
  transformViewport: (transform: AffineTransform) => void
  setConfigSpaceViewportRect: (rect: Rect) => void
}

enum DraggingMode {
  DRAW_NEW_VIEWPORT,
  TRANSLATE_VIEWPORT
}

export class FlamechartMinimapView extends Component<FlamechartMinimapViewProps, {}> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null
  viewportRectRenderer: ReglCommand<OverlayRectangleRendererProps> | null = null

  ctx: WebGLRenderingContext | null = null
  regl: regl.ReglCommandConstructor | null = null
  canvas: HTMLCanvasElement | null = null

  overlayCanvas: HTMLCanvasElement | null = null
  overlayCtx: CanvasRenderingContext2D | null = null

  private physicalViewSize() {
    return new Vec2(
      this.canvas ? this.canvas.width : 0,
      this.canvas ? this.canvas.height : 0
    )
  }

  private configSpaceSize() {
    return new Vec2(
      this.props.flamechart.getTotalWeight(),
      this.props.flamechart.getLayers().length
    )
  }

  private configSpaceToPhysicalViewSpace() {
    const minimapOrigin = new Vec2(0, Sizes.FRAME_HEIGHT * DEVICE_PIXEL_RATIO)

    return AffineTransform.betweenRects(
      new Rect(new Vec2(0, 0), this.configSpaceSize()),
      new Rect(minimapOrigin, this.physicalViewSize().minus(minimapOrigin))
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

  private windowToLogicalViewSpace() {
    if (!this.canvas) return new AffineTransform()
    const bounds = this.canvas.getBoundingClientRect()
    return AffineTransform.withTranslation(new Vec2(-bounds.left, -bounds.top))
  }

  private renderRects() {
    if (!this.renderer || !this.canvas || !this.viewportRectRenderer) return
    this.resizeCanvasIfNeeded()

    const configSpaceToNDC = this.physicalViewSpaceToNDC().times(this.configSpaceToPhysicalViewSpace())

    this.renderer({
      configSpaceToNDC: configSpaceToNDC,
      physicalSize: this.physicalViewSize()
    })

    this.viewportRectRenderer({
      configSpaceViewportRect: this.props.configSpaceViewportRect,
      configSpaceToPhysicalViewSpace: this.configSpaceToPhysicalViewSpace(),
      physicalSize: this.physicalViewSize()
    })
  }

  private renderOverlays() {
    const ctx = this.overlayCtx
    if (!ctx) return
    const physicalViewSize = this.physicalViewSize()
    ctx.clearRect(0, 0, physicalViewSize.x, physicalViewSize.y)

    this.resizeOverlayCanvasIfNeeded()

    const configToPhysical = this.configSpaceToPhysicalViewSpace()

    const left = 0
    const right = this.configSpaceSize().x

    // TODO(jlfwong): There's a huge amount of code duplication here between
    // this and the FlamechartView.renderOverlays(). Consolidate.

    // We want about 10 gridlines to be visible, and want the unit to be
    // 1eN, 2eN, or 5eN for some N

    // Ideally, we want an interval every 100 logical screen pixels
    const logicalToConfig = (this.configSpaceToPhysicalViewSpace().inverted() || new AffineTransform()).times(this.logicalToPhysicalViewSpace())
    const targetInterval = logicalToConfig.transformVector(new Vec2(200, 1)).x

    const physicalViewSpaceFrameHeight = Sizes.FRAME_HEIGHT * DEVICE_PIXEL_RATIO
    const physicalViewSpaceFontSize = FontSize.LABEL * DEVICE_PIXEL_RATIO
    const LABEL_PADDING_PX = (physicalViewSpaceFrameHeight - physicalViewSpaceFontSize) / 2

    ctx.font = `${physicalViewSpaceFontSize}px/${physicalViewSpaceFrameHeight}px ${FontFamily.MONOSPACE}`
    ctx.textBaseline = 'top'

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
        const textWidth = Math.ceil(cachedMeasureTextWidth(ctx, labelText))

        ctx.fillText(labelText, pos - textWidth - LABEL_PADDING_PX, LABEL_PADDING_PX)
        ctx.fillRect(pos, 0, 1, physicalViewSize.y)
      }
    }
  }

  componentWillReceiveProps(nextProps: FlamechartMinimapViewProps) {
    if (this.props.flamechart !== nextProps.flamechart) {
      this.renderer = null
      this.renderCanvas()
    } else if (this.props.configSpaceViewportRect != nextProps.configSpaceViewportRect) {
      this.renderCanvas()
    }
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

  private renderCanvas = atMostOnceAFrame(() => {
    this.maybeClearInteractionLock()
    if (!this.canvas || this.canvas.getBoundingClientRect().width < 2) {
      // If the canvas is still tiny, it means browser layout hasn't had
      // a chance to run yet. Defer rendering until we have the real canvas
      // size.
      requestAnimationFrame(() => this.renderCanvas())
    } else {
      if (!this.regl) return;
      if (!this.renderer) this.preprocess(this.props.flamechart)
      this.regl.clear({
        color: [1, 1, 1, 1],
        depth: 1
      })
      this.renderRects()
      this.renderOverlays()
    }
  })

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
    const configSpaceCenter = configSpaceViewport.origin.plus(configSpaceViewport.size.times(1/2))
    if (!configSpaceCenter) return

    const zoomTransform = AffineTransform
      .withTranslation(configSpaceCenter.times(-1))
      .scaledBy(new Vec2(multiplier, 1))
      .translatedBy(configSpaceCenter)

    this.props.transformViewport(zoomTransform)
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

      this.zoom(multiplier)
    } else if (this.interactionLock !== 'zoom') {
      this.pan(new Vec2(ev.deltaX, ev.deltaY))
    }


    this.renderCanvas()
  }

  private configSpaceMouse(ev: MouseEvent): Vec2 | null {
    const logicalSpaceMouse = this.windowToLogicalViewSpace().transformPosition(new Vec2(ev.clientX, ev.clientY))
    const physicalSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(logicalSpaceMouse)
    return this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalSpaceMouse)
  }

  private dragStartConfigSpaceMouse: Vec2 | null = null
  private dragConfigSpaceViewportOffset: Vec2 | null = null
  private draggingMode: DraggingMode | null = null
  private onMouseDown = (ev: MouseEvent) => {
    if (!this.canvas) return
    const configSpaceMouse = this.configSpaceMouse(ev)

    if (configSpaceMouse) {
      if (this.props.configSpaceViewportRect.contains(configSpaceMouse)) {
        // If dragging starting inside the viewport rectangle,
        // we'll move the existing viewport
        this.draggingMode = DraggingMode.TRANSLATE_VIEWPORT
        this.dragConfigSpaceViewportOffset = configSpaceMouse.minus(this.props.configSpaceViewportRect.origin)
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
    if (!this.dragStartConfigSpaceMouse || !this.canvas) return
    let configSpaceMouse = this.configSpaceMouse(ev)

    if (!configSpaceMouse) return
    this.updateCursor(configSpaceMouse)

    // Clamp the mouse position to avoid weird behavior when outside the canvas bounds
    configSpaceMouse = new Rect(new Vec2(0, 0), this.configSpaceSize()).closestPointTo(configSpaceMouse)

    if (this.draggingMode === DraggingMode.DRAW_NEW_VIEWPORT) {
      const configStart = this.dragStartConfigSpaceMouse
      let configEnd = configSpaceMouse

      if (!configStart || !configEnd) return
      const left = Math.min(configStart.x, configEnd.x)
      const right = Math.max(configStart.x, configEnd.x)

      const width = right - left
      const height = this.props.configSpaceViewportRect.height()

      this.props.setConfigSpaceViewportRect(new Rect(
        new Vec2(left, configEnd.y - height / 2),
        new Vec2(width, height)
      ))
    } else if (this.draggingMode === DraggingMode.TRANSLATE_VIEWPORT) {
      if (!this.dragConfigSpaceViewportOffset) return

      const newOrigin = configSpaceMouse.minus(this.dragConfigSpaceViewportOffset)
      this.props.setConfigSpaceViewportRect(
        this.props.configSpaceViewportRect.withOrigin(newOrigin)
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

  private onMouseMove = (ev: MouseEvent) => {
    if (!this.canvas) return

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

  private preprocess(flamechart: Flamechart) {
    if (!this.canvas || !this.regl) return
    console.time('minimap preprocess')
    const configSpaceRects: Rect[] = []
    const colors: vec3[] = []

    const layers = flamechart.getLayers()
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      for (let flamechartFrame of layer) {
        const configSpaceBounds = new Rect(
          new Vec2(flamechartFrame.start, i),
          new Vec2(flamechartFrame.end - flamechartFrame.start, 1)
        )
        configSpaceRects.push(configSpaceBounds)
        const color = flamechart.getColorForFrame(flamechartFrame.node.frame)
        colors.push([color.r, color.g, color.b])
      }
    }

    this.renderer = rectangleBatchRenderer(this.regl, configSpaceRects, colors, 0)
    this.viewportRectRenderer = viewportRectangleRenderer(this.regl);
    console.timeEnd('minimap preprocess')
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

  render() {
    return (
      <div
        onWheel={this.onWheel}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        className={css(style.minimap, style.vbox)} >
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

export interface OverlayRectangleRendererProps {
  configSpaceToPhysicalViewSpace: AffineTransform
  configSpaceViewportRect: Rect
  physicalSize: Vec2
}

export const viewportRectangleRenderer = (regl: regl.ReglCommandConstructor) => {
  return regl<OverlayRectangleRendererProps>({
    vert: `
      attribute vec2 position;

      void main() {
        gl_Position = vec4(position, 0, 1);
      }
    `,

    frag: `
      precision mediump float;

      uniform mat3 configSpaceToPhysicalViewSpace;
      uniform vec2 physicalSize;
      uniform vec2 configSpaceViewportOrigin;
      uniform vec2 configSpaceViewportSize;

      void main() {
        vec2 origin = (configSpaceToPhysicalViewSpace * vec3(configSpaceViewportOrigin, 1.0)).xy;
        vec2 size = (configSpaceToPhysicalViewSpace * vec3(configSpaceViewportSize, 0.0)).xy;

        vec2 halfSize = physicalSize / 2.0;

        float borderWidth = 2.0;

        origin = floor(origin * halfSize) / halfSize + borderWidth * vec2(1.0, 1.0);
        size = floor(size * halfSize) / halfSize - 2.0 * borderWidth * vec2(1.0, 1.0);

        vec2 coord = gl_FragCoord.xy;
        coord.y = physicalSize.y - coord.y;
        vec2 clamped = clamp(coord, origin, origin + size);
        vec2 gap = clamped - coord;
        float maxdist = max(abs(gap.x), abs(gap.y));

        // TOOD(jlfwong): Could probably optimize this to use mix somehow.
        if (maxdist == 0.0) {
          // Inside viewport rectangle
          gl_FragColor = vec4(0, 0, 0, 0);
        } else if (maxdist < borderWidth) {
          // Inside viewport rectangle at border
          gl_FragColor = vec4(0.7, 0.7, 0.7, 0.8);
        } else {
          // Outside viewport rectangle
          gl_FragColor = vec4(0.7, 0.7, 0.7, 0.5);
        }
      }
    `,

    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 'one',
        dstRGB: 'one minus src alpha',
        dstAlpha: 'one'
      }
    },

    depth: {
      enable: false
    },

    attributes: {
      // Cover full canvas with a rectangle
      // with 2 triangles using a triangle
      // strip.
      //
      // 0 +--+ 1
      //   | /|
      //   |/ |
      // 2 +--+ 3
      position: [
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1]
      ]
    },

    uniforms: {
      configSpaceToPhysicalViewSpace: (context, props) => {
        return props.configSpaceToPhysicalViewSpace.flatten()
      },
      configSpaceViewportOrigin: (context, props) => {
        return props.configSpaceViewportRect.origin.flatten()
      },
      configSpaceViewportSize: (context, props) => {
        return props.configSpaceViewportRect.size.flatten()
      },
      physicalSize: (context, props) => {
        return props.physicalSize.flatten()
      }
    },

    primitive: 'triangle strip',

    count: 4
  })
}