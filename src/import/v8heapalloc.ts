import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {getOrInsert} from '../lib/utils'
import {ByteFormatter} from '../lib/value-formatters'

/**
 * The V8 Heap Allocation profile is a way to represent heap allocation for each
 * javascript function. The format is a simple tree where the weight of each node
 * represent the memory allocated by the function and all its callee.
 * You can find more information on how to get a profile there :
 * https://developers.google.com/web/tools/chrome-devtools/memory-problems/#allocation-profile
 * You need to scroll down to "Investigate memory allocation by function"
 *
 * Note that Node.JS can retrieve this kind of profile via the Inspector protocol.
 */

interface HeapProfileCallFrame {
  columnNumber: number
  functionName: string
  lineNumber: number
  scriptId: string
  url: string
}

interface HeapProfileNode {
  callFrame: HeapProfileCallFrame
  selfSize: number
  children: HeapProfileNode[]
  id: number
  parent?: number
  totalSize: number
}

interface HeapProfile {
  head: HeapProfileNode
}

const callFrameToFrameInfo = new Map<HeapProfileCallFrame, FrameInfo>()
function frameInfoForCallFrame(callFrame: HeapProfileCallFrame) {
  return getOrInsert(callFrameToFrameInfo, callFrame, callFrame => {
    const file = callFrame.url
    const line = callFrame.lineNumber
    const col = callFrame.columnNumber
    const name =
      callFrame.functionName ||
      (file ? `(anonymous ${file.split('/').pop()}:${line})` : '(anonymous)')
    return {
      key: `${name}:${file}:${line}:${col}`,
      name,
      file,
      line,
      col,
    }
  })
}

export function importFromChromeHeapProfile(chromeProfile: HeapProfile): Profile {
  const nodeById = new Map<number, HeapProfileNode>()
  let currentId = 0
  const computeId = (node: HeapProfileNode, parent?: HeapProfileNode) => {
    node.id = currentId++
    nodeById.set(node.id, node)
    if (parent) {
      node.parent = parent.id
    }

    node.children.forEach(children => computeId(children, node))
  }
  computeId(chromeProfile.head)

  // Compute the total size
  const computeTotalSize = (node: HeapProfileNode): number => {
    if (node.children.length === 0) return node.selfSize || 0
    const totalChild = node.children.reduce((total: number, children) => {
      total += computeTotalSize(children)
      return total
    }, node.selfSize)
    node.totalSize = totalChild
    return totalChild
  }
  const total = computeTotalSize(chromeProfile.head)

  // Compute all stacks by taking each last node and going upward
  const stacks: HeapProfileNode[][] = []
  for (let currentNode of nodeById.values()) {
    let stack: HeapProfileNode[] = []
    stack.push(currentNode)
    // While we found a parent
    while (true) {
      if (currentNode.parent === undefined) break
      const parent = nodeById.get(currentNode.parent)
      if (parent === undefined) break
      // Push the parent at the beginning of the stack
      stack.unshift(parent)
      currentNode = parent
    }
    stacks.push(stack)
  }

  const profile = new StackListProfileBuilder(total)

  for (let stack of stacks) {
    const lastFrame = stack[stack.length - 1]
    profile.appendSampleWithWeight(
      stack.map(frame => frameInfoForCallFrame(frame.callFrame)),
      lastFrame.selfSize,
    )
  }

  profile.setValueFormatter(new ByteFormatter())
  return profile.build()
}
