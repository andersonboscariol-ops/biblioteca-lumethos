/**
 * generate-missing-covers.js
 * 
 * Gera capas placeholder localmente para livros sem capa real.
 * Usa HTML/CSS renderizado via Puppeteer ou cria SVGs estilizados.
 * Como não temos Puppeteer, vamos criar SVGs.
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = '/var/www/biblioteca/backend/data/catalog-books.json';
const COVERS_DIR = '/var/www/biblioteca/backend/public/covers/';

const CAT_COLORS = {
    'comentarios-biblicos':     { bg: '#1a3a5c', text: '#ffffff' },
    'dicionarios-biblicos':     { bg: '#2d5a27', text: '#ffffff' },
    'teologias-sistematicas':   { bg: '#5c2a1a', text: '#ffffff' },
    'biblias-estudo':           { bg: '#1a2a5c', text: '#ffffff' },
    'escatologia':              { bg: '#3a1a5c', text: '#ffffff' },
    'hermeneutica':             { bg: '#1a5c3a', text: '#ffffff' },
    'historia-igreja':          { bg: '#5c4a1a', text: '#ffffff' },
    'teologia-biblica':         { bg: '#2a1a5c', text: '#ffffff' },
    'teologia-pastoral':        { bg: '#5c1a3a', text: '#ffffff' },
    'evangelismo-missoes':      { bg: '#1a4a5c', text: '#ffffff' },
    'aconselhamento':           { bg: '#3a5c1a', text: '#ffffff' },
    'apologetica':              { bg: '#5c1a1a', text: '#ffffff' },
    'lideranca':                { bg: '#1a5c5a', text: '#ffffff' },
    'educacao-crista':          { bg: '#4a1a5c', text: '#ffffff' },
    'graca-santificacao':       { bg: '#5c3a1a', text: '#ffffff' },
    'adoracao-liturgia':        { bg: '#1a3a4a', text: '#ffffff' },
    'família':                  { bg: '#3a5c3a', text: '#ffffff' },
    'teologia-contemporanea':   { bg: '#5c2a3a', text: '#ffffff' },
    'cultura-sociedade':        { bg: '#2a3a5c', text: '#ffffff' },
    'pneumatologia':            { bg: '#4a5c1a', text: '#ffffff' },
    'teologia-sistematica':     { bg: '#5c1a4a', text: '#ffffff' },
    'novo-testamento':          { bg: '#1a2a3a', text: '#ffffff' },
    'antigo-testamento':        { bg: '#3a2a1a', text: '#ffffff' },
    'teologia-espiritual':      { bg: '#4a2a5c', text: '#ffffff' },
    'pregação-expositiva':      { bg: '#5c3a2a', text: '#ffffff' },
    'discipulado':              { bg: '#1a4a2a', text: '#ffffff' },
    'teologia-covenant':        { bg: '#2a5c3a', text: '#ffffff' },
    'interpretacao-biblica':    { bg: '#3a1a4a', text: '#ffffff' },
    'teologia-moral':           { bg: '#4a3a1a', text: '#ffffff' },
    'ministerio-cristao':       { bg: '#1a5c2a', text: '#ffffff' },
    'oracao-vida-espiritual':   { bg: '#2a1a3a', text: '#ffffff' },
    'teologia-pratica':         { bg: '#5c4a2a', text: '#ffffff' },
    'missiologia':              { bg: '#3a4a1a', text: '#ffffff' },
    'teologia-libertacao':      { bg: '#4a1a2a', text: '#ffffff' },
    'teologia-metodista':       { bg: '#2a4a5c', text: '#ffffff' },
};

const DEFAULT_COLOR = { bg: '#1a3a5c', text: '#ffffff' };

// Category icons (Unicode symbols)
const CAT_ICONS = {
    'comentarios-biblicos':     '📖',
    'dicionarios-biblicos':     '📚',
    'teologias-sistematicas':   '✝️',
    'biblias-estudo':           '📜',
    'escatologia':              '🔥',
    'hermeneutica':             '🔍',
    'historia-igreja':          '⛪',
    'teologia-biblica':         '📖',
    'teologia-pastoral':        '🕊️',
    'evangelismo-missoes':      '🌍',
    'aconselhamento':           '🤝',
    'apologetica':              '🛡️',
    'lideranca':                '👑',
    'educacao-crista':          '🎓',
    'graca-santificacao':       '✨',
    'adoracao-liturgia':        '🎵',
    'família':                  '👨‍👩‍👧‍👦',
    'teologia-contemporanea':   '💡',
    'cultura-sociedade':        '🌐',
    'pneumatologia':            '🕯️',
    'novo-testamento':          '✝️',
    'antigo-testamento':        '📜',
    'teologia-espiritual':      '🕊️',
    'pregação-expositiva':      '🎙️',
    'discipulado':              '🌱',
    'teologia-covenant':        '🤝',
    'interpretacao-biblica':    '🔎',
    'teologia-moral':           '⚖️',
    'ministerio-cristao':       '🙏',
    'oracao-vida-espiritual':   '🙏',
    'teologia-pratica':         '🛠️',
    'missiologia':              '🌎',
    'teologia-libertacao':      '🔓',
    'teologia-metodista':       '⛪',
};

// Gera SVG de capa
function generateCoverSVG(title, categorySlug, id) {
    const color = CAT_COLORS[categorySlug] || DEFAULT_COLOR;
    const icon = CAT_ICONS[categorySlug] || '📖';
    const shortTitle = (title || 'Livro Teológico').slice(0, 40);
    
    // Escape title for SVG
    const escTitle = shortTitle
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#${color.bg};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#${parseInt(color.bg.slice(0,2),16) > 20 ? parseInt(color.bg.slice(0,2),16)-8 : '0a'}${parseInt(color.bg.slice(2,4),16) > 20 ? parseInt(color.bg.slice(2,4),16)-8 : '0a'}${parseInt(color.bg.slice(4,6),16) > 20 ? parseInt(color.bg.slice(4,6),16)-8 : '0a'};stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" rx="8" fill="url(#bg)"/>
  <text x="150" y="160" text-anchor="middle" font-size="56" fill="rgba(255,255,255,0.15)">${icon}</text>
  <text x="150" y="240" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="rgba(255,255,255,0.9)" line-spacing="1.3">
    <tspan x="150" dy="-12">${wrapText(escTitle, 18)}</tspan>
  </text>
  <rect x="60" y="380" width="180" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>
  <text x="150" y="418" text-anchor="middle" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.3)">Biblioteca Teológica do Pregador</text>
</svg>`;
}

function wrapText(text, maxChars) {
    if (text.length <= maxChars) return text;
    const parts = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= maxChars) {
            parts.push(remaining);
            break;
        }
        // Try to break at space
        const slice = remaining.slice(0, maxChars);
        const lastSpace = slice.lastIndexOf(' ');
        if (lastSpace > 0 && lastSpace > maxChars * 0.4) {
            parts.push(remaining.slice(0, lastSpace));
            remaining = remaining.slice(lastSpace + 1);
        } else {
            parts.push(slice + '-');
            remaining = remaining.slice(maxChars);
        }
    }
    return parts.join('\n');
}

async function main() {
    const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const books = raw.results || raw.books || raw;
    
    if (!fs.existsSync(COVERS_DIR)) {
        fs.mkdirSync(COVERS_DIR, { recursive: true });
    }
    
    const existing = new Set(fs.readdirSync(COVERS_DIR));
    
    console.log(`📚 Total: ${books.length} livros`);
    console.log(`✅ Já existem: ${existing.size} capas`);
    
    let generated = 0;
    let updated = 0;
    
    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        
        // Determine the cover filename
        let coverFile;
        if (book.cover && !book.cover.includes('placehold.co')) {
            const parts = book.cover.split('/');
            coverFile = parts[parts.length - 1];
        }
        
        // If we have a cover reference and it exists on disk, skip
        if (coverFile && existing.has(coverFile)) {
            continue;
        }
        
        // Generate new cover
        const fname = `${book.categorySlug || 'geral'}_${book.id || i}_cover.svg`;
        const destPath = path.join(COVERS_DIR, fname);
        
        const svg = generateCoverSVG(book.title, book.categorySlug, book.id);
        fs.writeFileSync(destPath, svg, 'utf8');
        
        book.cover = `/covers/${fname}`;
        generated++;
        updated++;
        
        if (generated % 50 === 0) {
            console.log(`   ... ${generated} geradas`);
        }
    }
    
    // Save updated catalog
    if (raw.results) {
        raw.results = books;
    } else if (raw.books) {
        raw.books = books;
    }
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2), 'utf8');
    
    const finalCount = fs.readdirSync(COVERS_DIR).length;
    console.log(`\n📊 Resultado:`);
    console.log(`   Capas geradas: ${generated}`);
    console.log(`   Total no diretório: ${finalCount}`);
    
    // Check if any book still missing
    const missing = books.filter(b => {
        if (!b.cover) return true;
        const fn = b.cover.split('/').pop();
        return !fs.existsSync(path.join(COVERS_DIR, fn));
    });
    if (missing.length > 0) {
        console.log(`   ⚠️  Ainda sem capa: ${missing.length}`);
        missing.slice(0, 5).forEach(b => console.log(`       ${b.id} ${b.title?.slice(0,40)}`));
    } else {
        console.log(`   ✅ Todos os ${books.length} livros têm capa!`);
    }
    
    console.log(`\n✨ Pronto!`);
}

main().catch(console.error);
