import { Link } from 'react-router-dom';

export default function CardLivro({ book, categoryId, categoryColor }) {
  const coverBg = categoryColor || '#142D4C';
  const initials = book.title.substring(0, 2).toUpperCase();

  return (
    <Link to={`/livro/${categoryId}/${book.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="book-card">
      <div className="book-cover" style={{ backgroundColor: coverBg }}>
        <span className="book-initials">{initials}</span>
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          <span className="book-year">{book.year}</span>
          <span className="book-pages">{book.pages} págs</span>
        </div>
      </div>
    </Link>
  );
}
