import {Profile, Frame} from './profile'
import {Flamechart} from './flamechart'
import {FlamechartRenderer, FlamechartRowAtlasKey} from './flamechart-renderer'
import {CanvasContext} from './canvas-context'
import {RowAtlas} from './row-atlas'

// An immutable model represents a snapshot of the world.
// The constructor takes the current state and a method to handle updates when it changes.
// This is similar to having an observer pattern with a single observer, except that the
// model is not mutated in place. Instead, the observer is responsible for propogating
// the state change upwards in the state tree.
//
// This pattern is very roughly inspired by redux, but with less indirection & reduced
// complexity needed for type safety.
export abstract class ImmutableModel<T> {
  private isStale: boolean = false
  constructor(private state: T, private handleUpdate: (state: T) => Promise<void>) {}

  protected async update(fields: Partial<T>) {
    if (this.isStale) {
      throw new Error('Refusing to update from a stale model')
    }
    await this.handleUpdate({...(this.state as any), ...(fields as any)})
    this.isStale = true
  }

  public get(): Readonly<T> {
    if (this.isStale) {
      throw new Error('Refusing to fetch from a stale model')
    }
    return this.state
  }
}

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

  tableSortMethod: SortMethod

  viewMode: ViewMode
  isDragActive: boolean
  isLoading: boolean
  didEncounterError: boolean
}

export class ApplicationModel extends ImmutableModel<ApplicationState> {
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

  get tableSortMethod(): SortMethod {
    return this.get().tableSortMethod
  }

  async setTableSortMethod(tableSortMethod: SortMethod) {
    await this.update({tableSortMethod})
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
}

export enum SortField {
  SYMBOL_NAME,
  SELF,
  TOTAL,
}

export enum SortDirection {
  ASCENDING,
  DESCENDING,
}

export interface SortMethod {
  field: SortField
  direction: SortDirection
}

/*
export interface SandwichViewState {
  sortMethod: SortMethod
}

export class SandwichViewModel extends ImmutableModel<SandwichViewState> {}
*/
