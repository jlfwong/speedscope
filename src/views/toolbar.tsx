import {ApplicationProps} from './application'
import {ViewMode} from '../store'
import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {Sizes, Colors, FontFamily, FontSize, Duration} from './style'

interface ToolbarProps extends ApplicationProps {
  browseForFile(): void
  saveFile(): void
}

export function Toolbar(props: ToolbarProps) {
  const setTimeOrder = () => {
    props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
  }

  const setLeftHeavyOrder = () => {
    props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
  }

  const setSandwichView = () => {
    props.setViewMode(ViewMode.SANDWICH_VIEW)
  }

  const renderLeftContent = () => {
    if (!props.activeProfileState) return null

    return (
      <div className={css(style.toolbarLeft)}>
        <div
          className={css(
            style.toolbarTab,
            props.viewMode === ViewMode.CHRONO_FLAME_CHART && style.toolbarTabActive,
          )}
          onClick={setTimeOrder}
        >
          <span className={css(style.emoji)}>🕰</span>Time Order
        </div>
        <div
          className={css(
            style.toolbarTab,
            props.viewMode === ViewMode.LEFT_HEAVY_FLAME_GRAPH && style.toolbarTabActive,
          )}
          onClick={setLeftHeavyOrder}
        >
          <span className={css(style.emoji)}>⬅️</span>Left Heavy
        </div>
        <div
          className={css(
            style.toolbarTab,
            props.viewMode === ViewMode.SANDWICH_VIEW && style.toolbarTabActive,
          )}
          onClick={setSandwichView}
        >
          <span className={css(style.emoji)}>🥪</span>Sandwich
        </div>
      </div>
    )
  }

  const renderCenterContent = () => {
    const {activeProfileState, profileGroup} = props
    if (activeProfileState && profileGroup) {
      const {index} = activeProfileState
      if (profileGroup.profiles.length === 1) {
        return activeProfileState.profile.getName()
      } else {
        function makeNavButton(content: string, disabled: boolean, onClick: () => void) {
          return (
            <button
              disabled={disabled}
              onClick={onClick}
              className={css(
                style.emoji,
                style.toolbarProfileNavButton,
                disabled && style.toolbarProfileNavButtonDisabled,
              )}
            >
              {content}
            </button>
          )
        }

        const prevButton = makeNavButton('⬅️', index === 0, () =>
          props.setProfileIndexToView(index - 1),
        )
        const nextButton = makeNavButton('➡️', index >= profileGroup.profiles.length - 1, () =>
          props.setProfileIndexToView(index + 1),
        )

        return (
          <div className={css(style.toolbarCenter)}>
            {prevButton}
            {activeProfileState.profile.getName()}{' '}
            <span className={css(style.toolbarProfileIndex)}>
              ({activeProfileState.index + 1}/{profileGroup.profiles.length})
            </span>
            {nextButton}
          </div>
        )
      }
    }
    return '🔬speedscope'
  }

  const renderRightContent = () => {
    const importFile = (
      <div className={css(style.toolbarTab)} onClick={props.browseForFile}>
        <span className={css(style.emoji)}>⤵️</span>Import
      </div>
    )
    const help = (
      <div className={css(style.toolbarTab)}>
        <a
          href="https://github.com/jlfwong/speedscope#usage"
          className={css(style.noLinkStyle)}
          target="_blank"
        >
          <span className={css(style.emoji)}>❓</span>Help
        </a>
      </div>
    )

    return (
      <div className={css(style.toolbarRight)}>
        {props.activeProfileState && (
          <div className={css(style.toolbarTab)} onClick={props.saveFile}>
            <span className={css(style.emoji)}>⤴️</span>Export
          </div>
        )}
        {importFile}
        {help}
      </div>
    )
  }

  return (
    <div className={css(style.toolbar)}>
      {renderLeftContent()}
      {renderCenterContent()}
      {renderRightContent()}
    </div>
  )
}

const style = StyleSheet.create({
  toolbar: {
    height: Sizes.TOOLBAR_HEIGHT,
    flexShrink: 0,
    background: Colors.BLACK,
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily: FontFamily.MONOSPACE,
    fontSize: FontSize.TITLE,
    lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
    userSelect: 'none',
  },
  toolbarLeft: {
    position: 'absolute',
    height: Sizes.TOOLBAR_HEIGHT,
    overflow: 'hidden',
    top: 0,
    left: 0,
    marginRight: 2,
    textAlign: 'left',
  },
  toolbarCenter: {
    paddingTop: 1,
    height: Sizes.TOOLBAR_HEIGHT,
  },
  toolbarRight: {
    height: Sizes.TOOLBAR_HEIGHT,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    right: 0,
    marginRight: 2,
    textAlign: 'right',
  },
  toolbarProfileIndex: {
    color: Colors.LIGHT_GRAY,
  },
  toolbarProfileNavButton: {
    opacity: 0.8,
    fontSize: FontSize.TITLE,
    lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
    ':hover': {
      opacity: 1.0,
    },
    background: 'none',
    border: 'none',
    padding: 0,
    marginLeft: '0.3em',
    marginRight: '0.3em',
    transition: `all ${Duration.HOVER_CHANGE} ease-in`,
  },
  toolbarProfileNavButtonDisabled: {
    opacity: 0.5,
    ':hover': {
      opacity: 0.5,
    },
  },
  toolbarTab: {
    background: Colors.DARK_GRAY,
    marginTop: Sizes.SEPARATOR_HEIGHT,
    height: Sizes.TOOLBAR_TAB_HEIGHT,
    lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
    paddingLeft: 2,
    paddingRight: 8,
    display: 'inline-block',
    marginLeft: 2,
    transition: `all ${Duration.HOVER_CHANGE} ease-in`,
    ':hover': {
      background: Colors.GRAY,
    },
  },
  toolbarTabActive: {
    background: Colors.BRIGHT_BLUE,
    ':hover': {
      background: Colors.BRIGHT_BLUE,
    },
  },
  emoji: {
    display: 'inline-block',
    verticalAlign: 'middle',
    paddingTop: '0px',
    marginRight: '0.3em',
  },
  noLinkStyle: {
    textDecoration: 'none',
    color: 'inherit',
  },
})
