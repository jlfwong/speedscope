import {LRUCache} from '../lib/lru-cache'
import {RectangleBatch, RectangleBatchRenderer} from './rectangle-batch-renderer'
import {Rect, Vec2} from '../lib/math'
import {Color} from '../lib/color'
import {Graphics} from './graphics'
import {TextureRenderer} from './texture-renderer'
import {renderInto} from './utils'

export class RowAtlas<K> {
  private texture: Graphics.Texture
  private renderTarget: Graphics.RenderTarget
  private rowCache: LRUCache<K, number>
  private clearLineBatch: RectangleBatch

  constructor(
    private gl: Graphics.Context,
    private rectangleBatchRenderer: RectangleBatchRenderer,
    private textureRenderer: TextureRenderer,
  ) {
    this.texture = gl.createTexture(Graphics.TextureFormat.NEAREST_CLAMP, 4096, 4096)
    this.renderTarget = gl.createRenderTarget(this.texture)
    this.rowCache = new LRUCache(this.texture.height)
    this.clearLineBatch = new RectangleBatch(gl)
    this.clearLineBatch.addRect(Rect.unit, new Color(0, 0, 0, 0))

    // All of the cached data is stored GPU-side, and we don't retain a copy of
    // it client-side. This means when we get a context loss event, the data is
    // totally gone. So let's clear our CPU-side cache to reflect that fact.
    gl.addContextResetHandler(() => {
      this.rowCache.clear()
    })
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
    renderInto(this.gl, this.renderTarget, () => {
      for (let key of keys) {
        let row = this.rowCache.get(key)
        if (row != null) {
          // Already cached!
          continue
        }
        // Not cached -- we'll have to actually render
        row = this.allocateLine(key)

        const textureRect = new Rect(new Vec2(0, row), new Vec2(this.texture.width, 1))
        this.rectangleBatchRenderer.render({
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
    this.textureRenderer.render({
      texture: this.texture,
      srcRect: textureRect,
      dstRect: dstRect,
    })
    return true
  }
}
