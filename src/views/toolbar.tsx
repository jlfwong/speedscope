import {ApplicationProps} from './application'
import {StatelessComponent} from '../lib/typed-redux'
import {ViewMode} from '../store'
import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {Sizes, Colors, FontFamily, FontSize, Duration} from './style'

interface ToolbarProps extends ApplicationProps {
  browseForFile(): void
  saveFile(): void
}

export class Toolbar extends StatelessComponent<ToolbarProps> {
  setTimeOrder = () => {
    this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
  }

  setLeftHeavyOrder = () => {
    this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
  }

  setSandwichView = () => {
    this.props.setViewMode(ViewMode.SANDWICH_VIEW)
  }

  renderLeftContent() {
    if (!this.props.activeProfileState) return null

    return (
      <div className={css(style.toolbarLeft)}>
        <div
          className={css(
            style.toolbarTab,
            this.props.viewMode === ViewMode.CHRONO_FLAME_CHART && style.toolbarTabActive,
          )}
          onClick={this.setTimeOrder}
        >
          <span className={css(style.emoji)}>🕰</span>Time Order
        </div>
        <div
          className={css(
            style.toolbarTab,
            this.props.viewMode === ViewMode.LEFT_HEAVY_FLAME_GRAPH && style.toolbarTabActive,
          )}
          onClick={this.setLeftHeavyOrder}
        >
          <span className={css(style.emoji)}>⬅️</span>Left Heavy
        </div>
        <div
          className={css(
            style.toolbarTab,
            this.props.viewMode === ViewMode.SANDWICH_VIEW && style.toolbarTabActive,
          )}
          onClick={this.setSandwichView}
        >
          <span className={css(style.emoji)}>🥪</span>Sandwich
        </div>
      </div>
    )
  }

  renderCenterContent() {
    const {activeProfileState, profileGroup} = this.props
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
          this.props.setProfileIndexToView(index - 1),
        )
        const nextButton = makeNavButton('➡️', index >= profileGroup.profiles.length - 1, () =>
          this.props.setProfileIndexToView(index + 1),
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

  renderRightContent() {
    const importFile = (
      <div className={css(style.toolbarTab)} onClick={this.props.browseForFile}>
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
        {this.props.activeProfileState && (
          <div className={css(style.toolbarTab)} onClick={this.props.saveFile}>
            <span className={css(style.emoji)}>⤴️</span>Export
          </div>
        )}
        {importFile}
        {help}
      </div>
    )
  }

  render() {
    return (
      <div className={css(style.toolbar)}>
        {this.renderLeftContent()}
        {this.renderCenterContent()}
        {this.renderRightContent()}
      </div>
    )
  }
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
