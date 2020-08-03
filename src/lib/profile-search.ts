import {Profile, Frame, CallTreeNode} from './profile'
import {FuzzyMatch, fuzzyMatchStrings} from './fuzzy-find'

export enum FlamechartType {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
}

// A utility class for storing cached search results to avoid recomputation when
// the search results & profile did not change.
export class ProfileSearchResults {
  constructor(readonly profile: Profile, readonly searchQuery: string) {}

  private matches: Map<Frame, FuzzyMatch> | null = null
  getMatchForFrame(frame: Frame): FuzzyMatch | null {
    if (!this.matches) {
      this.matches = new Map()
      this.profile.forEachFrame(frame => {
        const match = fuzzyMatchStrings(frame.name, this.searchQuery)
        if (match == null) return
        this.matches!.set(frame, match)
      })
    }
    return this.matches.get(frame) || null
  }

  private appendOrderNodeMatches: CallTreeNode[] | null = null
  private getAppendOrderNodeMatches(): CallTreeNode[] {
    if (this.appendOrderNodeMatches == null) {
      this.appendOrderNodeMatches = []
      const openFrame = (node: CallTreeNode) => {
        if (this.getMatchForFrame(node.frame)) {
          this.appendOrderNodeMatches!.push(node)
        }
      }
      const closeFrame = (frame: CallTreeNode) => {}
      this.profile.forEachCall(openFrame, closeFrame)
    }
    return this.appendOrderNodeMatches
  }

  private groupedNodeMatches: CallTreeNode[] | null = null
  private getGroupedNodesMatches(): CallTreeNode[] {
    if (this.groupedNodeMatches == null) {
      this.groupedNodeMatches = []
      const openFrame = (node: CallTreeNode) => {
        if (this.getMatchForFrame(node.frame)) {
          this.groupedNodeMatches!.push(node)
        }
      }
      const closeFrame = (frame: CallTreeNode) => {}
      this.profile.forEachCallGrouped(openFrame, closeFrame)
    }
    return this.groupedNodeMatches
  }

  private getNodeMatches(type: FlamechartType): CallTreeNode[] {
    switch (type) {
      case FlamechartType.CHRONO_FLAME_CHART: {
        return this.getAppendOrderNodeMatches()
      }
      case FlamechartType.LEFT_HEAVY_FLAME_GRAPH: {
        return this.getGroupedNodesMatches()
      }
    }
  }

  // Returns the number of call tree nodes matched in the given flamechart type.
  getMatchedCallTreeNodeCount(type: FlamechartType): number {
    return this.getNodeMatches(type).length
  }

  // Returns the index into the ordered call tree node list, or null if there's
  // no match.
  getIndexInSearchResults(type: FlamechartType, node: CallTreeNode): number | null {
    const index = this.getNodeMatches(type).indexOf(node)
    return index !== -1 ? index : null
  }

  getResultAtIndex(type: FlamechartType, index: number): CallTreeNode {
    const matches = this.getNodeMatches(type)
    if (index < 0 || index >= matches.length) {
      throw new Error(`Index ${index} out of bounds in list of ${matches.length} matches.`)
    }
    return matches[index]
  }
}
