/* ==========================================================================
   WM GABIÃO — admin.js
   Painel de solicitações de orçamento. Depende de js/config.js (supabaseClient).
   ========================================================================== */

const elements = {
  loginPanel: document.getElementById('login-panel'),
  loginForm: document.getElementById('login-form'),
  loginMessage: document.getElementById('login-message'),
  dashboard: document.getElementById('dashboard'),
  dashboardMessage: document.getElementById('dashboard-message'),
  list: document.getElementById('request-list'),
  search: document.getElementById('search-input'),
  statusFilter: document.getElementById('status-filter'),
  totalCount: document.getElementById('total-count'),
  pendingCount: document.getElementById('pending-count'),
  doneCount: document.getElementById('done-count')
};

let requests = [];
let dashboardVisible = false;

/* ---------- Utilitários ---------- */

function showMessage(element, message, isError = false){
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function formatDate(value){
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

// Aceita também os status antigos em inglês ("pending"/"done").
function normalizeStatus(status){
  const value = String(status || '').toLowerCase();
  return value === 'atendido' || value === 'done' ? 'atendido' : 'pendente';
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

function createDetail(label, value){
  const wrapper = document.createElement('div');
  wrapper.append(createElement('strong', '', label), createElement('span', '', value || 'Não informado'));
  return wrapper;
}

/* ---------- Telas ---------- */

function showDashboard(){
  if (dashboardVisible) return;
  dashboardVisible = true;
  elements.loginPanel.classList.add('is-hidden');
  elements.dashboard.classList.remove('is-hidden');
  loadRequests();
}

function showLogin(){
  dashboardVisible = false;
  requests = [];
  elements.dashboard.classList.add('is-hidden');
  elements.loginPanel.classList.remove('is-hidden');
}

/* ---------- Renderização ---------- */

function renderSummary(){
  const pending = requests.filter(request => normalizeStatus(request.status) === 'pendente').length;
  elements.totalCount.textContent = requests.length;
  elements.pendingCount.textContent = pending;
  elements.doneCount.textContent = requests.length - pending;
}

function getFilteredRequests(){
  const search = elements.search.value.trim().toLocaleLowerCase();
  const selectedStatus = elements.statusFilter.value;

  return requests.filter(request => {
    const matchesStatus = selectedStatus === 'todos' || normalizeStatus(request.status) === selectedStatus;
    const content = [request.nome, request.email, request.servico, request.telefone].join(' ').toLocaleLowerCase();
    return matchesStatus && content.includes(search);
  });
}

function createRequestCard(request){
  const status = normalizeStatus(request.status);
  const isDone = status === 'atendido';
  const card = createElement('article', 'request-card');

  const head = createElement('div', 'request-head');
  head.append(
    createElement('h3', '', request.nome || 'Solicitante sem nome'),
    createElement('span', `status-badge status-${status}`, isDone ? 'Atendido' : 'Pendente')
  );

  const details = createElement('div', 'request-details');
  details.append(
    createDetail('Serviço', request.servico),
    createDetail('Telefone', request.telefone),
    createDetail('E-mail', request.email),
    createDetail('Recebido', formatDate(request.created_at))
  );

  const message = createElement('p', 'request-message', request.mensagem || 'Nenhuma mensagem adicional.');

  const actions = createElement('div', 'request-actions');
  actions.append(
    createButton('secondary-button', isDone ? 'Marcar pendente' : 'Marcar atendido', () => toggleStatus(request)),
    createButton('danger-button', 'Excluir', () => deleteRequest(request))
  );

  card.append(head, details, message, actions);
  return card;
}

function renderRequests(){
  renderSummary();
  const filtered = getFilteredRequests();

  if (!filtered.length) {
    const emptyText = requests.length ? 'Nenhuma solicitação corresponde aos filtros.' : 'Nenhuma solicitação encontrada.';
    elements.list.replaceChildren(createElement('p', 'empty-state', emptyText));
    return;
  }
  elements.list.replaceChildren(...filtered.map(createRequestCard));
}

/* ---------- Supabase ---------- */

async function loadRequests(){
  showMessage(elements.dashboardMessage, 'Carregando solicitações...');
  try {
    const { data, error } = await supabaseClient
      .from('solicitacoes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    requests = data || [];
    showMessage(elements.dashboardMessage, `${requests.length} solicitação(ões) encontrada(s).`);
    renderRequests();
  } catch (error) {
    const errorText = String(error.message || '').toLowerCase();
    const message = errorText.includes('api') || errorText.includes('not found')
      ? 'A tabela solicitacoes está desativada na Data API do Supabase.'
      : 'Não foi possível carregar as solicitações. Verifique as permissões no Supabase.';
    showMessage(elements.dashboardMessage, message, true);
  }
}

async function toggleStatus(request){
  const nextStatus = normalizeStatus(request.status) === 'atendido' ? 'pendente' : 'atendido';
  const { error } = await supabaseClient.from('solicitacoes').update({ status: nextStatus }).eq('id', request.id);
  if (error) return showMessage(elements.dashboardMessage, 'Não foi possível atualizar o status.', true);

  request.status = nextStatus;
  renderRequests();
}

async function deleteRequest(request){
  if (!window.confirm(`Excluir a solicitação de ${request.nome || 'solicitante sem nome'}?`)) return;

  const { error } = await supabaseClient.from('solicitacoes').delete().eq('id', request.id);
  if (error) return showMessage(elements.dashboardMessage, 'Não foi possível excluir a solicitação.', true);

  requests = requests.filter(item => item.id !== request.id);
  renderRequests();
}

/* ---------- Eventos ---------- */

function initAdmin(){
  if (!supabaseClient) {
    showMessage(elements.loginMessage, 'Não foi possível carregar o sistema. Verifique sua conexão e recarregue a página.', true);
    return;
  }

  elements.search.addEventListener('input', renderRequests);
  elements.statusFilter.addEventListener('change', renderRequests);
  document.getElementById('refresh-button').addEventListener('click', loadRequests);

  elements.loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    });

    if (error) {
      const message = String(error.message || '').toLowerCase();
      const friendlyMessage = message.includes('email not confirmed')
        ? 'Confirme o e-mail da conta no Supabase antes de entrar.'
        : 'E-mail ou senha incorretos.';
      return showMessage(elements.loginMessage, friendlyMessage, true);
    }

    showMessage(elements.loginMessage, '');
    elements.loginForm.reset();
    showDashboard();
  });

  document.getElementById('logout-button').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLogin();
  });

  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) showDashboard();
  });
}

initAdmin();
