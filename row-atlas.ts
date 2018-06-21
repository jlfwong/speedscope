import regl from 'regl'
import {LRUCache} from './lru-cache'
import {RectangleBatch} from './rectangle-batch-renderer'
import {CanvasContext} from './canvas-context'
import {Rect, Vec2} from './math'
import {Color} from './color'

export class RowAtlas<K> {
  texture: regl.Texture
  private framebuffer: regl.Framebuffer
  private renderToFramebuffer: regl.Command<{}>
  private rowCache: LRUCache<K, number>
  private clearLineBatch: RectangleBatch

  constructor(private canvasContext: CanvasContext) {
    this.texture = canvasContext.gl.texture({
      width: Math.min(canvasContext.getMaxTextureSize(), 4096),
      height: Math.min(canvasContext.getMaxTextureSize(), 1024),
      wrapS: 'clamp',
      wrapT: 'clamp',
    })
    this.framebuffer = canvasContext.gl.framebuffer({color: [this.texture]})
    this.rowCache = new LRUCache(this.texture.height)
    this.renderToFramebuffer = canvasContext.gl({
      framebuffer: this.framebuffer,
    })
    this.clearLineBatch = canvasContext.createRectangleBatch()
    this.clearLineBatch.addRect(Rect.unit, new Color(0, 0, 0, 0))
  }

  has(key: K) {
    return this.rowCache.has(key)
  }
  getResolution() {
    return this.texture.width
  }
  getCapacity() {
    return this.texture.height
  }

  private allocateLine(key: K): number {
    if (this.rowCache.getSize() < this.rowCache.getCapacity()) {
      // Not in cache, but cache isn't full
      const row = this.rowCache.getSize()
      this.rowCache.insert(key, row)
      return row
    } else {
      // Not in cache, and cache is full. Evict something.
      const [, row] = this.rowCache.removeLRU()!
      this.rowCache.insert(key, row)
      return row
    }
  }

  writeToAtlasIfNeeded(keys: K[], render: (textureDstRect: Rect, key: K) => void) {
    this.renderToFramebuffer((context: regl.Context) => {
      for (let key of keys) {
        let row = this.rowCache.get(key)
        if (row != null) {
          // Already cached!
          continue
        }
        // Not cached -- we'll have to actually render
        row = this.allocateLine(key)

        const textureRect = new Rect(new Vec2(0, row), new Vec2(this.texture.width, 1))
        this.canvasContext.drawRectangleBatch({
          batch: this.clearLineBatch,
          configSpaceSrcRect: Rect.unit,
          physicalSpaceDstRect: textureRect,
        })
        render(textureRect, key)
      }
    })
  }

  renderViaAtlas(key: K, dstRect: Rect): boolean {
    let row = this.rowCache.get(key)
    if (row == null) {
      return false
    }

    const textureRect = new Rect(new Vec2(0, row), new Vec2(this.texture.width, 1))

    // At this point, we have the row in cache, and we can
    // paint directly from it into the framebuffer.
    this.canvasContext.drawTexture({
      texture: this.texture,
      srcRect: textureRect,
      dstRect: dstRect,
    })
    return true
  }
}
