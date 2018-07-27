import {FlamechartID, FlamechartViewState} from './app-state/flamechart-view-state'
import {CanvasContext} from './canvas-context'
import {Flamechart} from './flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from './flamechart-renderer'
import {Dispatch} from './typed-redux'
import {Frame, Profile} from './profile'
import {memoizeByShallowEquality} from './utils'
import {rowAtlas} from './app-state'

export type FlamechartViewProps = {
  id: FlamechartID
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  dispatch: Dispatch
  getCSSColorForFrame: (frame: Frame) => string
} & FlamechartViewState

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
