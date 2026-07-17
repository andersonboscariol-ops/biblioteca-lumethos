#!/bin/bash
# Cache de capas da Biblioteca Lumethos
# Baixa capas do Google Drive para o disco local
# Uso: ./cache-covers.sh [--force]

COVERS_DIR="/var/www/biblioteca/frontend/dist/covers"
CATALOG="/var/www/biblioteca/backend/data/catalog-books.json"
LOG="/var/www/biblioteca/scripts/cache-covers.log"

mkdir -p "$COVERS_DIR"
touch "$LOG"

echo "[$(date)] Iniciando cache de capas..." >> "$LOG"

# Extrai fileIds do catálogo + paths das capas
python3 -c "
import json, os, sys

with open('$CATALOG') as f:
    data = json.load(f)

books = data.get('books', data.get('results', data)) if isinstance(data, dict) else data
if isinstance(data, dict) and 'books' in data:
    books = data['books']
elif isinstance(data, dict) and 'results' in data:
    books = data['results']
elif not isinstance(data, list):
    books = [data]

downloaded = 0
skipped = 0
errors = 0

for b in books:
    cover = b.get('cover', '')
    file_id = b.get('fileId', '')
    if not cover and not file_id:
        continue
    
    # Determine filename from cover URL or fileId
    if cover:
        # Extract filename from URL path
        fname = cover.split('/')[-1].split('?')[0]
    elif file_id:
        fname = file_id + '.jpg'
    
    outpath = '$COVERS_DIR/' + fname
    
    # Skip if exists and not forced
    if os.path.exists(outpath) and os.path.getsize(outpath) > 2000 and '--force' not in sys.argv:
        skipped += 1
        continue
    
    # Try Google Drive thumbnail
    gid = file_id
    if not gid and cover and 'id=' in cover:
        gid = cover.split('id=')[-1].split('&')[0]
    
    if not gid:
        continue
    
    url = 'https://lh3.googleusercontent.com/d/' + gid + '=w400'
    
    import subprocess
    result = subprocess.run(
        ['curl', '-s', '-L', '-o', outpath, '--max-time', '10', url],
        capture_output=True
    )
    
    if result.returncode == 0 and os.path.exists(outpath) and os.path.getsize(outpath) > 2000:
        downloaded += 1
    else:
        errors += 1
        if os.path.exists(outpath):
            os.remove(outpath)

print(f'Downloaded: {downloaded}')
print(f'Skipped: {skipped}')
print(f'Errors: {errors}')
" >> "$LOG" 2>&1

echo "[$(date)] Cache concluído." >> "$LOG"
echo "Log: $LOG"
