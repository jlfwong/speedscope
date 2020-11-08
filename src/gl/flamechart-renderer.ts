import {Flamechart} from '../lib/flamechart'
import {RectangleBatch, RectangleBatchRenderer} from './rectangle-batch-renderer'
import {Vec2, Rect, AffineTransform} from '../lib/math'
import {Color} from '../lib/color'
import {KeyedSet} from '../lib/utils'
import {RowAtlas} from './row-atlas'
import {Graphics} from './graphics'
import {FlamechartColorPassRenderer} from './flamechart-color-pass-renderer'
import {renderInto} from './utils'

const MAX_BATCH_SIZE = 10000

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
    private numPrecedingRectanglesInRow: number,
  ) {}

  getBatch() {
    return this.batch
  }
  getBounds() {
    return this.bounds
  }
  getRectCount() {
    return this.batch.getRectCount()
  }
  getChildren() {
    return this.children
  }
  getParity() {
    return this.numPrecedingRectanglesInRow % 2
  }
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
      throw new Error('Empty interior node')
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
      new Vec2(maxRight - minLeft, maxBottom - minTop),
    )
  }

  getBounds() {
    return this.bounds
  }
  getRectCount() {
    return this.rectCount
  }
  getChildren() {
    return this.children
  }

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

interface FlamechartRowAtlasKeyInfo {
  stackDepth: number
  zoomLevel: number
  index: number
}

export class FlamechartRowAtlasKey {
  readonly stackDepth: number
  readonly zoomLevel: number
  readonly index: number

  get key() {
    return `${this.stackDepth}_${this.index}_${this.zoomLevel}`
  }
  private constructor(options: FlamechartRowAtlasKeyInfo) {
    this.stackDepth = options.stackDepth
    this.zoomLevel = options.zoomLevel
    this.index = options.index
  }
  static getOrInsert(set: KeyedSet<FlamechartRowAtlasKey>, info: FlamechartRowAtlasKeyInfo) {
    return set.getOrInsert(new FlamechartRowAtlasKey(info))
  }
}

export interface FlamechartRendererOptions {
  inverted: boolean
}

export class FlamechartRenderer {
  private layers: RangeTreeNode[] = []

  constructor(
    private gl: Graphics.Context,
    private rowAtlas: RowAtlas<FlamechartRowAtlasKey>,
    private flamechart: Flamechart,
    private rectangleBatchRenderer: RectangleBatchRenderer,
    private colorPassRenderer: FlamechartColorPassRenderer,
    private options: FlamechartRendererOptions = {inverted: false},
  ) {
    const nLayers = flamechart.getLayers().length
    for (let stackDepth = 0; stackDepth < nLayers; stackDepth++) {
      const leafNodes: RangeTreeLeafNode[] = []
      const y = options.inverted ? nLayers - 1 - stackDepth : stackDepth

      let minLeft = Infinity
      let maxRight = -Infinity
      let batch = new RectangleBatch(this.gl)

      let rectCount = 0

      const layer = flamechart.getLayers()[stackDepth]

      for (let i = 0; i < layer.length; i++) {
        const frame = layer[i]
        if (batch.getRectCount() >= MAX_BATCH_SIZE) {
          leafNodes.push(
            new RangeTreeLeafNode(
              batch,
              new Rect(new Vec2(minLeft, y), new Vec2(maxRight - minLeft, 1)),
              rectCount,
            ),
          )
          minLeft = Infinity
          maxRight = -Infinity
          batch = new RectangleBatch(this.gl)
        }
        const configSpaceBounds = new Rect(
          new Vec2(frame.start, y),
          new Vec2(frame.end - frame.start, 1),
        )
        minLeft = Math.min(minLeft, configSpaceBounds.left())
        maxRight = Math.max(maxRight, configSpaceBounds.right())

        // We'll use the red channel to indicate the index to allow
        // us to separate adjacent rectangles within a row from one another,
        // the green channel to indicate the row,
        // and the blue channel to indicate the color bucket to render.
        // We add one to each so we have zero reserved for the background color.
        const color = new Color(
          (1 + (i % 255)) / 256,
          (1 + (stackDepth % 255)) / 256,
          (1 + this.flamechart.getColorBucketForFrame(frame.node.frame)) / 256,
        )
        batch.addRect(configSpaceBounds, color)
        rectCount++
      }

      if (batch.getRectCount() > 0) {
        leafNodes.push(
          new RangeTreeLeafNode(
            batch,
            new Rect(new Vec2(minLeft, y), new Vec2(maxRight - minLeft, 1)),
            rectCount,
          ),
        )
      }

      // TODO(jlfwong): Making this into a binary tree
      // range than a tree of always-height-two might make this run faster
      this.layers.push(new RangeTreeInteriorNode(leafNodes))
    }
  }

  private rectInfoTexture: Graphics.Texture | null = null
  getRectInfoTexture(width: number, height: number): Graphics.Texture {
    if (this.rectInfoTexture) {
      const texture = this.rectInfoTexture
      if (texture.width != width || texture.height != height) {
        texture.resize(width, height)
      }
    } else {
      this.rectInfoTexture = this.gl.createTexture(
        Graphics.TextureFormat.NEAREST_CLAMP,
        width,
        height,
      )
    }
    return this.rectInfoTexture
  }

