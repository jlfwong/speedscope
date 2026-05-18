import {CallTreeNode, Frame, Profile} from './profile'
import {formatPercent} from './utils'

interface ProfileInfo {
  name: string
  profile: Profile
}

interface TreeSummaryOptions {
  node: CallTreeNode
  totalWeight: number
  formatValue: (v: number) => string
}

interface TreeLine {
  indent: string
  name: string
  file?: string
  line?: number
  col?: number
  totalWeight: number
  selfWeight: number
  totalPercent: number
  selfPercent: number
}

// Minimum threshold as a fraction (1%)
const MIN_WEIGHT_THRESHOLD = 0.01

function buildTreeLines(
  node: CallTreeNode,
  totalWeight: number,
  minWeight: number,
  lines: TreeLine[],
  prefix: string,
  isLast: boolean,
  isRoot: boolean,
): void {
  const {frame} = node

  // Skip the speedscope root node
  if (node.isRoot()) {
    // Process children of root directly
    const children = [...node.children]
      .filter(child => child.getTotalWeight() >= minWeight)
      .sort((a, b) => b.getTotalWeight() - a.getTotalWeight())
    children.forEach((child, index) => {
      buildTreeLines(child, totalWeight, minWeight, lines, '', index === children.length - 1, true)
    })
    return
  }

  const connector = isRoot ? '' : isLast ? '└─ ' : '├─ '
  const indent = prefix + connector

  lines.push({
    indent,
    name: frame.name,
    file: frame.file,
    line: frame.line,
    col: frame.col,
    totalWeight: node.getTotalWeight(),
    selfWeight: node.getSelfWeight(),
    totalPercent: (node.getTotalWeight() / totalWeight) * 100,
    selfPercent: (node.getSelfWeight() / totalWeight) * 100,
  })

  // Sort children by total weight descending, filtering out those below threshold
  const children = [...node.children]
    .filter(child => child.getTotalWeight() >= minWeight)
    .sort((a, b) => b.getTotalWeight() - a.getTotalWeight())
  const childPrefix = prefix + (isRoot ? '' : isLast ? '   ' : '│  ')

  children.forEach((child, index) => {
    buildTreeLines(
      child,
      totalWeight,
      minWeight,
      lines,
      childPrefix,
      index === children.length - 1,
      false,
    )
  })
}

interface BottomsUpEntry {
  frame: Frame
  totalWeight: number
  selfWeight: number
  totalPercent: number
  selfPercent: number
}

/**
 * Builds the bottoms-up view: a flat list of unique frames in the subtree.
 * Walks the entire subtree rooted at the given node, aggregating weights per frame.
 * This is similar to how the sandwich view table works.
 * Only includes frames whose self weight exceeds minSelfWeight.
 * Sorted by self weight descending.
 */
function buildBottomsUpEntries(
  node: CallTreeNode,
  totalWeight: number,
  minSelfWeight: number,
): BottomsUpEntry[] {
  // Map from frame to aggregated weights within this subtree
  const frameWeights = new Map<Frame, {totalWeight: number; selfWeight: number}>()

  // Walk the subtree and aggregate weights per frame
  function walkSubtree(n: CallTreeNode): void {
    if (n.isRoot()) {
      // Process children of root
      for (const child of n.children) {
        walkSubtree(child)
      }
      return
    }

    const frame = n.frame
    const existing = frameWeights.get(frame)
    if (existing) {
      existing.totalWeight += n.getTotalWeight()
      existing.selfWeight += n.getSelfWeight()
    } else {
      frameWeights.set(frame, {
        totalWeight: n.getTotalWeight(),
        selfWeight: n.getSelfWeight(),
      })
    }

    // Process children
    for (const child of n.children) {
      walkSubtree(child)
    }
  }

  walkSubtree(node)

  // Convert to entries, filter by self weight, and sort by self weight
  const entries: BottomsUpEntry[] = []
  for (const [frame, weights] of frameWeights) {
    if (weights.selfWeight >= minSelfWeight) {
      entries.push({
        frame,
        totalWeight: weights.totalWeight,
        selfWeight: weights.selfWeight,
        totalPercent: (weights.totalWeight / totalWeight) * 100,
        selfPercent: (weights.selfWeight / totalWeight) * 100,
      })
    }
  }

  // Sort by self weight descending
  entries.sort((a, b) => b.selfWeight - a.selfWeight)

  return entries
}

/**
 * Formats a tree line for output.
 */
function formatTreeLine(line: TreeLine, formatValue: (v: number) => string): string[] {
  const stats = `[${formatValue(line.totalWeight)} (${formatPercent(
    line.totalPercent,
  )}), self: ${formatValue(line.selfWeight)} (${formatPercent(line.selfPercent)})]`

  let name = line.name
  if (line.file) {
    let location = line.file
    if (line.line != null) {
      location += `:${line.line}`
      if (line.col != null) {
        location += `:${line.col}`
      }
    }
    name += ` (${location})`
  }

  return [
    `${line.indent}${name}`,
    `${line.indent}${' '.repeat(Math.max(0, name.length - stats.length))}${stats}`,
  ]
}

/**
 * Generates an ASCII tree summary of a call tree node and its descendants.
 * This is useful for providing performance context to an LLM for analysis.
 *
 * Includes two views:
 * - Call Tree: Shows the tree structure of callees, filtered to nodes >= 1% of the selection's weight
 * - Bottoms Up: Shows all unique frames in the subtree aggregated by function, filtered/sorted by self weight
 */
