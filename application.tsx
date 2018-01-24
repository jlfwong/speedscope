import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent, SerializedComponent} from './reloadable'

import {importFromBGFlameGraph} from './import/bg-flamegraph'
import {importFromStackprof} from './import/stackprof'
import {importFromChromeTimeline, importFromChromeCPUProfile} from './import/chrome'
import { RectangleBatch } from './rectangle-batch-renderer'
import { CanvasContext } from './canvas-context'

import {Profile, Frame} from './profile'
import {Flamechart} from './flamechart'
import { FlamechartView } from './flamechart-view'
import { FontFamily, FontSize, Colors } from './style'
import { FrameColorGenerator } from './color'
import { Vec2, Rect } from './math'

const enum SortOrder {
  CHRONO,
  LEFT_HEAVY
}

interface ApplicationState {
  profile: Profile | null
  flamechart: Flamechart | null
  flamechartRectBatch: RectangleBatch | null
  sortedFlamechart: Flamechart | null
  sortedFlamechartRectBatch: RectangleBatch | null
  sortOrder: SortOrder
  loading: boolean
}

interface ToolbarProps extends ApplicationState {
  setSortOrder(order: SortOrder): void
}

function importProfile(contents: string, fileName: string): Profile | null {
  try {
    // First pass: Check known file format names to infer the file type
    if (fileName.endsWith('.cpuprofile')) {
      console.log('Importing as Chrome CPU Profile')
      return importFromChromeCPUProfile(JSON.parse(contents))
    } else if (fileName.endsWith('.chrome.json') || /Profile-\d{8}T\d{6}/.exec(fileName)) {
      console.log('Importing as Chrome Timeline')
      return importFromChromeTimeline(JSON.parse(contents))
    } else if (fileName.endsWith('.stackprof.json')) {
      console.log('Importing as stackprof profile')
      return importFromStackprof(JSON.parse(contents))
    } else if (fileName.endsWith('.txt')) {
      console.log('Importing as collapsed stack format')
      return importFromBGFlameGraph(contents)
    }

    // Second pass: Try to guess what file format it is based on structure
    try {
      const parsed = JSON.parse(contents)
      if (Array.isArray(parsed) && parsed[parsed.length - 1].name === "CpuProfile") {
        console.log('Importing as Chrome CPU Profile')
        return importFromChromeTimeline(parsed)
      } else if ('nodes' in parsed && 'samples' in parsed && 'timeDeltas' in parsed) {
        console.log('Importing as Chrome Timeline')
        return importFromChromeCPUProfile(parsed)
      } else if ('mode' in parsed && 'frames' in parsed) {
        console.log('Importing as stackprof profile')
        return importFromStackprof(parsed)
      }
    } catch (e) {
      // Format is not JSON

      // If every line ends with a space followed by a number, it's probably
      // the collapsed stack format.
      const lineCount = contents.split(/\n/).length
      if (lineCount > 1 && lineCount === contents.split(/ \d+\n/).length) {
        console.log('Importing as collapsed stack format')
        return importFromBGFlameGraph(contents)
      }
    }

    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

export class Toolbar extends ReloadableComponent<ToolbarProps, void> {
  setTimeOrder = () => {
    this.props.setSortOrder(SortOrder.CHRONO)
  }

  setLeftHeavyOrder = () => {
    this.props.setSortOrder(SortOrder.LEFT_HEAVY)
  }

  render() {
    const help = (
      <div className={css(style.toolbarTab)}>
        <a href="https://github.com/jlfwong/speedscope#usage" className={css(style.noLinkStyle)} target="_blank">
          <span className={css(style.emoji)}>❓</span>Help
        </a>
      </div>
    )

    if (!this.props.profile) {
      return <div className={css(style.toolbar)}>
        <div className={css(style.toolbarLeft)}>{help}</div>
        🔬speedscope
      </div>
    }
    return <div className={css(style.toolbar)}>
      <div className={css(style.toolbarLeft)}>
        <div className={css(style.toolbarTab, this.props.sortOrder === SortOrder.CHRONO && style.toolbarTabActive)} onClick={this.setTimeOrder}>
          <span className={css(style.emoji)}>🕰</span>Time Order
        </div>
        <div className={css(style.toolbarTab, this.props.sortOrder === SortOrder.LEFT_HEAVY && style.toolbarTabActive)} onClick={this.setLeftHeavyOrder}>
          <span className={css(style.emoji)}>⬅️</span>Left Heavy
        </div>
        {help}
      </div>
      {this.props.profile.getName()}
      <div className={css(style.toolbarRight)}>🔬speedscope</div>
    </div>
  }
}

interface GLCanvasProps {
  setCanvasContext(canvasContext: CanvasContext | null): void
}
export class GLCanvas extends ReloadableComponent<GLCanvasProps, void> {
  private canvas: HTMLCanvasElement | null = null
  private canvasContext: CanvasContext | null = null

  private ref = (canvas?: Element) => {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas
      this.canvasContext = new CanvasContext(canvas)
    } else {
      this.canvas = null
      this.canvasContext = null
    }
    this.props.setCanvasContext(this.canvasContext)
  }

  private maybeResize() {
    if (!this.canvas) return
    let { width, height } = this.canvas.getBoundingClientRect()
    width = Math.floor(width) * window.devicePixelRatio
    height = Math.floor(height) * window.devicePixelRatio

    // Still initializing: don't resize yet
    if (width < 4 || height < 4) return
    const oldWidth = this.canvas.width
    const oldHeight = this.canvas.height

    // Already at the right size
    if (width === oldWidth && height === oldHeight) return

    this.canvas.width = width
    this.canvas.height = height
  }

  onWindowResize = () => {
    this.maybeResize()
    window.addEventListener('resize', this.onWindowResize)
  }
  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize)
    requestAnimationFrame(() => this.maybeResize())
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
  }

  render() {
    return <canvas className={css(style.glCanvasView)} ref={this.ref} width={1} height={1} />
  }
}

