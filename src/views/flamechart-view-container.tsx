import {h} from 'preact'
import * as preact from 'preact'
import {CanvasContext} from '../gl/canvas-context'
import {Flamechart} from '../lib/flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from '../gl/flamechart-renderer'
import {Frame, Profile, CallTreeNode} from '../lib/profile'
import {memoizeByShallowEquality} from '../lib/utils'
import {FlamechartView} from './flamechart-view'
import {
  getRowAtlas,
  getCanvasContext,
  createGetCSSColorForFrame,
  getFrameToColorBucket,
  createGetColorBucketForFrame,
} from '../app-state/getters'
import {Vec2, Rect} from '../lib/math'
import {memo, useCallback, useState} from 'preact/compat'
import {ActiveProfileState} from '../app-state/active-profile-state'
import {Theme, useTheme} from './themes/theme'
import {FlamechartID, FlamechartViewState} from '../app-state/profile-group'
import {
  profileGroupAtom,
  diffModeAtom,
  diffNormalizedAtom,
  diffViewModeAtom,
  DiffViewMode
} from '../app-state'
import {useAtom} from '../lib/atom'
import {BAS_COLOR, REG_COLOR} from '../lib/color'
import {ProfileTableViewContainer} from './profile-table-view'
import {ZIndex} from './style'
import {windowWidthCache} from "../widgetUtils";

export interface FlamechartSetters {
  setLogicalSpaceViewportSize: (logicalSpaceViewportSize: Vec2) => void
  setConfigSpaceViewportRect: (configSpaceViewportRect: Rect) => void
  setNodeHover: (hover: { node: CallTreeNode; event: MouseEvent } | null) => void
  setSelectedNode: (node: CallTreeNode | null) => void
}

export function useFlamechartSetters(id: FlamechartID): FlamechartSetters {
  return {
    setNodeHover: useCallback(
            (hover: { node: CallTreeNode; event: MouseEvent } | null) => {
              profileGroupAtom.setFlamechartHoveredNode(id, hover)
            },
            [id],
    ),
    setLogicalSpaceViewportSize: useCallback(
            (logicalSpaceViewportSize: Vec2) => {
              profileGroupAtom.setLogicalSpaceViewportSize(id, logicalSpaceViewportSize)
            },
            [id],
    ),
    setConfigSpaceViewportRect: useCallback(
            (configSpaceViewportRect: Rect) => {
              profileGroupAtom.setConfigSpaceViewportRect(id, configSpaceViewportRect)
            },
            [id],
    ),
    setSelectedNode: useCallback(
            (selectedNode: CallTreeNode | null) => {
              profileGroupAtom.setSelectedNode(id, selectedNode)
            },
            [id],
    ),
  }
}

function useTableAutoExpand(diffMode: boolean) {
  const [isTableHovered, setIsTableHovered] = useState(false);
  const [shouldExpand, setShouldExpand] = useState(false);

  const handleMouseEnter = useCallback(() => {
    const dpr = window.devicePixelRatio || 1
    const threshold = (diffMode ? 1300 : 1000) * dpr
    if (windowWidthCache < threshold) {
      setShouldExpand(true);
    }
    setIsTableHovered(true);
  }, [diffMode]);

  const handleMouseLeave = useCallback(() => {
    setShouldExpand(false);
    setIsTableHovered(false);
  }, []);

  return {isTableHovered, shouldExpand, handleMouseEnter, handleMouseLeave};
}

interface ExpandableTableContainerProps {
  activeProfileState: ActiveProfileState
  diffMode: boolean
}

const ExpandableTableContainer = memo(({activeProfileState, diffMode}: ExpandableTableContainerProps) => {
  const {isTableHovered, shouldExpand, handleMouseEnter, handleMouseLeave} = useTableAutoExpand(diffMode);

  return (
          <div style={{flex: 2, position: "relative"}}>
            <div
                    style={{
                      width: "100%",
                      height: "100%",
                      visibility: "hidden",
                      zIndex: ZIndex.GRAPH
                    }}
            />
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: isTableHovered && shouldExpand ? "130%" : "100%",
              height: "100%",
              zIndex: ZIndex.TABLE,
              transition: "width 0.1s, position 0s"
            }}
                 onMouseEnter={handleMouseEnter}
                 onMouseLeave={handleMouseLeave}
            >
              <ProfileTableViewContainer activeProfileState={activeProfileState}/>
            </div>
          </div>
  );
});

