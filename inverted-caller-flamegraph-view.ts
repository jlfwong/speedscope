import {memoizeByShallowEquality} from './utils'
import {Profile, Frame} from './profile'
import {Flamechart} from './flamechart'
import {createMemoizedFlamechartRenderer} from './flamechart-view-container'
import {createContainer} from './app-state/typed-redux'
import {ApplicationState} from './app-state'
import {
  getCanvasContext,
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
  getProfileWithRecursionFlattened,
} from './app-state/getters'
import {FlamechartID} from './app-state/flamechart-view-state'
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
  (state: ApplicationState) => {
    let {profile, flattenRecursion, glCanvas, frameToColorBucket, sandwichView} = state
    if (!profile) throw new Error('profile missing')
    if (!glCanvas) throw new Error('glCanvas missing')
    const {callerCallee} = sandwichView
    if (!callerCallee) throw new Error('callerCallee missing')
    const {selectedFrame} = callerCallee

    profile = flattenRecursion ? getProfileWithRecursionFlattened(profile) : profile

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
      id: FlamechartID.SANDWICH_CALLEES,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...callerCallee.calleeFlamegraph,
    }
  },
)
