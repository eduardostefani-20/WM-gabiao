/* ==========================================================================
   WM GABIÃO — script.js
   ========================================================================== */

/* --------------------------------------------------------------------------
   ÁREA DE CONFIGURAÇÃO — edite aqui os dados reais da empresa.
   Estes valores alimentam os indicadores da seção "Sobre" (#stats).
   Basta trocar os números quando a empresa fornecer os dados reais.
   -------------------------------------------------------------------------- */
const COMPANY_STATS = {
  obrasRealizadas: 25,
  projetosExecutados: 25,
  profissionais: 6
};

const SUPABASE_URL = 'https://qaflebsbbmjcmophlkbi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3Q5rEIIHV3hrATgSTR0Vaw_fX97rgxm';
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initSmoothActiveNav();
  initReveal();
  initForm();
  initBackToTop();
  document.getElementById('year').textContent = new Date().getFullYear();
  loadSiteContent().finally(() => {
    initPortfolioFilter();
    initLightbox();
    initStats();
  });
});

async function loadSiteContent(){
  if (!supabaseClient) return;
  const [contentResult, servicesResult, projectsResult] = await Promise.all([
    supabaseClient.from('site_content').select('content').eq('id', 'principal').maybeSingle(),
    supabaseClient.from('services').select('*').eq('active', true).order('sort_order'),
    supabaseClient.from('projects').select('*').eq('active', true).order('sort_order')
  ]);
  if (!contentResult.error && contentResult.data?.content) applySiteContent(contentResult.data.content);
  if (!servicesResult.error && servicesResult.data?.length) renderServices(servicesResult.data);
  if (!projectsResult.error && projectsResult.data?.length) renderProjects(projectsResult.data);
}

function applySiteContent(content){
  document.querySelectorAll('[data-content]').forEach(element => {
    const value = content[element.dataset.content];
    if (value !== undefined && value !== '') element.textContent = value;
  });
  if (content.phone){ document.querySelectorAll('a[href^="tel:"]').forEach(link => { link.href = `tel:${content.phone.replace(/\D/g, '')}`; }); }
  if (content.email){ document.querySelectorAll('a[href^="mailto:"]').forEach(link => { link.href = `mailto:${content.email}`; }); }
  if (content.whatsapp){ document.querySelectorAll('a[href*="wa.me"]').forEach(link => { link.href = `https://wa.me/${content.whatsapp.replace(/\D/g, '')}`; }); }
  if (content.instagram){ document.querySelectorAll('a[href*="instagram.com"]').forEach(link => { link.href = content.instagram.startsWith('http') ? content.instagram : `https://instagram.com/${content.instagram.replace('@', '')}`; }); }
  if (content.hero_image) document.querySelector('.hero__bg').style.backgroundImage = `url("${content.hero_image.replaceAll('"', '')}")`;
  if (content.about_image) document.querySelector('.sobre__img').style.backgroundImage = `url("${content.about_image.replaceAll('"', '')}")`;
  if (content.budget_image) document.querySelector('.orcamento__bg').style.backgroundImage = `url("${content.budget_image.replaceAll('"', '')}")`;
  const stats = document.querySelectorAll('.stat__num:not(.stat__num--text)');
  [content.stats_works, content.stats_projects, content.stats_people].forEach((value, index) => { if (value !== undefined && stats[index]) stats[index].dataset.count = value; });
  if (content.stats_area) document.querySelector('.stat__num--text').textContent = content.stats_area;
}

function renderServices(items){
  const grid = document.querySelector('#solucoes .cards-grid');
  grid.replaceChildren();
  items.forEach(item => {
    const article = document.createElement('article'); article.className = 's-card';
    const image = document.createElement('div'); image.className = 's-card__img ph-image'; image.setAttribute('role', 'img'); image.setAttribute('aria-label', item.title);
    if (item.image_url) image.style.backgroundImage = `url("${item.image_url.replaceAll('"', '')}")`;
    const body = document.createElement('div'); body.className = 's-card__body';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('class', 'icon icon--gold'); icon.setAttribute('viewBox', '0 0 24 24'); const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', `#${item.icon || 'icon-wall'}`); icon.append(use);
    const title = document.createElement('h3'); title.textContent = item.title; const description = document.createElement('p'); description.textContent = item.description; body.append(icon, title, description); article.append(image, body); grid.append(article);
  });
}

function renderProjects(items){
  const grid = document.getElementById('portfolio-grid'); const more = document.getElementById('ver-todas'); grid.replaceChildren();
  items.forEach(item => {
    const card = document.createElement('button'); card.className = 'p-card'; card.dataset.filter = item.category; card.dataset.title = item.title; card.dataset.type = item.type_label || item.category; card.dataset.location = item.location;
    const image = document.createElement('span'); image.className = 'p-card__img ph-image'; image.setAttribute('role', 'img'); image.setAttribute('aria-label', item.title); if (item.image_url) image.style.backgroundImage = `url("${item.image_url.replaceAll('"', '')}")`;
    const info = document.createElement('span'); info.className = 'p-card__info'; const title = document.createElement('strong'); title.textContent = item.title; const detail = document.createElement('small'); detail.textContent = `${item.type_label || item.category} · ${item.location}`; info.append(title, detail); card.append(image, info); grid.append(card);
  });
  if (more) grid.append(more);
}

