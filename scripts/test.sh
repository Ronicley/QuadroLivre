#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
binary="$(mktemp /tmp/quadrolivre-tests.XXXXXX)"
trap 'rm -f "$binary"' EXIT
swiftc Sources/QuadroLivre/BoardGeometry.swift \
  Sources/QuadroLivre/BoardMetadata.swift \
  Sources/QuadroLivre/ActivityCatalog.swift \
  Sources/QuadroLivre/PalettePreferences.swift \
  Sources/QuadroLivre/RainbowGeometry.swift Tests/main.swift -o "$binary"
"$binary"
python3 scripts/validate_catalog.py
