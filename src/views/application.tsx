import '../../assets/reset.css'

import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'

import {ProfileGroup, SymbolRemapper} from '../lib/profile'
import {FontFamily, FontSize, Duration, ZIndex} from './style'
import {importEmscriptenSymbolMap as importEmscriptenSymbolRemapper} from '../lib/emscripten'
import {saveToFile} from '../lib/file-format'
import {ActiveProfileState} from '../app-state/active-profile-state'
import {
  LeftHeavyFlamechartView,
  ChronoFlamechartView,
  getLeftHeavyFlamechart,
  getLeftHeavyFlamechartByRegWeight,
  useFlamechartSetters,
  getChronoViewFlamechart
} from './flamechart-view-container'
import {CanvasContext, cleanGraphRenderCache} from '../gl/canvas-context'
import {Toolbar} from './toolbar'
import {importJavaScriptSourceMapSymbolRemapper} from '../lib/js-source-map'
import {Theme, withTheme} from './themes/theme'
import {ViewMode} from '../lib/view-mode'
import {
  cachedJsonDataAtom,
  canUseXHR,
  diffModeAtom,
  diffViewModeAtom,
  DiffViewMode,
  disposeProfileAtom,
  initSearchIndexAtom,
  moreInformationFrameAtom,
  profileGroupAtom,
  reverseFlamegraphAtom,
  scrollToAtom,
  searchQueryAtom,
  selectedFrameNameAtom
} from '../app-state'
import {FlamechartID, ProfileGroupState} from '../app-state/profile-group'
import {HashParams} from '../lib/hash-params'
import {StatelessComponent} from '../lib/preact-helpers'
import {SandwichViewContainer} from './sandwich-view'
import { createGetColorBucketForFrame, getFrameToColorBucket } from '../app-state/getters'
import { FlamechartSearchContextProvider } from './flamechart-search-view'
import { getSpeedscopeWindow, inSpeedscopeWindow, windowHeightCache, windowWidthCache } from '../widgetUtils'
import { useRef } from 'preact/hooks'
import { Flamechart } from '../lib/flamechart'

const importModule = import('../import')

// Force eager loading of a few code-split modules.
//
// We put them all in one place so we can directly control the relative priority
// of these.
importModule.then(() => {})
import('../lib/demangle').then(() => {})
import('source-map').then(() => {})

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

function isFileSystemDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return entry != null && entry.isDirectory
}

interface GLCanvasProps {
  canvasContext: CanvasContext | null
  theme: Theme
  setGLCanvas: (canvas: HTMLCanvasElement | null) => void
}

export type GLCanvasHandle = {
  resize: (force: boolean) => void;
  getCanvas: () => HTMLCanvasElement | null;
}

export class GLCanvas extends StatelessComponent<GLCanvasProps> {
  private canvas: HTMLCanvasElement | null = null

