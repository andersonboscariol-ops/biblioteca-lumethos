const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, '../data/stats.json');

function loadStats() {
  try {
    if (fs.existsSync(STATS_PATH)) {
      return JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Erro ao carregar stats:', e.message);
  }
  return { views: {}, downloads: {} };
}

function saveStats(stats) {
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2), 'utf8');
}

// Registrar visualização
router.post('/view/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (!fileId) return res.status(400).json({ error: 'fileId obrigatório' });
  
  const stats = loadStats();
  stats.views[fileId] = (stats.views[fileId] || 0) + 1;
  saveStats(stats);
  
  res.json({ ok: true, count: stats.views[fileId] });
});

// Registrar download
router.post('/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (!fileId) return res.status(400).json({ error: 'fileId obrigatório' });
  
  const stats = loadStats();
  stats.downloads[fileId] = (stats.downloads[fileId] || 0) + 1;
  saveStats(stats);
  
  res.json({ ok: true, count: stats.downloads[fileId] });
});

// Buscar livros mais populares
router.get('/populares', (req, res) => {
  const { limit = 10 } = req.query;
  const stats = loadStats();
  
  // Load catalog for titles
  let catalog = { books: [] };
  try {
    const catPath = path.join(__dirname, '../data/catalog-books.json');
    if (fs.existsSync(catPath)) {
      catalog = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    }
  } catch (e) {}
  
  // Merge views + downloads into a popularity score
  const bookMap = {};
  for (const b of catalog.books || []) {
    const fid = b.fileId || '';
    const views = stats.views[fid] || 0;
    const downloads = stats.downloads[fid] || 0;
    if (views > 0 || downloads > 0) {
      bookMap[fid] = {
        fileId: fid,
        title: b.title,
        author: b.author || '',
        cover: b.cover || '',
        category: b.category || '',
        views,
        downloads,
        score: views + downloads * 3
      };
    }
  }
  
  // Sort by score desc
  const sorted = Object.values(bookMap).sort((a, b) => b.score - a.score);
  
  res.json({
    results: sorted.slice(0, parseInt(limit)),
    total: sorted.length
  });
});

// Stats gerais (dashboard)
router.get('/dashboard', (req, res) => {
  const stats = loadStats();
  
  let catalog = { books: [], categories: [] };
  try {
    const catPath = path.join(__dirname, '../data/catalog-books.json');
    if (fs.existsSync(catPath)) {
      catalog = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    }
  } catch (e) {}
  
  const totalViews = Object.values(stats.views).reduce((a, b) => a + b, 0);
  const totalDownloads = Object.values(stats.downloads).reduce((a, b) => a + b, 0);
  
  res.json({
    totalBooks: (catalog.books || []).length,
    totalCategories: (catalog.categories || []).length,
    totalViews,
    totalDownloads,
    uniqueViewedBooks: Object.keys(stats.views).length,
    uniqueDownloadedBooks: Object.keys(stats.downloads).length
  });
});

module.exports = router;
