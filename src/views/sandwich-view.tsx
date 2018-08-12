import {Frame} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableViewContainer} from './profile-table-view'
import {h} from 'preact'
import {commonStyle, Sizes, Colors, FontSize} from './style'
import {actions} from '../store/actions'
import {createContainer, Dispatch, StatelessComponent} from '../lib/typed-redux'
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

class SandwichView extends StatelessComponent<SandwichViewProps> {
  private setSelectedFrame = (selectedFrame: Frame | null) => {
    this.props.setSelectedFrame(selectedFrame)
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.setSelectedFrame(null)
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyPress)
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyPress)
  }

  render() {
    const {selectedFrame} = this.props
    let flamegraphViews: JSX.Element | null = null

    if (selectedFrame) {
      flamegraphViews = (
        <div className={css(commonStyle.fillY, style.callersAndCallees, commonStyle.vbox)}>
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
    }

    return (
      <div className={css(commonStyle.hbox, commonStyle.fillY)}>
        <div className={css(style.tableView)}>
          <ProfileTableViewContainer activeProfileState={this.props.activeProfileState} />
        </div>
        {flamegraphViews}
      </div>
    )
  }
}

const style = StyleSheet.create({
  tableView: {
    flex: 1,
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
    flex: 1,
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