export function generateTreeSummary(options: TreeSummaryOptions): string {
  const {node, totalWeight, formatValue} = options

  // Build the output
  const output: string[] = []

  // Header
  output.push('Performance Summary')
  output.push('='.repeat(60))
  output.push('')

  // Get the node's weight for thresholds
  const nodeWeight = node.isRoot() ? totalWeight : node.getTotalWeight()

  // Root node info
  if (!node.isRoot()) {
    output.push(`Selected: ${node.frame.name}`)
    if (node.frame.file) {
      let location = node.frame.file
      if (node.frame.line != null) {
        location += `:${node.frame.line}`
        if (node.frame.col != null) {
          location += `:${node.frame.col}`
        }
      }
      output.push(`Location: ${location}`)
    }
    const totalPercent = (node.getTotalWeight() / totalWeight) * 100
    const selfPercent = (node.getSelfWeight() / totalWeight) * 100
    output.push(`Total: ${formatValue(node.getTotalWeight())} (${formatPercent(totalPercent)})`)
    output.push(`Self: ${formatValue(node.getSelfWeight())} (${formatPercent(selfPercent)})`)
    output.push('')
  }

  // Bottoms Up view (all unique frames in subtree, aggregated)
  // Filter to frames with self weight >= 1% of total profile weight
  const bottomsUpMinSelfWeight = totalWeight * MIN_WEIGHT_THRESHOLD
  const bottomsUpEntries = buildBottomsUpEntries(node, totalWeight, bottomsUpMinSelfWeight)

  if (bottomsUpEntries.length > 0) {
    output.push('Bottoms Up (by self time, >=1% of total):')
    output.push('-'.repeat(60))
    output.push('')

    for (const entry of bottomsUpEntries) {
      let name = entry.frame.name
      if (entry.frame.file) {
        let location = entry.frame.file
        if (entry.frame.line != null) {
          location += `:${entry.frame.line}`
          if (entry.frame.col != null) {
            location += `:${entry.frame.col}`
          }
        }
        name += ` (${location})`
      }
      const stats = `[self: ${formatValue(entry.selfWeight)} (${formatPercent(
        entry.selfPercent,
      )}), total: ${formatValue(entry.totalWeight)} (${formatPercent(entry.totalPercent)})]`
      output.push(`${name}`)
      output.push(`${stats}`)
      output.push('')
    }
  }

  // Call Tree view (children of this node)
  // Filter to nodes >= 1% of the copied node's weight
  const callTreeMinWeight = nodeWeight * MIN_WEIGHT_THRESHOLD
  const callTreeLines: TreeLine[] = []
  buildTreeLines(node, totalWeight, callTreeMinWeight, callTreeLines, '', true, true)

  if (callTreeLines.length > 0) {
    output.push('Call Tree (callees, >=1% of selection):')
    output.push('-'.repeat(60))
    output.push('')

    for (const line of callTreeLines) {
      output.push(...formatTreeLine(line, formatValue))
    }
    output.push('')
  }

  if (bottomsUpEntries.length === 0 && callTreeLines.length === 0) {
    return 'No data available'
  }

  output.push('-'.repeat(60))
  output.push(`Total weight of profile: ${formatValue(totalWeight)}`)

  return output.join('\n')
}

/**
 * Generates a combined summary of all profiles' left-heavy call graphs.
 * This is useful for sending performance context to an LLM for analysis.
 */
export function generateAllProfilesSummary(profiles: ProfileInfo[]): string {
  const output: string[] = []

  output.push('Performance Profile Summary')
  output.push('='.repeat(60))
  output.push('')
  output.push(`Total profiles: ${profiles.length}`)
  output.push('')

  for (let i = 0; i < profiles.length; i++) {
    const {name, profile} = profiles[i]
    const root = profile.getGroupedCalltreeRoot()
    const totalWeight = profile.getTotalNonIdleWeight()
    const formatValue = profile.formatValue.bind(profile)

    if (profiles.length > 1) {
      output.push('='.repeat(60))
      output.push(`Profile ${i + 1}/${profiles.length}: ${name}`)
      output.push(`Total: ${formatValue(totalWeight)}`)
      output.push('='.repeat(60))
      output.push('')
    }

    // Bottoms Up view
    const bottomsUpMinSelfWeight = totalWeight * MIN_WEIGHT_THRESHOLD
    const bottomsUpEntries = buildBottomsUpEntries(root, totalWeight, bottomsUpMinSelfWeight)

    if (bottomsUpEntries.length > 0) {
      output.push('Bottoms Up (by self time, >=1% of total):')
      output.push('-'.repeat(60))
      output.push('')

      for (const entry of bottomsUpEntries) {
        let entryName = entry.frame.name
        if (entry.frame.file) {
          let location = entry.frame.file
          if (entry.frame.line != null) {
            location += `:${entry.frame.line}`
            if (entry.frame.col != null) {
              location += `:${entry.frame.col}`
            }
          }
          entryName += ` (${location})`
        }
        const stats = `[self: ${formatValue(entry.selfWeight)} (${formatPercent(
          entry.selfPercent,
        )}), total: ${formatValue(entry.totalWeight)} (${formatPercent(entry.totalPercent)})]`
        output.push(`${entryName}`)
        output.push(`${stats}`)
        output.push('')
      }
    }

    // Call Tree view
    const callTreeMinWeight = totalWeight * MIN_WEIGHT_THRESHOLD
    const callTreeLines: TreeLine[] = []
    buildTreeLines(root, totalWeight, callTreeMinWeight, callTreeLines, '', true, true)

    if (callTreeLines.length > 0) {
      output.push('Call Tree (>=1% of total):')
      output.push('-'.repeat(60))
      output.push('')

      for (const line of callTreeLines) {
        output.push(...formatTreeLine(line, formatValue))
      }
      output.push('')
    }
  }

  return output.join('\n')
}

/**
 * Copies text to the clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}
