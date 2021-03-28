import {Atom} from '../lib/atom'
import {getHashParams, HashParams} from '../lib/hash-params'
import {FlamechartID, ProfileGroupAtom} from './profile-group-atom'

// True if recursion should be flattened when viewing flamegraphs
export const flattenRecursionAtom = new Atom<boolean>(false)

// The query used in top-level views
//
// An empty string indicates that the search is open by no filter is applied.
// searchIsActive is stored separately, because we may choose to persist the
// query even when the search input is closed.
export const searchIsActiveAtom = new Atom<boolean>(false)
export const searchQueryAtom = new Atom<string>('')

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

class ViewModeAtom extends Atom<ViewMode> {
  set = (value: ViewMode) => {
    super.set(value)

    // TODO(jlfwong): Move this into a method in ProfileGroupAtom
    //
    // If we switch views, the hover information is no longer relevant
    profileGroupAtom.setFlamechartHoveredNode(FlamechartID.CHRONO, null)
    profileGroupAtom.setFlamechartHoveredNode(FlamechartID.LEFT_HEAVY, null)
    profileGroupAtom.setFlamechartHoveredNode(FlamechartID.SANDWICH_CALLEES, null)
    profileGroupAtom.setFlamechartHoveredNode(FlamechartID.SANDWICH_INVERTED_CALLERS, null)
  }
}

// Which top-level view should be displayed
export const viewModeAtom = new ViewModeAtom(ViewMode.CHRONO_FLAME_CHART)

// The top-level profile group from which most other data will be derived
export const profileGroupAtom = new ProfileGroupAtom(null)

// Parameters defined by the URL encoded k=v pairs after the # in the URL
const hashParams = getHashParams()
export const hashParamsAtom = new Atom<HashParams>(hashParams)

// The <canvas> element used for WebGL
export const glCanvasAtom = new Atom<HTMLCanvasElement | null>(null)

// True when a file drag is currently active. Used to indicate that the
// application is a valid drop target.
export const dragActiveAtom = new Atom<boolean>(false)

// True when the application is currently in a loading state. Used to
// display a loading progress bar.

// Speedscope is usable both from a local HTML file being served
// from a file:// URL, and via websites. In the case of file:// URLs,
// however, XHR will be unavailable to fetching files in adjacent directories.
const protocol = window.location.protocol
export const canUseXHR = protocol === 'http:' || protocol === 'https:'
const isImmediatelyLoading = canUseXHR && hashParams.profileURL != null
export const loadingAtom = new Atom<boolean>(isImmediatelyLoading)

// True when the application is an error state, e.g. because the profile
// imported was invalid.
export const errorAtom = new Atom<boolean>(false)

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
export const tableSortMethodAtom = new Atom<SortMethod>({
  field: SortField.SELF,
  direction: SortDirection.DESCENDING,
})
