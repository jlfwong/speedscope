## [Unreleased]

### Added


### Fixed

* Preserve view state when switching tabs [#100]
* Clamp zoom to prevent floating point issues [#121]
* Prevent dragging from changing selection [#122]
* Prevent non-contiguous blocks in the time ordered flamechart from appearing as a single node for selection [#123]

## [0.4.0] - 2018-07-21

### Added

* Support for importing v8 logs from node [#98]
* Optionally read from stdin via cli [#99]

## [0.3.0] - 2018-07-18

### Added

* Support for remapping profiles using a wasm symbol file [#93]
