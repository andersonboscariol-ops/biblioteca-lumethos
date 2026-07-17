import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, ChevronLeft, ChevronRight, Play,
  Info, Plus, Volume2, VolumeX, BookOpen, Clock,
  Star, User, Settings, LogOut, Menu, X
} from 'lucide-react';

// Categories from the backend API
const API = '';

function App() {
  const [categories, setCategories] = useState([]);
  const [heroBook, setHeroBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [muted, setMuted] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/catalog`)
      .then(r => r.json())
      .then(data => {
        const cats = data.categories || [];
        setCategories(cats);
        // Pick a random category for the hero
        const nonEmpty = cats.filter(c => c.bookCount > 0);
        if (nonEmpty.length > 0) {
          const randomCat = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
          setHeroBook({
            title: randomCat.title,
            description: randomCat.description,
            image: randomCat.cover,
            categoryId: randomCat.id,
            bookCount: randomCat.bookCount
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const results = [];
      categories.forEach(cat => {
        if (cat.title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q)) {
          results.push({ ...cat, type: 'category' });
        }
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, categories]);

  const scrollCategory = (id, dir) => {
    const el = document.getElementById(`scroll-${id}`);
    if (el) el.scrollLeft += dir * 600;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#141414' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lumethos border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-netflix-muted text-sm">Carregando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      {/* Header / Nav */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-netflix-black' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center justify-between px-12 py-0 h-16">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 no-underline">
              <BookOpen size={28} className="text-lumethos" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-lumethos">Mov</span><span className="text-white">Flix</span>
              </span>
            </a>
            {/* Nav */}
            <nav className="hidden md:flex items-center gap-5">
              <a href="/" className="text-sm font-medium text-white no-underline">Início</a>
              <a href="#biblioteca" className="text-sm font-medium text-netflix-muted hover:text-white no-underline transition-colors">Biblioteca</a>
              <a href="#categorias" className="text-sm font-medium text-netflix-muted hover:text-white no-underline transition-colors">Categorias</a>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-5">
            {/* Search */}
            <div className="relative">
              <button onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }} className="text-white/70 hover:text-white transition-colors">
                <Search size={20} />
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-8 w-80">
                  <input
                    type="text"
                    placeholder="Títulos, autores, categorias..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-2.5 bg-netflix-black border border-white/20 rounded text-sm text-white placeholder-netflix-muted outline-none focus:border-white/40"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-netflix-black border border-white/10 rounded max-h-60 overflow-y-auto">
                      {searchResults.map((r, i) => (
                        <a
                          key={i}
                          href={`#cat-${r.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 no-underline transition-colors"
                        >
                          <img src={r.cover} alt="" className="w-10 h-14 rounded object-cover" />
                          <div>
                            <p className="text-sm text-white font-medium">{r.title}</p>
                            <p className="text-xs text-netflix-muted">{r.bookCount} livros</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="text-white/70 hover:text-white transition-colors hidden sm:block">
              <Bell size={20} />
            </button>

            {/* Profile */}
            <div className="relative group">
              <button className="w-8 h-8 rounded bg-lumethos/20 flex items-center justify-center text-lumethos text-xs font-bold">
                A
              </button>
              <div className="absolute right-0 top-10 w-48 bg-netflix-black border border-white/10 rounded py-2 hidden group-hover:block">
                <a href="/admin/" className="flex items-center gap-2 px-4 py-2 text-sm text-netflix-muted hover:text-white hover:bg-white/5 no-underline">
                  <User size={16} /> Admin
                </a>
                <hr className="border-white/10 my-1" />
                <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-netflix-muted hover:text-white hover:bg-white/5 no-underline">
                  <LogOut size={16} /> Sair
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {heroBook && (
        <section className="relative h-[70vh] min-h-[500px]">
          <div className="absolute inset-0">
            <img
              src={heroBook.image}
              alt={heroBook.title}
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.7)' }}
            />
            <div className="hero-gradient" />
            <div className="hero-vignette" />
          </div>

          <div className="absolute bottom-32 left-12 max-w-xl z-10">
            <p className="text-xs text-lumethos uppercase tracking-[.2em] font-semibold mb-3">Instituto Lumethos</p>
            <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">{heroBook.title}</h1>
            <p className="text-sm text-netflix-light/80 mb-6 leading-relaxed line-clamp-3">{heroBook.description}</p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-semibold text-sm hover:bg-white/90 transition-colors">
                <Play size={18} fill="black" /> Explorar
              </button>
              <button className="flex items-center gap-2 bg-white/10 text-white px-6 py-2.5 rounded font-semibold text-sm hover:bg-white/20 transition-colors border border-white/10">
                <Info size={18} /> Mais info
              </button>
            </div>
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="absolute bottom-32 right-12 w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white/70 hover:border-white/60 hover:text-white transition-all"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </section>
      )}

      {/* Categories / Book Rows */}
      <main className="pb-20 -mt-16 relative z-10">
        {categories.map((cat, idx) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="category-section relative mb-6">
            <div className="flex items-center justify-between px-12 mb-2">
              <h2 className="text-lg font-semibold text-white">
                {cat.title}
                <span className="text-netflix-muted text-sm font-normal ml-2">({cat.bookCount})</span>
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollCategory(cat.id, -1)}
                className="scroll-arrow left"
              >
                <ChevronLeft size={24} />
              </button>

              <div id={`scroll-${cat.id}`} className="category-scroll">
                {Array.from({ length: cat.bookCount || 3 }).map((_, i) => (
                  <div key={i} className="book-card">
                    <img
                      src={cat.cover?.replace(/\?text=.*/, `?text=Livro%20${i + 1}&bg=${encodeURIComponent(cat.color || '#2d2d44')}`)}
                      alt=""
                      className="book-card-img"
                      loading="lazy"
                    />
                    <div className="book-card-info">
                      <p className="text-xs font-bold text-white mb-1 truncate">{cat.title} — Vol. {i + 1}</p>
                      <p className="text-[10px] text-netflix-muted mb-2 line-clamp-2">PDF interativo • Teologia • Instituto Lumethos</p>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 bg-white text-black px-2.5 py-1 rounded text-[10px] font-semibold">
                          <Play size={10} fill="black" /> Ler
                        </button>
                        <button className="text-white/60 hover:text-white">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollCategory(cat.id, 1)}
                className="scroll-arrow right"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="px-12 py-8 border-t border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-netflix-muted">
            <BookOpen size={16} className="text-lumethos" />
            <span className="text-xs">MovFlix © 2026 — Instituto Lumethos</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-netflix-muted">
            <a href="#" className="hover:text-white no-underline transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white no-underline transition-colors">Termos</a>
            <a href="https://institutolumethos.online" className="hover:text-white no-underline transition-colors">Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
