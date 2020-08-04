import {Frame} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableViewContainer} from './profile-table-view'
import {h, JSX} from 'preact'
import {memo} from 'preact/compat'
import {useCallback} from 'preact/hooks'
import {commonStyle, Sizes, Colors, FontSize} from './style'
import {actions} from '../store/actions'
import {StatelessComponent} from '../lib/typed-redux'
import {InvertedCallerFlamegraphView} from './inverted-caller-flamegraph-view'
import {CalleeFlamegraphView} from './callee-flamegraph-view'
import {useDispatch, useActionCreator} from '../lib/preact-redux'
import {SearchView} from './search-view'
import {useAppSelector, ActiveProfileState} from '../store'

interface SandwichViewProps {
  selectedFrame: Frame | null
  profileIndex: number
  activeProfileState: ActiveProfileState
  setSelectedFrame: (selectedFrame: Frame | null) => void
  glCanvas: HTMLCanvasElement
  searchQuery: string
  searchIsActive: boolean
  setSearchQuery: (query: string | null) => void
  setSearchIsActive: (active: boolean) => void
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
          <SearchView selectedNode={null} setSelectedNode={null} />
        </div>
        {flamegraphViews}
      </div>
    )
  }
}

const style = StyleSheet.create({
  tableView: {
    position: 'relative',
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

const {setSearchQuery, setSearchIsActive} = actions

export const SandwichViewContainer = memo((ownProps: SandwichViewContainerProps) => {
  const {activeProfileState, glCanvas} = ownProps
  const {sandwichViewState, index} = activeProfileState
  const {callerCallee} = sandwichViewState

  const dispatch = useDispatch()
  const setSelectedFrame = useCallback(
    (selectedFrame: Frame | null) => {
      dispatch(
        actions.sandwichView.setSelectedFrame({
          profileIndex: index,
          args: selectedFrame,
        }),
      )
    },
    [dispatch, index],
  )

  return (
    <SandwichView
      activeProfileState={activeProfileState}
      glCanvas={glCanvas}
      setSelectedFrame={setSelectedFrame}
      selectedFrame={callerCallee ? callerCallee.selectedFrame : null}
      profileIndex={index}
      searchQuery={useAppSelector(state => state.searchQuery, [])}
      setSearchQuery={useActionCreator(setSearchQuery, [])}
      searchIsActive={useAppSelector(state => state.searchIsActive, [])}
      setSearchIsActive={useActionCreator(setSearchIsActive, [])}
    />
  )
})
