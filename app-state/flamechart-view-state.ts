import {Flamechart} from '../flamechart'
import {FlamechartRenderer} from '../flamechart-renderer'
import {Frame, Profile, CallTreeNode} from '../profile'
import {memoizeByShallowEquality} from '../utils'
import {rowAtlas} from '.'
import {Rect} from '../math'
import {CanvasContext} from '../canvas-context'

export enum FlamechartID {
  LEFT_HEAVY,
  CHRONO,
  SANDWICH_CALLERS,
  SANDWICH_CALLEES,
}

export interface FlamechartViewProps {
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  getCSSColorForFrame: (frame: Frame) => string
}

export interface FlamechartViewState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
  selectedNode: CallTreeNode | null
  configSpaceViewportRect: Rect
}

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
  },
  FlamechartViewProps
>(({profile, canvasContext, getCSSColorForFrame, frameToColorBucket}) => {
  const flamechart = chronoViewFlamechart({profile, frameToColorBucket})
  const flamechartRenderer = chronoViewFlamechartRenderer({
    canvasContext: canvasContext,
    flamechart,
  })

  return {
    flamechart,
    flamechartRenderer,
    getCSSColorForFrame,
    canvasContext,
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
  },
  FlamechartViewProps
>(({profile, canvasContext, getCSSColorForFrame, frameToColorBucket}) => {
  const flamechart = leftHeavyFlamechart({profile, frameToColorBucket})
  const flamechartRenderer = leftHeavyFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return {
    flamechart,
    flamechartRenderer,
    getCSSColorForFrame,
    canvasContext,
  }

  return {
    flamechart,
    flamechartRenderer,
    getCSSColorForFrame,
    canvasContext,
  }
})
