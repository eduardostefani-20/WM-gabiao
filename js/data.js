/* ==========================================================================
   WM GABIÃO — data.js
   Conteúdo padrão do site. O painel administrativo sobrescreve estes
   valores pelo banco (Supabase); sem banco, o site usa o que está aqui.
   ========================================================================== */

const IMG = 'assets/portfolio/';

/* Textos e imagens editáveis (chave = data-text / data-image no HTML) */
const DEFAULT_CONTENT = {
  hero_eyebrow: 'Engenharia de contenção · Atuação nacional',
  hero_title: 'Engenharia que sustenta o que importa.',
  hero_text: 'Contenções em gabião, Terramesh, Lock Load e drenagem projetadas para durar gerações — executadas com precisão para construtoras, indústrias e o poder público.',
  hero_image: IMG + 'p19.jpg',

  manifesto: 'Cada obra começa no solo e termina na confiança de quem constrói sobre ela. Unimos técnica, material de primeira linha e execução impecável para entregar estruturas que simplesmente não falham.',

  solutions_title: 'Sistemas construtivos',
  solutions_text: 'Um portfólio técnico completo para conter, drenar e estabilizar — da encosta ao canal, do condomínio à indústria.',

  portfolio_title: 'Obras que falam por nós',
  portfolio_text: 'Projetos executados em todo o Brasil para clientes que não aceitam menos que excelência.',

  about_eyebrow: 'Sobre a WM Gabião',
  about_title: 'Solidez não se promete. Se constrói.',
  about_text: 'A WM Gabião & Construção nasceu para resolver os desafios mais exigentes de contenção e drenagem. Com equipe técnica especializada e atuação em todo o território nacional, transformamos projetos complexos em estruturas permanentes — no prazo, com segurança e com acabamento à altura de cada cliente.',
  about_image: IMG + 'p12.jpg',

  stats_works: '25',
  stats_projects: '25',
  stats_people: '6',
  stats_area: 'Brasil',

  clients_title: 'Quem confia na WM',

  budget_title: 'Seu próximo projeto merece engenharia de verdade.',
  budget_text: 'Conte o desafio. Nossa equipe técnica retorna com a solução ideal e uma proposta sob medida.',
  budget_image: IMG + 'p17.jpg',

  phone: '(15) 99116-7340',
  whatsapp: '5515991167340',
  email: 'eduatdo.oliveira222220@gmail.com',
  instagram: 'wmgabiao',
  location: 'Atendimento em todo o Brasil',
  hours: 'Atendimento 24 horas',
  footer_text: 'Engenharia de contenção, drenagem e infraestrutura para obras que não podem falhar.'
};

/* Sistemas construtivos exibidos na seção de soluções */
const DEFAULT_SOLUTIONS = [
  { title: 'Gabião caixa', text: 'Muros de contenção flexíveis, drenantes e de altíssima durabilidade.' },
  { title: 'Colchão Reno', text: 'Revestimento de canais e taludes que dissipa a energia da água.' },
  { title: 'Terramesh', text: 'Solo reforçado para aterros, platôs e encontros de pontes.' },
  { title: 'Lock Load', text: 'Contenção em blocos com estética refinada para empreendimentos.' },
  { title: 'Drenagem', text: 'Drenos, escadas hidráulicas e canalização de córregos.' },
  { title: 'Terraplenagem', text: 'Preparação do terreno com precisão para obras de qualquer porte.' }
];

