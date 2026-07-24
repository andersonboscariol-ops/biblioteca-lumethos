import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Library, BookText, Star, Download, FilePen, History, BookOpen, Settings, User, LogOut, ChevronRight } from 'lucide-react'

const sections = [
  {
    label: 'Navegar',
    items: [
      { icon: Library, label: 'Biblioteca', path: '/biblioteca' },
      { icon: BookText, label: 'Estudos', path: '/estudos' },
    ],
  },
  {
    label: 'Categorias',
    items: [
      { label: 'Bíblias de Estudo', path: '/categoria/biblias-estudo' },
      { label: 'Comentários', path: '/categoria/comentarios-biblicos' },
      { label: 'Dicionários', path: '/categoria/dicionarios-biblicos' },
      { label: 'Hebraico', path: '/categoria/hebraico-biblico' },
      { label: 'Grego', path: '/categoria/grego-biblico' },
    ],
  },
  {
    label: 'Minha Biblioteca',
    items: [
      { icon: Star, label: 'Favoritos', path: '/favoritos' },
      { icon: Download, label: 'Downloads', path: '/downloads' },
      { icon: FilePen, label: 'Anotações', path: '/anotacoes' },
      { icon: History, label: 'Histórico', path: '/historico' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/biblioteca') return pathname === '/biblioteca'
    if (path === '/estudos') return pathname === '/estudos'
    if (path.startsWith('/categoria/')) return pathname.includes(path.split('/').pop())
    return pathname === path
  }

  return (
    <>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-10
        w-[220px] h-screen
        bg-sidebar border-r border-border-strong
        flex flex-col
        transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-[60px] border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gold-400 flex items-center justify-center shadow-gold-400/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-heading font-bold text-text-primary tracking-tight">Lumethos</h1>
            <p className="text-[8px] text-text-tertiary tracking-[0.15em] uppercase">Biblioteca</p>
          </div>
        </div>

        {/* Início */}
        <div className="px-2 mt-2">
          <NavLink to="/" onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg smooth text-sm ${
              pathname === '/'
                ? 'bg-gold-400/10 text-gold-300 font-medium border border-border-gold'
                : 'text-text-secondary hover:text-text-primary hover:bg-sidebar-hover border border-transparent'
            }`}
          >
            <Home className={`w-4 h-4 shrink-0 ${pathname === '/' ? 'text-gold-400' : ''}`} />
            <span>Início</span>
          </NavLink>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5 hide-scrollbar">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] text-text-tertiary uppercase tracking-[0.1em] px-3 mb-1.5 font-semibold">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg smooth ${
                        active
                          ? 'bg-gold-400/10 text-gold-300 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-sidebar-hover'
                      }`}
                    >
                      {item.icon ? (
                        <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-gold-400' : ''}`} />
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <span className="text-sm">{item.label}</span>
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400" />}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>


      </aside>
    </>
  )
}
