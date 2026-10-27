// ===== Funções compartilhadas: dados, autenticação e utilitários =====
// ATENÇÃO: tudo aqui roda no navegador (localStorage). Serve para demonstrar o fluxo.
// Em produção, login e dados DEVEM ir para o back-end (senha nunca fica no front-end).
const CATEGORIAS = { buraco:'Buraco na via', iluminacao:'Iluminação com defeito', lixo:'Descarte irregular de lixo',
  sinalizacao:'Problema de sinalização', outros:'Outros' };
const STATUS = ['Recebida','Em análise','Em andamento','Resolvida'];
const COR = { 'Recebida':'#64748b','Em análise':'#f59e0b','Em andamento':'#3b82f6','Resolvida':'#22c55e' };
const K = { users:'ca2:usuarios', occ:'ca2:ocorrencias', sessao:'ca2:sessao' };

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dataBR = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' });
const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch { toast('Armazenamento cheio: não foi possível salvar.'); return false; } };

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}
async function hash(texto) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(texto))); // alternativa simples (apenas demonstração)
}

// ----- Dados iniciais de demonstração -----
async function iniciarDados() {
  if (ler(K.users, null)) return;
  gravar(K.users, [
    { id:'u1', nome:'Lucas Martins', email:'lucas@email.com', perfil:'cidadao', senha: await hash('123456') },
    { id:'u2', nome:'Mariana Oliveira', email:'mariana@prefeitura.sorocaba.sp.gov.br', perfil:'prefeitura', senha: await hash('prefeitura123') }
  ]);
  const h = d => new Date(Date.now() - d * 86400000).toISOString();
  gravar(K.occ, [
    { id:1, userId:'u1', autor:'Lucas Martins', descricao:'Buraco grande na rua, perigoso para motos.', categoria:'buraco',
      status:'Em análise', endereco:'Centro, Sorocaba', lat:-23.5015, lng:-47.4526, foto:'', data:h(2), historico:[
      { data:h(2), status:'Recebida', nota:'Ocorrência registrada.', por:'Sistema' },
      { data:h(1), status:'Em análise', nota:'Equipe de vistoria acionada.', por:'Mariana Oliveira' }] },
    { id:2, userId:'u1', autor:'Lucas Martins', descricao:'Poste com lâmpada queimada há semanas.', categoria:'iluminacao',
      status:'Recebida', endereco:'Campolim, Sorocaba', lat:-23.4950, lng:-47.4430, foto:'', data:h(0), historico:[
      { data:h(0), status:'Recebida', nota:'Ocorrência registrada.', por:'Sistema' }] }
  ]);
}

// ----- Autenticação -----
const sessao = () => ler(K.sessao, null);
async function entrar(email, senha, perfil) {
  const h = await hash(senha);
  const u = ler(K.users, []).find(x => x.email === email.trim().toLowerCase() && x.senha === h && x.perfil === perfil);
  if (!u) return null;
  gravar(K.sessao, { id:u.id, nome:u.nome, perfil:u.perfil });
  return u;
}
async function cadastrar(nome, email, senha) {
  const us = ler(K.users, []); email = email.trim().toLowerCase();
  if (us.some(u => u.email === email)) return 'Este e-mail já está cadastrado.';
  us.push({ id:'u' + Date.now(), nome:nome.trim(), email, perfil:'cidadao', senha: await hash(senha) });
  gravar(K.users, us); return null;
}
function sair() { localStorage.removeItem(K.sessao); location.href = 'index.html'; }
// Protege a página: só entra quem tem o perfil certo
function exigirPerfil(perfil) {
  const s = sessao();
  if (!s || s.perfil !== perfil) { location.replace('index.html'); return null; }
  $('nome-usuario').textContent = s.nome; $('btn-sair').onclick = sair;
  return s;
}

// ----- Componentes -----
const enderecoTexto = o => o.endereco || 'Local marcado no mapa';
const selo = st => `<span class="selo" style="background:${COR[st]}">${esc(st)}</span>`;
const fotoHTML = o => o.foto ? `<img src="${o.foto}" alt="Foto da ocorrência">` : '<div class="sem-foto">📍</div>';
const tempoHTML = o => `<ol class="tempo">${(o.historico || []).map(e =>
  `<li style="--p:${COR[e.status]}"><b>${esc(e.status)}</b> · <small>${dataBR(e.data)} · ${esc(e.por)}</small><br>${esc(e.nota)}</li>`).join('')}</ol>`;
function reduzirFoto(arquivo) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, 800 / img.width), c = document.createElement('canvas');
      c.width = img.width * f; c.height = img.height * f;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.7));
    };
    img.src = URL.createObjectURL(arquivo);
  });
}
