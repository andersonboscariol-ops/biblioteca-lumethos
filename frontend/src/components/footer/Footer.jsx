import { BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border-strong bg-bg mt-10">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gold-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-heading font-bold text-text-primary">Lumethos</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <a href="#" className="hover:text-gold-400 smooth">Termos</a>
            <a href="#" className="hover:text-gold-400 smooth">Privacidade</a>
            <a href="#" className="hover:text-gold-400 smooth">Ajuda</a>
            <span className="text-border">|</span>
            <span className="text-text-tertiary">© 2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
