/**
 * download-missing-covers.js
 * 
 * Baixa capas faltantes do Google Drive via fileId.
 * Usa thumbnail API do Google Drive (sz=s400) para obter imagens pequenas.
 * Estratégia: primeiro tenta download direto, fallback para thumbnail.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CATALOG_PATH = '/var/www/biblioteca/backend/data/catalog-books.json';
const COVERS_DIR = '/var/www/biblioteca/backend/public/covers/';

const CONCURRENCY = 5;

// Cores por categoria para placeholder
const CAT_COLORS = {
    'comentarios-biblicos': '1a3a5c',
    'dicionarios-biblicos': '2d5a27',
    'teologias-sistematicas': '5c2a1a',
    'biblias-estudo': '1a2a5c',
    'escatologia': '3a1a5c',
    'hermeneutica': '1a5c3a',
    'historia-igreja': '5c4a1a',
    'teologia-biblica': '2a1a5c',
    'teologia-pastoral': '5c1a3a',
    'evangelismo-missoes': '1a4a5c',
    'aconselhamento': '3a5c1a',
    'apologetica': '5c1a1a',
    'lideranca': '1a5c5a',
    'educacao-crista': '4a1a5c',
    'graca-santificacao': '5c3a1a',
    'adoracao-liturgia': '1a3a4a',
    'família': '3a5c3a',
    'teologia-contemporanea': '5c2a3a',
    'cultura-sociedade': '2a3a5c',
    'pneumatologia': '4a5c1a',
    'teologia-sistematica': '5c1a4a',
    'novo-testamento': '1a2a3a',
    'antigo-testamento': '3a2a1a',
    'teologia-espiritual': '4a2a5c',
    'pregação-expositiva': '5c3a2a',
    'discipulado': '1a4a2a',
    'teologia-covenant': '2a5c3a',
    'interpretacao-biblica': '3a1a4a',
    'teologia-moral': '4a3a1a',
    'ministerio-cristao': '1a5c2a',
    'oracao-vida-espiritual': '2a1a3a',
    'teologia-pratica': '5c4a2a',
    'missiologia': '3a4a1a',
    'teologia-libertacao': '4a1a2a',
    'teologia-metodista': '2a4a5c',
};

const DEFAULT_COLOR = '1a3a5c';

// Download helper
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BibliotecaCovers/1.0)'
            },
            timeout: 15000
        }, (response) => {
            // Follow redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlink(destPath, () => {});
                downloadFile(response.headers.location, destPath).then(resolve, reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {});
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                const stats = fs.statSync(destPath);
                if (stats.size < 1000) {
                    fs.unlink(destPath, () => {});
                    reject(new Error('File too small: ' + stats.size));
                } else {
                    resolve(stats.size);
                }
            });
        }).on('error', (err) => {
            file.close();
            fs.unlink(destPath, () => {});
            reject(err);
        }).on('timeout', function() {
            file.close();
            fs.unlink(destPath, () => {});
            this.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function downloadWithRetry(url, destPath, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await downloadFile(url, destPath);
        } catch (err) {
            if (attempt === retries) throw err;
            console.log(`   ↺ Retry ${attempt + 1}/${retries}: ${err.message.slice(0, 60)}`);
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
    }
}

async function main() {
    const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const books = raw.results || raw.books || raw;
    
    // Ensure dir exists
    if (!fs.existsSync(COVERS_DIR)) {
        fs.mkdirSync(COVERS_DIR, { recursive: true });
    }
    
    const existing = new Set(fs.readdirSync(COVERS_DIR));
    
    // Find books without cover file
    const missing = books.filter(b => {
        if (!b.cover) return true;
        const fname = b.cover.split('/').pop();
        return !existing.has(fname);
    });
    
    console.log(`📚 Total: ${books.length} livros`);
    console.log(`✅ Capas existentes: ${existing.size}`);
    console.log(`❌ Faltando: ${missing.length}`);
    console.log('');
    
    if (missing.length === 0) {
        console.log('🎉 Todas as capas já estão baixadas!');
        return;
    }
    
    // Separate books with fileId vs without
    const withFileId = missing.filter(b => b.fileId && b.fileId.length > 10);
    const withoutFileId = missing.filter(b => !b.fileId || b.fileId.length <= 10);
    
    console.log(`📎 Com Google Drive ID: ${withFileId.length}`);
    console.log(`❓ Sem ID (placeholder): ${withoutFileId.length}`);
    console.log('');
    
    // Process in batches
    let downloaded = 0;
    let failed = 0;
    let placeholder = 0;
    
    // Batch processor
    async function processBatch(items, fn) {
        const results = [];
        for (let i = 0; i < items.length; i += CONCURRENCY) {
            const batch = items.slice(i, i + CONCURRENCY);
            const batchResults = await Promise.allSettled(
                batch.map(item => fn(item, i + batch.indexOf(item)))
            );
            batchResults.forEach((r, j) => {
                if (r.status === 'fulfilled' && r.value) downloaded++;
                else if (r.status === 'rejected') failed++;
            });
        }
    }
    
    // 1. Download from Google Drive thumbnail API
    if (withFileId.length > 0) {
        console.log('⬇️  Baixando do Google Drive...');
        let idx = 0;
        await processBatch(withFileId, async (book) => {
            idx++;
            const fname = `${book.categorySlug || 'geral'}_${book.fileId}.png`;
            const destPath = path.join(COVERS_DIR, fname);
            const url = `https://drive.google.com/thumbnail?id=${book.fileId}&sz=s400`;
            
            console.log(`   [${idx}/${withFileId.length}] ${book.title?.slice(0, 50)}...`);
            
            try {
                await downloadWithRetry(url, destPath);
                console.log(`   ✅ ${fname}`);
                book.cover = `/covers/${fname}`;
                return true;
            } catch (err) {
                console.log(`   ⚠️  Thumbnail falhou: ${err.message.slice(0, 60)}`);
                // Fallback: try direct download
                try {
                    const directUrl = `https://drive.google.com/uc?export=download&id=${book.fileId}`;
                    await downloadWithRetry(directUrl, destPath);
                    console.log(`   ✅ (direct) ${fname}`);
                    book.cover = `/covers/${fname}`;
                    return true;
                } catch (err2) {
                    console.log(`   ❌ Fallback falhou: ${err2.message.slice(0, 60)}`);
                    return false;
                }
            }
        });
    }
    
    // 2. Create placeholders for books without fileId
    if (withoutFileId.length > 0) {
        console.log(`\n🎨 Criando placeholders para ${withoutFileId.length} livros...`);
        let idx = 0;
        for (const book of withoutFileId) {
            idx++;
            const color = CAT_COLORS[book.categorySlug] || DEFAULT_COLOR;
            const text = encodeURIComponent((book.title || 'Livro').slice(0, 30));
            const fname = `${book.categorySlug}_${book.id || idx}_placeholder.png`;
            const destPath = path.join(COVERS_DIR, fname);
            
            // Use placehold.co with proper size
            const url = `https://placehold.co/300x450/${color}/fff?text=${text}&font=roboto`;
            
            console.log(`   [${idx}/${withoutFileId.length}] ${book.title?.slice(0, 40)}...`);
            
            try {
                await downloadWithRetry(url, destPath);
                book.cover = `/covers/${fname}`;
                placeholder++;
            } catch (err) {
                console.log(`   ❌ Placeholder falhou: ${err.message.slice(0, 60)}`);
            }
        }
    }
    
    // 3. Re-check remaining (books with fileId that failed thumbnails)
    const remaining = missing.filter(b => {
        if (!b.cover) return true;
        const fname = b.cover.split('/').pop();
        return !fs.readdirSync(COVERS_DIR).includes(fname);
    });
    
    if (remaining.length > 0) {
        console.log(`\n🎨 Criando placeholders finais para ${remaining.length} livros restantes...`);
        let idx = 0;
        for (const book of remaining) {
            idx++;
            const color = CAT_COLORS[book.categorySlug] || DEFAULT_COLOR;
            const text = encodeURIComponent((book.title || 'Livro').slice(0, 25));
            const fname = `${book.categorySlug}_${book.id || idx}_fallback.png`;
            const destPath = path.join(COVERS_DIR, fname);
            const url = `https://placehold.co/300x450/${color}/fff?text=${text}&font=roboto`;
            
            try {
                await downloadWithRetry(url, destPath);
                book.cover = `/covers/${fname}`;
            } catch (err) {
                console.log(`   ❌ ${err.message.slice(0, 50)}`);
            }
        }
    }
    
    // 4. Update cover path in catalog for books with placehold.co URL
    const placeholdBooks = books.filter(b => 
        b.cover && (b.cover.includes('placehold.co') || b.cover.includes('ff6b35'))
    );
    if (placeholdBooks.length > 0) {
        console.log(`\n🎨 Convertendo ${placeholdBooks.length} placehold.co URLs para arquivos locais...`);
        for (const book of placeholdBooks) {
            const color = CAT_COLORS[book.categorySlug] || DEFAULT_COLOR;
            const text = encodeURIComponent((book.title || 'Livro').slice(0, 25));
            // Extract parts from existing cover URL
            let fname;
            // Try to find a matching file in covers dir by id pattern
            const covers = fs.readdirSync(COVERS_DIR);
            const match = covers.find(c => c.includes(book.id));
            if (match) {
                book.cover = `/covers/${match}`;
                continue;
            }
            fname = `${book.categorySlug || 'geral'}_${book.id || 'unk'}_auto.png`;
            const destPath = path.join(COVERS_DIR, fname);
            const url = `https://placehold.co/300x450/${color}/fff?text=${text}&font=roboto`;
            try {
                await downloadWithRetry(url, destPath);
                book.cover = `/covers/${fname}`;
            } catch (e) {}
        }
    }
    
    // 5. Write updated catalog
    if (raw.results) {
        raw.results = books;
    } else if (raw.books) {
        raw.books = books;
    }
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2), 'utf8');
    
    const finalCount = fs.readdirSync(COVERS_DIR).length;
    console.log(`\n📊 Resultado final:`);
    console.log(`   Capas no diretório: ${finalCount}`);
    console.log(`   Baixadas agora: ${downloaded}`);
    console.log(`   Placeholders criados: ${placeholder}`);
    console.log(`   Falhas: ${failed}`);
    console.log(`   Ainda sem capa: ${books.filter(b => {
        if (!b.cover) return true;
        const fn = b.cover.split('/').pop();
        return !fs.readdirSync(COVERS_DIR).includes(fn);
    }).length}`);
    console.log(`\n✨ Pronto!`);
}

main().catch(console.error);
