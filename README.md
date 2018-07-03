# 🔬speedscope

A fast, interactive web-based viewer for [sampling profiles][0]. An alternative viewer for [FlameGraphs][1]. Will happily display multi-megabyte profiles without crashing your browser.

Given raw profiling data, speedscope allows you to interactively explore the data to get insight into what's slow in your application, or allocating all the memory, or whatever data is represented in the profiling data.

![Example Profile](https://user-images.githubusercontent.com/150329/40900669-86eced80-6781-11e8-92c1-dc667b651e72.gif)

[0]: https://en.wikipedia.org/wiki/Profiling_(computer_programming)#Statistical_profilers
[1]: https://github.com/brendangregg/FlameGraph

# Usage

Visit https://jlfwong.github.io/speedscope/, then either browse to find a profile file or drag-and-drop one onto the page. The profiles are not uploaded anywhere -- the application is totally in-browser.

## Supported file formats

### Chrome

Both the timeline format output by Chrome developers tools (https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference#save) and the `.cpuprofile` format output are supported. The `.cpuprofile` format is useful for viewing flamecharts generated by Node.js applications:
https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27

### Firefox

The `profile.json` file format output by Firefox can be saved and import into speedscope: https://developer.mozilla.org/en-US/docs/Tools/Performance

### Instruments.app

You can import call trees from OSX Instruments.app into speedscope by
selecting a row in the "Profile" view and select "Edit -> Deep Copy" from the
menu then pasting directly into speedscope. This data contains only aggregate
statistics, so the "Time Order" view and the "Left Heavy" view will look very
similar.

You can also import `.trace` files for time profiles by dragging them directly
into the browser from Chrome.

### `stackprof` Ruby profiler

If the `raw: true` flag is set when recording a dump, the resulting json dump can be imported into speedscope.

### `perf` and `DTrace`

If you process the output of `perf` or `DTrace` first with Brendan Gregg's `stackcollapse-*.pl` scripts (https://github.com/brendangregg/FlameGraph#2-fold-stacks), the result can be imported into speedscope.

## Importing via URL

To load a specific profile by URL, you can append a hash fragment like `#profileURL=[URL-encoded profile URL]&title=[URL-encoded custom title]`. Note that the server hosting the profile must have CORS configured to allow AJAX requests from speedscope.

## Views

### 🕰Time Order

In the "Time Order" view (the default), the stacks are ordered left-to-right in the same order as the occurred in the input file, which is usually going to be the chronological order they were recorded in. This view is most helpful for understand the behavior of an application over time, e.g. "first the data is fetched from the database, then the data is prepared for serialization, then the data is serialized to JSON". This is the only flame graph order supported by Chrome developer tools.

In all flamegraph views, the horizontal axis represents the "weight" of each stack (most commonly CPU time), and the vertical axis shows you the stack active at the time of the sample.

If you click on one of the frames, you'll be able to see summary statistics about it.

![Detail View](https://user-images.githubusercontent.com/150329/42108613-e6ef6d3a-7b8f-11e8-93d4-541b2cb93fe5.png)

### ⬅️Left Heavy

In the "Left Heavy" view, identical stacks are grouped together, regardless of whether they were recorded sequentially. Then, the stacks are sorted so that the heaviest stack for each parent is on the left -- hence "left heavy". This view is useful for understanding where all the time is going in situations where there are hundreds or thousands of function calls interleaved between other call stacks.

### 🥪 Sandwich

The Sandwich view is a table view in which you can find a list of all functions an their associated times. You can sort by self time or total time.
It's called "Sandwich" view because if you select one of the rows in the table, you can see flamegraphs for all the callers and callees of the selected
row.

![Sandwich View](https://user-images.githubusercontent.com/150329/42108467-76a57baa-7b8f-11e8-815f-1df7b6ac3ede.png)

## Navigation

Once a profile has loaded, the main view is split into two: the top area is the "minimap", and the bottom area is the "stack view".

### Minimap Navigation

* Scroll on either axis to pan around
* Click and drag to narrow your view to a specific range

### Stack View Navigation

* Scroll on either axis to pan around
* Pinch to zoom
* Hold Cmd+Scroll to zoom
* Double click on a frame to fit the viewport to it
* Click on a frame to view summary statistics about it

### Keyboard Navigation

* `+`: zoom in
* `-`: zoom out
* `0`: zoom out to see the entire profile
* `w`/`a`/`s`/`d` or arrow keys: pan around the profile
* `1`: Switch to the "Time Order" view
* `2`: Switch to the "Left Heavy" view
* `3`: Switch to the "Sandwich" view
* `r`: Collapse recursion in the flamegraphs
* `Cmd+S`/`Ctrl+S` to save the current profile
* `Cmd+O`/`Ctrl+O` to open a new profile
