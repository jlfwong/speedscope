import * as regl from 'regl'
import { Flamechart } from './flamechart'
import { RectangleBatch } from './rectangle-batch-renderer'
import { CanvasContext } from './canvas-context';
import { Vec2, Rect, AffineTransform } from './math'
import { LRUCache } from './lru-cache'
import { Color } from './color'

const MAX_BATCH_SIZE = 10000

class RowAtlas<K> {
  texture: regl.Texture
  private framebuffer: regl.Framebuffer
  private renderToFramebuffer: regl.Command<{}>
  private rowCache: LRUCache<K, number>
  private clearLineBatch: RectangleBatch

  constructor(private canvasContext: CanvasContext) {
    this.texture = canvasContext.gl.texture({
      width: Math.min(canvasContext.getMaxTextureSize(), 4096),
      height: Math.min(canvasContext.getMaxTextureSize(), 4096),
      wrapS: 'clamp',
      wrapT: 'clamp',
    })
    this.framebuffer = canvasContext.gl.framebuffer({ color: [this.texture] })
    this.rowCache = new LRUCache(this.texture.height)
    this.renderToFramebuffer = canvasContext.gl({
      framebuffer: this.framebuffer
    })
    this.clearLineBatch = canvasContext.createRectangleBatch()
    this.clearLineBatch.addRect(Rect.unit, new Color(1, 1, 1, 1))
  }

  has(key: K) { return this.rowCache.has(key) }
  getCapacity() { return this.texture.height }

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

