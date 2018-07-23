import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {FileSystemDirectoryEntry} from './import/file-system-entry'

import {FlamechartRowAtlasKey} from './flamechart-renderer'
import {CanvasContext} from './canvas-context'

import {Profile, Frame} from './profile'
import {FlamechartView} from './flamechart-view'
import {FontFamily, FontSize, Colors, Sizes, Duration} from './style'
import {getHashParams, HashParams} from './hash-params'
import {SortMethod} from './profile-table-view'
import {triangle} from './utils'
import {Color} from './color'
import {RowAtlas} from './row-atlas'
import {importEmscriptenSymbolMap} from './emscripten'
import {SandwichView} from './sandwich-view'
import {saveToFile} from './file-format'
import {ApplicationState, actions, ViewMode} from './application-store'
import {Dispatch} from './typed-redux'

const importModule = import('./import')
// Force eager loading of the module
importModule.then(() => {})
async function importProfile(fileName: string, contents: string): Promise<Profile | null> {
  return (await importModule).importProfile(fileName, contents)
}
async function importFromFileSystemDirectoryEntry(entry: FileSystemDirectoryEntry) {
  return (await importModule).importFromFileSystemDirectoryEntry(entry)
}

const protocol = window.location.protocol
const canUseXHR = protocol === 'http:' || protocol === 'https:'

declare function require(x: string): any
const exampleProfileURL = require('./sample/profiles/stackcollapse/perf-vertx-stacks-01-collapsed-all.txt')

interface ToolbarProps extends ApplicationState {
  setViewMode(order: ViewMode): void
  browseForFile(): void
  saveFile(): void
}

export class Toolbar extends Component<ToolbarProps, void> {
  setTimeOrder = () => {
    this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
  }

  setLeftHeavyOrder = () => {
    this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
  }

  setSandwichView = () => {
    this.props.setViewMode(ViewMode.SANDWICH_VIEW)
  }

  render() {
    const importFile = (
      <div className={css(style.toolbarTab)} onClick={this.props.browseForFile}>
        <span className={css(style.emoji)}>⤵️</span>Import
      </div>
    )
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
          🔬speedscope
          <div className={css(style.toolbarRight)}>
            {importFile}
            {help}
          </div>
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
              this.props.viewMode === ViewMode.SANDWICH_VIEW && style.toolbarTabActive,
            )}
            onClick={this.setSandwichView}
          >
            <span className={css(style.emoji)}>🥪</span>Sandwich
          </div>
        </div>
        {this.props.profile.getName()}
        <div className={css(style.toolbarRight)}>
          <div className={css(style.toolbarTab)} onClick={this.props.saveFile}>
            <span className={css(style.emoji)}>⤴️</span>Export
          </div>
          {importFile}
          {help}
        </div>
      </div>
    )
  }
}

