import {Frame} from '../lib/profile'
import {StyleSheet, css} from 'aphrodite'
import {ProfileTableViewContainer, SortField, SortDirection} from './profile-table-view'
import {h, JSX, createContext} from 'preact'
import {memo} from 'preact/compat'
import {useCallback, useMemo, useContext} from 'preact/hooks'
import {commonStyle, Sizes, FontSize} from './style'
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
import {Theme, useTheme, withTheme} from './themes/theme'

interface SandwichViewProps {
  selectedFrame: Frame | null
  profileIndex: number
  theme: Theme
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
    const style = getStyle(this.props.theme)

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

const getStyle = withTheme(theme =>
  StyleSheet.create({
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
      borderRight: `1px solid ${theme.fgSecondaryColor}`,
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
      borderLeft: `${Sizes.SEPARATOR_HEIGHT}px solid ${theme.fgSecondaryColor}`,
    },
    divider: {
      height: 2,
      background: theme.fgSecondaryColor,
    },
  }),
)

interface SandwichViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
}

interface SandwichViewContextData {
  rowList: Frame[]
  selectedFrame: Frame | null
  setSelectedFrame: (frame: Frame | null) => void
  getIndexForFrame: (frame: Frame) => number | null
  getSearchMatchForFrame: (frame: Frame) => FuzzyMatch | null
}

export const SandwichViewContext = createContext<SandwichViewContextData | null>(null)

export const SandwichViewContainer = memo((ownProps: SandwichViewContainerProps) => {
  const {activeProfileState, glCanvas} = ownProps
  const {sandwichViewState, index} = activeProfileState
  const {callerCallee} = sandwichViewState

  const theme = useTheme()
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

  const selectedFrame = callerCallee ? callerCallee.selectedFrame : null

  const rowList: Frame[] = useMemo(() => {
    const rowList: Frame[] = []

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

    return rowList
  }, [profile, profileSearchResults, tableSortMethod])

  const getIndexForFrame: (frame: Frame) => number | null = useMemo(() => {
    const indexByFrame = new Map<Frame, number>()
    for (let i = 0; i < rowList.length; i++) {
      indexByFrame.set(rowList[i], i)
    }
    return (frame: Frame) => {
      const index = indexByFrame.get(frame)
      return index == null ? null : index
    }
  }, [rowList])

  const getSearchMatchForFrame: (frame: Frame) => FuzzyMatch | null = useMemo(() => {
    return (frame: Frame) => {
      if (profileSearchResults == null) return null
      return profileSearchResults.getMatchForFrame(frame)
    }
  }, [profileSearchResults])

  const contextData: SandwichViewContextData = {
    rowList,
    selectedFrame,
    setSelectedFrame,
    getIndexForFrame,
    getSearchMatchForFrame,
  }

  return (
    <SandwichViewContext.Provider value={contextData}>
      <SandwichView
        theme={theme}
        activeProfileState={activeProfileState}
        glCanvas={glCanvas}
        setSelectedFrame={setSelectedFrame}
        selectedFrame={selectedFrame}
        profileIndex={index}
      />
    </SandwichViewContext.Provider>
  )
})
