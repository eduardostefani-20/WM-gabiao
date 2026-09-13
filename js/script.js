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

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initSmoothActiveNav();
  initReveal();
  initPortfolioFilter();
  initLightbox();
  initForm();
  initStats();
  initBackToTop();
  document.getElementById('year').textContent = new Date().getFullYear();
});

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

  form.addEventListener('submit', (e) => {
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

    /* Aqui deve ser integrado o envio real (API, e-mail, CRM etc.) */
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

  nums.forEach((el, i) => el.dataset.count = targets[i] ?? 0);

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
