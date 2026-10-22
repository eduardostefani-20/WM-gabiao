/* ==========================================================================
   WM GABIÃO — admin.js
   Painel: solicitações, textos/fotos do site, portfólio e clientes.
   Depende de js/config.js (supabaseClient) e js/data.js (conteúdo padrão).
   ========================================================================== */

const MEDIA_BUCKET = 'site-media';

/* Campos editáveis na aba "Textos e fotos" */
const CONTENT_GROUPS = [
  { title: 'Abertura (topo do site)', wide: true, fields: [
    ['hero_eyebrow', 'Frase acima do título'],
    ['hero_title', 'Título principal', 'textarea'],
    ['hero_text', 'Texto de apoio', 'textarea'],
    ['hero_image', 'Foto de fundo', 'image']
  ] },
  { title: 'Indicadores', fields: [
    ['stats_works', 'Obras entregues'],
    ['stats_projects', 'Projetos executados'],
    ['stats_people', 'Especialistas'],
    ['stats_area', 'Área de atuação']
  ] },
  { title: 'Manifesto', fields: [
    ['manifesto', 'Texto de destaque', 'textarea']
  ] },
  { title: 'Soluções e portfólio', fields: [
    ['solutions_title', 'Título de soluções'],
    ['solutions_text', 'Texto de soluções', 'textarea'],
    ['portfolio_title', 'Título do portfólio'],
    ['portfolio_text', 'Texto do portfólio', 'textarea']
  ] },
  { title: 'A empresa', fields: [
    ['about_eyebrow', 'Frase acima do título'],
    ['about_title', 'Título'],
    ['about_text', 'Texto', 'textarea'],
    ['about_image', 'Foto', 'image']
  ] },
  { title: 'Proposta e clientes', fields: [
    ['clients_title', 'Título da faixa de clientes'],
    ['budget_title', 'Título da proposta', 'textarea'],
    ['budget_text', 'Texto da proposta', 'textarea'],
    ['budget_image', 'Foto de fundo', 'image']
  ] },
  { title: 'Contato e rodapé', fields: [
    ['phone', 'Telefone (exibido)'],
    ['whatsapp', 'WhatsApp com DDI (ex.: 5515991167340)'],
    ['email', 'E-mail'],
    ['instagram', 'Instagram (usuário ou link)'],
    ['location', 'Abrangência'],
    ['hours', 'Horário'],
    ['footer_text', 'Texto do rodapé', 'textarea']
  ] }
];

const state = {
  requests: [],
  content: { ...DEFAULT_CONTENT },
  projects: [],
  clients: [],
  editing: null
};

const $ = id => document.getElementById(id);
let dashboardVisible = false;

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

function showMessage(element, message, isError = false){
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function createElement(tag, className, text){
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createButton(className, text, onClick){
  const button = createElement('button', className, text);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function formatDate(value){
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function normalizeStatus(status){
  return String(status || '').toLowerCase() === 'atendido' ? 'atendido' : 'pendente';
}

/* Reduz fotos grandes antes do envio (máx. 1600 px, JPEG). */
async function resizeImage(file, maxSize = 1600){
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 900_000) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const keepPng = file.type === 'image/png' && maxSize < 1000;
  return new Promise(resolve => canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.82));
}

/* Envia um arquivo ao Storage e devolve a URL pública. */
async function uploadFile(file, folder, maxSize){
  const blob = await resizeImage(file, maxSize);
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/svg+xml' ? 'svg' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabaseClient.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return supabaseClient.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ==========================================================================
   NAVEGAÇÃO
   ========================================================================== */

function showTab(name){
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === name));
  document.querySelectorAll('[data-panel]').forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.panel !== name));
}

function showDashboard(){
  if (dashboardVisible) return;
  dashboardVisible = true;
  $('login-panel').classList.add('is-hidden');
  $('dashboard').classList.remove('is-hidden');
  loadRequests();
  loadContent();
  loadProjects();
  loadClients();
}

