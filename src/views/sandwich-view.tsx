import {Frame} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableViewContainer} from './profile-table-view'
import {h, Component} from 'preact'
import {commonStyle, Sizes, Colors, FontSize} from './style'
import {actions} from '../store/actions'
import {createContainer, Dispatch} from '../lib/typed-redux'
import {ApplicationState} from '../store'
import {InvertedCallerFlamegraphView} from './inverted-caller-flamegraph-view'
import {CalleeFlamegraphView} from './callee-flamegraph-view'
import {ActiveProfileState} from './application'

interface SandwichViewProps {
  selectedFrame: Frame | null
  profileIndex: number
  activeProfileState: ActiveProfileState
  setSelectedFrame: (selectedFrame: Frame | null) => void
  glCanvas: HTMLCanvasElement
}

interface SandwichViewState {
  isDragging: boolean
  resizerPos: number | null
  initialPos: number
  delta: number
}

class SandwichView extends Component<SandwichViewProps, SandwichViewState> {
  constructor(props: SandwichViewProps) {
    super(props)
    this.state = {
      isDragging: false,
      resizerPos: null,
      initialPos: 0,
      delta: 0,
    }
  }

  startResize = (e: MouseEvent) => {
    this.setState({
      isDragging: true,
      initialPos: e.clientX,
      delta: 0,
    })
  }

  resizeViews = (e: MouseEvent) => {
    if (this.state.isDragging) {
      let delta = e.clientX - this.state.initialPos
      this.setState({delta: delta})
    }
  }

  stopResize = (e: MouseEvent) => {
    if (this.state.isDragging) {
      let resizerPos = this.state.resizerPos
      if (!resizerPos) {
        resizerPos = this.state.initialPos
      }
      this.setState({
        isDragging: false,
        resizerPos: resizerPos + this.state.delta,
        delta: 0,
      })
    }
  }

  private setSelectedFrame = (selectedFrame: Frame | null) => {
    this.props.setSelectedFrame(selectedFrame)
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.setSelectedFrame(null)
    }
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.resizeViews)
    window.addEventListener('mouseup', this.stopResize)
    window.addEventListener('mouseleave', this.stopResize)
    window.addEventListener('keydown', this.onWindowKeyPress)
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyPress)
    window.removeEventListener('mouseleave', this.stopResize)
    window.removeEventListener('mouseup', this.stopResize)
    window.removeEventListener('mousemove', this.resizeViews)
  }

  render() {
    const {selectedFrame} = this.props
    let container: JSX.Element | null = null
    let functionsView: JSX.Element | null = null
    let resizer: JSX.Element | null = null
    let flamegraphViews: JSX.Element | null = null

    if (selectedFrame) {
      functionsView = (
        <div
          className={css(style.tableView)}
          style={{
            width: `calc(100% - ${this.state.resizerPos ? this.state.resizerPos + 'px' : '50%'})`,
          }}
        >
          <ProfileTableViewContainer activeProfileState={this.props.activeProfileState} />
        </div>
      )
      resizer = (
        <div
          className={css(style.resizer)}
          style={{left: this.state.delta}}
          onMouseDown={e => this.startResize(e)}
        />
      )
      flamegraphViews = (
        <div
          className={css(commonStyle.fillY, style.callersAndCallees, commonStyle.vbox)}
          style={{
            width: `calc(100% - ${this.state.resizerPos ? this.state.resizerPos + 'px' : '50%'})`,
          }}
        >
          <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
            <div className={css(style.flamechartLabelParent)}>
              <div className={css(style.flamechartLabel)}>Callers</div>
            </div>
            <InvertedCallerFlamegraphView
              glCanvas={this.props.glCanvas}
              activeProfileState={this.props.activeProfileState}
            />
          </div>
          <div className={css(style.divider)} />
          <div className={css(commonStyle.hbox, style.panZoomViewWraper)}>
            <div className={css(style.flamechartLabelParent, style.flamechartLabelParentBottom)}>
              <div className={css(style.flamechartLabel, style.flamechartLabelBottom)}>Callees</div>
            </div>
            <CalleeFlamegraphView
              glCanvas={this.props.glCanvas}
              activeProfileState={this.props.activeProfileState}
            />
          </div>
        </div>
      )
    } else {
      functionsView = (
        <div className={css(style.tableView)}>
          <ProfileTableViewContainer activeProfileState={this.props.activeProfileState} />
        </div>
      )
    }

    container = (
      <div
        className={css(commonStyle.hbox, commonStyle.fillY, style.flexDisplay)}
        onMouseUp={e => this.stopResize(e)}
      >
        {functionsView}
        {resizer}
        {flamegraphViews}
      </div>
    )

    return container
  }
}

const style = StyleSheet.create({
  flexDisplay: {
    display: 'flex',
  },
  resizer: {
    width: '8px',
    position: 'relative',
    cursor: 'col-resize',
    flexShrink: 0,
  },
  tableView: {
    flex: '1 1 auto',
    boxSizing: 'border-box',
  },
  panZoomViewWraper: {
    flex: 1,
  },
  flamechartLabelParent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    fontSize: FontSize.TITLE,
    width: FontSize.TITLE * 1.2,
    borderRight: `1px solid ${Colors.LIGHT_GRAY}`,
  },
  flamechartLabelParentBottom: {
    justifyContent: 'flex-start',
  },
  flamechartLabel: {
    transform: 'rotate(-90deg)',
    transformOrigin: '50% 50% 0',
    width: FontSize.TITLE * 1.2,
    flexShrink: 1,
  },
  flamechartLabelBottom: {
    transform: 'rotate(-90deg)',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  callersAndCallees: {
    flex: '1 1 auto',
    boxSizing: 'border-box',
    borderLeft: `${Sizes.SEPARATOR_HEIGHT}px solid ${Colors.LIGHT_GRAY}`,
  },
  divider: {
    height: 2,
    background: Colors.LIGHT_GRAY,
  },
})

interface SandwichViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
}

export const SandwichViewContainer = createContainer(
  SandwichView,
  (state: ApplicationState, dispatch: Dispatch, ownProps: SandwichViewContainerProps) => {
    const {activeProfileState, glCanvas} = ownProps
    const {sandwichViewState, index} = activeProfileState
    const {callerCallee} = sandwichViewState

    const setSelectedFrame = (selectedFrame: Frame | null) => {
      dispatch(
        actions.sandwichView.setSelectedFrame({
          profileIndex: index,
          args: selectedFrame,
        }),
      )
    }

    return {
      activeProfileState: activeProfileState,
      glCanvas,
      setSelectedFrame,
      selectedFrame: callerCallee ? callerCallee.selectedFrame : null,
      profileIndex: index,
    }
  },
)
