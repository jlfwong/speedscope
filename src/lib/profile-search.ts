import {Profile, Frame, CallTreeNode} from './profile'
import {FuzzyMatch, fuzzyMatchStrings} from './fuzzy-find'
import {Flamechart, FlamechartFrame} from './flamechart'
import {Rect, Vec2} from './math'

export enum FlamechartType {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
}

// TODO(jlfwong): Rather than operating on profiles using forEachCall &
// forEachCallGrouped, I think what I really want to do is operate on Flamechart
// objects instead. This will make it easier to set the config space viewport
// bounds in order to zoom to fit the object on screen.

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
}

interface FlamechartSearchMatch {
  configSpaceBounds: Rect
  node: CallTreeNode
}

interface CachedFlamechartResult {
  matches: FlamechartSearchMatch[]
  indexForNode: Map<CallTreeNode, number>
}

export class FlamechartSearchResults {
  constructor(readonly flamechart: Flamechart, readonly profileResults: ProfileSearchResults) {}

  private matches: CachedFlamechartResult | null = null
  private getResults(): CachedFlamechartResult {
    if (this.matches == null) {
      const matches: FlamechartSearchMatch[] = []
      const indexForNode = new Map<CallTreeNode, number>()
      const visit = (frame: FlamechartFrame, depth: number) => {
        const {node} = frame
        if (this.profileResults.getMatchForFrame(node.frame)) {
          const configSpaceBounds = new Rect(
            new Vec2(frame.start, depth),
            new Vec2(frame.end - frame.start, 1),
          )
          indexForNode.set(node, matches.length)
          matches.push({configSpaceBounds, node})
        }

        frame.children.forEach(child => {
          visit(child, depth + 1)
        })
      }

      const layers = this.flamechart.getLayers()
      if (layers.length > 0) {
        layers[0].forEach(frame => visit(frame, 1))
      }

      this.matches = {matches, indexForNode}
    }
    return this.matches
  }

  count(): number {
    return this.getResults().matches.length
  }

  indexOf(node: CallTreeNode): number | null {
    const result = this.getResults().indexForNode.get(node)
    return result === undefined ? null : result
  }

  at(index: number): FlamechartSearchMatch {
    const matches = this.getResults().matches
    if (index < 0 || index >= matches.length) {
      throw new Error(`Index ${index} out of bounds in list of ${matches.length} matches.`)
    }
    return matches[index]
  }
}
