import {Profile} from './profile'
import {Flamechart} from './flamechart'
import {FlamechartRenderer} from './flamechart-renderer'

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

  public get(): T {
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
    activeProfile: Profile | null,
    chronoFlamechart: Flamechart | null,
    chronoFlamechartRenderer: FlamechartRenderer | null,
    leftHeavyFlamegraph: Flamechart | null,
    leftHeavyFlamegraphRenderer: FlamechartRenderer | null,
  ) {
    return await this.update({
      activeProfile,
      chronoFlamechart,
      chronoFlamechartRenderer,
      leftHeavyFlamegraph,
      leftHeavyFlamegraphRenderer,
      loading: false,
    })
  }

  get shouldFlattenRecursion(): boolean {
    return this.get().flattenRecursion
  }

  async setShouldFlattenRecursion(flattenRecursion: boolean) {
    await this.update({flattenRecursion})
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
    return this.get().loading
  }

  async setIsLoading(loading: boolean) {
    await this.update({loading})
  }

  get isInErrorState(): boolean {
    return this.get().error
  }

  async setIsInErrorState(error: boolean) {
    await this.update({error})
  }

  get isDragActive(): boolean {
    return this.get().dragActive
  }

  async setIsDragActive(dragActive: boolean) {
    await this.update({dragActive})
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
