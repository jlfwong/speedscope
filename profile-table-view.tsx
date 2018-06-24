import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'
import {Profile, Frame} from './profile'
import {sortBy, formatPercent} from './utils'
import {FontSize, Colors, Sizes, commonStyle} from './style'
import {ColorChit} from './color-chit'
import {ScrollableListView, ListItem} from './scrollable-list-view'

export enum SortField {
  SYMBOL_NAME,
  SELF,
  TOTAL,
}

export enum SortDirection {
  ASCENDING,
  DESCENDING,
}

export interface SortMethod {
  field: SortField
  direction: SortDirection
}

interface HBarProps {
  perc: number
}

class HBarDisplay extends Component<HBarProps, {}> {
  render() {
    return (
      <div className={css(style.hBarDisplay)}>
        <div className={css(style.hBarDisplayFilled)} style={{width: `${this.props.perc}%`}} />
      </div>
    )
  }
}

interface SortIconProps {
  activeDirection: SortDirection | null
}

class SortIcon extends Component<SortIconProps, {}> {
  render() {
    const {activeDirection} = this.props
    const upFill = activeDirection === SortDirection.ASCENDING ? Colors.GRAY : Colors.LIGHT_GRAY
    const downFill = activeDirection === SortDirection.DESCENDING ? Colors.GRAY : Colors.LIGHT_GRAY

    return (
      <svg
        width="8"
        height="10"
        viewBox="0 0 8 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={css(style.sortIcon)}
      >
        <path d="M0 4L4 0L8 4H0Z" fill={upFill} />
        <path d="M0 4L4 0L8 4H0Z" transform="translate(0 10) scale(1 -1)" fill={downFill} />
      </svg>
    )
  }
}

interface ProfileTableViewProps {
  profile: Profile
  getCSSColorForFrame: (frame: Frame) => string
  sortMethod: SortMethod
  setSortMethod: (sortMethod: SortMethod) => void
}

export class ProfileTableView extends ReloadableComponent<ProfileTableViewProps, void> {
  renderRow(frame: Frame, index: number) {
    const {profile} = this.props

    const totalWeight = frame.getTotalWeight()
    const selfWeight = frame.getSelfWeight()
    const totalPerc = 100.0 * totalWeight / profile.getTotalNonIdleWeight()
    const selfPerc = 100.0 * selfWeight / profile.getTotalNonIdleWeight()

    // We intentionally use index rather than frame.key here as the tr key
    // in order to re-use rows when sorting rather than creating all new elements.
    return (
      <tr key={`${index}`} className={css(style.tableRow, index % 2 == 0 && style.tableRowEven)}>
        <td className={css(style.numericCell)}>
          {profile.formatValue(totalWeight)} ({formatPercent(totalPerc)})
          <HBarDisplay perc={totalPerc} />
        </td>
        <td className={css(style.numericCell)}>
          {profile.formatValue(selfWeight)} ({formatPercent(selfPerc)})
          <HBarDisplay perc={selfPerc} />
        </td>
        <td title={frame.file} className={css(style.textCell)}>
          <ColorChit color={this.props.getCSSColorForFrame(frame)} />
          {frame.name}
        </td>
      </tr>
    )
  }

  onSortClick = (field: SortField, ev: MouseEvent) => {
    ev.preventDefault()

    const {sortMethod} = this.props

    if (sortMethod.field == field) {
      // Toggle
      this.props.setSortMethod({
        field,
        direction:
          sortMethod.direction === SortDirection.ASCENDING
            ? SortDirection.DESCENDING
            : SortDirection.ASCENDING,
      })
    } else {
      // Set a sane default
      switch (field) {
        case SortField.SYMBOL_NAME: {
          this.props.setSortMethod({field, direction: SortDirection.ASCENDING})
          break
        }
        case SortField.SELF: {
          this.props.setSortMethod({field, direction: SortDirection.DESCENDING})
          break
        }
        case SortField.TOTAL: {
          this.props.setSortMethod({field, direction: SortDirection.DESCENDING})
          break
        }
      }
    }
  }

