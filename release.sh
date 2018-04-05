#!/bin/bash
set -ex
OUTDIR=dist/release
tsc --noEmit
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"
cp sample/perf-vertx-stacks-01-collapsed-all.txt "$OUTDIR"
node_modules/.bin/parcel build index.html --out-dir "$OUTDIR" --detailed-report

TMPDIR=`mktemp -d -t speedscope-release`
pushd $TMPDIR
git clone --depth 1 git@github.com:jlfwong/speedscope.git -b gh-pages