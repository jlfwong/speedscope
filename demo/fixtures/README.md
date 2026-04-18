# Demo Fixtures

This directory is a public signpost, not a second copy of the sample corpus.

Use the curated files below from `sample/profiles/` when you want to validate the repository quickly:

- `sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json`
- `sample/profiles/Chrome/116/Trace-20230603T221323.json`
- `sample/profiles/stackcollapse/simple.txt`
- `sample/profiles/callgrind/callgrind.example.log`

## Recommended workflow

```bash
npm run serve:side-by-side
```

Then open:

- `http://127.0.0.1:8000` for the classic importer
- `http://127.0.0.1:8001` for the Rust/WASM-backed importer

Load the same file in both tabs and compare the unchanged UI behavior.
