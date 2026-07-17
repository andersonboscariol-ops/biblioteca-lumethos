import { motion } from 'framer-motion'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card via-bg-hover to-bg border border-border-strong min-h-[200px]">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(rgba(199, 154, 46, 0.4) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      {/* Orbs */}
      <div className="absolute -top-20 -right-20 w-[280px] h-[280px] bg-gold-400/5 rounded-full blur-[120px]" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 px-6 lg:px-10 py-8 lg:py-10">
        <div className="flex-1 text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl lg:text-3xl xl:text-[2.25rem] text-text-primary leading-[1.15] mb-2"
          >
            Biblioteca Teológica<br />
            <span className="text-gold-300">do Pregador</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-text-secondary text-sm lg:text-[15px] max-w-md leading-relaxed mb-5"
          >
            O acervo digital mais completo para líderes e estudiosos da Palavra.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-3 justify-center lg:justify-start"
          >
            <button className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-gold-400/15">
              <BookOpen className="w-4 h-4" />
              Explorar
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bg-card border border-border-strong text-text-secondary text-sm font-medium hover:text-text-primary hover:bg-bg-hover smooth">
              Planos
            </button>
          </motion.div>
        </div>

        {/* Decorative */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block shrink-0"
        >
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400/10 to-gold-400/3 rounded-full blur-3xl" />
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="w-24 h-32 rounded-xl bg-gradient-to-b from-gold-400/10 to-bg-card border border-border-gold flex flex-col items-center justify-center gap-2 shadow-2xl shadow-black/40">
                <BookOpen className="w-6 h-6 text-gold-300" />
                <span className="text-text-tertiary text-[8px] font-medium tracking-wider uppercase">Acervo</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
