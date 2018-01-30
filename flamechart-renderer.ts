import * as regl from 'regl'
import { Flamechart } from './flamechart'
import { RectangleBatch } from './rectangle-batch-renderer'
import { CanvasContext } from './canvas-context';
import { Vec2, Rect, AffineTransform } from './math'
import { LRUCache } from './lru-cache'
import { Color } from './color'
import { getOrInsert } from './utils';

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
      height: Math.min(canvasContext.getMaxTextureSize(), 1024),
      wrapS: 'clamp',
      wrapT: 'clamp',
    })
    this.framebuffer = canvasContext.gl.framebuffer({ color: [this.texture] })
    this.rowCache = new LRUCache(this.texture.height)
    this.renderToFramebuffer = canvasContext.gl({
      framebuffer: this.framebuffer
    })
    this.clearLineBatch = canvasContext.createRectangleBatch()
    this.clearLineBatch.addRect(Rect.unit, new Color(0, 0, 0, 0))
  }

  has(key: K) { return this.rowCache.has(key) }
  getResolution() { return this.texture.width }
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
    private bounds: Rect,
    private numPrecedingRectanglesInRow: number
  ) {
    batch.uploadToGPU()
  }

  getBatch() { return this.batch }
  getBounds() { return this.bounds }
  getRectCount() { return this.batch.getRectCount() }
  getChildren() { return this.children }
  getParity() { return this.numPrecedingRectanglesInRow % 2 }
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
  renderOutlines: boolean
}

interface FlamechartRowAtlasKey {
  stackDepth: number
  zoomLevel: number
  index: number
}

export class FlamechartRenderer {
  private layers: RangeTreeNode[] = []
  private rowAtlas: RowAtlas<FlamechartRowAtlasKey>
  private rectInfoTexture: regl.Texture
  private framebuffer: regl.Framebuffer
  private renderToFramebuffer: regl.Command<{}>
  private withContext: regl.Command<{}>

