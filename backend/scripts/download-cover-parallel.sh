#!/bin/bash
# ==========================================================
# REAL COVER DOWNLOADER - PARALLEL EDITION
# ==========================================================
# Processa múltiplos PDFs em paralelo (4 workers)
# Baixa → extrai primeira página → redimensiona → salva
# ==========================================================

CATALOG="/var/www/biblioteca/backend/data/catalog-books.json"
COVERS_DIR="/var/www/biblioteca/backend/public/covers"
TMPDIR="/tmp/pdf-covers-parallel"
mkdir -p "$TMPDIR"
LOGFILE="$TMPDIR/run.log"

rm -f "$LOGFILE"
exec 2>&1

echo "=========================================================="
echo "📚 CAÇA EXTREMA PARALELA"
date
echo ""

# --- Build work list ---
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = fs.readdirSync('$COVERS_DIR');

// Unique fileId books that don't have covers yet
const seen = new Set();
const toDo = books.filter(b => {
  if (!b.fileId || seen.has(b.fileId)) return false;
  seen.add(b.fileId);
  const coverFile = b.fileId + '.jpg';
  return !existing.includes(coverFile) && !existing.includes(b.fileId + '.png');
});

console.log(toDo.length);
toDo.forEach(b => console.log(b.id + '|' + b.fileId + '|' + (b.title || '').substring(0,60)));
" > "$TMPDIR/worklist.txt" 2>/dev/null

TOTAL=$(head -1 "$TMPDIR/worklist.txt")
echo "🎯 Target: $TOTAL fileIds únicos"

if [ "$TOTAL" -eq 0 ]; then
  echo "✅ Nada a fazer!"
  exit 0
fi

echo "📥 Workers: 4 em paralelo"
echo ""

# Remove count from worklist
tail -n +2 "$TMPDIR/worklist.txt" > "$TMPDIR/items.txt"

# --- Worker function ---
worker() {
  local WORKER_ID=$1
  local ITEMS_FILE=$2
  local COUNTER=0
  local SUCCESS=0
  local FAIL=0
  
  while true; do
    # Get next item using flock for atomic read
    local LINE=""
    (
      exec 200<$ITEMS_FILE
      flock -x 200
      read -r LINE <&200
      # Remove line from file
      sed -i '1d' "$ITEMS_FILE"
    )
    
    [ -z "$LINE" ] && break
    
    IFS='|' read -r BOOKID FILEID TITLE <<< "$LINE"
    COUNTER=$((COUNTER + 1))
    
    OUTFILE="$TMPDIR/w${WORKER_ID}_${FILEID}.pdf"
    
    echo "[W${WORKER_ID}] [$COUNTER] ${TITLE:0:30}..."
    
    # Download PDF (max 60s, first page only would be better but GD doesn't support)
    HTTP_CODE=$(curl -s -L -o "$OUTFILE" \
      -H "User-Agent: Mozilla/5.0" \
      --connect-timeout 10 \
      --max-time 90 \
      -w "%{http_code}" \
      "https://drive.usercontent.google.com/download?id=${FILEID}" 2>/dev/null)
    
    SIZE=$(stat -c%s "$OUTFILE" 2>/dev/null || echo 0)
    
    if [ "$HTTP_CODE" != "200" ] || [ "$SIZE" -lt 5000 ]; then
      echo "  [W${WORKER_ID}] ❌ HTTP $HTTP_CODE (${SIZE}B)"
      FAIL=$((FAIL + 1))
      rm -f "$OUTFILE"
      continue
    fi
    
    # Extract first page with gs (fast mode, low res)
    GS_OUT="$TMPDIR/w${WORKER_ID}_${FILEID}.jpg"
    timeout 15 gs -dNOPAUSE -dBATCH -dSAFER \
      -sDEVICE=jpeg -r72 -dFirstPage=1 -dLastPage=1 \
      -sOutputFile="$GS_OUT" "$OUTFILE" 2>/dev/null
    
    if [ ! -f "$GS_OUT" ] || [ $(stat -c%s "$GS_OUT" 2>/dev/null || echo 0) -lt 500 ]; then
      echo "  [W${WORKER_ID}] ❌ gs failed"
      FAIL=$((FAIL + 1))
      rm -f "$OUTFILE"
      continue
    fi
    
    # Resize to cover format
    FINAL="$COVERS_DIR/${FILEID}.jpg"
    convert "$GS_OUT" -resize "300x450>" -gravity center -extent 300x450 -quality 80 "$FINAL" 2>/dev/null
    
    if [ -f "$FINAL" ] && [ $(stat -c%s "$FINAL" 2>/dev/null || echo 0) -gt 500 ]; then
      echo "  [W${WORKER_ID}] ✅ $((${SIZE}/1024/1024))MB -> $(stat -c%s "$FINAL")B"
      SUCCESS=$((SUCCESS + 1))
    else
      echo "  [W${WORKER_ID}] ❌ resize failed"
      FAIL=$((FAIL + 1))
    fi
    
    rm -f "$OUTFILE" "$GS_OUT" 2>/dev/null
  done
  
  echo "[W${WORKER_ID}] Done: ✅ $SUCCESS ❌ $FAIL"
  echo "$SUCCESS:$FAIL" > "$TMPDIR/result_w${WORKER_ID}.txt"
}

# Export function
export -f worker
export CATALOG COVERS_DIR TMPDIR

# Run 4 workers in parallel
echo "🚀 Disparando 4 workers..."
echo ""
WORKERS=4
for i in $(seq 1 $WORKERS); do
  worker $i "$TMPDIR/items.txt" &
  sleep 0.5
done

# Wait for all
wait

echo ""
echo "=========================================================="

# Sum results
TOTAL_SUCCESS=0
TOTAL_FAIL=0
for f in "$TMPDIR"/result_w*.txt; do
  if [ -f "$f" ]; then
    IFS=':' read -r S F < "$f"
    TOTAL_SUCCESS=$((TOTAL_SUCCESS + S))
    TOTAL_FAIL=$((TOTAL_FAIL + F))
  fi
done

echo "📊 Resultado: ✅ $TOTAL_SUCCESS ❌ $TOTAL_FAIL"

# --- Update catalog ---
echo ""
echo "📝 Atualizando catálogo..."
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('$COVERS_DIR'));
let updates = 0;

books.forEach(b => {
  if (!b.fileId) return;
  const newCover = '/covers/' + b.fileId + '.jpg';
  if (existing.has(b.fileId + '.jpg')) {
    b.cover = newCover;
    updates++;
  }
});

if (d.results) d.results = books; else if (d.books) d.books = books;
fs.writeFileSync('$CATALOG', JSON.stringify(d, null, 2));
console.log('✅ Catálogo atualizado: ' + updates + ' entradas');
"

echo ""
echo "📂 Total covers: $(ls "$COVERS_DIR" | wc -l)"
echo "📂 JPG: $(ls "$COVERS_DIR"/*.jpg 2>/dev/null | wc -l)"
echo "📂 PNG: $(ls "$COVERS_DIR"/*.png 2>/dev/null | wc -l)"
date
echo "=========================================================="
