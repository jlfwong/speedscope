import {CallTreeNode} from './profile'
import {Rect} from './math'
import {ImmutableModel} from './immutable-model'

interface FlamechartViewState {
  selectedNode: CallTreeNode | null
  configSpaceViewportRect: Rect
}

export class FlamechartViewModel extends ImmutableModel<FlamechartViewModel> {
  constructor(state: Partial<FlamechartViewModel>) {
    const defaultState: FlamechartViewState = {
      selectedNode: null,
      configSpaceViewportRect: Rect.empty,
    }

    super({...(defaultState as any), ...(state as any)})
  }

  async setSelectedNode(selectedNode: CallTreeNode | null) {
    await this.update({selectedNode})
  }

  get selectedNode(): CallTreeNode | null {
    return this.get().selectedNode
  }

  async setConfigSpaceViewportRect(configSpaceViewportRect: Rect) {
    await this.update({configSpaceViewportRect})
  }

  get configSpaceViewportRect(): Rect {
    return this.get().configSpaceViewportRect
  }
}
