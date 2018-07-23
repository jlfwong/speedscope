import {ImmutableModel} from './immutable-model'
import {Flamechart} from './flamechart'
import {Frame} from './profile'
import {FlamechartRenderer} from './flamechart-renderer'

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

interface CallerCalleeState {
  selectedFrame: Frame

  invertedCallerFlamegraph: Flamechart
  invertedCallerFlamegraphRenderer: FlamechartRenderer

  calleeFlamegraph: Flamechart
  calleeFlamegraphRenderer: FlamechartRenderer
}

export interface SandwichViewState {
  sortMethod: SortMethod
  callerCallee: CallerCalleeState | null
}

export class SandwichViewModel extends ImmutableModel<SandwichViewState> {
  constructor(state: Partial<SandwichViewState>) {
    const defaultState: SandwichViewState = {
      sortMethod: {
        field: SortField.SELF,
        direction: SortDirection.DESCENDING,
      },
      callerCallee: null,
    }

    super({...(defaultState as any), ...(state as any)})
  }

  get sortMethod(): SortMethod {
    return this.get().sortMethod
  }

  async setSortMethod(sortMethod: SortMethod) {
    await this.update({sortMethod})
  }

  get callerCallee(): CallerCalleeState | null {
    return this.get().callerCallee
  }

  async setCallerCallee(callerCallee: CallerCalleeState | null) {
    await this.update({callerCallee})
  }
}
