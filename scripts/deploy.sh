#!/bin/bash
#
# Do a shallow clone of the repository into a temporary directory and copy the
# artifacts pulled from npm into the shallow clone to commit & push to the
# gh-pages branch.

set -euxo pipefail

SRCDIR=`pwd`
OUTDIR=`mktemp -d -t speedscope-unpacked`

# Untar the package
pushd "$OUTDIR"
PACKEDNAME=`npm pack speedscope | tail -n1`
tar -xvvf "$PACKEDNAME"

# Create a shallow clone of the repository
TMPDIR=`mktemp -d -t speedscope-deploy`
pushd "$TMPDIR"
git clone --depth 1 git@github.com:jlfwong/speedscope.git -b gh-pages

# Copy the build artifacts into the shallow clone
pushd speedscope
rm -rf *
cp -R "$OUTDIR"/package/dist/release/** .

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
    git commit -m "Deploy $PACKEDNAME"
    git push origin HEAD:gh-pages
    rm -rf "$TMPDIR"
    exit 0
  else
    set +x
    echo "Aborting release."
    set -x
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
python3 -m http.server 4444
set +x
