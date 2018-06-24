import {ReloadableComponent} from './reloadable'
import {Profile, Frame} from './profile'
import {StyleSheet, css} from 'aphrodite'
import {SortMethod, ProfileTableView} from './profile-table-view'
import {h} from 'preact'
import {commonStyle, Sizes, Colors} from './style'
import {CanvasContext} from './canvas-context'
import {FlamechartRenderer, FlamechartRowAtlasKey} from './flamechart-renderer'
import {Flamechart} from './flamechart'
import {RowAtlas} from './row-atlas'
import {FlamechartPanZoomView} from './flamechart-view'
import {Rect, AffineTransform, Vec2} from './math'

interface InsideOutViewProps {
  profile: Profile

  // TODO(jlfwong): It's kind of awkward requiring both of these
  getColorBucketForFrame: (frame: Frame) => number
  getCSSColorForFrame: (frame: Frame) => string

  sortMethod: SortMethod
  setSortMethod: (sortMethod: SortMethod) => void
  canvasContext: CanvasContext
  rowAtlas: RowAtlas<FlamechartRowAtlasKey>
}

interface CallerCalleeState {
  selectedFrame: Frame

  invertedCallerFlamegraph: Flamechart
  invertedCallerFlamegraphRenderer: FlamechartRenderer
  invertedCallerConfigSpaceViewportRect: Rect

  calleeFlamegraph: Flamechart
  calleeFlamegraphRenderer: FlamechartRenderer
  calleeConfigSpaceViewportRect: Rect
}

interface InsideOutViewState {
  callerCallee: CallerCalleeState | null
}

export class InsideOutView extends ReloadableComponent<InsideOutViewProps, InsideOutViewState> {
  constructor(props: InsideOutViewProps) {
    super(props)
    this.state = {
      callerCallee: null,
    }
  }

  private setSelectedFrame = (selectedFrame: Frame | null) => {
    const {canvasContext, rowAtlas, getColorBucketForFrame} = this.props

    if (!selectedFrame) {
      this.setState({callerCallee: null})
      return
    }

    const invertedCallerProfile = this.props.profile.getInvertedProfileForCallersOf(selectedFrame)
    const invertedCallerFlamegraph = new Flamechart({
      getTotalWeight: invertedCallerProfile.getTotalNonIdleWeight.bind(invertedCallerProfile),
      forEachCall: invertedCallerProfile.forEachCallGrouped.bind(invertedCallerProfile),
      formatValue: invertedCallerProfile.formatValue.bind(invertedCallerProfile),
      getColorBucketForFrame,
    })
    const invertedCallerFlamegraphRenderer = new FlamechartRenderer(
      canvasContext,
      rowAtlas,
      invertedCallerFlamegraph,
    )

    const calleeProfile = this.props.profile.getProfileForCalleesOf(selectedFrame)
    const calleeFlamegraph = new Flamechart({
      getTotalWeight: calleeProfile.getTotalNonIdleWeight.bind(calleeProfile),
      forEachCall: calleeProfile.forEachCallGrouped.bind(calleeProfile),
      formatValue: calleeProfile.formatValue.bind(calleeProfile),
      getColorBucketForFrame,
    })
    const calleeFlamegraphRenderer = new FlamechartRenderer(
      canvasContext,
      rowAtlas,
      calleeFlamegraph,
    )

    this.setState({
      callerCallee: {
        selectedFrame,
        invertedCallerFlamegraph,
        invertedCallerFlamegraphRenderer,
        invertedCallerConfigSpaceViewportRect: Rect.empty,
        calleeFlamegraph,
        calleeFlamegraphRenderer,
        calleeConfigSpaceViewportRect: Rect.empty,
      },
    })
  }

  private clampViewportToFlamegraph(viewportRect: Rect, flamegraph: Flamechart) {
    const configSpaceDetailViewHeight = Sizes.DETAIL_VIEW_HEIGHT / Sizes.FRAME_HEIGHT

    const configSpaceSize = new Vec2(flamegraph.getTotalWeight(), flamegraph.getLayers().length)

    const configSpaceOriginBounds = new Rect(
      new Vec2(0, -1),
      Vec2.max(
        new Vec2(0, 0),
        configSpaceSize.minus(viewportRect.size).plus(new Vec2(0, configSpaceDetailViewHeight + 1)),
      ),
    )

    const minConfigSpaceViewportRectWidth = Math.min(
      flamegraph.getTotalWeight(),
      3 * flamegraph.getMinFrameWidth(),
    )

    const configSpaceSizeBounds = new Rect(
      new Vec2(minConfigSpaceViewportRectWidth, viewportRect.height()),
      new Vec2(configSpaceSize.x, viewportRect.height()),
    )

    return new Rect(
      configSpaceOriginBounds.closestPointTo(viewportRect.origin),
      configSpaceSizeBounds.closestPointTo(viewportRect.size),
    )
  }