  private rectInfoRenderTarget: Graphics.RenderTarget | null = null
  getRectInfoRenderTarget(width: number, height: number): Graphics.RenderTarget {
    const texture = this.getRectInfoTexture(width, height)
    if (this.rectInfoRenderTarget) {
      if (this.rectInfoRenderTarget.texture != texture) {
        this.rectInfoRenderTarget.texture.free()
        this.rectInfoRenderTarget.setColor(texture)
      }
    }
    if (!this.rectInfoRenderTarget) {
      this.rectInfoRenderTarget = this.gl.createRenderTarget(texture)
    }
    return this.rectInfoRenderTarget
  }

  free() {
    if (this.rectInfoRenderTarget) {
      this.rectInfoRenderTarget.free()
    }
    if (this.rectInfoTexture) {
      this.rectInfoTexture.free()
    }
  }

  private atlasKeys = new KeyedSet<FlamechartRowAtlasKey>()

  configSpaceBoundsForKey(key: FlamechartRowAtlasKey): Rect {
    const {stackDepth, zoomLevel, index} = key
    const configSpaceContentWidth = this.flamechart.getTotalWeight()

    const width = configSpaceContentWidth / Math.pow(2, zoomLevel)

    const nLayers = this.flamechart.getLayers().length
    const y = this.options.inverted ? nLayers - 1 - stackDepth : stackDepth
    return new Rect(new Vec2(width * index, y), new Vec2(width, 1))
  }

  render(props: FlamechartRendererProps) {
    const {configSpaceSrcRect, physicalSpaceDstRect} = props

    const atlasKeysToRender: FlamechartRowAtlasKey[] = []

    // We want to render the lowest resolution we can while still guaranteeing that the
    // atlas line is higher resolution than its corresponding destination rectangle on
    // the screen.
    const configToPhysical = AffineTransform.betweenRects(configSpaceSrcRect, physicalSpaceDstRect)
    if (configSpaceSrcRect.isEmpty()) {
      // Prevent an infinite loop
      return
    }

    let zoomLevel = 0
    while (true) {
      const key = FlamechartRowAtlasKey.getOrInsert(this.atlasKeys, {
        stackDepth: 0,
        zoomLevel,
        index: 0,
      })
      const configSpaceBounds = this.configSpaceBoundsForKey(key)
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
    const left = Math.floor(
      (numAtlasEntriesPerLayer * configSpaceSrcRect.left()) / configSpaceContentWidth,
    )
    const right = Math.ceil(
      (numAtlasEntriesPerLayer * configSpaceSrcRect.right()) / configSpaceContentWidth,
    )

    const nLayers = this.flamechart.getLayers().length

    for (let y = top; y < bottom; y++) {
      for (let index = left; index <= right; index++) {
        const stackDepth = this.options.inverted ? nLayers - 1 - y : y
        const key = FlamechartRowAtlasKey.getOrInsert(this.atlasKeys, {
          stackDepth,
          zoomLevel,
          index,
        })
        const configSpaceBounds = this.configSpaceBoundsForKey(key)
        if (!configSpaceBounds.hasIntersectionWith(configSpaceSrcRect)) continue
        atlasKeysToRender.push(key)
      }
    }

    // TODO(jlfwong): When I switched the GL backend from regl to the port from
    // evanw/sky, rendering uncached even for massive documents seemed fast
    // enough. It's possible that the row cache is now unnecessary, but I'll
    // leave it around for now since it's not causing issues.

    const cacheCapacity = this.rowAtlas.getCapacity()
    const keysToRenderCached = atlasKeysToRender.slice(0, cacheCapacity)
    const keysToRenderUncached = atlasKeysToRender.slice(cacheCapacity)

    // Fill the cache
    this.rowAtlas.writeToAtlasIfNeeded(keysToRenderCached, (textureDstRect, key) => {
      const configSpaceBounds = this.configSpaceBoundsForKey(key)
      this.layers[key.stackDepth].forEachLeafNodeWithinBounds(configSpaceBounds, leaf => {
        this.rectangleBatchRenderer.render({
          batch: leaf.getBatch(),
          configSpaceSrcRect: configSpaceBounds,
          physicalSpaceDstRect: textureDstRect,
        })
      })
    })

    const renderTarget = this.getRectInfoRenderTarget(
      physicalSpaceDstRect.width(),
      physicalSpaceDstRect.height(),
    )

    renderInto(this.gl, renderTarget, () => {
      this.gl.clear(new Graphics.Color(0, 0, 0, 0))

      const viewportRect = new Rect(
        Vec2.zero,
        new Vec2(this.gl.viewport.width, this.gl.viewport.height),
      )
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
        this.layers[key.stackDepth].forEachLeafNodeWithinBounds(configSpaceBounds, leaf => {
          this.rectangleBatchRenderer.render({
            batch: leaf.getBatch(),
            configSpaceSrcRect: configSpaceBounds,
            physicalSpaceDstRect: physicalBounds,
          })
        })
      }
    })

    const rectInfoTexture = this.getRectInfoTexture(
      physicalSpaceDstRect.width(),
      physicalSpaceDstRect.height(),
    )

    this.colorPassRenderer.render({
      rectInfoTexture,
      srcRect: new Rect(Vec2.zero, new Vec2(rectInfoTexture.width, rectInfoTexture.height)),
      dstRect: physicalSpaceDstRect,
      renderOutlines: props.renderOutlines,
    })
  }
}
