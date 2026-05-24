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

const getInvertedCallerProfileReg = memoizeByShallowEquality(
        ({
           profile,
           frame,
           flattenRecursion,
           normalized
         }: {
          profile: Profile
          frame: Frame
          flattenRecursion: boolean
          normalized: boolean
        }): Profile => {
          let p = profile.getInvertedProfileForCallersOf(frame, normalized)
          return flattenRecursion ? p.getProfileWithRecursionFlattened() : p
        },
)

const getInvertedCallerFlamegraphReg = memoizeByShallowEquality(
        ({
           invertedCallerProfile,
           getColorBucketForFrame,
         }: {
          invertedCallerProfile: Profile
          getColorBucketForFrame: (frame: Frame) => number
        }): Flamechart => {
          return new Flamechart({
            getTotalWeight: invertedCallerProfile.getTotalNonIdleRegWeight.bind(invertedCallerProfile),
            forEachCall: invertedCallerProfile.forEachCallGroupedByRegWeight.bind(invertedCallerProfile),
            formatValue: invertedCallerProfile.formatValue.bind(invertedCallerProfile),
            getColorBucketForFrame,
            hasDiffData: invertedCallerProfile.hasDiffData.bind(invertedCallerProfile),
            getDiffRatioForFrame: (f: Frame) => f.getDiffRatio(),
          })
        },
)

const getInvertedCallerFlamegraphRendererReg = createMemoizedFlamechartRenderer({inverted: true})

export const InvertedCallerFlamegraphViewReg = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState} = ownProps
  let {profile, sandwichViewState} = activeProfileState
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

  const flamechart = getInvertedCallerFlamegraphReg({
    invertedCallerProfile: getInvertedCallerProfileReg({
      profile,
      frame: selectedFrame,
      flattenRecursion,
      normalized
    }),
    getColorBucketForFrame,
  })
  const flamechartRenderer = getInvertedCallerFlamegraphRendererReg({
    canvasContext,
    flamechart,
    diffMode,
  })

  return (
          <FlamechartWrapper
                  theme={theme}
                  renderInverted={true}
                  displayMinimap={false}
                  displayTable={false}
                  diffMode={diffMode}
                  diffNormalized={normalized}
                  flamechart={flamechart}
                  flamechartRenderer={flamechartRenderer}
                  canvasContext={canvasContext}
                  getCSSColorForFrame={getCSSColorForFrame}
                  useRegWeights={true}
                  {...useFlamechartSetters(FlamechartID.SANDWICH_INVERTED_CALLERS_REG)}
                  {...callerCallee.invertedCallerFlamegraphReg}
                  setSelectedNode={noop}
          />
  )
})