  constructor(private canvasContext: CanvasContext, private flamechart: Flamechart) {
    const nLayers = flamechart.getLayers().length
    this.rowAtlas = new RowAtlas(canvasContext)
    for (let stackDepth = 0; stackDepth < nLayers; stackDepth++) {
      const leafNodes: RangeTreeLeafNode[] = []
      const y = stackDepth

      let minLeft = Infinity
      let maxRight = -Infinity
      let batch = canvasContext.createRectangleBatch()

      let rectCount = 0

      const layer = flamechart.getLayers()[stackDepth]

      for (let i = 0; i < layer.length; i++) {
        const frame = layer[i]
        if (batch.getRectCount() >= MAX_BATCH_SIZE) {
          leafNodes.push(new RangeTreeLeafNode(batch, new Rect(
            new Vec2(minLeft, stackDepth),
            new Vec2(maxRight - minLeft, 1)
          ), rectCount))
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

        // We'll use the red channel to indicate the index to allow
        // us to separate adjacent rectangles within a row from one another,
        // the green channel to indicate the row,
        // and the blue channel to indicate the color bucket to render.
        // We add one to each so we have zero reserved for the background color.
        const color = new Color(
          (1 + i % 255) / 256,
          (1 + stackDepth % 255) / 256,
          (1 + this.flamechart.getColorBucketForFrame(frame.node.frame)) / 256
        )
        batch.addRect(configSpaceBounds, color)
        rectCount++
      }

      if (batch.getRectCount() > 0) {
        leafNodes.push(new RangeTreeLeafNode(batch, new Rect(
          new Vec2(minLeft, stackDepth),
          new Vec2(maxRight - minLeft, 1)
        ), rectCount))
      }

      // TODO(jlfwong): Making this into a binary tree
      // range than a tree of always-height-two might make this run faster
      this.layers.push(new RangeTreeInteriorNode(leafNodes))

      // TODO(jlfwong): Extract this to CanvasContext
      this.withContext = canvasContext.gl({})

      this.rectInfoTexture = this.canvasContext.gl.texture({ width: 1, height: 1 })
      this.framebuffer = this.canvasContext.gl.framebuffer({
        color: [this.rectInfoTexture],
      })

      this.renderToFramebuffer = canvasContext.gl({
        framebuffer: this.framebuffer
      })
    }
  }

  private atlasKeys = new Map<string, FlamechartRowAtlasKey>()
  getOrInsertKey(key: FlamechartRowAtlasKey): FlamechartRowAtlasKey {
    const hash = `${key.stackDepth}_${key.index}_${key.zoomLevel}`
    return getOrInsert(this.atlasKeys, hash, () => key)
  }

  configSpaceBoundsForKey(key: FlamechartRowAtlasKey): Rect {
    const { stackDepth, zoomLevel, index } = key
    const configSpaceContentWidth = this.flamechart.getTotalWeight()

    const width = configSpaceContentWidth / Math.pow(2, zoomLevel)

    return new Rect(
      new Vec2(width * index, stackDepth),
      new Vec2(width, 1)
    )
  }

  render(props: FlamechartRendererProps) {
    const { configSpaceSrcRect, physicalSpaceDstRect } = props

    const atlasKeysToRender: { stackDepth: number, zoomLevel: number, index: number }[] = []

    // We want to render the lowest resolution we can while still guaranteeing that the
    // atlas line is higher resolution than its corresponding destination rectangle on
    // the screen.
    const configToPhysical = AffineTransform.betweenRects(configSpaceSrcRect, physicalSpaceDstRect)
    let zoomLevel = 0
    while (true) {
      const configSpaceBounds = this.configSpaceBoundsForKey({ stackDepth: 0, zoomLevel, index: 0 })
      const physicalBounds = configToPhysical.transformRect(configSpaceBounds)
      if (physicalBounds.width() < this.rowAtlas.getResolution()) {
        break
      }
      zoomLevel++
    }

    const top = Math.max(0, Math.floor(configSpaceSrcRect.top()))
    const bottom = Math.min(this.layers.length, Math.ceil(configSpaceSrcRect.bottom()))

    const configSpaceContentWidth = this.flamechart.getTotalWeight()
    const numAtlasEntriesPerLayer = Math.pow(2, zoomLevel)
    const left = Math.floor(numAtlasEntriesPerLayer * configSpaceSrcRect.left() / configSpaceContentWidth)
    const right = Math.ceil(numAtlasEntriesPerLayer * configSpaceSrcRect.right() / configSpaceContentWidth)

    for (let stackDepth = top; stackDepth < bottom; stackDepth++) {
      for (let index = left; index <= right; index++) {
        const key = this.getOrInsertKey({ stackDepth, zoomLevel, index })
        const configSpaceBounds = this.configSpaceBoundsForKey(key)
        if (!configSpaceBounds.hasIntersectionWith(configSpaceSrcRect)) continue
        atlasKeysToRender.push(key)
      }
    }

    const cacheCapacity = this.rowAtlas.getCapacity()
    const keysToRenderCached = atlasKeysToRender.slice(0, cacheCapacity)
    const keysToRenderUncached = atlasKeysToRender.slice(cacheCapacity)

    // Fill the cache
    this.rowAtlas.writeToAtlasIfNeeded(keysToRenderCached, (textureDstRect, key) => {
      const configSpaceBounds = this.configSpaceBoundsForKey(key)
      this.layers[key.stackDepth].forEachLeafNodeWithinBounds(configSpaceBounds, (leaf) => {
        this.canvasContext.drawRectangleBatch({
          batch: leaf.getBatch(),
          configSpaceSrcRect: configSpaceBounds,
          physicalSpaceDstRect: textureDstRect,
          parityMin: key.stackDepth % 2 == 0 ? 2 : 0,
          parityOffset: leaf.getParity()
        })
      })
    })

    this.withContext((context: regl.Context) => {
      this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    })

    this.renderToFramebuffer((context: regl.Context) => {
    // this.withContext((context: regl.Context) => {
      this.canvasContext.gl.clear({color: [0, 0, 0, 0]})
      const viewportRect = new Rect(Vec2.zero, new Vec2(context.viewportWidth, context.viewportHeight))

      const configToViewport = AffineTransform.betweenRects(configSpaceSrcRect, viewportRect)

      // Render from the cache
      for (let key of keysToRenderCached) {
        const configSpaceSrcRect = this.configSpaceBoundsForKey(key)
        this.rowAtlas.renderViaAtlas(key, configToViewport.transformRect(configSpaceSrcRect))
      }

      // Render entries that didn't make it into the cache
      for (let key of keysToRenderUncached) {
        const configSpaceBounds = this.configSpaceBoundsForKey(key)
        const physicalBounds = configToViewport.transformRect(configSpaceBounds)
        this.layers[key.stackDepth].forEachLeafNodeWithinBounds(configSpaceBounds, (leaf) => {
          this.canvasContext.drawRectangleBatch({
            batch: leaf.getBatch(),
            configSpaceSrcRect,
            physicalSpaceDstRect: physicalBounds,
            parityMin: key.stackDepth % 2 == 0 ? 2 : 0,
            parityOffset: leaf.getParity()
          })
        })
      }
    })

    this.canvasContext.drawFlamechartColorPass({
      rectInfoTexture: this.rectInfoTexture,
      srcRect: new Rect(Vec2.zero, new Vec2(this.rectInfoTexture.width, this.rectInfoTexture.height)),
      dstRect: physicalSpaceDstRect,
      renderOutlines: props.renderOutlines
    })

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