/* ==========================================================================
   WM GABIÃO — config.js
   Configuração compartilhada entre o site (script.js) e o painel (admin.js).
   A chave abaixo é PUBLICÁVEL. Nunca coloque a chave service_role aqui.
   ========================================================================== */

const SUPABASE_URL = 'https://qaflebsbbmjcmophlkbi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3Q5rEIIHV3hrATgSTR0Vaw_fX97rgxm';

// Fica null se a biblioteca do Supabase não carregar (ex.: CDN fora do ar).
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) ?? null;
