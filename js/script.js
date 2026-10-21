/* ==========================================================================
   WM GABIÃO — script.js
   Depende de js/config.js (supabaseClient).
   ========================================================================== */

const IMAGES_DIR = 'assets/images/';

// Imagem padrão de cada serviço/obra, usada quando o banco não informa uma.
const DEFAULT_IMAGES = {
  'Contenção e estabilização': 'muro-contencao.jpg',
  'Drenagem e controle de erosão': 'drenagem-erosao.jpg',
  'Terraplenagem': 'terraplenagem.jpg',
  'Estruturas metálicas': 'estrutura-gabiao.jpg',
  'Infraestrutura': 'infraestrutura.jpg',
  'Projeto de contenção de margem': 'contencao-margem.jpg',
  'Estrutura metálica industrial': 'equipe-engenharia.jpg',
  'Preparação e nivelamento de terreno': 'terraplenagem.jpg',
  'Infraestrutura urbana': 'infraestrutura-urbana.jpg'
};

// Nomes antigos das imagens que ainda podem estar salvos no banco.
const LEGACY_IMAGES = {
  'ChatGPT Image 13 de set. de 2026, 13_39_36.png': 'hero.jpg',
  'Engineering_team_at_construction…_2K_20260913135158.jpeg': 'equipe-engenharia.jpg',
  'Gabion_drainage_erosion_control_…_2K_20260913135256.jpeg': 'drenagem-erosao.jpg',
  'Gabion_retaining_project_in_Brazil_2K_20260913135240.jpeg': 'contencao-margem.jpg',
  'Gabion_retaining_wall_stabilizin…_2K_20260913135247.jpeg': 'muro-contencao.jpg',
  'Gabion_structure_with_stones_2K_20260913135215.jpeg': 'estrutura-gabiao.jpg',
  'Infrastructure_construction_proj…_2K_20260913135230.jpeg': 'terraplenagem.jpg',
  'images (1).jpeg': 'infraestrutura-urbana.jpg',
  'images (2).jpeg': 'infraestrutura.jpg'
};

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initActiveNav();
  initReveal();
  initForm();
  initBackToTop();
  initPortfolioFilter();
  initLightbox();
  document.getElementById('year').textContent = new Date().getFullYear();

  // Os contadores esperam o banco, que pode trazer números atualizados.
  loadSiteContent().finally(initStats);
});

/* ==========================================================================
   CONTEÚDO DINÂMICO (Supabase)
   O HTML já traz o conteúdo padrão; o banco apenas sobrescreve o que tiver.
   ========================================================================== */

async function loadSiteContent(){
  if (!supabaseClient) return;
  try {
    const [content, services, projects] = await Promise.all([
      supabaseClient.from('site_content').select('content').eq('id', 'principal').maybeSingle(),
      supabaseClient.from('services').select('*').eq('active', true).order('sort_order'),
      supabaseClient.from('projects').select('*').eq('active', true).order('sort_order')
    ]);
    if (!content.error && content.data?.content) applySiteContent(content.data.content);
    if (!services.error && services.data?.length) renderServices(services.data);
    if (!projects.error && projects.data?.length) renderProjects(projects.data);
  } catch {
    // Sem conexão com o banco: mantém o conteúdo padrão do HTML.
  }
}

/* Converte caminhos antigos para os nomes atuais dos arquivos. */
function resolveImage(url){
  if (!url) return '';
  const fileName = decodeURIComponent(url.split('/').pop());
  if (url.startsWith(IMAGES_DIR) && LEGACY_IMAGES[fileName]) return IMAGES_DIR + LEGACY_IMAGES[fileName];
  return url;
}

function setBackgroundImage(element, url){
  const resolved = resolveImage(url);
  if (element && resolved) element.style.backgroundImage = `url("${resolved.replaceAll('"', '')}")`;
}

function imageFor(item){
  if (item.image_url) return item.image_url;
  return DEFAULT_IMAGES[item.title] ? IMAGES_DIR + DEFAULT_IMAGES[item.title] : '';
}

function onlyDigits(value){
  return String(value).replace(/\D/g, '');
}

