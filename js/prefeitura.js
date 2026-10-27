(async () => {
  await iniciarDados();
  const s = exigirPerfil('prefeitura'); if (!s) return;
  let fStatus = '';

  for (const [k, v] of Object.entries(CATEGORIAS)) $('f-cat').add(new Option(v, k));
  const todas = () => ler(K.occ, []).sort((a, b) => b.data.localeCompare(a.data));

  const mapa = L.map('mapa').setView([-23.5015, -47.4526], 13); // Sorocaba
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(mapa);
  const camada = L.layerGroup().addTo(mapa);

  function filtradas() {
    const q = $('busca').value.toLowerCase(), c = $('f-cat').value;
    return todas().filter(o => (!fStatus || o.status === fStatus) && (!c || o.categoria === c) &&
      (!q || (o.descricao + ' ' + o.autor).toLowerCase().includes(q)));
  }
  function render() {
    const t = todas();
    $('kpis').innerHTML = `<button class="kpi ${fStatus ? '' : 'on'}" data-s=""><b>${t.length}</b><span>Todas</span></button>` +
      STATUS.map(st => `<button class="kpi ${fStatus === st ? 'on' : ''}" data-s="${st}" style="border-left-color:${COR[st]}">
        <b>${t.filter(o => o.status === st).length}</b><span>${st}</span></button>`).join('');
    document.querySelectorAll('.kpi').forEach(b => b.onclick = () => { fStatus = b.dataset.s; render(); });

    const lista = filtradas();
    $('lista').innerHTML = lista.map(o => `<div class="item clic" data-id="${o.id}">${fotoHTML(o)}<div class="info">
      <b>${esc(CATEGORIAS[o.categoria])}</b> ${selo(o.status)}<br>${esc(o.descricao)}<br>
      <small>📍 ${esc(enderecoTexto(o))}<br>${esc(o.autor)} · ${dataBR(o.data)}</small></div></div>`).join('')
      || '<div class="vazio">Nenhuma ocorrência encontrada.</div>';
    document.querySelectorAll('.item.clic').forEach(el => el.onclick = () => abrir(+el.dataset.id));

    camada.clearLayers();
    lista.forEach(o => L.marker([o.lat, o.lng], { icon:L.divIcon({ className:'pin', iconSize:[20,20], iconAnchor:[10,20],
      html:`<span style="background:${COR[o.status]}"></span>` }) })
      .addTo(camada).on('click', () => abrir(o.id)).bindTooltip(esc(CATEGORIAS[o.categoria])));
    if (lista.length) mapa.fitBounds(L.latLngBounds(lista.map(o => [o.lat, o.lng])).pad(0.3), { maxZoom:15 });
  }

  function abrir(id) {
    const o = todas().find(x => x.id === id); if (!o) return;
    $('det').innerHTML = `<h2>${esc(CATEGORIAS[o.categoria])} ${selo(o.status)}</h2>
      ${o.foto ? `<img class="foto-g" src="${o.foto}" alt="Foto">` : ''}
      <p>${esc(o.descricao)}</p>
      <p class="dica">Enviada por <b>${esc(o.autor)}</b> em ${dataBR(o.data)}<br>
      Local: <b>${esc(enderecoTexto(o))}</b> · <a href="https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lng}#map=18/${o.lat}/${o.lng}" target="_blank" rel="noopener">ver no mapa</a></p>
      ${tempoHTML(o)}
      <hr style="border:0;border-top:1px solid var(--borda);margin:16px 0">
      <label>Novo status<select id="n-status">${STATUS.map(x => `<option ${x === o.status ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>Mensagem para o cidadão<textarea id="n-nota" rows="3" placeholder="Ex.: Equipe agendada para quinta-feira."></textarea></label>
      <div class="acoes"><button class="btn-sec" id="n-fechar">Fechar</button><button class="btn" id="n-salvar">Salvar análise</button></div>`;
    $('n-fechar').onclick = () => $('dlg').close();
    $('n-salvar').onclick = () => {
      const lista = ler(K.occ, []), alvo = lista.find(x => x.id === id);
      alvo.status = $('n-status').value;
      (alvo.historico ||= []).push({ data:new Date().toISOString(), status:alvo.status,
        nota:$('n-nota').value.trim() || 'Status atualizado.', por:s.nome });
      if (!gravar(K.occ, lista)) return;
      $('dlg').close(); render(); toast('Análise registrada. O cidadão já pode ver.');
    };
    $('dlg').showModal();
  }
  $('busca').oninput = render; $('f-cat').onchange = render;
  render();
})();
