import { Link } from 'react-router-dom';
import { BookOpen, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/biblioteca?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <BookOpen size={28} color="#C79A2E" />
          <span className="logo-text">Lumethos <span className="logo-accent">Biblioteca</span></span>
        </Link>

        <nav className="nav-desktop">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/biblioteca" className="nav-link">Biblioteca</Link>
          <a href="https://institutolumethos.online" className="nav-link" target="_blank" rel="noopener">Portal</a>
        </nav>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Buscar livros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <Search size={18} />
          </button>
        </form>

        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setMenuOpen(false)}>Início</Link>
          <Link to="/biblioteca" className="mobile-link" onClick={() => setMenuOpen(false)}>Biblioteca</Link>
          <a href="https://institutolumethos.online" className="mobile-link" onClick={() => setMenuOpen(false)}>Portal</a>
        </div>
      )}
    </header>
  );
}
