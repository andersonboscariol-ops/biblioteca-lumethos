/**
 * drive-recon.js
 * 
 * Reconhecimento: testa DIVERSOS métodos de download do Google Drive
 * com um único fileId, loga resultados detalhados, descobre o que funciona.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const COVERS_DIR = '/var/www/biblioteca/backend/public/covers';

function httpGetFull(url, destPath) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      timeout: 20000,
      rejectUnauthorized: false
    }, (res) => {
      const headers = res.headers;
      const redir = (res.statusCode >= 300 && res.statusCode < 400) ? headers.location : null;
      const ct = headers['content-type'] || '';
      
      if (redir) {
        file.close();
        fs.unlinkSync(destPath);
        resolve({ status: res.statusCode, redirect: redir, headers });
        return;
      }
      
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        file.end();
        file.close();
        
        const isImage = ct.startsWith('image/') && !ct.includes('svg');
        const isHtml = ct.includes('text/html');
        const isPdf = ct === 'application/pdf';
        
        fs.writeFileSync(destPath, body);
        
        resolve({
          status: res.statusCode,
          contentType: ct.slice(0,60),
          contentLength: parseInt(headers['content-length'] || '0') || body.length,
          bodyLength: body.length,
          isImage,
          isHtml,
          isPdf,
          headers
        });
      });
    });
    req.on('error', (e) => { 
      try { file.close(); fs.unlinkSync(destPath); } catch {}
      resolve({ error: e.message }); 
    });
    req.end();
  });
}

async function main() {
  // Test with files that DON'T exist yet (or first book)
  const fileIds = [
    '1oI9OCXIR9qlQUA4fAahA5oI1jPgDeSTG',  // comentarios-biblicos-49 (Novo Comentário Beacon - should exist)
    '1DPF3oOrSKjt8jrtF2Cs1f5_ddo2clOox',  // another sample
  ];
  
  // But first let's try with a file that's KNOWN to have a PNG already
  // Actually let's try with ANY fileId and see which method works
  
  const testFileId = '1oI9OCXIR9qlQUA4fAahA5oI1jPgDeSTG';
  const tmpDir = '/tmp/drive-test';
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  
  console.log('🎯 Testando métodos de download do Google Drive');
  console.log(`📎 FileId: ${testFileId}`);
  console.log('');
  
  const methods = [
    // Google Drive native URLs
    { url: `https://drive.google.com/thumbnail?id=${testFileId}&sz=s400`, label: 'thumbnail sz=s400' },
    { url: `https://drive.google.com/thumbnail?id=${testFileId}&sz=s800`, label: 'thumbnail sz=s800' },
    { url: `https://drive.google.com/thumbnail?id=${testFileId}&sz=s1600`, label: 'thumbnail sz=s1600' },
    { url: `https://drive.google.com/uc?export=download&id=${testFileId}`, label: 'uc export=download' },
    { url: `https://drive.google.com/uc?export=download&confirm=t&id=${testFileId}`, label: 'uc confirm=t' },
    { url: `https://drive.google.com/uc?id=${testFileId}`, label: 'uc?id' },
    // lh3 googleusercontent (CDN)
    { url: `https://lh3.googleusercontent.com/d/${testFileId}`, label: 'lh3 d' },
    { url: `https://lh3.googleusercontent.com/d/${testFileId}=s400`, label: 'lh3 =s400' },
    { url: `https://lh3.googleusercontent.com/d/${testFileId}=s800`, label: 'lh3 =s800' },
    // doc viewer
    { url: `https://docs.google.com/viewer?srcid=${testFileId}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`, label: 'viewer srcid' },
    // Alternative CDN paths
    { url: `https://lh5.googleusercontent.com/d/${testFileId}`, label: 'lh5 d' },
    { url: `https://lh6.googleusercontent.com/d/${testFileId}`, label: 'lh6 d' },
    // Proxy-like access
    { url: `https://drive.usercontent.google.com/download?id=${testFileId}`, label: 'usercontent download' },
    { url: `https://drive.usercontent.google.com/thumbnail?id=${testFileId}&sz=s400`, label: 'usercontent thumbnail' },
  ];
  
  for (const method of methods) {
    const outputPath = path.join(tmpDir, `test_${Date.now()}.dat`);
    process.stdout.write(`  📡 ${method.label.padEnd(35)}... `);
    
    try {
      const result = await httpGetFull(method.url, outputPath);
      
      if (result.error) {
        console.log(`❌ ${result.error.slice(0,40)}`);
        continue;
      }
      
      if (result.redirect) {
        console.log(`🔀 ${result.status} → ${result.redirect.slice(0,60)}`);
        continue;
      }
      
      if (result.isImage) {
        console.log(`✅ IMAGE ${result.contentType} (${(result.bodyLength/1024).toFixed(1)}KB)`);
      } else if (result.isPdf) {
        console.log(`📄 PDF ${(result.bodyLength/1024).toFixed(1)}KB`);
      } else if (result.isHtml) {
        const sample = fs.readFileSync(outputPath, 'utf8').slice(0, 200);
        console.log(`📄 HTML ${(result.bodyLength/1024).toFixed(1)}KB (${sample.slice(0, 60)}...)`);
      } else {
        // Binary of unknown type
        const sample = result.bodyLength > 0 ? fs.readFileSync(outputPath).slice(0, 20) : null;
        const hexSig = sample ? [...sample].map(b => b.toString(16).padStart(2,'0')).join(' ') : 'empty';
        console.log(`❓ HTTP ${result.status} CT:${result.contentType} (${(result.bodyLength/1024).toFixed(1)}KB) sig:${hexSig}`);
      }
      
      // Cleanup
      try { fs.unlinkSync(outputPath); } catch {}
    } catch (e) {
      console.log(`💥 ${e.message.slice(0, 40)}`);
    }
  }
  
  // Now try Playwright with Google Drive
  console.log('\n🎯 Testando Playwright (navegador real)...');
  console.log('');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  
  // Intercept network requests
  const capturedUrls = [];
  page.on('response', response => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    if ((url.includes('google') && ct.startsWith('image/')) || url.includes('lh3.google') || url.includes('googleusercontent')) {
      capturedUrls.push({ url, ct, status: response.status() });
    }
  });
  
  // Try navigating
  const pageUrls = [
    `https://drive.google.com/file/d/${testFileId}/preview`,
    `https://drive.google.com/file/d/${testFileId}/view`,
  ];
  
  for (const pageUrl of pageUrls) {
    console.log(`  🌐 Navegando: ${pageUrl.slice(0, 70)}...`);
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 25000 }).catch(e => {
      console.log(`     ⚠️ Timeout/erro: ${e.message.slice(0, 50)}`);
    });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log(`     📸 Captured image URLs: ${capturedUrls.length}`);
    capturedUrls.slice(-5).forEach(u => {
      console.log(`       ${u.status} ${u.ct.slice(0,30)} ${u.url.slice(0, 100)}`);
    });
    
    // Try screenshot of the preview
    const elements = await page.$$('img');
    console.log(`     🖼️  Imgs found: ${elements.length}`);
    for (const el of elements) {
      const src = await el.getAttribute('src');
      if (src && (src.includes('google') || src.includes('lh3'))) {
        console.log(`       src: ${src.slice(0, 100)}`);
      }
    }
  }
  
  // Take a screenshot anyway
  const ssPath = '/tmp/drive-preview-screenshot.png';
  await page.screenshot({ path: ssPath, fullPage: true });
  const ssStat = fs.statSync(ssPath);
  console.log(`\n     📷 Screenshot: ${(ssStat.size / 1024).toFixed(1)}KB`);
  
  await browser.close();
  console.log('\n✅ Recon completo!');
}

main().catch(console.error);