/* ---------- Header: fundo sólido ao rolar ---------- */
function initHeader(){
  const header = document.getElementById('header');
  const toggle = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive:true });
}

/* ---------- Menu mobile ---------- */
function initMobileMenu(){
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');

  const close = () => {
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded','false');
  };

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
}

/* ---------- Nav ativo conforme seção visível ---------- */
function initSmoothActiveNav(){
  const links = document.querySelectorAll('.nav__link');
  const sections = Array.from(links)
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const id = '#' + entry.target.id;
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Animações leves ao aparecer na tela ---------- */
function initReveal(){
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });

  items.forEach(el => observer.observe(el));
}

/* ---------- Filtro do portfólio de obras ---------- */
function initPortfolioFilter(){
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.p-card[data-filter]');

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const value = btn.dataset.filter;
      cards.forEach(card => {
        const show = value === 'todos' || card.dataset.filter === value;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  const verTodas = document.getElementById('ver-todas');
  if (verTodas){
    verTodas.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('[data-filter="todos"]').click();
    });
  }
}

/* ---------- Lightbox das obras ---------- */
function initLightbox(){
  const lightbox = document.getElementById('lightbox');
  const title = document.getElementById('lightbox-title');
  const type = document.getElementById('lightbox-type');
  const location = document.getElementById('lightbox-location');
  const image = lightbox.querySelector('.lightbox__img');
  const cards = document.querySelectorAll('.p-card[data-title]');

  const open = (card) => {
    title.textContent = card.dataset.title;
    type.textContent = card.dataset.type;
    location.textContent = card.dataset.location;
    image.style.backgroundImage = getComputedStyle(card.querySelector('.p-card__img')).backgroundImage;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  cards.forEach(card => card.addEventListener('click', () => open(card)));
  lightbox.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ---------- Validação do formulário de orçamento ---------- */
function initForm(){
  const form = document.getElementById('orcamento-form');
  if (!form) return;
  const success = document.getElementById('form-success');

  const validators = {
    nome: v => v.trim().length >= 3,
    telefone: v => /^[\d()\s+-]{8,}$/.test(v.trim()),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    servico: v => v.trim().length > 0
  };

  const validateField = (field) => {
    const wrapper = field.closest('.form__field');
    const rule = validators[field.name];
    if (!rule) return true;
    const valid = rule(field.value);
    wrapper.classList.toggle('has-error', !valid);
    return valid;
  };

  form.querySelectorAll('input, select').forEach(field => {
    if (validators[field.name]){
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.form__field').classList.contains('has-error')) validateField(field);
      });
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('input[required], select[required]').forEach(field => {
      if (!validateField(field)) valid = false;
    });

    if (!valid){
      success.classList.remove('is-visible');
      const firstError = form.querySelector('.has-error');
      if (firstError) firstError.querySelector('input,select')?.focus();
      return;
    }

    if (!supabaseClient){
      success.textContent = 'Não foi possível conectar ao sistema. Tente novamente em instantes.';
      success.classList.add('is-visible');
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    success.classList.remove('is-visible');

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
    }

    submit.disabled = false;
    submit.removeAttribute('aria-busy');

    if (error){
      const errorCode = error.code || '';
      const errorMessage = String(error.message || '').toLowerCase();
      if (errorCode === '42P01' || errorMessage.includes('solicitacoes') && errorMessage.includes('not found')) {
        success.textContent = 'O formulário ainda não está configurado no banco. Execute o arquivo supabase/schema.sql no Supabase.';
      } else if (errorCode === '42501' || errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
        success.textContent = 'O banco bloqueou o envio. Execute novamente a parte de políticas do arquivo supabase/schema.sql no Supabase.';
      } else {
        success.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
      }
      success.classList.add('is-visible');
      return;
    }

    success.textContent = 'Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.';
    success.classList.add('is-visible');
    form.reset();
  });
}

/* ---------- Indicadores (contadores) da seção Sobre ---------- */
function initStats(){
  const nums = document.querySelectorAll('.stat__num:not(.stat__num--text)');
  if (!nums.length) return;

  const targets = [
    COMPANY_STATS.obrasRealizadas,
    COMPANY_STATS.projetosExecutados,
    COMPANY_STATS.profissionais
  ];

  nums.forEach((el, i) => { if (!el.dataset.count) el.dataset.count = targets[i] ?? 0; });

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 900;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = '+ ' + Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = '+ ' + target;
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animate(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold:0.5 });

  nums.forEach(el => observer.observe(el));
}

/* ---------- Botão voltar ao topo ---------- */
function initBackToTop(){
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive:true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top:0, behavior:'smooth' });
  });
}