function applySiteContent(content){
  document.querySelectorAll('[data-content]').forEach(element => {
    const value = content[element.dataset.content];
    if (value === undefined || value === '') return;

    // O título do hero mantém a palavra em destaque (<span class="text-gold">).
    const emphasis = element.dataset.content === 'hero_title' && element.querySelector('.text-gold');
    if (emphasis) {
      element.firstChild.textContent = `${value.replace(emphasis.textContent, '').trimEnd()} `;
    } else {
      element.textContent = value;
    }
  });

  const setLinks = (selector, href) => document.querySelectorAll(selector).forEach(link => { link.href = href; });
  if (content.phone) setLinks('a[href^="tel:"]', `tel:${onlyDigits(content.phone)}`);
  if (content.email) setLinks('a[href^="mailto:"]', `mailto:${content.email}`);
  if (content.whatsapp) setLinks('a[href*="wa.me"]', `https://wa.me/${onlyDigits(content.whatsapp)}`);
  if (content.instagram) {
    const instagram = content.instagram.startsWith('http')
      ? content.instagram
      : `https://instagram.com/${content.instagram.replace('@', '')}`;
    setLinks('a[href*="instagram.com"]', instagram);
  }

  setBackgroundImage(document.querySelector('.hero__bg'), content.hero_image);
  setBackgroundImage(document.querySelector('.sobre__img'), content.about_image);
  setBackgroundImage(document.querySelector('.orcamento__bg'), content.budget_image);

  const statNumbers = document.querySelectorAll('.stat__num[data-count]');
  [content.stats_works, content.stats_projects, content.stats_people].forEach((value, index) => {
    if (value !== undefined && statNumbers[index]) statNumbers[index].dataset.count = value;
  });
  if (content.stats_area) document.querySelector('.stat__num--text').textContent = content.stats_area;
}

function createIcon(iconId){
  const svgNs = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(svgNs, 'svg');
  icon.setAttribute('class', 'icon icon--gold');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(svgNs, 'use');
  use.setAttribute('href', `#${iconId}`);
  icon.append(use);
  return icon;
}

function renderServices(items){
  const grid = document.querySelector('#solucoes .cards-grid');
  grid.replaceChildren(...items.map(item => {
    const card = document.createElement('article');
    card.className = 's-card';

    const image = document.createElement('div');
    image.className = 's-card__img ph-image';
    image.setAttribute('role', 'img');
    image.setAttribute('aria-label', item.title);
    setBackgroundImage(image, imageFor(item));

    const body = document.createElement('div');
    body.className = 's-card__body';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.textContent = item.description;
    body.append(createIcon(item.icon || 'icon-wall'), title, description);

    card.append(image, body);
    return card;
  }));
}

function renderProjects(items){
  const grid = document.getElementById('portfolio-grid');
  const moreLink = document.getElementById('ver-todas');

  const cards = items.map(item => {
    const typeLabel = item.type_label || item.category;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'p-card';
    Object.assign(card.dataset, { filter: item.category, title: item.title, type: typeLabel, location: item.location });

    const image = document.createElement('span');
    image.className = 'p-card__img ph-image';
    image.setAttribute('role', 'img');
    image.setAttribute('aria-label', item.title);
    setBackgroundImage(image, imageFor(item));

    const info = document.createElement('span');
    info.className = 'p-card__info';
    const title = document.createElement('strong');
    title.textContent = item.title;
    const detail = document.createElement('small');
    detail.textContent = `${typeLabel} · ${item.location}`;
    info.append(title, detail);

    card.append(image, info);
    return card;
  });

  grid.replaceChildren(...cards, ...(moreLink ? [moreLink] : []));
  applyPortfolioFilter(document.querySelector('.filter.is-active')?.dataset.filter || 'todos');
}

/* ==========================================================================
   NAVEGAÇÃO
   ========================================================================== */