  private ref = (canvas: Element | null) => {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas
    } else {
      this.canvas = null
    }
    if (this.canvas) {
      this.props.setGLCanvas(this.canvas)
    }
  }

  private container: HTMLElement | null = null
  private containerRef = (container: Element | null) => {
    if (container instanceof HTMLElement) {
      this.container = container
    } else {
      this.container = null
    }
  }

  public resize = (force: boolean = false) => { this.maybeResize(force); };
  public getCanvas = () => this.canvas;

  // init states
  prevWidth = 0
  prevHeight = 0
  prevTheme = this.props.theme

  private maybeResize = (force: boolean = false) => {
    if (!this.container) return
    if (!this.props.canvasContext) return

    // gl.resize will transitively rerender the flamegraph
    const internalResized = this.props.theme != this.prevTheme
    const sizeChanged = windowWidthCache != this.prevWidth || windowHeightCache != this.prevHeight
    const shouldForceRerender = force || internalResized || sizeChanged
    
    if(shouldForceRerender){
      // console.log('speedscope-internal resizing...', 'force', force, 'internalResized', internalResized, 'sizeChanged', sizeChanged)
      // update current cache settings
      this.prevTheme = this.props.theme
      this.prevWidth = windowWidthCache
      this.prevHeight = windowHeightCache
      cleanGraphRenderCache()

      const widthInAppUnits = windowWidthCache
      const heightInAppUnits = windowHeightCache
      const widthInPixels = windowWidthCache * window.devicePixelRatio
      const heightInPixels = windowHeightCache * window.devicePixelRatio

      this.props.canvasContext.gl.resize(
        widthInPixels,
        heightInPixels,
        widthInAppUnits,
        heightInAppUnits,
      )
    }
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

  // keep in sync with widgetUtils speedscopeWindow()
  speedscopeWindowElement = document.getElementById('speedscope');
  componentDidMount() {
    if(this.speedscopeWindowElement){
      this.speedscopeWindowElement.addEventListener('resize', this.onWindowResize)
      // isolate internal events
      this.speedscopeWindowElement.addEventListener('wheel', (e) => {
        e.stopPropagation();
      }, { passive: true});
      this.speedscopeWindowElement.addEventListener('pointermove', (e) => {
        e.stopPropagation();
      }, { passive: true});
      this.speedscopeWindowElement.addEventListener('pointerover', (e) => {
        e.stopPropagation();
      }, { passive: true});
    } else window.addEventListener('resize', this.onWindowResize)
  }
  componentWillUnmount() {
    if (this.props.canvasContext) {
      this.props.canvasContext.removeBeforeFrameHandler(this.maybeResize)
    }
    if(this.speedscopeWindowElement){
      this.speedscopeWindowElement.removeEventListener('resize', this.onWindowResize)
      // isolate internal events
      this.speedscopeWindowElement.removeEventListener('wheel', (e) => {
        e.stopPropagation();
      });
      this.speedscopeWindowElement.removeEventListener('pointermove', (e) => {
        e.stopPropagation();
      });
      this.speedscopeWindowElement.removeEventListener('pointerover', (e) => {
        e.stopPropagation();
      });
    } else window.removeEventListener('resize', this.onWindowResize)
  }
  render() {
    const style = getStyle(this.props.theme)
    return (
      <div ref={this.containerRef} className={css(style.glCanvasView)}>
        <canvas ref={this.ref} width={1} height={1} />
      </div>
    )
  }
}

export type ApplicationProps = {
  setGLCanvas: (canvas: HTMLCanvasElement | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: boolean) => void
  setProfileGroup: (profileGroup: ProfileGroup) => void
  setDragActive: (dragActive: boolean) => void
  setViewMode: (viewMode: ViewMode) => void
  setFlattenRecursion: (flattenRecursion: boolean) => void
  setDisplayMinimap: (displayMinimap: boolean) => void
  setDisplayTable: (displayTable: boolean) => void
  setProfileIndexToView: (profileIndex: number) => void
  activeProfileState: ActiveProfileState | null
  canvasContext: CanvasContext | null
  theme: Theme
  profileGroup: ProfileGroupState
  flattenRecursion: boolean
  displayMinimap: boolean
  displayTable: boolean
  viewMode: ViewMode
  hashParams: HashParams
  dragActive: boolean
  loading: boolean
  glCanvas: HTMLCanvasElement | null
  error: boolean
}

export type ApplicationAPI = {
  resize: (force: boolean) => void;
  loadFoldedStr: (folded: string) => void;
  reloadWithInvertedDiff: (inverted: boolean) => void;
  reloadDiffProfile: (options: {
    diffNormalized?: boolean,
    diffInverted?: boolean,
    keepSelectedFrame?: boolean
  }) => void;
  setInitStates: (frameName: string, searchQuery: string, viewMode: string, reverse: boolean, searchIndex: number) => void;
  setLoadingState: (loading: boolean) => void;
};

