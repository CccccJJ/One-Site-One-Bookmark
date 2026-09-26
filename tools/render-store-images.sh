#!/bin/bash
# Regenerates store/images/* and assets/screenshot-popup.png from the real popup code (macOS + Google Chrome).
# Usage (from anywhere): bash tools/render-store-images.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREVIEW="$ROOT/tools/preview"
SHOOT="$PREVIEW/shoot.sh"
OUT="$ROOT/store/images"

# popup page wired to the fake chrome API (stub.js) and the real extension files
sed -e 's#href="popup.css"#href="../../extension/popup/popup.css"#' \
    -e 's#<script src="popup.js"#<script src="stub.js"></script><script src="../../extension/popup/popup.js"#' \
    "$ROOT/extension/popup/popup.html" > "$PREVIEW/popup-preview.html"

for lang in en zh_CN; do
    for n in 1 2 3; do
        bash "$SHOOT" store.html "kind=shot&n=$n&lang=$lang" "$OUT/screenshot-$n-$lang.png" 1280 800
    done
    bash "$SHOOT" store.html "kind=promo&lang=$lang" "$OUT/promo-small-$lang.png" 440 280
done
bash "$SHOOT" store.html "kind=icon" "$OUT/store-icon-128.png" 128 128
bash "$SHOOT" popup-preview.html "mode=expanded&lang=zh_CN" "$ROOT/assets/screenshot-popup.png" 320 290 2
