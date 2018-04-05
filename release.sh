#!/bin/bash
set -ex
OUTDIR=dist/release
tsc --noEmit
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"
cp sample/perf-vertx-stacks-01-collapsed-all.txt "$OUTDIR"
node_modules/.bin/parcel build index.html --out-dir "$OUTDIR" --detailed-report
ndoe_modules/.bin/