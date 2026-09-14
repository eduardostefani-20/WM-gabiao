const SUPABASE_URL = 'https://qaflebsbbmjcmophlkbi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3Q5rEIIHV3hrATgSTR0Vaw_fX97rgxm';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

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

function showDashboard(){
  if (dashboardInitialized) return;
  dashboardInitialized = true;
  loginPanel.classList.add('is-hidden');
  dashboard.classList.remove('is-hidden');
  loadRequests();
}

async function updateStatus(request){ const nextStatus = request.status === 'atendido' ? 'pendente' : 'atendido'; const { error } = await supabaseClient.from('solicitacoes').update({ status: nextStatus }).eq('id', request.id); if (error) return showMessage(dashboardMessage, 'Não foi possível atualizar o status.', true); request.status = nextStatus; renderRequests(); }
async function deleteRequest(request){ if (!window.confirm(`Excluir a solicitação de ${request.nome}?`)) return; const { error } = await supabaseClient.from('solicitacoes').delete().eq('id', request.id); if (error) return showMessage(dashboardMessage, 'Não foi possível excluir a solicitação.', true); requests = requests.filter(item => item.id !== request.id); renderRequests(); }

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
