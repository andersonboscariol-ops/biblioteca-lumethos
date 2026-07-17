const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load books data if available
let booksCatalog = { categories: [], books: [] };
try {
  const dataPath = path.join(__dirname, '../data/catalog-books.json');
  if (fs.existsSync(dataPath)) {
    booksCatalog = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
} catch (e) {
  console.error('Erro ao carregar catálogo:', e.message);
}

// Load drive links
let driveLinks = {};
try {
  driveLinks = require('./drive-links.json');
} catch (e) {}

// Colored placeholder covers
function getCover(title, color) {
  return `https://placehold.co/300x450/${color.replace('#', '')}/FFFFFF?text=${encodeURIComponent(title.substring(0, 25))}`;
}

// GET /api/catalog - semelhante ao /movie/popular do TMDb
// Retorna lista paginada de livros
router.get('/', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pg = parseInt(page);
  const lim = parseInt(limit);
  
  const books = booksCatalog.books || [];
  const start = (pg - 1) * lim;
  const end = start + lim;
  const paginated = books.slice(start, end);
  
  res.json({
    results: paginated.map(b => ({
      id: b.id,
      title: b.title,
      category: b.category,
      categorySlug: b.categorySlug,
      description: b.description,
      poster_path: b.cover || getCover(b.title, '#2d2d44'),
      cover: b.cover || '',
      fileId: b.fileId || '',
      author: b.author || '',
      year: b.year || '',
      rating: b.rating || '4.0',
      vote_average: parseFloat(b.rating || '4.0'),
      media_type: 'book',
      genre_ids: [b.categorySlug],
    })),
    total_pages: Math.ceil(books.length / lim),
    total_results: books.length,
    page: pg
  });
});

// GET /api/catalog/categories - lista de categorias (gêneros)
router.get('/categories', (req, res) => {
  const cats = booksCatalog.categories || [];
  
  res.json({
    genres: cats.map((c, i) => ({
      id: c.id,
      name: c.title,
      color: c.color || '#2d2d44',
      bookCount: c.bookCount || 0,
    }))
  });
});

// GET /api/catalog/category/:slug - livros de uma categoria
router.get('/category/:slug', (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const pg = parseInt(page);
  const lim = parseInt(limit);
  
  const filtered = (booksCatalog.books || []).filter(b => b.categorySlug === slug);
  const start = (pg - 1) * lim;
  const end = start + lim;
  const paginated = filtered.slice(start, end);
  
  const category = (booksCatalog.categories || []).find(c => c.id === slug);
  
  res.json({
    results: paginated.map(b => ({
      id: b.id,
      title: b.title,
      category: b.category,
      description: b.description,
      poster_path: b.cover || getCover(b.title, category?.color || '#2d2d44'),
      vote_average: parseFloat(b.rating || '4.0'),
      media_type: 'book',
      genre_ids: [slug],
    })),
    total_pages: Math.ceil(filtered.length / lim) || 1,
    total_results: filtered.length,
    page: pg,
    category: category || { id: slug, title: slug, color: '#2d2d44' }
  });
});

// GET /api/catalog/search - busca textual de livros
router.get('/search', (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ results: [], total_results: 0, total_pages: 0, page: 1 });
  }
  
  const query = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const allBooks = booksCatalog.books || [];
  
  const filtered = allBooks.filter(b => {
    const title = (b.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cat = (b.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const desc = (b.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return title.includes(query) || cat.includes(query) || desc.includes(query);
  });
  
  const pg = parseInt(page);
  const lim = parseInt(limit);
  const start = (pg - 1) * lim;
  const end = start + lim;
  const paginated = filtered.slice(start, end);
  
  res.json({
    results: paginated.map(b => {
      const catInfo = (booksCatalog.categories || []).find(c => c.id === b.categorySlug);
      return {
        id: b.id,
        title: b.title,
        category: b.category,
        description: b.description,
        poster_path: b.cover || getCover(b.title, catInfo?.color || '#2d2d44'),
        vote_average: parseFloat(b.rating || '4.0'),
        media_type: 'book',
        genre_ids: [b.categorySlug],
      };
    }),
    total_results: filtered.length,
    total_pages: Math.ceil(filtered.length / lim) || 1,
    page: pg
  });
});

// GET /api/catalog/drive/:slug - link do Google Drive do módulo
router.get('/drive/:slug', (req, res) => {
  const { slug } = req.params;
  const category = (booksCatalog.categories || []).find(c => c.id === slug);
  const driveLink = driveLinks[slug] || null;
  
  if (!category && !driveLink) {
    return res.status(404).json({ error: 'Módulo não encontrado' });
  }
  
  res.json({
    ...category,
    title: category?.title || slug,
    driveLink,
    books: (booksCatalog.books || []).filter(b => b.categorySlug === slug).length
  });
});

// Legacy: GET /api/catalog/:id - detalhes de uma categoria (compatibilidade)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if it's a category slug
  const cat = (booksCatalog.categories || []).find(c => c.id === id);
  if (cat) {
    const books = (booksCatalog.books || []).filter(b => b.categorySlug === id);
    return res.json({
      ...cat,
      driveLink: driveLinks[id] || null,
      cover: getCover(cat.title, cat.color),
      books: books.map(b => ({
        id: b.id,
        title: b.title,
        poster: b.cover || getCover(b.title, cat.color),
      }))
    });
  }
  
  // Check if it's a book id
  const book = (booksCatalog.books || []).find(b => b.id === id);
  if (book) {
    const cat2 = (booksCatalog.categories || []).find(c => c.id === book.categorySlug);
    return res.json({
      ...book,
      poster_path: book.cover || getCover(book.title, cat2?.color || '#2d2d44'),
      driveLink: driveLinks[book.categorySlug] || null,
    });
  }
  
  res.status(404).json({ error: 'Item não encontrado' });
});

module.exports = router;
