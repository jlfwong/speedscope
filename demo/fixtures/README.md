# Demo Fixtures

This directory is a public signpost, not a second copy of the sample corpus.

Use the curated files below from `sample/profiles/` when you want to validate the repository quickly:

- `sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json`
- `sample/profiles/Chrome/116/Trace-20230603T221323.json`
- `sample/profiles/stackcollapse/simple.txt`
- `sample/profiles/callgrind/callgrind.example.log`

For a large-file sampled demo, generate a synthetic profile locally:

```bash
npm run experiment:benchmark-rust-sampled -- --samples=1000000 --runs=1 --skip-parity=1 --write-file=demo/fixtures/generated/synthetic-sampled-1m.speedscope.json
```

Then load:

- `demo/fixtures/generated/synthetic-sampled-1m.speedscope.json`

For the more accurate end-to-end benchmark story, also generate the larger balanced browser benchmark file and run the browser-visible harness:

```bash
npm run experiment:benchmark-rust-sampled -- --samples=2000000 --stack-run-length=100 --runs=1 --write-only=1 --write-file=demo/fixtures/generated/synthetic-sampled-2m-balanced-crossover.speedscope.json
npm run experiment:benchmark-browser-visible -- --file=demo/fixtures/generated/synthetic-sampled-2m-balanced-crossover.speedscope.json --runs=3
```

This measures the full path from file selection to first flamegraph paint instead of relying on a visual side-by-side impression.

## Recommended workflow

```bash
npm run serve:side-by-side
```

Then open:

- `http://127.0.0.1:8000` for the classic importer
- `http://127.0.0.1:8001` for the Rust/WASM-backed importer

Load the same file in both tabs and compare the unchanged UI behavior.
