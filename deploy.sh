#!/bin/bash
#
# type check, do a release build, then do a shallow clone of the
# repository into a temporary directory and copy the release build
# artifacts into there to commit & push to the gh-pages branch

# Fail on first error
set -e

OUTDIR=`pwd`/dist/release
echo $OUTDIR

# Typecheck
node_modules/.bin/tsc --noEmit

# Clean out the release directory
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

# Place info about the current commit into the build dir to easiy identify releases
date > "$OUTDIR"/release.txt
git rev-parse HEAD >> "$OUTDIR"/release.txt

# Build the compiled assets
node_modules/.bin/parcel build index.html --no-cache --out-dir "$OUTDIR" --public-url "./" --detailed-report

# Create an archive with the release contents in it
pushd "$OUTDIR"
rm -rf ../release.zip
zip -r ../release.zip .
popd

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

# Start a local server for verification of the build
echo
echo
echo "Build complete. Starting server on http://localhost:4444/"
echo "Hit Ctrl+C to complete or cancel the release"
echo
echo
python -m SimpleHTTPServer 4444 .
