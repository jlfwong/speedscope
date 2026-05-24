import {Graphics, WebGL} from './graphics'
import {RectangleBatchRenderer} from './rectangle-batch-renderer'
import {TextureRenderer} from './texture-renderer'
import {Rect, Vec2} from '../lib/math'
import {ViewportRectangleRenderer} from './overlay-rectangle-renderer'
import {FlamechartColorPassRenderer} from './flamechart-color-pass-renderer'
import {Color} from '../lib/color'
import {Theme} from '../views/themes/theme'
import { getSpeedscopeWindow } from '../widgetUtils'

type FrameCallback = () => void

export class CanvasContext {
  public gl: WebGL.Context
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
    if (!this.gl) return

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

  parent = getSpeedscopeWindow()
  getRelativePhysicalBounds(childElement: Element) {
    const cached = graphRenderCache.get(childElement);
    if (cached) return cached;

    const childRect = getWH(childElement);
    const parentRect = getWH(this.parent);

    const relativeLeft = childRect.left - parentRect.left;
    const relativeTop = childRect.top - parentRect.top;
    const ratio = window.devicePixelRatio
    const rect = new Rect(
      new Vec2(relativeLeft * ratio, relativeTop * ratio),
      new Vec2(childRect.width * ratio, childRect.height * ratio),
    );

    graphRenderCache.set(childElement, rect);
    return  rect;
  }

  // render a single flamegraph frame
  renderBehind(el: Element, cb: () => void) {
    const physicalBounds =  this.getRelativePhysicalBounds(el)
    this.setViewport(physicalBounds, cb)
  }
}

// all canvas relative size operations should be cached
export let graphRenderCache = new WeakMap<Element, Rect>();
export let rectCache = new WeakMap<Element, DOMRect>();
export function getWH(el: Element): DOMRect {
  const cached = rectCache.get(el);
  if(cached) return cached;
  const rect = el.getBoundingClientRect();
  rectCache.set(el, rect);
  return rect;
}
export function cleanGraphRenderCache() { 
  // console.log('cache cleaned!')
  graphRenderCache = new WeakMap(); 
  rectCache = new WeakMap();
}