export class Application extends StatelessComponent<ApplicationProps> {
  // app level api for external control
  public glRef = useRef<GLCanvasHandle>(null);
  public resize = (force: boolean = false) => {
    this.glRef.current?.resize(force);
  }

  private displayErrorMsg = '';

  
  private newDataLoaded() {
    if(this.afterLoad) {
      this.afterLoad()
      this.afterLoad = undefined;
    }
    setTimeout(() => {requestAnimationFrame(() => {
          getSpeedscopeWindow().dispatchEvent(new CustomEvent("speedscope:loaded", {
              composed:true,
              bubbles: true,
              detail: { element: this }
          }))
      });
    }, 200);
  }

  public loadFoldedStr(folded: string) {
    // Cache the JSON for potential reload with inverted diff
    cachedJsonDataAtom.set(folded)
    this.loadProfile(async () => {
      return await importProfilesFromText(`from api at ${new Date().toISOString()}`, folded)
    })
  }

  public reloadWithInvertedDiff(inverted: boolean) {
    this.reloadDiffProfile({diffInverted: inverted})
  }

  public reloadDiffProfile(options: { diffNormalized?: boolean, diffInverted?: boolean, keepSelectedFrame?: boolean }) {
    const cachedJson = cachedJsonDataAtom.get()
    if (!cachedJson) {
      console.warn('No cached JSON data to reload')
      return
    }
    // Save selected frame name before reload if keepSelectedFrame is true
    const savedFrameName = options.keepSelectedFrame ? selectedFrameNameAtom.get() : ''
    
    this.loadProfile(async () => {
      const module = await importModule
      return module.importSpeedscopeJsonWithOptions(cachedJson, options)
    })

    // Restore selected frame after reload
    if (savedFrameName) {
      this.afterLoad = () => {
        setTimeout(() => {
          selectedFrameNameAtom.set(savedFrameName)
          profileGroupAtom.setSelectedFrameByApi(savedFrameName)
        }, 200)
      }
    }
  }

  public setLoadingState(loading: boolean) {
    console.log("waiting new flamegraph data...")
    this.props.setLoading(loading)
  }

