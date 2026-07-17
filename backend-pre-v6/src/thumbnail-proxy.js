const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Thumbnail proxy for Google Drive files
// Since direct thumbnail URLs require auth, we proxy through
// Google's viewer which can render PDF pages as images

// Cache in memory (simple)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// GET /api/thumbnail/:fileId?sz=s400
router.get('/:fileId', (req, res) => {
  const { fileId } = req.params;
  const sz = req.query.sz || 's400';
  
  // Check cache
  const cached = cache.get(fileId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.set('Content-Type', cached.type);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(cached.data);
  }
  
  // Try multiple Google thumbnail sources
  const urls = [
    `https://drive.google.com/thumbnail?id=${fileId}`,
    `https://docs.google.com/uc?id=${fileId}&export=view`,
    `https://lh3.googleusercontent.com/d/${fileId}=${sz}`,
  ];
  
  tryNext(0);
  
  function tryNext(idx) {
    if (idx >= urls.length) {
      // Fallback: return placeholder
      const color = req.query.color || '2d2d44';
      const text = req.query.text || 'Livro';
      res.redirect(302, `https://placehold.co/300x450/${color}/FFFFFF?text=${encodeURIComponent(text)}`);
      return;
    }
    
    const url = new URL(urls[idx]);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    };
    
    const proxyReq = client.request(options, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || '';
      
      // If redirect or error, try next
      if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302 || 
          proxyRes.statusCode === 404 || proxyRes.statusCode === 403) {
        return tryNext(idx + 1);
      }
      
      if (contentType.startsWith('image/')) {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Cache
          cache.set(fileId, { data: buffer, type: contentType, ts: Date.now() });
          
          res.set('Content-Type', contentType);
          res.set('Cache-Control', 'public, max-age=86400');
          res.send(buffer);
        });
      } else if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        // Not an image response, consume and try next
        proxyRes.resume();
        tryNext(idx + 1);
      } else {
        proxyRes.resume();
        tryNext(idx + 1);
      }
    });
    
    proxyReq.on('error', () => tryNext(idx + 1));
    proxyReq.on('timeout', () => { proxyReq.destroy(); tryNext(idx + 1); });
    proxyReq.end();
  }
});

module.exports = router;
