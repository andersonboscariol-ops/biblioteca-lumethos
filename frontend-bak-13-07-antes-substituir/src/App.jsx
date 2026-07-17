import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { BookOpen, Search, ChevronRight } from 'lucide-react'
import BookCover from './components/bookcover/BookCover'

import Sidebar from './components/sidebar/Sidebar'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import Home from './pages/home/Home'
import Details from './pages/details/Details'
import Reader from './pages/reader/Reader'
import { Favorites, Downloads, History, Notes } from './pages/explore/Explore'
import { books, categories } from './data/catalog'

function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
        <BookOpen className="w-6 h-6 text-text-tertiary" />
      </div>
      <p className="text-text-secondary text-sm">Página não encontrada</p>
      <Link to="/" className="text-xs text-gold-400 hover:text-gold-300 smooth inline-flex items-center gap-1">
        <ChevronRight className="w-3 h-3 rotate-180" /> Voltar ao início
      </Link>
    </div>
  )
}

function BibliotecaPage() {
  const [search, setSearch] = useState('')
  const filtered = search
    ? books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))
    : books

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-text-primary">Biblioteca</h1>
          <p className="text-xs text-text-secondary mt-0.5">{books.length} títulos disponíveis</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar..."
            className="input-dark w-full h-9 pl-9 pr-3 text-xs" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-text-tertiary text-sm mb-1">Nenhum resultado</p>
          <p className="text-text-tertiary text-xs">"{search}" não encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(book => (
            <Link key={book.id} to={`/livro/${book.id}`}
              className="group overflow-hidden rounded-xl bg-bg-card border border-border card-elevated">
              <div className="aspect-[2/3] overflow-hidden bg-bg-elevated">
                <BookCover src={book.cover} title={book.title} className="w-full h-full" />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-medium text-text-primary truncate group-hover:text-gold-300 smooth">{book.title}</h3>
                <p className="text-[10px] text-text-secondary truncate mt-0.5">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoriaPage() {
  const catSlug = window.location.pathname.split('/').pop()
  const cat = categories.find(c => c.slug === catSlug)
  const catBooks = books.filter(b => b.categorySlug === catSlug)
  const [search, setSearch] = useState('')
  const filtered = search
    ? catBooks.filter(b => b.title.toLowerCase().includes(search.toLowerCase()))
    : catBooks

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/" className="text-xs text-text-tertiary hover:text-gold-400 smooth">Início</Link>
            <span className="text-xs text-text-tertiary">/</span>
            <span className="text-xs text-gold-400">{cat?.name || catSlug}</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-text-primary">{cat?.name || 'Categoria'}</h1>
          <p className="text-xs text-text-secondary mt-0.5">{catBooks.length} títulos</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar..."
            className="input-dark w-full h-9 pl-9 pr-3 text-xs" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-text-tertiary text-sm">Nenhum livro nesta categoria</p>
          <Link to="/" className="text-xs text-gold-400 mt-2 inline-block">← Voltar ao início</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(book => (
            <Link key={book.id} to={`/livro/${book.id}`}
              className="group overflow-hidden rounded-xl bg-bg-card border border-border card-elevated">
              <div className="aspect-[2/3] overflow-hidden bg-bg-elevated">
                <BookCover src={book.cover} title={book.title} className="w-full h-full" />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-medium text-text-primary truncate group-hover:text-gold-300 smooth">{book.title}</h3>
                <p className="text-[10px] text-text-secondary truncate mt-0.5">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 px-3 sm:px-5 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/biblioteca" element={<BibliotecaPage />} />
                <Route path="/livro/:bookId" element={<Details />} />
                <Route path="/ler/:bookId" element={<Reader />} />
                <Route path="/categoria/:catId" element={<CategoriaPage />} />
                <Route path="/favoritos" element={<Favorites />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/historico" element={<History />} />
                <Route path="/anotacoes" element={<Notes />} />
                <Route path="/estudos" element={<BibliotecaPage />} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}
