import {Frame, CallTreeNode} from './profile'

import {lastOf} from './utils'

export interface FlamechartFrame {
  node: CallTreeNode
  start: number
  end: number
  parent: FlamechartFrame | null
  children: FlamechartFrame[]
}

type StackLayer = FlamechartFrame[]

interface FlamechartDataSource {
  getTotalWeight(): number

  formatValue(v: number): string

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (value: number) => void,
  ): void

  getColorBucketForFrame(f: Frame): number
}

export class Flamechart {
  // Bottom to top
  private layers: StackLayer[] = []
  private totalWeight: number = 0
  private minFrameWidth: number = 1

  getTotalWeight() {
    return this.totalWeight
  }
  getLayers() {
    return this.layers
  }
  getColorBucketForFrame(frame: Frame) {
    return this.source.getColorBucketForFrame(frame)
  }
  getMinFrameWidth() {
    return this.minFrameWidth
  }
  formatValue(v: number) {
    return this.source.formatValue(v)
  }

  constructor(private source: FlamechartDataSource) {
    const stack: FlamechartFrame[] = []
    const openFrame = (node: CallTreeNode, value: number) => {
      const parent = lastOf(stack)
      const frame: FlamechartFrame = {
        node,
        parent,
        children: [],
        start: value,
        end: value,
      }
      if (parent) {
        parent.children.push(frame)
      }
      stack.push(frame)
    }

    this.minFrameWidth = Infinity
    const closeFrame = (value: number) => {
      console.assert(stack.length > 0)
      const stackTop = stack.pop()!
      stackTop.end = value
      if (stackTop.end - stackTop.start === 0) return
      const layerIndex = stack.length
      while (this.layers.length <= layerIndex) this.layers.push([])
      this.layers[layerIndex].push(stackTop)
      this.minFrameWidth = Math.min(this.minFrameWidth, stackTop.end - stackTop.start)
    }

    this.totalWeight = source.getTotalWeight()
    source.forEachCall(openFrame, closeFrame)

    if (!isFinite(this.minFrameWidth)) this.minFrameWidth = 1
  }
}
