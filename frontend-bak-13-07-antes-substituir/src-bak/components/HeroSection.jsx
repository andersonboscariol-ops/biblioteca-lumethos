import { BookOpen, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">📚 Biblioteca Teológica</div>
        <h1 className="hero-title">
          A Maior Biblioteca<br />
          <span className="hero-accent">Teológica do Brasil</span>
        </h1>
        <p className="hero-subtitle">
          Mais de 100.000 PDFs organizados em 36 categorias — comentários, teologia,
          história, exegese e muito mais para sua formação ministerial.
        </p>
        <div className="hero-actions">
          <Link to="/biblioteca" className="btn-primary">
            <BookOpen size={20} />
            Explorar Biblioteca
          </Link>
          <a
            href="https://drive.google.com/drive/folders/1Jwcv3k4naRs23ol46_qunOyyB81Fav9a"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <ExternalLink size={20} />
            Acessar no Google Drive
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">36</span>
            <span className="stat-label">Categorias</span>
          </div>
          <div className="stat">
            <span className="stat-number">100K+</span>
            <span className="stat-label">PDFs</span>
          </div>
          <div className="stat">
            <span className="stat-number">100%</span>
            <span className="stat-label">Gratuito</span>
          </div>
        </div>
      </div>
    </section>
  );
}
