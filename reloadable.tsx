import {Component} from 'preact'

export interface SerializedComponent<S> {
  state: S
  serializedSubcomponents: {[key: string]: any}
}

export abstract class ReloadableComponent<P, S> extends Component<P, S> {
  serialize(): SerializedComponent<S> {
    const serializedSubcomponents: {[key: string]: any} = Object.create(null)

    const subcomponents = this.subcomponents()
    for (const key in subcomponents) {
      const val = subcomponents[key]
      if (val && val instanceof ReloadableComponent) {
        serializedSubcomponents[key] = val.serialize()
      }
    }

    return {
      state: this.state,
      serializedSubcomponents,
    }
  }
  rehydrate(serialized: SerializedComponent<S>) {
    this.setState(serialized.state, () => {
      const subcomponents = this.subcomponents()
      for (const key in subcomponents) {
        const val = subcomponents[key]
        const data = serialized.serializedSubcomponents[key]
        if (data && val && val instanceof ReloadableComponent) {
          val.rehydrate(data)
        }
      }
    })
  }
  subcomponents(): {[key: string]: any} {
    return Object.create(null)
  }
}


