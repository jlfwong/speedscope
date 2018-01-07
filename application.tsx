import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent} from './reloadable'

import {importFromBGFlameGraph} from './import/bg-flamegraph'
import {importFromStackprof} from './import/stackprof'
import {importFromChrome} from './import/chrome'

import {Profile} from './profile'
import {Flamechart} from './flamechart'
import { FlamechartView } from './flamechart-view'
import { FontFamily, FontSize, Colors } from './style'

const enum SortOrder {
  CHRONO,
  LEFT_HEAVY
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

  loadFromString(fileName: string, contents: string) {
    console.time('import')
    const profile = fileName.endsWith('json') ? this.importJSON(JSON.parse(contents)) : importFromBGFlameGraph(contents)
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
  }

  loadFromFile(file: File) {
    const reader = new FileReader
    reader.addEventListener('loadend', () => {
      this.loadFromString(file.name, reader.result)
    })
    reader.readAsText(file)
  }

  loadExample = () => {
    fetch('dist/perf-vertx-stacks-01-collapsed-all.txt').then(resp => resp.text()).then(data => {
      this.loadFromString('perf-vertx-stacks-01-collapsed-all.txt', data)
    })
  }

  onDrop = (ev: DragEvent) => {
    this.loadFromFile(ev.dataTransfer.files.item(0))
    ev.preventDefault()
  }

  onDragOver = (ev: DragEvent) => {
    ev.preventDefault()
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (ev.key === '1') {
      this.setState({
        sortOrder: SortOrder.CHRONO
      })
    } else if (ev.key === '2') {
      this.setState({
        sortOrder: SortOrder.LEFT_HEAVY
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

  onFileSelect = (ev: Event) => {
    this.loadFromFile((ev.target as HTMLInputElement).files!.item(0))
  }

  renderLanding() {
    return <div className={css(style.landingContainer)}>
      <div className={css(style.landingMessage)}>
        <p className={css(style.landingP)}>👋 Hi there! Welcome to 🔬speedscope.</p>
        <p className={css(style.landingP)}>Drag and drop a profile file onto this window to get started,
        click the big blue button below to browse for a profile to explore, or{' '}
          <a className={css(style.link)} onClick={this.loadExample}>click here</a>{' '}
          to load an example profile.</p>

        <div className={css(style.browseButtonContainer)}>
          <input type="file" name="file" id="file" onChange={this.onFileSelect} className={css(style.hide)} />
          <label for="file" className={css(style.browseButton)}>Browse</label>
        </div>

        <p className={css(style.landingP)}>See the <a className={css(style.link)}
          href="https://github.com/jlfwong/speedscope#usage" target="_blank">documentation</a> for
        information about supported file formats, keyboard shortcuts, and how
        to navigate around the profile.</p>

        <p className={css(style.landingP)}>speedscope is open source.
        Please <a className={css(style.link)} target="_blank" href="https://github.com/jlfwong/speedscope/issues">report any issues on GitHub</a>.</p>
      </div>
    </div>
  }

  render() {
    const {flamechart, sortedFlamechart, sortOrder} = this.state
    const flamechartToView = sortOrder == SortOrder.CHRONO ? flamechart : sortedFlamechart

    return <div onDrop={this.onDrop} onDragOver={this.onDragOver} className={css(style.root)}>
      <Toolbar />
      {flamechartToView ?
        <FlamechartView ref={this.flamechartRef} flamechart={flamechartToView} /> :
        this.renderLanding()}
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
    fontFamily: FontFamily.MONOSPACE
  },
  toolbar: {
    height: 18,
    background: 'black',
    color: 'white',
    textAlign: 'center',
    fontFamily: FontFamily.MONOSPACE,
    fontSize: FontSize.TITLE,
    lineHeight: '18px',
    userSelect: 'none'
  },
  landingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  landingMessage: {
    maxWidth: 600
  },
  landingP: {
    marginBottom: 16
  },
  hide: {
    display: 'none'
  },
  browseButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  browseButton: {
    marginBottom: 16,
    height: 72,
    flex: 1,
    maxWidth: 256,
    textAlign: 'center',
    fontSize: FontSize.BIG_BUTTON,
    lineHeight: '72px',
    background: Colors.DARK_BLUE,
    color: 'white',
    cursor: 'pointer'
  },
  link: {
    color: Colors.LIGHT_BLUE,
    cursor: 'pointer',
    textDecoration: 'none'
  }
})

