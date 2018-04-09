import {Graph, Edge, LaidOutGraph, layoutGraph} from './graph-layout'
import {Frame, CallTreeNode} from './profile'
import {getOrInsert, lastOf} from './utils'

interface CallGraphVertex {
  frame: Frame
}
interface CallGraphEdge extends Edge<CallGraphVertex> {}
export interface LaidOutCallGraph extends LaidOutGraph<CallGraphVertex, CallGraphEdge> {}

interface CallGraphDataSource {
  getTotalWeight(): number

  formatValue(v: number): string

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (value: number) => void,
  ): void

  getColorBucketForFrame(f: Frame): number
}

// This class acts as the interface between the Profile objects and the graph
// layout code.
export class CallGraph extends Graph<CallGraphVertex, CallGraphEdge> {
  private frameToVertex = new Map<Frame, CallGraphVertex>()
  private roots: CallGraphVertex[] = []

  constructor(private source: CallGraphDataSource) {
    super()

    const totalWeight = source.getTotalWeight()

    console.log('totalWeight', totalWeight)

    const stack: CallGraphVertex[] = []

    // When displaying the call graph, we don't really want to display all nodes.
    // We only want to display the ones that contribute significantly to the total
    // weight of the graph, so we set a threshold.
    const threshold = 0.05
    let ignoredDepth = 0

    const openFrame = (node: CallTreeNode, value: number) => {
      if (node.frame.getTotalWeight() / totalWeight < threshold || ignoredDepth > 0) {
        ignoredDepth++
        return
      }

      const vertex = getOrInsert(this.frameToVertex, node.frame, () => {
        return {frame: node.frame}
      })
      this.addVertex(vertex)
      const caller = lastOf(stack)
      if (caller) {
        this.addEdge({from: caller, to: vertex})
      }
      if (stack.length === 0) {
        this.roots.push(vertex)
      }
      stack.push(vertex)
    }

    function closeFrame(value: number) {
      if (ignoredDepth > 0) {
        ignoredDepth--
      } else {
        stack.pop()
      }
    }

    source.forEachCall(openFrame, closeFrame)
  }

  layout(): LaidOutCallGraph {
    return layoutGraph(this, this.roots)
  }
}
