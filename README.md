# speedscope
A high-performance interactive web-based viewer for [sampling profiles][0].

![Example Profile](https://i.imgur.com/lgV2FcP.png)

[0]: https://en.wikipedia.org/wiki/Profiling_(computer_programming)#Statistical_profilers

# Usage
Visit https://jlfwong.github.io/speedscope/, then drop a profile onto the page.

Currently accepts the same folded stack format as the original FlameGraph scripts do: https://github.com/brendangregg/FlameGraph#2-fold-stacks.

For example, try dropping this file onto the browser window: https://raw.githubusercontent.com/jlfwong/speedscope/master/sample/perf-vertx-stacks-01-collapsed-all.txt

To pan, you can either scroll or click and drag.
To zoom, hold cmd & scroll, or pinch-to-zoom.
