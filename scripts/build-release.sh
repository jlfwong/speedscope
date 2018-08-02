#!/bin/bash

set -euxo pipefail

OUTDIR=`pwd`/dist/release

# Typecheck
node_modules/.bin/tsc --noEmit

function build() {
  OUTDIR=$1
  DISABLE_CODE_SPLITTING=$2

  # Clean out the release directory
  rm -rf "$OUTDIR"
  mkdir -p "$OUTDIR"

  # Place info about the current commit into the build dir to easily identify releases
  npm ls -depth -1 | head -n 1 | cut -d' ' -f 1 > "$OUTDIR"/release.txt
  date >> "$OUTDIR"/release.txt
  git rev-parse HEAD >> "$OUTDIR"/release.txt

  # Place a json schema for the file format into the build directory too
  node scripts/generate-file-format-schema-json.js > "$OUTDIR"/file-format-schema.json

  if [ $DISABLE_CODE_SPLITTING -eq 1 ]; then
    # Switch the TypeScript output to generate commonjs require() calls
    # rather than preseving dynamic import() statements. This disables
    # code splitting.
    sed -i .bak 's/"module": "esnext"/"module": "commonjs"/g' tsconfig.json
  fi

  # Build the compiled assets
  node_modules/.bin/parcel build assets/index.html --no-cache --out-dir "$OUTDIR" --public-url "./" --detailed-report

  if [ $DISABLE_CODE_SPLITTING -eq 1 ]; then
    # Undo the changes to tsconfig.json
    mv tsconfig.json.bak tsconfig.json
  fi
}

build `pwd`/dist/release 0

# Build a version of the assets with code splitting disabled to
# enable speedscope to be used in environments with strict
# Content-Security-Policy headers.
build `pwd`/dist/release-csp 1