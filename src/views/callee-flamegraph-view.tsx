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
} from '../app-state/getters'
import {FlamechartWrapper} from './flamechart-wrapper'
import {h} from 'preact'
import {memo} from 'preact/compat'
import {useTheme} from './themes/theme'
import {FlamechartID} from '../app-state/profile-group'
import {diffModeAtom, flattenRecursionAtom, glCanvasAtom, diffNormalizedAtom} from '../app-state'
import {useAtom} from '../lib/atom'

const getCalleeProfile = memoizeByShallowEquality<
        {
          profile: Profile
          frame: Frame
          flattenRecursion: boolean
          normalized: boolean
        },
        Profile
>(({profile, frame, flattenRecursion, normalized}) => {
  let p = profile.getProfileForCalleesOf(frame, normalized)
  return flattenRecursion ? p.getProfileWithRecursionFlattened() : p
})

const getCalleeFlamegraph = memoizeByShallowEquality<
        {
          calleeProfile: Profile
          getColorBucketForFrame: (frame: Frame) => number
        },
        Flamechart
>(({calleeProfile, getColorBucketForFrame}) => {
  return new Flamechart({
    getTotalWeight: calleeProfile.getTotalNonIdleWeight.bind(calleeProfile),
    forEachCall: calleeProfile.forEachCallGrouped.bind(calleeProfile),
    formatValue: calleeProfile.formatValue.bind(calleeProfile),
    getColorBucketForFrame,
    hasDiffData: calleeProfile.hasDiffData.bind(calleeProfile),
    getDiffRatioForFrame: (f: Frame) => f.getDiffRatio(),
  })
})

const getCalleeFlamegraphRenderer = createMemoizedFlamechartRenderer()

export const CalleeFlamegraphView = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState} = ownProps
  const {profile, sandwichViewState} = activeProfileState
  const flattenRecursion = useAtom(flattenRecursionAtom)
  const glCanvas = useAtom(glCanvasAtom)
  const diffMode = useAtom(diffModeAtom)
  const normalized = useAtom(diffNormalizedAtom)
  const theme = useTheme()

  if (!profile) throw new Error('profile missing')
  if (!glCanvas) throw new Error('glCanvas missing')
  const {callerCallee} = sandwichViewState
  if (!callerCallee) throw new Error('callerCallee missing')
  const {selectedFrame} = callerCallee

  const frameToColorBucket = getFrameToColorBucket(profile)
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
  const getCSSColorForFrame = createGetCSSColorForFrame({theme, frameToColorBucket, diffMode})
  const canvasContext = getCanvasContext({theme, canvas: glCanvas})

  const calleeProfile = getCalleeProfile({profile, frame: selectedFrame, flattenRecursion, normalized});
  const flamechart = getCalleeFlamegraph({calleeProfile, getColorBucketForFrame})
  const flamechartRenderer = getCalleeFlamegraphRenderer({canvasContext, flamechart, diffMode})

  return (
          <FlamechartWrapper
                  theme={theme}
                  renderInverted={false}
                  displayMinimap={false}
                  displayTable={true}
                  diffMode={diffMode}
                  diffNormalized={normalized}
                  flamechart={flamechart}
                  flamechartRenderer={flamechartRenderer}
                  canvasContext={canvasContext}
                  getCSSColorForFrame={getCSSColorForFrame}
                  {...useFlamechartSetters(FlamechartID.SANDWICH_CALLEES)}
                  {...callerCallee.calleeFlamegraph}
                  // This overrides the setSelectedNode specified in useFlamechartSettesr
                  setSelectedNode={noop}
          />
  )
})
