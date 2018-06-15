import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'
import {Profile, Frame} from './profile'
import {sortBy, formatPercent} from './utils'
import {FontSize, Colors, Sizes} from './style'
import {ColorChit} from './color-chit'

interface ProfileTableViewProps {
  profile: Profile
  getCSSColorForFrame: (frame: Frame) => string
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

export class ProfileTableView extends ReloadableComponent<ProfileTableViewProps, void> {
  renderRow(frame: Frame, index: number) {
    const {profile} = this.props

    const totalWeight = frame.getTotalWeight()
    const selfWeight = frame.getSelfWeight()
    const totalPerc = 100.0 * totalWeight / profile.getTotalNonIdleWeight()
    const selfPerc = 100.0 * selfWeight / profile.getTotalNonIdleWeight()

    return (
      <tr
        key={`${frame.key}`}
        className={css(style.tableRow, index % 2 == 0 && style.tableRowEven)}
      >
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

  render() {
    const {profile} = this.props

    const frameList: Frame[] = []

    profile.forEachFrame(f => frameList.push(f))
    sortBy(frameList, f => -f.getSelfWeight())

    const rows: JSX.Element[] = frameList.map((f, i) => this.renderRow(f, i))

    return (
      <div className={css(style.vbox)}>
        <table className={css(style.tableView)}>
          <thead className={css(style.tableHeader)}>
            <tr>
              <th className={css(style.numericCell)}>Total</th>
              <th className={css(style.numericCell)}>Self</th>
              <th className={css(style.textCell)}>Symbol Name</th>
            </tr>
          </thead>
        </table>
        <div className={css(style.scrollView)}>
          <table className={css(style.tableView)}>{rows}</table>
        </div>
      </div>
    )
  }
}

const style = StyleSheet.create({
  vbox: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  scrollView: {
    height: '100%',
    background: Colors.WHITE,
    overflowY: 'auto',
    overflowX: 'hidden',
    cursor: 'auto',
  },
  tableView: {
    width: '100%',
    fontSize: FontSize.LABEL,
    background: Colors.WHITE,
  },
  tableHeader: {
    borderBottom: `2px solid ${Colors.MEDIUM_GRAY}`,
    textAlign: 'left',
    color: Colors.GRAY,
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
