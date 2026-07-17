#!/bin/bash
# ==========================================================
# COVER DOWNLOAD - RAYO ⚡ CONTROLE
# ==========================================================
# Gera lista, dispara workers em paralelo, espera, atualiza
# ==========================================================

CATALOG="/var/www/biblioteca/backend/data/catalog-books.json"
COVERS_DIR="/var/www/biblioteca/backend/public/covers"
TMPDIR="/tmp/pdf-covers-rayo"
WORKER="/var/www/biblioteca/backend/scripts/worker-rayo.sh"
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"

echo "=========================================================="
echo "📚 CAÇA EXTREMA RAYO ⚡"
date
echo ""

# List all unique fileIds needing covers
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = fs.readdirSync('$COVERS_DIR');
const seen = new Set();
books.filter(b => {
  if (!b.fileId || seen.has(b.fileId)) return false;
  seen.add(b.fileId);
  return !existing.includes(b.fileId + '.jpg');
}).forEach(b => {
  console.log(b.fileId + '|' + (b.title || '').replace(/[|]/g,'') + '|' + b.id);
});
" > "$TMPDIR/worklist.txt" 2>/dev/null

TOTAL=$(wc -l < "$TMPDIR/worklist.txt")
echo "🎯 Alvos: $TOTAL fileIds"

if [ "$TOTAL" -eq 0 ]; then
  echo "✅ Nada a fazer!"
  echo "📊 Status: $(ls "$COVERS_DIR" | wc -l) covers, $(ls "$COVERS_DIR"/*.jpg 2>/dev/null | wc -l) JPG"
  exit 0
fi

echo "🚀 Disparando em paralelo (4 workers)..."
echo ""

START_TIME=$(date +%s)
TOTAL_DONE=0
TOTAL_FAIL=0

# Process in batches of 4
BATCH=0
while IFS= read -r LINE; do
  IFS='|' read -r FILEID TITLE BOOKID <<< "$LINE"
  
  # Launch worker in background
  (
    bash "$WORKER" "$FILEID" "$TITLE" "$BOOKID" "$COVERS_DIR" "$TMPDIR"
  ) &
  
  BATCH=$((BATCH + 1))
  
  # Every 4 workers, wait and collect
  if [ $((BATCH % 4)) -eq 0 ]; then
    wait
  fi
  
  # 2 second delay between batches
  sleep 2
  
  # Progress
  if [ $((BATCH % 20)) -eq 0 ]; then
    ELAPSED=$(( $(date +%s) - START_TIME ))
    DONE=$(ls "$COVERS_DIR"/*.jpg 2>/dev/null | wc -l)
    echo "  📊 Batch $BATCH/$TOTAL | ${ELAPSED}s | JPG: $DONE"
    echo ""
  fi
done < "$TMPDIR/worklist.txt"

# Wait for remaining
wait

ELAPSED_TOTAL=$(( $(date +%s) - START_TIME ))
DONE_FINAL=$(ls "$COVERS_DIR"/*.jpg 2>/dev/null | wc -l)
BEFORE=249
NEW=$((DONE_FINAL - BEFORE))

echo ""
echo "=========================================================="
echo "📊 FINAL:"
echo "✅ Capas novas: $NEW"
echo "📂 Total JPG: $DONE_FINAL"
echo "📂 Total geral: $(ls "$COVERS_DIR" | wc -l)"
echo "⏱️  Tempo total: ${ELAPSED_TOTAL}s ($((ELAPSED_TOTAL / 60))m)"
echo ""

# --- Update catalog ---
echo "📝 Atualizando catálogo..."
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('$COVERS_DIR'));
let updates = 0;

books.forEach(b => {
  if (!b.fileId) return;
  const fn = b.fileId + '.jpg';
  if (existing.has(fn)) {
    if (b.cover !== '/covers/' + fn) {
      b.cover = '/covers/' + fn;
      updates++;
    }
  }
});

if (d.results) d.results = books; else if (d.books) d.books = books;
fs.writeFileSync('$CATALOG', JSON.stringify(d, null, 2));
console.log('✅ Atualizadas: ' + updates + ' entradas');
"

echo ""
echo "✅ CONCLUÍDO!"
date
echo "=========================================================="
