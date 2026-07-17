import { motion } from 'framer-motion'
import { Search, Star, BookOpen, Heart } from 'lucide-react'
import { useState } from 'react'

export function BookGrid({ books, title = 'Biblioteca' }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('title')

  const filtered = (books || []).filter(b => {
    const q = search.toLowerCase()
    return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title)
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0)
    return 0
  })

  if (!books?.length) {
    return (
      <section className="card p-8 text-center">
        <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
        <p className="text-sm text-text-tertiary">Nenhum livro disponível</p>
      </section>
    )
  }

  return (
    <section className="card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-heading font-bold text-text-primary flex items-center gap-2">
          <span className="accent-bar" />
          {title}
          <span className="text-xs text-text-tertiary font-body font-normal ml-0.5">({sorted.length})</span>
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filtrar..."
              className="input-dark w-full h-8 pl-9 pr-3 text-xs" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="input-dark h-8 px-2.5 text-xs cursor-pointer">
            <option value="title">Nome</option>
            <option value="rating">Nota</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        {sorted.map((book, i) => (
          <motion.a
            key={book.id}
            href={`/livro/${book.id}`}
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.015 }}
            className="group overflow-hidden rounded-lg bg-bg-card border border-border card-elevated"
          >
            <div className="aspect-[2/3] relative overflow-hidden bg-bg-elevated">
              <img src={book.cover} alt={book.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 smooth" />
              {book.progress > 0 && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-gold-400 text-[9px] font-bold text-white shadow-sm">{book.progress}%</div>
              )}
              {book.favorite && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-md bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-3 h-3 text-red-400 fill-current" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 smooth">
                <button className="w-full text-[10px] font-medium py-1.5 rounded-md bg-gold-400 text-white hover:bg-gold-500 smooth shadow-lg">
                  <BookOpen className="w-3 h-3 inline mr-1" />Ler
                </button>
              </div>
            </div>
            <div className="p-2.5">
              <h3 className="text-xs font-medium text-text-primary truncate leading-tight group-hover:text-gold-300 smooth">{book.title}</h3>
              <p className="text-[10px] text-text-tertiary truncate mt-0.5">{book.author}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded">{book.category}</span>
                {book.rating && (
                  <span className="flex items-center gap-0.5 text-[9px] text-gold-400">
                    <Star className="w-2.5 h-2.5 fill-current" />{book.rating}
                  </span>
                )}
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-10">
          <Search className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-xs text-text-tertiary">Nenhum resultado para "{search}"</p>
        </div>
      )}
    </section>
  )
}
