import {ImmutableModel} from './immutable-model'

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

export interface SandwichViewState {
  sortMethod: SortMethod
}

export class SandwichViewModel extends ImmutableModel<SandwichViewState> {
  constructor(state: Partial<SandwichViewState>) {
    const defaultState: SandwichViewState = {
      sortMethod: {
        field: SortField.SELF,
        direction: SortDirection.DESCENDING,
      },
    }

    super({...(defaultState as any), ...(state as any)})
  }

  get sortMethod(): SortMethod {
    return this.get().sortMethod
  }

  async setSortMethod(sortMethod: SortMethod) {
    await this.update({sortMethod})
  }
}