export type FlamechartViewProps = {
  theme: Theme
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  displayMinimap: boolean
  displayTable: boolean
  diffMode: boolean
  diffNormalized?: boolean
  useRegWeights?: boolean
  isBothMode?: boolean
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
            hasDiffData: profile.hasDiffData.bind(profile),
            getDiffRatioForFrame: (f: Frame) => f.getDiffRatio(),
          })
        },
)

export const createMemoizedFlamechartRenderer = (options?: FlamechartRendererOptions) =>
        memoizeByShallowEquality(
                ({
                   canvasContext,
                   flamechart,
                   diffMode,
                 }: {
                  canvasContext: CanvasContext
                  flamechart: Flamechart
                  diffMode: boolean
                }): FlamechartRenderer => {
                  return new FlamechartRenderer(
                          canvasContext.gl,
                          getRowAtlas(canvasContext),
                          flamechart,
                          canvasContext.rectangleBatchRenderer,
                          canvasContext.flamechartColorPassRenderer,
                          {inverted: false, ...options, diffMode},
                  )
                },
        )

const getChronoViewFlamechartRenderer = createMemoizedFlamechartRenderer()

export interface FlamechartViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
  displayMinimap: boolean
  displayTable: boolean
  setters: FlamechartSetters
  flamechart: Flamechart
}

export const ChronoFlamechartView = memo((props: FlamechartViewContainerProps) => {
  const {activeProfileState, glCanvas, displayMinimap, displayTable, setters, flamechart} = props
  const {profile, chronoViewState} = activeProfileState

  const theme = useTheme()
  const diffMode = useAtom(diffModeAtom)
  const diffNormalized = useAtom(diffNormalizedAtom)
  const canvasContext = getCanvasContext({theme, canvas: glCanvas})
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getCSSColorForFrame = createGetCSSColorForFrame({theme, frameToColorBucket, diffMode})
  const flamechartRenderer = getChronoViewFlamechartRenderer({
    canvasContext,
    flamechart,
    diffMode,
  })

  return (
          <div style={{display: "flex", flexDirection: "row", width: "100%", height: "100%"}}>
            {displayTable && <ExpandableTableContainer activeProfileState={activeProfileState} diffMode={diffMode}/>}
            <div style={{flex: 3, overflow: "hidden"}}>
              <FlamechartView
                      theme={theme}
                      renderInverted={false}
                      displayMinimap={displayMinimap}
                      displayTable={displayTable}
                      diffMode={diffMode && flamechart.hasDiffData()}
                      diffNormalized={diffNormalized}
                      flamechart={flamechart}
                      flamechartRenderer={flamechartRenderer}
                      canvasContext={canvasContext}
                      getCSSColorForFrame={getCSSColorForFrame}
                      {...chronoViewState}
                      {...setters}
              />
            </div>
          </div>
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
            hasDiffData: profile.hasDiffData.bind(profile),
            getDiffRatioForFrame: (f: Frame) => f.getDiffRatio(),
          })
        },
)

export const getLeftHeavyFlamechartByRegWeight = memoizeByShallowEquality(
        ({
           profile,
           getColorBucketForFrame,
         }: {
          profile: Profile
          getColorBucketForFrame: (frame: Frame) => number
        }): Flamechart => {
          return new Flamechart({
            getTotalWeight: profile.getTotalNonIdleRegWeight.bind(profile),
            forEachCall: profile.forEachCallGroupedByRegWeight.bind(profile),
            formatValue: profile.formatValue.bind(profile),
            getColorBucketForFrame,
            hasDiffData: profile.hasDiffData.bind(profile),
            getDiffRatioForFrame: (f: Frame) => f.getDiffRatio(),
          })
        },
)

const getLeftHeavyFlamechartRenderer = createMemoizedFlamechartRenderer()
const getBothBasFlamechartRenderer = createMemoizedFlamechartRenderer()
const getBothRegFlamechartRenderer = createMemoizedFlamechartRenderer()

