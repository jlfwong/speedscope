## [Unreleased]

### Added

* Added support for multiple threads/processes [#130]
* Import all runs & threads from Instruments .trace files instead of just main thread from selected run [#130]

### Fixed

## [0.5.1] - 2018-08-09

### Fixed

* Fixed broken CLI

## [0.5.0] - 2018-08-09

### Fixed

* Fix emscripten remapping when symbols contain dashes, like `527:i32s-div` [#129]
* Improved firefox import speed and fixed bugs in it [#128]
* Prevent non-contiguous blocks in the time ordered flamechart from appearing as a single node for selection [#123]
* Prevent dragging from changing selection [#122]
* Clamp zoom to prevent floating point issues [#121]
* Preserve view state when switching tabs [#100]

## [0.4.0] - 2018-07-21

### Added

* Support for importing v8 logs from node [#98]
* Optionally read from stdin via cli [#99]

## [0.3.0] - 2018-07-18

### Added

* Support for remapping profiles using a wasm symbol file [#93]
