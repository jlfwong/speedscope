## [1.15.0] - 2022-10-22

### Fixed

- Replace fuzzy matching with exact substring matching for finding matching frames [[#407](https://github.com/jlfwong/speedscope/pull/407)]

## [1.14.0] - 2022-05-19

### Added

- File and line information is now displayed in hover tips [[#365](https://github.com/jlfwong/speedscope/pull/365)] (by [@sokra](https://github.com/sokra))
- Support for stackprof object mode [[#391](https://github.com/jlfwong/speedscope/pull/391)] (by [@alexcoco](https://github.com/alexcoco))
- Support for hash params to control view-mode [[#362](https://github.com/jlfwong/speedscope/pull/362)] (by [@djudd](https://github.com/djudd))
- Support for profiles over 512MB now works [[#385](https://github.com/jlfwong/speedscope/pull/385)] (by [@jlfwong](https://github.com/jlfwong))
- Support for relative URLs in profileURL hashParam [[#357](https://github.com/jlfwong/speedscope/pull/357)] (by [@danvk](https://github.com/danvk))

### Fixed

- Allow collapsed stacks with invalid lines for the Brenden Gregg stack format [[#336](https://github.com/jlfwong/speedscope/pull/336)] (by [@P403n1x87](https://github.com/P403n1x87))
- Allow pasting into the search box [[#338](https://github.com/jlfwong/speedscope/pull/338)] (by [@P403n1x87](https://github.com/P403n1x87))
- Prevent hover tips from getting unnecessarily clipped outside container bounds [[#395](https://github.com/jlfwong/speedscope/pull/395)] (by [@jlfwong](https://github.com/jlfwong))

## [1.13.0] - 2021-02-14

### Added

- Support for importing callgrind profiles [[#331](https://github.com/jlfwong/speedscope/pull/331)]

## [1.12.1] - 2020-11-12

### Fixed

- Fixed for retina displays [[#327](https://github.com/jlfwong/speedscope/issues/327)]

## [1.12.0] - 2020-11-12

### Added

- Dark mode! [[#323](https://github.com/jlfwong/speedscope/pull/323)]

### Fixed

- Fixed incorrect highlighting when search result overlaps "…" [[#326](https://github.com/jlfwong/speedscope/pull/326)]

## [1.11.1] - 2020-10-25

### Fixed

- Fix trace-event import for many cases where there are 'ts' collisions [[#322](https://github.com/jlfwong/speedscope/pull/322)]
- Fix import of trace event files where B/E events' args don't match [[#321](https://github.com/jlfwong/speedscope/pull/321)]

## [1.11.0] - 2020-10-13

### Added

- Support remapping profiles using source maps [[#317](https://github.com/jlfwong/speedscope/pull/317)]

### Fixed

- Fix line & column numbers in imports from Chrome & Firefox [[#318](https://github.com/jlfwong/speedscope/pull/318)]

## [1.10.0] - 2020-09-29

### Added

- Support for importing profiles from Safari [[#300](https://github.com/jlfwong/speedscope/pull/300)] (by [@radex](https://github.com/radex))

### Fixed

- Fixed browser not opening on Windows when using the CLI [[#307](https://github.com/jlfwong/speedscope/pull/307)] (by [@spillerrec](https://github.com/spillerrec))
- Fixed import of UTF-16 encoded files w/ BOM [[#314](https://github.com/jlfwong/speedscope/pull/314)]
- Removed accidental dependency on React [[#315](https://github.com/jlfwong/speedscope/pull/315)]

## [1.9.0] - 2020-08-05

### Added

- Provide prev/next buttons to cycle through search results, make search results more visually prominen [[#304](https://github.com/jlfwong/speedscope/pull/304)]

### Fixed

- Fix accumulated errors in Chrome profile imports caused by zeroed negative timeDeltas [[#305](https://github.com/jlfwong/speedscope/pull/305)] (by [@taneliang](https://github.com/taneliang))

## [1.8.0] - 2020-07-19

### Added

- Added search highlighting in time order & left heavy views [[#297](https://github.com/jlfwong/speedscope/pull/297)]

### Fixed

- Fix performance issues for the caller/callee flamegraphs in the sandwich view [[#296](https://github.com/jlfwong/speedscope/pull/296)]

## [1.7.0] - 2020-07-13

### Added

- Introduced filtering via Ctrl+F/Cmd+F into the sandwich view [[#293](https://github.com/jlfwong/speedscope/pull/293)]

## [1.6.0] - 2020-05-30

### Added

- Improved profile/thread selection UI [[#282](https://github.com/jlfwong/speedscope/pull/282)]

### Fixed

- Crash instead of incorrectly interpreting profiles with incorrectly ordered events [[#273](https://github.com/jlfwong/speedscope/pull/273)]
- A large refactor to upgrade to Preact X was performed [[#267](https://github.com/jlfwong/speedscope/pull/267)]

## [1.5.3] - 2020-01-16

### Fixed

- Bump dependency versions to unbreak build [[#253](https://github.com/jlfwong/speedscope/pull/253)] (by [@jlfwong](https://github.com/jlfwong), with changes from [@Archerlly](https://github.com/Archerlly)'s [#215](https://github.com/jlfwong/speedscope/pull/215))
- Trace event: Prevent event re-ordering from generating incorrect flamegraphs ([#252](https://github.com/jlfwong/speedscope/pull/252), with changes from [@hwajaywang](https://github.com/hwajaywang)'s [#249](https://github.com/jlfwong/speedscope/pull/249))
- Make tooltip width wider [[#239](https://github.com/jlfwong/speedscope/pull/239)] (by [@miso11](https://github.com/miso11))

## [1.5.2] - 2019-10-10

### Fixed

- Fix emscripten remapping when symbols are hex-escaped, like `a\20b` [[#233](https://github.com/jlfwong/speedscope/pull/233)] (by [@jyc](https://github.com/jyc))

## [1.5.1] - 2019-06-06

### Fixed

- Fixed import of trace event files which contain unmatched "E" events ([#222](https://github.com/jlfwong/speedscope/pull/222)) (by [@jlfwong](https://github.com/jlfwong))

## [1.5.0] - 2019-02-17

### Added

- Support importing unterminated JSON in simple cases ([#208](https://github.com/jlfwong/speedscope/pull/208)) (by [@jlfwong](https://github.com/jlfwong))

### Fixed

- Fix crash when importing from stackprof without raw_timestamp_deltas ([#207](https://github.com/jlfwong/speedscope/pull/207)) (by [@jlfwong](https://github.com/jlfwong))
- Alert instead of crash when importing a file containing no profiles ([#205](https://github.com/jlfwong/speedscope/pull/205)) (by [@jlfwong](https://github.com/jlfwong))
- Fixed import of multithreaded profiles from Chrome 66 ([#206](https://github.com/jlfwong/speedscope/pull/206)) (by [@jlfwong](https://github.com/jlfwong))
- Fixed import of instruments trace files with missing run number ([#203](https://github.com/jlfwong/speedscope/pull/203)) (by [@Archerlly](https://github.com/Archerlly))

## [1.4.1] - 2019-01-22

### Fixed

- Fix importing of Trace Event Format files with no ts field on M events [[#198](https://github.com/jlfwong/speedscope/pull/198)] (by [@jlfwong](https://github.com/jlfwong))

## [1.4.0] - 2019-01-22

### Added

- Import v8 cpu profile (old format) [[#177](https://github.com/jlfwong/speedscope/pull/177)] (by [@vmarchaud](https://github.com/vmarchaud))
- Import basic "Trace Event Format" profiles [[#197](https://github.com/jlfwong/speedscope/pull/197)] (by [@jlfwong](https://github.com/jlfwong))

## [1.3.2] - 2018-12-03

### Fixed

- Fixed import of multithreaded Chrome profiles [[#19](https://github.com/jlfwong/speedscope/pull/19)] (by [@jlfwong](https://github.com/jlfwong))

## [1.3.1] - 2018-11-08

### Fixed

- Fixed a file import performance regression by using TextDecoder [[#188](https://github.com/jlfwong/speedscope/pull/188)] (by [@jlfwong](https://github.com/jlfwong))

## [1.3.0] - 2018-10-29

### Added

- Support import from Haskell GHC JSON format support [[#183](https://github.com/jlfwong/speedscope/pull/183)] (by [@trishume](https://github.com/trishume))

### Fixed

- Make the wasd keymappings work on azerty keyboards [[#184](https://github.com/jlfwong/speedscope/pull/184)] (by [@vrischmann](https://github.com/vrischmann))
- Fix import of binary formats via profileURL [[#179](https://github.com/jlfwong/speedscope/pull/179)] (by [@f](https://github.com/f)-hj)

## [1.2.0] - 2018-10-08

### Added

- Add import of v8 heap allocation profile [[#170](https://github.com/jlfwong/speedscope/pull/170)] (by [@vmarchaud](https://github.com/vmarchaud))

## [1.1.0] - 2018-09-26

### Added

- Add go tool pprof import support [[#165](https://github.com/jlfwong/speedscope/pull/165)]

## [1.0.4] - 2018-09-12

### Fixed

- Fix import from Chrome < 69 when there are multiple profiles [[#161](https://github.com/jlfwong/speedscope/pull/161)]

## [1.0.3] - 2018-09-10

### Fixed

- Fix import for Chrome 69, support leading idle time before first call [[#160](https://github.com/jlfwong/speedscope/pull/160)]

## [1.0.2] - 2018-09-04

### Fixed

- Allow optional CR before LF when probing collapsed stacks files [[#154](https://github.com/jlfwong/speedscope/pull/154)]
- Fix import for Firefox 63 [[#156](https://github.com/jlfwong/speedscope/pull/156)]
- Change time formatting for minutes from 1.50min to 1:30 [[#153](https://github.com/jlfwong/speedscope/pull/153)] (by [@Alex](https://github.com/Alex)-Diez)

## [1.0.1] - 2018-08-23

- Fixed an issue where flamegraph bounds were not always being cleared correctly, leading to visual artifacts [[#150](https://github.com/jlfwong/speedscope/pull/150)]

## [1.0.0] - 2018-08-23

### Fixed

- Fixed rendering issues when switching between screens w/ different `devicePixelRatios` [[#147](https://github.com/jlfwong/speedscope/pull/147)]

## [0.7.1] - 2018-08-20

### Fixed

- Removed dependency on regl in order to allow speedscope to run in strict content-security-policy environments [[#140](https://github.com/jlfwong/speedscope/pull/140)]
- Fixed text culling bug [[#143](https://github.com/jlfwong/speedscope/pull/143)]

## [0.7.0] - 2018-08-16

### Added

- Added support to import from linux `perf script` [[#135](https://github.com/jlfwong/speedscope/pull/135)]

## [0.6.0] - 2018-08-14

### Added

- Added support for multiple threads/processes [[#130](https://github.com/jlfwong/speedscope/pull/130)]
- Import all runs & threads from Instruments .trace files instead of just main thread from selected run [[#130](https://github.com/jlfwong/speedscope/pull/130)]

### Fixed

- Ensure the JSON schema has actual contents [[#133](https://github.com/jlfwong/speedscope/pull/133)]

## [0.5.1] - 2018-08-09

### Fixed

- Fixed broken CLI

## [0.5.0] - 2018-08-09

### Fixed

- Fix emscripten remapping when symbols contain dashes, like `527:i32s-div` [[#129](https://github.com/jlfwong/speedscope/pull/129)]
- Improved firefox import speed and fixed bugs in it [[#128](https://github.com/jlfwong/speedscope/pull/128)]
- Prevent non-contiguous blocks in the time ordered flamechart from appearing as a single node for selection [[#123](https://github.com/jlfwong/speedscope/pull/123)]
- Prevent dragging from changing selection [[#122](https://github.com/jlfwong/speedscope/pull/122)]
- Clamp zoom to prevent floating point issues [[#121](https://github.com/jlfwong/speedscope/pull/121)]
- Preserve view state when switching tabs [[#100](https://github.com/jlfwong/speedscope/pull/100)]

## [0.4.0] - 2018-07-21

### Added

- Support for importing v8 logs from node [[#98](https://github.com/jlfwong/speedscope/pull/98)]
- Optionally read from stdin via cli [[#99](https://github.com/jlfwong/speedscope/pull/99)]

## [0.3.0] - 2018-07-18

### Added

- Support for remapping profiles using a wasm symbol file [[#93](https://github.com/jlfwong/speedscope/pull/93)]
