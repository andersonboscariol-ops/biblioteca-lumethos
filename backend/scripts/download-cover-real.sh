#!/bin/bash
# ==========================================================
# REAL COVER DOWNLOADER - Extreme Edition
# ==========================================================
# Baixa capa REAL de cada livro no Google Drive
# Usa: usercontent.google.com + ghostscript (gs)
# ==========================================================

CATALOG="/var/www/biblioteca/backend/data/catalog-books.json"
COVERS_DIR="/var/www/biblioteca/backend/public/covers"
TMPDIR="/tmp/pdf-covers"
LOGFILE="$TMPDIR/download.log"

# Clean temp dir
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"

exec 2>&1

echo "=========================================================="
echo "📚 CAÇA EXTREMA ÀS CAPAS REAIS DOS PDFs"
echo "=========================================================="
date
echo ""

# --- Get list of books with fileId ---
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('$COVERS_DIR'));

// Only process books that DON'T have a real cover yet
// A real cover has the fileId in the filename
const toProcess = books.filter(b => {
  if (!b.fileId) return false;
  const coverFile = b.cover ? b.cover.split('/').pop() : '';
  // Has real cover already
  if (coverFile && coverFile.includes(b.fileId) && existing.has(coverFile)) return false;
  return true;
});

console.log(JSON.stringify(toProcess.map(b => ({ id: b.id, fileId: b.fileId, title: (b.title || '').slice(0,50) }))));
" > "$TMPDIR/lista.json" 2>/dev/null

TOTAL=$(node -e "const d=require('$TMPDIR/lista.json'); console.log(d.length)")
echo "🎯 Livros precisando de capa real: $TOTAL"

if [ "$TOTAL" -eq 0 ]; then
  echo ""
  echo "✅ Nada a fazer! Todas as capas já são reais."
  exit 0
fi

# Get unique fileIds (some may be shared)
node -e "
const d = require('$TMPDIR/lista.json');
const seen = new Set();
const unique = d.filter(b => {
  if (seen.has(b.fileId)) return false;
  seen.add(b.fileId);
  return true;
});
console.log(JSON.stringify(unique));
" > "$TMPDIR/uniques.json"

UNIQUE=$(node -e "const d=require('$TMPDIR/uniques.json'); console.log(d.length)")
echo "📎 FileIds únicos: $UNIQUE"
echo ""

# --- Main loop ---
COUNTER=0
SUCCESS=0
FAIL=0
SKIP=0

