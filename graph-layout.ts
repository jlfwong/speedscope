import {getOrInsert, getOrElse, itForEach, sortBy} from './utils'
import {Rect, Vec2} from './math'

// Generic Directed Graph
export interface Edge<V> {
  from: V
  to: V
}
export class Graph<V, E extends Edge<V>> {
  private vertices = new Set<V>()
  private edges = new Set<E>()

  private edgesEnteringVertex = new Map<V, Set<E>>()
  private edgesLeavingVertex = new Map<V, Set<E>>()

  addVertex(v: V) {
    this.vertices.add(v)
  }
  addEdge(e: E) {
    this.addVertex(e.from)
    this.addVertex(e.to)
    this.edges.add(e)
    const inEdges = getOrInsert(this.edgesEnteringVertex, e.to, () => new Set())
    inEdges.add(e)
    const outEdges = getOrInsert(this.edgesLeavingVertex, e.from, () => new Set())
    outEdges.add(e)
  }

  getEdges(): Set<E> {
    return this.edges
  }
  getVertices(): Set<V> {
    return this.vertices
  }
  hasVertex(v: V) {
    return this.vertices.has(v)
  }
  getEdgesLeaving(v: V): Set<E> {
    return this.edgesLeavingVertex.get(v) || new Set()
  }
  getEdgesEntering(v: V): Set<E> {
    return this.edgesEnteringVertex.get(v) || new Set()
  }
}

// Determine the "rank" of each vertex. The rank of a vertex will determine
// which row in the laid out graph the vertex is placed in.
export function rankVertices<V, E extends Edge<V>>(graph: Graph<V, E>, roots: V[]): Map<V, number> {
  const ranks = new Map<V, number>()

  // TODO(jlfwong): Change this to rank by *longest* path from root
  // rather than shortest
  function setRank(v: V, rank: number) {
    if (ranks.has(v)) {
      return
    }
    ranks.set(v, rank)

    for (let leavingEdge of graph.getEdgesLeaving(v)) {
      setRank(leavingEdge.to, rank + 1)
    }
  }

  for (let root of roots) {
    setRank(root, 0)
  }

  for (let node of graph.getVertices()) {
    setRank(node, 0)
  }

  return ranks
}

interface LevelNode<V> {
  parents: LevelNode<V>[]
  children: LevelNode<V>[]
  vertex: V | null
  index: number
}
function reindexLevel<V>(level: LevelNode<V>[]) {
  for (let i = 0; i < level.length; i++) {
    level[i].index = i
  }
}

