class ListNode<V> {
  prev: ListNode<V> | null = null
  next: ListNode<V> | null = null
  constructor(readonly data: V) {}
}

export class List<V> {
  private head: ListNode<V> | null = null
  private tail: ListNode<V> | null = null
  private size: number = 0
  constructor() {}

  getHead(): ListNode<V> | null {
    return this.head
  }
  getTail(): ListNode<V> | null {
    return this.tail
  }
  getSize(): number {
    return this.size
  }

  append(node: ListNode<V>): void {
    if (!this.tail) {
      this.head = this.tail = node
    } else {
      this.tail.next = node
      node.prev = this.tail
      this.tail = node
    }
    this.size++
  }

  prepend(node: ListNode<V>): ListNode<V> {
    if (!this.head) {
      this.head = this.tail = node
    } else {
      this.head.prev = node
      node.next = this.head
      this.head = node
    }
    this.size++
    return node
  }

  pop(): ListNode<V> | null {
    if (!this.tail) {
      return null
    } else {
      const ret = this.tail
      if (ret.prev) {
        this.tail = ret.prev
        this.tail.next = null
      } else {
        this.head = this.tail = null
      }
      this.size--
      ret.prev = null
      return ret
    }
  }

  dequeue(): ListNode<V> | null {
    if (!this.head) {
      return null
    } else {
      const ret = this.head
      if (ret.next) {
        this.head = ret.next
        this.head.prev = null
      } else {
        this.head = this.tail = null
      }
      this.size--
      ret.next = null
      return ret
    }
  }

  remove(node: ListNode<V>): void {
    if (node.prev == null) {
      this.dequeue()
    } else if (node.next == null) {
      this.pop()
    } else {
      // Neither first nor last, should be safe to just link
      // neighbours.
      node.next.prev = node.prev
      node.prev.next = node.next
      node.next = null
      node.prev = null
      this.size--
    }
  }
}

interface LRUCacheNode<K, V> {
  value: V
  listNode: ListNode<K>
}

export class LRUCache<K, V> {
  private list = new List<K>()
  private map = new Map<K, LRUCacheNode<K, V>>()

  constructor(private capacity: number) {}

  has(key: K): boolean {
    return this.map.has(key)
  }

  get(key: K): V | null {
    const node = this.map.get(key)
    if (!node) {
      return null
    }
    // Bring node to the front of the list
    this.list.remove(node.listNode)
    this.list.prepend(node.listNode)

    return node ? node.value : null
  }

  getSize() {
    return this.list.getSize()
  }

  getCapacity() {
    return this.capacity
  }

  insert(key: K, value: V) {
    const node = this.map.get(key)
    if (node) {
      this.list.remove(node.listNode)
    }
    // Evict old entries when out of capacity
    while (this.list.getSize() >= this.capacity) {
      this.map.delete(this.list.pop()!.data)
    }
    const listNode = this.list.prepend(new ListNode(key))
    this.map.set(key, {value, listNode})
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
    const key = oldest.data
    const value = this.map.get(key)!.value
    this.map.delete(key)
    return [key, value]
  }

  clear() {
    this.list = new List<K>()
    this.map = new Map<K, LRUCacheNode<K, V>>()
  }
}
