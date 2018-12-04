import {CPUProfile, CPUProfileNode} from './chrome'

/**
 * This importer handles an old format used by the C++ API of V8. This format is still used by v8-profiler-node8.
 * There are two differences between the two formats:
 *  - Nodes are a tree in the old format and a flat array in the new format
 *  - Weights are timestamps in the old format and deltas in the new format.
 *
 * For more information, see https://github.com/hyj1991/v8-profiler-node8
 */

interface OldCPUProfileNode {
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

function treeToArray(root: OldCPUProfileNode): CPUProfileNode[] {
  const nodes: CPUProfileNode[] = []
  function visit(node: OldCPUProfileNode) {
    nodes.push({
      id: node.id,
      callFrame: {
        columnNumber: 0,
        functionName: node.functionName,
        lineNumber: node.lineNumber,
        scriptId: node.scriptId,
        url: node.url,
      },
      hitCount: node.hitCount,
      children: node.children.map(child => child.id),
    })
    node.children.forEach(visit)
  }
  visit(root)
  return nodes
}

function timestampsToDeltas(timestamps: number[], startTime: number): number[] {
  return timestamps.map((timestamp, index) => {
    const lastTimestamp = index === 0 ? startTime * 1000000 : timestamps[index - 1]
    return timestamp - lastTimestamp
  })
}

/**
 * Convert the old tree-based format to the new flat-array based format
 */
export function chromeTreeToNodes(content: OldCPUProfile): CPUProfile {
  // Note that both startTime and endTime are now in microseconds
  return {
    samples: content.samples,
    startTime: content.startTime * 1000000,
    endTime: content.endTime * 1000000,
    nodes: treeToArray(content.head),
    timeDeltas: timestampsToDeltas(content.timestamps, content.startTime),
  }
}
