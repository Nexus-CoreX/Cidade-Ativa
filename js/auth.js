(async () => {
  const s = await sessao();
  if (s) { location.replace(s.perfil === 'prefeitura' ? 'prefeitura.html' : 'cidadao.html'); return; }
  let perfil = 'cidadao', cadastro = false;

  function ui() {
    document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.perfil === perfil));
    $('l-nome').hidden = !cadastro; $('nome').required = cadastro;
    $('titulo').textContent = cadastro ? 'Criar conta de cidadão' : (perfil === 'cidadao' ? 'Entrar como cidadão' : 'Acesso da prefeitura');
    $('enviar').textContent = cadastro ? 'Criar conta' : 'Entrar';
    $('troca').hidden = perfil === 'prefeitura';
    $('alternar').textContent = cadastro ? 'Já tenho conta' : 'Criar conta';
    $('senha').autocomplete = cadastro ? 'new-password' : 'current-password';
    $('erro').textContent = '';
  }
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { perfil = b.dataset.perfil; cadastro = false; ui(); });
  $('alternar').onclick = e => { e.preventDefault(); cadastro = !cadastro; ui(); };

  $('form').onsubmit = async e => {
    e.preventDefault();
    const btn = $('enviar'), texto = btn.textContent;
    btn.disabled = true; btn.textContent = 'Aguarde...'; $('erro').textContent = '';
    try {
      if (cadastro) {
        const r = await cadastrar($('nome').value, $('email').value, $('senha').value);
        if (r.erro) { $('erro').textContent = r.erro; return; }
        if (r.confirmar) {
          cadastro = false; ui();
          toast('Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.');
          return;
        }
      }
      const r = await entrar($('email').value, $('senha').value, perfil);
      if (r.erro) { $('erro').textContent = r.erro; return; }
      location.href = perfil === 'prefeitura' ? 'prefeitura.html' : 'cidadao.html';
    } finally {
      btn.disabled = false; if (btn.textContent === 'Aguarde...') btn.textContent = texto;
    }
  };
  ui();
})();
