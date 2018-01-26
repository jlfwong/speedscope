import * as regl from 'regl'
import { Flamechart } from './flamechart'
import { RectangleBatch } from './rectangle-batch-renderer'
import { CanvasContext } from './canvas-context';
import { Vec2, Rect, AffineTransform } from './math'

const MAX_BATCH_SIZE = 10000

interface RangeTreeNode {
  getMinLeft(): number
  getMaxRight(): number
  getRectCount(): number
  getChildren(): RangeTreeNode[]
  forEachBatchInViewport(configSpaceViewport: Rect, cb: (batch: RectangleBatch) => void): void
}

class RangeTreeLeafNode implements RangeTreeNode {
  private children: RangeTreeNode[] = []

  constructor(
    private batch: RectangleBatch,
    private minLeft: number,
    private maxRight: number
  ) {}

  getMinLeft() { return this.minLeft }
  getMaxRight() { return this.maxRight }
  getRectCount() { return this.batch.getRectCount() }
  getChildren() { return this.children }
  forEachBatchInViewport(configSpaceViewport: Rect, cb: (batch: RectangleBatch) => void) {
    if (this.maxRight < configSpaceViewport.left()) return
    if (this.minLeft > configSpaceViewport.right()) return
    cb(this.batch)
  }
}

class RangeTreeInteriorNode implements RangeTreeNode {
  private rectCount: number = 0
  constructor(private children: RangeTreeNode[]) {
    if (children.length === 0) {
      throw new Error("Empty interior node")
    }
    for (let child of children) {
      this.rectCount += child.getRectCount()
    }
  }

  getMinLeft() { return this.children[0].getMinLeft() }
  getMaxRight() { return this.children[this.children.length - 1].getMaxRight() }
  getRectCount() { return this.rectCount }
  getChildren() { return this.children }
  forEachBatchInViewport(configSpaceViewport: Rect, cb: (batch: RectangleBatch) => void) {
    // if (this.getMaxRight() < configSpaceViewport.left()) return
    // if (this.getMinLeft() > configSpaceViewport.right()) return

    for (let child of this.children) {
      child.forEachBatchInViewport(configSpaceViewport, cb)
    }
  }
}

export interface FlamechartRendererProps {
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
}

class BoundedLayer {
  private rootNode: RangeTreeNode
  constructor(
    private canvasContext: CanvasContext,
    flamechart: Flamechart,
    private stackDepth: number
  ) {
    const leafNodes: RangeTreeLeafNode[] = []

    let minLeft = Infinity
    let maxRight = -Infinity
    let batch = canvasContext.createRectangleBatch()

    for (let frame of flamechart.getLayers()[stackDepth]) {
      if (batch.getRectCount() >= MAX_BATCH_SIZE) {
        leafNodes.push(new RangeTreeLeafNode(batch, minLeft, maxRight))
        minLeft = Infinity
        maxRight = -Infinity
        batch = canvasContext.createRectangleBatch()
      }
      const configSpaceBounds = new Rect(
        new Vec2(frame.start, stackDepth + 1),
        new Vec2(frame.end - frame.start, 1)
      )
      minLeft = Math.min(minLeft, configSpaceBounds.left())
      maxRight = Math.max(maxRight, configSpaceBounds.right())
      const color = flamechart.getColorForFrame(frame.node.frame)
      batch.addRect(configSpaceBounds, color)
    }

    if (batch.getRectCount() > 0) {
      leafNodes.push(new RangeTreeLeafNode(batch, minLeft, maxRight))
    }

    // TODO(jlfwong): Probably want this to be a binary tree
    this.rootNode = new RangeTreeInteriorNode(leafNodes)
  }

  render(props: FlamechartRendererProps) {
    const configSpaceTop = this.stackDepth + 1
    const configSpaceBottom = configSpaceTop + 1

    const ndcToConfigSpace = props.configSpaceToNDC.inverted()
    if (!ndcToConfigSpace) return
    const configSpaceViewportRect = ndcToConfigSpace.transformRect(new Rect(
      new Vec2(-1, -1), new Vec2(2, 2)
    ))

    if (configSpaceTop > configSpaceViewportRect.bottom()) {
      // Entire layer is below the viewport
      return
    }

    if (configSpaceBottom < configSpaceViewportRect.top()) {
      // Entire layer is above the viewport
      return
    }

    this.rootNode.forEachBatchInViewport(configSpaceViewportRect, batch => {
      this.canvasContext.drawRectangleBatch({ ...props, batch })
    })
  }
}

export class FlamechartRenderer {
  private layers: BoundedLayer[] = []
  private texture: regl.Texture | null = null

  constructor(private canvasContext: CanvasContext, flamechart: Flamechart) {
    const nLayers = flamechart.getLayers().length
    const maxTextureSize = canvasContext.getMaxTextureSize()

    if (nLayers > maxTextureSize) {
      throw new Error(`This profile has more than ${maxTextureSize} layers!`)
    }

    this.texture = canvasContext.gl.texture({
      width: canvasContext.getMaxTextureSize(),
      height: nLayers,
    })
    const fbo = canvasContext.gl.framebuffer({ color: [this.texture] })

    for (let i = 0; i < nLayers; i++) {
      this.layers.push(new BoundedLayer(canvasContext, flamechart, i))
    }

    const configSpaceToNDC = AffineTransform.withScale(new Vec2(1, -1)).times(
      AffineTransform.betweenRects(
        new Rect(new Vec2(0, 0), new Vec2(flamechart.getTotalWeight(), nLayers)),
        new Rect(new Vec2(-1, -1), new Vec2(2, 2))
      )
    )

    canvasContext.gl({
      viewport: (context, props) => {
        return {
          x: 0,
          y: 0,
          width: canvasContext.getMaxTextureSize(),
          height: nLayers
        }
      },
      framebuffer: fbo
    })((context: regl.Context) => {
      const physicalSize = new Vec2(context.drawingBufferWidth, context.drawingBufferHeight)
      for (let layer of this.layers) {
        layer.render({ physicalSize, configSpaceToNDC })
      }
    })

    fbo.destroy()
  }

  render(props: FlamechartRendererProps) {
    if (!this.texture) return
    this.canvasContext.drawTexture({
      texture: this.texture,
      ndcRect: new Rect(new Vec2(-1, -1), new Vec2(2, 2)),
      uvRect: new Rect(new Vec2(0, 0), new Vec2(1, 1))
    })

    /*
    for (let layer of this.layers) {
      layer.render(props)
    }
    */
  }
}