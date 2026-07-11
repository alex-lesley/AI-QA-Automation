#!/usr/bin/env bash
# afterFileEdit entrypoint — runs block-wont-violations.py with stdin JSON.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_SCRIPT="${SCRIPT_DIR}/block-wont-violations.py"

# Prefer a working interpreter (skip broken Windows Store stubs).
if command -v py >/dev/null 2>&1 && py -3 -c "import sys" >/dev/null 2>&1; then
  exec py -3 "$PY_SCRIPT"
fi
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  exec python3 "$PY_SCRIPT"
fi
if command -v python >/dev/null 2>&1 && python -c "import sys" >/dev/null 2>&1; then
  exec python "$PY_SCRIPT"
fi

echo "block-wont-violations: python3/python/py not found on PATH" >&2
exit 1
