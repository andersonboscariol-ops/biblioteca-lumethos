/**
 * generate-professional-covers.js
 * 
 * Gera capas profissionais PNG/JPG usando Sharp.
 * Cada capa tem gradiente personalizado por categoria + título em destaque.
 * Substitui as 207 capas SVG placeholder por JPGs de alta qualidade.
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const CATALOG_PATH = "/var/www/biblioteca/backend/data/catalog-books.json";
const COVERS_DIR = "/var/www/biblioteca/backend/public/covers";

const CAT_COLORS = {
  "comentarios-biblicos": { bg: [26, 58, 92], accent: [42, 90, 140] },
  "dicionarios-biblicos": { bg: [45, 90, 39], accent: [74, 138, 66] },
  "teologias-sistematicas": { bg: [92, 42, 26], accent: [140, 74, 42] },
  "biblias-estudo": { bg: [26, 42, 92], accent: [42, 74, 140] },
  escatologia: { bg: [58, 26, 92], accent: [90, 42, 140] },
  hermeneutica: { bg: [26, 92, 58], accent: [42, 140, 90] },
  "historia-igreja": { bg: [92, 74, 26], accent: [140, 122, 42] },
  "teologia-biblica": { bg: [42, 26, 92], accent: [74, 42, 140] },
  "teologia-pastoral": { bg: [92, 26, 58], accent: [140, 42, 90] },
  "evangelismo-missoes": { bg: [26, 74, 92], accent: [42, 122, 140] },
  aconselhamento: { bg: [58, 92, 26], accent: [90, 140, 42] },
  apologetica: { bg: [92, 26, 26], accent: [140, 42, 42] },
  lideranca: { bg: [26, 92, 90], accent: [42, 140, 138] },
  "educacao-crista": { bg: [74, 26, 92], accent: [106, 42, 140] },
  "graca-santificacao": { bg: [92, 58, 26], accent: [140, 90, 42] },
  "adoracao-liturgia": { bg: [26, 58, 74], accent: [42, 90, 122] },
  'família': { bg: [58, 92, 58], accent: [90, 140, 90] },
  "teologia-contemporanea": { bg: [92, 42, 58], accent: [140, 74, 90] },
  "cultura-sociedade": { bg: [42, 58, 92], accent: [74, 90, 140] },
  pneumatologia: { bg: [74, 92, 26], accent: [106, 140, 42] },
  "novo-testamento": { bg: [26, 42, 58], accent: [42, 74, 106] },
  "antigo-testamento": { bg: [58, 42, 26], accent: [90, 74, 42] },
  "teologia-espiritual": { bg: [74, 42, 92], accent: [106, 74, 140] },
  'pregação-expositiva': { bg: [92, 58, 42], accent: [140, 90, 74] },
  discipulado: { bg: [26, 74, 42], accent: [42, 122, 74] },
  "teologia-covenant": { bg: [42, 92, 58], accent: [74, 140, 90] },
  "interpretacao-biblica": { bg: [58, 26, 74], accent: [90, 42, 106] },
  "teologia-moral": { bg: [74, 58, 26], accent: [106, 90, 42] },
  "ministerio-cristao": { bg: [26, 92, 42], accent: [42, 140, 74] },
  "oracao-vida-espiritual": { bg: [42, 26, 58], accent: [74, 42, 90] },
  "teologia-pratica": { bg: [92, 74, 42], accent: [140, 122, 74] },
  missiologia: { bg: [58, 74, 26], accent: [90, 122, 42] },
  "teologia-libertacao": { bg: [74, 26, 42], accent: [106, 42, 74] },
  "teologia-metodista": { bg: [42, 74, 92], accent: [74, 122, 140] },
};

const DEFAULT_COLOR = { bg: [26, 42, 58], accent: [58, 90, 122] };

function wrapText(text, maxChars) {
  if (!text || text.length <= maxChars) return [text || "Livro"];
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(s) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function createCover(title, categorySlug, outputPath) {
  const W = 300,
    H = 450;
  const color = CAT_COLORS[categorySlug] || DEFAULT_COLOR;
  const shortTitle = (title || "Livro Teológico").trim();

  // SVG overlay with gradient and text
  const titleLines = wrapText(shortTitle, 22);
  const textElements = titleLines
    .map(
      (line, i) =>
        `<text x="150" y="${190 + i * 32}" text-anchor="middle" class="title" font-size="${line.length > 20 ? 16 : 20}">${escapeXml(line)}</text>`
    )
    .join("");

  const svgOverlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:rgb(${color.bg[0]},${color.bg[1]},${color.bg[2]})"/>
        <stop offset="100%" style="stop-color:rgb(${color.accent[0]},${color.accent[1]},${color.accent[2]})"/>
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.05)"/>
        <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
        <stop offset="100%" style="stop-color:rgba(0,0,0,0.12)"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)" rx="8"/>
    <rect width="${W}" height="${H}" fill="url(#glow)" rx="8"/>
    <style>
      .title { fill: rgba(255,255,255,0.92); font-family: 'Noto Sans', 'DejaVu Sans', sans-serif; font-weight: 700; }
      .subtitle { fill: rgba(255,255,255,0.15); font-family: 'Noto Sans', sans-serif; }
      .accent { fill: rgba(255,255,255,0.06); font-family: 'Noto Sans', sans-serif; }
    </style>
    <line x1="30" y1="350" x2="270" y2="350" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    ${textElements}
    <rect x="120" y="140" width="60" height="60" rx="30" fill="rgba(255,255,255,0.04)"/>
    <text x="150" y="178" text-anchor="middle" class="accent" font-size="24">&#x1F4D6;</text>
    <text x="150" y="420" text-anchor="middle" class="subtitle" font-size="10">Biblioteca Teol&#xF3;gica do Pregador</text>
  </svg>`;

  const svgBuffer = Buffer.from(svgOverlay);

  // Create base image and composite SVG
  const base = sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: color.bg[0], g: color.bg[1], b: color.bg[2] },
    },
  });

  const result = await base
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toFile(outputPath);

  return result;
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const books = raw.results || raw.books || raw;

  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }

  const existing = new Set(fs.readdirSync(COVERS_DIR));

  // Find books with SVG cover (need replacement)
  const toConvert = books.filter((b) => {
    if (!b.cover) return true;
    const fname = b.cover.split("/").pop();
    return !existing.has(fname);
  });

  console.log(`📚 Total: ${books.length} livros`);
  console.log(`✅ Capas reais existentes: ${existing.size - toConvert.length}`);
  console.log(`🎨 Capas SVG para converter: ${toConvert.length}`);
  console.log("");

  if (toConvert.length === 0) {
    console.log("✨ Nada a fazer! Todas as capas já são PNG/JPG.");
    return;
  }

  let success = 0;
  let fail = 0;

  for (let i = 0; i < toConvert.length; i++) {
    const book = toConvert[i];
    const oldSvgName = book.cover ? book.cover.split("/").pop() : null;
    const pngName = (oldSvgName || `book_${book.id}`).replace(/\.svg$/i, ".jpg");
    const outputPath = path.join(COVERS_DIR, pngName);

    process.stdout.write(
      `  [${i + 1}/${toConvert.length}] ${(book.title || book.id).slice(0, 40).padEnd(42)}... `
    );

    try {
      await createCover(book.title, book.categorySlug, outputPath);

      // Update catalog reference
      book.cover = `/covers/${pngName}`;

      // Remove old SVG
      if (oldSvgName) {
        const oldSvg = path.join(COVERS_DIR, oldSvgName);
        if (fs.existsSync(oldSvg)) {
          fs.unlinkSync(oldSvg);
        }
      }

      success++;
      console.log("✅");
    } catch (err) {
      fail++;
      console.log("❌", err.message.slice(0, 60));
    }

    // Save progress every 25
    if ((i + 1) % 25 === 0) {
      if (raw.results) raw.results = books;
      else if (raw.books) raw.books = books;
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2));
      console.log(`  💾 Progresso salvo (${i + 1}/${toConvert.length})`);
    }
  }

  // Final save
  if (raw.results) raw.results = books;
  else if (raw.books) raw.books = books;
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2));

  const finalFiles = fs.readdirSync(COVERS_DIR);
  const jpgCount = finalFiles.filter((f) => f.endsWith(".jpg")).length;
  const pngCount = finalFiles.filter((f) => f.endsWith(".png")).length;
  const svgCount = finalFiles.filter((f) => f.endsWith(".svg")).length;

  console.log("");
  console.log("📊 Resultado final:");
  console.log(`  ✅ JPG gerados: ${success}`);
  console.log(`  ❌ Falhas: ${fail}`);
  console.log(`  🖼️  JPG: ${jpgCount} | PNG: ${pngCount} | SVG: ${svgCount}`);
  console.log(`  📁 Total: ${finalFiles.length} arquivos`);

  // Verify all books have real covers
  const existing2 = new Set(fs.readdirSync(COVERS_DIR));
  const stillMissing = books.filter((b) => {
    if (!b.cover) return true;
    const fn = b.cover.split("/").pop();
    return !existing2.has(fn);
  });

  if (stillMissing.length > 0) {
    console.log(`\n⚠️  Ainda sem capa: ${stillMissing.length}`);
  } else {
    console.log(`\n✅ TODOS os ${books.length} livros têm capa real!`);
  }
}

main().catch(console.error);