interface GLCanvasProps {
  setCanvasContext(canvasContext: CanvasContext | null): void
}
export class GLCanvas extends Component<GLCanvasProps, void> {
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

interface EmptyState {
  __dummy: void
}

export class Application extends Component<
  {app: ApplicationState; dispatch: Dispatch},
  EmptyState
> {
  hashParams: HashParams

  constructor() {
    super()
    this.hashParams = getHashParams()
    /*
    // TODO(jlfwong): Reimplement this bit
    this.state = {
      // Start out at a loading state if we know that we'll immediately be fetching a profile to
      // view.
      loading:
        (canUseXHR && this.hashParams.profileURL != null) ||
        this.hashParams.localProfilePath != null,
    }
    */
  }

  async loadProfile(loader: () => Promise<Profile | null>) {
    this.props.dispatch(actions.setLoading(true))
    await new Promise(resolve => setTimeout(resolve, 0))

    if (!this.canvasContext || !this.rowAtlas) return

    console.time('import')

    let profile: Profile | null = null
    try {
      profile = await loader()
    } catch (e) {
      console.log('Failed to load format', e)
      this.props.dispatch(actions.setError(true))
      return
    }

    if (profile == null) {
      // TODO(jlfwong): Make this a nicer overlay
      alert('Unrecognized format! See documentation about supported formats.')
      this.props.dispatch(actions.setLoading(false))
      return
    }

    await profile.demangle()

    const title = this.hashParams.title || profile.getName()
    profile.setName(title)

    await this.setActiveProfile(profile)

    console.timeEnd('import')
    this.props.dispatch(actions.setProfile(profile))
    this.props.dispatch(actions.setLoading(false))
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

    this.props.dispatch(
      actions.setActiveProfile({
        profile,
        canvasContext: this.canvasContext,
        rowAtlas: this.rowAtlas,
        frameToColorBucket,
      }),
    )
  }

  loadFromFile(file: File) {
    this.loadProfile(async () => {
      const reader = new FileReader()
      const loadPromise = new Promise(resolve => reader.addEventListener('loadend', resolve))
      reader.readAsText(file)
      await loadPromise

      const profile = await importProfile(file.name, reader.result)
      if (profile) {
        if (!profile.getName()) {
          profile.setName(file.name)
        }
        return profile
      }

      if (this.props.app.profile) {
        // If a profile is already loaded, it's possible the file being imported is
        // a symbol map. If that's the case, we want to parse it, and apply the symbol
        // mapping to the already loaded profile. This can be use to take an opaque
        // profile and make it readable.
        const map = importEmscriptenSymbolMap(reader.result)
        if (map) {
          console.log('Importing as emscripten symbol map')
          let profile = this.props.app.profile
          profile.remapNames(name => map.get(name) || name)
          return profile
        }
      }

      return null
    })
  }

  loadExample = () => {
    this.loadProfile(async () => {
      const filename = 'perf-vertx-stacks-01-collapsed-all.txt'
      const data = await fetch(exampleProfileURL).then(resp => resp.text())
      const profile = await importProfile(filename, data)
      if (profile && !profile.getName()) {
        profile.setName(filename)
      }
      return profile
    })
  }

  onDrop = (ev: DragEvent) => {
    this.props.dispatch(actions.setDragActive(false))
    ev.preventDefault()

    const firstItem = ev.dataTransfer.items[0]
    if ('webkitGetAsEntry' in firstItem) {
      const webkitEntry: FileSystemDirectoryEntry = firstItem.webkitGetAsEntry()

      // Instrument.app file format is actually a directory.
      if (webkitEntry.isDirectory && webkitEntry.name.endsWith('.trace')) {
        console.log('Importing as Instruments.app .trace file')
        this.loadProfile(async () => await importFromFileSystemDirectoryEntry(webkitEntry))
        return
      }
    }

    let file: File | null = ev.dataTransfer.files.item(0)
    if (file) {
      this.loadFromFile(file)
    }
  }

  onDragOver = (ev: DragEvent) => {
    this.props.dispatch(actions.setDragActive(true))
    ev.preventDefault()
  }

  onDragLeave = (ev: DragEvent) => {
    this.props.dispatch(actions.setDragActive(false))
    ev.preventDefault()
  }

  onWindowKeyPress = async (ev: KeyboardEvent) => {
    if (ev.key === '1') {
      this.props.dispatch(actions.setViewMode(ViewMode.CHRONO_FLAME_CHART))
    } else if (ev.key === '2') {
      this.props.dispatch(actions.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH))
    } else if (ev.key === '3') {
      this.props.dispatch(actions.setViewMode(ViewMode.SANDWICH_VIEW))
    } else if (ev.key === 'r') {
      const {flattenRecursion, profile} = this.props.app
      if (!profile) return
      if (flattenRecursion) {
        await this.setActiveProfile(profile)
        this.props.dispatch(actions.setFlattenRecursion(false))
      } else {
        await this.setActiveProfile(profile.getProfileWithRecursionFlattened())
        this.props.dispatch(actions.setFlattenRecursion(true))
      }
    }
  }

  private saveFile = () => {
    if (this.props.app.profile) {
      saveToFile(this.props.app.profile)
    }
  }