/* Header com fundo sólido ao rolar */
function initHeader(){
  const header = document.getElementById('header');
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* Menu mobile */
function initMobileMenu(){
  const button = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');

  const setOpen = isOpen => {
    menu.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  };

  button.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
}

/* Link do menu ativo conforme a seção visível */
function initActiveNav(){
  const links = document.querySelectorAll('.nav__link');
  const sections = Array.from(links)
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      links.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(section => observer.observe(section));
}

/* Botão voltar ao topo */
function initBackToTop(){
  const button = document.getElementById('back-to-top');
  if (!button) return;

  window.addEventListener('scroll', () => {
    button.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });

  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ==========================================================================
   ANIMAÇÕES
   ========================================================================== */

/* Executa o callback uma única vez quando o elemento aparece na tela. */
function onceVisible(elements, callback, threshold){
  if (!('IntersectionObserver' in window)) {
    elements.forEach(callback);
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      callback(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold });
  elements.forEach(element => observer.observe(element));
}

function initReveal(){
  onceVisible(document.querySelectorAll('[data-reveal]'), element => element.classList.add('is-visible'), 0.15);
}

/* Contadores da seção Sobre (valores em data-count no HTML ou vindos do banco) */
function initStats(){
  const animate = element => {
    const target = parseInt(element.dataset.count, 10) || 0;
    const duration = 900;
    const start = performance.now();

    const step = now => {
      const progress = Math.min((now - start) / duration, 1);
      element.textContent = `+ ${Math.floor(progress * target)}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  onceVisible(document.querySelectorAll('.stat__num[data-count]'), animate, 0.5);
}

/* ==========================================================================
   OBRAS — filtro e lightbox
   ========================================================================== */

/* Usa delegação de eventos: funciona também com os cards recriados pelo banco. */
function applyPortfolioFilter(value){
  document.querySelectorAll('.p-card[data-filter]').forEach(card => {
    card.classList.toggle('is-hidden', value !== 'todos' && card.dataset.filter !== value);
  });
}

function initPortfolioFilter(){
  const filters = document.querySelectorAll('.filter');

  filters.forEach(button => {
    button.addEventListener('click', () => {
      filters.forEach(item => item.classList.toggle('is-active', item === button));
      applyPortfolioFilter(button.dataset.filter);
    });
  });

  document.getElementById('portfolio-grid').addEventListener('click', event => {
    if (!event.target.closest('#ver-todas')) return;
    event.preventDefault();
    document.querySelector('.filter[data-filter="todos"]').click();
  });
}

function initLightbox(){
  const lightbox = document.getElementById('lightbox');
  const title = document.getElementById('lightbox-title');
  const type = document.getElementById('lightbox-type');
  const location = document.getElementById('lightbox-location');
  const image = lightbox.querySelector('.lightbox__img');
  let lastFocused = null;

  const open = card => {
    lastFocused = card;
    title.textContent = card.dataset.title;
    type.textContent = card.dataset.type;
    location.textContent = card.dataset.location;
    image.style.backgroundImage = getComputedStyle(card.querySelector('.p-card__img')).backgroundImage;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox__close').focus();
  };

  const close = () => {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus();
  };

  document.getElementById('portfolio-grid').addEventListener('click', event => {
    const card = event.target.closest('.p-card[data-title]');
    if (card) open(card);
  });
  lightbox.querySelectorAll('[data-close]').forEach(element => element.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
}

/* ==========================================================================
   FORMULÁRIO DE ORÇAMENTO
   ========================================================================== */

const FORM_VALIDATORS = {
  nome: value => value.trim().length >= 3,
  telefone: value => /^[\d()\s+-]{8,}$/.test(value.trim()),
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  servico: value => value.trim().length > 0
};

function getSubmitErrorMessage(error){
  const code = error.code || '';
  const message = String(error.message || '').toLowerCase();
  if (code === '42P01' || (message.includes('solicitacoes') && message.includes('not found'))) {
    return 'O formulário ainda não está configurado no banco. Execute o arquivo supabase/schema.sql no Supabase.';
  }
  if (code === '42501' || message.includes('row-level security') || message.includes('permission')) {
    return 'O banco bloqueou o envio. Execute novamente a parte de políticas do arquivo supabase/schema.sql no Supabase.';
  }
  return 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
}

function initForm(){
  const form = document.getElementById('orcamento-form');
  if (!form) return;
  const feedback = document.getElementById('form-success');
  const submit = form.querySelector('[type="submit"]');

  const showFeedback = (message, isError = false) => {
    feedback.textContent = message;
    feedback.classList.toggle('is-error', isError);
    feedback.classList.toggle('is-visible', Boolean(message));
  };

  const validateField = field => {
    const rule = FORM_VALIDATORS[field.name];
    if (!rule) return true;
    const valid = rule(field.value);
    field.closest('.form__field').classList.toggle('has-error', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    return valid;
  };

  Object.keys(FORM_VALIDATORS).forEach(name => {
    const field = form.elements[name];
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form__field').classList.contains('has-error')) validateField(field);
    });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const fields = Object.keys(FORM_VALIDATORS).map(name => form.elements[name]);
    const invalid = fields.filter(field => !validateField(field));
    if (invalid.length) {
      showFeedback('');
      invalid[0].focus();
      return;
    }

    if (!supabaseClient) {
      showFeedback('Não foi possível conectar ao sistema. Tente novamente em instantes.', true);
      return;
    }

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    showFeedback('');

    let error;
    try {
      ({ error } = await supabaseClient.from('solicitacoes').insert({
        nome: form.nome.value.trim(),
        telefone: form.telefone.value.trim(),
        email: form.email.value.trim(),
        servico: form.servico.value,
        mensagem: form.mensagem.value.trim()
      }));
    } catch (requestError) {
      error = requestError;
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }

    if (error) {
      showFeedback(getSubmitErrorMessage(error), true);
      return;
    }

    showFeedback('Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.');
    form.reset();
  });
}