function showLogin(){
  dashboardVisible = false;
  $('dashboard').classList.add('is-hidden');
  $('login-panel').classList.remove('is-hidden');
}

/* ==========================================================================
   SOLICITAÇÕES
   ========================================================================== */

function createDetail(label, value){
  const wrapper = document.createElement('div');
  wrapper.append(createElement('strong', '', label), createElement('span', '', value || 'Não informado'));
  return wrapper;
}

function renderRequests(){
  const pending = state.requests.filter(request => normalizeStatus(request.status) === 'pendente').length;
  $('total-count').textContent = state.requests.length;
  $('pending-count').textContent = pending;
  $('done-count').textContent = state.requests.length - pending;
  $('pending-badge').textContent = pending || '';

  const search = $('search-input').value.trim().toLocaleLowerCase();
  const status = $('status-filter').value;
  const filtered = state.requests.filter(request => {
    const matchesStatus = status === 'todos' || normalizeStatus(request.status) === status;
    const text = [request.nome, request.email, request.servico, request.telefone].join(' ').toLocaleLowerCase();
    return matchesStatus && text.includes(search);
  });

  if (!filtered.length) {
    $('request-list').replaceChildren(createElement('p', 'empty', state.requests.length ? 'Nenhuma solicitação corresponde aos filtros.' : 'Nenhuma solicitação recebida ainda.'));
    return;
  }

  $('request-list').replaceChildren(...filtered.map(request => {
    const status = normalizeStatus(request.status);
    const card = createElement('article', 'request');
    const head = createElement('div', 'request__head');
    head.append(createElement('h3', '', request.nome || 'Solicitante sem nome'), createElement('span', `badge badge--${status}`, status === 'atendido' ? 'Atendido' : 'Pendente'));

    const details = createElement('div', 'request__details');
    details.append(
      createDetail('Serviço', request.servico),
      createDetail('Telefone', request.telefone),
      createDetail('E-mail', request.email),
      createDetail('Recebido', formatDate(request.created_at))
    );

    const actions = createElement('div', 'request__actions');
    actions.append(
      createButton('btn btn--ghost btn--sm', status === 'atendido' ? 'Marcar pendente' : 'Marcar atendido', () => toggleRequest(request)),
      createButton('btn btn--danger btn--sm', 'Excluir', () => deleteRequest(request))
    );

    card.append(head, details, createElement('p', 'request__message', request.mensagem || 'Nenhuma mensagem adicional.'), actions);
    return card;
  }));
}

async function loadRequests(){
  showMessage($('requests-message'), 'Carregando...');
  const { data, error } = await supabaseClient.from('solicitacoes').select('*').order('created_at', { ascending: false });
  if (error) return showMessage($('requests-message'), 'Não foi possível carregar as solicitações. Verifique se este usuário é administrador.', true);
  state.requests = data || [];
  showMessage($('requests-message'), '');
  renderRequests();
}

async function toggleRequest(request){
  const next = normalizeStatus(request.status) === 'atendido' ? 'pendente' : 'atendido';
  const { error } = await supabaseClient.from('solicitacoes').update({ status: next }).eq('id', request.id);
  if (error) return showMessage($('requests-message'), 'Não foi possível atualizar o status.', true);
  request.status = next;
  renderRequests();
}

async function deleteRequest(request){
  if (!window.confirm(`Excluir a solicitação de ${request.nome || 'solicitante sem nome'}?`)) return;
  const { error } = await supabaseClient.from('solicitacoes').delete().eq('id', request.id);
  if (error) return showMessage($('requests-message'), 'Não foi possível excluir a solicitação.', true);
  state.requests = state.requests.filter(item => item.id !== request.id);
  renderRequests();
}

/* ==========================================================================
   TEXTOS E FOTOS
   ========================================================================== */

