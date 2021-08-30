import {Atom} from '../lib/atom'
import {ViewMode} from '../lib/view-mode'
import {getHashParams, HashParams} from '../lib/hash-params'
import {ProfileGroupAtom} from './profile-group'

// True if recursion should be flattened when viewing flamegraphs
export const flattenRecursionAtom = new Atom<boolean>(false, 'flattenRecursion')

// The query used in top-level views
//
// An empty string indicates that the search is open by no filter is applied.
// searchIsActive is stored separately, because we may choose to persist the
// query even when the search input is closed.
export const searchIsActiveAtom = new Atom<boolean>(false, 'searchIsActive')
export const searchQueryAtom = new Atom<string>('', 'searchQueryAtom')

// Which top-level view should be displayed
export const viewModeAtom = new Atom<ViewMode>(ViewMode.CHRONO_FLAME_CHART, 'viewMode')

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
    field: SortField.SELF,
    direction: SortDirection.DESCENDING,
  },
  'tableSortMethod',
)