function rectangleBatchForFlamechart(canvasContext: CanvasContext, flamechart: Flamechart) {
  console.time('rectangle batch generation')

  const batch = canvasContext.createRectangleBatch()

  const layers = flamechart.getLayers()
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    for (let flamechartFrame of layer) {
      const configSpaceBounds = new Rect(
        new Vec2(flamechartFrame.start, i + 1),
        new Vec2(flamechartFrame.end - flamechartFrame.start, 1)
      )
      const color = flamechart.getColorForFrame(flamechartFrame.node.frame)
      batch.addRect(configSpaceBounds, color)
    }
  }

  // GPU upload
  batch.uploadToGPU()

  console.timeEnd('rectangle batch generation')

  return batch
}


export class Application extends ReloadableComponent<{}, ApplicationState> {
  constructor() {
    super()
    this.state = {
      loading: false,
      profile: null,
      flamechart: null,
      flamechartRectBatch: null,
      sortedFlamechart: null,
      sortedFlamechartRectBatch: null,
      sortOrder: SortOrder.CHRONO
    }
  }

  serialize() {
    const result = super.serialize()
    delete result.state.flamechartRectBatch
    delete result.state.sortedFlamechartRectBatch
    return result
  }

  rehydrate(serialized: SerializedComponent<ApplicationState>) {
    super.rehydrate(serialized)
    const { flamechart, sortedFlamechart } = serialized.state
    if (this.canvasContext && flamechart && sortedFlamechart) {
      this.setState({
        flamechartRectBatch: rectangleBatchForFlamechart(this.canvasContext, flamechart),
        sortedFlamechartRectBatch: rectangleBatchForFlamechart(this.canvasContext, sortedFlamechart)
      })
    }
  }

  loadFromString(fileName: string, contents: string) {
    if (!this.canvasContext) return

    console.time('import')
    const profile = importProfile(contents, fileName)
    if (profile == null) {
      this.setState({ loading: false })
      // TODO(jlfwong): Make this a nicer overlay
      alert('Unrecognized format! See documentation about supported formats.')
      return
    }

    profile.setName(fileName)
    document.title = `${fileName} - speedscope`

    const frames: Frame[] = []
    profile.forEachFrame(f => frames.push(f))
    const colorGenerator = new FrameColorGenerator(frames)

    const flamechart = new Flamechart({
      getTotalWeight: profile.getTotalWeight.bind(profile),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorForFrame: colorGenerator.getColorForFrame.bind(colorGenerator)
    })
    const flamechartRectBatch = rectangleBatchForFlamechart(this.canvasContext, flamechart)

    const sortedFlamechart = new Flamechart({
      getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
      forEachCall: profile.forEachCallGrouped.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorForFrame: colorGenerator.getColorForFrame.bind(colorGenerator)
    })
    const sortedFlamechartRectBatch = rectangleBatchForFlamechart(this.canvasContext, sortedFlamechart)

    console.timeEnd('import')

    console.time('first setState')
    this.setState({
      profile,
      flamechart,
      flamechartRectBatch,
      sortedFlamechart,
      sortedFlamechartRectBatch,
      loading: false
    }, () => {
      console.timeEnd('first setState')
    })
  }

