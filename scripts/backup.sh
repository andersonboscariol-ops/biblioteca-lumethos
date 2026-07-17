#!/bin/bash
# =============================================================
# Biblioteca Lumethos — Backup Automático v5
# Mantém os últimos 7 backups, remove os mais antigos
# =============================================================

BACKUP_DIR="/var/backups/biblioteca"
SOURCE_DIR="/var/www/biblioteca"
GIT_REMOTE="https://github.com/andersonboscariol-ops/biblioteca-lumethos.git"
RETENTION=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/biblioteca-v5-${TIMESTAMP}.tar.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"
TOKEN_FILE="/root/.cofre/secrets/github-token.txt.enc"
TOKEN_FALLBACK="/root/.openclaw/secrets/github-token.txt"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Backup v5 iniciado ===" >> "$LOG_FILE"

# ========================================
# 1. Backup local (tar.gz)
# ========================================
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Criando backup tar.gz..." >> "$LOG_FILE"

tar czf "$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='frontend-bak-*' \
  -C / var/www/biblioteca/ 2>> "$LOG_FILE"

BK_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup local: $BACKUP_FILE ($BK_SIZE)" >> "$LOG_FILE"

# Remove backups mais antigos que RETENTION dias
find "$BACKUP_DIR" -name "biblioteca-v5-*.tar.gz" -type f -mtime +${RETENTION} -delete

# ========================================
# 2. Backup GitHub (git commit + push)
# ========================================
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Enviando para GitHub..." >> "$LOG_FILE"

if [ -f "$TOKEN_FALLBACK" ]; then
  TOKEN=$(cat "$TOKEN_FALLBACK")
  cd "$SOURCE_DIR"
  
  # Adiciona tudo e commita
  git add -A
  
  # Só commita se houver mudanças
  if ! git diff --cached --quiet; then
    git commit -m "backup diário v5 — $(date '+%Y-%m-%d %H:%M')"
    git remote set-url origin "https://andersonboscariol-ops:${TOKEN}@github.com/andersonboscariol-ops/biblioteca-lumethos.git"
    git push origin master 2>> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] GitHub: push realizado" >> "$LOG_FILE"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] GitHub: sem mudanças para commitar" >> "$LOG_FILE"
  fi
  
  # Reseta URL pra não expor token
  git remote set-url origin "$GIT_REMOTE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] GitHub: token não encontrado, pulando" >> "$LOG_FILE"
fi

# ========================================
# 3. Limpeza
# ========================================
COUNT=$(ls -1 "$BACKUP_DIR"/biblioteca-v5-*.tar.gz 2>/dev/null | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $COUNT backups locais mantidos (limite: $RETENTION)" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Backup v5 concluído ===" >> "$LOG_FILE"

echo "✅ Backup concluído: $BACKUP_FILE ($BK_SIZE) — $COUNT backups ativos + GitHub"