function createImageField(key, label){
  const field = createElement('div', 'field');
  const preview = createElement('img');
  preview.alt = '';
  preview.src = state.content[key] || '';
  const input = createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    showMessage($('content-message'), 'Enviando foto...');
    try {
      state.content[key] = await uploadFile(file, 'site');
      preview.src = state.content[key];
      showMessage($('content-message'), 'Foto enviada. Clique em "Salvar alterações" para publicar.');
    } catch {
      showMessage($('content-message'), 'Não foi possível enviar a foto.', true);
    }
  });
  const row = createElement('div', 'image-field');
  row.append(preview, input);
  field.append(createElement('span', '', label), row);
  return field;
}

function renderContentForm(){
  const form = $('content-form');
  form.replaceChildren(...CONTENT_GROUPS.map(group => {
    const fieldset = createElement('fieldset', `group${group.wide ? ' group--wide' : ''}`);
    fieldset.append(createElement('legend', '', group.title));
    group.fields.forEach(([key, label, type]) => {
      if (type === 'image') return fieldset.append(createImageField(key, label));
      const field = createElement('label', 'field');
      const input = createElement(type === 'textarea' ? 'textarea' : 'input');
      input.name = key;
      input.value = state.content[key] ?? '';
      if (type === 'textarea') input.rows = 3;
      field.append(createElement('span', '', label), input);
      fieldset.append(field);
    });
    return fieldset;
  }));
}

async function loadContent(){
  const { data } = await supabaseClient.from('site_content').select('content').eq('id', 'principal').maybeSingle();
  // Mantém apenas as chaves usadas pelo site atual.
  Object.keys(DEFAULT_CONTENT).forEach(key => {
    const value = data?.content?.[key];
    if (value !== undefined && value !== '') state.content[key] = value;
  });
  renderContentForm();
}

async function saveContent(event){
  event.preventDefault();
  new FormData($('content-form')).forEach((value, key) => { state.content[key] = String(value).trim(); });
  showMessage($('content-message'), 'Salvando...');
  const { error } = await supabaseClient.from('site_content').upsert({ id: 'principal', content: state.content, updated_at: new Date().toISOString() });
  if (error) return showMessage($('content-message'), 'Não foi possível salvar. Verifique sua conexão e tente novamente.', true);
  showMessage($('content-message'), 'Alterações publicadas no site.');
}

/* ==========================================================================
   PORTFÓLIO
   ========================================================================== */

function renderProjects(){
  $('systems-list').replaceChildren(...[...new Set(state.projects.map(project => project.system))].map(system => {
    const option = document.createElement('option');
    option.value = system;
    return option;
  }));

  if (!state.projects.length) {
    $('project-list').replaceChildren(createElement('p', 'empty', 'Nenhuma obra cadastrada. Clique em "+ Nova obra".'));
    return;
  }
  $('project-list').replaceChildren(...state.projects.map(project => {
    const card = createElement('button', `project-card${project.active ? '' : ' is-draft'}`);
    card.type = 'button';
    const image = createElement('img');
    image.src = project.images?.[0] || '';
    image.alt = '';
    image.loading = 'lazy';
    const body = createElement('span', 'project-card__body');
    const meta = createElement('span', 'project-card__meta');
    meta.append(createElement('span', '', project.location || '—'), createElement('span', '', project.active ? `${project.images?.length || 0} fotos` : 'Oculta'));
    body.append(createElement('span', 'project-card__system', project.system), createElement('span', 'project-card__title', project.title), meta);
    card.append(image, body);
    card.addEventListener('click', () => openProject(project));
    return card;
  }));
}

async function loadProjects(){
  const { data, error } = await supabaseClient.from('portfolio_projects').select('*').order('sort_order').order('id');
  if (error) return showMessage($('projects-message'), 'Não foi possível carregar o portfólio.', true);
  state.projects = data || [];
  renderProjects();
}