export const LeftHeavyFlamechartView = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState, glCanvas, displayMinimap, displayTable, setters, flamechart} = ownProps

  const {profile, leftHeavyViewState, leftHeavyViewStateReg} = activeProfileState

  const theme = useTheme()
  const diffMode = useAtom(diffModeAtom)
  const diffNormalized = useAtom(diffNormalizedAtom)
  const diffViewMode = useAtom(diffViewModeAtom)
  const isBothMode = diffViewMode === DiffViewMode.BOTH && diffMode && flamechart.hasDiffData()

  const settersReg = useFlamechartSetters(FlamechartID.LEFT_HEAVY_REG)

  const canvasContext = getCanvasContext({theme, canvas: glCanvas})
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getCSSColorForFrame = createGetCSSColorForFrame({theme, frameToColorBucket, diffMode})
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)

  const flamechartReg = isBothMode
          ? getLeftHeavyFlamechartByRegWeight({profile, getColorBucketForFrame})
          : null

  const flamechartRenderer = isBothMode
          ? getBothBasFlamechartRenderer({
            canvasContext,
            flamechart,
            diffMode,
          })
          : getLeftHeavyFlamechartRenderer({
            canvasContext,
            flamechart,
            diffMode,
          })

  const flamechartRendererReg = isBothMode && flamechartReg
          ? getBothRegFlamechartRenderer({
            canvasContext,
            flamechart: flamechartReg,
            diffMode,
          })
          : null

  const renderFlamechartBas = (label: preact.ComponentChildren, renderer: any, flamechartToRender: Flamechart) => (
          <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
            {isBothMode && <div style={{
              padding: "2px 8px",
              background: theme.bgSecondaryColor,
              color: theme.fgPrimaryColor,
              fontSize: "12px",
              fontWeight: "bold",
              textAlign: "center"
            }}>{label}</div>}
            <div style={{flex: 1, overflow: "hidden"}}>
              <FlamechartView
                      theme={theme}
                      renderInverted={false}
                      displayMinimap={displayMinimap}
                      displayTable={displayTable}
                      diffMode={diffMode && flamechartToRender.hasDiffData()}
                      diffNormalized={diffNormalized}
                      flamechart={flamechartToRender}
                      flamechartRenderer={renderer}
                      canvasContext={canvasContext}
                      getCSSColorForFrame={getCSSColorForFrame}
                      useRegWeights={false}
                      isBothMode={isBothMode}
                      {...leftHeavyViewState}
                      {...setters}
              />
            </div>
          </div>
  )

  const renderFlamechartReg = (label: preact.ComponentChildren, renderer: any, flamechartToRender: Flamechart) => (
          <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
            {isBothMode && <div style={{
              padding: "2px 8px",
              background: theme.bgSecondaryColor,
              color: theme.fgPrimaryColor,
              fontSize: "12px",
              fontWeight: "bold",
              textAlign: "center"
            }}>{label}</div>}
            <div style={{flex: 1, overflow: "hidden"}}>
              <FlamechartView
                      theme={theme}
                      renderInverted={false}
                      displayMinimap={displayMinimap}
                      displayTable={displayTable}
                      diffMode={diffMode && flamechartToRender.hasDiffData()}
                      diffNormalized={diffNormalized}
                      flamechart={flamechartToRender}
                      flamechartRenderer={renderer}
                      canvasContext={canvasContext}
                      getCSSColorForFrame={getCSSColorForFrame}
                      useRegWeights={true}
                      isBothMode={isBothMode}
                      {...leftHeavyViewStateReg}
                      {...settersReg}
              />
            </div>
          </div>
  )

  return (
          <div style={{display: "flex", flexDirection: "row", width: "100%", height: "100%"}}>
            {displayTable && <ExpandableTableContainer activeProfileState={activeProfileState} diffMode={diffMode}/>}
            {isBothMode && flamechartReg ? (
                    <div style={{flex: 3, display: "flex", flexDirection: "row", overflow: "hidden"}}>
                      {renderFlamechartBas(<span><span
                              style={{color: BAS_COLOR}}>BAS</span> ({flamechart.formatValue(flamechart.getTotalWeight())})</span>, flamechartRenderer, flamechart)}
                      <div style={{width: "2px", background: theme.fgSecondaryColor}}/>
                      {renderFlamechartReg(<span><span
                              style={{color: REG_COLOR}}>REG</span> ({flamechartReg.formatValue(flamechartReg.getTotalWeight())}{diffNormalized ? "  normalized)" : ")"}</span>, flamechartRendererReg, flamechartReg)}
                    </div>
            ) : (
                    <div style={{flex: 3, overflow: "hidden"}}>
                      <FlamechartView
                              theme={theme}
                              renderInverted={false}
                              displayMinimap={displayMinimap}
                              displayTable={displayTable}
                              diffMode={diffMode && flamechart.hasDiffData()}
                              diffNormalized={diffNormalized}
                              flamechart={flamechart}
                              flamechartRenderer={flamechartRenderer}
                              canvasContext={canvasContext}
                              getCSSColorForFrame={getCSSColorForFrame}
                              {...leftHeavyViewState}
                              {...setters}
                      />
                    </div>
            )}
          </div>
  )
})
