#!/bin/bash

# Fail on first error
set -e

# Print every command
set -x

OUTDIR=`pwd`/dist/release

# Typecheck
node_modules/.bin/tsc --noEmit

# Clean out the release directory
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

# Place info about the current commit into the build dir to easily identify releases
date > "$OUTDIR"/release.txt
git rev-parse HEAD >> "$OUTDIR"/release.txt

# Place a json schema for the file format into the build directory too
# node scripts/generate-file-format-schema-json.js > "$OUTDIR"/file-format-schema.json

# Build the compiled assets
node_modules/.bin/parcel build assets/index.html --no-cache --out-dir "$OUTDIR" --public-url "./" --detailed-report | cat
