import {Atom} from './atom'

describe('Atom', () => {
  test('basic get/set', () => {
    const num = new Atom<number>(0, 'test1')
    expect(num.get()).toEqual(0)
    num.set(1)
    expect(num.get()).toEqual(1)
  })

  test('basic subscribe/unsubscribe', () => {
    let count = 0
    let latestNum = 0

    function listener() {
      count++
      latestNum = num.get()
    }

    const num = new Atom<number>(0, 'test2')
    num.subscribe(listener)

    expect(count).toEqual(0)
    expect(latestNum).toEqual(0)

    num.set(3)
    expect(count).toEqual(1)
    expect(latestNum).toEqual(3)

    num.set(7)
    expect(count).toEqual(2)
    expect(latestNum).toEqual(7)

    num.unsubscribe(listener)
    num.set(11)
    expect(count).toEqual(2)
    expect(latestNum).toEqual(7)
    expect(num.get()).toEqual(11)
  })

  test('basic no-op on no-value change', () => {
    let count = 0
    let latestNum = 0

    function listener() {
      count++
      latestNum = num.get()
    }

    const num = new Atom<number>(0, 'test3')
    num.subscribe(listener)
    expect(count).toEqual(0)
    expect(latestNum).toEqual(0)

    num.set(3)
    expect(count).toEqual(1)
    expect(latestNum).toEqual(3)

    num.set(3)
    expect(count).toEqual(1)
    expect(latestNum).toEqual(3)
  })

  test('bound getters and setters', () => {
    const num = new Atom<number>(0, 'test1')
    let setter = num.set
    let getter = num.get

    expect(getter()).toEqual(0)
    setter(1)
    expect(getter()).toEqual(1)
    expect(num.get()).toEqual(1)
    num.set(2)
    expect(getter()).toEqual(2)
  })

  test('subclassing', () => {
    class ListAtom<T> extends Atom<T[]> {
      push(t: T) {
        const next = [...this.state, t]
        this.set(next)
      }
      removeLast() {
        const next = [...this.state]
        next.pop()
        this.set(next)
      }
    }
    const myListAtom = new ListAtom<number>([1, 2, 3], '')

    let count = 0
    myListAtom.subscribe(() => {
      count++
    })

    expect(myListAtom.get()).toEqual([1, 2, 3])
    myListAtom.push(4)
    expect(myListAtom.get()).toEqual([1, 2, 3, 4])
    myListAtom.removeLast()
    expect(myListAtom.get()).toEqual([1, 2, 3])

    expect(count).toEqual(2)
  })
})
