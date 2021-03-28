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
//     const myListAtom = new Atom<number[]>([], "myList")
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
//     const myListAtom = new Atom<number[]>([], "myLisT")
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
//          next.pop()
//          this.set(next)
//        }
//     }
//     const myListAtom = new ListAtom<number>([], "myList")
//
// This library is inspired by https://recoiljs.org/

import {useLayoutEffect, useState} from 'preact/hooks'

type AtomListener = () => void

let AtomDev: {[key: string]: Atom<any>} | null = null
let hotReloadStash: Map<string, any> | null = null

declare const module: any
if (process.env.NODE_ENV === 'development') {
  ;(window as any)['Atom'] = AtomDev = {}

  module.hot.dispose(() => {
    if (AtomDev) {
      hotReloadStash = new Map()
      for (let key in AtomDev) {
        hotReloadStash.set(key, AtomDev[key].get())
      }
    }

    ;(window as any)['Atom_hotReloadStash'] = hotReloadStash
  })

  hotReloadStash = (window as any)['Atom_hotReloadStash'] || null
}

export class Atom<T> {
  private observers: AtomListener[] = []
  constructor(protected state: T, debugKey: string) {
    if (process.env.NODE_ENV === 'development') {
      if (hotReloadStash?.has(debugKey)) {
        // If we have a stored value from a previous hot reload, use that
        // instead of whatever was passed to the constructor.
        this.state = hotReloadStash.get(debugKey)
      }

      if (AtomDev) {
        if (debugKey in AtomDev) {
          console.warn(`[Atom] Multiple atoms tried to register with the key ${debugKey}`)
        }
        AtomDev[debugKey] = this
      }
    }

    // We do the bind here rather than in the definition to facilitate
    // inheritance (we want the value defined on both the prototype and the
    // instance).
    this.set = this.set.bind(this)
    this.get = this.get.bind(this)
  }

  set(t: T) {
    if (this.state === t) {
      // No-op if the value didn't actually change
      return
    }
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
