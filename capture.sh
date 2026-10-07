#!/usr/bin/env bash
# Hangar 7 capture: screenshot CAPTURE_URL as desktop + mobile PNGs into CAPTURE_DIR.
# Exit 75 = transient browser/navigation failure (retryable). Exit 1 = defect.
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p test -n "${CAPTURE_URL:?CAPTURE_URL must be set}"
/usr/bin/time -p test -n "${CAPTURE_DIR:?CAPTURE_DIR must be set}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node scripts/capture.mjs
/usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png"
