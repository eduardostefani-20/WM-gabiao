const SUPABASE_URL = 'https://qaflebsbbmjcmophlkbi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3Q5rEIIHV3hrATgSTR0Vaw_fX97rgxm';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginPanel = document.getElementById('login-panel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const dashboardMessage = document.getElementById('dashboard-message');
const requestList = document.getElementById('request-list');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const totalCount = document.getElementById('total-count');
const pendingCount = document.getElementById('pending-count');
const doneCount = document.getElementById('done-count');
let requests = [];

function showMessage(element, message, isError = false){
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function formatDate(value){
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function showDashboard(){
  loginPanel.classList.add('is-hidden');
  dashboard.classList.remove('is-hidden');
  loadRequests();
}

function renderRequests(){
  totalCount.textContent = requests.length;
  pendingCount.textContent = requests.filter(request => request.status === 'pendente').length;
  doneCount.textContent = requests.filter(request => request.status === 'atendido').length;
  const search = searchInput.value.trim().toLocaleLowerCase();
  const status = statusFilter.value;
  const filtered = requests.filter(request => {
    const matchesStatus = status === 'todos' || request.status === status;
    const content = `${request.nome} ${request.email} ${request.servico} ${request.telefone}`.toLocaleLowerCase();
    return matchesStatus && content.includes(search);
  });

  requestList.replaceChildren();
  if (!filtered.length){
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma solicitação encontrada.';
    requestList.append(empty);
    return;
  }

  filtered.forEach(request => {
    const article = document.createElement('article');
    article.className = 'request-card';

    const head = document.createElement('div');
    head.className = 'request-head';
    const title = document.createElement('h2');
    title.textContent = request.nome;
    const badge = document.createElement('span');
    badge.className = `status-badge status-${request.status}`;
    badge.textContent = request.status === 'atendido' ? 'Atendido' : 'Pendente';
    head.append(title, badge);

    const details = document.createElement('div');
    details.className = 'request-details';
    details.append(detail('Serviço', request.servico), detail('Telefone', request.telefone), detail('E-mail', request.email), detail('Recebido', formatDate(request.created_at)));

    const message = document.createElement('p');
    message.className = 'request-message';
    message.textContent = request.mensagem || 'Nenhuma mensagem adicional.';

    const actions = document.createElement('div');
    actions.className = 'request-actions';
    const statusButton = document.createElement('button');
    statusButton.className = 'secondary-button';
    statusButton.type = 'button';
    statusButton.textContent = request.status === 'atendido' ? 'Marcar pendente' : 'Marcar atendido';
    statusButton.addEventListener('click', () => updateStatus(request));
    const deleteButton = document.createElement('button');
    deleteButton.className = 'danger-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', () => deleteRequest(request));
    actions.append(statusButton, deleteButton);

    article.append(head, details, message, actions);
    requestList.append(article);
  });
}

function detail(label, value){
  const wrapper = document.createElement('div');
  const labelElement = document.createElement('strong');
  labelElement.textContent = label;
  const valueElement = document.createElement('span');
  valueElement.textContent = value;
  wrapper.append(labelElement, valueElement);
  return wrapper;
}

async function loadRequests(){
  showMessage(dashboardMessage, 'Carregando solicitações...');
  const { data, error } = await supabaseClient.from('solicitacoes').select('*').order('created_at', { ascending: false });
  if (error){
    showMessage(dashboardMessage, 'Não foi possível carregar as solicitações.', true);
    return;
  }
  requests = data;
  showMessage(dashboardMessage, `${requests.length} solicitação(ões) encontrada(s).`);
  renderRequests();
}

async function updateStatus(request){
  const nextStatus = request.status === 'atendido' ? 'pendente' : 'atendido';
  const { error } = await supabaseClient.from('solicitacoes').update({ status: nextStatus }).eq('id', request.id);
  if (error){
    showMessage(dashboardMessage, 'Não foi possível atualizar o status.', true);
    return;
  }
  request.status = nextStatus;
  renderRequests();
}

async function deleteRequest(request){
  if (!window.confirm(`Excluir a solicitação de ${request.nome}?`)) return;
  const { error } = await supabaseClient.from('solicitacoes').delete().eq('id', request.id);
  if (error){
    showMessage(dashboardMessage, 'Não foi possível excluir a solicitação.', true);
    return;
  }
  requests = requests.filter(item => item.id !== request.id);
  renderRequests();
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: document.getElementById('login-email').value.trim(),
    password: document.getElementById('login-password').value
  });
  if (error){
    showMessage(loginMessage, 'E-mail ou senha inválidos.', true);
    return;
  }
  showMessage(loginMessage, '');
  showDashboard();
});

document.getElementById('logout-button').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  dashboard.classList.add('is-hidden');
  loginPanel.classList.remove('is-hidden');
});

document.getElementById('refresh-button').addEventListener('click', loadRequests);
searchInput.addEventListener('input', renderRequests);
statusFilter.addEventListener('change', renderRequests);

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) showDashboard();
});
