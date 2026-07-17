#!/usr/bin/env node
/**
 * Download cover images from Google Drive for all books in catalog
 * Uses Google Drive thumbnail API
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/catalog-books.json');
const coversDir = path.join(__dirname, '../public/covers');

// Ensure covers directory exists
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const books = catalog.books;

let pending = books.filter(b => b.fileId && (!b.cover || b.cover.includes('placehold.co')));
console.log(`📚 Total: ${books.length} livros`);
console.log(`🖼️  Precisam de capa: ${pending.length}`);

let success = 0;
let failed = 0;
let skipped = 0;

function downloadCover(book, retries = 2) {
  return new Promise((resolve) => {
    const fileId = book.fileId;
    if (!fileId) {
      skipped++;
      return resolve(false);
    }

    // Skip if already have local cover
    const expectedFile = `${book.categorySlug}_${fileId}.jpg`;
    const localPath = path.join(coversDir, expectedFile);
    if (fs.existsSync(localPath)) {
      skipped++;
      // Update book cover to local path
      book.cover = `/covers/${expectedFile}`;
      return resolve(true);
    }

    // Try Google thumbnail
    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=s400`;
    
    https.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/*,*/*;q=0.8'
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          const client = redirectUrl.startsWith('https') ? https : http;
          client.get(redirectUrl, { timeout: 10000 }, (res2) => {
            handleResponse(res2, book, expectedFile, localPath, resolve);
          }).on('error', () => {
            handleRetry(resolve, book, retries);
          });
          return;
        }
      }
      handleResponse(res, book, expectedFile, localPath, resolve);
    }).on('error', () => {
      handleRetry(resolve, book, retries);
    }).on('timeout', function() {
      this.destroy();
      handleRetry(resolve, book, retries);
    });
  });
}

function handleResponse(res, book, expectedFile, localPath, resolve) {
  const contentType = res.headers['content-type'] || '';
  
  if (!contentType.startsWith('image/')) {
    res.resume();
    return resolve(false);
  }

  const ext = contentType.includes('png') ? '.png' : '.jpg';
  const finalFile = `${book.categorySlug}_${book.fileId}${ext}`;
  const finalPath = path.join(coversDir, finalFile);

  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    if (buffer.length > 1000) {
      fs.writeFileSync(finalPath, buffer);
      book.cover = `/covers/${finalFile}`;
      success++;
      process.stdout.write(`✅ ${book.title.substring(0, 40).padEnd(42)} (${(buffer.length/1024).toFixed(0)}KB)\n`);
      resolve(true);
    } else {
      resolve(false);
    }
  });
  res.on('error', () => resolve(false));
}

function handleRetry(resolve, book, retries) {
  if (retries > 0) {
    setTimeout(() => downloadCover(book, retries - 1).then(resolve), 1000);
  } else {
    failed++;
    resolve(false);
  }
}

async function run() {
  console.log('🔄 Baixando capas do Google Drive...\n');

  // Concurrency: 3 at a time
  const concurrency = 5;
  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    await Promise.all(batch.map(b => downloadCover(b)));
    
    // Progress
    const pct = ((i + batch.length) / pending.length * 100).toFixed(0);
    process.stdout.write(`\r📊 Progresso: ${Math.min(i + batch.length, pending.length)}/${pending.length} (${pct}%) | ✅ ${success} | ❌ ${failed} | ⏭️ ${skipped}`);
  }

  // Save updated catalog
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  
  console.log(`\n\n✅ Concluído!`);
  console.log(`📊 Baixadas: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`⏭️  Puladas: ${skipped}`);
  console.log(`📁 Total covers: ${fs.readdirSync(coversDir).length}`);
}

run().catch(console.error);
