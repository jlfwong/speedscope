import {Atom} from '../lib/atom'
import {ViewMode} from '../lib/view-mode'
import {getHashParams, HashParams} from '../lib/hash-params'
import {ProfileGroupAtom} from './profile-group'
import {TimeFormatter} from '../lib/value-formatters'

export const defaultFormatter = new TimeFormatter('nanoseconds')

export const copiedUrlAtom = new Atom<string>('', 'copiedUrlAtom')

export const selectedFrameNameAtom = new Atom<string>('', 'selectedFrameName')

export const initSearchIndexAtom = new Atom<number>(-1, 'initSearchIndex')
export const selectedSearchIndexAtom = new Atom<number>(0, 'selectedSearchIndex')

// Atom to hold special frame -> colorIndex overrides mapping
export const frameColorOverridesAtom = new Atom<Record<string, number>>({
  total: 5,
  App: 1,
  GC: 12,
  Compiler: 16,
}, 'frameColorOverrides');

// True if recursion should be flattened when viewing flamegraphs
export const flattenRecursionAtom = new Atom<boolean>(false, 'flattenRecursion')

// True if diff mode should be used for flamegraph coloring (red/blue differential)
export const diffModeAtom = new Atom<boolean>(false, 'diffMode')

// Diff view modes for differential flamegraph
export enum DiffViewMode {
  // Flamegraph structure based on Baseline
  BAS = 'bas',
  // Flamegraph structure based on Regression
  REG = 'reg',
  // Both: BAS and REG flamegraphs displayed side by side
  BOTH = 'both',
}

// Current diff view mode
export const diffViewModeAtom = new Atom<DiffViewMode>(DiffViewMode.BOTH, 'diffViewMode')

// True if samples should be normalized between profiles in diff mode
// When enabled, scales weights so both profiles have the same total samples
export const diffNormalizedAtom = new Atom<boolean>(true, 'diffNormalized')

// Cache the original JSON data to allow reloading with inverted weights
export const cachedJsonDataAtom = new Atom<string>('', 'cachedJsonData')

// True if the dragable minimap should be displayed by default
export const displayMinimapAtom = new Atom<boolean>(false, 'displayMinimap')

// Allow speedscope subsriber do something when user right clicked a frame
export const moreInformationFrameAtom = new Atom<string>('', 'moreInformationFrame')

// True to display LHS table
export const displayTableAtom = new Atom<boolean>(true, 'displayTable')
export const scrollToAtom = new Atom<boolean>(false, 'scrollTo')
export const reverseFlamegraphAtom = new Atom<boolean>(false, 'reverse')

// The query used in top-level views
//
// An empty string indicates that the search is open by no filter is applied.
// searchIsActive is stored separately, because we may choose to persist the
// query even when the search input is closed.
export const searchIsActiveAtom = new Atom<boolean>(true, 'searchIsActive')
export const searchQueryAtom = new Atom<string>('', 'searchQueryAtom')

// Which top-level view should be displayed
export const viewModeAtom = new Atom<ViewMode>(ViewMode.LEFT_HEAVY_FLAME_GRAPH, 'viewMode')

// The top-level profile group from which most other data will be derived
export const profileGroupAtom = new ProfileGroupAtom(null, 'profileGroup')

viewModeAtom.subscribe(() => {
  // If we switch views, the hover information is no longer relevant
  profileGroupAtom.clearHoverNode()
})

// Parameters defined by the URL encoded k=v pairs after the # in the URL
const hashParams = getHashParams()
export const hashParamsAtom = new Atom<HashParams>(hashParams, 'hashParams')

// The <canvas> element used for WebGL
export const glCanvasAtom = new Atom<HTMLCanvasElement | null>(null, 'glCanvas')

// True when a file drag is currently active. Used to indicate that the
// application is a valid drop target.
export const dragActiveAtom = new Atom<boolean>(false, 'dragActive')

// True when the application is currently in a loading state. Used to
// display a loading progress bar.

// Speedscope is usable both from a local HTML file being served
// from a file:// URL, and via websites. In the case of file:// URLs,
// however, XHR will be unavailable to fetching files in adjacent directories.
const protocol = window.location.protocol
export const canUseXHR = protocol === 'http:' || protocol === 'https:'
const isImmediatelyLoading = canUseXHR && hashParams.profileURL != null
export const loadingAtom = new Atom<boolean>(isImmediatelyLoading, 'loading')

// True when the application is an error state, e.g. because the profile
// imported was invalid.
export const errorAtom = new Atom<boolean>(false, 'error')

export enum SortField {
  SYMBOL_NAME,
  SELF,
  TOTAL,
  COUNT,
  DIFF
}

export enum SortDirection {
  ASCENDING,
  DESCENDING,
}

export interface SortMethod {
  field: SortField
  direction: SortDirection
}

// The table sorting method using for the sandwich view, specifying the column
// to sort by, and the direction to sort that clumn.
export const tableSortMethodAtom = new Atom<SortMethod>(
        {
          field: SortField.TOTAL,
          direction: SortDirection.DESCENDING,
        },
        'tableSortMethod',
)

// True if name column should be right-aligned (tail first) instead of left-aligned (head first)
export const nameAlignRightAtom = new Atom<boolean>(false, 'nameAlignRight')

export function disposeProfileAtom() {
  profileGroupAtom.clearHoverNode();
  profileGroupAtom.set(null);
}
