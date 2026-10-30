// ===== Funções compartilhadas: Supabase, autenticação, dados e utilitários =====
const CATEGORIAS = { buraco:'Buraco na via', iluminacao:'Iluminação com defeito', lixo:'Descarte irregular de lixo',
  sinalizacao:'Problema de sinalização', outros:'Outros' };
const STATUS = ['Recebida','Em análise','Em andamento','Resolvida'];
const COR = { 'Recebida':'#64748b','Em análise':'#f59e0b','Em andamento':'#3b82f6','Resolvida':'#22c55e' };

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dataBR = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' });

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3000);
}

// Traduz as mensagens de erro mais comuns do Supabase
function mensagemErro(erro) {
  const m = (erro && erro.message) || String(erro || '');
  if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/already registered|already exists/i.test(m)) return 'Este e-mail já está cadastrado.';
  if (/signups? (are |is )?(disabled|not allowed)/i.test(m)) return 'Novos cadastros estão desativados no Supabase (Authentication → Sign In / Providers → Allow new users to sign up).';
  if (/password should be at least/i.test(m)) return 'A senha deve ter pelo menos 6 caracteres.';
  if (/rate limit/i.test(m)) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (/failed to fetch|network/i.test(m)) return 'Sem conexão com o servidor. Verifique sua internet.';
  return m || 'Ocorreu um erro inesperado.';
}

// ----- Autenticação -----
// Devolve { id, nome, perfil, admin, mestre } do usuário logado, ou null
async function sessao() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await sb.from('perfis').select('id, nome, perfil, admin, mestre').eq('id', session.user.id).single();
  if (error || !data) return null;
  return data;
}
async function entrar(email, senha, perfil) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (error) return { erro: mensagemErro(error) };
  const u = await sessao();
  if (!u) { await sb.auth.signOut(); return { erro: 'Perfil não encontrado. Verifique se o banco foi configurado.' }; }
  if (u.perfil !== perfil) {
    await sb.auth.signOut();
    return { erro: perfil === 'prefeitura' ? 'Esta conta não tem acesso da prefeitura.' : 'Esta é uma conta da prefeitura: use a aba "Prefeitura".' };
  }
  return { usuario: u };
}
// Devolve { erro } ou { confirmar: true } quando o Supabase exige confirmação por e-mail
async function cadastrar(nome, email, senha) {
  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(), password: senha,
    options: { data: { nome: nome.trim() }, emailRedirectTo: new URL('index.html', location.href).href }
  });
  if (error) return { erro: mensagemErro(error) };
  if (data.user && data.user.identities && data.user.identities.length === 0) return { erro: 'Este e-mail já está cadastrado.' };
  return { confirmar: !data.session };
}
async function sair() { await sb.auth.signOut(); location.href = 'index.html'; }

// Protege a página: só entra quem tem o perfil certo
async function exigirPerfil(perfil) {
  const s = await sessao();
  if (!s || s.perfil !== perfil) { location.replace('index.html'); return null; }
  $('nome-usuario').textContent = s.nome; $('btn-sair').onclick = sair;
  return s;
}

// ----- Ocorrências -----
// Sem userId: todas as ocorrências (visão geral / prefeitura). Com userId: só as daquele usuário.
async function listarOcorrencias(userId) {
  let q = sb.from('ocorrencias').select('*, historico(*)');
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q
    .order('criado_em', { ascending: false })
    .order('criado_em', { referencedTable: 'historico', ascending: true });
  if (error) { toast('Erro ao carregar ocorrências: ' + mensagemErro(error)); return []; }
  return data;
}

async function enviarFoto(userId, blob) {
  const caminho = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage.from('fotos').upload(caminho, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return sb.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;
}

async function criarOcorrencia(userId, dados, fotoBlob) {
  const foto_url = fotoBlob ? await enviarFoto(userId, fotoBlob) : null;
  const { error } = await sb.from('ocorrencias').insert({ ...dados, foto_url });
  if (error) throw error;
}

async function atualizarStatus(id, status, nota) {
  const { error } = await sb.rpc('atualizar_status', { p_id: id, p_status: status, p_nota: nota });
  if (error) throw error;
}

// ----- Equipe da prefeitura (somente administradores) -----
async function listarEquipe() {
  const { data, error } = await sb.from('perfis').select('id, nome, email, admin, mestre, criado_em')
    .eq('perfil', 'prefeitura').order('mestre', { ascending: false }).order('nome');
  if (error) throw error;
  return data;
}
async function criarContaPrefeitura(nome, email, senha, admin) {
  const { error } = await sb.rpc('criar_conta_prefeitura', { p_nome: nome, p_email: email, p_senha: senha, p_admin: admin });
  if (error) throw error;
}
async function definirAdmin(id, admin) {
  const { error } = await sb.rpc('definir_admin', { p_id: id, p_admin: admin });
  if (error) throw error;
}
async function removerAcessoPrefeitura(id) {
  const { error } = await sb.rpc('remover_acesso_prefeitura', { p_id: id });
  if (error) throw error;
}

// ----- Componentes -----
const enderecoTexto = o => o.endereco || 'Local marcado no mapa';
const selo = st => `<span class="selo" style="background:${COR[st]}">${esc(st)}</span>`;
const fotoHTML = o => o.foto_url ? `<img src="${esc(o.foto_url)}" alt="Foto da ocorrência" loading="lazy">` : '<div class="sem-foto">📍</div>';
const tempoHTML = o => `<ol class="tempo">${(o.historico || []).map(e =>
  `<li style="--p:${COR[e.status]}"><b>${esc(e.status)}</b> · <small>${dataBR(e.criado_em)} · ${esc(e.por)}</small><br>${esc(e.nota)}</li>`).join('')}</ol>`;

// Reduz a foto para no máximo 1200px de largura e devolve { blob, url } (JPEG)
function reduzirFoto(arquivo) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, 1200 / img.width), c = document.createElement('canvas');
      c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      c.toBlob(b => b ? res({ blob: b, url: URL.createObjectURL(b) }) : rej(new Error('Falha ao processar a foto.')), 'image/jpeg', 0.75);
    };
    img.onerror = () => rej(new Error('Arquivo de imagem inválido.'));
    img.src = URL.createObjectURL(arquivo);
  });
}
