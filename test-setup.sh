#!/bin/bash
set -e

for f in `find sample/profiles -name '*.zip' | grep -v Instruments`; do
  unzip -o $f -d $(dirname $f);
done