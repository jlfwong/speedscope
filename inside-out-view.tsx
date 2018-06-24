import {ReloadableComponent} from './reloadable'
import {Profile, Frame} from './profile'
import {StyleSheet, css} from 'aphrodite'
import {SortMethod, ProfileTableView} from './profile-table-view'
import {h} from 'preact'
import {commonStyle} from './style'

interface InsideOutViewProps {
  profile: Profile
  getCSSColorForFrame: (frame: Frame) => string
  sortMethod: SortMethod
  setSortMethod: (sortMethod: SortMethod) => void
}

export class InsideOutView extends ReloadableComponent<InsideOutViewProps, void> {
  render() {
    return (
      <div className={css(commonStyle.hbox)}>
        <ProfileTableView
          profile={this.props.profile}
          getCSSColorForFrame={this.props.getCSSColorForFrame}
          sortMethod={this.props.sortMethod}
          setSortMethod={this.props.setSortMethod}
        />
      </div>
    )
  }
}

const style = StyleSheet.create({})
