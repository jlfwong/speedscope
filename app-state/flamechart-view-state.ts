import {Flamechart} from '../flamechart'
import {FlamechartRenderer} from '../flamechart-renderer'
import {Frame, Profile, CallTreeNode} from '../profile'
import {memoizeByShallowEquality} from '../utils'
import {rowAtlas} from '.'
import {Rect} from '../math'
import {CanvasContext} from '../canvas-context'
import {reducer, Dispatch} from '../typed-redux'
import {actions} from './actions'

export enum FlamechartID {
  LEFT_HEAVY,
  CHRONO,
  SANDWICH_CALLERS,
  SANDWICH_CALLEES,
}

export interface FlamechartViewState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
  selectedNode: CallTreeNode | null
  configSpaceViewportRect: Rect
}

export function createFlamechartViewStateReducer(id: FlamechartID) {
  let initialState: FlamechartViewState = {
    hover: null,
    selectedNode: null,
    configSpaceViewportRect: Rect.empty,
  }
  return reducer<FlamechartViewState>((state = initialState, action) => {
    if (actions.flamechart.setHoveredNode.matches(action) && action.payload.id === id) {
      return {...state, hover: action.payload.hover}
    }
    if (actions.flamechart.setSelectedNode.matches(action) && action.payload.id === id) {
      return {...state, selectedNode: action.payload.selectedNode}
    }
    if (actions.flamechart.setConfigSpaceViewportRect.matches(action) && action.payload.id === id) {
      return {...state, configSpaceViewportRect: action.payload.configSpaceViewportRect}
    }
    if (actions.setProfile.matches(action)) {
      // If the profile changes, we should invalidate all of our state, since none of it still applies
      return initialState
    }

    return state
  })
}

export type FlamechartViewProps = {
  id: FlamechartID
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  dispatch: Dispatch
  getCSSColorForFrame: (frame: Frame) => string
} & FlamechartViewState

export const chronoViewFlamechart = memoizeByShallowEquality<
  {
    profile: Profile
    frameToColorBucket: Map<string | number, number>
  },
  Flamechart
>(({profile, frameToColorBucket}) => {
  function getColorBucketForFrame(frame: Frame) {
    return frameToColorBucket.get(frame.key) || 0
  }

  return new Flamechart({
    getTotalWeight: profile.getTotalWeight.bind(profile),
    forEachCall: profile.forEachCall.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame,
  })
})

const createMemoizedFlamechartRenderer = () =>
  memoizeByShallowEquality<
    {
      canvasContext: CanvasContext
      flamechart: Flamechart
    },
    FlamechartRenderer
  >(({canvasContext, flamechart}) => {
    return new FlamechartRenderer(canvasContext, rowAtlas(canvasContext), flamechart)
  })

const chronoViewFlamechartRenderer = createMemoizedFlamechartRenderer()

export const chronoViewProps = memoizeByShallowEquality<
  {
    profile: Profile
    canvasContext: CanvasContext
    getCSSColorForFrame: (frame: Frame) => string
    frameToColorBucket: Map<number | string, number>
    dispatch: Dispatch
  } & FlamechartViewState,
  FlamechartViewProps
>(args => {
  const {profile, frameToColorBucket, canvasContext} = args
  const flamechart = chronoViewFlamechart({profile, frameToColorBucket})
  const flamechartRenderer = chronoViewFlamechartRenderer({
    canvasContext: canvasContext,
    flamechart,
  })

  return {
    id: FlamechartID.CHRONO,
    flamechart,
    flamechartRenderer,
    ...args,
  }
})

export const leftHeavyFlamechart = memoizeByShallowEquality<
  {
    profile: Profile
    frameToColorBucket: Map<string | number, number>
  },
  Flamechart
>(({profile, frameToColorBucket}) => {
  function getColorBucketForFrame(frame: Frame) {
    return frameToColorBucket.get(frame.key) || 0
  }

  return new Flamechart({
    getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
    forEachCall: profile.forEachCallGrouped.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame,
  })
})

const leftHeavyFlamechartRenderer = createMemoizedFlamechartRenderer()

export const leftHeavyViewProps = memoizeByShallowEquality<
  {
    profile: Profile
    canvasContext: CanvasContext
    getCSSColorForFrame: (frame: Frame) => string
    frameToColorBucket: Map<number | string, number>
    dispatch: Dispatch
  } & FlamechartViewState,
  FlamechartViewProps
>(args => {
  const {profile, frameToColorBucket, canvasContext} = args
  const flamechart = leftHeavyFlamechart({profile, frameToColorBucket})
  const flamechartRenderer = leftHeavyFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return {
    id: FlamechartID.LEFT_HEAVY,
    flamechart,
    flamechartRenderer,
    ...args,
  }
})
