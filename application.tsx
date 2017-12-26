import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {importFromBGFlameGraph} from './import/bg-flamegraph'
import {importFromStackprof} from './import/stackprof'

import {Profile} from './profile'
import {Flamechart, FlamechartView} from './flamechart'

const enum SortOrder {
  CHRONO,
  ALPHA
}

interface ApplicationState {
  profile: Profile | null
  flamechart: Flamechart | null
  sortedFlamechart: Flamechart | null
  sortOrder: SortOrder
}

export class Application extends ReloadableComponent<{}, ApplicationState> {
  constructor() {
    super()
    this.state = {
      profile: null,
      flamechart: null,
      sortedFlamechart: null,
      sortOrder: SortOrder.CHRONO
    }
  }

  onDrop = (ev: DragEvent) => {
    const file = ev.dataTransfer.files.item(0)
    const reader = new FileReader
    reader.addEventListener('loadend', () => {
      const profile = file.name.endsWith('json') ? importFromStackprof(reader.result) : importFromBGFlameGraph(reader.result)
      const flamechart = new Flamechart(profile)
      const sortedFlamechart = new Flamechart(profile.sortedAlphabetically())
      this.setState({profile, flamechart, sortedFlamechart})
    })
    reader.readAsText(file)
    ev.preventDefault()
  }

  onDragOver = (ev: DragEvent) => {
    ev.preventDefault()
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (ev.key == 'a') {
      this.setState({
        sortOrder: this.state.sortOrder === SortOrder.CHRONO ? SortOrder.ALPHA : SortOrder.CHRONO
      })
    }
  }

  onWindowResize = () => {
    this.forceUpdate()
  }

  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize)
    // TODO(jlfwong): for this to be safely embeddable, there'll need to be some
    // way of specify event focus.
    window.addEventListener('keypress', this.onWindowKeyPress)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('keypress', this.onWindowKeyPress)
  }

  flamechartView: FlamechartView | null
  flamechartRef = (view: FlamechartView | null) => this.flamechartView = view
  subcomponents() {
    return {
      flamechart: this.flamechartView
    }
  }

  render() {
    const {flamechart, sortedFlamechart, sortOrder} = this.state
    const flamechartToView = sortOrder == SortOrder.CHRONO ? flamechart : sortedFlamechart

    return <div onDrop={this.onDrop} onDragOver={this.onDragOver} className={css(style.root)}>
      {flamechartToView &&
        <FlamechartView ref={this.flamechartRef} flamechart={flamechartToView} />}
    </div>
  }
}

const style = StyleSheet.create({
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden'
  }
})

