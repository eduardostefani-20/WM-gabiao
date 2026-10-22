/* ==========================================================================
   WM GABIÃO — script.js
   Depende de js/config.js (supabaseClient) e js/data.js (conteúdo padrão).
   ========================================================================== */

const site = {
  content: { ...DEFAULT_CONTENT },
  projects: DEFAULT_PROJECTS,
  clients: DEFAULT_CLIENTS
};

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  initMobileMenu();
  initActiveNav();
  initForm();
  initModal();
  initPdfDownload();
  document.getElementById('year').textContent = new Date().getFullYear();

  renderAll();
  initReveal();
  initStats();
  loadFromDatabase();
});

/* ==========================================================================
   DADOS (Supabase)
   ========================================================================== */

async function loadFromDatabase(){
  if (!supabaseClient) return;
  try {
    const [content, projects, clients] = await Promise.all([
      supabaseClient.from('site_content').select('content').eq('id', 'principal').maybeSingle(),
      supabaseClient.from('portfolio_projects').select('*').eq('active', true).order('sort_order'),
      supabaseClient.from('clients').select('*').eq('active', true).order('sort_order')
    ]);
    let changed = false;
    if (!content.error && content.data?.content) {
      Object.entries(content.data.content).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) site.content[key] = value;
      });
      changed = true;
    }
    if (!projects.error && projects.data?.length) { site.projects = projects.data; changed = true; }
    if (!clients.error && clients.data?.length) { site.clients = clients.data; changed = true; }
    if (changed) renderAll();
  } catch {
    // Sem conexão com o banco: mantém o conteúdo padrão.
  }
}

/* ==========================================================================
   RENDERIZAÇÃO
   ========================================================================== */

function renderAll(){
  applyContent();
  renderSolutions();
  renderProjects();
  renderClients();
}

function onlyDigits(value){
  return String(value || '').replace(/\D/g, '');
}

function cssUrl(url){
  return `url("${String(url).replaceAll('"', '')}")`;
}

function applyContent(){
  const content = site.content;
  document.querySelectorAll('[data-text]').forEach(element => { element.textContent = content[element.dataset.text] ?? ''; });
  document.querySelectorAll('[data-image]').forEach(element => {
    const url = content[element.dataset.image];
    if (url) element.style.backgroundImage = cssUrl(url);
  });
  document.querySelectorAll('[data-count]').forEach(element => {
    element.dataset.target = content[element.dataset.count] || '0';
    if (!element.textContent) element.textContent = element.dataset.target;
  });

  const instagram = content.instagram?.startsWith('http')
    ? content.instagram
    : `https://instagram.com/${String(content.instagram || '').replace('@', '')}`;
  const links = {
    '[data-whatsapp]': `https://wa.me/${onlyDigits(content.whatsapp)}`,
    '[data-tel]': `tel:+${onlyDigits(content.whatsapp)}`,
    '[data-mail]': `mailto:${content.email}`,
    '[data-instagram]': instagram
  };
  Object.entries(links).forEach(([selector, href]) => {
    document.querySelectorAll(selector).forEach(link => {
      link.href = href;
      if (href.startsWith('http')) { link.target = '_blank'; link.rel = 'noopener'; }
    });
  });
}

