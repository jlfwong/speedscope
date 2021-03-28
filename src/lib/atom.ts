// This is a very small application state management library.
//
// All it provides is a way of specifying state "atoms" (basically a value with
// a setter and a way to be notified when the value updates), and a single
// preact hook to manage the subscribe/unsubscribe process for you.
//
// At the moment, atoms are intended to be globally defined, but the system
// could easily be adapted to pass down the atoms via context rather than being
// globally available.
//
// To support complex data-types, you can either have simple functions that call
// the public setter, or subclass Atom. So, for example, here are a few
// different ways of making a list atom with convenient helpers:
//
// # Simple functions being passed atom
//
//     const myListAtom = new Atom<number[]>([])
//     function push<T>(atom: Atom<T[]>, t: T) {
//       const next = [...atom.get(), t]
//       atom.set(next)
//     }
//     function removeLast<T>(atom: Atom<T[]>, t: T) {
//       const next = [...atom.get()]
//       next.pop()
//       atom.set(next)
//     }
//
//
// # Simple functions operating on global atoms
//
//     const myListAtom = new Atom<number[]>([])
//     function push(t: number) {
//       myListAtom.set([...myListAtom.get(), t])
//     }
//     function removeLast() {
//       const next = [...myListAtom.get()]
//       myListAtom.set(next)
//     }
//
//
// # Subclassing
//
//     class ListAtom<T> extends Atom<T[]> {
//        push(t: T) {
//          const next = [...this.state, t]
//          this.set(next)
//        }
//        removeLast() {
//          const next = [...this.state]
//          this.set(next)
//        }
//     }
//     const myListAtom = new ListAtom<number>
//
// This library is inspired by https://recoiljs.org/

import {useLayoutEffect, useState} from 'preact/hooks'

type AtomListener = () => void

export class Atom<T> {
  private observers: AtomListener[] = []
  constructor(protected state: T) {
    // We do the bind here rather than in the definition to facilitate
    // inheritance (we want the value defined on both the prototype and the
    // instance).
    this.set = this.set.bind(this)
    this.get = this.get.bind(this)
  }

  set(t: T) {
    this.state = t
    this.observers.forEach(fn => fn())
  }

  get(): T {
    return this.state
  }

  subscribe(listener: AtomListener) {
    this.observers.push(listener)
  }

  unsubscribe(listener: AtomListener) {
    const index = this.observers.indexOf(listener)
    if (index !== -1) {
      this.observers.splice(index, 1)
    }
  }
}

export function useAtom<T>(atom: Atom<T>): T {
  const [value, setValue] = useState(atom.get())

  useLayoutEffect(() => {
    // We need to setValue here because it's possible something has changed the
    // value in the store between the atom.get() call above and layout. In most
    // cases this should no-op.
    setValue(atom.get())

    function listener() {
      setValue(atom.get())
    }

    atom.subscribe(listener)
    return () => {
      atom.unsubscribe(listener)
    }
  }, [atom])

  return value
}
