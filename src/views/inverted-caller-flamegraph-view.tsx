import {memoizeByShallowEquality, noop} from '../lib/utils'
import {Profile, Frame} from '../lib/profile'
import {Flamechart} from '../lib/flamechart'
import {
  createMemoizedFlamechartRenderer,
  FlamechartViewContainerProps,
  useFlamechartSetters,
} from './flamechart-view-container'
import {
  getCanvasContext,
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
  getFrameToColorBucket,
} from '../store/getters'
import {FlamechartID} from '../store/flamechart-view-state'
import {useAppSelector} from '../store'
import {FlamechartWrapper, useDummySearchProps} from './flamechart-wrapper'
import {h} from 'preact'
import {memo} from 'preact/compat'

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

export const InvertedCallerFlamegraphView = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState} = ownProps
  let {profile, sandwichViewState, index} = activeProfileState
  const flattenRecursion = useAppSelector(state => state.flattenRecursion, [])
  const glCanvas = useAppSelector(state => state.glCanvas, [])

  if (!profile) throw new Error('profile missing')
  if (!glCanvas) throw new Error('glCanvas missing')
  const {callerCallee} = sandwichViewState
  if (!callerCallee) throw new Error('callerCallee missing')
  const {selectedFrame} = callerCallee

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

  return (
    <FlamechartWrapper
      renderInverted={true}
      flamechart={flamechart}
      flamechartRenderer={flamechartRenderer}
      canvasContext={canvasContext}
      getCSSColorForFrame={getCSSColorForFrame}
      {...useFlamechartSetters(FlamechartID.SANDWICH_INVERTED_CALLERS, index)}
      {...callerCallee.invertedCallerFlamegraph}
      /*
       * TODO(jlfwong): When implementing search for the sandwich views,
       * change these flags
       * */
      {...useDummySearchProps()}
      // This overrides the setSelectedNode specified in useFlamechartSettesr
      setSelectedNode={noop}
    />
  )
})
