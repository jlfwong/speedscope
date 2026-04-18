# Experimental Import Seam

This directory contains the migration seam between the original Speedscope importer surface and the new Rust/WASM sampled-import path.

## Key files

- `contracts.ts`: importer options, comparison settings, and default-engine helpers
- `engine.ts`: experimental import dispatcher and parity comparison support
- `core.ts`: profile-core compatibility seam for the existing Speedscope UI
- `rust-importer.ts`: lazy adapter from the Rust/WASM result into Speedscope `Profile` objects
- `rust-importer/`: generated browser and Node glue around the Rust crate

## Design intent

The experimental seam exists so the Rust importer can be introduced without rewriting the existing UI all at once. The UI continues to speak in terms of Speedscope `Profile` objects while the importer underneath changes.
