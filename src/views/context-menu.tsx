import {h, Component} from 'preact'
import {css, StyleSheet} from 'aphrodite'
import {FontSize, FontFamily} from './style'
import {Theme} from './themes/theme'

export interface ContextMenuItem {
  label: string
  onClick: () => void
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  x: number
  y: number
  theme: Theme
  onClose: () => void
}

interface ContextMenuState {}

export class ContextMenu extends Component<ContextMenuProps, ContextMenuState> {
  private menuRef: HTMLDivElement | null = null

  componentDidMount() {
    // Add listeners to close the menu when clicking outside
    document.addEventListener('mousedown', this.handleClickOutside)
    document.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('blur', this.handleClose)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
    document.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('blur', this.handleClose)
  }

  private handleClickOutside = (ev: MouseEvent) => {
    if (this.menuRef && !this.menuRef.contains(ev.target as Node)) {
      this.props.onClose()
    }
  }

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.props.onClose()
    }
  }

  private handleClose = () => {
    this.props.onClose()
  }

  private handleItemClick = (item: ContextMenuItem) => {
    item.onClick()
    this.props.onClose()
  }

  private getStyle() {
    const {theme} = this.props
    return StyleSheet.create({
      menu: {
        position: 'fixed',
        zIndex: 10000,
        backgroundColor: theme.bgPrimaryColor,
        border: `1px solid ${theme.fgSecondaryColor}`,
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        padding: '4px 0',
        minWidth: 180,
        fontFamily: FontFamily.MONOSPACE,
        fontSize: FontSize.LABEL,
      },
      menuItem: {
        padding: '6px 12px',
        cursor: 'pointer',
        color: theme.fgPrimaryColor,
        ':hover': {
          backgroundColor: theme.selectionPrimaryColor,
          color: theme.altFgPrimaryColor,
        },
      },
    })
  }

  render() {
    const {items, x, y} = this.props
    const style = this.getStyle()

    // Adjust position to keep menu in viewport
    const menuWidth = 180
    const menuHeight = items.length * 30 + 8
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10)
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10)

    return (
      <div
        ref={el => (this.menuRef = el)}
        className={css(style.menu)}
        style={{left: adjustedX, top: adjustedY}}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={css(style.menuItem)}
            onClick={() => this.handleItemClick(item)}
          >
            {item.label}
          </div>
        ))}
      </div>
    )
  }
}
