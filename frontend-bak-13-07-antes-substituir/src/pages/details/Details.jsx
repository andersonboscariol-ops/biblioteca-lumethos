import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Download, Heart, Share2, Star, ChevronLeft, Clock, Globe, BookMarked } from 'lucide-react'
import { books } from '../../data/catalog'
import BookCover from '../../components/bookcover/BookCover'
import BookCarousel from '../../components/carousel/Carousel'

export default function Details() {
  const { bookId } = useParams()
  const book = books.find(b => b.id === bookId)

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <BookOpen className="w-10 h-10 text-text-tertiary" />
        <p className="text-text-tertiary text-sm">Livro não encontrado</p>
        <Link to="/" className="text-xs text-gold-400 hover:text-gold-300 smooth">← Voltar</Link>
      </div>
    )
  }

  const related = books.filter(b => b.categorySlug === book.categorySlug && b.id !== book.id).slice(0, 10)

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-gold-400 smooth">
        <ChevronLeft className="w-3.5 h-3.5" /> Voltar
      </Link>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="shrink-0">
            <div className="w-40 md:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-bg-elevated border border-border shadow-xl shadow-black/30">
              <BookCover src={book.cover} title={book.title} className="w-full h-full" />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
            <div className="badge mb-3">
              <BookMarked className="w-3 h-3" />
              {book.category}
            </div>

            <h1 className="text-2xl font-heading font-bold text-text-primary mb-1">{book.title}</h1>
            <p className="text-sm text-gold-400 font-medium mb-3">{book.author}</p>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-gold-400 fill-current" />
                <span className="text-sm text-text-primary">{book.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="w-3.5 h-3.5" />{book.year}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-tertiary">
                <Globe className="w-3.5 h-3.5" />{book.language}
              </div>
              <span className="text-xs text-text-tertiary">{book.pages} páginas</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button className="btn-gold flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium">
                <BookOpen className="w-4 h-4" />Ler Agora
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover smooth border border-border-strong">
                <Download className="w-4 h-4" />PDF
              </button>
              <button className="w-9 h-9 rounded-lg bg-bg-elevated border border-border-strong flex items-center justify-center text-text-tertiary hover:text-red-400 hover:border-red-400/30 smooth">
                <Heart className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-bg-elevated border border-border-strong flex items-center justify-center text-text-tertiary hover:text-gold-400 hover:border-gold-400/30 smooth">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {book.progress !== undefined && book.progress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-tertiary">Progresso</span>
                  <span className="text-xs text-gold-400 font-medium">{book.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-gold-400" style={{ width: `${book.progress}%` }} />
                </div>
              </div>
            )}

            <p className="text-xs text-text-secondary leading-relaxed bg-bg-elevated rounded-lg p-3.5 border border-border">
              {book.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Teologia', 'Estudo Bíblico', 'Referência'].map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-bg-elevated border border-border text-[10px] text-text-tertiary">{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {related.length > 0 && (
        <BookCarousel title="Relacionados" books={related} />
      )}
    </div>
  )
}
