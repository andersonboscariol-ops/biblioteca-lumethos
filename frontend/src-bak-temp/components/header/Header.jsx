import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, ChevronDown, User, Settings, LogOut, BookOpen, Menu } from 'lucide-react'

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showUser, setShowUser] = useState(false)
  const [results, setResults] = useState([])
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowUser(false) }
    const onScroll = () => setScrolled(window.scrollY > 10)
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { document.removeEventListener('mousedown', handler); window.removeEventListener('scroll', onScroll) }
  }, [])

  const onSearch = (val) => {
    setSearch(val)
    if (val.length < 2) { setResults([]); return }
    setResults([
      { id: 1, title: 'Teologia Sistemática', author: 'Wayne Grudem' },
      { id: 2, title: 'Comentário de Romanos', author: 'John Stott' },
      { id: 3, title: 'Dicionário Bíblico', author: 'J.D. Douglas' },
    ])
  }

  return (
    <header className={`sticky top-0 z-30 smooth border-b ${
      scrolled
        ? 'bg-bg/90 backdrop-blur-xl border-border-strong shadow-lg shadow-black/15'
        : 'bg-bg border-border'
    }`}>
      <div className="flex items-center h-[60px] px-3 sm:px-5 lg:px-8 gap-3 max-w-[1400px] mx-auto">
        {/* Menu hamburger mobile */}
        <button onClick={toggleSidebar}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card smooth border border-border">
          <Menu className="w-4 h-4" />
        </button>

        {/* Logo mobile */}
        <span className="lg:hidden text-sm font-heading font-bold text-text-primary tracking-tight">Lumethos</span>

        {/* Desktop search */}
        <div className="hidden md:block flex-1 max-w-md">
          <label className="relative block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Pesquisar na biblioteca..."
              className="input-dark w-full h-9 pl-10 pr-3"
            />
          </label>
        </div>

        {/* Mobile search toggle */}
        <button onClick={() => setShowMobileSearch(true)}
          className="md:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card smooth border border-border">
          <Search className="w-4 h-4" />
        </button>

        {/* Right actions — desktop */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card smooth border border-border">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold-400 ring-2 ring-bg" />
          </button>

          <div className="w-px h-5 bg-border mx-2" />

          <div className="relative" ref={ref}>
            <button onClick={() => setShowUser(!showUser)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-bg-card smooth border border-transparent hover:border-border">
              <div className="w-7 h-7 rounded-lg bg-gold-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-gold-400/20">
                AB
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-text-primary leading-tight">Anderson</p>
                <p className="text-[9px] text-text-gold font-medium">Premium</p>
              </div>
              <ChevronDown className="w-3 h-3 text-text-tertiary" />
            </button>

            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-bg-card border border-border-strong shadow-dropdown overflow-hidden"
                >
                  <div className="p-1.5">
                    {[
                      { icon: User, label: 'Perfil' },
                      { icon: Settings, label: 'Configurações' },
                      { icon: LogOut, label: 'Sair', danger: true },
                    ].map((item, i) => (
                      <button key={i}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg smooth ${
                          item.danger ? 'text-error hover:bg-error/10' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                        }`}>
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-bg"
          >
            <div className="flex items-center h-[60px] px-4 border-b border-border">
              <button onClick={() => { setShowMobileSearch(false); setResults([]) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-border">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div className="flex-1 ml-2">
                <input type="text" value={search} onChange={e => onSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full text-sm text-text-primary placeholder-text-tertiary focus:outline-none bg-transparent"
                  autoFocus />
              </div>
            </div>
            {results.length > 0 && (
              <div className="p-4 space-y-2">
                {results.map(item => (
                  <button key={item.id} onClick={() => { navigate(`/livro/${item.id}`); setShowMobileSearch(false) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-card text-left border border-border">
                    <BookOpen className="w-4 h-4 text-gold-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-secondary">{item.author}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop autocomplete */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-[260px] right-[280px] mt-1 rounded-xl bg-bg-card border border-border-strong shadow-dropdown overflow-hidden z-50 hidden md:block"
          >
            {results.map((item, i) => (
              <button key={i} onClick={() => { navigate(`/livro/${item.id}`); setSearch(''); setResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover smooth border-b border-border last:border-0 text-left">
                <BookOpen className="w-4 h-4 text-gold-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.author}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
