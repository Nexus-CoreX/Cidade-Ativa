// Endereços via Nominatim (OpenStreetMap): gratuito, sem chave. Use com moderação (máx. 1 consulta/segundo).
// Em produção, o ideal é o back-end fazer essas consultas (ou usar um serviço próprio, como o Google Geocoding).
const NOMINATIM = 'https://nominatim.openstreetmap.org';

function formatarEndereco(r) {
  const a = r.address || {};
  const rua = a.road || a.pedestrian || a.footway || a.path;
  const via = rua ? (a.house_number ? `${rua}, ${a.house_number}` : rua) : '';
  const bairro = a.suburb || a.neighbourhood || a.quarter || a.city_district;
  const cidade = a.city || a.town || a.village || a.municipality;
  const base = [via, bairro].filter(Boolean).join(' – ');
  const txt = base + (cidade ? (base ? ', ' : '') + cidade : '');
  return txt || String(r.display_name || '').split(',').slice(0, 3).join(',').trim();
}

// Coordenadas -> endereço (usado pelo botão "Usar minha localização")
async function enderecoPorCoordenadas(lat, lng) {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=pt-BR&lat=${lat}&lon=${lng}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j && !j.error ? formatarEndereco(j) : null;
  } catch { return null; }
}

// Texto digitado -> lista de endereços possíveis (priorizando a região de Sorocaba, sem restringir)
async function buscarEnderecos(texto) {
  try {
    const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&accept-language=pt-BR` +
      `&viewbox=-47.60,-23.35,-47.30,-23.65&q=${encodeURIComponent(texto)}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    return (await r.json()).map(x => ({ texto: formatarEndereco(x), lat: parseFloat(x.lat), lng: parseFloat(x.lon) }));
  } catch { return []; }
}
