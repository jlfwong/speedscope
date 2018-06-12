import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'
import {Profile, Frame} from './profile'
import {sortBy, formatPercent} from './utils'
import {FontSize} from './style'

interface ProfileTableViewProps {
  profile: Profile
}

export class ProfileTableView extends ReloadableComponent<ProfileTableViewProps, void> {
  renderRow(frame: Frame) {
    const {profile} = this.props

    const totalWeight = frame.getTotalWeight()
    const selfWeight = frame.getSelfWeight()
    const totalPerc = 100.0 * totalWeight / profile.getTotalNonIdleWeight()
    const selfPerc = 100.0 * selfWeight / profile.getTotalNonIdleWeight()

    return (
      <tr key={`${frame.key}`}>
        <td className={css(style.numericCell)}>
          {profile.formatValue(totalWeight)} ({formatPercent(totalPerc)})
          <div className={css(style.hBarDisplay)} style={{width: `calc(${totalPerc}% - 10px)`}} />
        </td>
        <td className={css(style.numericCell)}>
          {profile.formatValue(selfWeight)} ({formatPercent(selfPerc)})
          <div className={css(style.hBarDisplay)} style={{width: `calc(${selfPerc}% - 10px)`}} />
        </td>
        <td title={frame.file}>{frame.name}</td>
      </tr>
    )
  }

  render() {
    const {profile} = this.props

    const frameList: Frame[] = []

    profile.forEachFrame(f => frameList.push(f))
    sortBy(frameList, f => -f.getSelfWeight())

    const rows: JSX.Element[] = frameList.map(f => this.renderRow(f))

    return (
      <div className={css(style.scrollView)}>
        <table className={css(style.tableView)}>
          <thead>
            <tr>
              <th className={css(style.header, style.numericCell)}>Total</th>
              <th className={css(style.header, style.numericCell)}>Self</th>
              <th className={css(style.header)}>Symbol Name</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    )
  }
}

const style = StyleSheet.create({
  scrollView: {
    height: '100%',
    background: 'white',
    overflow: 'auto',
    cursor: 'auto',
  },
  header: {
    textAlign: 'left',
    fontWeight: 'bold',
  },
  tableView: {
    width: '100%',
    fontSize: FontSize.LABEL,
  },
  numericCell: {
    position: 'relative',
    textAlign: 'right',
    paddingRight: '10px',
    width: '15em',
  },
  hBarDisplay: {
    position: 'absolute',
    top: 0,
    right: 10,
    background: 'rgba(0, 0, 0, 0.2)',
    height: '100%',
  },
})
