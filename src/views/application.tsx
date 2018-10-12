import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {FileSystemDirectoryEntry} from '../import/file-system-entry'

import {Profile, ProfileGroup} from '../lib/profile'
import {FontFamily, FontSize, Colors, Sizes, Duration} from './style'
import {importEmscriptenSymbolMap} from '../lib/emscripten'
import {SandwichViewContainer} from './sandwich-view'
import {saveToFile} from '../lib/file-format'
import {ApplicationState, ViewMode, canUseXHR} from '../store'
import {StatelessComponent} from '../lib/typed-redux'
import {LeftHeavyFlamechartView, ChronoFlamechartView} from './flamechart-view-container'
import {SandwichViewState} from '../store/sandwich-view-state'
import {FlamechartViewState} from '../store/flamechart-view-state'
import {CanvasContext} from '../gl/canvas-context'
import {Graphics} from '../gl/graphics'

const importModule = import('../import')
// Force eager loading of the module
importModule.then(() => {})

async function importProfilesFromText(
  fileName: string,
  contents: string,
): Promise<ProfileGroup | null> {
  return (await importModule).importProfileGroupFromText(fileName, contents)
}

async function importProfilesFromBase64(
  fileName: string,
  contents: string,
): Promise<ProfileGroup | null> {
  return (await importModule).importProfileGroupFromBase64(fileName, contents)
}

async function importProfilesFromArrayBuffer(
  fileName: string,
  contents: ArrayBuffer,
): Promise<ProfileGroup | null> {
  return (await importModule).importProfilesFromArrayBuffer(fileName, contents)
}

async function importProfilesFromFile(file: File): Promise<ProfileGroup | null> {
  return (await importModule).importProfilesFromFile(file)
}
async function importFromFileSystemDirectoryEntry(entry: FileSystemDirectoryEntry) {
  return (await importModule).importFromFileSystemDirectoryEntry(entry)
}

declare function require(x: string): any
const exampleProfileURL = require('../../sample/profiles/stackcollapse/perf-vertx-stacks-01-collapsed-all.txt')

interface ToolbarProps extends ApplicationProps {
  browseForFile(): void
  saveFile(): void
}

export class Toolbar extends StatelessComponent<ToolbarProps> {
  setTimeOrder = () => {
    this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
  }

  setLeftHeavyOrder = () => {
    this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
  }

  setSandwichView = () => {
    this.props.setViewMode(ViewMode.SANDWICH_VIEW)
  }

  renderLeftContent() {
    if (!this.props.activeProfileState) return null

    return (
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
    )
  }

  renderCenterContent() {
    const {activeProfileState, profileGroup} = this.props
    if (activeProfileState && profileGroup) {
      const {index} = activeProfileState
      if (profileGroup.profiles.length === 1) {
        return activeProfileState.profile.getName()
      } else {
        function makeNavButton(content: string, disabled: boolean, onClick: () => void) {
          return (
            <button
              disabled={disabled}
              onClick={onClick}
              className={css(
                style.emoji,
                style.toolbarProfileNavButton,
                disabled && style.toolbarProfileNavButtonDisabled,
              )}
            >
              {content}
            </button>
          )
        }

        const prevButton = makeNavButton('⬅️', index === 0, () =>
          this.props.setProfileIndexToView(index - 1),
        )
        const nextButton = makeNavButton('➡️', index >= profileGroup.profiles.length - 1, () =>
          this.props.setProfileIndexToView(index + 1),
        )

        return (
          <div className={css(style.toolbarCenter)}>
            {prevButton}
            {activeProfileState.profile.getName()}{' '}
            <span className={css(style.toolbarProfileIndex)}>
              ({activeProfileState.index + 1}/{profileGroup.profiles.length})
            </span>
            {nextButton}
          </div>
        )
      }
    }
    return '🔬speedscope'
  }