function renderPhotos(){
  const images = state.editing.images;
  $('photo-grid').replaceChildren(...images.map((url, index) => {
    const photo = createElement('div', 'photo');
    const image = createElement('img');
    image.src = url;
    image.alt = '';
    const actions = createElement('div', 'photo__actions');
    if (index > 0) {
      actions.append(createButton('', '★', () => {
        images.unshift(...images.splice(index, 1));
        renderPhotos();
      }));
      actions.lastChild.title = 'Usar como capa';
    }
    actions.append(createButton('', '✕', () => {
      images.splice(index, 1);
      renderPhotos();
    }));
    actions.lastChild.title = 'Remover foto';
    photo.append(image, actions);
    return photo;
  }));
}

function openProject(project){
  const form = $('project-form');
  state.editing = project
    ? { ...project, images: [...(project.images || [])] }
    : { title: '', system: '', location: '', clients: '', description: '', images: [], active: true, sort_order: state.projects.length + 1 };
  $('drawer-title').textContent = project ? 'Editar obra' : 'Nova obra';
  ['title', 'system', 'location', 'clients', 'description', 'sort_order'].forEach(name => { form.elements[name].value = state.editing[name] ?? ''; });
  form.elements.active.checked = state.editing.active !== false;
  $('delete-project').classList.toggle('is-hidden', !project);
  showMessage($('drawer-message'), '');
  renderPhotos();
  $('project-drawer').classList.add('is-open');
  $('project-drawer').setAttribute('aria-hidden', 'false');
  form.elements.title.focus();
}

function closeProject(){
  $('project-drawer').classList.remove('is-open');
  $('project-drawer').setAttribute('aria-hidden', 'true');
  state.editing = null;
}

async function addPhotos(){
  const files = [...$('photo-input').files];
  $('photo-input').value = '';
  if (!files.length) return;
  showMessage($('drawer-message'), `Enviando ${files.length} foto(s)...`);
  try {
    for (const file of files) state.editing.images.push(await uploadFile(file, 'portfolio'));
    renderPhotos();
    showMessage($('drawer-message'), 'Fotos enviadas. Salve a obra para publicar.');
  } catch {
    showMessage($('drawer-message'), 'Não foi possível enviar uma das fotos.', true);
  }
}

async function saveProject(event){
  event.preventDefault();
  const form = $('project-form');
  const project = {
    title: form.elements.title.value.trim(),
    system: form.elements.system.value.trim(),
    location: form.elements.location.value.trim(),
    clients: form.elements.clients.value.trim(),
    description: form.elements.description.value.trim(),
    sort_order: Number(form.elements.sort_order.value) || 0,
    active: form.elements.active.checked,
    images: state.editing.images,
    updated_at: new Date().toISOString()
  };
  if (!project.images.length) return showMessage($('drawer-message'), 'Adicione pelo menos uma foto.', true);

  showMessage($('drawer-message'), 'Salvando...');
  const query = state.editing.id
    ? supabaseClient.from('portfolio_projects').update(project).eq('id', state.editing.id)
    : supabaseClient.from('portfolio_projects').insert(project);
  const { error } = await query;
  if (error) return showMessage($('drawer-message'), 'Não foi possível salvar a obra.', true);
  closeProject();
  await loadProjects();
  showMessage($('projects-message'), 'Obra salva e publicada.');
}

async function deleteProject(){
  if (!state.editing?.id || !window.confirm(`Excluir a obra "${state.editing.title}"?`)) return;
  const { error } = await supabaseClient.from('portfolio_projects').delete().eq('id', state.editing.id);
  if (error) return showMessage($('drawer-message'), 'Não foi possível excluir a obra.', true);
  closeProject();
  await loadProjects();
  showMessage($('projects-message'), 'Obra excluída.');
}

/* ==========================================================================
   CLIENTES
   ========================================================================== */

