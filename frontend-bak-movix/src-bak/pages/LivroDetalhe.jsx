import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, BookOpen } from 'lucide-react';
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
};

export default function LivroDetalhe() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const category = categories.find(c => c.id === categoryId);

  if (!category) {
    return (
      <main className="main-content">
        <div className="empty-state">
          <h2>Categoria não encontrada</h2>
          <Link to="/biblioteca" className="btn-primary">Voltar à Biblioteca</Link>
        </div>
      </main>
    );
  }

  const driveLink = driveLinks[category.id];

  return (
    <>
      <main className="main-content">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} /> Voltar
        </button>

        <div className="category-detail-hero" style={{ borderLeftColor: category.color }}>
          <div className="category-icon" style={{ backgroundColor: category.color }}>
            <BookOpen size={48} />
          </div>
          <div>
            <h1>{category.title}</h1>
            <p className="detail-desc">{category.description}</p>
            <span className="book-count-lg">{category.books.length} livros nesta categoria</span>
          </div>
        </div>

        <div className="books-grid">
          {category.books.map((book, i) => (
            <div key={i} className="book-detail-card">
              <div className="book-detail-cover" style={{ backgroundColor: category.color }}>
                <span className="book-detail-initials">{book.title.substring(0, 2)}</span>
              </div>
              <div className="book-detail-info">
                <h3>{book.title}</h3>
                <p className="book-detail-author">{book.author}</p>
                <div className="book-detail-meta">
                  <span>{book.year}</span>
                  <span>{book.pages} páginas</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {driveLink && (
          <div className="access-section">
            <h3>Acessar Conteúdo Completo</h3>
            <p>Todo o conteúdo desta categoria está disponível no Google Drive.</p>
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-large"
            >
              <ExternalLink size={20} /> Acessar PDFs no Google Drive
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
