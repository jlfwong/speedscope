declare global {
  // Mock modern Typescript constructs used in JfrView until we update our Typescript
  interface SymbolConstructor {
    readonly dispose: symbol
  }
}

export {}
