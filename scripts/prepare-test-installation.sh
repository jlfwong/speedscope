#!/bin/bash

# Prepare a mock installation of speedscope to test it before the actual npm
# publish

set -euxo pipefail

TESTDIR=`mktemp -d -t speedscope-test-installation`
PACKEDNAME=`npm pack | tail -n1`

mv "$PACKEDNAME" "$TESTDIR"
cd "$TESTDIR"
tar -xvvf "$PACKEDNAME"
cd package
npm install

set +x
echo
echo "Run the following command to switch into the test directory"
echo cd "$TESTDIR"/package