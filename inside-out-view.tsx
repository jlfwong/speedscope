import {ReloadableComponent} from './reloadable'
import {Profile, Frame} from './profile'
import {SortMethod, ProfileTableView} from './profile-table-view'
import {h} from 'preact'

interface InsideOutViewProps {
  profile: Profile
  getCSSColorForFrame: (frame: Frame) => string
  sortMethod: SortMethod
  setSortMethod: (sortMethod: SortMethod) => void
}

export class InsideOutView extends ReloadableComponent<InsideOutViewProps, void> {
  render() {
    return (
      <ProfileTableView
        profile={this.props.profile}
        getCSSColorForFrame={this.props.getCSSColorForFrame}
        sortMethod={this.props.sortMethod}
        setSortMethod={this.props.setSortMethod}
      />
    )
  }
}