interface LevelResult<V, E> {
  levels: LevelNode<V>[][]
  edgeToLevelNodes: Map<E, LevelNode<V>[]>
}
// Given the ranks of the vertices & the edges in the graph, fill
// rows with vertices & "virtual nodes" to allow space for edges
// which traverse multiple rows. It's also in this step in which
// we'll order the nodes in each row in order to minimize edge crossings
// between levels.
function ranksToLevels<V, E extends Edge<V>>(
  ranks: Map<V, number>,
  edges: Set<E>,
): LevelResult<V, E> {
  const levels: LevelNode<V>[][] = []

  const rankToLevel = new Map<number, LevelNode<V>[]>()

  const vertexToLevelNode = new Map<V, LevelNode<V>>()
  const edgeToLevelNodes = new Map<E, LevelNode<V>[]>()

  let minRank = 0
  let maxRank = 0

  const makeEmpty = () => []
  for (let [vertex, rank] of ranks) {
    minRank = Math.min(minRank, rank)
    maxRank = Math.max(maxRank, rank)
    const levelNode = {parents: [], children: [], vertex, index: 0}
    vertexToLevelNode.set(vertex, levelNode)
    const levelNodeList = getOrInsert(rankToLevel, rank, makeEmpty)
    levelNodeList.push(levelNode)
  }

  function handleEdge(from: V, to: V): LevelNode<V>[] {
    if (from === to) {
      const node = vertexToLevelNode.get(from)
      if (!node) throw new Error('Missing level node or self cycle')
      return [node]
    }

    const fromRank = ranks.get(from)
    const toRank = ranks.get(to)

    if (fromRank == null || toRank == null) {
      throw new Error('Vertex with no rank')
    }

    if (toRank === fromRank) {
      // throw new Error(`Found sideways edge: ${from} -> ${to}`)
      // TODO(jlfwong): Debug this
    } else if (toRank < fromRank) {
      // Back edge
      const nodes = handleEdge(to, from)
      nodes.reverse()
      return nodes
    }

    const fromLevelNode = vertexToLevelNode.get(from)
    const toLevelNode = vertexToLevelNode.get(to)

    if (!fromLevelNode || !toLevelNode) {
      throw new Error('Missing level node')
    }

    const levelNodesForEdge = [fromLevelNode]
    let parent = fromLevelNode

    // Insert virtual nodes on every level between the levels of the source
    // and destination of the edge to ensure that there's space for the edge
    // to travel through without intersecting a visible node.
    for (let rank = fromRank + 1; rank < toRank; rank++) {
      const levelNodeList = getOrInsert(rankToLevel, rank, makeEmpty)
      const levelNode = {parents: [parent], children: [], vertex: null, index: 0}
      parent.children.push(levelNode)
      parent = levelNode
      levelNodeList.push(levelNode)
      levelNodesForEdge.push(levelNode)
    }
    toLevelNode.parents.push(parent)
    parent.children.push(toLevelNode)
    levelNodesForEdge.push(toLevelNode)
    return levelNodesForEdge
  }

  itForEach(edges, e => {
    edgeToLevelNodes.set(e, handleEdge(e.from, e.to))
  })

  for (let rank = minRank; rank <= maxRank; rank++) {
    const level = getOrElse(rankToLevel, rank, makeEmpty)
    reindexLevel(level)
    levels.push(level)
  }

  // Sort to minimize crossings.
  // In each pass, we do two sorts: one by mean parent index,
  // and one by mean child index. These two sorts may yield conflicting results,
  // so we'll iteratively refine the ordering, hoping they'll converge.
  function levelNodeParentWeight(n: LevelNode<V>) {
    return (
      n.parents.reduce((accum: number, p: LevelNode<V>) => accum + p.index, 0) / n.parents.length
    )
  }
  function levelNodeChildWeight(n: LevelNode<V>) {
    return (
      n.children.reduce((accum: number, p: LevelNode<V>) => accum + p.index, 0) / n.children.length
    )
  }
  for (let pass = 0; pass < 4; pass++) {
    // Moving from top to bottom, sort each level by the mean parent index.
    for (let i = 0; i < levels.length; i++) {
      sortBy(levels[i], levelNodeParentWeight)
      reindexLevel(levels[i])
    }
    // Moving from bottom to top, sort each level by the mean child index.
    for (let i = levels.length - 1; i >= 0; i--) {
      sortBy(levels[i], levelNodeChildWeight)
      reindexLevel(levels[i])
    }
  }

  return {edgeToLevelNodes, levels}
}

// Assign rectangular bounding boxes
function positionNodes<V>(levels: LevelNode<V>[][]): Map<LevelNode<V>, Rect> {
  const positions = new Map<LevelNode<V>, Rect>()

  const width = 200
  const height = 20
  const verticalSpacing = 30
  const horizontalSpacing = 50

  const maxCount = levels.reduce((max, cur) => Math.max(max, cur.length), 0)
  const totalWidth = maxCount * width + (maxCount - 1) * horizontalSpacing

  let y = 0
  for (let level of levels) {
    // Determine the width of the entire level to help
    // center the entire level
    let levelWidth = 0
    for (let node of level) {
      if (levelWidth > 0) levelWidth += horizontalSpacing
      if (node.vertex) {
        levelWidth += width
      } else {
        levelWidth += horizontalSpacing
      }
    }

    let x = totalWidth / 2 - levelWidth / 2
    for (let node of level) {
      if (!node.vertex) {
        positions.set(
          node,
          new Rect(new Vec2(x + horizontalSpacing / 2, y + height / 2), new Vec2(0, 0)),
        )
        x += horizontalSpacing
      } else {
        positions.set(node, new Rect(new Vec2(x, y), new Vec2(width, height)))
        x += width
      }
      x += horizontalSpacing
    }
    y += height + verticalSpacing
  }
  return positions
}

