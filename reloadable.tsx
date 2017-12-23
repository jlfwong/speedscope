import {Component} from 'preact'

interface SerializedComponent<S, I> {
  state: S
  internal: I | null
  serializedSubcomponents: {[key: string]: any}
}

export abstract class ReloadableComponent<P, S, I> extends Component<P, S> {
  serialize(): SerializedComponent<S, I> {
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
      internal: this.serializeInternal(),
      serializedSubcomponents,
    }
  }
  rehydrate(serialized: SerializedComponent<S, I>) {
    this.setState(serialized.state)
    if (serialized.internal) {
      this.rehydrateInternal(serialized.internal)
    }

    const subcomponents = this.subcomponents()
    for (const key in subcomponents) {
      const val = subcomponents[key]
      const data = serialized.serializedSubcomponents[key]
      if (data && val && val instanceof ReloadableComponent) {
        subcomponents.serialize(data)
      }
    }
  }
  serializeInternal(): I | null {
    return null
  }
  rehydrateInternal(internal: I) {}
  subcomponents(): {[key: string]: any} {
    return Object.create(null)
  }
}


