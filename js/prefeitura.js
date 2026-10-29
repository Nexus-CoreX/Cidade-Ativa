(async () => {
  const s = await exigirPerfil('prefeitura'); if (!s) return;
  let fStatus = '', ocorrencias = [];

  for (const [k, v] of Object.entries(CATEGORIAS)) $('f-cat').add(new Option(v, k));

  const mapa = L.map('mapa').setView([-23.5015, -47.4526], 13); // Sorocaba
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(mapa);
  const camada = L.layerGroup().addTo(mapa);

  async function carregar() { ocorrencias = await listarOcorrencias(); render(); }

  // ----- Indicadores (Chart.js) -----
  const graficos = {};
  function desenhar(id, config) {
    if (!window.Chart) return;                       // biblioteca não carregou (sem internet)
    if (graficos[id]) { graficos[id].data = config.data; graficos[id].update(); return; }
    graficos[id] = new Chart($(id), config);
  }
  function atualizarGraficos(lista) {
    if (!window.Chart) { $('g-legenda').textContent = 'Não foi possível carregar os gráficos.'; return; }
    const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
    const inteiros = { beginAtZero: true, ticks: { precision: 0 } };

    desenhar('g-status', { type: 'doughnut',
      data: { labels: STATUS, datasets: [{ data: STATUS.map(st => lista.filter(o => o.status === st).length),
        backgroundColor: STATUS.map(st => COR[st]) }] },
      options: { ...base, plugins: { legend: { position: 'bottom' } } } });

    const cats = Object.keys(CATEGORIAS);
    desenhar('g-cat', { type: 'bar',
      data: { labels: cats.map(c => CATEGORIAS[c]), datasets: [{ label: 'Ocorrências',
        data: cats.map(c => lista.filter(o => o.categoria === c).length), backgroundColor: '#2563eb', borderRadius: 6 }] },
      options: { ...base, indexAxis: 'y', scales: { x: inteiros } } });

    const meses = [], hoje = new Date();
    for (let i = 5; i >= 0; i--) meses.push(new Date(hoje.getFullYear(), hoje.getMonth() - i, 1));
    const chave = d => d.getFullYear() * 12 + d.getMonth();
    desenhar('g-mes', { type: 'bar',
      data: { labels: meses.map(d => d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })),
        datasets: [{ label: 'Ocorrências', backgroundColor: '#0f766e', borderRadius: 6,
          data: meses.map(m => lista.filter(o => chave(new Date(o.criado_em)) === chave(m)).length) }] },
      options: { ...base, scales: { y: inteiros } } });
  }

  // ----- Exportação CSV (abre direto no Excel em português) -----
  function exportarCSV() {
    const lista = filtradas();
    if (!lista.length) { toast('Não há ocorrências para exportar com esses filtros.'); return; }
    const campo = v => { const s = String(v ?? ''); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const linhas = [['ID', 'Data', 'Categoria', 'Status', 'Descrição', 'Endereço', 'Latitude', 'Longitude', 'Autor', 'Foto']]
      .concat(lista.map(o => [o.id, dataBR(o.criado_em), CATEGORIAS[o.categoria], o.status, o.descricao,
        o.endereco, String(o.lat).replace('.', ','), String(o.lng).replace('.', ','), o.autor, o.foto_url]));
    const csv = '\ufeff' + linhas.map(l => l.map(campo).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `ocorrencias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`${lista.length} ocorrência(s) exportada(s).`);
  }
  $('btn-csv').onclick = exportarCSV;

  function filtradas() {
    const q = $('busca').value.toLowerCase(), c = $('f-cat').value;
    return ocorrencias.filter(o => (!fStatus || o.status === fStatus) && (!c || o.categoria === c) &&
      (!q || (o.descricao + ' ' + o.autor + ' ' + (o.endereco || '')).toLowerCase().includes(q)));
  }
  function render() {
    const t = ocorrencias;
    $('kpis').innerHTML = `<button class="kpi ${fStatus ? '' : 'on'}" data-s=""><b>${t.length}</b><span>Todas</span></button>` +
      STATUS.map(st => `<button class="kpi ${fStatus === st ? 'on' : ''}" data-s="${st}" style="border-left-color:${COR[st]}">
        <b>${t.filter(o => o.status === st).length}</b><span>${st}</span></button>`).join('');
    document.querySelectorAll('.kpi').forEach(b => b.onclick = () => { fStatus = b.dataset.s; render(); });

    const lista = filtradas();
    $('lista').innerHTML = lista.map(o => `<div class="item clic" data-id="${o.id}">${fotoHTML(o)}<div class="info">
      <b>${esc(CATEGORIAS[o.categoria])}</b> ${selo(o.status)}<br>${esc(o.descricao)}<br>
      <small>📍 ${esc(enderecoTexto(o))}<br>${esc(o.autor)} · ${dataBR(o.criado_em)}</small></div></div>`).join('')
      || '<div class="vazio">Nenhuma ocorrência encontrada.</div>';
    document.querySelectorAll('.item.clic').forEach(el => el.onclick = () => abrir(+el.dataset.id));

    camada.clearLayers();
    lista.forEach(o => L.marker([o.lat, o.lng], { icon:L.divIcon({ className:'pin', iconSize:[20,20], iconAnchor:[10,20],
      html:`<span style="background:${COR[o.status]}"></span>` }) })
      .addTo(camada).on('click', () => abrir(o.id)).bindTooltip(esc(CATEGORIAS[o.categoria])));
    atualizarGraficos(lista);
    if (lista.length) mapa.fitBounds(L.latLngBounds(lista.map(o => [o.lat, o.lng])).pad(0.3), { maxZoom:15 });
  }

  function abrir(id) {
    const o = ocorrencias.find(x => x.id === id); if (!o) return;
    $('det').innerHTML = `<h2>${esc(CATEGORIAS[o.categoria])} ${selo(o.status)}</h2>
      ${o.foto_url ? `<a href="${esc(o.foto_url)}" target="_blank" rel="noopener"><img class="foto-g" src="${esc(o.foto_url)}" alt="Foto"></a>` : ''}
      <p>${esc(o.descricao)}</p>
      <p class="dica">Enviada por <b>${esc(o.autor)}</b> em ${dataBR(o.criado_em)}<br>
      Local: <b>${esc(enderecoTexto(o))}</b> · <a href="https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lng}#map=18/${o.lat}/${o.lng}" target="_blank" rel="noopener">ver no mapa</a></p>
      ${tempoHTML(o)}
      <hr style="border:0;border-top:1px solid var(--borda);margin:16px 0">
      <label>Novo status<select id="n-status">${STATUS.map(x => `<option ${x === o.status ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>Mensagem para o cidadão<textarea id="n-nota" rows="3" placeholder="Ex.: Equipe agendada para quinta-feira."></textarea></label>
      <div class="acoes"><button class="btn-sec" id="n-fechar">Fechar</button><button class="btn" id="n-salvar">Salvar análise</button></div>`;
    $('n-fechar').onclick = () => $('dlg').close();
    $('n-salvar').onclick = async () => {
      const btn = $('n-salvar'); btn.disabled = true; btn.textContent = 'Salvando...';
      try {
        await atualizarStatus(id, $('n-status').value, $('n-nota').value.trim());
      } catch (err) {
        toast('Não foi possível salvar: ' + mensagemErro(err));
        btn.disabled = false; btn.textContent = 'Salvar análise'; return;
      }
      $('dlg').close(); toast('Análise registrada. O cidadão já pode ver.');
      carregar();
    };
    $('dlg').showModal();
  }
  $('busca').oninput = render; $('f-cat').onchange = render;
  carregar();
})();