function makeEdgePaths<V, E extends Edge<V>>(
  edgeToLevelNodes: Map<E, LevelNode<V>[]>,
  positions: Map<LevelNode<V>, Rect>,
): Map<E, string> {
  const edgePaths = new Map<E, string>()

  for (let [edge, nodeList] of edgeToLevelNodes) {
    let from = nodeList[0]
    let path = ''

    const fromRect = positions.get(from)
    if (!fromRect) throw Error(`Failed to find position for endpoint ${from}`)
    let fromAnchor = new Vec2(fromRect.left() + fromRect.width() / 2, fromRect.top())
    fromAnchor = fromAnchor.plus(new Vec2(0, fromRect.height()))
    path += `M ${fromAnchor.x} ${fromAnchor.y} `

    for (let i = 1; i < nodeList.length; i++) {
      const to = nodeList[i]
      const fromRect = positions.get(from)
      const toRect = positions.get(to)
      if (!fromRect) throw Error(`Failed to find position for endpoint ${from}`)
      if (!toRect) throw Error(`Failed to find position for endpoint ${to}`)

      let fromAnchor = new Vec2(fromRect.left() + fromRect.width() / 2, fromRect.top())
      let toAnchor = new Vec2(toRect.left() + toRect.width() / 2, toRect.top())

      if (fromRect.top() < toRect.top()) {
        fromAnchor = fromAnchor.plus(new Vec2(0, fromRect.height()))
      } else {
        toAnchor = toAnchor.plus(new Vec2(0, toRect.height()))
      }

      const midpoint = fromAnchor.plus(toAnchor).times(1 / 2)

      // TODO(jlfwong): Figure out proper curvature
      // path += `S ${midpoint.x} ${midpoint.y} `
      path += `L ${toAnchor.x} ${toAnchor.y} `

      from = to
    }
    edgePaths.set(edge, path)
  }

  return edgePaths
}

// This is an implementation of a direct graph layout algorithm
// described in "A Technique for Drawing Directed Graphs":
// http://www.graphviz.org/Documentation/TSE93.pdf
export interface LaidOutGraph<V, E extends Edge<V>> {
  // The top-to-bottom ordered list of levels, where each level corresponds to a
  // row in the laid-out graph. Each level is an ordered list of the left-to-right
  // nodes which may be visible or virtual nodes.
  levels: LevelNode<V>[][]

  // Mapping from each edge to an ordered list of nodes indicating the bounding
  // boxes the edge must traverse when the edge is drawn. The first and last node
  // in each list will always be visible nodes. The intermediate nodes will be
  // zero or more "virtual nodes" which exist solely for layout.
  edgeToLevelNodes: Map<E, LevelNode<V>[]>

  // Mapping from each node to its bounding box
  nodePositions: Map<LevelNode<V>, Rect>

  // Mapping from each edge to a string representing its cubic bezier-curve based
  // SVG path.
  edgePaths: Map<E, string>

  // Mapping from each vertex to its "rank"
  ranks: Map<V, number>
}
export function layoutGraph<V, E extends Edge<V>>(
  graph: Graph<V, E>,
  roots: V[],
): LaidOutGraph<V, E> {
  const ranks = rankVertices(graph, roots)
  const {levels, edgeToLevelNodes} = ranksToLevels(ranks, graph.getEdges())
  const nodePositions = positionNodes(levels)
  const edgePaths = makeEdgePaths(edgeToLevelNodes, nodePositions)

  return {ranks, levels, edgeToLevelNodes, nodePositions, edgePaths}
}
