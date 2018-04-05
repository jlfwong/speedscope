#!/bin/bash
set -e
OUTDIR=`pwd`/dist/release
echo $OUTDIR
node_modules/.bin/tsc --noEmit
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"
cp sample/perf-vertx-stacks-01-collapsed-all.txt "$OUTDIR"
node_modules/.bin/parcel build index.html --out-dir "$OUTDIR" --detailed-report

TMPDIR=`mktemp -d -t speedscope-release`
echo "Entering $TMPDIR"
pushd "$TMPDIR"
git clone --depth 1 git@github.com:jlfwong/speedscope.git -b gh-pages
cd speedscope
rm -rf *
cp -R "$OUTDIR"/* .

trap ctrl_c INT
function ctrl_c() {
  read -p "Commit release? [yes/no]: "
  if [[ $REPLY =~ ^yes$ ]]
  then
    git add --all
    git commit -m 'Release'
    git push origin HEAD:gh-pages
    popd
    rm -rf "$TMPDIR"
    exit 0
  else
    echo "Aborting release."
    popd
    rm -rf "$TMPDIR"
    exit 1
  fi
}

echo
echo
echo "Build complete. Starting server on http://localhost:4444/"
echo "Hit Ctrl+C to complete or cancel the release"
python -m SimpleHTTPServer 4444 .