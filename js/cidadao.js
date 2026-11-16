(async () => {
  const s = await exigirPerfil('cidadao'); if (!s) return;
  let foto = null, pos = null, endereco = '', minhas = [], todas = null, aba = 'minhas';

  for (const [k, v] of Object.entries(CATEGORIAS)) $('categoria').add(new Option(v, k));

  async function carregar() {
    minhas = await listarOcorrencias(s.id); render();
    if (aba === 'geral') carregarGeral(); else todas = null;   // a visão geral recarrega quando for aberta
  }

  // ----- Abas: Minhas ocorrências / Visão geral -----
  function trocarAba(a) {
    aba = a;
    for (const [id, nome] of [['tab-minhas', 'minhas'], ['tab-geral', 'geral']]) {
      $(id).classList.toggle('on', a === nome); $(id).setAttribute('aria-selected', a === nome);
    }
    $('aba-minhas').hidden = a !== 'minhas'; $('aba-geral').hidden = a !== 'geral';
    if (a === 'geral' && !todas) carregarGeral();
  }
  $('tab-minhas').onclick = () => trocarAba('minhas');
  $('tab-geral').onclick = () => trocarAba('geral');

  async function carregarGeral() {
    $('g-grupos').innerHTML = '<p class="dica">Carregando...</p>';
    todas = await listarOcorrencias(); renderGeral();
  }
  const semAcento = txt => String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function renderGeral() {
    if (!todas) return;
    const q = semAcento($('g-busca').value.trim());
    const lista = todas.filter(o => !q || semAcento([o.autor, o.endereco, o.descricao, CATEGORIAS[o.categoria]].join(' ')).includes(q));
    $('g-total').textContent = q ? `${lista.length} de ${todas.length} ocorrências` : `${todas.length} ocorrências`;
    $('g-grupos').innerHTML = STATUS.map(st => {
      const doStatus = lista.filter(o => o.status === st);
      return `<details class="grupo" ${doStatus.length ? 'open' : ''}>
        <summary>${selo(st)}<span class="conta">${doStatus.length}</span></summary>
        <div class="itens">${doStatus.map(o => `<div class="item">${fotoHTML(o)}<div class="info">
          <b>${esc(CATEGORIAS[o.categoria])}</b>${o.user_id === s.id ? '<span class="tag sua">Sua</span>' : ''}<br>${esc(o.descricao)}<br>
          <small>📍 ${esc(enderecoTexto(o))}<br>${esc(o.autor)} · ${dataBR(o.criado_em)}</small>
          <details><summary>Ver andamento</summary>${tempoHTML(o)}</details></div></div>`).join('')
          || `<p class="dica">${q ? 'Nenhum resultado para a busca.' : 'Nenhuma ocorrência neste status.'}</p>`}</div>
      </details>`;
    }).join('');
  }
  $('g-busca').oninput = renderGeral;
  function render() {
    const m = minhas;
    $('k-total').textContent = m.length;
    $('k-and').textContent = m.filter(o => o.status === 'Em análise' || o.status === 'Em andamento').length;
    $('k-res').textContent = m.filter(o => o.status === 'Resolvida').length;
    $('lista').innerHTML = m.map(o => `<div class="item">${fotoHTML(o)}<div class="info">
      <b>${esc(CATEGORIAS[o.categoria])}</b> ${selo(o.status)}<br>${esc(o.descricao)}<br>
      <small>📍 ${esc(enderecoTexto(o))}<br>${dataBR(o.criado_em)}</small>
      <details><summary>Acompanhar andamento</summary>${tempoHTML(o)}</details></div></div>`).join('')
      || '<div class="card vazio">Você ainda não registrou nenhuma ocorrência.<br>Clique em “Nova ocorrência” para começar.</div>';
  }

  const dlg = $('dlg');
  $('btn-nova').onclick = () => dlg.showModal();
  $('btn-cancelar').onclick = () => dlg.close();

  $('foto').onchange = async e => {
    if (!e.target.files[0]) return;
    try {
      if (foto) URL.revokeObjectURL(foto.url);
      foto = await reduzirFoto(e.target.files[0]);
      $('preview').src = foto.url; $('preview').hidden = false;
    } catch (err) { foto = null; e.target.value = ''; toast(err.message); }
  };

  // ----- Localização: GPS ou endereço digitado -----
  function definirLocal(p, texto) {
    pos = p; endereco = texto;
    $('gps-status').textContent = '✔ ' + texto;
  }
  function limparLocal() { pos = null; endereco = ''; $('gps-status').textContent = 'Localização não definida'; $('sugestoes').innerHTML = ''; }
  function modo(m) {
    $('m-gps').classList.toggle('on', m === 'gps'); $('m-man').classList.toggle('on', m === 'man');
    $('bloco-gps').hidden = m !== 'gps'; $('bloco-man').hidden = m !== 'man';
    limparLocal();
  }
  $('m-gps').onclick = () => modo('gps');
  $('m-man').onclick = () => modo('man');

  $('btn-gps').onclick = () => {
    if (!navigator.geolocation) { $('gps-status').textContent = 'GPS indisponível. Use a opção "Digitar endereço".'; return; }
    $('gps-status').textContent = 'Buscando sua localização...';
    navigator.geolocation.getCurrentPosition(async p => {
      const c = { lat: p.coords.latitude, lng: p.coords.longitude };
      $('gps-status').textContent = 'Identificando o endereço...';
      const end = await enderecoPorCoordenadas(c.lat, c.lng);
      if (end) definirLocal(c, end);
      else { pos = c; endereco = ''; $('gps-status').textContent = '✔ Localização obtida (não foi possível identificar o endereço; você pode digitá-lo na outra opção).'; }
    }, () => { $('gps-status').textContent = 'Não foi possível obter a localização. Verifique a permissão ou digite o endereço.'; });
  };

  async function buscar() {
    const q = $('endereco').value.trim();
    if (q.length < 4) { $('gps-status').textContent = 'Digite pelo menos rua e bairro/número.'; return; }
    $('gps-status').textContent = 'Buscando endereço...'; $('sugestoes').innerHTML = '';
    const res = await buscarEnderecos(q);
    if (!res.length) { $('gps-status').textContent = 'Nenhum endereço encontrado. Tente incluir o bairro ou a cidade.'; return; }
    $('gps-status').textContent = 'Escolha o endereço correto:';
    $('sugestoes').innerHTML = res.map((r, i) => `<button type="button" class="sug" data-i="${i}">📍 ${esc(r.texto)}</button>`).join('');
    document.querySelectorAll('.sug').forEach(b => b.onclick = () => {
      const r = res[+b.dataset.i];
      definirLocal({ lat: r.lat, lng: r.lng }, r.texto);
      $('endereco').value = r.texto; $('sugestoes').innerHTML = '';
    });
  }
  $('btn-buscar').onclick = buscar;
  $('endereco').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } };
  $('endereco').oninput = () => { if (pos) limparLocal(); };   // mudou o texto: precisa escolher de novo

  $('btn-ia').onclick = async () => {
    const d = $('descricao').value.trim();
    if (!d) { $('ia-status').textContent = 'Escreva a descrição primeiro.'; return; }
    const btn = $('btn-ia'); btn.disabled = true;
    $('ia-status').textContent = foto ? 'Analisando a foto e a descrição...' : 'Analisando a descrição...';
    const r = await classificarProblema(d, foto && foto.blob);
    btn.disabled = false;
    $('categoria').value = r.categoria;
    $('ia-status').textContent = r.origem === 'ia'
      ? `Sugestão da IA: ${CATEGORIAS[r.categoria]}${r.confianca === 'baixa' ? ' (pouca certeza)' : ''}${r.motivo ? ' — ' + r.motivo : ''}. Você pode alterar.`
      : `IA indisponível (${r.aviso}). Sugestão por palavras-chave: ${CATEGORIAS[r.categoria]}. Você pode alterar.`;
  };

  $('form').onsubmit = async e => {
    e.preventDefault();
    if (!pos) { toast('Defina a localização: use o GPS ou digite e escolha um endereço.'); return; }
    const btn = $('btn-enviar'); btn.disabled = true; btn.textContent = 'Enviando...';
    try {
      await criarOcorrencia(s.id, { descricao: $('descricao').value.trim(), categoria: $('categoria').value,
        endereco: endereco || null, lat: pos.lat, lng: pos.lng }, foto && foto.blob);
    } catch (err) {
      toast('Não foi possível enviar: ' + mensagemErro(err)); return;
    } finally { btn.disabled = false; btn.textContent = 'Enviar'; }
    e.target.reset(); $('preview').hidden = true;
    if (foto) URL.revokeObjectURL(foto.url); foto = null;
    modo('gps'); $('ia-status').textContent = '';
    dlg.close(); toast('Ocorrência enviada à prefeitura!');
    carregar();
  };
  carregar();
})();
