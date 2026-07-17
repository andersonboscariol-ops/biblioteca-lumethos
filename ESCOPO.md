# 📚 Biblioteca Teológica Lumethos — ESCOPO

## 🏛️ Visão Geral

Sistema de biblioteca teológica digital estilo Netflix, com os livros adquiridos pelo Instituto Lumethos na Biblioteca do Pregador (Agência do Reino).

**Subdomínio:** `biblioteca.institutolumethos.online`

---

## 🧱 Arquitetura

```
Cliente → Cloudflare (proxy/SSL) → VPS → Nginx (:80/:443) → Backend (:3020)
                                                         ├── Frontend React (SPA)
                                                         ├── API Catálogo
                                                         └── API Proxy PDF (autenticado)
```

### Componentes

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | React 19 + Vite + Tailwind v4 | Catálogo estilo Netflix |
| Backend | Node.js + Express 5 | API REST + proxy PDF |
| Proxy PDF | axios + cookie | Autentica no members.agenciadoreino.com.br e serve PDF sob demanda |
| DNS | Cloudflare | Proxy, SSL, CDN |
| Servidor | Nginx | Reverse proxy para Node |
| Gerenciador | PM2 | Manutenção do processo |

---

## 📁 Estrutura de Diretórios

```
/var/www/biblioteca/
├── ESCOPO.md                  ← Este arquivo
├── frontend/
│   ├── src/
│   │   ├── main.jsx           ← Entry point
│   │   ├── App.jsx            ← Rotas
│   │   ├── index.css          ← Tailwind + tema escuro
│   │   ├── App.css            ← Estilos globais
│   │   ├── data/catalog.js    ← Dados do catálogo (mock)
│   │   ├── pages/
│   │   │   ├── Home.jsx       ← Hero + categorias
│   │   │   ├── Biblioteca.jsx ← Grid de livros com filtro
│   │   │   ├── LivroDetalhe.jsx ← Detalhes + preview/download
│   │   │   └── Lendo.jsx      ← Visualizador PDF
│   │   └── components/
│   │       ├── Header.jsx     ← Nav + busca
│   │       ├── Footer.jsx
│   │       ├── CardLivro.jsx  ← Card estilo Netflix
│   │       ├── CategoriaSection.jsx ← Seção horizontal
│   │       ├── HeroSection.jsx
│   │       └── Loader.jsx
│   ├── dist/                  ← Build de produção
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.js           ← Servidor Express
│   │   ├── proxy.js           ← Proxy autenticado para PDFs
│   │   └── catalog.js         ← API de catálogo
│   ├── .env                   ← Credenciais (no cofre)
│   └── package.json
└── ...
```

---

## 🚀 Status Atual (03/07/2026)

### ✅ Concluído
- [x] Frontend React criado e buildando (`npm run build` → 200ms)
- [x] Tema escuro com paleta Lumethos (fundo `#0D1B2A`, dourado `#C79A2E`)
- [x] 4 páginas: Home, Catálogo, Detalhes, Leitor
- [x] API de catálogo (19 categorias, ~60 livros mockados)
- [x] Backend Express rodando na porta 3020 (PM2: `biblioteca-api`)
- [x] Proxy PDF autenticado (login no members.agenciadoreino.com.br)
- [x] Nginx configurado (sites-available + sites-enabled)
- [x] PM2 salvo (`pm2 save`)

### 🔄 Pendente
- [ ] **DNS:** Adicionar registro A no Cloudflare: `biblioteca` → `2.24.81.19`
- [ ] **Plugin WordPress:** Botão "Biblioteca 📚" na sidebar do aluno
- [ ] **Integração WooCommerce:** Produto digital que libera acesso
- [ ] **Mapear PDFs reais:** Extrair URLs dos PDFs da Agência do Reino (36 módulos)
- [ ] **Capa dos livros:** Gerar thumbnails a partir dos PDFs ou usar placeholders
- [ ] **Autenticação:** Sistema de login próprio (ou integração com WordPress)
- [ ] **Busca:** Funcionalidade de busca textual nos livros

---

## 🔒 Proxy de PDFs — Estratégia Zero-Storage

Em vez de baixar 100k+ PDFs (~centenas de GB), usamos **proxy autenticado**:

1. Backend faz login no `members.agenciadoreino.com.br` com credenciais do Anderson
2. Mantém sessão ativa (cookies renovados a cada 1h)
3. Quando usuário solicita um PDF → backend busca da fonte original e serve em streaming
4. Cache opcional em disco (apenas os mais acessados)

**Vantagem:** Zero armazenamento, sempre atualizado, sem custo de disco.

---

## 🎨 Design System

### Paleta de Cores
| Cor | Uso | Hex |
|-----|-----|-----|
| Fundo escuro | Background principal | `#0D1B2A` |
| Card | Cards, seções | `#142D4C` |
| Dourado | Accent, botões, destaques | `#C79A2E` |
| Texto primário | Títulos, conteúdo | `#FFFFFF` |
| Texto secundário | Descrições, metadados | `#8899aa` |
| Detalhe | Elementos secundários | `#462f28` |

### Fontes
- **Títulos:** 'Libre Baskerville', serif
- **Corpo:** system-ui, sans-serif

---

## 📊 Catálogo de Livros (Mockado)

Atualmente 19 das 36 categorias mapeadas com dados mockados:

1. Comentários Bíblicos (4 livros)
2. Dicionários Bíblicos (3 livros)
3. Enciclopédias Bíblicas (3 livros)
4. Bíblias de Estudo (4 livros)
5. Teologias Sistemáticas (4 livros)
6. Mundo Bíblico (2 livros)
7. Angelologia (2 livros)
8. Antigo e Novo Testamento (2 livros)
9. Apologética (2 livros)
10. Cristologia (2 livros)
11. Escatologia (2 livros)
12. Hermenêutica (2 livros)
13. História da Igreja (2 livros)
14. Exegese (2 livros)
15. Pneumatologia (2 livros)
16. Soteriologia (2 livros)
17. Homilética (2 livros)
18. Cursos de Teologia (2 livros)
19. Vida Cristã (2 livros)

**Total mockado: ~60 livros**

---

## 🛣️ Próximos Passos

1. Configurar DNS (Cloudflare) ← seu passo
2. Preview do frontend ← já disponível localmente
3. Mapear PDFs reais (endpoint `/api/proxy/modules` pronto)
4. Criar plugin WordPress (sidebar do aluno)
5. Integrar WooCommerce
6. Substituir dados mockados pelos reais
