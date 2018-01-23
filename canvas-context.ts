import * as regl from 'regl'
import { RectangleBatchRenderer, RectangleBatch, RectangleBatchRendererProps } from './rectangle-batch-renderer';
import { ViewportRectangleRenderer, ViewportRectangleRendererProps } from './overlay-rectangle-renderer';
import { Vec2, Rect } from './math';

type FrameCallback = () => void

export class CanvasContext {
  private gl: regl.Instance
  private rectangleBatchRenderer: RectangleBatchRenderer
  private viewportRectangleRenderer: ViewportRectangleRenderer
  private setViewportScope: regl.Command<{ physicalBounds: Rect }>

  constructor(canvas: HTMLCanvasElement) {
    this.gl = regl(canvas)
    this.rectangleBatchRenderer = new RectangleBatchRenderer(this.gl)
    this.viewportRectangleRenderer = new ViewportRectangleRenderer(this.gl)

    this.setViewportScope = this.gl({
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
  private onBeforeFrame = () => {
    this.tickNeeded = false
    for (const handler of this.beforeFrameHandlers) {
      handler()
    }
    if (this.tick && !this.tickNeeded) {
      console.log('Timer cancelled')
      this.tick.cancel()
      this.tick = null
    }
  }

  drawRectangleBatch(props: RectangleBatchRendererProps) {
    this.rectangleBatchRenderer.render(props)
  }

  createRectangleBatch(): RectangleBatch {
    return new RectangleBatch(this.gl)
  }

  drawViewportRectangle(props: ViewportRectangleRendererProps){
    this.viewportRectangleRenderer.render(props)
  }

  renderInto(el: Element, cb: () => void) {
    const bounds = el.getBoundingClientRect()
    const physicalBounds = new Rect(
      new Vec2(bounds.left * window.devicePixelRatio, bounds.top * window.devicePixelRatio),
      new Vec2(bounds.width * window.devicePixelRatio, bounds.height * window.devicePixelRatio)
    )
    this.setViewportScope({ physicalBounds }, cb)
  }
}