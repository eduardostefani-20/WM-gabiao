const SUPABASE_URL = 'https://qaflebsbbmjcmophlkbi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3Q5rEIIHV3hrATgSTR0Vaw_fX97rgxm';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const MEDIA_BUCKET = 'site-media';

const loginPanel = document.getElementById('login-panel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const dashboardMessage = document.getElementById('dashboard-message');
let requests = [];
let services = [];
let projects = [];
let dashboardInitialized = false;

function showMessage(element, message, isError = false){
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function formDataObject(form){
  return Object.fromEntries(new FormData(form).entries());
}

function previewFile(input, preview){
  const file = input.files?.[0];
  if (!file) return;
  const isVideo = file.type.startsWith('video/');
  if (isVideo && preview.tagName !== 'VIDEO') {
    const video = document.createElement('video');
    video.className = preview.className;
    video.alt = preview.alt;
    video.controls = true;
    preview.replaceWith(video);
    preview = video;
  } else if (!isVideo && preview.tagName === 'VIDEO') {
    const image = document.createElement('img');
    image.className = preview.className;
    image.alt = preview.alt;
    preview.replaceWith(image);
    preview = image;
  }
  preview.src = URL.createObjectURL(file);
  preview.classList.add('is-visible');
}

async function uploadMedia(file){
  if (!file) return null;
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Escolha uma imagem ou vídeo válido.');
  if (file.size > 25 * 1024 * 1024) throw new Error('O arquivo deve ter no máximo 25 MB.');
  const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseClient.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return supabaseClient.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

function showDashboard(){
  if (dashboardInitialized) return;
  dashboardInitialized = true;
  loginPanel.classList.add('is-hidden');
  dashboard.classList.remove('is-hidden');
  loadRequests();
  loadContent();
  loadCatalog();
}

function activatePanel(panelId){
  document.querySelectorAll('.admin-tab').forEach(tab => {
    const active = tab.dataset.panel === panelId;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.dashboard > section[role="tabpanel"]').forEach(panel => {
    const active = panel.id === panelId;
    panel.classList.toggle('is-hidden', !active);
    panel.hidden = !active;
  });
}

function formatDate(value){
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function renderRequests(){
  const list = document.getElementById('request-list');
  list.classList.remove('is-hidden');
  list.style.display = 'grid';
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  document.getElementById('total-count').textContent = requests.length;
  document.getElementById('pending-count').textContent = requests.filter(item => item.status === 'pendente').length;
  document.getElementById('done-count').textContent = requests.filter(item => item.status === 'atendido').length;
  const search = searchInput.value.trim().toLocaleLowerCase();
  const filtered = requests.filter(request => {
    const requestStatus = String(request.status || '').toLocaleLowerCase();
    const selectedStatus = statusFilter.value;
    const matchesStatus = selectedStatus === 'todos' || requestStatus === selectedStatus || selectedStatus === 'pendente' && requestStatus === 'pending' || selectedStatus === 'atendido' && requestStatus === 'done';
    return matchesStatus && `${request.nome} ${request.email} ${request.servico} ${request.telefone}`.toLocaleLowerCase().includes(search);
  });
  list.replaceChildren();
  if (!filtered.length){ const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = requests.length ? 'Nenhuma solicitação corresponde aos filtros.' : 'Nenhuma solicitação encontrada.'; list.append(empty); return; }
  filtered.forEach(request => {
    const article = document.createElement('article'); article.className = 'request-card';
    const head = document.createElement('div'); head.className = 'request-head';
    const title = document.createElement('h2'); title.textContent = request.nome || 'Solicitante sem nome';
    const badge = document.createElement('span'); badge.className = `status-badge status-${request.status}`; badge.textContent = request.status === 'atendido' ? 'Atendido' : 'Pendente'; head.append(title, badge);
    const details = document.createElement('div'); details.className = 'request-details'; details.append(detail('Serviço', request.servico), detail('Telefone', request.telefone), detail('E-mail', request.email), detail('Recebido', formatDate(request.created_at)));
    const message = document.createElement('p'); message.className = 'request-message'; message.textContent = request.mensagem || 'Nenhuma mensagem adicional.';
    const actions = document.createElement('div'); actions.className = 'request-actions';
    const statusButton = document.createElement('button'); statusButton.className = 'secondary-button'; statusButton.type = 'button'; statusButton.textContent = request.status === 'atendido' ? 'Marcar pendente' : 'Marcar atendido'; statusButton.addEventListener('click', () => updateStatus(request));
    const deleteButton = document.createElement('button'); deleteButton.className = 'danger-button'; deleteButton.type = 'button'; deleteButton.textContent = 'Excluir'; deleteButton.addEventListener('click', () => deleteRequest(request)); actions.append(statusButton, deleteButton);
    article.append(head, details, message, actions); list.append(article);
  });
}

function detail(label, value){
  const wrapper = document.createElement('div');
  const labelElement = document.createElement('strong');
  labelElement.textContent = label;
  const valueElement = document.createElement('span');
  valueElement.textContent = value || 'Não informado';
  wrapper.append(labelElement, valueElement);
  return wrapper;
}

async function loadRequests(){
  showMessage(dashboardMessage, 'Carregando solicitações...');
  let data;
  let error;
  try {
    ({ data, error } = await supabaseClient.from('solicitacoes').select('*').order('created_at', { ascending: false }));
  } catch (requestError) {
    error = requestError;
  }
  if (error){
    const errorText = String(error.message || '').toLowerCase();
    const message = errorText.includes('api') || errorText.includes('not found')
      ? 'A tabela solicitacoes está desativada na Data API do Supabase. Habilite-a em Project Settings > API > Data API.'
      : 'Não foi possível carregar as solicitações. Verifique as permissões da tabela no Supabase.';
    showMessage(dashboardMessage, message, true);
    return;
  }
  requests = data || []; showMessage(dashboardMessage, `${requests.length} solicitação(ões) encontrada(s).`); renderRequests();
}

async function loadContent(){
  try {
    const { data, error } = await supabaseClient.from('site_content').select('content').eq('id', 'principal').maybeSingle();
    if (error) return showMessage(document.getElementById('content-message'), 'Não foi possível carregar o conteúdo. Confira o schema e as permissões no Supabase.', true);
    const form = document.getElementById('content-form');
    const content = data?.content || {};
    Object.entries(content).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
      const preview = form.querySelector(`[data-preview="${name}"]`);
      if (preview && value) { preview.src = value; preview.classList.add('is-visible'); }
    });
  } catch (error) {
    showMessage(document.getElementById('content-message'), 'Não foi possível conectar ao conteúdo do site.', true);
  }
}

async function saveContent(){
  const form = document.getElementById('content-form');
  if (!form.checkValidity()){
    form.reportValidity();
    return;
  }
  try {
    const content = formDataObject(form);
    for (const input of form.querySelectorAll('[data-upload-field]')) {
      if (input.files?.[0]) {
        const file = input.files[0];
        content[input.dataset.uploadField] = await uploadMedia(file);
        content[`${input.dataset.uploadField}_type`] = file.type.startsWith('video/') ? 'video' : 'image';
      }
      delete content[input.name];
    }
    const { error } = await supabaseClient.from('site_content').upsert({ id: 'principal', content, updated_at: new Date().toISOString() });
    showMessage(document.getElementById('content-message'), error ? 'Não foi possível salvar o conteúdo.' : 'Conteúdo salvo. Atualize o site público para ver as alterações.', Boolean(error));
  } catch (error) {
    showMessage(document.getElementById('content-message'), 'Não foi possível conectar ao banco para salvar.', true);
  }
}

async function loadCatalog(){
  try {
    const [servicesResult, projectsResult] = await Promise.all([
      supabaseClient.from('services').select('*').order('sort_order'),
      supabaseClient.from('projects').select('*').order('sort_order')
    ]);
    if (servicesResult.error || projectsResult.error){
      showMessage(document.getElementById('catalog-message'), 'Não foi possível carregar serviços e obras. Confira a Data API e as permissões no Supabase.', true);
      return;
    }
    services = servicesResult.data || [];
    projects = projectsResult.data || [];
    renderCatalog('services'); renderCatalog('projects');
  } catch (error) {
    showMessage(document.getElementById('catalog-message'), 'Não foi possível conectar ao catálogo.', true);
  }
}

function renderCatalog(type){
  const items = type === 'services' ? services : projects;
  const list = document.getElementById(type === 'services' ? 'services-list' : 'projects-list');
  list.replaceChildren();
  if (!items.length){ const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Nenhum item cadastrado.'; list.append(empty); return; }
  items.forEach(item => {
    const row = document.createElement('article'); row.className = 'catalog-item';
    if (item.image_url){ const image = document.createElement('img'); image.src = item.image_url; image.alt = ''; row.append(image); }
    const info = document.createElement('div'); const title = document.createElement('strong'); title.textContent = item.title; const meta = document.createElement('small'); meta.textContent = `${item.active ? 'Publicado' : 'Oculto'} · ordem ${item.sort_order}`; info.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'catalog-actions'; const edit = document.createElement('button'); edit.className = 'secondary-button'; edit.type = 'button'; edit.textContent = 'Editar'; edit.addEventListener('click', () => fillCatalogForm(type, item)); const remove = document.createElement('button'); remove.className = 'danger-button'; remove.type = 'button'; remove.textContent = 'Excluir'; remove.addEventListener('click', () => deleteCatalog(type, item)); actions.append(edit, remove); row.append(info, actions); list.append(row);
  });
}

function fillCatalogForm(type, item){
  const form = document.getElementById(type === 'services' ? 'service-form' : 'project-form');
  Object.entries(item).forEach(([key, value]) => { if (!form.elements[key]) return; if (form.elements[key].type === 'checkbox') form.elements[key].checked = value; else form.elements[key].value = value ?? ''; });
  const preview = form.querySelector('.media-preview');
  if (preview && item.image_url) { preview.src = item.image_url; preview.classList.add('is-visible'); }
  document.getElementById(type === 'services' ? 'service-form-title' : 'project-form-title').textContent = type === 'services' ? 'Editar serviço' : 'Editar obra';
}

function clearCatalogForm(type){
  const form = document.getElementById(type === 'services' ? 'service-form' : 'project-form'); form.reset(); form.elements.id.value = ''; form.elements.active.checked = true; document.getElementById(type === 'services' ? 'service-form-title' : 'project-form-title').textContent = type === 'services' ? 'Novo serviço' : 'Nova obra';
}

async function saveCatalog(type, event){
  event.preventDefault(); const form = event.currentTarget; const values = formDataObject(form); const table = type === 'services' ? 'services' : 'projects'; const payload = { ...values, sort_order: Number(values.sort_order) || 0, active: form.elements.active.checked }; delete payload.id; delete payload.image_file;
  try {
    if (form.elements.image_file.files?.[0]) {
      const file = form.elements.image_file.files[0];
      payload.image_url = await uploadMedia(file);
      payload.media_type = file.type.startsWith('video/') ? 'video' : 'image';
    }
    const result = values.id ? await supabaseClient.from(table).update(payload).eq('id', values.id) : await supabaseClient.from(table).insert(payload);
    showMessage(document.getElementById('catalog-message'), result.error ? 'Não foi possível salvar o item.' : 'Item salvo com sucesso.', Boolean(result.error));
    if (!result.error){ clearCatalogForm(type); loadCatalog(); }
  } catch (error) {
    showMessage(document.getElementById('catalog-message'), error.message || 'Não foi possível enviar a mídia.', true);
  }
}

async function deleteCatalog(type, item){
  if (!window.confirm(`Excluir ${item.title}?`)) return; const table = type === 'services' ? 'services' : 'projects'; const { error } = await supabaseClient.from(table).delete().eq('id', item.id); if (error) return showMessage(document.getElementById('catalog-message'), 'Não foi possível excluir o item.', true); loadCatalog();
}

async function updateStatus(request){ const nextStatus = request.status === 'atendido' ? 'pendente' : 'atendido'; const { error } = await supabaseClient.from('solicitacoes').update({ status: nextStatus }).eq('id', request.id); if (error) return showMessage(dashboardMessage, 'Não foi possível atualizar o status.', true); request.status = nextStatus; renderRequests(); }
async function deleteRequest(request){ if (!window.confirm(`Excluir a solicitação de ${request.nome}?`)) return; const { error } = await supabaseClient.from('solicitacoes').delete().eq('id', request.id); if (error) return showMessage(dashboardMessage, 'Não foi possível excluir a solicitação.', true); requests = requests.filter(item => item.id !== request.id); renderRequests(); }

document.querySelectorAll('.admin-tab').forEach(tab => tab.addEventListener('click', () => activatePanel(tab.dataset.panel)));
document.getElementById('save-content-button').addEventListener('click', saveContent);
document.getElementById('service-form').addEventListener('submit', event => saveCatalog('services', event));
document.getElementById('project-form').addEventListener('submit', event => saveCatalog('projects', event));
document.getElementById('cancel-service').addEventListener('click', () => clearCatalogForm('services'));
document.getElementById('cancel-project').addEventListener('click', () => clearCatalogForm('projects'));
document.querySelectorAll('input[type="file"]').forEach(input => {
  input.addEventListener('change', () => previewFile(input, input.closest('label').querySelector('.media-preview')));
});
document.getElementById('search-input').addEventListener('input', renderRequests);
document.getElementById('status-filter').addEventListener('change', renderRequests);
document.getElementById('refresh-button').addEventListener('click', loadRequests);

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const { error } = await supabaseClient.auth.signInWithPassword({ email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-password').value });
  if (error){
    const message = error.message?.toLowerCase() || '';
    const friendlyMessage = message.includes('email not confirmed') ? 'Confirme o e-mail da conta no Supabase antes de entrar.' : message.includes('invalid login credentials') ? 'E-mail ou senha incorretos. Verifique os dados no usuário do Supabase.' : 'Não foi possível entrar. Confira a configuração da conta no Supabase.';
    return showMessage(loginMessage, friendlyMessage, true);
  }
  showMessage(loginMessage, '');
  showDashboard();
});
document.getElementById('logout-button').addEventListener('click', async () => { await supabaseClient.auth.signOut(); dashboardInitialized = false; dashboard.classList.add('is-hidden'); loginPanel.classList.remove('is-hidden'); });
supabaseClient.auth.getSession().then(({ data }) => { if (data.session) showDashboard(); });
