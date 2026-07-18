import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, CreditCard, Palette, Bell, LogOut, ChevronRight, Camera, Crown, Check, Save, Globe, Moon, Sun } from 'lucide-react'

function SectionCard({ icon: Icon, title, desc, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)

  return (
    <div className="rounded-xl bg-bg-card border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover smooth">
        <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gold-400" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="text-[11px] text-text-secondary">{desc}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-text-tertiary smooth ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-border"
        >
          <div className="p-4">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function ProfileSection() {
  const [name, setName] = useState('Anderson Boscariol')
  const [email, setEmail] = useState('anderson@lumethos.com')
  const [avatar, setAvatar] = useState(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setAvatar(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">AB</span>
            )}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold-400 border-2 border-bg-card flex items-center justify-center hover:bg-gold-300 smooth shadow-sm">
            <Camera className="w-3 h-3 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Foto de perfil</p>
          <p className="text-[11px] text-text-secondary">PNG, JPG ou WebP. Máx 2MB.</p>
        </div>
      </div>

      <div>
        <label className="text-[11px] text-text-secondary font-medium mb-1.5 block">Nome completo</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="input-dark w-full h-9 px-3 text-sm" />
      </div>

      <div>
        <label className="text-[11px] text-text-secondary font-medium mb-1.5 block">E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)}
          className="input-dark w-full h-9 px-3 text-sm" />
      </div>

      <button onClick={handleSave}
        className="flex items-center gap-2 px-4 h-9 rounded-lg bg-gold-400 text-white text-xs font-medium hover:bg-gold-300 smooth">
        {saved ? <><Check className="w-3.5 h-3.5" /> Salvo</> : <><Save className="w-3.5 h-3.5" /> Salvar alterações</>}
      </button>
    </div>
  )
}

function PlanSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gradient-to-r from-gold-400/5 to-transparent border border-border-gold p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-medium text-text-primary">Premium</span>
              <span className="text-[10px] font-medium text-emerald-400">● Ativo</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1">R$ 29,90/mês</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Próxima cobrança: 17/08/2026</p>
          </div>
          <button className="text-[11px] text-gold-400 hover:text-gold-300 smooth font-medium">Gerenciar</button>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-text-secondary font-medium">Recursos disponíveis</p>
        {['Biblioteca completa — 100K+ títulos', 'Bíblias de estudo interativas', 'Downloads ilimitados', 'Anotações e sync multiplataforma'].map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] text-text-primary">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {[
          { name: 'Básico', price: 'Grátis', popular: false },
          { name: 'Premium', price: 'R$ 29,90/mês', popular: true },
          { name: 'Vitalício', price: 'R$ 497', popular: false },
        ].map((plan) => (
          <div key={plan.name} className={`rounded-lg border p-3 text-center smooth ${
            plan.popular ? 'border-gold-400 bg-gold-400/5' : 'border-border bg-bg-elevated'
          }`}>
            {plan.popular && <span className="text-[9px] text-gold-400 font-semibold uppercase tracking-wider">Recomendado</span>}
            <p className="text-sm font-semibold text-text-primary mt-1">{plan.name}</p>
            <p className="text-lg font-bold text-gold-400">{plan.price}</p>
            <button className={`mt-3 w-full h-8 rounded-lg text-xs font-medium smooth ${
              plan.popular ? 'bg-gold-400 text-white hover:bg-gold-300' : 'border border-border text-text-secondary hover:text-text-primary'
            }`}>
              {plan.name === 'Premium' ? 'Plano atual' : 'Assinar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppearanceSection() {
  const [theme, setTheme] = useState('dark')
  const themes = [
    { id: 'dark', label: 'Escuro', icon: Moon },
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'system', label: 'Sistema', icon: Globe },
  ]

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-text-secondary font-medium">Tema</p>
      <div className="flex gap-2">
        {themes.map((t) => (
          <button key={t.id} onClick={() => setTheme(t.id)}
            className={`flex items-center gap-2 px-3 h-9 rounded-lg text-xs smooth border ${
              theme === t.id ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SecuritySection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm text-text-primary">Alterar senha</p>
          <p className="text-[11px] text-text-secondary">Atualize sua senha periodicamente</p>
        </div>
        <button className="px-3 h-8 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover smooth">Alterar</button>
      </div>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm text-text-primary">Autenticação em dois fatores</p>
          <p className="text-[11px] text-text-secondary">Proteja sua conta com 2FA</p>
        </div>
        <button className="px-3 h-8 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover smooth">Ativar</button>
      </div>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm text-text-primary">Sessões ativas</p>
          <p className="text-[11px] text-text-secondary">2 dispositivos conectados</p>
        </div>
        <button className="px-3 h-8 rounded-lg border border-border text-xs text-error hover:bg-error/10 smooth">Sair de todos</button>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const toggles = [
    { label: 'Novos livros', desc: 'Quando novos títulos forem adicionados', checked: true },
    { label: 'Atualizações', desc: 'Melhorias e novas funcionalidades', checked: true },
    { label: 'Promoções', desc: 'Ofertas e descontos especiais', checked: false },
    { label: 'Resumo semanal', desc: 'Seu progresso de leitura da semana', checked: true },
  ]

  return (
    <div className="space-y-1">
      {toggles.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-text-primary">{item.label}</p>
            <p className="text-[11px] text-text-secondary">{item.desc}</p>
          </div>
          <label className="relative inline-block w-9 h-5 cursor-pointer">
            <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
            <div className="w-9 h-5 rounded-full bg-bg-elevated border border-border peer-checked:bg-gold-400 peer-checked:border-gold-400 smooth" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white peer-checked:translate-x-4 smooth shadow-sm" />
          </label>
        </div>
      ))}
    </div>
  )
}

export default function Settings() {
  const sections = [
    { icon: User, title: 'Perfil', desc: 'Nome, e-mail e foto', component: ProfileSection, defaultOpen: true },
    { icon: CreditCard, title: 'Plano e Assinatura', desc: 'Premium — R$ 29,90/mês', component: PlanSection },
    { icon: Palette, title: 'Aparência', desc: 'Tema e visualização', component: AppearanceSection },
    { icon: Shield, title: 'Segurança', desc: 'Senha e 2FA', component: SecuritySection },
    { icon: Bell, title: 'Notificações', desc: 'Preferências de alerta', component: NotificationsSection },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold text-text-primary">Configurações</h1>
        <p className="text-xs text-text-secondary mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      <div className="space-y-2">
        {sections.map((sec, i) => (
          <SectionCard key={i} icon={sec.icon} title={sec.title} desc={sec.desc} defaultOpen={sec.defaultOpen}>
            <sec.component />
          </SectionCard>
        ))}
      </div>

      <div className="rounded-xl border border-error/20 bg-error/5 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-error" />
              <span className="text-sm font-medium text-error">Excluir conta</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1">Todos os dados serão removidos permanentemente.</p>
          </div>
          <button className="px-3 h-8 rounded-lg border border-error/30 text-xs text-error hover:bg-error/10 smooth shrink-0">Excluir</button>
        </div>
      </div>
    </div>
  )
}
