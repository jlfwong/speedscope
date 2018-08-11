import {memoizeByShallowEquality} from '../lib/utils'
import {Profile, Frame} from '../lib/profile'
import {Flamechart} from '../lib/flamechart'
import {
  createMemoizedFlamechartRenderer,
  FlamechartViewContainerProps,
  createFlamechartSetters,
} from './flamechart-view-container'
import {createContainer, Dispatch} from '../lib/typed-redux'
import {ApplicationState} from '../store'
import {
  getCanvasContext,
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
  getProfileWithRecursionFlattened,
  getFrameToColorBucket,
} from '../store/getters'
import {FlamechartID} from '../store/flamechart-view-state'
import {FlamechartWrapper} from './flamechart-wrapper'

const getInvertedCallerProfile = memoizeByShallowEquality(
  ({
    profile,
    frame,
    flattenRecursion,
  }: {
    profile: Profile
    frame: Frame
    flattenRecursion: boolean
  }): Profile => {
    let p = profile.getInvertedProfileForCallersOf(frame)
    return flattenRecursion ? p.getProfileWithRecursionFlattened() : p
  },
)

const getInvertedCallerFlamegraph = memoizeByShallowEquality(
  ({
    invertedCallerProfile,
    getColorBucketForFrame,
  }: {
    invertedCallerProfile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  }): Flamechart => {
    return new Flamechart({
      getTotalWeight: invertedCallerProfile.getTotalNonIdleWeight.bind(invertedCallerProfile),
      forEachCall: invertedCallerProfile.forEachCallGrouped.bind(invertedCallerProfile),
      formatValue: invertedCallerProfile.formatValue.bind(invertedCallerProfile),
      getColorBucketForFrame,
    })
  },
)

const getInvertedCallerFlamegraphRenderer = createMemoizedFlamechartRenderer({inverted: true})

export const InvertedCallerFlamegraphView = createContainer(
  FlamechartWrapper,
  (state: ApplicationState, dispatch: Dispatch, ownProps: FlamechartViewContainerProps) => {
    const {activeProfileState} = ownProps
    let {profile, sandwichViewState, index} = activeProfileState
    let {flattenRecursion, glCanvas} = state
    if (!profile) throw new Error('profile missing')
    if (!glCanvas) throw new Error('glCanvas missing')
    const {callerCallee} = sandwichViewState
    if (!callerCallee) throw new Error('callerCallee missing')
    const {selectedFrame} = callerCallee

    profile = flattenRecursion ? getProfileWithRecursionFlattened(profile) : profile

    const frameToColorBucket = getFrameToColorBucket(profile)
    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)
    const canvasContext = getCanvasContext(glCanvas)

    const flamechart = getInvertedCallerFlamegraph({
      invertedCallerProfile: getInvertedCallerProfile({
        profile,
        frame: selectedFrame,
        flattenRecursion,
      }),
      getColorBucketForFrame,
    })
    const flamechartRenderer = getInvertedCallerFlamegraphRenderer({canvasContext, flamechart})

    return {
      renderInverted: true,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...createFlamechartSetters(dispatch, FlamechartID.SANDWICH_INVERTED_CALLERS, index),
      // This overrides the setSelectedNode specified in createFlamechartSettesr
      setSelectedNode: () => {},
      ...callerCallee.invertedCallerFlamegraph,
    }
  },
)