for row in $(node -e "
const d = require('$TMPDIR/uniques.json');
d.forEach(b => console.log(b.fileId + '|' + b.id + '|' + (b.title || '')));
"); do
  
  IFS='|' read -r FILEID BOOKID TITLE <<< "$row"
  COUNTER=$((COUNTER + 1))
  
  # Check if cover for this fileId already exists
  if ls "$COVERS_DIR" 2>/dev/null | grep -q "$FILEID"; then
    echo "[$COUNTER/$UNIQUE] $BOOKID ⏭️ Já existe"
    SKIP=$((SKIP + 1))
    continue
  fi
  
  OUTFILE="$TMPDIR/${FILEID}.pdf"
  
  # Progress bar
  PCT=$(( COUNTER * 100 / UNIQUE ))
  echo -n "[$COUNTER/$UNIQUE] ${PCT}% "
  echo -n "$(echo "$TITLE" | head -c 35) "
  echo -n "... "
  
  # --- Download PDF ---
  HTTP_CODE=$(curl -s -L -o "$OUTFILE" \
    -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \
    -H "Accept-Language: pt-BR,pt;q=0.9,en;q=0.8" \
    --connect-timeout 10 \
    --max-time 120 \
    -w "%{http_code}" \
    "https://drive.usercontent.google.com/download?id=${FILEID}" 2>/dev/null)
  
  SIZE=$(stat -c%s "$OUTFILE" 2>/dev/null || echo 0)
  
  if [ "$HTTP_CODE" != "200" ] || [ "$SIZE" -lt 5000 ]; then
    echo "❌ HTTP $HTTP_CODE (${SIZE}B)"
    FAIL=$((FAIL + 1))
    rm -f "$OUTFILE"
    continue
  fi
  
  # --- Verify it's a PDF ---
  MAGIC=$(head -c 5 "$OUTFILE" 2>/dev/null)
  if [ "$MAGIC" != "%PDF-" ]; then
    echo "⚠️ Não-PDF (${MAGIC})"
    FAIL=$((FAIL + 1))
    rm -f "$OUTFILE"
    continue
  fi
  
  # --- Extract first page as image ---
  GS_OUT="$TMPDIR/gs_${FILEID}.jpg"
  gs -dNOPAUSE -dBATCH -dSAFER \
    -sDEVICE=jpeg \
    -r72 \
    -dTextAlphaBits=4 \
    -dGraphicsAlphaBits=4 \
    -dFirstPage=1 -dLastPage=1 \
    -sOutputFile="$GS_OUT" \
    "$OUTFILE" 2>/dev/null
  
  if [ ! -f "$GS_OUT" ] || [ $(stat -c%s "$GS_OUT" 2>/dev/null || echo 0) -lt 500 ]; then
    # Try pdftoppm as fallback
    GS_OUT="$TMPDIR/${FILEID}-%d.jpg"
    timeout 30 pdftoppm -jpeg -r 72 -f 1 -l 1 "$OUTFILE" "$TMPDIR/${FILEID}" 2>/dev/null
    GS_OUT="$TMPDIR/${FILEID}-1.jpg"
    if [ ! -f "$GS_OUT" ] || [ $(stat -c%s "$GS_OUT" 2>/dev/null || echo 0) -lt 500 ]; then
      echo "❌ Extração falhou"
      FAIL=$((FAIL + 1))
      rm -f "$OUTFILE"
      continue
    fi
  fi
  
  # --- Resize to standard cover size ---
  FINAL="$COVERS_DIR/${FILEID}.jpg"
  convert "$GS_OUT" -resize "300x450>" -gravity center -background white -extent 300x450 \
    -quality 82 "$FINAL" 2>/dev/null
  
  FINAL_SIZE=$(stat -c%s "$FINAL" 2>/dev/null || echo 0)
  
  if [ "$FINAL_SIZE" -gt 500 ]; then
    echo "✅ $(($SIZE/1024/1024))MB→${FINAL_SIZE}B"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "❌ Resize falhou (${FINAL_SIZE}B)"
    FAIL=$((FAIL + 1))
    rm -f "$FINAL"
  fi
  
  rm -f "$OUTFILE" "$GS_OUT" "$TMPDIR/${FILEID}-1.jpg" 2>/dev/null
  
  # Rate limiting
  sleep 2
  
  # Progress report every 10
  if [ $((COUNTER % 10)) -eq 0 ]; then
    echo "  📊 [${PCT}%] ✅ $SUCCESS ❌ $FAIL ⏭️ $SKIP / $COUNTER"
    echo ""
  fi
done

echo ""
echo "=========================================================="
echo "📊 RESULTADO FINAL:"
echo "✅ $SUCCESS capas reais baixadas"
echo "❌ $FAIL falhas"
echo "⏭️  $SKIP já existiam"
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
  const newCover = '/covers/' + b.fileId + '.jpg';
  if (existing.has(b.fileId + '.jpg')) {
    if (b.cover !== newCover) {
      b.cover = newCover;
      updates++;
    }
  }
});

if (d.results) d.results = books; else if (d.books) d.books = books;
fs.writeFileSync('$CATALOG', JSON.stringify(d, null, 2));
console.log('✅ Catálogo atualizado: ' + updates + ' entradas');
"

echo ""
echo "📂 Diretório de covers: $(ls "$COVERS_DIR" | wc -l) arquivos"
echo ""
date
echo "=========================================================="
