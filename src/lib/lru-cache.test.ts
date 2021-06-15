import fc from 'fast-check'
import {LRUCache} from './lru-cache'

class SlowLRUCache<K, V> {
  private list: {k: K; v: V}[] = []
  constructor(private capacity: number) {}

  has(key: K): boolean {
    for (let {k} of this.list) {
      if (key === k) return true
    }
    return false
  }

  get(key: K): V | null {
    for (let i = 0; i < this.list.length; i++) {
      const el = this.list[i]
      const {k, v} = el
      if (key === k) {
        this.list.splice(i, 1)
        this.list.unshift(el)
        return v
      }
    }
    return null
  }

  getSize() {
    return this.list.length
  }

  getCapacity() {
    return this.capacity
  }

  insert(k: K, v: V) {
    for (let i = 0; i < this.list.length; i++) {
      if (this.list[i].k === k) {
        this.list.splice(i, 1)
        break
      }
    }
    while (this.list.length >= this.capacity) this.list.pop()
    this.list.unshift({k, v})
  }
  getOrInsert(key: K, f: (key: K) => V): V {
    let value = this.get(key)
    if (value == null) {
      value = f(key)
      this.insert(key, value)
    }
    return value
  }
  removeLRU(): [K, V] | null {
    const oldest = this.list.pop()
    if (!oldest) return null
    const {k, v} = oldest
    return [k, v]
  }
}

// Let's write tests by comparing the fast implementation of LRUCache
// with a dumb, slow implementation

interface ILRUCache<K, V> {
  has(key: K): boolean
  get(key: K): V | null
  getSize(): number
  getCapacity(): number
  insert(k: K, v: V): void
  getOrInsert(key: K, f: (key: K) => V): V
  removeLRU(): [K, V] | null
}

type Command =
  | {
      type: 'has'
      key: string
    }
  | {
      type: 'get'
      key: string
    }
  | {type: 'getSize'}
  | {type: 'insert'; key: string; value: number}
  | {
      type: 'getOrInsert'
      key: string
      value: number
    }
  | {type: 'removeLRU'}

const arbitraryCommand = fc.record({
  type: fc.constantFrom(
    ...(['has', 'get', 'getSize', 'insert', 'getOrInsert', 'removeLRU'] as const),
  ),
  key: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'),
  value: fc.nat(),
})

function runCommand(cache: ILRUCache<string, number>, cmd: Command): any {
  switch (cmd.type) {
    case 'has':
      return cache.has(cmd.key)
    case 'get':
      return cache.get(cmd.key)
    case 'getSize':
      return cache.getSize()
    case 'insert':
      return cache.insert(cmd.key, cmd.value)
    case 'getOrInsert':
      return cache.getOrInsert(cmd.key, () => cmd.value)
    case 'removeLRU':
      return cache.removeLRU()
  }
}

function verify(capacity: number, commands: Command[]) {
  const slowCache = new SlowLRUCache<string, number>(capacity)
  const fastCache = new LRUCache<string, number>(capacity)

  const slowResults = commands.map(c => runCommand(slowCache, c))
  const fastResults = commands.map(c => runCommand(fastCache, c))

  expect(slowResults).toEqual(fastResults)
}

test('LRUCache', () => {
  verify(4, [
    {type: 'insert', key: 'a', value: 0},
    {type: 'insert', key: 'b', value: 0},
    {type: 'get', key: 'a'},
    {type: 'removeLRU'},
  ])

  fc.assert(
    fc.property(fc.integer({min: 1, max: 255}), fc.array(arbitraryCommand), (cap, commands) => {
      verify(cap, commands)
    }),
  )
})
