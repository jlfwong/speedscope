import {Profile, Frame} from './profile'
import {FuzzyMatch, fuzzyMatchStrings} from './fuzzy-find'

// A utility class for storing cached search results to avoid recomputation when
// the search results & profile did not change.
export class ProfileSearchResults {
  private matches = new Map<Frame, FuzzyMatch>()

  constructor(readonly profile: Profile, readonly searchQuery: string) {
    profile.forEachFrame(frame => {
      const match = fuzzyMatchStrings(frame.name, searchQuery)
      if (match == null) return
      this.matches.set(frame, match)
    })
  }

  getMatchForFrame(frame: Frame): FuzzyMatch | null {
    return this.matches.get(frame) || null
  }
}
