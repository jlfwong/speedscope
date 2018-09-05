## Unreleased

### Fixed
* Allow optional CR before LF when probing collapsed stacks files [#154]
* Fix import for Firefox 63 [#156]
* Change time formatting for minutes from 1.50min to 1:30 [#153]

## [1.0.1] - 2018-08-23

* Fixed an issue where flamegraph bounds were not always being cleared correctly, leading to visual artifacts [#150]

## [1.0.0] - 2018-08-23

### Fixed

* Fixed rendering issues when switching between screens w/ different `devicePixelRatios` [#147]

## [0.7.1] - 2018-08-20

### Fixed

* Removed dependency on regl in order to allow speedscope to run in strict content-security-policy environments [#140]
* Fixed text culling bug [#143]

## [0.7.0] - 2018-08-16

### Added

* Added support to import from linux `perf script` [#135]

## [0.6.0] - 2018-08-14

### Added

* Added support for multiple threads/processes [#130]
* Import all runs & threads from Instruments .trace files instead of just main thread from selected run [#130]

### Fixed

* Ensure the JSON schema has actual contents [#133]

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
