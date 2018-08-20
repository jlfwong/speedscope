# Speedscope TypeScript source

This directory contains the bulk of speedscope's source code.

## Subdirectories

* `gl/`: WebGL code. This includes e.g. the code to render flamecharts.
* `import/`: Code to import profiles from varous profilers into speedscope. This include e.g. the code to import Chrome performance profiles.
* `lib/`: Mostly dependency-less utilities. This includes e.g. an LRU cache implementation, basic linear algebra classes,
  and the definition of speedscope's file format.
* `store/`: Speedscope's application state management. Implemented via [`redux`](https://redux.js.org/)
* `typings/`: [TypeScript definition files](https://basarat.gitbooks.io/typescript/docs/types/ambient/d.ts.html)
* `views/`: View code to generate the HTML & CSS used to construct the UI. Implemented via [`preact`](https://preactjs.com/) and [`aphrodite`](http://github.com/Khan/aphrodite). Also contains code mapping from the `redux` store to views using [`preact-redux`](https://github.com/developit/preact-redux)
