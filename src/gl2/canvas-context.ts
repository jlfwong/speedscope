import {Graphics, WebGL} from './graphics'
import {RectangleBatchRenderer} from './rectangle-batch-renderer'
import {TextureRenderer} from './texture-renderer'
import {Rect, Vec2} from '../lib/math'
import {ViewportRectangleRenderer} from './overlay-rectangle-renderer'
import {FlamechartColorPassRenderer} from './flamechart-color-pass-renderer'

type FrameCallback = () => void

export class CanvasContext {
  public readonly gl: Graphics.Context
  public readonly rectangleBatchRenderer: RectangleBatchRenderer
  public readonly textureRenderer: TextureRenderer
  public readonly viewportRectangleRenderer: ViewportRectangleRenderer
  public readonly flamechartColorPassRenderer: FlamechartColorPassRenderer

  constructor(canvas: HTMLCanvasElement) {
    this.gl = new WebGL.Context(canvas)
    this.rectangleBatchRenderer = new RectangleBatchRenderer(this.gl)
    this.textureRenderer = new TextureRenderer(this.gl)
    this.viewportRectangleRenderer = new ViewportRectangleRenderer(this.gl)
    this.flamechartColorPassRenderer = new FlamechartColorPassRenderer(this.gl)
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
    this.gl.clear(Graphics.Color.TRANSPARENT)

    for (const handler of this.beforeFrameHandlers) {
      handler()
    }
  }

  setViewport(physicalBounds: Rect, cb: () => void): void {
    const {origin, size} = physicalBounds
    this.gl.setViewport(origin.x, origin.y, size.x, size.y)
  }

  renderInto(el: Element, cb: () => void) {
    const bounds = el.getBoundingClientRect()
    const physicalBounds = new Rect(
      new Vec2(bounds.left * window.devicePixelRatio, bounds.top * window.devicePixelRatio),
      new Vec2(bounds.width * window.devicePixelRatio, bounds.height * window.devicePixelRatio),
    )
    this.setViewport(physicalBounds, cb)
  }
}
