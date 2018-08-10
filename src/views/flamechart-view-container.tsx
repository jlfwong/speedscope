import {FlamechartID, FlamechartViewState} from '../store/flamechart-view-state'
import {CanvasContext} from '../gl/canvas-context'
import {Flamechart} from '../lib/flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from '../gl/flamechart-renderer'
import {Dispatch, createContainer} from '../lib/typed-redux'
import {Frame, Profile} from '../lib/profile'
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

export type FlamechartViewProps = {
  id: FlamechartID
  activeProfileState: ActiveProfileState
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  dispatch: Dispatch
  getCSSColorForFrame: (frame: Frame) => string
} & FlamechartViewState

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
    const {profile, chronoViewState} = activeProfileState

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
      id: FlamechartID.CHRONO,
      dispatch,
      activeProfileState,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
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

    const {profile, leftHeavyViewState} = activeProfileState

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
      id: FlamechartID.LEFT_HEAVY,
      dispatch,
      activeProfileState,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...leftHeavyViewState,
    }
  },
)