function renderClients(){
  if (!state.clients.length) {
    $('client-list').replaceChildren(createElement('p', 'empty', 'Nenhum cliente cadastrado.'));
    return;
  }
  $('client-list').replaceChildren(...state.clients.map((client, index) => {
    const row = createElement('div', 'client-row');
    const logo = createElement('span', 'client-row__logo');
    if (client.logo_url) {
      const image = createElement('img');
      image.src = client.logo_url;
      image.alt = '';
      logo.append(image);
    } else {
      logo.textContent = client.name.slice(0, 2).toUpperCase();
    }
    const actions = createElement('div', 'client-row__actions');
    actions.append(
      createButton('btn btn--ghost btn--sm', '↑', () => moveClient(index, -1)),
      createButton('btn btn--ghost btn--sm', '↓', () => moveClient(index, 1)),
      createButton('btn btn--danger btn--sm', 'Remover', () => deleteClient(client))
    );
    row.append(logo, createElement('strong', '', client.name), actions);
    return row;
  }));
}

async function loadClients(){
  const { data, error } = await supabaseClient.from('clients').select('*').order('sort_order').order('id');
  if (error) return showMessage($('clients-message'), 'Não foi possível carregar os clientes.', true);
  state.clients = data || [];
  renderClients();
}

async function addClient(event){
  event.preventDefault();
  const form = $('client-form');
  const name = form.elements.name.value.trim();
  if (!name) return;
  showMessage($('clients-message'), 'Salvando...');
  try {
    const file = form.elements.logo.files[0];
    const logo_url = file ? await uploadFile(file, 'clients', 600) : '';
    const sort_order = (state.clients.at(-1)?.sort_order || 0) + 1;
    const { error } = await supabaseClient.from('clients').insert({ name, logo_url, sort_order });
    if (error) throw error;
    form.reset();
    await loadClients();
    showMessage($('clients-message'), 'Cliente adicionado à faixa do site.');
  } catch {
    showMessage($('clients-message'), 'Não foi possível adicionar o cliente.', true);
  }
}

async function moveClient(index, direction){
  const target = index + direction;
  if (target < 0 || target >= state.clients.length) return;
  const [a, b] = [state.clients[index], state.clients[target]];
  const results = await Promise.all([
    supabaseClient.from('clients').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabaseClient.from('clients').update({ sort_order: a.sort_order }).eq('id', b.id)
  ]);
  if (results.some(result => result.error)) return showMessage($('clients-message'), 'Não foi possível reordenar.', true);
  [a.sort_order, b.sort_order] = [b.sort_order, a.sort_order];
  state.clients.sort((x, y) => x.sort_order - y.sort_order);
  renderClients();
}

async function deleteClient(client){
  if (!window.confirm(`Remover "${client.name}" da faixa de clientes?`)) return;
  const { error } = await supabaseClient.from('clients').delete().eq('id', client.id);
  if (error) return showMessage($('clients-message'), 'Não foi possível remover o cliente.', true);
  state.clients = state.clients.filter(item => item.id !== client.id);
  renderClients();
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

function initAdmin(){
  if (!supabaseClient) {
    showMessage($('login-message'), 'Não foi possível carregar o sistema. Verifique sua conexão e recarregue a página.', true);
    return;
  }

  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
  $('search-input').addEventListener('input', renderRequests);
  $('status-filter').addEventListener('change', renderRequests);
  $('refresh-button').addEventListener('click', loadRequests);
  $('content-form').addEventListener('submit', saveContent);
  $('new-project').addEventListener('click', () => openProject(null));
  $('project-form').addEventListener('submit', saveProject);
  $('photo-input').addEventListener('change', addPhotos);
  $('delete-project').addEventListener('click', deleteProject);
  $('project-drawer').querySelectorAll('[data-close]').forEach(element => element.addEventListener('click', closeProject));
  $('client-form').addEventListener('submit', addClient);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && state.editing) closeProject(); });

  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: $('login-email').value.trim(),
      password: $('login-password').value
    });
    if (error) {
      const message = String(error.message || '').toLowerCase();
      return showMessage($('login-message'), message.includes('email not confirmed') ? 'Confirme o e-mail da conta antes de entrar.' : 'E-mail ou senha incorretos.', true);
    }
    showMessage($('login-message'), '');
    $('login-form').reset();
    showDashboard();
  });

  $('logout-button').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLogin();
  });

  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) showDashboard();
  });
}

initAdmin();
