import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {ReloadableComponent, SerializedComponent} from './reloadable'

// TODO(jlfwong): Load these async, since none of them are required for initial render
import {importFromBGFlameGraph} from './import/bg-flamegraph'
import {importFromStackprof} from './import/stackprof'
import {importFromChromeTimeline, importFromChromeCPUProfile} from './import/chrome'
import {importFromFirefox} from './import/firefox'
import {
  importFromInstrumentsDeepCopy,
  importFromInstrumentsTrace,
  FileSystemDirectoryEntry,
} from './import/instruments'

import {FlamechartRenderer, FlamechartRowAtlasKey} from './flamechart-renderer'
import {CanvasContext} from './canvas-context'

import {Profile, Frame} from './profile'
import {Flamechart} from './flamechart'
import {FlamechartView} from './flamechart-view'
import {FontFamily, FontSize, Colors, Sizes} from './style'
import {getHashParams, HashParams} from './hash-params'
import {SortMethod, SortField, SortDirection} from './profile-table-view'
import {triangle} from './utils'
import {Color} from './color'
import {RowAtlas} from './row-atlas'
import {importAsmJsSymbolMap} from './asm-js'
import {InsideOutView} from './inside-out-view'

declare function require(x: string): any
const exampleProfileURL = require('./sample/profiles/stackcollapse/perf-vertx-stacks-01-collapsed-all.txt')

const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  INSIDE_OUT_VIEW,
}

interface ApplicationState {
  profile: Profile | null
  activeProfile: Profile | null
  flattenRecursion: boolean

  chronoFlamechart: Flamechart | null
  chronoFlamechartRenderer: FlamechartRenderer | null

  leftHeavyFlamegraph: Flamechart | null
  leftHeavyFlamegraphRenderer: FlamechartRenderer | null

  tableSortMethod: SortMethod

  viewMode: ViewMode
  dragActive: boolean
  loading: boolean
  error: boolean
}

interface ToolbarProps extends ApplicationState {
  setViewMode(order: ViewMode): void
}

