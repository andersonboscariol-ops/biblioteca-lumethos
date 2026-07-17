import { ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategoriaSection({ category, index }) {
  const getDriveLink = (id) => {
    const links = {
      'comentarios-biblicos': 'https://drive.google.com/drive/folders/1Jwcv3k4naRs23ol46_qunOyyB81Fav9a',
      'dicionarios-biblicos': 'https://drive.google.com/drive/folders/13uict-wUmDY6CMb2Kge7VmHZE9YdpHCw',
      'enciclopedias-biblicas': 'https://drive.google.com/drive/folders/1g_mTkYAKXV-QUPkWThGXNpvKKKoCyjLR',
      'biblias-estudo': 'https://drive.google.com/drive/folders/1qMRyTuI4jwg7ffDuhZ5__tfhhIB0mq0u',
      'teologias-sistematicas': 'https://drive.google.com/drive/folders/1Hr_XpQ_jmoWLtMAttBP6S86xdStKPWJw',
      'mundo-biblico': 'https://drive.google.com/drive/folders/13Zey1QXQyns0iGae7upRIDoLXytApNru',
    };
    return links[id] || null;
  };

  const driveLink = getDriveLink(category.id);

  return (
    <section className="category-section">
      <div className="category-header">
        <div className="category-title-wrap">
          <span className="category-number">0{index + 1}</span>
          <h2 className="category-title">{category.title}</h2>
        </div>
        <p className="category-desc">{category.description}</p>
        <div className="category-links">
          <Link to={`/livro/${category.id}`} className="category-link">
            Ver detalhes <ChevronRight size={16} />
          </Link>
          {driveLink && (
            <a href={driveLink} target="_blank" rel="noopener noreferrer" className="category-link drive">
              <ExternalLink size={14} /> Acessar PDFs
            </a>
          )}
        </div>
      </div>
      <div className="books-row">
        {category.books.map((book, i) => (
          <div key={i} className="book-mini-card">
            <div className="mini-cover" style={{ backgroundColor: category.color }}>
              <span className="mini-initials">{book.title.substring(0, 2)}</span>
            </div>
            <div className="mini-info">
              <h4 className="mini-title">{book.title}</h4>
              <p className="mini-author">{book.author}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