  renderRightContent() {
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

    return (
      <div className={css(style.toolbarRight)}>
        {this.props.activeProfileState && (
          <div className={css(style.toolbarTab)} onClick={this.props.saveFile}>
            <span className={css(style.emoji)}>⤴️</span>Export
          </div>
        )}
        {importFile}
        {help}
      </div>
    )
  }

  render() {
    return (
      <div className={css(style.toolbar)}>
        {this.renderLeftContent()}
        {this.renderCenterContent()}
        {this.renderRightContent()}
      </div>
    )
  }
}

interface GLCanvasProps {
  canvasContext: CanvasContext | null
  setGLCanvas: (canvas: HTMLCanvasElement | null) => void
}
export class GLCanvas extends Component<GLCanvasProps, void> {
  private canvas: HTMLCanvasElement | null = null

  private ref = (canvas?: Element) => {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas
    } else {
      this.canvas = null
    }

    this.props.setGLCanvas(this.canvas)
  }

  private container: HTMLElement | null = null
  private containerRef = (container?: Element) => {
    if (container instanceof HTMLElement) {
      this.container = container
    } else {
      this.container = null
    }
  }

  private maybeResize = () => {
    if (!this.container) return
    if (!this.props.canvasContext) return

    let {width, height} = this.container.getBoundingClientRect()

    const widthInAppUnits = width
    const heightInAppUnits = height
    const widthInPixels = width * window.devicePixelRatio
    const heightInPixels = height * window.devicePixelRatio

    this.props.canvasContext.gl.resize(
      widthInPixels,
      heightInPixels,
      widthInAppUnits,
      heightInAppUnits,
    )
    this.props.canvasContext.gl.clear(new Graphics.Color(1, 1, 1, 1))
  }

  onWindowResize = () => {
    if (this.props.canvasContext) {
      this.props.canvasContext.requestFrame()
    }
  }
  componentWillReceiveProps(nextProps: GLCanvasProps) {
    if (this.props.canvasContext !== nextProps.canvasContext) {
      if (this.props.canvasContext) {
        this.props.canvasContext.removeBeforeFrameHandler(this.maybeResize)
      }
      if (nextProps.canvasContext) {
        nextProps.canvasContext.addBeforeFrameHandler(this.maybeResize)
        nextProps.canvasContext.requestFrame()
      }
    }
  }
  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize)
  }
  componentWillUnmount() {
    if (this.props.canvasContext) {
      this.props.canvasContext.removeBeforeFrameHandler(this.maybeResize)
    }
    window.removeEventListener('resize', this.onWindowResize)
  }
  render() {
    return (
      <div ref={this.containerRef} className={css(style.glCanvasView)}>
        <canvas ref={this.ref} width={1} height={1} />
      </div>
    )
  }
}

export interface ActiveProfileState {
  profile: Profile
  index: number
  chronoViewState: FlamechartViewState
  leftHeavyViewState: FlamechartViewState
  sandwichViewState: SandwichViewState
}

export type ApplicationProps = ApplicationState & {
  setGLCanvas: (canvas: HTMLCanvasElement | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: boolean) => void
  setProfileGroup: (profileGroup: ProfileGroup) => void
  setDragActive: (dragActive: boolean) => void
  setViewMode: (viewMode: ViewMode) => void
  setFlattenRecursion: (flattenRecursion: boolean) => void
  setProfileIndexToView: (profileIndex: number) => void
  activeProfileState: ActiveProfileState | null
  canvasContext: CanvasContext | null
}

