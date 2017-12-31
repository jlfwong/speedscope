import * as regl from 'regl'
import { vec3, ReglCommand } from 'regl'
import { h, Component } from 'preact'
import { css } from 'aphrodite'
import { Flamechart } from './flamechart'
import { Rect, Vec2, AffineTransform } from './math'
import { rectangleBatchRenderer, RectangleBatchRendererProps } from "./rectangle-batch-renderer"
import { atMostOnceAFrame } from "./utils";
import { style } from "./flamechart-style";

const DEVICE_PIXEL_RATIO = window.devicePixelRatio

interface FlamechartMinimapViewProps {
  flamechart: Flamechart
  configSpaceViewportRect: Rect
  setConfigSpaceViewportRect: (rect: Rect) => void
}

export class FlamechartMinimapView extends Component<FlamechartMinimapViewProps, {}> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null
  overlayRenderer: ReglCommand<OverlayRectangleRendererProps> | null = null

  ctx: WebGLRenderingContext | null = null
  regl: regl.ReglCommandConstructor | null = null
  canvas: HTMLCanvasElement | null = null

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
    if (!this.renderer || !this.canvas || !this.overlayRenderer) return
    this.resizeCanvasIfNeeded()

    const configSpaceToNDC = this.physicalViewSpaceToNDC().times(this.configSpaceToPhysicalViewSpace())

    this.renderer({
      configSpaceToNDC: configSpaceToNDC,
      physicalSize: this.physicalViewSize()
    })

    this.overlayRenderer({
      configSpaceViewportRect: this.props.configSpaceViewportRect,
      configSpaceToPhysicalViewSpace: this.configSpaceToPhysicalViewSpace(),
      physicalSize: this.physicalViewSize()
    })
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

  private renderCanvas = atMostOnceAFrame(() => {
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

  private minConfigSpaceViewportRectWidth() { return 3 * this.props.flamechart.getMinFrameWidth(); }

  private transformViewport(transform: AffineTransform) {
    const viewportRect = transform.transformRect(this.props.configSpaceViewportRect)
    this.setConfigSpaceViewportRect(viewportRect)
  }

  private setConfigSpaceViewportRect(viewportRect: Rect) {
    const configSpaceOriginBounds = new Rect(
      new Vec2(0, 0),
      Vec2.max(new Vec2(0, 0), this.configSpaceSize().minus(viewportRect.size))
    )

    // TODO(jlfwong): De-dup this with FlamechartPanZoomView
    const configSpaceSizeBounds = new Rect(
      new Vec2(this.minConfigSpaceViewportRectWidth(), viewportRect.height()),
      new Vec2(this.configSpaceSize().x, viewportRect.height())
    )

    this.props.setConfigSpaceViewportRect(new Rect(
      configSpaceOriginBounds.closestPointTo(viewportRect.origin),
      configSpaceSizeBounds.closestPointTo(viewportRect.size)
    ))
  }

  private logicalToPhysicalViewSpace() {
    return AffineTransform.withScale(new Vec2(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO))
  }

  private pan(logicalViewSpaceDelta: Vec2) {
    const physicalDelta = this.logicalToPhysicalViewSpace().transformVector(logicalViewSpaceDelta)
    const configDelta = this.configSpaceToPhysicalViewSpace().inverseTransformVector(physicalDelta)

    if (!configDelta) return
    this.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault()
    this.pan(new Vec2(ev.deltaX, ev.deltaY))
    this.renderCanvas()
  }

  private dragStartPos: Vec2 | null = null
  private onMouseDown = (ev: MouseEvent) => {
    this.dragStartPos = new Vec2(ev.offsetX, ev.offsetY)
  }

  private onMouseDrag = (ev: MouseEvent) => {
    if (!this.dragStartPos) return

    const logicalStart = this.dragStartPos
    const physicalStart = this.logicalToPhysicalViewSpace().transformPosition(logicalStart)
    const configStart = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalStart)

    const logicalEnd = new Vec2(ev.offsetX, ev.offsetY)
    const physicalEnd = this.logicalToPhysicalViewSpace().transformPosition(logicalEnd)
    const configEnd = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalEnd)

    if (!configStart || !configEnd) return

    const left = Math.min(configStart.x, configEnd.x)
    const right = Math.max(configStart.x, configEnd.x)

    const width = right - left
    const height = this.props.configSpaceViewportRect.height()

    this.setConfigSpaceViewportRect(new Rect(
      new Vec2(left, configEnd.y - height / 2),
      new Vec2(width, height)
    ))
  }

  private onMouseMove = (ev: MouseEvent) => {
    if (this.dragStartPos) {
      ev.preventDefault()
      this.onMouseDrag(ev)
      return
    }
  }

  private onWindowMouseUp = (ev: MouseEvent) => {
    document.body.style.cursor = 'default'
    this.dragStartPos = null
  }

  private preprocess(flamechart: Flamechart) {
    if (!this.canvas || !this.regl) return
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

    this.renderer = rectangleBatchRenderer(this.regl, configSpaceRects, colors, 0)
    this.overlayRenderer = overlayRectangleRenderer(this.regl);
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
        onWheel={this.onWheel}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        className={css(style.minimap, style.vbox)} >
        <canvas
          width={1} height={1}
          ref={this.canvasRef}
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

export const overlayRectangleRenderer = (regl: regl.ReglCommandConstructor) => {
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