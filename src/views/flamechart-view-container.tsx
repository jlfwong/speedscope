import * as React from 'react'
import {FlamechartID, FlamechartViewState} from '../store/flamechart-view-state'
import {CanvasContext} from '../gl/canvas-context'
import {Flamechart} from '../lib/flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from '../gl/flamechart-renderer'
import {ActionCreator} from '../lib/typed-redux'
import {useActionCreator} from '../lib/preact-redux'
import {Frame, Profile, CallTreeNode} from '../lib/profile'
import {memoizeByShallowEquality} from '../lib/utils'
import {FlamechartView} from './flamechart-view'
import {
  getRowAtlas,
  createGetColorBucketForFrame,
  getCanvasContext,
  createGetCSSColorForFrame,
  getFrameToColorBucket,
} from '../store/getters'
import {ActiveProfileState} from './application'
import {Vec2, Rect} from '../lib/math'
import {actions} from '../store/actions'
import {memo, useCallback} from 'react'

interface FlamechartSetters {
  setLogicalSpaceViewportSize: (logicalSpaceViewportSize: Vec2) => void
  setConfigSpaceViewportRect: (configSpaceViewportRect: Rect) => void
  setNodeHover: (hover: {node: CallTreeNode; event: MouseEvent} | null) => void
  setSelectedNode: (node: CallTreeNode | null) => void
}

interface WithFlamechartContext<T> {
  profileIndex: number
  args: {
    id: FlamechartID
  } & T
}

export function useFlamechartSetters(id: FlamechartID, profileIndex: number): FlamechartSetters {
  function useActionCreatorWithIndex<T, U>(
    actionCreator: ActionCreator<WithFlamechartContext<U>>,
    map: (t: T) => U,
  ): (t: T) => void {
    const callback = useCallback(
      (t: T) => {
        const args = Object.assign({}, map(t), {id})
        return actionCreator({profileIndex, args})
      },
      [actionCreator, map],
    )
    return useActionCreator(callback)
  }

  const {
    setHoveredNode,
    setLogicalSpaceViewportSize,
    setConfigSpaceViewportRect,
    setSelectedNode,
  } = actions.flamechart

  return {
    setNodeHover: useActionCreatorWithIndex(
      setHoveredNode,
      useCallback(hover => ({hover}), []),
    ),
    setLogicalSpaceViewportSize: useActionCreatorWithIndex(
      setLogicalSpaceViewportSize,
      useCallback(logicalSpaceViewportSize => ({logicalSpaceViewportSize}), []),
    ),
    setConfigSpaceViewportRect: useActionCreatorWithIndex(
      setConfigSpaceViewportRect,
      useCallback(configSpaceViewportRect => ({configSpaceViewportRect}), []),
    ),
    setSelectedNode: useActionCreatorWithIndex(
      setSelectedNode,
      useCallback(selectedNode => ({selectedNode}), []),
    ),
  }
}

export type FlamechartViewProps = {
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  getCSSColorForFrame: (frame: Frame) => string
} & FlamechartSetters &
  FlamechartViewState

export const getChronoViewFlamechart = memoizeByShallowEquality(
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
      return new FlamechartRenderer(
        canvasContext.gl,
        getRowAtlas(canvasContext),
        flamechart,
        canvasContext.rectangleBatchRenderer,
        canvasContext.flamechartColorPassRenderer,
        options,
      )
    },
  )

const getChronoViewFlamechartRenderer = createMemoizedFlamechartRenderer()

export interface FlamechartViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
}

export const ChronoFlamechartView = memo((props: FlamechartViewContainerProps) => {
  const {activeProfileState, glCanvas} = props
  const {index, profile, chronoViewState} = activeProfileState

  const canvasContext = getCanvasContext(glCanvas)
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
  const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

  const flamechart = getChronoViewFlamechart({profile, getColorBucketForFrame})
  const flamechartRenderer = getChronoViewFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return (
    <FlamechartView
      renderInverted={false}
      flamechart={flamechart}
      flamechartRenderer={flamechartRenderer}
      canvasContext={canvasContext}
      getCSSColorForFrame={getCSSColorForFrame}
      {...useFlamechartSetters(FlamechartID.CHRONO, index)}
      {...chronoViewState}
    />
  )
})

export const getLeftHeavyFlamechart = memoizeByShallowEquality(
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

const getLeftHeavyFlamechartRenderer = createMemoizedFlamechartRenderer()

export const LeftHeavyFlamechartView = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState, glCanvas} = ownProps

  const {index, profile, leftHeavyViewState} = activeProfileState

  const canvasContext = getCanvasContext(glCanvas)
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
  const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

  const flamechart = getLeftHeavyFlamechart({
    profile,
    getColorBucketForFrame,
  })
  const flamechartRenderer = getLeftHeavyFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return (
    <FlamechartView
      renderInverted={false}
      flamechart={flamechart}
      flamechartRenderer={flamechartRenderer}
      canvasContext={canvasContext}
      getCSSColorForFrame={getCSSColorForFrame}
      {...useFlamechartSetters(FlamechartID.LEFT_HEAVY, index)}
      {...leftHeavyViewState}
    />
  )
})
