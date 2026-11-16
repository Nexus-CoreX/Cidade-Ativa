// Ponto único de integração com a IA.
// A classificação é feita pela Edge Function "classificar" do Supabase
// (supabase/functions/classificar), que guarda a chave da IA no servidor.
// NUNCA coloque a chave da API aqui: qualquer pessoa conseguiria vê-la no navegador.
// Se a função não estiver publicada ou falhar, usamos as palavras-chave abaixo.
const PALAVRAS = {
  buraco:['buraco','asfalto','cratera','rachadura'],
  iluminacao:['lâmpada','lampada','poste','iluminação','iluminacao','escuro','luz'],
  lixo:['lixo','entulho','descarte','sujeira','resíduo','residuo'],
  sinalizacao:['placa','semáforo','semaforo','faixa','sinalização','sinalizacao']
};

function classificarPorPalavras(descricao) {
  const t = descricao.toLowerCase();
  for (const [cat, ps] of Object.entries(PALAVRAS)) if (ps.some(p => t.includes(p))) return cat;
  return 'outros';
}

// Blob da foto -> texto base64 (sem o prefixo "data:...;base64,")
function blobParaBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

// Devolve { categoria, origem: 'ia' | 'palavras', motivo?, confianca?, aviso? }
async function classificarProblema(descricao, fotoBlob) {
  try {
    const corpo = { descricao };
    if (fotoBlob) { corpo.foto = await blobParaBase64(fotoBlob); corpo.tipo = fotoBlob.type || 'image/jpeg'; }
    const { data, error } = await sb.functions.invoke('classificar', { body: corpo });
    if (error) {
      let msg = error.message;
      try { const j = await error.context.json(); if (j && j.erro) msg = j.erro; } catch {}
      throw new Error(msg);
    }
    if (!data || !CATEGORIAS[data.categoria]) throw new Error('Resposta inesperada da IA.');
    return { categoria: data.categoria, origem: 'ia', motivo: data.motivo, confianca: data.confianca };
  } catch (e) {
    console.warn('IA indisponível, usando palavras-chave:', e);
    return { categoria: classificarPorPalavras(descricao), origem: 'palavras', aviso: e.message };
  }
}
