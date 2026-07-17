import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, BookOpen, Heart, Download, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { books } from '../../data/catalog'
import BookCover from '../../components/bookcover/BookCover'

function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
        <Icon className="w-5 h-5 text-text-tertiary" />
      </div>
      <p className="text-text-tertiary text-sm">{message}</p>
      {sub && <p className="text-text-tertiary text-xs">{sub}</p>}
    </div>
  )
}

function BookCard({ book }) {
  return (
    <Link to={`/livro/${book.id}`}
      className="group overflow-hidden rounded-xl bg-bg-card border border-border card-elevated">
      <div className="aspect-[2/3] overflow-hidden bg-bg-elevated relative">
        <BookCover src={book.cover} title={book.title} className="w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 smooth">
          <button className="w-full text-[10px] font-medium py-1.5 rounded-lg bg-gold-400 text-white hover:bg-gold-500 smooth shadow-lg">
            <BookOpen className="w-3 h-3 inline mr-1" />Ler
          </button>
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="text-xs font-medium text-text-primary truncate group-hover:text-gold-300 smooth">{book.title}</h3>
        <p className="text-[10px] text-text-tertiary truncate mt-0.5">{book.author}</p>
      </div>
    </Link>
  )
}

function ListItem({ book, i }) {
  return (
    <Link to={`/livro/${book.id}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-bg-card border border-border hover:border-border-gold smooth group">
      <div className="w-9 h-12 rounded-lg overflow-hidden bg-bg-elevated shrink-0 shadow-sm border border-border">
        <BookCover src={book.cover} title={book.title} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate group-hover:text-gold-300 smooth">{book.title}</p>
        <p className="text-xs text-text-tertiary">{book.author}</p>
      </div>
      <span className="text-[10px] text-text-tertiary shrink-0">{i === 0 ? 'Agora' : i < 3 ? `${i * 2}h` : `${i}d`}</span>
    </Link>
  )
}

function SearchHeader({ label, count, search, setSearch, placeholder }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-heading font-bold text-text-primary">{label}</h1>
        <p className="text-xs text-text-tertiary">{count}</p>
      </div>
      <div className="relative w-full sm:w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={placeholder || 'Filtrar...'}
          className="input-dark w-full h-9 pl-9 pr-3 text-xs" />
      </div>
    </div>
  )
}

export function Favorites() {
  const [search, setSearch] = useState('')
  const favs = books.filter(b => b.favorite)
  const filtered = search ? favs.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())) : favs

  return (
    <div className="space-y-5">
      <SearchHeader label="Favoritos" count={`${favs.length} livros salvos`} search={search} setSearch={setSearch} placeholder="Buscar favoritos..." />
      {filtered.length === 0 ? <EmptyState icon={Heart} message="Nenhum favorito encontrado" sub={search ? `Para "${search}"` : 'Marque livros como favoritos'} />
        : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {filtered.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      }
    </div>
  )
}

export function Downloads() {
  const [search, setSearch] = useState('')
  const downloaded = books.filter(b => b.downloads > 0)
  const filtered = search ? downloaded.filter(b => b.title.toLowerCase().includes(search.toLowerCase())) : downloaded

  return (
    <div className="space-y-5">
      <SearchHeader label="Downloads" count={`${downloaded.length} arquivos baixados`} search={search} setSearch={setSearch} placeholder="Buscar downloads..." />
      {filtered.length === 0 ? <EmptyState icon={Download} message="Nenhum download encontrado" />
        : <div className="space-y-2">
          {filtered.map(book => (
            <div key={book.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-card border border-border hover:border-border-gold smooth">
              <div className="w-9 h-12 rounded-lg overflow-hidden bg-bg-elevated shrink-0 shadow-sm border border-border">
                <BookCover src={book.cover} title={book.title} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{book.title}</p>
                <p className="text-[10px] text-text-tertiary">{book.author} • {book.downloads}x</p>
              </div>
              <button className="text-[10px] font-medium px-3 py-1.5 rounded-lg bg-gold-400 text-white hover:bg-gold-500 smooth">Abrir</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

export function History() {
  const [search, setSearch] = useState('')
  return (
    <div className="space-y-5">
      <SearchHeader label="Histórico" count="Últimos livros acessados" search={search} setSearch={setSearch} />
      <div className="space-y-2">
        {books.slice(0, 8).map((book, i) => (
          <ListItem key={book.id} book={book} i={i} />
        ))}
      </div>
    </div>
  )
}

export function Notes() {
  const [search, setSearch] = useState('')
  const notes = [
    { book: 'Teologia Sistemática', text: 'A doutrina da Trindade é fundamental para compreender a natureza de Deus.', date: 'Hoje', color: '#C79A2E' },
    { book: 'Comentário de Romanos', text: 'Paulo argumenta que a justificação é pela fé, não pelas obras.', date: 'Ontem', color: '#D4AA3E' },
    { book: 'Hermenêutica Bíblica', text: 'O texto deve ser interpretado à luz do seu gênero e contexto histórico.', date: '3 dias', color: '#A67B1E' },
  ]

  return (
    <div className="space-y-5">
      <SearchHeader label="Anotações" count={`${notes.length} anotações`} search={search} setSearch={setSearch} />
      <div className="grid gap-2.5">
        {notes.map((n, i) => (
          <div key={i} className="p-4 rounded-lg bg-bg-card border border-border hover:border-border-gold smooth">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }} />
              <span className="text-xs font-medium text-gold-400">{n.book}</span>
              <span className="text-[10px] text-text-tertiary ml-auto">{n.date}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{n.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Explore() {
  const category = new URLSearchParams(window.location.search).get('cat') || ''
  const filtered = category ? books.filter(b => b.categorySlug === category) : books

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-heading font-bold text-text-primary">
            {category ? category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Biblioteca'}
          </h1>
          <p className="text-xs text-text-tertiary">{filtered.length} títulos</p>
        </div>
        <Link to="/" className="flex items-center gap-1 text-xs text-text-tertiary hover:text-gold-400 smooth">
          <ChevronLeft className="w-3 h-3" /> Voltar
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        {filtered.map(book => <BookCard key={book.id} book={book} />)}
      </div>
    </div>
  )
}
