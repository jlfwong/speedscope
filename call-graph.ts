import {Graph, Edge, LaidOutGraph, layoutGraph} from './graph-layout'
import {Frame, CallTreeNode, CallEdge} from './profile'
import {getOrInsert, lastOf, sortBy} from './utils'

export interface LaidOutCallGraph extends LaidOutGraph<Frame, CallEdge> {}

interface CallGraphDataSource {
  getTotalWeight(): number

  formatValue(v: number): string

  getRoots(): Frame[]
  forEachCallEdge(fn: (edge: CallEdge) => void): void

  getColorBucketForFrame(f: Frame): number
}

// This class acts as the interface between the Profile objects and the graph
// layout code.
export class CallGraph extends Graph<Frame, CallEdge> {
  private roots: Frame[] = []

  constructor(private source: CallGraphDataSource) {
    super()

    const totalWeight = source.getTotalWeight()
    const threshold = totalWeight * 0.01

    // TODO(jlfwong): Rather than selecting only heavy edges, select
    // the nodes with the highest self-time, then find paths from those
    // nodes to the root, and include the edges for those.
    this.source.forEachCallEdge(edge => {
      if (edge.getWeight() < threshold) return
      if (this.roots.length === 0) {
        this.roots.push(edge.from)
      }
      this.addEdge(edge)
    })
  }

  getTotalWeight() {
    return this.source.getTotalWeight()
  }

  formatValue(v: number) {
    return this.source.formatValue(v)
  }

  layout(): LaidOutCallGraph {
    return layoutGraph(
      this,
      this.source.getRoots().filter(f => {
        return this.hasVertex(f)
      }),
    )
  }
}
