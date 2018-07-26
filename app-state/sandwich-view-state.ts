import {Flamechart} from '../flamechart'
import {CanvasContext} from '../canvas-context'
import {FlamechartRenderer, FlamechartRowAtlasKey} from '../flamechart-renderer'
import {SortMethod} from '../profile-table-view'
import {RowAtlas} from '../row-atlas'
import {Frame, Profile, CallTreeNode} from '../profile'
import {Rect} from '../math'

export interface FlamechartWrapperProps {
  flamechart: Flamechart
  canvasContext: CanvasContext
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
}

export interface FlamechartWrapperState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
  configSpaceViewportRect: Rect
}

export interface SandwichViewProps {
  profile: Profile
  flattenRecursion: boolean

  // TODO(jlfwong): It's kind of awkward requiring both of these
  getColorBucketForFrame: (frame: Frame) => number
  getCSSColorForFrame: (frame: Frame) => string

  sortMethod: SortMethod
  setSortMethod: (sortMethod: SortMethod) => void
  canvasContext: CanvasContext
  rowAtlas: RowAtlas<FlamechartRowAtlasKey>
}

export interface CallerCalleeState {
  selectedFrame: Frame

  invertedCallerFlamegraph: Flamechart
  invertedCallerFlamegraphRenderer: FlamechartRenderer

  calleeFlamegraph: Flamechart
  calleeFlamegraphRenderer: FlamechartRenderer
}

export interface SandwichViewState {
  callerCallee: CallerCalleeState | null
}
