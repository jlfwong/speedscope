
import {CPUProfile, CPUProfileNode} from './chrome'

export interface OldCPUProfileNode {
  functionName: string
  lineNumber: number
  scriptId: string
  url: string
  hitCount: number
  bailoutReason: string
  id: number
  children: OldCPUProfileNode[]
}

export interface OldCPUProfile {
  startTime: number
  endTime: number
  head: OldCPUProfileNode
  samples: number[]
  timestamps: number[]
}

function treeToArray(node: OldCPUProfileNode, nodes: CPUProfileNode[]) {
  nodes.push({
    id: node.id,
    callFrame: {
      columnNumber: 0,
      functionName: node.functionName,
      lineNumber: node.lineNumber,
      scriptId: node.scriptId,
      url: node.url
    },
    hitCount: node.hitCount,
    children: node.children.map(child => child.id)
  })
  node.children.forEach(child => {
    return treeToArray(child, nodes)
  })
  return nodes
}

function timestampsToDelta(timestamps: number[], startTime: number): number[] {
  return timestamps.reduce((deltas: number[], timestamp: number, index: number) => {
    let lastTimestamp = index === 0 ? startTime * 1000000 : timestamps[index - 1]
    deltas.push(timestamp - lastTimestamp)
    return deltas
  }, [])
}

/**
 * Convert the tree based format to the array of nodes like actually
 */
export function chromeTree2nodes(content: OldCPUProfile): CPUProfile {
  // Care that both startTime and endTime are now in microsecond
  return {
    samples: content.samples,
    startTime: content.startTime * 1000000,
    endTime: content.endTime * 1000000,
    nodes: treeToArray(content.head, []),
    timeDeltas: timestampsToDelta(content.timestamps, content.startTime)
  }
}