  render() {
    const {profile, sortMethod} = this.props

    const frameList: Frame[] = []

    profile.forEachFrame(f => frameList.push(f))

    // TODO(jlfwong): This is pretty inefficient to do this on every render, but doesn't
    // seem to be a bottleneck, so we'll leave it alone.
    switch (sortMethod.field) {
      case SortField.SYMBOL_NAME: {
        sortBy(frameList, f => f.name.toLowerCase())
        break
      }
      case SortField.SELF: {
        sortBy(frameList, f => f.getSelfWeight())
        break
      }
      case SortField.TOTAL: {
        sortBy(frameList, f => f.getTotalWeight())
        break
      }
    }
    if (sortMethod.direction === SortDirection.DESCENDING) {
      frameList.reverse()
    }

    const renderItems = (firstIndex: number, lastIndex: number) => {
      const rows: JSX.Element[] = []

      for (let i = firstIndex; i <= lastIndex; i++) {
        rows.push(this.renderRow(frameList[i], i))
      }

      return <table className={css(style.tableView)}>{rows}</table>
    }

    const listItems: ListItem[] = frameList.map(f => ({size: Sizes.FRAME_HEIGHT}))

    return (
      <div className={css(commonStyle.vbox, style.profileTableView)}>
        <table className={css(style.tableView)}>
          <thead className={css(style.tableHeader)}>
            <tr>
              <th
                className={css(style.numericCell)}
                onClick={ev => this.onSortClick(SortField.TOTAL, ev)}
              >
                <SortIcon
                  activeDirection={
                    sortMethod.field === SortField.TOTAL ? sortMethod.direction : null
                  }
                />
                Total
              </th>
              <th
                className={css(style.numericCell)}
                onClick={ev => this.onSortClick(SortField.SELF, ev)}
              >
                <SortIcon
                  activeDirection={
                    sortMethod.field === SortField.SELF ? sortMethod.direction : null
                  }
                />
                Self
              </th>
              <th
                className={css(style.textCell)}
                onClick={ev => this.onSortClick(SortField.SYMBOL_NAME, ev)}
              >
                <SortIcon
                  activeDirection={
                    sortMethod.field === SortField.SYMBOL_NAME ? sortMethod.direction : null
                  }
                />
                Symbol Name
              </th>
            </tr>
          </thead>
        </table>
        <ScrollableListView
          items={listItems}
          className={css(style.scrollView)}
          renderItems={renderItems}
        />
      </div>
    )
  }
}

const style = StyleSheet.create({
  profileTableView: {
    background: Colors.WHITE,
    height: '100%',
  },
  scrollView: {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  tableView: {
    width: '100%',
    fontSize: FontSize.LABEL,
    background: Colors.WHITE,
    cursor: 'default',
  },
  tableHeader: {
    borderBottom: `2px solid ${Colors.LIGHT_GRAY}`,
    textAlign: 'left',
    color: Colors.GRAY,
    userSelect: 'none',
  },
  sortIcon: {
    position: 'relative',
    top: 1,
    marginRight: Sizes.FRAME_HEIGHT / 4,
  },
  tableRow: {
    height: Sizes.FRAME_HEIGHT,
  },
  tableRowEven: {
    background: Colors.OFF_WHITE,
  },
  numericCell: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    position: 'relative',
    textAlign: 'right',
    paddingRight: Sizes.FRAME_HEIGHT,
    width: 6 * Sizes.FRAME_HEIGHT,
    minWidth: 6 * Sizes.FRAME_HEIGHT,
  },
  textCell: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    width: '100%',
    maxWidth: 0,
  },
  hBarDisplay: {
    position: 'absolute',
    background: Colors.TRANSPARENT_GREEN,
    bottom: 2,
    height: 2,
    width: `calc(100% - ${2 * Sizes.FRAME_HEIGHT}px)`,
    right: Sizes.FRAME_HEIGHT,
  },
  hBarDisplayFilled: {
    height: '100%',
    position: 'absolute',
    background: Colors.GREEN,
    right: 0,
  },
})
