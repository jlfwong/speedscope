#!/bin/bash
set -euo pipefail

payload="$(cat)"

edited_path="$(
  python3 - <<'PY' "$payload"
import json
import sys

payload = sys.argv[1]
try:
    data = json.loads(payload)
except Exception:
    sys.exit(0)

keys = [
    "path",
    "filePath",
    "target_file",
    "targetFile",
]

paths = []

def collect(value):
    if isinstance(value, dict):
        for key in keys:
            maybe = value.get(key)
            if isinstance(maybe, str):
                paths.append(maybe)
        for child in value.values():
            collect(child)
    elif isinstance(value, list):
        for child in value:
            collect(child)

collect(data)

for path in paths:
    if path:
        print(path)
        break
PY
)"

if [[ -z "${edited_path:-}" ]]; then
  exit 0
fi

case "$edited_path" in
  src/experimental/*|scripts/cloud-control-plane.ts|src/import/index.ts|src/views/application.tsx|src/lib/hash-params.ts)
    ;;
  *)
    exit 0
    ;;
esac

case "$edited_path" in
  *.ts|*.tsx|*.json)
    npx prettier --write "$edited_path" >/dev/null
    ;;
esac

exit 0