  private setCalleeViewport = (viewportRect: Rect) => {
    const {callerCallee} = this.state
    if (!callerCallee) return

    const calleeConfigSpaceViewportRect = this.clampViewportToFlamegraph(
      viewportRect,
      callerCallee.calleeFlamegraph,
    )
    this.setState({
      callerCallee: {
        ...callerCallee,
        calleeConfigSpaceViewportRect,
      },
    })
  }

  private setInvertedCallerViewport = (viewportRect: Rect) => {
    const {callerCallee} = this.state
    if (!callerCallee) return

    const invertedCallerConfigSpaceViewportRect = this.clampViewportToFlamegraph(
      viewportRect,
      callerCallee.invertedCallerFlamegraph,
    )
    this.setState({
      callerCallee: {
        ...callerCallee,
        invertedCallerConfigSpaceViewportRect,
      },
    })
  }

  private transformCalleeViewport = (transform: AffineTransform) => {
    const {callerCallee} = this.state
    if (!callerCallee) return
    const viewportRect = transform.transformRect(callerCallee.calleeConfigSpaceViewportRect)
    this.setCalleeViewport(viewportRect)
  }

  private transformInvertedCallerViewport = (transform: AffineTransform) => {
    const {callerCallee} = this.state
    if (!callerCallee) return
    const viewportRect = transform.transformRect(callerCallee.invertedCallerConfigSpaceViewportRect)
    this.setInvertedCallerViewport(viewportRect)
  }

  render() {
    const {canvasContext} = this.props
    const {callerCallee} = this.state

    let selectedFrame: Frame | null = null
    let calleeFlamechartView: JSX.Element | null = null

    if (callerCallee) {
      selectedFrame = callerCallee.selectedFrame
      calleeFlamechartView = (
        <div className={css(commonStyle.vbox, commonStyle.fillY)}>
          <FlamechartPanZoomView
            flamechart={callerCallee.invertedCallerFlamegraph}
            canvasContext={canvasContext}
            flamechartRenderer={callerCallee.invertedCallerFlamegraphRenderer}
            selectedNode={null}
            setNodeHover={() => {}}
            setSelectedNode={() => {}}
            configSpaceViewportRect={callerCallee.invertedCallerConfigSpaceViewportRect}
            setConfigSpaceViewportRect={this.setInvertedCallerViewport}
            transformViewport={this.transformInvertedCallerViewport}
          />
          <div className={css(style.divider)} />
          <FlamechartPanZoomView
            flamechart={callerCallee.calleeFlamegraph}
            canvasContext={canvasContext}
            flamechartRenderer={callerCallee.calleeFlamegraphRenderer}
            selectedNode={null}
            setNodeHover={() => {}}
            setSelectedNode={() => {}}
            configSpaceViewportRect={callerCallee.calleeConfigSpaceViewportRect}
            setConfigSpaceViewportRect={this.setCalleeViewport}
            transformViewport={this.transformCalleeViewport}
          />
        </div>
      )
    }

    return (
      <div className={css(commonStyle.hbox, commonStyle.fillY)}>
        <div className={css(style.tableView)}>
          <ProfileTableView
            selectedFrame={selectedFrame}
            setSelectedFrame={this.setSelectedFrame}
            profile={this.props.profile}
            getCSSColorForFrame={this.props.getCSSColorForFrame}
            sortMethod={this.props.sortMethod}
            setSortMethod={this.props.setSortMethod}
          />
        </div>
        <div className={css(commonStyle.fillY, style.callersAndCallees, commonStyle.vbox)}>
          {calleeFlamechartView}
        </div>
      </div>
    )
  }
}

const style = StyleSheet.create({
  tableView: {
    width: '50%',
  },
  callersAndCallees: {
    flex: 1,
    borderLeft: `${Sizes.SEPARATOR_HEIGHT}px solid ${Colors.LIGHT_GRAY}`,
  },
  divider: {
    height: 2,
    background: Colors.LIGHT_GRAY,
  },
})
