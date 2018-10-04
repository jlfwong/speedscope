import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {getOrInsert} from '../lib/utils'
import {ByteFormatter} from '../lib/value-formatters'

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
    const name = callFrame.functionName || '(anonymous)'
    const file = callFrame.url
    const line = callFrame.lineNumber
    const col = callFrame.columnNumber
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

  // compute the total size
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

  // compute all stacks by taking each last node and going upward
  const stacks: HeapProfileNode[][] = Array.from(nodeById.values()).map(currentNode => {
    let stack: HeapProfileNode[] = []
    stack.push(currentNode)
    // while we found a parent
    while (true) {
      if (typeof currentNode.parent !== 'number') break
      const parent = nodeById.get(currentNode.parent)
      if (parent === undefined) break
      // push the parent at the begining of the stack
      stack.unshift(parent)
      currentNode = parent
    }
    return stack
  })

  const profile = new StackListProfileBuilder(total)

  for (let i = 0; i < stacks.length; i++) {
    const stack = stacks[i]
    const lastFrame = stack[stack.length - 1]
    profile.appendSampleWithWeight(
      stack.map(frame => frameInfoForCallFrame(frame.callFrame)),
      lastFrame.selfSize,
    )
  }
  profile.setValueFormatter(new ByteFormatter())
  return profile.build()
}
