import * as regl from 'regl'
import { RectangleBatchRenderer, RectangleBatch, RectangleBatchRendererProps } from './rectangle-batch-renderer';
import { ViewportRectangleRenderer, ViewportRectangleRendererProps } from './overlay-rectangle-renderer';
import { TextureCachedRenderer, TextureRenderer, TextureRendererProps } from './texture-catched-renderer'
import { StatsPanel } from './stats'

import { Vec2, Rect } from './math';
import { FlamechartColorPassRenderer, FlamechartColorPassRenderProps } from './flamechart-color-pass-renderer';

type FrameCallback = () => void

interface SetViewportScopeProps {
  physicalBounds: Rect
}

export class CanvasContext {
  public gl: regl.Instance
  private rectangleBatchRenderer: RectangleBatchRenderer
  private viewportRectangleRenderer: ViewportRectangleRenderer
  private textureRenderer: TextureRenderer
  private flamechartColorPassRenderer: FlamechartColorPassRenderer
  private setViewportScope: regl.Command<{ physicalBounds: Rect }>
  private setScissor: regl.Command<{}>

  constructor(canvas: HTMLCanvasElement) {
    this.gl = regl({
      canvas: canvas,
      attributes: {
        antialias: false
      },
      extensions: ['ANGLE_instanced_arrays', 'WEBGL_depth_texture'],
      optionalExtensions: ['EXT_disjoint_timer_query'],
      profile: true
    })
    ;(window as any)['CanvasContext'] = this
    this.rectangleBatchRenderer = new RectangleBatchRenderer(this.gl)
    this.viewportRectangleRenderer = new ViewportRectangleRenderer(this.gl)
    this.textureRenderer = new TextureRenderer(this.gl)
    this.flamechartColorPassRenderer = new FlamechartColorPassRenderer(this.gl)
    this.setScissor = this.gl({ scissor: { enable: true } })
    this.setViewportScope = this.gl<SetViewportScopeProps>({
      context: {
        viewportX: (context: regl.Context, props: SetViewportScopeProps) => {
          return props.physicalBounds.left()
        },
        viewportY: (context: regl.Context, props: SetViewportScopeProps) => {
          return props.physicalBounds.top()
        }
      },
      viewport: (context, props) => {
        const { physicalBounds } = props
        return {
          x: physicalBounds.left(),
          y: window.devicePixelRatio * window.innerHeight - physicalBounds.top() - physicalBounds.height(),
          width: physicalBounds.width(),
          height: physicalBounds.height()
        }
      },
      scissor: (context, props) => {
        const { physicalBounds } = props
        return {
          enable: true,
          box: {
            x: physicalBounds.left(),
            y: window.devicePixelRatio * window.innerHeight - physicalBounds.top() - physicalBounds.height(),
            width: physicalBounds.width(),
            height: physicalBounds.height()
          }
        }
      }
    })
  }

  private tick: regl.Tick | null = null
  private tickNeeded: boolean = false
  private beforeFrameHandlers = new Set<FrameCallback>()
  addBeforeFrameHandler(callback: FrameCallback) {
    this.beforeFrameHandlers.add(callback)
  }
  removeBeforeFrameHandler(callback: FrameCallback) {
    this.beforeFrameHandlers.delete(callback)
  }
  requestFrame() {
    this.tickNeeded = true
    if (!this.tick) {
      this.tick = this.gl.frame(this.onBeforeFrame)
    }
  }

  private perfDebug = window.location.href.indexOf('perf-debug=1') !== -1
  private statsPanel: StatsPanel | null = this.perfDebug ? new StatsPanel() : null

  private onBeforeFrame = (context: regl.Context) => {
    this.setScissor(() => {
      this.gl.clear({ color: [0, 0, 0, 0] })
    })

    this.tickNeeded = false

    this.statsPanel && this.statsPanel.begin()
    for (const handler of this.beforeFrameHandlers) {
      handler()
    }
    this.statsPanel && this.statsPanel.end()

    if (this.tick && !this.tickNeeded) {
      if (!this.perfDebug) {
        this.tick.cancel()
        this.tick = null
      }
    }

    // TODO(jlfwong): It would be really nice to have GPU
    // stats here, but I can't figure out how to interpret
    // the gpuTime. I suspect this is caused by executing the same
    // program multiple times without flushing.
    // I'll investigate this at some point and report a bug to regl.
  }

  drawRectangleBatch(props: RectangleBatchRendererProps) {
    this.rectangleBatchRenderer.render(props)
  }

  drawTexture(props: TextureRendererProps) {
    this.textureRenderer.render(props)
  }

  drawFlamechartColorPass(props: FlamechartColorPassRenderProps) {
    this.flamechartColorPassRenderer.render(props)
  }

  createRectangleBatch(): RectangleBatch {
    return new RectangleBatch(this.gl)
  }

  createTextureCachedRenderer<T>(options: {
    render(t: T): void
    shouldUpdate(oldProps: T, newProps: T): boolean
  }): TextureCachedRenderer<T> {
    return new TextureCachedRenderer(this.gl, {
      ...options,
      textureRenderer: this.textureRenderer
    })
  }

  drawViewportRectangle(props: ViewportRectangleRendererProps){
    this.viewportRectangleRenderer.render(props)
  }

  renderInto(el: Element, cb: (context: regl.Context) => void) {
    const bounds = el.getBoundingClientRect()
    const physicalBounds = new Rect(
      new Vec2(bounds.left * window.devicePixelRatio, bounds.top * window.devicePixelRatio),
      new Vec2(bounds.width * window.devicePixelRatio, bounds.height * window.devicePixelRatio)
    )
    this.setViewportScope({ physicalBounds }, cb)
  }

  setViewport(physicalBounds: Rect, cb: (context: regl.Context) => void) {
    this.setViewportScope({ physicalBounds }, cb)
  }

  getMaxTextureSize() {
    return this.gl.limits.maxTextureSize
  }
}