  private browseForFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.addEventListener('change', this.onFileSelect)
    input.click()
  }

  private onWindowKeyDown = async (ev: KeyboardEvent) => {
    // This has to be handled on key down in order to prevent the default
    // page save action.
    if (ev.key === 's' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault()
      this.saveFile()
    } else if (ev.key === 'o' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault()
      this.browseForFile()
    }
  }

  onDocumentPaste = (ev: Event) => {
    ev.preventDefault()
    ev.stopPropagation()

    const pasted = (ev as ClipboardEvent).clipboardData.getData('text')
    this.loadProfile(async () => importProfile('From Clipboard', pasted))
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyDown)
    window.addEventListener('keypress', this.onWindowKeyPress)
    document.addEventListener('paste', this.onDocumentPaste)
    this.maybeLoadHashParamProfile()
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyDown)
    window.removeEventListener('keypress', this.onWindowKeyPress)
    document.removeEventListener('paste', this.onDocumentPaste)
  }

  async maybeLoadHashParamProfile() {
    if (this.hashParams.profileURL) {
      if (!canUseXHR) {
        alert(`Cannot load a profile URL when loading from "${protocol}" URL protocol`)
        return
      }
      this.loadProfile(async () => {
        const response = await fetch(this.hashParams.profileURL!)
        let filename = new URL(this.hashParams.profileURL!).pathname
        if (filename.includes('/')) {
          filename = filename.slice(filename.lastIndexOf('/') + 1)
        }
        return await importProfile(filename, await response.text())
      })
    } else if (this.hashParams.localProfilePath) {
      // There isn't good cross-browser support for XHR of local files, even from
      // other local files. To work around this restriction, we load the local profile
      // as a JavaScript file which will invoke a global function.
      ;(window as any)['speedscope'] = {
        loadFileFromBase64: (filename: string, base64source: string) => {
          const source = atob(base64source)
          this.loadProfile(() => importProfile(filename, source))
        },
      }

      const script = document.createElement('script')
      script.src = `file:///${this.hashParams.localProfilePath}`
      document.head.appendChild(script)
    }
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
          {canUseXHR ? (
            <p className={css(style.landingP)}>
              Drag and drop a profile file onto this window to get started, click the big blue
              button below to browse for a profile to explore, or{' '}
              <a tabIndex={0} className={css(style.link)} onClick={this.loadExample}>
                click here
              </a>{' '}
              to load an example profile.
            </p>
          ) : (
            <p className={css(style.landingP)}>
              Drag and drop a profile file onto this window to get started, or click the big blue
              button below to browse for a profile to explore.
            </p>
          )}
          <div className={css(style.browseButtonContainer)}>
            <input
              type="file"
              name="file"
              id="file"
              onChange={this.onFileSelect}
              className={css(style.hide)}
            />
            <label for="file" className={css(style.browseButton)} tabIndex={0}>
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
    this.props.dispatch(actions.setViewMode(viewMode))
  }

  setTableSortMethod = (tableSortMethod: SortMethod) => {
    this.props.dispatch(actions.setTableSortMethod(tableSortMethod))
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

  getColorBucketForFrame = (frame: Frame): number => {
    const {flamechart} = this.props.app.chronoView
    if (!flamechart) return 0
    return flamechart.getColorBucketForFrame(frame)
  }

  getCSSColorForFrame = (frame: Frame): string => {
    const {flamechart} = this.props.app.chronoView
    if (!flamechart) return '#FFFFFF'

    const t = flamechart.getColorBucketForFrame(frame) / 255

    const x = triangle(30.0 * t)
    const H = 360.0 * (0.9 * t)
    const C = 0.25 + 0.2 * x
    const L = 0.8 - 0.15 * x
    return Color.fromLumaChromaHue(L, C, H).toCSS()
  }

  renderContent() {
    const {viewMode, error, loading, activeProfile} = this.props.app

    if (error) {
      return this.renderError()
    }

    if (loading) {
      return this.renderLoadingBar()
    }

    if (!activeProfile) {
      return this.renderLanding()
    }

    if (!this.canvasContext) {
      throw new Error('Missing canvas context')
    }

    switch (viewMode) {
      case ViewMode.CHRONO_FLAME_CHART: {
        const {flamechart, flamechartRenderer} = this.props.app.chronoView
        if (!flamechart || !flamechartRenderer)
          throw new Error('Missing dependencies for chrono flame chart')
        return (
          <FlamechartView
            canvasContext={this.canvasContext}
            flamechartRenderer={flamechartRenderer}
            ref={this.flamechartRef}
            flamechart={flamechart}
            getCSSColorForFrame={this.getCSSColorForFrame}
          />
        )
      }
      case ViewMode.LEFT_HEAVY_FLAME_GRAPH: {
        const {flamechart, flamechartRenderer} = this.props.app.leftHeavyView
        if (!flamechart || !flamechartRenderer)
          throw new Error('Missing dependencies for left heavy flame chart')
        return (
          <FlamechartView
            canvasContext={this.canvasContext}
            flamechartRenderer={flamechartRenderer}
            ref={this.flamechartRef}
            flamechart={flamechart}
            getCSSColorForFrame={this.getCSSColorForFrame}
          />
        )
      }
      case ViewMode.SANDWICH_VIEW: {
        if (!this.rowAtlas || !this.props.app.profile) return null
        return (
          <SandwichView
            profile={this.props.app.profile}
            flattenRecursion={this.props.app.flattenRecursion}
            getColorBucketForFrame={this.getColorBucketForFrame}
            getCSSColorForFrame={this.getCSSColorForFrame}
            sortMethod={this.props.app.sandwichView.tableSortMethod}
            setSortMethod={this.setTableSortMethod}
            canvasContext={this.canvasContext}
            rowAtlas={this.rowAtlas}
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
        className={css(style.root, this.props.app.dragActive && style.dragTargetRoot)}
      >
        <GLCanvas setCanvasContext={this.setCanvasContext} />
        <Toolbar
          setViewMode={this.setViewMode}
          saveFile={this.saveFile}
          browseForFile={this.browseForFile}
          {...this.props.app}
        />
        <div className={css(style.contentContainer)}>{this.renderContent()}</div>
        {this.props.app.dragActive && <div className={css(style.dragTarget)} />}
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
    transition: `all ${Duration.HOVER_CHANGE} ease-in`,
    ':hover': {
      background: Colors.BRIGHT_BLUE,
    },
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
    transition: `all ${Duration.HOVER_CHANGE} ease-in`,
    ':hover': {
      background: Colors.GRAY,
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
