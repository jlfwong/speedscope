# Rust/WASM Path

The Rust crate that powers the current sampled-import fast path lives in:

- `rust/speedscope-importer/`

The browser and Node glue generated from that crate lives in:

- `src/experimental/rust-importer/pkg-web/`
- `src/experimental/rust-importer/pkg-node/`

The TypeScript adapter that makes the Rust result look like the existing Speedscope `Profile` surface lives in:

- `src/experimental/rust-importer.ts`

## Current scope

This is a targeted migration, not a full rewrite. The current Rust/WASM seam accelerates sampled Speedscope JSON imports while preserving the same UI. Other import formats still flow through the legacy TypeScript importer surface.

## Rebuild

```bash
npm run experiment:build-rust-wasm
```

## Validate

```bash
npm run serve:side-by-side
```

Then load the same sampled Speedscope JSON file in both ports and compare the unchanged UI behavior.