export class Application extends StatelessComponent<ApplicationProps> {
  private async loadProfile(loader: () => Promise<ProfileGroup | null>) {
    this.props.setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 0))

    if (!this.props.glCanvas) return

    console.time('import')

    let profileGroup: ProfileGroup | null = null
    try {
      profileGroup = await loader()
    } catch (e) {
      console.log('Failed to load format', e)
      this.props.setError(true)
      return
    }

    if (profileGroup == null) {
      // TODO(jlfwong): Make this a nicer overlay
      alert('Unrecognized format! See documentation about supported formats.')
      this.props.setLoading(false)
      return
    }

    if (this.props.hashParams.title) {
      profileGroup = {
        name: this.props.hashParams.title,
        ...profileGroup,
      }
    }
    document.title = `${profileGroup.name} - speedscope`

    for (let profile of profileGroup.profiles) {
      await profile.demangle()
    }

    for (let profile of profileGroup.profiles) {
      const title = this.props.hashParams.title || profile.getName()
      profile.setName(title)
    }

    console.timeEnd('import')

    this.props.setProfileGroup(profileGroup)
    this.props.setLoading(false)
  }

  loadFromFile(file: File) {
    this.loadProfile(async () => {
      const profiles = await importProfilesFromFile(file)
      if (profiles) {
        for (let profile of profiles.profiles) {
          if (!profile.getName()) {
            profile.setName(file.name)
          }
        }
        return profiles
      }

      if (this.props.profileGroup && this.props.activeProfileState) {
        // If a profile is already loaded, it's possible the file being imported is
        // a symbol map. If that's the case, we want to parse it, and apply the symbol
        // mapping to the already loaded profile. This can be use to take an opaque
        // profile and make it readable.
        const reader = new FileReader()
        const fileContentsPromise = new Promise<string>(resolve => {
          reader.addEventListener('loadend', () => {
            if (typeof reader.result !== 'string') {
              throw new Error('Expected reader.result to be a string')
            }
            resolve(reader.result)
          })
        })
        reader.readAsText(file)
        const fileContents = await fileContentsPromise

        const map = importEmscriptenSymbolMap(fileContents)
        if (map) {
          const {profile, index} = this.props.activeProfileState
          console.log('Importing as emscripten symbol map')
          profile.remapNames(name => map.get(name) || name)
          return {
            name: this.props.profileGroup.name || 'profile',
            indexToView: index,
            profiles: [profile],
          }
        }
      }

      return null
    })
  }

  loadExample = () => {
    this.loadProfile(async () => {
      const filename = 'perf-vertx-stacks-01-collapsed-all.txt'
      const data = await fetch(exampleProfileURL).then(resp => resp.text())
      return await importProfilesFromText(filename, data)
    })
  }

  onDrop = (ev: DragEvent) => {
    this.props.setDragActive(false)
    ev.preventDefault()

    const firstItem = ev.dataTransfer.items[0]
    if ('webkitGetAsEntry' in firstItem) {
      const webkitEntry: FileSystemDirectoryEntry = firstItem.webkitGetAsEntry()

      // Instrument.app file format is actually a directory.
      if (webkitEntry.isDirectory && webkitEntry.name.endsWith('.trace')) {
        console.log('Importing as Instruments.app .trace file')
        this.loadProfile(async () => {
          return await importFromFileSystemDirectoryEntry(webkitEntry)
        })
        return
      }
    }

    let file: File | null = ev.dataTransfer.files.item(0)
    if (file) {
      this.loadFromFile(file)
    }
  }

  onDragOver = (ev: DragEvent) => {
    this.props.setDragActive(true)
    ev.preventDefault()
  }

  onDragLeave = (ev: DragEvent) => {
    this.props.setDragActive(false)
    ev.preventDefault()
  }

  onWindowKeyPress = async (ev: KeyboardEvent) => {
    if (ev.key === '1') {
      this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
    } else if (ev.key === '2') {
      this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
    } else if (ev.key === '3') {
      this.props.setViewMode(ViewMode.SANDWICH_VIEW)
    } else if (ev.key === 'r') {
      const {flattenRecursion} = this.props
      this.props.setFlattenRecursion(!flattenRecursion)
    } else if (ev.key === 'n') {
      const {activeProfileState} = this.props
      if (activeProfileState) {
        this.props.setProfileIndexToView(activeProfileState.index + 1)
      }
    } else if (ev.key === 'p') {
      const {activeProfileState} = this.props
      if (activeProfileState) {
        this.props.setProfileIndexToView(activeProfileState.index - 1)
      }
    }
  }

  private saveFile = () => {
    if (this.props.profileGroup) {
      const {name, indexToView, profiles} = this.props.profileGroup
      const profileGroup: ProfileGroup = {
        name,
        indexToView,
        profiles: profiles.map(p => p.profile),
      }
      saveToFile(profileGroup)
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
    this.loadProfile(async () => {
      return await importProfilesFromText('From Clipboard', pasted)
    })
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
    if (this.props.hashParams.profileURL) {
      if (!canUseXHR) {
        alert(
          `Cannot load a profile URL when loading from "${window.location.protocol}" URL protocol`,
        )
        return
      }
      this.loadProfile(async () => {
        const response: Response = await fetch(this.props.hashParams.profileURL!)
        let filename = new URL(this.props.hashParams.profileURL!).pathname
        if (filename.includes('/')) {
          filename = filename.slice(filename.lastIndexOf('/') + 1)
        }
        return await importProfilesFromArrayBuffer(filename, await response.arrayBuffer())
      })
    } else if (this.props.hashParams.localProfilePath) {
      // There isn't good cross-browser support for XHR of local files, even from
      // other local files. To work around this restriction, we load the local profile
      // as a JavaScript file which will invoke a global function.
      ;(window as any)['speedscope'] = {
        loadFileFromBase64: (filename: string, base64source: string) => {
          this.loadProfile(() => importProfilesFromBase64(filename, base64source))
        },
      }

      const script = document.createElement('script')
      script.src = `file:///${this.props.hashParams.localProfilePath}`
      document.head.appendChild(script)
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

  renderContent() {
    const {viewMode, activeProfileState, error, loading, glCanvas} = this.props

    if (error) {
      return this.renderError()
    }

    if (loading) {
      return this.renderLoadingBar()
    }

    if (!activeProfileState || !glCanvas) {
      return this.renderLanding()
    }

    switch (viewMode) {
      case ViewMode.CHRONO_FLAME_CHART: {
        return <ChronoFlamechartView activeProfileState={activeProfileState} glCanvas={glCanvas} />
      }
      case ViewMode.LEFT_HEAVY_FLAME_GRAPH: {
        return (
          <LeftHeavyFlamechartView activeProfileState={activeProfileState} glCanvas={glCanvas} />
        )
      }
      case ViewMode.SANDWICH_VIEW: {
        return <SandwichViewContainer activeProfileState={activeProfileState} glCanvas={glCanvas} />
      }
    }
  }

  render() {
    return (
      <div
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        className={css(style.root, this.props.dragActive && style.dragTargetRoot)}
      >
        <GLCanvas setGLCanvas={this.props.setGLCanvas} canvasContext={this.props.canvasContext} />
        <Toolbar
          saveFile={this.saveFile}
          browseForFile={this.browseForFile}
          {...this.props as ApplicationProps}
        />
        <div className={css(style.contentContainer)}>{this.renderContent()}</div>
        {this.props.dragActive && <div className={css(style.dragTarget)} />}
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
  toolbarCenter: {
    paddingTop: 1,
    height: Sizes.TOOLBAR_HEIGHT,
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
  toolbarProfileIndex: {
    color: Colors.LIGHT_GRAY,
  },
  toolbarProfileNavButton: {
    opacity: 0.8,
    fontSize: FontSize.TITLE,
    lineHeight: `${Sizes.TOOLBAR_TAB_HEIGHT}px`,
    ':hover': {
      opacity: 1.0,
    },
    background: 'none',
    border: 'none',
    padding: 0,
    marginLeft: '0.3em',
    marginRight: '0.3em',
    transition: `all ${Duration.HOVER_CHANGE} ease-in`,
  },
  toolbarProfileNavButtonDisabled: {
    opacity: 0.5,
    ':hover': {
      opacity: 0.5,
    },
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
