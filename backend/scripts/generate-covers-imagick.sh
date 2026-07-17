#!/bin/bash
# generate-covers-imagick.sh
# Gera capas profissionalmente estilizadas usando ImageMagick
# Formato: 300x450 PNG com gradiente, ícone Unicode renderizado como texto, título

CATALOG="/var/www/biblioteca/backend/data/catalog-books.json"
COVERS="/var/www/biblioteca/backend/public/covers"

# Cores por categoria - pares (bg, accent)
declare -A CAT_COLORS
CAT_COLORS["comentarios-biblicos"]="#1a3a5c,#2a5a8c"     # Azul escuro
CAT_COLORS["dicionarios-biblicos"]="#2d5a27,#4a8a42"     # Verde floresta
CAT_COLORS["teologias-sistematicas"]="#5c2a1a,#8c4a2a"   # Terracota
CAT_COLORS["biblias-estudo"]="#1a2a5c,#2a4a8c"           # Azul marinho
CAT_COLORS["escatologia"]="#3a1a5c,#5a2a8c"              # Roxo
CAT_COLORS["hermeneutica"]="#1a5c3a,#2a8c5a"             # Verde escuro
CAT_COLORS["historia-igreja"]="#5c4a1a,#8c7a2a"          # Ocre
CAT_COLORS["teologia-biblica"]="#2a1a5c,#4a2a8c"         # Índigo
CAT_COLORS["teologia-pastoral"]="#5c1a3a,#8c2a5a"        # Bordô
CAT_COLORS["evangelismo-missoes"]="#1a4a5c,#2a7a8c"      # Azul petróleo
CAT_COLORS["aconselhamento"]="#3a5c1a,#5a8c2a"           # Verde oliva
CAT_COLORS["apologetica"]="#5c1a1a,#8c2a2a"              # Vermelho escuro
CAT_COLORS["lideranca"]="#1a5c5a,#2a8c8a"                # Verde água
CAT_COLORS["educacao-crista"]="#4a1a5c,#6a2a8c"          # Púrpura
CAT_COLORS["graca-santificacao"]="#5c3a1a,#8c5a2a"       # Bronze
CAT_COLORS["adoracao-liturgia"]="#1a3a4a,#2a5a7a"        # Azul aço
CAT_COLORS["família"]="#3a5c3a,#5a8c5a"                  # Verde musgo
CAT_COLORS["teologia-contemporanea"]="#5c2a3a,#8c4a5a"   # Rosa escuro
CAT_COLORS["cultura-sociedade"]="#2a3a5c,#4a5a8c"        # Azul médio
CAT_COLORS["pneumatologia"]="#4a5c1a,#6a8c2a"            # Verde lima
CAT_COLORS["novo-testamento"]="#1a2a3a,#2a4a6a"          # Azul profundo
CAT_COLORS["antigo-testamento"]="#3a2a1a,#5a4a2a"        # Marrom
CAT_COLORS["teologia-espiritual"]="#4a2a5c,#6a4a8c"      # Ametista
CAT_COLORS["pregação-expositiva"]="#5c3a2a,#8c5a4a"      # Cobre
CAT_COLORS["discipulado"]="#1a4a2a,#2a7a4a"              # Verde jade
CAT_COLORS["teologia-covenant"]="#2a5c3a,#4a8c5a"        # Verde pinheiro
CAT_COLORS["interpretacao-biblica"]="#3a1a4a,#5a2a6a"    # Violeta
CAT_COLORS["teologia-moral"]="#4a3a1a,#6a5a2a"           # Caramelo
CAT_COLORS["ministerio-cristao"]="#1a5c2a,#2a8c4a"       # Verde bandeira
CAT_COLORS["oracao-vida-espiritual"]="#2a1a3a,#4a2a5a"   # Lavanda escuro
CAT_COLORS["teologia-pratica"]="#5c4a2a,#8c7a4a"         # Amarelo mostarda
CAT_COLORS["missiologia"]="#3a4a1a,#5a7a2a"              # Verde cáqui
CAT_COLORS["teologia-libertacao"]="#4a1a2a,#6a2a4a"      # Vinho
CAT_COLORS["teologia-metodista"]="#2a4a5c,#4a7a8c"       # Azul céu noturno
CAT_COLORS["default"]="#1a2a3a,#3a4a5c"                  # Cinza azulado

# Icon mapping - usando font symbols que ImageMagick pode renderizar
declare -A CAT_ICON
CAT_ICON["comentarios-biblicos"]="📖"
CAT_ICON["dicionarios-biblicos"]="📚"
CAT_ICON["teologias-sistematicas"]="✝️"
CAT_ICON["biblias-estudo"]="📜"
CAT_ICON["escatologia"]="🔥"
CAT_ICON["hermeneutica"]="🔍"
CAT_ICON["historia-igreja"]="⛪"
CAT_ICON["teologia-biblica"]="📖"
CAT_ICON["evangelismo-missoes"]="🌍"
CAT_ICON["aconselhamento"]="🤝"
CAT_ICON["apologetica"]="🛡️"
CAT_ICON["lideranca"]="👑"
CAT_ICON["educacao-crista"]="🎓"
CAT_ICON["graca-santificacao"]="✨"
CAT_ICON["adoracao-liturgia"]="🎵"
CAT_ICON["pneumatologia"]="🕯️"
CAT_ICON["novo-testamento"]="✝️"
CAT_ICON["antigo-testamento"]="📜"
CAT_ICON["teologia-espiritual"]="🕊️"
CAT_ICON["pregação-expositiva"]="🎙️"
CAT_ICON["discipulado"]="🌱"
CAT_ICON["teologia-covenant"]="🤝"
CAT_ICON["interpretacao-biblica"]="🔎"
CAT_ICON["teologia-moral"]="⚖️"
CAT_ICON["ministerio-cristao"]="🙏"
CAT_ICON["oracao-vida-espiritual"]="🙏"
CAT_ICON["teologia-pratica"]="🛠️"
CAT_ICON["missiologia"]="🌎"
CAT_ICON["teologia-libertacao"]="🔓"
CAT_ICON["teologia-metodista"]="⛪"

