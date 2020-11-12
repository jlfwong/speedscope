import {Graphics, WebGL} from './graphics'
import {RectangleBatchRenderer} from './rectangle-batch-renderer'
import {TextureRenderer} from './texture-renderer'
import {Rect, Vec2} from '../lib/math'
import {ViewportRectangleRenderer} from './overlay-rectangle-renderer'
import {FlamechartColorPassRenderer} from './flamechart-color-pass-renderer'
import {Color} from '../lib/color'
import {Theme} from '../views/themes/theme'

type FrameCallback = () => void

export class CanvasContext {
  public readonly gl: WebGL.Context
  public readonly rectangleBatchRenderer: RectangleBatchRenderer
  public readonly textureRenderer: TextureRenderer
  public readonly viewportRectangleRenderer: ViewportRectangleRenderer
  public readonly flamechartColorPassRenderer: FlamechartColorPassRenderer
  public readonly theme: Theme

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    this.gl = new WebGL.Context(canvas)
    this.rectangleBatchRenderer = new RectangleBatchRenderer(this.gl)
    this.textureRenderer = new TextureRenderer(this.gl)
    this.viewportRectangleRenderer = new ViewportRectangleRenderer(this.gl, theme)
    this.flamechartColorPassRenderer = new FlamechartColorPassRenderer(this.gl, theme)
    this.theme = theme

    // Whenever the canvas is resized, draw immediately. This prevents
    // flickering during resizing.
    this.gl.addAfterResizeEventHandler(this.onBeforeFrame)

    const webGLInfo = this.gl.getWebGLInfo()
    if (webGLInfo) {
      console.log(
        `WebGL initialized. renderer: ${webGLInfo.renderer}, vendor: ${webGLInfo.vendor}, version: ${webGLInfo.version}`,
      )
    }
    ;(window as any)['testContextLoss'] = () => {
      this.gl.testContextLoss()
    }
  }

  private animationFrameRequest: number | null = null
  private beforeFrameHandlers = new Set<FrameCallback>()
  addBeforeFrameHandler(callback: FrameCallback) {
    this.beforeFrameHandlers.add(callback)
  }
  removeBeforeFrameHandler(callback: FrameCallback) {
    this.beforeFrameHandlers.delete(callback)
  }
  requestFrame() {
    if (!this.animationFrameRequest) {
      this.animationFrameRequest = requestAnimationFrame(this.onBeforeFrame)
    }
  }
  private onBeforeFrame = () => {
    this.animationFrameRequest = null
    this.gl.setViewport(0, 0, this.gl.renderTargetWidthInPixels, this.gl.renderTargetHeightInPixels)
    const color = Color.fromCSSHex(this.theme.bgPrimaryColor)
    this.gl.clear(new Graphics.Color(color.r, color.g, color.b, color.a))

    for (const handler of this.beforeFrameHandlers) {
      handler()
    }
  }

  setViewport(physicalBounds: Rect, cb: () => void): void {
    const {origin, size} = physicalBounds
    let viewportBefore = this.gl.viewport
    this.gl.setViewport(origin.x, origin.y, size.x, size.y)

    cb()

    let {x, y, width, height} = viewportBefore
    this.gl.setViewport(x, y, width, height)
  }

  renderBehind(el: Element, cb: () => void) {
    const bounds = el.getBoundingClientRect()
    const physicalBounds = new Rect(
      new Vec2(bounds.left * window.devicePixelRatio, bounds.top * window.devicePixelRatio),
      new Vec2(bounds.width * window.devicePixelRatio, bounds.height * window.devicePixelRatio),
    )

    this.setViewport(physicalBounds, cb)
  }
}
