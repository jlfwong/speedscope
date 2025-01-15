#!/bin/bash

set -euxo pipefail

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --outdir)
      OUTDIR="$2"
      shift 2
      ;;
    --protocol)
      PROTOCOL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 --outdir <output_directory> --protocol <serving_protocol>"
      echo "serving_protocol must be either 'http' or 'file'"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "${OUTDIR:-}" ] || [ -z "${PROTOCOL:-}" ]; then
    echo "Usage: $0 --outdir <output_directory> --protocol <serving_protocol>"
    echo "serving_protocol must be either 'http' or 'file'"
    exit 1
fi

if [ "$PROTOCOL" != "http" ] && [ "$PROTOCOL" != "file" ]; then
    echo "Error: serving_protocol must be either 'http' or 'file'"
    exit 1
fi

# Clean out the release directory
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

# Place info about the current commit into the build dir to easily identify releases
npm ls -depth -1 | head -n 1 | cut -d' ' -f 1 > "$OUTDIR"/release.txt
date >> "$OUTDIR"/release.txt
git rev-parse HEAD >> "$OUTDIR"/release.txt

# Place a json schema for the file format into the build directory too
node scripts/generate-file-format-schema-json.js > "$OUTDIR"/file-format-schema.json

# Include licenses
# https://github.com/jlfwong/speedscope/pull/412
cp assets/source-code-pro/LICENSE.md "$OUTDIR"/source-code-pro.LICENSE.md

node_modules/.bin/tsx scripts/build-release.ts --outdir "$OUTDIR" --protocol "$PROTOCOL"