function createElement(tag, className, text){
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function pad(number){
  return String(number).padStart(2, '0');
}

function renderSolutions(){
  const grid = document.getElementById('solutions-grid');
  grid.replaceChildren(...DEFAULT_SOLUTIONS.map((solution, index) => {
    const card = createElement('article', 'solution');
    card.append(
      createElement('span', 'solution__number', pad(index + 1)),
      createElement('h3', '', solution.title),
      createElement('p', '', solution.text)
    );
    return card;
  }));
}

function projectImages(project){
  return Array.isArray(project.images) ? project.images.filter(Boolean) : [];
}

function renderProjects(){
  const grid = document.getElementById('projects-grid');
  const cards = site.projects.map((project, index) => {
    const card = createElement('button', 'project');
    card.type = 'button';
    card.dataset.index = index;
    card.dataset.system = project.system;

    const image = createElement('img', 'project__image');
    image.src = projectImages(project)[0] || '';
    image.alt = project.title;
    image.loading = 'lazy';

    const info = createElement('span', 'project__info');
    info.append(
      createElement('span', 'project__system', project.system),
      createElement('span', 'project__title', project.title),
      createElement('span', 'project__location', project.location)
    );

    card.append(
      image,
      createElement('span', 'project__shade'),
      createElement('span', 'project__number', pad(index + 1)),
      createElement('span', 'project__more', '+'),
      info
    );
    return card;
  });
  grid.replaceChildren(...cards);
  renderFilters();
}

function renderFilters(){
  const container = document.getElementById('portfolio-filters');
  const systems = ['Todos', ...new Set(site.projects.map(project => project.system).filter(Boolean))];
  container.replaceChildren(...systems.map((system, index) => {
    const button = createElement('button', `filter${index === 0 ? ' is-active' : ''}`, system);
    button.type = 'button';
    button.addEventListener('click', () => {
      container.querySelectorAll('.filter').forEach(item => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('.project').forEach(card => {
        card.classList.toggle('is-hidden', index !== 0 && card.dataset.system !== system);
      });
    });
    return button;
  }));
}

function initials(name){
  const words = name.split(/\s+/).filter(word => word.length > 2 || /\d/.test(word));
  // Siglas como "V4" ou "TRM" ficam inteiras.
  if (/^[A-Z0-9]{2,3}$/.test(words[0])) return words[0];
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

function renderClients(){
  const track = document.getElementById('clients-track');
  const createClient = client => {
    const item = createElement('figure', 'client');
    const logoBox = createElement('span', 'client__logo');
    if (client.logo_url) {
      const logo = createElement('img');
      logo.src = client.logo_url;
      logo.alt = '';
      logo.loading = 'lazy';
      logoBox.append(logo);
    } else {
      logoBox.append(createElement('span', 'client__monogram', initials(client.name)));
    }
    item.append(logoBox, createElement('figcaption', 'client__name', client.name));
    return item;
  };
  // A lista é duplicada para a faixa girar sem emendas.
  const items = [...site.clients, ...site.clients].map(createClient);
  items.slice(site.clients.length).forEach(item => item.setAttribute('aria-hidden', 'true'));
  track.replaceChildren(...items);
}

/* ==========================================================================
   MODAL DA OBRA
   ========================================================================== */

function initModal(){
  const modal = document.getElementById('project-modal');
  const mainImage = document.getElementById('modal-image');
  const thumbs = document.getElementById('modal-thumbs');
  let lastFocused = null;

  const showImage = (url, button) => {
    mainImage.src = url;
    thumbs.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
  };

  const open = (project, trigger) => {
    lastFocused = trigger;
    const images = projectImages(project);
    document.getElementById('modal-system').textContent = project.system;
    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-location').textContent = project.location;
    document.getElementById('modal-clients').textContent = project.clients;
    document.getElementById('modal-clients-row').hidden = !project.clients;
    document.getElementById('modal-description').textContent = project.description;
    mainImage.alt = project.title;

    thumbs.replaceChildren(...(images.length > 1 ? images : []).map(url => {
      const button = createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Ver foto');
      const image = createElement('img');
      image.src = url;
      image.alt = '';
      button.append(image);
      button.addEventListener('click', () => showImage(url, button));
      return button;
    }));
    showImage(images[0] || '', thumbs.firstElementChild);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__close').focus();
  };

  const close = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus();
  };

  document.getElementById('projects-grid').addEventListener('click', event => {
    const card = event.target.closest('.project');
    if (card) open(site.projects[card.dataset.index], card);
  });
  modal.querySelectorAll('[data-close]').forEach(element => element.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
}

/* ==========================================================================
   PORTFÓLIO EM PDF
   ========================================================================== */

function initPdfDownload(){
  const button = document.getElementById('download-pdf');
  const label = button.lastChild;
  const originalText = label.textContent;

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await PdfPortfolio.generate({
        content: site.content,
        projects: site.projects.filter(project => projectImages(project).length),
        clients: site.clients,
        onProgress: step => { label.textContent = ` Gerando PDF — ${step}...`; }
      });
      label.textContent = originalText;
    } catch {
      label.textContent = ' Não foi possível gerar o PDF. Tente novamente.';
    } finally {
      button.disabled = false;
    }
  });
}

/* ==========================================================================
   NAVEGAÇÃO E ANIMAÇÕES
   ========================================================================== */

function initHeader(){
  const header = document.getElementById('header');
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMobileMenu(){
  const button = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  const setOpen = isOpen => {
    menu.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  button.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
}

function initActiveNav(){
  const links = document.querySelectorAll('.nav__link');
  const sections = Array.from(links).map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(section => observer.observe(section));
}

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
  onceVisible(document.querySelectorAll('[data-reveal]'), element => element.classList.add('is-visible'), 0.12);
}

function initStats(){
  const animate = element => {
    const target = parseInt(element.dataset.target, 10) || 0;
    const start = performance.now();
    const step = now => {
      const progress = Math.min((now - start) / 1200, 1);
      element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  onceVisible(document.querySelectorAll('[data-count]'), animate, 0.5);
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

function initForm(){
  const form = document.getElementById('orcamento-form');
  const feedback = document.getElementById('form-feedback');
  const submit = form.querySelector('[type="submit"]');

  const showFeedback = (message, isError = false) => {
    feedback.textContent = message;
    feedback.classList.toggle('is-error', isError);
    feedback.classList.toggle('is-visible', Boolean(message));
  };

  const validateField = field => {
    const valid = FORM_VALIDATORS[field.name](field.value);
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
    const invalid = Object.keys(FORM_VALIDATORS).map(name => form.elements[name]).filter(field => !validateField(field));
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
    }

    if (error) {
      showFeedback('Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.', true);
      return;
    }
    showFeedback('Solicitação recebida. Nossa equipe técnica retornará em breve.');
    form.reset();
  });
}
