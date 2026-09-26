#!/bin/bash
# Screenshot a page under tools/preview/ with headless Chrome (macOS).
# Usage: shoot.sh <page.html> <query> <out.png> <width> <height> [scale]
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$3"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="$(mktemp -d)"
rm -f "$OUT"
# headless Chrome often keeps running after writing the screenshot, so wait for the file and stop it ourselves
"$CHROME" --headless=new --disable-gpu --allow-file-access-from-files \
    --user-data-dir="$PROFILE" --hide-scrollbars --force-device-scale-factor="${6:-1}" \
    --default-background-color=00000000 \
    --window-size="$4","$5" --virtual-time-budget=3000 \
    --screenshot="$OUT" "file://$DIR/$1?$2" >/dev/null 2>&1 &
PID=$!
for i in $(seq 1 30); do
    [ -s "$OUT" ] && break
    sleep 1
done
sleep 1
{
    pkill -f "user-data-dir=$PROFILE" || true
    kill $PID || true
    wait $PID || true
} 2>/dev/null
rm -rf "$PROFILE"
[ -s "$OUT" ] || { echo "failed: $OUT" >&2; exit 1; }
echo "$OUT"
