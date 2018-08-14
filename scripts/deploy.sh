#!/bin/bash
#
# type check, do a release build, then do a shallow clone of the
# repository into a temporary directory and copy the release build
# artifacts into there to commit & push to the gh-pages branch

set -euxo pipefail

OUTDIR=`pwd`/dist/release
echo $OUTDIR

./scripts/build-release.sh

# Create a shallow clone of the repository
TMPDIR=`mktemp -d -t speedscope-release`
echo "Entering $TMPDIR"
pushd "$TMPDIR"
git clone --depth 1 git@github.com:jlfwong/speedscope.git -b gh-pages

# Copy the build artifacts into the shallow clone
pushd speedscope
rm -rf *
cp -R "$OUTDIR"/* .

# Set the CNAME record
echo www.speedscope.app > CNAME

# Set up a handler to run on Ctrl+C
trap ctrl_c INT
function ctrl_c() {
  set +x
  read -p "Commit release? [yes/no]: "
  set -x

  if [[ $REPLY =~ ^yes$ ]]
  then
    git add --all
    git commit -m 'Release'
    git push origin HEAD:gh-pages
    popd
    rm -rf "$TMPDIR"
    exit 0
  else
    set +x
    echo "Aborting release."
    set -x

    popd
    rm -rf "$TMPDIR"
    exit 1
  fi
}

# Start a local server for verification of the build
set +x
echo
echo
echo "Build complete. Starting server on http://localhost:4444/"
echo "Hit Ctrl+C to complete or cancel the release"
echo
echo
python -m SimpleHTTPServer 4444 .
set +x
