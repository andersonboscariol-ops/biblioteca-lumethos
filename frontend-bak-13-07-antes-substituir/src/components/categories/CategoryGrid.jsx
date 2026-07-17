import { motion } from 'framer-motion'
import { BookOpen, BookText, BookA, MessageSquare, BookMarked, Puzzle, Languages } from 'lucide-react'
import { categories } from '../../data/catalog'
import { useState } from 'react'

const iconMap = {
  'BookOpen': BookOpen, 'BookText': BookText, 'BookA': BookA,
  'MessageSquare': MessageSquare, 'BookMarked': BookMarked, 'Puzzle': Puzzle,
  'Languages': Languages,
}

export default function CategoryGrid() {
  const [showAll, setShowAll] = useState(false)
  const items = showAll ? categories : categories.slice(0, 12)

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-heading font-bold text-text-primary">Categorias</h2>
        {categories.length > 12 && (
          <button onClick={() => setShowAll(!showAll)}
            className="text-xs text-text-tertiary hover:text-gold-300 smooth font-medium">
            {showAll ? 'Menos' : `+ ${categories.length - 12}`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((cat, i) => {
          const Icon = iconMap[cat.icon] || BookOpen
          return (
            <motion.a
              key={cat.id}
              href={cat.path || `/categoria/${cat.slug}`}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.012 }}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-bg-card border border-border hover:border-border-gold hover:bg-gold-400/5 smooth cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-gold-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{cat.name}</p>
                <p className="text-[9px] text-text-tertiary">{cat.bookCount}</p>
              </div>
            </motion.a>
          )
        })}
      </div>
    </section>
  )
}
