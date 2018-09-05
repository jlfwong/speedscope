#!/bin/bash

set -euxo pipefail

OUTDIR=`pwd`/dist/release

# Typecheck
node_modules/.bin/tsc --noEmit

# Run unit tests
npm run jest

# Clean out the release directory
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

# Place info about the current commit into the build dir to easily identify releases
npm ls -depth -1 | head -n 1 | cut -d' ' -f 1 > "$OUTDIR"/release.txt
date >> "$OUTDIR"/release.txt
git rev-parse HEAD >> "$OUTDIR"/release.txt

# Place a json schema for the file format into the build directory too
node scripts/generate-file-format-schema-json.js > "$OUTDIR"/file-format-schema.json

# Build the compiled assets
node_modules/.bin/parcel build assets/index.html --no-cache --out-dir "$OUTDIR" --public-url "./" --detailed-report