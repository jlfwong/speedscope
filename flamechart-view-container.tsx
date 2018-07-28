import {FlamechartID, FlamechartViewState} from './app-state/flamechart-view-state'
import {CanvasContext} from './canvas-context'
import {Flamechart} from './flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from './flamechart-renderer'
import {Dispatch, createContainer} from './app-state/typed-redux'
import {Frame, Profile} from './profile'
import {memoizeByShallowEquality} from './utils'
import {ApplicationState} from './app-state'
import {FlamechartView} from './flamechart-view'
import {
  getRowAtlas,
  createGetColorBucketForFrame,
  getCanvasContext,
  createGetCSSColorForFrame,
} from './app-state/getters'

export type FlamechartViewProps = {
  id: FlamechartID
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

export const ChronoFlamechartView = createContainer(FlamechartView, (state: ApplicationState) => {
  const {profile, glCanvas, frameToColorBucket, chronoView} = state
  if (!profile) throw new Error('profile missing')
  if (!glCanvas) throw new Error('glCanvas missing')

  const canvasContext = getCanvasContext(glCanvas)
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
  const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

  const flamechart = getChronoViewFlamechart({profile, getColorBucketForFrame})
  const flamechartRenderer = getChronoViewFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return {
    id: FlamechartID.CHRONO,
    renderInverted: false,
    flamechart,
    flamechartRenderer,
    canvasContext,
    getCSSColorForFrame,
    ...chronoView,
  }
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

export const LeftHeavyFlamechartView = createContainer(
  FlamechartView,
  (state: ApplicationState) => {
    const {profile, glCanvas, frameToColorBucket, chronoView} = state
    if (!profile) throw new Error('profile missing')
    if (!glCanvas) throw new Error('glCanvas missing')

    const canvasContext = getCanvasContext(glCanvas)
    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

    const flamechart = getLeftHeavyFlamechart({profile, getColorBucketForFrame})
    const flamechartRenderer = getLeftHeavyFlamechartRenderer({
      canvasContext,
      flamechart,
    })

    return {
      id: FlamechartID.LEFT_HEAVY,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...chronoView,
    }
  },
)
