# demangle

A wrapper function on top of demangling functions from the `GNU libiberty`,
using emscripten.

# Build dependencies

Follow the official `emsdk` installation instructions:

https://emscripten.org/docs/getting_started/downloads.html#installation-instructions-using-the-emsdk-recommended

And make sure you have `emcc` in your PATH.

# Source dependencies

## GCC

Make sure to fetch `gcc` sources.

* `git clone https://github.com/gcc-mirror/gcc`
* `git reset --hard 40754a3b9bef83bf4da0675fcb378e8cd1675602`

# Build instructions

`make` to produce a single CommonJS module that contains also contain the base64 encoded wasm file.
`make TEST=1` to produce both a ES6 module AND the wasm file.

Using `make TEST=1` produce a file that can be used by `node` for testing purposes.
