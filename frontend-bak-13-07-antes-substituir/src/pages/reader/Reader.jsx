import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Sun, Moon, ZoomIn, ZoomOut, Bookmark, FileText } from 'lucide-react'
import { books } from '../../data/catalog'

const themes = {
  sepia: { bg: '#1A1520', surface: '#241D2E', text: '#D4C9B8', accent: '#C79A2E', border: 'rgba(255,255,255,0.06)', card: '#1E1728' },
  dark: { bg: '#0B1324', surface: '#111D35', text: '#9BAEC8', accent: '#C79A2E', border: 'rgba(255,255,255,0.06)', card: '#162240' },
  light: { bg: '#F8F4EC', surface: '#FFFFFF', text: '#3D2E1E', accent: '#C79A2E', border: '#E8E0D0', card: '#FFFFFF' },
}

export default function Reader() {
  const { bookId } = useParams()
  const book = books.find(b => b.id === bookId)
  const [theme, setTheme] = useState('sepia')
  const [fontSize, setFontSize] = useState(18)
  const [showSidebar, setShowSidebar] = useState(true)

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-bg">
        <p className="text-text-tertiary text-sm">Livro não encontrado</p>
        <Link to="/" className="text-xs text-gold-400">← Voltar</Link>
      </div>
    )
  }

  const t = themes[theme]

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.bg, color: t.text }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: t.surface, borderColor: t.border }}>
        <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
          <Link to={`/livro/${book.id}`} className="flex items-center gap-1.5 text-xs smooth" style={{ color: t.accent }}>
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>

          <span className="text-xs font-medium px-2" style={{ color: t.text, opacity: 0.5 }}>{book.title}</span>

          <div className="flex items-center gap-1">
            <button onClick={() => setTheme('sepia')} className="w-7 h-7 rounded-lg flex items-center justify-center smooth" style={{ color: theme === 'sepia' ? t.accent : t.text, opacity: theme === 'sepia' ? 1 : 0.4 }} title="Sépia">
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setTheme('dark')} className="w-7 h-7 rounded-lg flex items-center justify-center smooth" style={{ color: theme === 'dark' ? t.accent : t.text, opacity: theme === 'dark' ? 1 : 0.4 }} title="Escuro">
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setTheme('light')} className="w-7 h-7 rounded-lg flex items-center justify-center smooth" style={{ color: theme === 'light' ? t.accent : t.text, opacity: theme === 'light' ? 1 : 0.4 }} title="Claro">
              <Sun className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 mx-1" style={{ backgroundColor: t.border }} />

            <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="w-7 h-7 rounded-lg flex items-center justify-center smooth" style={{ color: t.text, opacity: 0.6 }}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono w-6 text-center" style={{ color: t.text }}>{fontSize}</span>
            <button onClick={() => setFontSize(f => Math.min(32, f + 2))} className="w-7 h-7 rounded-lg flex items-center justify-center smooth" style={{ color: t.text, opacity: 0.6 }}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 mx-1" style={{ backgroundColor: t.border }} />

            <button className="w-7 h-7 rounded-lg flex items-center justify-center smooth" style={{ color: t.accent }}>
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex max-w-5xl mx-auto">
        {/* Sidebar de sumário */}
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            className="hidden lg:block shrink-0 border-r overflow-hidden"
            style={{ borderColor: t.border }}
          >
            <div className="p-4">
              <h3 className="text-xs font-semibold mb-3" style={{ color: t.accent }}>Sumário</h3>
              <div className="space-y-0.5">
                {['Prefácio', 'Introdução', 'Capítulo 1', 'Capítulo 2', 'Capítulo 3', 'Capítulo 4', 'Capítulo 5', 'Conclusão', 'Apêndice'].map((item, i) => (
                  <button key={i}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs smooth"
                    style={{ color: t.text, opacity: 0.7 }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = t.border}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        )}

        {/* Reader */}
        <div className="flex-1 max-w-3xl mx-auto py-8 px-4 md:px-12">
          <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
            <h1 className="text-2xl font-heading font-bold mb-4" style={{ color: t.accent }}>{book.title}</h1>
            <p className="mb-6" style={{ color: t.text, opacity: 0.4, fontSize: '0.85em' }}>{book.author}</p>

            <p className="mb-4 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p className="mb-4 leading-relaxed">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p className="mb-4 leading-relaxed">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
          </div>

          <div className="mt-12 pt-6 border-t" style={{ borderColor: t.border }}>
            <div className="flex items-center justify-between text-xs" style={{ color: t.text, opacity: 0.4 }}>
              <span>Progresso: 12%</span>
              <span>Página 24 de ~200</span>
            </div>
            <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: t.border }}>
              <div className="h-full rounded-full" style={{ width: '12%', backgroundColor: t.accent }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
