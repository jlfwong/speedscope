import {Profile, Frame} from './profile'
import {Flamechart} from './flamechart'
import {FlamechartRenderer, FlamechartRowAtlasKey} from './flamechart-renderer'
import {CanvasContext} from './canvas-context'
import {RowAtlas} from './row-atlas'
import {ImmutableModel} from './immutable-model'
import {SandwichViewModel} from './sandwich-view-model'
import {FlamechartViewModel} from './flamechart-view-model'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export interface ApplicationState {
  profile: Profile | null
  activeProfile: Profile | null
  shouldFlattenRecursion: boolean

  chronoFlamechart: Flamechart | null
  chronoFlamechartRenderer: FlamechartRenderer | null

  leftHeavyFlamegraph: Flamechart | null
  leftHeavyFlamegraphRenderer: FlamechartRenderer | null

  viewMode: ViewMode
  isDragActive: boolean
  isLoading: boolean
  didEncounterError: boolean

  sandwichViewModel: SandwichViewModel
  leftHeavyFlamegraphModel: FlamechartViewModel
  chronoFlamechartModel: FlamechartViewModel
}

export class ApplicationModel extends ImmutableModel<ApplicationState> {
  constructor(state: Partial<ApplicationState>) {
    const defaultState: ApplicationState = {
      isLoading: false,
      isDragActive: false,
      didEncounterError: false,
      profile: null,
      activeProfile: null,
      shouldFlattenRecursion: false,

      chronoFlamechart: null,
      chronoFlamechartRenderer: null,

      leftHeavyFlamegraph: null,
      leftHeavyFlamegraphRenderer: null,

      viewMode: ViewMode.CHRONO_FLAME_CHART,

      sandwichViewModel: new SandwichViewModel({}),
      leftHeavyFlamegraphModel: new FlamechartViewModel({}),
      chronoFlamechartModel: new FlamechartViewModel({}),
    }

    super({...defaultState, ...state})
    this.sandwichViewModel.setUpdateHandler(async substate => {
      await this.update({sandwichViewModel: new SandwichViewModel(substate)})
    })
    this.leftHeavyFlamegraphModel.setUpdateHandler(async substate => {
      await this.update({leftHeavyFlamegraphModel: new FlamechartViewModel(substate)})
    })
    this.chronoFlamechartModel.setUpdateHandler(async substate => {
      await this.update({chronoFlamechartModel: new FlamechartViewModel(substate)})
    })
  }

  get profile(): Profile | null {
    return this.get().profile
  }

  async setProfile(profile: Profile | null) {
    await this.update({profile})
  }

  get activeProfile(): Profile | null {
    return this.get().activeProfile
  }

  get chronoFlamechart() {
    return this.get().chronoFlamechart
  }

  get chronoFlamechartRenderer(): FlamechartRenderer | null {
    return this.get().chronoFlamechartRenderer
  }

  get leftHeavyFlamegraph() {
    return this.get().leftHeavyFlamegraph
  }

  get leftHeavyFlamegraphRenderer(): FlamechartRenderer | null {
    return this.get().leftHeavyFlamegraphRenderer
  }

  async setActiveProfile(
    activeProfile: Profile,
    canvasContext: CanvasContext,
    rowAtlas: RowAtlas<FlamechartRowAtlasKey>,
  ) {
    const frames: Frame[] = []
    activeProfile.forEachFrame(f => frames.push(f))
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
      getTotalWeight: activeProfile.getTotalWeight.bind(activeProfile),
      forEachCall: activeProfile.forEachCall.bind(activeProfile),
      formatValue: activeProfile.formatValue.bind(activeProfile),
      getColorBucketForFrame,
    })
    const chronoFlamechartRenderer = new FlamechartRenderer(
      canvasContext,
      rowAtlas,
      chronoFlamechart,
    )

    const leftHeavyFlamegraph = new Flamechart({
      getTotalWeight: activeProfile.getTotalNonIdleWeight.bind(activeProfile),
      forEachCall: activeProfile.forEachCallGrouped.bind(activeProfile),
      formatValue: activeProfile.formatValue.bind(activeProfile),
      getColorBucketForFrame,
    })
    const leftHeavyFlamegraphRenderer = new FlamechartRenderer(
      canvasContext,
      rowAtlas,
      leftHeavyFlamegraph,
    )

    return await this.update({
      activeProfile,
      chronoFlamechart,
      chronoFlamechartRenderer,
      leftHeavyFlamegraph,
      leftHeavyFlamegraphRenderer,
      isLoading: false,
      leftHeavyFlamegraphModel: new FlamechartViewModel({}),
      chronoFlamechartModel: new FlamechartViewModel({}),
      sandwichViewModel: new SandwichViewModel({
        sortMethod: this.sandwichViewModel.sortMethod,
      }),
    })
  }

  get shouldFlattenRecursion(): boolean {
    return this.get().shouldFlattenRecursion
  }

  async setShouldFlattenRecursion(shouldFlattenRecursion: boolean) {
    await this.update({shouldFlattenRecursion})
  }

  get viewMode(): ViewMode {
    return this.get().viewMode
  }

  async setViewMode(viewMode: ViewMode) {
    await this.update({viewMode})
  }

  get isLoading(): boolean {
    return this.get().isLoading
  }

  async setIsLoading(isLoading: boolean) {
    await this.update({isLoading})
  }

  get didEncounterError(): boolean {
    return this.get().didEncounterError
  }

  async setIsInErrorState(didEncounterError: boolean) {
    await this.update({didEncounterError})
  }

  get isDragActive(): boolean {
    return this.get().isDragActive
  }

  async setIsDragActive(isDragActive: boolean) {
    await this.update({isDragActive})
  }

  get sandwichViewModel(): SandwichViewModel {
    return this.get().sandwichViewModel
  }

  get leftHeavyFlamegraphModel(): FlamechartViewModel {
    return this.get().leftHeavyFlamegraphModel
  }

  get chronoFlamechartModel(): FlamechartViewModel {
    return this.get().chronoFlamechartModel
  }
}