/* Obras do portfólio (fonte: portfólio oficial WM Gabião) */
const DEFAULT_PROJECTS = [
  {
    title: 'Ponte de interligação entre galpões',
    system: 'Sistema Terramesh',
    location: 'Extrema - MG',
    clients: 'Diase Construtora, V4 Terraplanagem',
    description: 'Foi utilizado o sistema Terramesh para elevar o platô até o nível exigido em projeto, viabilizando a criação de uma ponte de interligação entre os galpões.',
    images: ['p00.jpg', 'p01.jpg', 'p02.jpg']
  },
  {
    title: 'Contenção de talude em terreno pantanoso',
    system: 'Sistema Gabião caixa com estacas',
    location: 'Olímpia - SP',
    clients: 'Prefeitura de Olímpia',
    description: 'Devido ao terreno ser extremamente pantanoso, foram utilizadas estacas de eucalipto para estabilização das caixas e, assim, conter o talude.',
    images: ['p03.jpg', 'p04.jpg', 'p05.jpg']
  },
  {
    title: 'Escada hidráulica em talude',
    system: 'Gabião caixa e colchão Reno',
    location: 'São José do Rio Preto - SP',
    clients: 'Mattos',
    description: 'Construção de escada hidráulica em gabião no talude para dissipar a energia da água e conter as erosões.',
    images: ['p06.jpg', 'p07.jpg', 'p08.jpg']
  },
  {
    title: 'Dreno em estação de tratamento',
    system: 'Dreno em gabião',
    location: 'Florínea - SP',
    clients: 'Sabesp, TRM Terraplanagem',
    description: 'Dreno incorporado em gabião, construído na estação de tratamento da Sabesp para conter erosões e dissipar águas pluviais e tratadas.',
    images: ['p09.jpg']
  },
  {
    title: 'Canalização e ampliação de córrego',
    system: 'Gabião caixa, colchão Reno e bloquetes',
    location: 'Tatuí - SP',
    clients: 'Sam Marino Engenharia',
    description: 'Canalização e ampliação de córrego, construído para conter as erosões e dissipar a energia da água.',
    images: ['p16.jpg', 'p17.jpg', 'p18.jpg']
  },
  {
    title: 'Condomínio Pirituba — maior condomínio da América Latina',
    system: 'Sistema Lock Load',
    location: 'São Paulo - SP',
    clients: 'MRV, V4 Terraplanagem',
    description: 'Lock Load utilizado para subir os aterros e criar novas vias de circulação, unindo funcionalidade a um apelo estético adequado ao condomínio.',
    images: ['p19.jpg', 'p20.jpg', 'p21.jpg']
  },
  {
    title: 'Contenção comercial — Assaí Atacadista',
    system: 'Gabião caixa',
    location: 'São Paulo - SP',
    clients: 'Assaí Atacadista',
    description: 'Muro de contenção em gabião sustentando o platô de uma unidade comercial, integrado ao paisagismo e ao acesso viário.',
    images: ['p22.jpg', 'p23.jpg']
  },
  {
    title: 'Contenção viária junto a edifício-garagem',
    system: 'Gabião caixa',
    location: 'São Paulo - SP',
    clients: '',
    description: 'Muro em gabião ao longo da via, estabilizando o talude gramado sob o edifício-garagem e garantindo segurança à calçada.',
    images: ['p13.jpg', 'p14.jpg', 'p15.jpg']
  },
  {
    title: 'Muro de contenção em área industrial',
    system: 'Gabião caixa',
    location: 'Brasil',
    clients: '',
    description: 'Muro de grande altura em gabião escalonado, contendo o corte do terreno junto às edificações industriais.',
    images: ['p12.jpg']
  },
  {
    title: 'Proteção de margem de rio',
    system: 'Gabião caixa e colchão Reno',
    location: 'Brasil',
    clients: '',
    description: 'Muro de gabião acompanhando o curso d’água, protegendo a margem contra erosão e cheias.',
    images: ['p10.jpg', 'p11.jpg']
  },
  {
    title: 'Plataforma em gabião com guarda-corpo',
    system: 'Gabião caixa',
    location: 'Brasil',
    clients: '',
    description: 'Contenção curva em gabião para formação de platô, com guarda-corpo em madeira e acabamento uniforme.',
    images: ['p24.jpg', 'p25.jpg']
  },
  {
    title: 'Contenção de grande porte em execução',
    system: 'Gabião caixa',
    location: 'Brasil',
    clients: '',
    description: 'Execução de contenção extensa em gabião com manta geotêxtil, acompanhando o talude ao longo da via.',
    images: ['p26.jpg', 'p27.jpg']
  }
].map((project, index) => ({ ...project, images: project.images.map(file => IMG + file), sort_order: index + 1 }));

/* Clientes exibidos na faixa animada */
/* Sem logo cadastrada, o site mostra um selo com as iniciais. */
const DEFAULT_CLIENTS = [
  ['Diase Construtora', ''],
  ['V4 Terraplanagem', ''],
  ['Prefeitura de Olímpia', ''],
  ['Mattos', ''],
  ['Sabesp', 'assets/clients/sabesp.png'],
  ['TRM Terraplanagem', ''],
  ['Sam Marino Engenharia', ''],
  ['MRV', 'assets/clients/mrv.png'],
  ['Assaí Atacadista', 'assets/clients/assai.png']
].map(([name, logo_url], index) => ({ name, logo_url, sort_order: index + 1 }));