  afterLoad: (() => void) | undefined
  public setInitStates(frameName: string, searchQuery: string, viewMode: string, reverse: boolean, searchIndex: number) {
    this.afterLoad = () => {
        if (viewMode.length > 0) {
          switch (viewMode) {
              case "2":
                  this.props.setViewMode(ViewMode.SANDWICH_VIEW);
                  break;
              case "1":
                  this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH);
                  break;
              case "0":
                  this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART);
                  break;
              default:
                  this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH);
                  break;
          }
        }
        reverseFlamegraphAtom.set(reverse)
        if (searchQuery.length > 0) searchQueryAtom.set(searchQuery);
        if (frameName.length > 0) {
          setTimeout(() => {
            selectedFrameNameAtom.set(frameName);
            profileGroupAtom.setSelectedFrameByApi(frameName);
          }, 200); // wait GPU 200ms then init the selected item
          setTimeout(() => {
            initSearchIndexAtom.set(searchIndex);
            scrollToAtom.set(true);
          }, 200); // wait another 200ms then render zoomed view
        }
    }
  }

  private async loadProfile(loader: () => Promise<ProfileGroup | null>) {
    moreInformationFrameAtom.set('')
    this.props.setError(false)
    this.props.setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 0))

    if (!this.props.glCanvas) return

    console.time('import')

    let profileGroup: ProfileGroup | null = null
    try {
      profileGroup = await loader()
    } catch (e) {
      console.log('Failed to load format', e)
      this.displayErrorMsg = 'Failed to load format. ' + String(e)
      this.props.setError(true)
      return
    }

    // TODO(jlfwong): Make these into nicer overlays
    if (profileGroup == null) {
      this.displayErrorMsg = 'Invalid input! Perhaps the input was empty or corrupted.'
      this.props.setLoading(false)
      this.props.setError(true)
      return
    } else if (profileGroup.profiles.length === 0) {
      this.displayErrorMsg = "Successfully imported profile, but it's empty!"
      this.props.setLoading(false)
      this.props.setError(true)
      return
    }
    this.displayErrorMsg = ''
    this.props.setError(false)

    if (this.props.hashParams.title) {
      profileGroup = {
        ...profileGroup,
        name: this.props.hashParams.title,
      }
    }
    // document.title = `${profileGroup.name} - speedscope`

    if (this.props.hashParams.viewMode) {
      this.props.setViewMode(this.props.hashParams.viewMode)
    }

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
    
    // Dispatch the event after the profile is loaded
    this.newDataLoaded();
  }

  getStyle(): ReturnType<typeof getStyle> {
    return getStyle(this.props.theme)
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

        let symbolRemapper: SymbolRemapper | null = null

        const emscriptenSymbolRemapper = importEmscriptenSymbolRemapper(fileContents)
        if (emscriptenSymbolRemapper) {
          console.log('Importing as emscripten symbol map')
          symbolRemapper = emscriptenSymbolRemapper
        }

        const jsSourceMapRemapper = await importJavaScriptSourceMapSymbolRemapper(
          fileContents,
          file.name,
        )
        if (!symbolRemapper && jsSourceMapRemapper) {
          console.log('Importing as JavaScript source map')
          symbolRemapper = jsSourceMapRemapper
        }

        if (symbolRemapper != null) {
          return {
            name: this.props.profileGroup.name || 'profile',
            indexToView: this.props.profileGroup.indexToView,
            profiles: this.props.profileGroup.profiles.map(profileState => {
              // We do a shallow clone here to invalidate certain caches keyed
              // on a reference to the profile group under the assumption that
              // profiles are immutable. Symbol remapping is (at time of
              // writing) the only exception to that immutability.
              const p = profileState.profile.shallowClone()
              p.remapSymbols(symbolRemapper!)
              return p
            }),
          }
        }
      }

      return null
    })
  }

  loadExample = () => {
    this.loadProfile(async () => {
      const filename = 'example.txt'
      const data = 'a;b;c 100'
      return await importProfilesFromText(filename, data)
    })
  }

  onDrop = (ev: DragEvent) => {
    this.props.setDragActive(false)
    ev.preventDefault()

    if (!ev.dataTransfer) return

    const firstItem = ev.dataTransfer.items[0]
    if ('webkitGetAsEntry' in firstItem) {
      const webkitEntry: FileSystemEntry | null = firstItem.webkitGetAsEntry()

      // Instrument.app file format is actually a directory.
      if (
        webkitEntry &&
        isFileSystemDirectoryEntry(webkitEntry) &&
        webkitEntry.name.endsWith('.trace')
      ) {
        console.log('Importing as Instruments.app .trace file')
        const webkitDirectoryEntry: FileSystemDirectoryEntry = webkitEntry
        this.loadProfile(async () => {
          return await importFromFileSystemDirectoryEntry(webkitDirectoryEntry)
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
    if(!inSpeedscopeWindow()) return;
    if (ev.key === '1') {
      this.props.setViewMode(ViewMode.CHRONO_FLAME_CHART)
    } else if (ev.key === '2') {
      this.props.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH)
    } else if (ev.key === '3') {
      this.props.setViewMode(ViewMode.SANDWICH_VIEW)
    } else if (ev.key === 'r') {
      const {flattenRecursion} = this.props
      this.props.setFlattenRecursion(!flattenRecursion)
    } else if (ev.key === 'm') {
      const {displayMinimap} = this.props
      this.props.setDisplayMinimap(!displayMinimap)
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
    if(!inSpeedscopeWindow()) return;
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

  // onDocumentPaste = (ev: Event) => {
  //   if (document.activeElement != null && document.activeElement.nodeName === 'INPUT') return

  //   ev.preventDefault()
  //   ev.stopPropagation()

  //   const clipboardData = (ev as ClipboardEvent).clipboardData
  //   if (!clipboardData) return
  //   const pasted = clipboardData.getData('text')
  //   this.loadProfile(async () => {
  //     return await importProfilesFromText('From Clipboard', pasted)
  //   })
  // }

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyDown)
    window.addEventListener('keypress', this.onWindowKeyPress)
    //document.addEventListener('paste', this.onDocumentPaste)
    this.maybeLoadHashParamProfile()
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyDown)
    window.removeEventListener('keypress', this.onWindowKeyPress)
    //document.removeEventListener('paste', this.onDocumentPaste)
    disposeProfileAtom()
    this.props.activeProfileState?.profile.dispose()
    // this.props.canvasContext?.dispose() // allow user change Theme
    console.log("speedscope app closed!")
  }

  componentDidUpdate(previousProps: ApplicationProps) {
    const internalSizeChanged = previousProps.displayMinimap !== this.props.displayMinimap ||
      previousProps.displayTable !== this.props.displayTable || previousProps.profileGroup?.name !== this.props.profileGroup?.name
    if(internalSizeChanged) this.glRef.current?.resize(true)
  }

  async maybeLoadHashParamProfile() {
    const {profileURL} = this.props.hashParams
    if (profileURL) {
      if (!canUseXHR) {
        alert(
          `Cannot load a profile URL when loading from "${window.location.protocol}" URL protocol`,
        )
        return
      }
      this.loadProfile(async () => {
        const response: Response = await fetch(profileURL)
        let filename = new URL(profileURL, window.location.href).pathname
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
    const style = this.getStyle()

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
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  renderError() {
    const style = this.getStyle()
    this.resize(true)
    return (
      <div className={css(style.error)}>
        <div>😿 Something went wrong.</div>
        <div>{this.displayErrorMsg}</div>
      </div>
    )
  }

  renderLoadingBar() {
    const style = this.getStyle()
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
    
    const {profile, leftHeavyViewState, chronoViewState} = activeProfileState
    const frameToColorBucket = getFrameToColorBucket(profile)
    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    const style = this.getStyle()

    const toolBar = (flamechart: Flamechart) => (
      <Toolbar
      flamechart={flamechart}
        saveFile={this.saveFile}
        browseForFile={this.browseForFile}
        {...(this.props as ApplicationProps)}
      />
    )
  
    switch (viewMode) {
      case ViewMode.CHRONO_FLAME_CHART: {
        const flamechart = getChronoViewFlamechart({
          profile,
          getColorBucketForFrame,
        })
        const setters = useFlamechartSetters(FlamechartID.CHRONO)

        return (
          <FlamechartSearchContextProvider
            flamechart={flamechart}
            selectedNode={chronoViewState.selectedNode}
            setSelectedNode={setters.setSelectedNode}
            configSpaceViewportRect={chronoViewState.configSpaceViewportRect}
            setConfigSpaceViewportRect={setters.setConfigSpaceViewportRect}
          >
            {toolBar(flamechart)}
            <div className={css(style.contentContainer)}>
              <ChronoFlamechartView activeProfileState={activeProfileState} glCanvas={glCanvas} 
              displayMinimap ={this.props.displayMinimap} displayTable={this.props.displayTable} flamechart={flamechart} setters={setters}/>
            </div>
          </FlamechartSearchContextProvider>
        )
      }
      case ViewMode.LEFT_HEAVY_FLAME_GRAPH: {
        const flamechart = getLeftHeavyFlamechart({
          profile,
          getColorBucketForFrame,
        })
        const setters = useFlamechartSetters(FlamechartID.LEFT_HEAVY)

        // Check for Both mode to set up REG flamechart props
        const diffMode = diffModeAtom.get()
        const diffViewMode = diffViewModeAtom.get()
        const isBothMode = diffViewMode === DiffViewMode.BOTH && diffMode && flamechart.hasDiffData()

        const flamechartReg = isBothMode ? getLeftHeavyFlamechartByRegWeight({profile, getColorBucketForFrame}) : null
        const settersReg = useFlamechartSetters(FlamechartID.LEFT_HEAVY_REG)
        const leftHeavyViewStateReg = activeProfileState.leftHeavyViewStateReg

        return (
          <FlamechartSearchContextProvider
            flamechart={flamechart}
            selectedNode={leftHeavyViewState.selectedNode}
            setSelectedNode={setters.setSelectedNode}
            configSpaceViewportRect={leftHeavyViewState.configSpaceViewportRect}
            setConfigSpaceViewportRect={setters.setConfigSpaceViewportRect}
            flamechartReg={flamechartReg}
            configSpaceViewportRectReg={leftHeavyViewStateReg?.configSpaceViewportRect}
            setConfigSpaceViewportRectReg={settersReg.setConfigSpaceViewportRect}
            setSelectedNodeReg={settersReg.setSelectedNode}
          >
            {toolBar(flamechart)}
            <div className={css(style.contentContainer)}>
              <LeftHeavyFlamechartView activeProfileState={activeProfileState} glCanvas={glCanvas} 
              displayMinimap ={this.props.displayMinimap} displayTable={this.props.displayTable} flamechart={flamechart} setters={setters}/>
            </div>
          </FlamechartSearchContextProvider>
        )
      }
      case ViewMode.SANDWICH_VIEW: {
        const flamechart = getChronoViewFlamechart({
          profile,
          getColorBucketForFrame,
        })
        const setters = useFlamechartSetters(FlamechartID.CHRONO)

        return (
          <FlamechartSearchContextProvider
            flamechart={flamechart}
            selectedNode={chronoViewState.selectedNode}
            setSelectedNode={setters.setSelectedNode}
            configSpaceViewportRect={chronoViewState.configSpaceViewportRect}
            setConfigSpaceViewportRect={setters.setConfigSpaceViewportRect}
          >
            {toolBar(flamechart)}
            <div className={css(style.contentContainer)}>
              <SandwichViewContainer activeProfileState={activeProfileState} glCanvas={glCanvas} />
            </div>
          </FlamechartSearchContextProvider>
        )
      }
    }
  }

  render() {
    const style = this.getStyle()
    return (
      <div
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        className={css(style.root, this.props.dragActive && style.dragTargetRoot)}
      >
        <GLCanvas
          ref={this.glRef}
          setGLCanvas={this.props.setGLCanvas}
          canvasContext={this.props.canvasContext}
          theme={this.props.theme}
        />
        {this.renderContent()}
        {this.props.dragActive && <div className={css(style.dragTarget)} />}
      </div>
    )
  }
}

const getStyle = withTheme(theme =>
  StyleSheet.create({
    glCanvasView: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: ZIndex.GRAPH,
      pointerEvents: 'none'
    },
    error: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: "rgba(0, 0, 0, 0.75)",
      zIndex: ZIndex.INFO,
    },
    loading: {
      height: 3,
      marginBottom: -3,
      background: theme.selectionPrimaryColor,
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
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: FontFamily.MONOSPACE,
      lineHeight: '20px',
      color: theme.fgPrimaryColor,
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
      border: `5px dashed ${theme.selectionPrimaryColor}`,
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
      background: theme.selectionPrimaryColor,
      color: theme.altFgPrimaryColor,
      transition: `all ${Duration.HOVER_CHANGE} ease-in`,
      ':hover': {
        background: theme.selectionSecondaryColor,
      },
    },
    link: {
      color: theme.selectionPrimaryColor,
      cursor: 'pointer',
      textDecoration: 'none',
      transition: `all ${Duration.HOVER_CHANGE} ease-in`,
      ':hover': {
        color: theme.selectionSecondaryColor,
      },
    },
  }),
)
