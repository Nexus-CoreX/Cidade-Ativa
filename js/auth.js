(async () => {
  await iniciarDados();
  const s = sessao();
  if (s) { location.replace(s.perfil === 'prefeitura' ? 'prefeitura.html' : 'cidadao.html'); return; }
  let perfil = 'cidadao', cadastro = false;

  function ui() {
    document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.perfil === perfil));
    $('l-nome').hidden = !cadastro; $('nome').required = cadastro;
    $('titulo').textContent = cadastro ? 'Criar conta de cidadão' : (perfil === 'cidadao' ? 'Entrar como cidadão' : 'Acesso da prefeitura');
    $('enviar').textContent = cadastro ? 'Criar conta' : 'Entrar';
    $('troca').hidden = perfil === 'prefeitura';
    $('alternar').textContent = cadastro ? 'Já tenho conta' : 'Criar conta';
    $('erro').textContent = '';
  }
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { perfil = b.dataset.perfil; cadastro = false; ui(); });
  $('alternar').onclick = e => { e.preventDefault(); cadastro = !cadastro; ui(); };

  $('form').onsubmit = async e => {
    e.preventDefault();
    if (cadastro) {
      const erro = await cadastrar($('nome').value, $('email').value, $('senha').value);
      if (erro) { $('erro').textContent = erro; return; }
    }
    const u = await entrar($('email').value, $('senha').value, perfil);
    if (!u) { $('erro').textContent = 'E-mail ou senha incorretos para este perfil.'; return; }
    location.href = perfil === 'prefeitura' ? 'prefeitura.html' : 'cidadao.html';
  };
  ui();
})();