  writeToAtlasIfNeeded(
    keys: K[],
    render: (textureDstRect: Rect, key: K) => void
  ) {
    this.renderToFramebuffer((context: regl.Context) => {
      for (let key of keys) {
        let row = this.rowCache.get(key)
        if (row != null) {
          // Already cached!
          continue
        }
        // Not cached -- we'll have to actually render
        row = this.allocateLine(key)

        const textureRect = new Rect(
          new Vec2(0, row),
          new Vec2(this.texture.width, 1)
        )
        this.canvasContext.drawRectangleBatch({
          batch: this.clearLineBatch,
          configSpaceSrcRect: Rect.unit,
          physicalSpaceDstRect: textureRect
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

    const textureRect = new Rect(
      new Vec2(0, row),
      new Vec2(this.texture.width, 1)
    )

    // At this point, we have the row in cache, and we can
    // paint directly from it into the framebuffer.
    this.canvasContext.drawTexture({
      texture: this.texture,
      srcRect: textureRect,
      dstRect: dstRect
    })
    return true
  }
}

interface RangeTreeNode {
  getBounds(): Rect
  getRectCount(): number
  getChildren(): RangeTreeNode[]
  forEachLeafNodeWithinBounds(configSpaceBounds: Rect, cb: (leaf: RangeTreeLeafNode) => void): void
}

class RangeTreeLeafNode implements RangeTreeNode {
  private children: RangeTreeNode[] = []

  constructor(
    private batch: RectangleBatch,
    private bounds: Rect
  ) {
    batch.uploadToGPU()
  }

  getBatch() { return this.batch }
  getBounds() { return this.bounds }
  getRectCount() { return this.batch.getRectCount() }
  getChildren() { return this.children }
  forEachLeafNodeWithinBounds(configSpaceBounds: Rect, cb: (leaf: RangeTreeLeafNode) => void) {
    if (!this.bounds.hasIntersectionWith(configSpaceBounds)) return
    cb(this)
  }
}

class RangeTreeInteriorNode implements RangeTreeNode {
  private rectCount: number = 0
  private bounds: Rect
  constructor(private children: RangeTreeNode[]) {
    if (children.length === 0) {
      throw new Error("Empty interior node")
    }
    let minLeft = Infinity
    let maxRight = -Infinity
    let minTop = Infinity
    let maxBottom = -Infinity
    for (let child of children) {
      this.rectCount += child.getRectCount()
      const bounds = child.getBounds()
      minLeft = Math.min(minLeft, bounds.left())
      maxRight = Math.max(maxRight, bounds.right())
      minTop = Math.min(minTop, bounds.top())
      maxBottom = Math.max(maxBottom, bounds.bottom())
    }
    this.bounds = new Rect(
      new Vec2(minLeft, minTop),
      new Vec2(maxRight - minLeft, maxBottom - minTop)
    )
  }

  getBounds() { return this.bounds }
  getRectCount() { return this.rectCount }
  getChildren() { return this.children }

  forEachLeafNodeWithinBounds(configSpaceBounds: Rect, cb: (leaf: RangeTreeLeafNode) => void) {
    if (!this.bounds.hasIntersectionWith(configSpaceBounds)) return
    for (let child of this.children) {
      child.forEachLeafNodeWithinBounds(configSpaceBounds, cb)
    }
  }
}

export interface FlamechartRendererProps {
  configSpaceSrcRect: Rect
  physicalSpaceDstRect: Rect
}


export class FlamechartRenderer {
  private root: RangeTreeNode
  private rowAtlas: RowAtlas<RangeTreeLeafNode>

  constructor(private canvasContext: CanvasContext, private flamechart: Flamechart) {
    const nLayers = flamechart.getLayers().length
    this.rowAtlas = new RowAtlas(canvasContext)

    const layers: RangeTreeNode[] = []

    for (let stackDepth = 0; stackDepth < nLayers; stackDepth++) {
      const leafNodes: RangeTreeLeafNode[] = []
      const y = stackDepth

      let minLeft = Infinity
      let maxRight = -Infinity
      let batch = canvasContext.createRectangleBatch()

      for (let frame of flamechart.getLayers()[stackDepth]) {
        if (batch.getRectCount() >= MAX_BATCH_SIZE) {
          leafNodes.push(new RangeTreeLeafNode(batch, new Rect(
            new Vec2(minLeft, stackDepth),
            new Vec2(maxRight - minLeft, 1)
          )))
          minLeft = Infinity
          maxRight = -Infinity
          batch = canvasContext.createRectangleBatch()
        }
        const configSpaceBounds = new Rect(
          new Vec2(frame.start, y),
          new Vec2(frame.end - frame.start, 1)
        )
        minLeft = Math.min(minLeft, configSpaceBounds.left())
        maxRight = Math.max(maxRight, configSpaceBounds.right())
        const color = flamechart.getColorForFrame(frame.node.frame)
        batch.addRect(configSpaceBounds, color)
      }

      if (batch.getRectCount() > 0) {
        leafNodes.push(new RangeTreeLeafNode(batch, new Rect(
          new Vec2(minLeft, stackDepth),
          new Vec2(maxRight - minLeft, 1)
        )))
      }

      // TODO(jlfwong): Probably want this to be a binary tree
      layers.push(new RangeTreeInteriorNode(leafNodes))
    }
    this.root = new RangeTreeInteriorNode(layers)
  }

  render(props: FlamechartRendererProps) {
    const { configSpaceSrcRect, physicalSpaceDstRect } = props

    let renderedBatchCount = 0
    let cacheCapacity = this.rowAtlas.getCapacity()

    const cachedLeaves: RangeTreeLeafNode[] = []
    const uncachedLeaves: RangeTreeLeafNode[] = []

    this.root.forEachLeafNodeWithinBounds(configSpaceSrcRect, leaf => {
      // We want to avoid rendering more batches to the cache than
      // the capacity fo the cache to prevent LRU cache thrash. Imagine
      // the capacity is 2 and you render 4 items via the cache. Every time
      // you do this, you end up evicting and populating the cache on all 4 items,
      // which is even more expensive than not using a cache at all! Instead,
      // we'll cache the first 2 entries in that case, and re-use that cache each time,
      // while rendering the final 2 items without use of the cache.
      let useCache = renderedBatchCount++ < cacheCapacity
      if (useCache) {
        cachedLeaves.push(leaf)
      } else {
        uncachedLeaves.push(leaf)
      }
    })

    this.rowAtlas.writeToAtlasIfNeeded(cachedLeaves, (textureDstRect, leaf) => {
      const configSpaceBounds = new Rect(
        new Vec2(0, leaf.getBounds().top()),
        new Vec2(this.flamechart.getTotalWeight(), 1)
      )
      this.canvasContext.drawRectangleBatch({
        batch: leaf.getBatch(),
        configSpaceSrcRect: configSpaceBounds,
        physicalSpaceDstRect: textureDstRect
      })
    })

    const configToPhysical = AffineTransform.betweenRects(configSpaceSrcRect, physicalSpaceDstRect)
    for (let leaf of cachedLeaves) {
      const configSpaceBounds = new Rect(
        new Vec2(0, leaf.getBounds().top()),
        new Vec2(this.flamechart.getTotalWeight(), 1)
      )
      const physicalLeafBounds = configToPhysical.transformRect(configSpaceBounds)
      if (!this.rowAtlas.renderViaAtlas(leaf, physicalLeafBounds)) {
        console.error('Failed to render from cache')
      }
    }

    for (let leaf of uncachedLeaves) {
      this.canvasContext.drawRectangleBatch({
        batch: leaf.getBatch(),
        configSpaceSrcRect,
        physicalSpaceDstRect
      })
    }

    // Overlay the atlas on top of the canvas for debugging
    /*
    this.canvasContext.drawTexture({
      texture: this.rowAtlas.texture,
      srcRect: new Rect(Vec2.zero, new Vec2(this.rowAtlas.texture.width, this.rowAtlas.texture.height)),
      dstRect: new Rect(Vec2.zero, new Vec2(800, 800))
    })
    */
  }
}