function importProfile(fileName: string, contents: string): Profile | null {
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
    } else if (fileName.endsWith('.instruments.txt')) {
      console.log('Importing as Instruments.app deep copy')
      return importFromInstrumentsDeepCopy(contents)
    } else if (fileName.endsWith('.collapsedstack.txt')) {
      console.log('Importing as collapsed stack format')
      return importFromBGFlameGraph(contents)
    }

    // Second pass: Try to guess what file format it is based on structure
    try {
      const parsed = JSON.parse(contents)
      if (parsed['systemHost'] && parsed['systemHost']['name'] == 'Firefox') {
        console.log('Importing as Firefox profile')
        return importFromFirefox(parsed)
      } else if (Array.isArray(parsed) && parsed[parsed.length - 1].name === 'CpuProfile') {
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

      // If the first line contains "Symbol Name", preceded by a tab, it's probably
      // a deep copy from OS X Instruments.app
      if (/^[\w \t\(\)]*\tSymbol Name/.exec(contents)) {
        console.log('Importing as Instruments.app deep copy')
        return importFromInstrumentsDeepCopy(contents)
      }

      // If every line ends with a space followed by a number, it's probably
      // the collapsed stack format.
      const lineCount = contents.split(/\n/).length
      if (lineCount >= 1 && lineCount === contents.split(/ \d+\n/).length) {
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
    this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
  }

  setLeftHeavyOrder = () => {
    this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
  }

  setInsideOutView = () => {
    this.props.setViewMode(ViewMode.INSIDE_OUT_VIEW)
  }

  render() {
    const help = (
      <div className={css(style.toolbarTab)}>
        <a
          href="https://github.com/jlfwong/speedscope#usage"
          className={css(style.noLinkStyle)}
          target="_blank"
        >
          <span className={css(style.emoji)}>❓</span>Help
        </a>
      </div>
    )

    if (!this.props.profile) {
      return (
        <div className={css(style.toolbar)}>
          <div className={css(style.toolbarLeft)}>{help}</div>
          🔬speedscope
        </div>
      )
    }
    return (
      <div className={css(style.toolbar)}>
        <div className={css(style.toolbarLeft)}>
          <div
            className={css(
              style.toolbarTab,
              this.props.viewMode === ViewMode.CHRONO_FLAME_CHART && style.toolbarTabActive,
            )}
            onClick={this.setTimeOrder}
          >
            <span className={css(style.emoji)}>🕰</span>Time Order
          </div>
          <div
            className={css(
              style.toolbarTab,
              this.props.viewMode === ViewMode.LEFT_HEAVY_FLAME_GRAPH && style.toolbarTabActive,
            )}
            onClick={this.setLeftHeavyOrder}
          >
            <span className={css(style.emoji)}>⬅️</span>Left Heavy
          </div>
          <div
            className={css(
              style.toolbarTab,
              this.props.viewMode === ViewMode.INSIDE_OUT_VIEW && style.toolbarTabActive,
            )}
            onClick={this.setInsideOutView}
          >
            <span className={css(style.emoji)}>🔃</span>Inside Out
          </div>
          {help}
        </div>
        {this.props.profile.getName()}
      </div>
    )
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
    let {width, height} = this.canvas.getBoundingClientRect()
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

export class Application extends ReloadableComponent<{}, ApplicationState> {
  hashParams: HashParams

  constructor() {
    super()
    this.hashParams = getHashParams()
    this.state = {
      // Start out at a loading state if we know that we'll immediately be fetching a profile to
      // view.
      loading: this.hashParams.profileURL != null,
      dragActive: false,
      error: false,
      profile: null,
      activeProfile: null,
      flattenRecursion: false,

      chronoFlamechart: null,
      chronoFlamechartRenderer: null,

      leftHeavyFlamegraph: null,
      leftHeavyFlamegraphRenderer: null,

      tableSortMethod: {
        field: SortField.SELF,
        direction: SortDirection.DESCENDING,
      },

      viewMode: ViewMode.CHRONO_FLAME_CHART,
    }
  }

  serialize() {
    const result = super.serialize()
    delete result.state.chronoFlamechartRenderer
    delete result.state.leftHeavyFlamegraphRenderer
    return result
  }

  rehydrate(serialized: SerializedComponent<ApplicationState>) {
    super.rehydrate(serialized)
    const {chronoFlamechart, leftHeavyFlamegraph} = serialized.state
    if (this.canvasContext && this.rowAtlas && chronoFlamechart && leftHeavyFlamegraph) {
      this.setState({
        chronoFlamechartRenderer: new FlamechartRenderer(
          this.canvasContext,
          this.rowAtlas,
          chronoFlamechart,
        ),
        leftHeavyFlamegraphRenderer: new FlamechartRenderer(
          this.canvasContext,
          this.rowAtlas,
          leftHeavyFlamegraph,
        ),
      })
    }
  }

  async loadProfile(loader: () => Promise<Profile | null>) {
    await new Promise(resolve => this.setState({loading: true}, resolve))
    await new Promise(resolve => setTimeout(resolve, 0))

    if (!this.canvasContext || !this.rowAtlas) return

    console.time('import')

    let profile: Profile | null = null
    try {
      profile = await loader()
    } catch (e) {
      alert('Failed to load format. See console for details')
      console.log(e)
      this.setState({error: true})
      return
    }

    if (profile == null) {
      // TODO(jlfwong): Make this a nicer overlay
      alert('Unrecognized format! See documentation about supported formats.')
      return
    }

    await profile.demangle()

    const title = this.hashParams.title || profile.getName()
    profile.setName(title)

    await this.setActiveProfile(profile)

    console.timeEnd('import')
    this.setState({profile})
  }

  async setActiveProfile(profile: Profile) {
    if (!this.canvasContext || !this.rowAtlas) return

    document.title = `${profile.getName()} - speedscope`

    const frames: Frame[] = []
    profile.forEachFrame(f => frames.push(f))
    function key(f: Frame) {
      return (f.file || '') + f.name
    }
    function compare(a: Frame, b: Frame) {
      return key(a) > key(b) ? 1 : -1
    }
    frames.sort(compare)
    const frameToColorBucket = new Map<string | number, number>()
    for (let i = 0; i < frames.length; i++) {
      frameToColorBucket.set(frames[i].key, Math.floor(255 * i / frames.length))
    }
    function getColorBucketForFrame(frame: Frame) {
      return frameToColorBucket.get(frame.key) || 0
    }

    const chronoFlamechart = new Flamechart({
      getTotalWeight: profile.getTotalWeight.bind(profile),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
    const chronoFlamechartRenderer = new FlamechartRenderer(
      this.canvasContext,
      this.rowAtlas,
      chronoFlamechart,
    )

    const leftHeavyFlamegraph = new Flamechart({
      getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
      forEachCall: profile.forEachCallGrouped.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
    const leftHeavyFlamegraphRenderer = new FlamechartRenderer(
      this.canvasContext,
      this.rowAtlas,
      leftHeavyFlamegraph,
    )

    await new Promise(resolve => {
      this.setState(
        {
          activeProfile: profile,

          chronoFlamechart,
          chronoFlamechartRenderer,

          leftHeavyFlamegraph,
          leftHeavyFlamegraphRenderer,

          loading: false,
        },
        resolve,
      )
    })
  }

  loadFromFile(file: File) {
    this.loadProfile(
      () =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.addEventListener('loadend', () => {
            const profile = importProfile(file.name, reader.result)
            if (profile) {
              if (!profile.getName()) {
                profile.setName(file.name)
              }
              resolve(profile)
              return
            }

            if (this.state.profile) {
              // If a profile is already loaded, it's possible the file being imported is
              // a symbol map. If that's the case, we want to parse it, and apply the symbol
              // mapping to the already loaded profile. This can be use to take an opaque
              // profile and make it readable.
              const map = importAsmJsSymbolMap(reader.result)
              if (map) {
                console.log('Importing as asm.js symbol map')
                let profile = this.state.profile
                profile.remapNames(name => map.get(name) || name)
                resolve(profile)
                return
              }
            }

            reject()
          })
          reader.readAsText(file)
        }),
    )
  }

  loadExample = () => {
    this.loadProfile(async () => {
      const filename = 'perf-vertx-stacks-01-collapsed-all.txt'
      return await fetch(exampleProfileURL)
        .then(resp => resp.text())
        .then(data => importProfile(filename, data))
    })
  }

  onDrop = (ev: DragEvent) => {
    this.setState({dragActive: false})
    ev.preventDefault()

    const firstItem = ev.dataTransfer.items[0]
    if ('webkitGetAsEntry' in firstItem) {
      const webkitEntry: FileSystemDirectoryEntry = firstItem.webkitGetAsEntry()

      // Instrument.app file format is actually a directory.
      if (webkitEntry.isDirectory && webkitEntry.name.endsWith('.trace')) {
        console.log('Importing as Instruments.app .trace file')
        this.loadProfile(async () => await importFromInstrumentsTrace(webkitEntry))
        return
      }
    }

    let file: File | null = ev.dataTransfer.files.item(0)
    if (file) {
      this.loadFromFile(file)
    }
  }

  onDragOver = (ev: DragEvent) => {
    this.setState({dragActive: true})
    ev.preventDefault()
  }

  onDragLeave = (ev: DragEvent) => {
    this.setState({dragActive: false})
    ev.preventDefault()
  }

  onWindowKeyPress = (ev: KeyboardEvent) => {
    if (ev.key === '1') {
      this.setState({
        viewMode: ViewMode.CHRONO_FLAME_CHART,
      })
    } else if (ev.key === '2') {
      this.setState({
        viewMode: ViewMode.LEFT_HEAVY_FLAME_GRAPH,
      })
    } else if (ev.key === '3') {
      this.setState({
        viewMode: ViewMode.INSIDE_OUT_VIEW,
      })
    } else if (ev.key === 'r') {
      const {flattenRecursion, profile} = this.state
      if (!profile) return
      if (flattenRecursion) {
        this.setActiveProfile(profile)
        this.setState({flattenRecursion: false})
      } else {
        this.setActiveProfile(profile.getProfileWithRecursionFlattened())
        this.setState({flattenRecursion: true})
      }
    }
  }

  onDocumentPaste = (ev: Event) => {
    ev.preventDefault()
    ev.stopPropagation()

    const pasted = (ev as ClipboardEvent).clipboardData.getData('text')
    this.loadProfile(async () => importProfile('From Clipboard', pasted))
  }

  componentDidMount() {
    window.addEventListener('keypress', this.onWindowKeyPress)
    document.addEventListener('paste', this.onDocumentPaste)
    this.maybeLoadHashParamProfile()
  }

  async maybeLoadHashParamProfile() {
    if (this.hashParams.profileURL) {
      this.loadProfile(async () => {
        const response = await fetch(this.hashParams.profileURL!)
        let filename = new URL(this.hashParams.profileURL!).pathname
        if (filename.includes('/')) {
          filename = filename.slice(filename.lastIndexOf('/') + 1)
        }
        return await importProfile(filename, await response.text())
      })
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keypress', this.onWindowKeyPress)
    document.removeEventListener('paste', this.onDocumentPaste)
  }

  flamechartView: FlamechartView | null = null
  flamechartRef = (view: FlamechartView | null) => (this.flamechartView = view)
  subcomponents() {
    return {
      flamechart: this.flamechartView,
    }
  }

  onFileSelect = (ev: Event) => {
    const file = (ev.target as HTMLInputElement).files!.item(0)
    if (file) {
      this.loadFromFile(file)
    }
  }

  renderLanding() {
    return (
      <div className={css(style.landingContainer)}>
        <div className={css(style.landingMessage)}>
          <p className={css(style.landingP)}>
            👋 Hi there! Welcome to 🔬speedscope, an interactive{' '}
            <a
              className={css(style.link)}
              href="http://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html"
            >
              flamegraph
            </a>{' '}
            visualizer. Use it to help you make your software faster.
          </p>
          <p className={css(style.landingP)}>
            Drag and drop a profile file onto this window to get started, click the big blue button
            below to browse for a profile to explore, or{' '}
            <a className={css(style.link)} onClick={this.loadExample}>
              click here
            </a>{' '}
            to load an example profile.
          </p>

          <div className={css(style.browseButtonContainer)}>
            <input
              type="file"
              name="file"
              id="file"
              onChange={this.onFileSelect}
              className={css(style.hide)}
            />
            <label for="file" className={css(style.browseButton)}>
              Browse
            </label>
          </div>

          <p className={css(style.landingP)}>
            See the{' '}
            <a
              className={css(style.link)}
              href="https://github.com/jlfwong/speedscope#usage"
              target="_blank"
            >
              documentation
            </a>{' '}
            for information about supported file formats, keyboard shortcuts, and how to navigate
            around the profile.
          </p>

          <p className={css(style.landingP)}>
            speedscope is open source. Please{' '}
            <a
              className={css(style.link)}
              target="_blank"
              href="https://github.com/jlfwong/speedscope/issues"
            >
              report any issues on GitHub
            </a>.
          </p>
        </div>
      </div>
    )
  }

  renderError() {
    return (
      <div className={css(style.error)}>
        <div>😿 Something went wrong.</div>
        <div>Check the JS console for more details.</div>
      </div>
    )
  }

  renderLoadingBar() {
    return <div className={css(style.loading)} />
  }

  setViewMode = (viewMode: ViewMode) => {
    this.setState({viewMode})
  }

  setTableSortMethod = (tableSortMethod: SortMethod) => {
    this.setState({tableSortMethod})
  }

  private canvasContext: CanvasContext | null = null
  private rowAtlas: RowAtlas<FlamechartRowAtlasKey> | null = null
  private setCanvasContext = (canvasContext: CanvasContext | null) => {
    this.canvasContext = canvasContext
    if (canvasContext) {
      this.rowAtlas = new RowAtlas(canvasContext)
    } else {
      this.rowAtlas = null
    }
  }

  getCSSColorForFrame = (frame: Frame): string => {
    const {chronoFlamechart} = this.state
    if (!chronoFlamechart) return '#FFFFFF'

    const t = chronoFlamechart.getColorBucketForFrame(frame) / 255

    const x = triangle(30.0 * t)
    const H = 360.0 * (0.9 * t)
    const C = 0.25 + 0.2 * x
    const L = 0.8 - 0.15 * x
    return Color.fromLumaChromaHue(L, C, H).toCSS()
  }

  renderContent() {
    const {viewMode} = this.state

    if (this.state.error) {
      return this.renderError()
    }

    if (this.state.loading) {
      return this.renderLoadingBar()
    }

    if (!this.state.activeProfile) {
      return this.renderLanding()
    }

    if (!this.canvasContext) {
      throw new Error('Missing canvas context')
    }

    switch (viewMode) {
      case ViewMode.CHRONO_FLAME_CHART: {
        const {chronoFlamechart, chronoFlamechartRenderer} = this.state
        if (!chronoFlamechart || !chronoFlamechartRenderer)
          throw new Error('Missing dependencies for chrono flame chart')
        return (
          <FlamechartView
            canvasContext={this.canvasContext}
            flamechartRenderer={chronoFlamechartRenderer}
            ref={this.flamechartRef}
            flamechart={chronoFlamechart}
            getCSSColorForFrame={this.getCSSColorForFrame}
          />
        )
      }
      case ViewMode.LEFT_HEAVY_FLAME_GRAPH: {
        const {leftHeavyFlamegraph, leftHeavyFlamegraphRenderer} = this.state
        if (!leftHeavyFlamegraph || !leftHeavyFlamegraphRenderer)
          throw new Error('Missing dependencies for left heavy flame graph')
        return (
          <FlamechartView
            canvasContext={this.canvasContext}
            flamechartRenderer={leftHeavyFlamegraphRenderer}
            ref={this.flamechartRef}
            flamechart={leftHeavyFlamegraph}
            getCSSColorForFrame={this.getCSSColorForFrame}
          />
        )
      }
      case ViewMode.INSIDE_OUT_VIEW: {
        return (
          <InsideOutView
            profile={this.state.activeProfile}
            getCSSColorForFrame={this.getCSSColorForFrame}
            sortMethod={this.state.tableSortMethod}
            setSortMethod={this.setTableSortMethod}
          />
        )
      }
    }
  }

  render() {
    return (
      <div
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        className={css(style.root, this.state.dragActive && style.dragTargetRoot)}
      >
        <GLCanvas setCanvasContext={this.setCanvasContext} />
        <Toolbar setViewMode={this.setViewMode} {...this.state} />
        <div className={css(style.contentContainer)}>{this.renderContent()}</div>
        {this.state.dragActive && <div className={css(style.dragTarget)} />}
      </div>
    )
  }
}

const style = StyleSheet.create({
  glCanvasView: {
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    zIndex: -1,
    pointerEvents: 'none',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loading: {
    height: 3,
    marginBottom: -3,
    background: Colors.DARK_BLUE,
    transformOrigin: '0% 50%',
    animationName: [
      {
        from: {
          transform: `scaleX(0)`,
        },
        to: {
          transform: `scaleX(1)`,
        },
      },
    ],
    animationTimingFunction: 'cubic-bezier(0, 1, 0, 1)',
    animationDuration: '30s',
  },
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontFamily: FontFamily.MONOSPACE,
    lineHeight: '20px',
  },
  dragTargetRoot: {
    cursor: 'copy',
  },
  dragTarget: {
    boxSizing: 'border-box',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: `5px dashed ${Colors.DARK_BLUE}`,
    pointerEvents: 'none',
  },
  contentContainer: {
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
    flexDirection: 'column',
    flex: 1,
  },
  landingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  landingMessage: {
    maxWidth: 600,
  },
  landingP: {
    marginBottom: 16,
  },
  hide: {
    display: 'none',
  },
  browseButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.WHITE,
    cursor: 'pointer',
  },
  link: {
    color: Colors.BRIGHT_BLUE,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  toolbar: {
    height: Sizes.TOOLBAR_HEIGHT,
    flexShrink: 0,
    background: Colors.BLACK,
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily: FontFamily.MONOSPACE,
    fontSize: FontSize.TITLE,
    lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
    userSelect: 'none',
  },
  toolbarLeft: {
    position: 'absolute',
    height: Sizes.TOOLBAR_HEIGHT,
    overflow: 'hidden',
    top: 0,
    left: 0,
    marginRight: 2,
    textAlign: 'left',
  },
  toolbarRight: {
    height: Sizes.TOOLBAR_HEIGHT,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    right: 0,
    marginRight: 2,
    textAlign: 'right',
  },
  toolbarTab: {
    background: Colors.DARK_GRAY,
    marginTop: Sizes.SEPARATOR_HEIGHT,
    height: Sizes.TOOLBAR_TAB_HEIGHT,
    lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
    paddingLeft: 2,
    paddingRight: 8,
    display: 'inline-block',
    marginLeft: 2,
    ':hover': {
      background: Colors.DARK_GRAY,
      cursor: 'pointer',
    },
  },
  toolbarTabActive: {
    background: Colors.BRIGHT_BLUE,
    ':hover': {
      background: Colors.BRIGHT_BLUE,
    },
  },
  noLinkStyle: {
    textDecoration: 'none',
    color: 'inherit',
  },
  emoji: {
    display: 'inline-block',
    verticalAlign: 'middle',
    paddingTop: '0px',
    marginRight: '0.3em',
  },
})
