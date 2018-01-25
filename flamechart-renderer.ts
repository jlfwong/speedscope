import { Flamechart, FlamechartFrame } from './flamechart'
import { RectangleBatch } from './rectangle-batch-renderer'
import { CanvasContext } from './canvas-context';
import { Vec2, Rect, AffineTransform } from './math'

const MAX_BATCH_SIZE = 10000  // TODO(jlfwong): Bump this to 10000

interface RangeTreeNode {
  getMinLeft(): number
  getMaxRight(): number
  getRectCount(): number
  getChildren(): RangeTreeNode[]
  forEachBatch(cb: (batch: RectangleBatch) => void): void
}

class RangeTreeLeafNode implements RangeTreeNode {
  private children: RangeTreeNode[] = []

  constructor(
    private batch: RectangleBatch,
    private minLeft: number,
    private maxRight: number
  ) { }

  getMinLeft() { return this.minLeft }
  getMaxRight() { return this.maxRight }
  getRectCount() { return this.batch.getRectCount() }
  getChildren() { return this.children }
  forEachBatch(cb: (batch: RectangleBatch) => void) { cb(this.batch) }
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
  forEachBatch(cb: (batch: RectangleBatch) => void) {
    for (let child of this.children) {
      child.forEachBatch(cb)
    }
  }
}

export interface FlamechartRendererProps {
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
}

class BoundedLayer {
  private rootNode: RangeTreeNode
  constructor(private canvasContext: CanvasContext, flamechart: Flamechart, stackDepth: number) {
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
    // TODO(jlfwong): Cull batches!
    this.rootNode.forEachBatch(batch => {
      this.canvasContext.drawRectangleBatch({ ...props, batch })
    })
  }
}

export class FlamechartRenderer {
  private layers: BoundedLayer[] = []

  constructor(canvasContext: CanvasContext, flamechart: Flamechart) {
    for (let i = 0; i < flamechart.getLayers().length; i++) {
      this.layers.push(new BoundedLayer(canvasContext, flamechart, i))
    }
  }

  render(props: FlamechartRendererProps) {
    // TODO(jlfwong): Cull layers outside the viewport!
    for (let layer of this.layers) {
      layer.render(props)
    }
  }
}