echo "📚 Gerando capas profissionais..."
echo ""

echo "💡 Passo 1: Instalando fontes..."
# Garantir fontes Unicode
apt-get install -y fonts-noto-color-emoji fonts-noto fonts-noto-cjk fonts-dejavu-core 2>/dev/null | tail -1

echo ""
echo "💡 Passo 2: Verificando quais livros precisam de capas melhores..."
echo ""

TOTAL=$(node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('/var/www/biblioteca/backend/data/catalog-books.json','utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('/var/www/biblioteca/backend/public/covers'));
const svgOnly = books.filter(b => b.cover && existing.has(b.cover.split('/').pop()) && b.cover.endsWith('.svg'));
console.log(svgOnly.length);
svgOnly.slice(0,3).forEach(b => console.log(b.categorySlug + '|' + b.title + '|' + b.id));
" 2>&1)

echo "📊 $TOTAL capas SVG para substituir por PNG"
echo ""

# Count how many SVG to convert
SVG_COUNT=$(node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('/var/www/biblioteca/backend/data/catalog-books.json','utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('/var/www/biblioteca/backend/public/covers'));
const svgOnly = books.filter(b => b.cover && existing.has(b.cover.split('/').pop()) && b.cover.endsWith('.svg'));
console.log(svgOnly.length);
" 2>&1)

echo "🔄 Convertendo $SVG_COUNT capas SVG para PNG..."
echo ""

COUNTER=0
SUCCESS=0

# Process each SVG book
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('/var/www/biblioteca/backend/data/catalog-books.json','utf8'));
const books = d.results || d.books || d;
const existing = new Set(fs.readdirSync('/var/www/biblioteca/backend/public/covers'));
const svgOnly = books.filter(b => b.cover && existing.has(b.cover.split('/').pop()) && b.cover.endsWith('.svg'));
svgOnly.forEach(b => {
  const fname = b.cover.split('/').pop();
  const pngName = fname.replace('.svg', '.png');
  console.log(b.categorySlug + '||' + b.title + '||' + pngName + '||' + fname);
});
" 2>&1 | while IFS='||' read -r slug title pngName svgName; do
  COUNTER=$((COUNTER + 1))
  
  # Get colors for this category
  COLORS="${CAT_COLORS[$slug]:-${CAT_COLORS["default"]}}"
  BG="${COLORS%,*}"
  ACCENT="${COLORS#*,}"
  
  # Truncate title for ImageMagick
  SHORT_TITLE=$(echo "$title" | sed 's/["'\'']//g' | head -c 45)
  
  echo "[$COUNTER/$SVG_COUNT] $slug / ${title:0:35}..."
  
  # Use ImageMagick to create a beautiful cover
  convert -size 300x450 \
    -define gradient:direction=south \
    gradient:"$BG"-gradient-"$ACCENT" \
    \( +clone -blur 0x8 \) \
    -compose Overlay -composite \
    \( +clone -fill white -colorize 15% \) \
    -compose Overlay -composite \
    \( +size -font Noto-Sans-Bold -pointsize 18 -fill 'rgba(255,255,255,0.9)' \
       -gravity north -annotate +0+55 "$SHORT_TITLE" \
    \) -composite \
    \( +size -pointsize 10 -fill 'rgba(255,255,255,0.25)' \
       -gravity south -annotate +0+35 "Biblioteca Teológica do Pregador" \
    \) -composite \
    "$COVERS/$pngName" 2>/dev/null
  
  if [ $? -eq 0 ] && [ -f "$COVERS/$pngName" ]; then
    # Remove old SVG, update catalog reference
    rm -f "$COVERS/$svgName"
    node -e "
const fs = require('fs');
const path = '/var/www/biblioteca/backend/data/catalog-books.json';
const d = JSON.parse(fs.readFileSync(path,'utf8'));
const books = d.results || d.books || d;
const book = books.find(b => b.cover && b.cover.endsWith('$svgName'));
if (book) {
  book.cover = '/covers/$pngName';
  if (d.results) d.results = books; else if (d.books) d.books = books;
  fs.writeFileSync(path, JSON.stringify(d, null, 2), 'utf8');
  console.log('OK');
} else {
  console.log('NOT_FOUND');
}
" 2>&1
    
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ❌ Falhou ao gerar"
  fi
  
  # Progress every 20
  if [ $((COUNTER % 20)) -eq 0 ]; then
    echo "  📊 Progresso: $COUNTER/$SVG_COUNT ($SUCCESS convertidos)"
  fi
done

echo ""
echo "✅ Conversão concluída!"
echo "📊 $SUCCESS capas PNG geradas a partir de $SVG_COUNT SVGs"
echo ""
echo "📊 Status final:"
ls "$COVERS" | wc -l
echo "Arquivos no diretório de covers"
