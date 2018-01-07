import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {importFromBGFlameGraph} from './import/bg-flamegraph'
import {importFromStackprof} from './import/stackprof'
import {importFromChrome} from './import/chrome'

import {Profile} from './profile'
import {Flamechart} from './flamechart'
import { FlamechartView } from './flamechart-view'
import { FontFamily, FontSize } from './style'

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

export class Toolbar extends ReloadableComponent<{}, ApplicationState> {
  render() {
    return <div className={css(style.toolbar)}>
      speedscope
    </div>
  }
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

  importJSON(parsed: any): Profile {
    if (Array.isArray(parsed) && parsed[parsed.length - 1].name === "CpuProfile") {
      return importFromChrome(parsed)
    } else {
      return importFromStackprof(parsed)
    }
  }

  onDrop = (ev: DragEvent) => {
    const file = ev.dataTransfer.files.item(0)
    const reader = new FileReader
    reader.addEventListener('loadend', () => {
      console.time('import')
      const profile = file.name.endsWith('json') ? this.importJSON(JSON.parse(reader.result)) : importFromBGFlameGraph(reader.result)
      const flamechart = new Flamechart(profile)
      const sortedFlamechart = new Flamechart({
        getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
        forEachCall: profile.forEachCallGrouped.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        forEachFrame: profile.forEachFrame.bind(profile),
      })
      this.setState({ profile, flamechart, sortedFlamechart }, () => {
        console.timeEnd('import')
      })
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

  componentDidMount() {
    window.addEventListener('keypress', this.onWindowKeyPress)
  }

  componentWillUnmount() {
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
      <Toolbar />
      {flamechartToView &&
        <FlamechartView ref={this.flamechartRef} flamechart={flamechartToView} />}
    </div>
  }
}

const style = StyleSheet.create({
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  toolbar: {
    height: 18,
    background: 'black',
    color: 'white',
    textAlign: 'center',
    fontFamily: FontFamily.MONOSPACE,
    fontSize: FontSize.TITLE,
    lineHeight: '18px'
  }
})

