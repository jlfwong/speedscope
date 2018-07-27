import {Flamechart} from '../flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from '../flamechart-renderer'
import {Frame, Profile, CallTreeNode} from '../profile'
import {memoizeByShallowEquality} from '../utils'
import {rowAtlas} from '.'
import {Rect} from '../math'
import {CanvasContext} from '../canvas-context'
import {Dispatch, Reducer} from '../typed-redux'
import {actions} from './actions'

export enum FlamechartID {
  LEFT_HEAVY,
  CHRONO,
  SANDWICH_INVERTED_CALLERS,
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

export type FlamechartViewProps = {
  id: FlamechartID
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  dispatch: Dispatch
  getCSSColorForFrame: (frame: Frame) => string
} & FlamechartViewState

export function createFlamechartViewStateReducer(id: FlamechartID): Reducer<FlamechartViewState> {
  let initialState: FlamechartViewState = {
    hover: null,
    selectedNode: null,
    configSpaceViewportRect: Rect.empty,
  }
  return (state = initialState, action) => {
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
    if (actions.setViewMode.matches(action)) {
      // If we switch views, the hover information is no longer relevant
      return {...state, hover: null}
    }

    return state
  }
}

export const chronoViewFlamechart = memoizeByShallowEquality(
  ({
    profile,
    getColorBucketForFrame,
  }: {
    profile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  }): Flamechart => {
    return new Flamechart({
      getTotalWeight: profile.getTotalWeight.bind(profile),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
  },
)

export const createMemoizedFlamechartRenderer = (options?: FlamechartRendererOptions) =>
  memoizeByShallowEquality(
    ({
      canvasContext,
      flamechart,
    }: {
      canvasContext: CanvasContext
      flamechart: Flamechart
    }): FlamechartRenderer => {
      return new FlamechartRenderer(canvasContext, rowAtlas(canvasContext), flamechart, options)
    },
  )

const chronoViewFlamechartRenderer = createMemoizedFlamechartRenderer()

export const chronoViewProps = memoizeByShallowEquality(
  ({
    profile,
    getColorBucketForFrame,
    canvasContext,
    dispatch,
    getCSSColorForFrame,
    hover,
    selectedNode,
    configSpaceViewportRect,
  }: {
    profile: Profile
    canvasContext: CanvasContext
    getCSSColorForFrame: (frame: Frame) => string
    getColorBucketForFrame: (frame: Frame) => number
    dispatch: Dispatch
  } & FlamechartViewState): FlamechartViewProps => {
    const flamechart = chronoViewFlamechart({profile, getColorBucketForFrame})
    const flamechartRenderer = chronoViewFlamechartRenderer({
      canvasContext,
      flamechart,
    })

    return {
      id: FlamechartID.CHRONO,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      dispatch,
      getCSSColorForFrame,
      hover,
      selectedNode,
      configSpaceViewportRect,
    }
  },
)

export const leftHeavyFlamechart = memoizeByShallowEquality(
  ({
    profile,
    getColorBucketForFrame,
  }: {
    profile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  }): Flamechart => {
    return new Flamechart({
      getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
      forEachCall: profile.forEachCallGrouped.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
  },
)

const leftHeavyFlamechartRenderer = createMemoizedFlamechartRenderer()

export const leftHeavyViewProps = memoizeByShallowEquality(
  ({
    profile,
    getColorBucketForFrame,
    canvasContext,
    dispatch,
    getCSSColorForFrame,
    hover,
    selectedNode,
    configSpaceViewportRect,
  }: {
    profile: Profile
    canvasContext: CanvasContext
    getCSSColorForFrame: (frame: Frame) => string
    getColorBucketForFrame: (frame: Frame) => number
    dispatch: Dispatch
  } & FlamechartViewState): FlamechartViewProps => {
    const flamechart = leftHeavyFlamechart({profile, getColorBucketForFrame})
    const flamechartRenderer = leftHeavyFlamechartRenderer({
      canvasContext,
      flamechart,
    })

    return {
      id: FlamechartID.LEFT_HEAVY,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      dispatch,
      getCSSColorForFrame,
      hover,
      selectedNode,
      configSpaceViewportRect,
    }
  },
)
