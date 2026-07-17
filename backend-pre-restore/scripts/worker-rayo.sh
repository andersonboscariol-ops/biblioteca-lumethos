#!/bin/bash
# worker-rayo.sh - Process ONE Google Drive file
# Usage: worker-rayo.sh <FILEID> <TITLE> <BOOKID> <COVERS_DIR> <TMPDIR>

FILEID="$1"
TITLE="$2"
BOOKID="$3"
COVERS_DIR="$4"
TMPDIR="$5"

OUTFILE="$TMPDIR/${FILEID}.pdf"
GS_OUT="$TMPDIR/${FILEID}.jpg"
FINAL="$COVERS_DIR/${FILEID}.jpg"

# Already done?
[ -f "$FINAL" ] && echo "⏭️ $BOOKID" && exit 0

# Download
HTTP_CODE=$(curl -s -L -o "$OUTFILE" \
  -H "User-Agent: Mozilla/5.0" \
  --connect-timeout 10 \
  --max-time 120 \
  -w "%{http_code}" \
  "https://drive.usercontent.google.com/download?id=${FILEID}" 2>/dev/null)

SIZE=$(stat -c%s "$OUTFILE" 2>/dev/null || echo 0)

if [ "$HTTP_CODE" != "200" ] || [ "$SIZE" -lt 5000 ]; then
  echo "❌ $BOOKID HTTP $HTTP_CODE (${SIZE}B)"
  rm -f "$OUTFILE"
  exit 1
fi

# Extract first page with ghostscript (fast, low res)
timeout 20 gs -dNOPAUSE -dBATCH -dSAFER \
  -sDEVICE=jpeg -r72 -dFirstPage=1 -dLastPage=1 \
  -sOutputFile="$GS_OUT" "$OUTFILE" 2>/dev/null

if [ ! -f "$GS_OUT" ] || [ $(stat -c%s "$GS_OUT" 2>/dev/null || echo 0) -lt 500 ]; then
  echo "❌ $BOOKID gs failed"
  rm -f "$OUTFILE"
  exit 1
fi

# Resize to 300x450 cover
convert "$GS_OUT" -resize "300x450>" -gravity center -background white -extent 300x450 -quality 82 "$FINAL" 2>/dev/null

if [ -f "$FINAL" ] && [ $(stat -c%s "$FINAL" 2>/dev/null || echo 0) -gt 500 ]; then
  MB=$(echo "scale=1; $SIZE / 1048576" | bc 2>/dev/null || echo "?")
  KB=$(echo "scale=1; $(stat -c%s "$FINAL") / 1024" | bc 2>/dev/null || echo "?")
  echo "✅ $BOOKID ($MB M -> $KB K)"
  rm -f "$OUTFILE" "$GS_OUT"
  exit 0
else
  echo "❌ $BOOKID resize failed"
  rm -f "$OUTFILE" "$GS_OUT"
  exit 1
fi
