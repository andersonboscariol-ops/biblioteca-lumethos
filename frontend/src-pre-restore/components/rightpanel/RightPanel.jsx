import { motion } from 'framer-motion'
import { TrendingUp, Crown, ChevronRight } from 'lucide-react'

export default function RightPanel() {
  return (
    <aside className="space-y-4">
      {/* Perfil */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-400 flex items-center justify-center text-sm font-bold text-white shadow-gold-400/20">
            AB
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Anderson</p>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-gold-400" />
              <span className="text-[10px] text-text-gold font-medium">Premium</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mais Lidos */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-4">
        <h3 className="text-xs font-heading font-semibold text-text-primary mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
          Mais Lidos
        </h3>
        <div className="space-y-3">
          {[
            { name: 'Teologia Sistemática', pct: 85, author: 'Wayne Grudem' },
            { name: 'Comentário de Romanos', pct: 72, author: 'John Stott' },
            { name: 'O Peregrino', pct: 64, author: 'John Bunyan' },
          ].map((c, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="min-w-0">
                  <p className="text-text-secondary truncate">{c.name}</p>
                  <p className="text-[9px] text-text-tertiary">{c.author}</p>
                </div>
                <span className="text-gold-400 font-medium text-[11px] ml-2">{c.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-gold-400 smooth" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Upgrade CTA */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-card via-bg-hover to-bg border border-border-strong p-4"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-gold-400/8 rounded-full blur-3xl" />
        <Crown className="w-6 h-6 text-gold-400 mb-2" />
        <h4 className="text-xs font-semibold text-text-primary mb-1">Premium</h4>
        <p className="text-[10px] text-text-tertiary mb-3 leading-relaxed">Acervo completo sem limites</p>
        <button className="btn-gold w-full text-[10px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1">
          Ativar agora
          <ChevronRight className="w-3 h-3" />
        </button>
      </motion.div>
    </aside>
  )
}
