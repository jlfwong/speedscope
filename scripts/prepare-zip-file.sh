#!/bin/bash

# Create a zip file containing a standalone copy of speedscope
# based on the contents of the package published to npm

set -euxo pipefail

SRCDIR=`pwd`
TMPDIR=`mktemp -d -t speedscope-test-installation`

# Untar the package
pushd "$TMPDIR"
PACKEDNAME=`npm pack speedscope | tail -n1`
tar -xvvf "$PACKEDNAME"

# Zip the parts we care about
ZIPNAME=`basename $PACKEDNAME .tgz`.zip
mkdir speedscope
mv package/dist/release/** speedscope
cp "$SRCDIR"/LICENSE speedscope
echo "This is a self-contained release of https://github.com/jlfwong/speedscope." > speedscope/README
echo "To use it, open index.html in Chrome or Firefox." >> speedscope/README

zip "$ZIPNAME" speedscope/**

# Switch back to the repository root
popd
mv "$TMPDIR"/"$ZIPNAME" dist/release/"$ZIPNAME"

# Clean up
rm -rf "$TMPDIR"

set +x
echo "Created dist/release/$ZIPNAME"