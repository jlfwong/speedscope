import {FlamechartID, FlamechartViewState} from '../store/flamechart-view-state'
import {CanvasContext} from '../gl/canvas-context'
import {Flamechart} from '../lib/flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from '../gl/flamechart-renderer'
import {Dispatch, createContainer} from '../lib/typed-redux'
import {Frame, Profile, CallTreeNode} from '../lib/profile'
import {memoizeByShallowEquality} from '../lib/utils'
import {ApplicationState} from '../store'
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

interface FlamechartSetters {
  setLogicalSpaceViewportSize: (logicalSpaceViewportSize: Vec2) => void
  setConfigSpaceViewportRect: (configSpaceViewportRect: Rect) => void
  setNodeHover: (hover: {node: CallTreeNode; event: MouseEvent} | null) => void
  setSelectedNode: (node: CallTreeNode | null) => void
}

export function createFlamechartSetters(
  dispatch: Dispatch,
  id: FlamechartID,
  profileIndex: number,
): FlamechartSetters {
  function wrapPayload<T>(t: T): {profileIndex: number; args: {id: FlamechartID} & T} {
    const args = Object.assign({}, t, {id})
    return {profileIndex, args}
  }

  function setNodeHover(hover: {node: CallTreeNode; event: MouseEvent} | null) {
    dispatch(actions.flamechart.setHoveredNode(wrapPayload({hover})))
  }

  function setLogicalSpaceViewportSize(logicalSpaceViewportSize: Vec2) {
    dispatch(
      actions.flamechart.setLogicalSpaceViewportSize(wrapPayload({logicalSpaceViewportSize})),
    )
  }

  function setConfigSpaceViewportRect(configSpaceViewportRect: Rect) {
    dispatch(actions.flamechart.setConfigSpaceViewportRect(wrapPayload({configSpaceViewportRect})))
  }

  function setSelectedNode(selectedNode: CallTreeNode | null) {
    dispatch(actions.flamechart.setSelectedNode(wrapPayload({selectedNode})))
  }

  return {setNodeHover, setLogicalSpaceViewportSize, setConfigSpaceViewportRect, setSelectedNode}
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
      return new FlamechartRenderer(canvasContext, getRowAtlas(canvasContext), flamechart, options)
    },
  )

const getChronoViewFlamechartRenderer = createMemoizedFlamechartRenderer()

export interface FlamechartViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
}

export const ChronoFlamechartView = createContainer(
  FlamechartView,
  (state: ApplicationState, dispatch: Dispatch, ownProps: FlamechartViewContainerProps) => {
    const {activeProfileState, glCanvas} = ownProps
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

    return {
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...createFlamechartSetters(dispatch, FlamechartID.CHRONO, index),
      ...chronoViewState,
    }
  },
)

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

export const LeftHeavyFlamechartView = createContainer(
  FlamechartView,
  (state: ApplicationState, dispatch: Dispatch, ownProps: FlamechartViewContainerProps) => {
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

    return {
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...createFlamechartSetters(dispatch, FlamechartID.LEFT_HEAVY, index),
      ...leftHeavyViewState,
    }
  },
)
