// An immutable model represents a snapshot of the world.
// The constructor takes the current state and a method to handle updates when it changes.
// This is similar to having an observer pattern with a single observer, except that the
// model is not mutated in place. Instead, the observer is responsible for propogating
// the state change upwards in the state tree.
//
// This pattern is very roughly inspired by redux, but with less indirection & reduced
// complexity needed for type safety.
type AsyncHandler<T> = (state: T) => Promise<void>
async function noopHandler<T>(state: T) {}

export abstract class ImmutableModel<T> {
  private isStale: boolean = false
  private handleUpdate: AsyncHandler<T> = noopHandler

  constructor(private state: T) {}

  protected async update(fields: Partial<T>) {
    if (this.isStale) {
      throw new Error('Refusing to update from a stale model')
    }
    if (this.handleUpdate === noopHandler) {
      throw new Error('Refusing to update before an update handler is registered')
    }
    await this.handleUpdate({...(this.state as any), ...(fields as any)})
    this.isStale = true
  }

  public setUpdateHandler(handleUpdate: AsyncHandler<T>) {
    this.handleUpdate = handleUpdate
  }

  public get(): Readonly<T> {
    if (this.isStale) {
      throw new Error('Refusing to fetch from a stale model')
    }
    return this.state
  }
}
