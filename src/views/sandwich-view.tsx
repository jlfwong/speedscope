import {Frame} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableViewContainer, SortField, SortDirection} from './profile-table-view'
import {h, JSX, createContext} from 'preact'
import {memo} from 'preact/compat'
import {useCallback, useMemo, useContext} from 'preact/hooks'
import {commonStyle, Sizes, Colors, FontSize} from './style'
import {actions} from '../store/actions'
import {StatelessComponent} from '../lib/typed-redux'
import {InvertedCallerFlamegraphView} from './inverted-caller-flamegraph-view'
import {CalleeFlamegraphView} from './callee-flamegraph-view'
import {useDispatch} from '../lib/preact-redux'
import {SandwichSearchView} from './sandwich-search-view'
import {useAppSelector, ActiveProfileState} from '../store'
import {sortBy} from '../lib/utils'
import {ProfileSearchContext} from './search-view'
import {FuzzyMatch} from '../lib/fuzzy-find'

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
          <SandwichSearchView />
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

interface SandwichViewContextData {
  rowList: Frame[]
  getIndexForFrame: (frame: Frame) => number | null
  getSearchMatchForFrame: (frame: Frame) => FuzzyMatch | null
}

export const SandwichViewContext = createContext<SandwichViewContextData | null>(null)

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

  const profile = activeProfileState.profile
  const tableSortMethod = useAppSelector(state => state.tableSortMethod, [])
  const profileSearchResults = useContext(ProfileSearchContext)

  const sandwichViewContextData: SandwichViewContextData | null = useMemo(() => {
    const rowList: Frame[] = []
    const indexByFrame = new Map<Frame, number>()

    profile.forEachFrame(frame => {
      if (profileSearchResults && !profileSearchResults.getMatchForFrame(frame)) {
        return
      }
      rowList.push(frame)
    })

    switch (tableSortMethod.field) {
      case SortField.SYMBOL_NAME: {
        sortBy(rowList, f => f.name.toLowerCase())
        break
      }
      case SortField.SELF: {
        sortBy(rowList, f => f.getSelfWeight())
        break
      }
      case SortField.TOTAL: {
        sortBy(rowList, f => f.getTotalWeight())
        break
      }
    }
    if (tableSortMethod.direction === SortDirection.DESCENDING) {
      rowList.reverse()
    }

    for (let i = 0; i < rowList.length; i++) {
      indexByFrame.set(rowList[i], i)
    }

    return {
      rowList,
      getIndexForFrame: (frame: Frame): number | null => {
        const idx = indexByFrame.get(frame)
        return idx == null ? null : idx
      },
      getSearchMatchForFrame: (frame: Frame): FuzzyMatch | null => {
        return profileSearchResults == null ? null : profileSearchResults.getMatchForFrame(frame)
      },
    }
  }, [profile, profileSearchResults, tableSortMethod])

  return (
    <SandwichViewContext.Provider value={sandwichViewContextData}>
      <SandwichView
        activeProfileState={activeProfileState}
        glCanvas={glCanvas}
        setSelectedFrame={setSelectedFrame}
        selectedFrame={callerCallee ? callerCallee.selectedFrame : null}
        profileIndex={index}
      />
    </SandwichViewContext.Provider>
  )
})
