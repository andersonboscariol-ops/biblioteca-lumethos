// Catálogo da Biblioteca Teológica Lumethos
// Dados mockados para exibição - 36 categorias teológicas

export const categories = [
  {
    id: 'comentarios-biblicos',
    title: 'Comentários Bíblicos',
    description: 'Comentários versículo por versículo dos livros da Bíblia, dos principais teólogos e estudiosos.',
    color: '#C79A2E',
    books: [
      { title: 'Comentário Bíblico de Matthew Henry', author: 'Matthew Henry', year: '2024', pages: 3200 },
      { title: 'Comentário do NT - William Hendriksen', author: 'William Hendriksen', year: '2023', pages: 2800 },
      { title: 'Comentário Expositivo do AT', author: 'Warren Wiersbe', year: '2024', pages: 1500 },
      { title: 'Comentário Bíblico Popular', author: 'William MacDonald', year: '2023', pages: 1200 },
    ]
  },
  {
    id: 'dicionarios-biblicos',
    title: 'Dicionários Bíblicos',
    description: 'Dicionários completos para estudo de termos, nomes e conceitos bíblicos.',
    color: '#142D4C',
    books: [
      { title: 'Dicionário Bíblico Strong', author: 'James Strong', year: '2024', pages: 1800 },
      { title: 'Dicionário Bíblico Vine', author: 'W.E. Vine', year: '2023', pages: 1500 },
      { title: 'Dicionário Bíblico Wycliffe', author: 'Vários', year: '2024', pages: 2200 },
    ]
  },
  {
    id: 'enciclopedias-biblicas',
    title: 'Enciclopédias Bíblicas',
    description: 'Enciclopédias temáticas com artigos aprofundados sobre todos os aspectos bíblicos.',
    color: '#462f28',
    books: [
      { title: 'Enciclopédia Bíblica Ilustrada', author: 'John D. Davis', year: '2024', pages: 3500 },
      { title: 'Enciclopédia Judaica', author: 'Vários', year: '2023', pages: 4200 },
      { title: 'Enciclopédia de Dificuldades Bíblicas', author: 'Gleason Archer', year: '2024', pages: 800 },
    ]
  },
  {
    id: 'biblias-estudo',
    title: 'Bíblias de Estudo',
    description: 'Bíblias completas com notas de estudo, referências cruzadas e comentários.',
    color: '#C79A2E',
    books: [
      { title: 'Bíblia de Estudo MacArthur', author: 'John MacArthur', year: '2024', pages: 2200 },
      { title: 'Bíblia de Estudo Pentecostal', author: 'Vários', year: '2023', pages: 2100 },
      { title: 'Bíblia de Estudo NVI', author: 'Vários', year: '2024', pages: 2000 },
      { title: 'Bíblia de Estudo Genebra', author: 'Vários', year: '2023', pages: 2400 },
    ]
  },
  {
    id: 'teologias-sistematicas',
    title: 'Teologias Sistemáticas',
    description: 'As principais obras de teologia sistemática cristã.',
    color: '#142D4C',
    books: [
      { title: 'Teologia Sistemática - Wayne Grudem', author: 'Wayne Grudem', year: '2024', pages: 1600 },
      { title: 'Teologia Sistemática - Millard Erickson', author: 'Millard Erickson', year: '2023', pages: 1400 },
      { title: 'Teologia Sistemática - Louis Berkhof', author: 'Louis Berkhof', year: '2024', pages: 780 },
      { title: 'Teologia Bíblica Sistemática', author: 'Paul Enns', year: '2023', pages: 680 },
    ]
  },
  {
    id: 'mundo-biblico',
    title: 'Mundo Bíblico',
    description: 'Estudos sobre o contexto histórico, geográfico e cultural dos tempos bíblicos.',
    color: '#462f28',
    books: [
      { title: 'Geografia Histórica da Terra Santa', author: 'Yohanan Aharoni', year: '2024', pages: 500 },
      { title: 'Costumes e Cultura dos Tempos Bíblicos', author: 'Fred H. Wight', year: '2023', pages: 350 },
    ]
  },
  {
    id: 'angelologia',
    title: 'Angelologia',
    description: 'Estudo doutrinário sobre anjos, sua natureza, hierarquia e ministério.',
    color: '#C79A2E',
    books: [
      { title: 'Angelologia Bíblica', author: 'Vários', year: '2024', pages: 400 },
      { title: 'O Mundo dos Anjos', author: 'Billy Graham', year: '2023', pages: 280 },
    ]
  },
  {
    id: 'apologetica',
    title: 'Apologética',
    description: 'Defesa da fé cristã contra objeções e visões alternativas.',
    color: '#142D4C',
    books: [
      { title: 'Apologética Cristã', author: 'Norman Geisler', year: '2024', pages: 900 },
      { title: 'Não Tenho Fé Suficiente para Ser Ateu', author: 'Norman Geisler', year: '2023', pages: 400 },
    ]
  },
  {
    id: 'cristologia',
    title: 'Cristologia',
    description: 'Estudo aprofundado da pessoa e obra de Jesus Cristo.',
    color: '#462f28',
    books: [
      { title: 'A Pessoa de Cristo', author: 'Donald Macleod', year: '2024', pages: 350 },
      { title: 'Cristologia Bíblica', author: 'Vários', year: '2023', pages: 500 },
    ]
  },
  {
    id: 'escatologia',
    title: 'Escatologia',
    description: 'Estudo das últimas coisas, profecias bíblicas e o futuro segundo as Escrituras.',
    color: '#C79A2E',
    books: [
      { title: 'Escatologia Bíblica', author: 'Vários', year: '2024', pages: 450 },
      { title: 'O Plano Divino Através dos Séculos', author: 'Lewis Sperry Chafer', year: '2023', pages: 500 },
    ]
  },
  {
    id: 'pneumatologia',
    title: 'Pneumatologia',
    description: 'Estudo doutrinário sobre o Espírito Santo, sua pessoa e obra.',
    color: '#142D4C',
    books: [
      { title: 'Pneumatologia - O Espírito Santo', author: 'Vários', year: '2024', pages: 400 },
      { title: 'O Espírito Santo e Sua Obra', author: 'Stanley Horton', year: '2023', pages: 350 },
    ]
  },
  {
    id: 'soteriologia',
    title: 'Soteriologia',
    description: 'Estudo da doutrina da salvação: expiação, redenção, justificação e santificação.',
    color: '#462f28',
    books: [
      { title: 'Soteriologia Bíblica', author: 'Vários', year: '2024', pages: 380 },
      { title: 'A Cruz de Cristo', author: 'John Stott', year: '2023', pages: 350 },
    ]
  },
  {
    id: 'hermeneutica',
    title: 'Hermenêutica',
    description: 'Princípios e métodos de interpretação bíblica.',
    color: '#C79A2E',
    books: [
      { title: 'Hermenêutica - Princípios de Interpretação', author: 'Milton Terry', year: '2024', pages: 600 },
      { title: 'Manual de Hermenêutica', author: 'E. Lund', year: '2023', pages: 350 },
    ]
  },
  {
    id: 'exegese',
    title: 'Exegese',
    description: 'Estudo e análise aprofundada dos textos bíblicos em suas línguas originais.',
    color: '#142D4C',
    books: [
      { title: 'Manual de Exegese Bíblica', author: 'Vários', year: '2024', pages: 500 },
      { title: 'Exegese do Novo Testamento', author: 'Gordon Fee', year: '2023', pages: 450 },
    ]
  },
  {
    id: 'historia-da-igreja',
    title: 'História da Igreja',
    description: 'A história do cristianismo desde os apóstolos até os dias atuais.',
    color: '#462f28',
    books: [
      { title: 'História da Igreja Cristã', author: 'Earle E. Cairns', year: '2024', pages: 700 },
      { title: 'A Igreja Através dos Séculos', author: 'Bruce Shelley', year: '2023', pages: 550 },
    ]
  }
];

// Popular categories with more books for homepage highlight
export const featuredCategories = categories.slice(0, 6);
