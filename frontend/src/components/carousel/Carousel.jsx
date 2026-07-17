import { motion } from 'framer-motion'
import { Star, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import BookCover from '../bookcover/BookCover'

function useScrollState(ref) {
  const [left, setLeft] = useState(false)
  const [right, setRight] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      setLeft(el.scrollLeft > 8)
      setRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
    }
    el.addEventListener('scroll', check, { passive: true })
    check()
    return () => el.removeEventListener('scroll', check)
  }, [ref])
  return { left, right }
}

function BookCard({ book }) {
  return (
    <motion.a
      href={`/livro/${book.id}`}
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group shrink-0 w-[135px]"
    >
      <div className="overflow-hidden rounded-xl bg-bg-card border border-border card-elevated">
        <div className="aspect-[2/3] relative overflow-hidden bg-bg-elevated">
          <BookCover src={book.cover} title={book.title} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 smooth" />
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 smooth">
            <span className="block w-full text-[9px] font-medium py-1.5 rounded-lg bg-gold-400 text-white text-center smooth shadow-lg">
              <BookOpen className="w-3 h-3 inline mr-1" />Ler
            </span>
          </div>
        </div>
        <div className="p-2.5">
          <h3 className="text-xs font-medium text-text-primary truncate group-hover:text-gold-300 smooth">{book.title}</h3>
          {book.rating && (
            <span className="flex items-center gap-0.5 text-[9px] text-gold-400 mt-1">
              <Star className="w-2.5 h-2.5 fill-current" />{book.rating}
            </span>
          )}
        </div>
      </div>
    </motion.a>
  )
}

export default function BookCarousel({ title, books }) {
  const ref = useRef(null)
  const { left, right } = useScrollState(ref)
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 250, behavior: 'smooth' })

  if (!books?.length) return null

  return (
    <section className="card p-5 relative">
      <div className="flex items-center gap-2 mb-4">
        <span className="accent-bar" />
        <h2 className="text-sm font-heading font-bold text-text-primary">{title}</h2>
      </div>

      <div className="relative">
        {left && (
          <button onClick={() => scroll(-1)}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-bg-card border border-border-strong shadow-elevated flex items-center justify-center text-text-secondary hover:text-gold-300 hover:border-border-gold smooth">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div ref={ref} className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar scroll-smooth">
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
        {right && (
          <button onClick={() => scroll(1)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-bg-card border border-border-strong shadow-elevated flex items-center justify-center text-text-secondary hover:text-gold-300 hover:border-border-gold smooth">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  )
}

export function ContinueStudying({ books }) {
  const items = (books || []).filter(b => b.progress > 0).slice(0, 4)
  if (!items.length) return null

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="accent-bar" />
        <h2 className="text-sm font-heading font-bold text-text-primary">Continuar Lendo</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((book, i) => (
          <motion.a
            key={book.id}
            href={`/livro/${book.id}`}
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-card border border-border hover:border-border-gold hover:bg-gold-400/5 smooth group"
          >
            <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 border border-border">
              <BookCover src={book.cover} title={book.title} className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-text-primary truncate group-hover:text-gold-300 smooth">{book.title}</h3>
              <div className="mt-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-gold-400 font-medium">{book.progress}%</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-gold-400 smooth" style={{ width: `${book.progress}%` }} />
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
