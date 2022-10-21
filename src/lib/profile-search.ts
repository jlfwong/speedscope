import {Profile, Frame, CallTreeNode} from './profile'
import {Flamechart, FlamechartFrame} from './flamechart'
import {Rect, Vec2} from './math'

export enum FlamechartType {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
}

// In previous versions of speedscope, searching for strings within the profile
// was done using fuzzy finding. As it turns out, this was surprising behavior
// to most people, so we've switched to a more traditional substring search that
// more closely mimics browser behavior.
//
// This is case insensitive for both the needle & the haystack. This means
// searching for "hello" will match "Hello" and "HELLO", and searching for
// "HELLO" will match both "hello" and "Hello". This matches Chrome's behavior
// as far as I can tell.
//
// See https://github.com/jlfwong/speedscope/issues/352
//
// Return ranges for all matches in order to highlight them.
export function exactMatchStrings(text: string, pattern: string): [number, number][] {
  const lowerText = text.toLocaleLowerCase()
  const lowerPattern = pattern.toLocaleLowerCase()

  let lastIndex = 0
  const matchedRanges: Array<[number, number]> = []
  while (true) {
    let index = lowerText.indexOf(lowerPattern, lastIndex)
    if (index === -1) {
      return matchedRanges
    }
    matchedRanges.push([index, index + pattern.length])
    lastIndex = index + pattern.length
  }
}

// A utility class for storing cached search results to avoid recomputation when
// the search results & profile did not change.
export class ProfileSearchResults {
  constructor(readonly profile: Profile, readonly searchQuery: string) {}

  private matches: Map<Frame, [number, number][] | null> | null = null
  getMatchForFrame(frame: Frame): [number, number][] | null {
    if (!this.matches) {
      this.matches = new Map()
      this.profile.forEachFrame(frame => {
        const match = exactMatchStrings(frame.name, this.searchQuery)
        this.matches!.set(frame, match.length === 0 ? null : match)
      })
    }
    return this.matches.get(frame) || null
  }
}

export interface FlamechartSearchMatch {
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
        layers[0].forEach(frame => visit(frame, 0))
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
