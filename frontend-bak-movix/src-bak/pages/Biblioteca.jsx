import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, BookOpen, ChevronRight } from 'lucide-react';
import { categories } from '../data/catalog';
import Footer from '../components/Footer';

const driveLinks = {
  'comentarios-biblicos': 'https://drive.google.com/drive/folders/1Jwcv3k4naRs23ol46_qunOyyB81Fav9a',
  'dicionarios-biblicos': 'https://drive.google.com/drive/folders/13uict-wUmDY6CMb2Kge7VmHZE9YdpHCw',
  'enciclopedias-biblicas': 'https://drive.google.com/drive/folders/1g_mTkYAKXV-QUPkWThGXNpvKKKoCyjLR',
  'biblias-estudo': 'https://drive.google.com/drive/folders/1qMRyTuI4jwg7ffDuhZ5__tfhhIB0mq0u',
  'teologias-sistematicas': 'https://drive.google.com/drive/folders/1Hr_XpQ_jmoWLtMAttBP6S86xdStKPWJw',
  'mundo-biblico': 'https://drive.google.com/drive/folders/13Zey1QXQyns0iGae7upRIDoLXytApNru',
  'escatologia': 'https://drive.google.com/drive/folders/15folNX8V80X8TnhxfoIqOph78BD9Y2n3',
  'pneumatologia': 'https://drive.google.com/drive/folders/1LS8FRqkhszcL17rGqJSY8rqXJQdk6nqX',
  'cristologia': 'https://drive.google.com/drive/folders/199GIuKuOTX9D2t8dmb0CZ-l31Ar2mSKs',
  'angelologia': 'https://drive.google.com/drive/folders/1Quq8SMPQgbjUaUh87boaNrP7ZBYw5PST',
  'eclesiologia': 'https://drive.google.com/drive/folders/16G_TwOl_9Uj4O2-LJqSO6-AvTBEbh3ti',
  'teontologia': 'https://drive.google.com/drive/folders/1kXdNNuIEyDclPVQRRwFef0_aoxhn_P-4',
  'bibliologia': 'https://drive.google.com/drive/folders/1GytCcUArPc6QLmkSqLKRNkxZuqI2PxIu',
  'soteriologia': 'https://drive.google.com/drive/folders/1l8z4oHr_0G5qFffurtZFK_D_39uHOFD1',
  'hamartiologia': 'https://drive.google.com/drive/folders/19nU4t-qV_n2OwianhkVijP9O4ezHUMRJ',
  'exegese': 'https://drive.google.com/drive/folders/1Jb_CwNDjCiFcZksDjMXfuU-JUpwbkboj',
  'historia-judaica': 'https://drive.google.com/drive/folders/1gY9V9kTPNWn-mPoZ2FsduF_LUmVyuqlU',
  'vida-crista': 'https://drive.google.com/drive/folders/103a3E0OWkapm7q28h4jXfMUi8XJS3znI',
  'biografico': 'https://drive.google.com/drive/folders/1b3omNGKc1TNjyXbsWe4okduz4GaO5ZSE',
  'antigo-novo-testamento': 'https://drive.google.com/drive/folders/1tBCAv-dLh_u2jUtloUazgwftEM5Fx4SV',
  'hermeneutica': 'https://drive.google.com/drive/folders/1E0PNFLH4whFmYnhXPENLHvLbJKwcG2qx',
  'paulo-e-seus-escritos': 'https://drive.google.com/drive/folders/17q52cqSKG4qs04J0LSr16u-E48hJ4vi-',
  'apologetica': 'https://drive.google.com/drive/folders/1IaTwzAWotxq6U2-6C8LaENH5AA3WS4jC',
  'historia-da-igreja': 'https://drive.google.com/drive/folders/1gY9V9kTPNWn-mPoZ2FsduF_LUmVyuqlU',
  'estudos-do-apocalipse': 'https://drive.google.com/drive/folders/1pfxyAJtQbpKBRe1ykhE5Iq4pYCJbuJao',
  'homiletica': 'https://drive.google.com/drive/folders/18WsBkXRtz4T05oQ_FLHZxJH03qyF9bkx',
  'cursos-de-teologia': 'https://drive.google.com/drive/folders/1GMGU8YkZnRDMQ2JokRsQ9Q-WK8I9YNhK',
  'epistolas-paulinas': 'https://drive.google.com/drive/folders/1pYZ_9mruVlbLMjtgxqFVdyxmDxYBsB7n',
  'curso-intensivo-at-nt': 'https://drive.google.com/drive/folders/16Dc5xKuc9-O1j9FQLxGU1NAlYGpyNVNL',
  'curiosidades-da-biblia': 'https://drive.google.com/drive/folders/1XDDylOwZlozAG0Ria_Jwy7ubE-P3q0aw',
  'fe-ciencia-cultura': 'https://drive.google.com/drive/folders/10bwBqva1JgERn06jwkyxtL2h8uWX7gKO',
  'ebooks-uncao-do-leao': 'https://drive.google.com/drive/folders/1xWg6_hjopIk0-ht_5ZwQzE3XmZ7RQp4L',
  'mapas-mentais': 'https://drive.google.com/drive/folders/1-2aKmoYi3_RncixKVHZ61ttIL6BAR5yB',
  'escola-biblica-dominical': 'https://drive.google.com/drive/folders/1cF1HDqMzEYQC_Cg9qbXT1NHso2N-4Uwp'
};

export default function Biblioteca() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filtered = useMemo(() => {
    let result = categories;
    if (selectedCat !== 'all') {
      result = result.filter(c => c.id === selectedCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.books.some(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedCat]);

  const allBooks = useMemo(() => {
    const books = [];
    categories.forEach(cat => {
      cat.books.forEach(book => {
        books.push({ ...book, categoryId: cat.id, categoryTitle: cat.title, categoryColor: cat.color });
      });
    });
    return books;
  }, []);

  return (
    <>
      <main className="main-content">
        <div className="biblioteca-header">
          <h1>Biblioteca Teológica</h1>
          <p>Todas as {categories.length} categorias disponíveis para estudo</p>
        </div>

        <div className="biblioteca-controls">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por título, autor ou categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="category-filter"
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="categories-grid">
          {filtered.map(cat => (
            <div key={cat.id} className="category-card">
              <div className="card-header" style={{ backgroundColor: cat.color }}>
                <BookOpen size={32} />
              </div>
              <div className="card-body">
                <h3>{cat.title}</h3>
                <p>{cat.description}</p>
                <span className="book-count">{cat.books.length} livros</span>
              </div>
              <div className="card-footer">
                <a
                  href={driveLinks[cat.id] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sm btn-primary"
                >
                  <ExternalLink size={14} /> Acessar PDFs
                </a>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>Nenhum resultado encontrado</h3>
            <p>Tente outros termos de busca</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