  loadFromFile(file: File) {
    this.setState({ loading: true }, () => {
      requestAnimationFrame(() => {
        const reader = new FileReader
        reader.addEventListener('loadend', () => {
          this.loadFromString(file.name, reader.result)
        })
        reader.readAsText(file)
      })
    })
  }

  loadExample = () => {
    this.setState({ loading: true })
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
        <p className={css(style.landingP)}>👋 Hi there! Welcome to 🔬speedscope, an interactive{' '}
        <a className={css(style.link)} href="http://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html">flamegraph</a> visualizer.
        Use it to help you make your software faster.</p>
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

  renderLoadingBar() {
    return <div className={css(style.loading)}></div>
  }

  setSortOrder = (sortOrder: SortOrder) => {
    this.setState({ sortOrder })
  }

  private canvasContext: CanvasContext | null = null
  private setCanvasContext = (canvasContext: CanvasContext | null) => {
    this.canvasContext = canvasContext
  }

  render() {
    const {flamechart, flamechartRectBatch, sortedFlamechart, sortedFlamechartRectBatch, sortOrder, loading} = this.state
    const flamechartToView = sortOrder == SortOrder.CHRONO ? flamechart : sortedFlamechart
    const rectangleBatch = sortOrder == SortOrder.CHRONO ? flamechartRectBatch : sortedFlamechartRectBatch

    return <div onDrop={this.onDrop} onDragOver={this.onDragOver} className={css(style.root)}>
      <GLCanvas setCanvasContext={this.setCanvasContext} />
      <Toolbar setSortOrder={this.setSortOrder} {...this.state} />
      {loading ?
        this.renderLoadingBar() :
        this.canvasContext && flamechartToView && rectangleBatch ?
          <FlamechartView
            canvasContext={this.canvasContext}
            rectangles={rectangleBatch}
            ref={this.flamechartRef}
            flamechart={flamechartToView} /> :
          this.renderLanding()}
    </div>
  }
}

const style = StyleSheet.create({
  glCanvasView: {
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    zIndex: -1,
    pointerEvents: 'none'
  },
  loading: {
    height: 3,
    marginBottom: -3,
    background: Colors.DARK_BLUE,
    transformOrigin: '0% 50%',
    animationName: [{
      from: {
        transform: `scaleX(0)`
      },
      to: {
        transform: `scaleX(1)`
      }
    }],
    animationTimingFunction: "cubic-bezier(0, 1, 0, 1)",
    animationDuration: "30s"
  },
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontFamily: FontFamily.MONOSPACE,
    lineHeight: '20px'
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
  toolbarLeft: {
    position: 'absolute',
    height: 18,
    overflow: 'hidden',
    top: 0,
    left: 0,
    marginRight: 2,
    textAlign: 'left',
  },
  toolbarRight: {
    height: 18,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    right: 0,
    marginRight: 2,
    textAlign: 'right',
  },
  toolbarTab: {
    background: Colors.DARK_GRAY,
    marginTop: 2,
    height: 16,
    lineHeight: '16px',
    paddingLeft: 2,
    paddingRight: 8,
    display: 'inline-block',
    marginLeft: 2,
    ':hover': {
      background: Colors.GRAY,
      cursor: 'pointer'
    }
  },
  toolbarTabActive: {
    background: Colors.LIGHT_BLUE,
    ':hover': {
      background: Colors.LIGHT_BLUE
    }
  },
  noLinkStyle: {
    textDecoration: 'none',
    color: 'inherit'
  },
  emoji: {
    display: 'inline-block',
    verticalAlign: 'middle',
    paddingTop: '0px',
    marginRight: '0.3em'
  }
})

