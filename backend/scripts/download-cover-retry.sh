#!/bin/bash
# download-cover-retry.sh
# Tenta baixar os fileIds restantes com backoff exponencial

CATALOG="/var/www/biblioteca/backend/data/catalog-books.json"
COVERS_DIR="/var/www/biblioteca/backend/public/covers"
TMPDIR="/tmp/pdf-covers-retry"
mkdir -p "$TMPDIR"

date

# Find remaining fileIds
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('$COVERS_DIR'));
const downloaded = new Set([...existing].filter(f => f.endsWith('.jpg')).map(f => f.replace('.jpg','')));
const allFileIds = [...new Set(books.filter(b => b.fileId).map(b => b.fileId))];
const remaining = allFileIds.filter(fid => !downloaded.has(fid));
remaining.forEach((fid, i) => {
  const book = books.find(b => b.fileId === fid);
  console.log(fid + '|' + (book ? book.id : 'unknown') + '|' + (book ? (book.title || '').slice(0,50) : ''));
});
console.error('Remaining:', remaining.length);
" > "$TMPDIR/remaining.txt" 2>&1

TOTAL=$(wc -l < "$TMPDIR/remaining.txt")
echo "🎯 Retry: $TOTAL fileIds restantes"
echo ""

# Get error types from last run 
echo "⏳ Aguardando 30s para rate limit resetar..."
sleep 30

WORKER="/var/www/biblioteca/backend/scripts/worker-rayo.sh"
COUNTER=0
SUCCESS=0
FAIL=0

while IFS='|' read -r FILEID BOOKID TITLE; do
  COUNTER=$((COUNTER + 1))
  
  # Check if already done (another process might have gotten it)
  if [ -f "$COVERS_DIR/${FILEID}.jpg" ]; then
    echo "[$COUNTER/$TOTAL] ⏭️ $BOOKID já existe"
    SUCCESS=$((SUCCESS + 1))
    continue
  fi
  
  echo -n "[$COUNTER/$TOTAL] $TITLE... "
  
  # Try up to 3 times with backoff
  for attempt in 1 2 3; do
    RESULT=$(bash "$WORKER" "$FILEID" "$TITLE" "$BOOKID" "$COVERS_DIR" "$TMPDIR" 2>&1)
    
    if echo "$RESULT" | grep -q "^✅"; then
      echo "✅ (attempt $attempt)"
      SUCCESS=$((SUCCESS + 1))
      break
    elif echo "$RESULT" | grep -q "^⏭️"; then
      echo "⏭️"
      SUCCESS=$((SUCCESS + 1))
      break
    else
      if [ "$attempt" -lt 3 ]; then
        WAIT=$(( attempt * 10 ))
        echo -n "⏳ falhou, retry em ${WAIT}s... "
        sleep "$WAIT"
      else
        echo "❌"
        FAIL=$((FAIL + 1))
      fi
    fi
  done
  
  # Progress every 10
  if [ $((COUNTER % 10)) -eq 0 ]; then
    echo ""
    ELAPSED=$(( SECONDS / 60 ))
    echo "  📊 $COUNTER/$TOTAL | ✅ $SUCCESS ❌ $FAIL | ${ELAPSED}m"
    echo ""
  fi
  
  # Randomized delay to avoid rate limit patterns
  sleep $(( RANDOM % 5 + 3 ))
  
done < "$TMPDIR/remaining.txt"

echo ""
echo "============================="
echo "📊 Retry round: ✅ $SUCCESS ❌ $FAIL"
echo ""

# Update catalog
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$CATALOG', 'utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('$COVERS_DIR'));
let updates = 0;
books.forEach(b => {
  if (!b.fileId) return;
  const fn = b.fileId + '.jpg';
  if (existing.has(fn) && b.cover !== '/covers/' + fn) {
    b.cover = '/covers/' + fn;
    updates++;
  }
});
if (d.results) d.results = books; else if (d.books) d.books = books;
fs.writeFileSync('$CATALOG', JSON.stringify(d, null, 2));
console.log('Catalog: ' + updates + ' updates');
"

JPG_NOW=$(ls "$COVERS_DIR"/*.jpg 2>/dev/null | wc -l)
echo "Total JPG: $JPG_NOW"
echo "Total geral: $(ls "$COVERS_DIR" | wc -l)"
date
echo "============================="
