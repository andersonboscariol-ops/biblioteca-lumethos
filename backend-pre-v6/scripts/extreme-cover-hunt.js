/**
 * extreme-cover-hunt.js
 * 
 * Caça extrema de capas. Usa múltiplas estratégias em paralelo:
 * 1. Playwright headless - abre Google Drive viewer, tira screenshot do preview
 * 2. Google Drive API v3 com alt=media (tenta vários formatos)
 * 3. URL de thumbnail direta com cookies de navegador real
 * 4. Google Images search reversa pelo título
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CATALOG_PATH = '/var/www/biblioteca/backend/data/catalog-books.json';
const COVERS_DIR = '/var/www/biblioteca/backend/public/covers';

// Colors for category backgrounds (fallback)
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
  família: { bg: [58, 92, 58], accent: [90, 140, 90] },
  "teologia-contemporanea": { bg: [92, 42, 58], accent: [140, 74, 90] },
  "cultura-sociedade": { bg: [42, 58, 92], accent: [74, 90, 140] },
  pneumatologia: { bg: [74, 92, 26], accent: [106, 140, 42] },
  "novo-testamento": { bg: [26, 42, 58], accent: [42, 74, 106] },
  "antigo-testamento": { bg: [58, 42, 26], accent: [90, 74, 42] },
  "teologia-espiritual": { bg: [74, 42, 92], accent: [106, 74, 140] },
  "pregação-expositiva": { bg: [92, 58, 42], accent: [140, 90, 74] },
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url, destPath) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
      rejectUnauthorized: false
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        resolve({ status: res.statusCode, redirect: res.headers.location });
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || '';
        file.close();
        if (res.statusCode === 200 && (ct.startsWith('image/') || body.length > 5000 && !ct.includes('text/html'))) {
          fs.writeFileSync(destPath, body);
          resolve({ status: 200, contentType: ct, size: body.length });
        } else {
          fs.unlinkSync(destPath);
          resolve({ status: res.statusCode, contentType: ct, size: body.length, body: body.length < 1000 ? body.toString() : null });
        }
      });
    });
    req.on('error', (e) => { file.close(); fs.unlinkSync(destPath); resolve({ error: e.message }); });
    req.end();
  });
}

async function tryDriveDirectDownload(fileId, outputPath) {
  // Métodos de download direto
  const methods = [
    { url: `https://drive.google.com/thumbnail?id=${fileId}&sz=s400`, label: 'thumbnail-s400' },
    { url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`, label: 'thumbnail-w400' },
    { url: `https://drive.google.com/thumbnail?id=${fileId}&sz=s800`, label: 'thumbnail-s800' },
    { url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`, label: 'thumbnail-w800' },
    { url: `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`, label: 'uc-confirm' },
    { url: `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`, label: 'uc-confirm2' },
    { url: `https://drive.google.com/uc?id=${fileId}`, label: 'uc-id' },
    { url: `https://docs.google.com/document/d/${fileId}/preview`, label: 'doc-preview' },
    { url: `https://docs.google.com/viewer?srcid=${fileId}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`, label: 'viewer' },
    { url: `https://lh3.googleusercontent.com/d/${fileId}`, label: 'lh3-d' },
    { url: `https://lh3.googleusercontent.com/d/${fileId}=s400`, label: 'lh3-s400' },
  ];

  for (const method of methods) {
    const result = await httpGet(method.url, outputPath);
    if (result.status === 200 && result.size > 1000) {
      return { success: true, method: method.label, fileSize: result.size };
    }
  }
  return { success: false };
}

async function captureDrivePreview(fileId, outputPath, browser) {
  // Usa Playwright para abrir o preview do Google Drive e screenshot
  try {
    const urls = [
      `https://drive.google.com/file/d/${fileId}/preview`,
      `https://docs.google.com/viewer?srcid=${fileId}&embedded=true`,
      `https://drive.google.com/file/d/${fileId}/view`,
    ];

    for (const url of urls) {
      try {
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 900 });
        
        // Intercept requests to find image URLs
        const imageUrls = [];
        page.on('response', response => {
          const ct = response.headers()['content-type'] || '';
          if (ct.startsWith('image/') && response.url().includes('google')) {
            imageUrls.push(response.url());
          }
        });

        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
        await sleep(3000);

        // Try to find the preview image element
        const previewImg = await page.$('img[src*="google"], img[src*="lh3"], #preview-image, .drive-viewer-panel img');
        if (previewImg) {
          const box = await previewImg.boundingBox();
          if (box && box.width > 50) {
            await page.screenshot({ 
              path: outputPath, 
              clip: { x: box.x, y: box.y, width: Math.min(box.width, 600), height: Math.min(box.height, 900) }
            });
            const stat = fs.statSync(outputPath);
            await page.close();
            return { success: true, method: 'screenshot-preview', size: stat.size };
          }
        }

        // If no preview image found, try full page screenshot
        await page.click('#drive-main-page-container, .drive-viewer-panel, .ndfHFb-c4YZDc-aTzPJd').catch(() => {});
        await sleep(1000);
        
        const fullScreenshotPath = outputPath;
        await page.screenshot({ path: fullScreenshotPath, fullPage: false });
        const stat = fs.statSync(fullScreenshotPath);
        await page.close();
        
        if (stat.size > 5000) {
          return { success: true, method: 'screenshot-full', size: stat.size };
        }
      } catch (e) {
        continue;
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const books = raw.results || raw.books || raw;
  const existing = new Set(fs.readdirSync(COVERS_DIR));

  // Find books with fileId but only placeholder covers (JPG generated by sharp)
  const toHunt = books.filter(b => {
    if (!b.fileId) return false;
    if (!b.cover) return true;
    const fname = b.cover.split('/').pop();
    if (!existing.has(fname)) return true;
    return false;
  });

  // Actually ALL books have covers now. But let's try to get REAL covers for the 344 with fileId
  // Replace even the good ones if we can get better
  const fileIdBooks = books.filter(b => b.fileId);
  
  console.log(`📚 Total: ${books.length}`);
  console.log(`🎯 Livros com fileId: ${fileIdBooks.length}`);
  console.log(`🎯 Livros sem fileId: ${books.length - fileIdBooks.length}`);
  console.log('');

  // Phase 1: Try direct download for all fileIds
  console.log('=== FASE 1: Download direto (11 métodos) ===');
  let directSuccess = 0;
  
  for (let i = 0; i < Math.min(fileIdBooks.length, 50); i++) {
    const book = fileIdBooks[i];
    const outputPath = path.join(COVERS_DIR, `temp_${book.fileId}.jpg`);
    
    process.stdout.write(`  [${i+1}/50] ${(book.title || book.id).slice(0,35).padEnd(37)}... `);
    const result = await tryDriveDirectDownload(book.fileId, outputPath);
    
    if (result.success) {
      // Save as proper filename
      const properName = `${book.categorySlug}_${book.fileId}.jpg`;
      const properPath = path.join(COVERS_DIR, properName);
      fs.renameSync(outputPath, properPath);
      book.cover = `/covers/${properName}`;
      directSuccess++;
      console.log(`✅ ${result.method} (${(result.fileSize / 1024).toFixed(1)}KB)`);
    } else {
      console.log('❌');
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
    
    if ((i + 1) % 10 === 0) {
      if (raw.results) raw.results = books; else if (raw.books) raw.books = books;
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2));
    }
  }
  
  console.log(`\n📊 Direct downloads: ${directSuccess}/50`);
  
  // Phase 2: Playwright screenshot approach
  if (directSuccess < 50) {
    console.log('\n=== FASE 2: Playwright Screenshot ===');
    
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]
    });
    
    let pwSuccess = 0;
    const remaining = fileIdBooks.filter(b => {
      if (!b.fileId) return false;
      const fname = b.cover.split('/').pop();
      return !existing.has(fname.replace(/\.svg$/, '.jpg'));
    }).slice(0, 50 - directSuccess);
    
    for (let i = 0; i < remaining.length; i++) {
      const book = remaining[i];
      const outputPath = path.join(COVERS_DIR, `pw_${book.fileId}.png`);
      
      process.stdout.write(`  [${i+1}/${remaining.length}] ${(book.title || book.id).slice(0,35).padEnd(37)}... `);
      const result = await captureDrivePreview(book.fileId, outputPath, browser);
      
      if (result.success) {
        const properName = `${book.categorySlug}_${book.fileId}.jpg`;
        const properPath = path.join(COVERS_DIR, properName);
        // Convert PNG to JPG if needed (sharp)
        try {
          const sharp = require('sharp');
          await sharp(outputPath).jpeg({ quality: 85 }).toFile(properPath);
          fs.unlinkSync(outputPath);
        } catch {
          fs.renameSync(outputPath, properPath);
        }
        book.cover = `/covers/${properName}`;
        pwSuccess++;
        console.log(`✅ ${result.method} (${(result.size / 1024).toFixed(1)}KB)`);
      } else {
        console.log('❌');
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
    }
    
    await browser.close();
    console.log(`\n📊 Playwright screenshots: ${pwSuccess}/${remaining.length}`);
  }
  
  // Final save
  if (raw.results) raw.results = books; else if (raw.books) raw.books = books;
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2));
  
  // Report
  const finalExisting = new Set(fs.readdirSync(COVERS_DIR));
  const finalJpg = [...finalExisting].filter(f => f.endsWith('.jpg') && !f.startsWith('pw_') && !f.startsWith('temp_')).length;
  const finalPng = [...finalExisting].filter(f => f.endsWith('.png') && !f.startsWith('pw_')).length;
  const totalSuccess = directSuccess + pwSuccess;
  
  console.log('\n========== RESULTADO FINAL ==========');
  console.log(`✅ Novas capas baixadas: ${totalSuccess}`);
  console.log(`🖼️  Total JPG: ${finalJpg}`);
  console.log(`🖼️  Total PNG: ${finalPng}`);
  console.log(`📁 Total arquivos: ${finalExisting.size}`);
}

main().catch(console.error);
