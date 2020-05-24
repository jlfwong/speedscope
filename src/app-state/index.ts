import {atom, RecoilState} from 'recoil'
import {HashParams, getHashParams} from 'src/lib/hash-params'
import {ViewMode} from 'src/store'

// TODO(jlfwong): Move these into this file rather than having them depend upon the view
import {SortField, SortDirection, SortMethod} from 'src/views/profile-table-view'
import {CallTreeNode} from 'src/lib/profile'
import {Vec2, Rect} from 'src/lib/math'

export const hashParams = atom<HashParams>({
  key: 'hashParams',
  default: getHashParams(),
})

export const flattenRecursion = atom<boolean>({
  key: 'flattenRecursion',
  default: false,
})

export const viewMode = atom<ViewMode>({
  key: 'viewMode',
  default: ViewMode.CHRONO_FLAME_CHART,
})

export const glCanvas = atom<HTMLCanvasElement | null>({
  key: 'glCanvas',
  default: null,
})

export const dragActive = atom<boolean>({
  key: 'dragActive',
  default: false,
})

export const loading = atom<boolean>({
  key: 'loading',
  default: false,
})

export const error = atom<boolean>({
  key: 'error',
  default: false,
})

export const tableSortMethod = atom<SortMethod>({
  key: 'tableSortMethod',
  default: {
    field: SortField.SELF,
    direction: SortDirection.DESCENDING,
  },
})

/////////

// TODO(jlfwong): I got kind of stuck here trying to figure out how to structure
// data for compound types in a way that doesn't create all the same boilerplate
// problems that redux has here.

export interface FlamechartViewState {
  hover: RecoilState<{
    node: CallTreeNode
    event: MouseEvent
  }> | null
  selectedNode: RecoilState<CallTreeNode | null>
  logicalSpaceViewportSize: RecoilState<Vec2>
  configSpaceViewportRect: RecoilState<Rect>
}
