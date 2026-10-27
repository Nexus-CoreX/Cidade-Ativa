// Ponto único de integração com a IA.
// Hoje: palavras-chave (offline). Depois: chamar o BACK-END do grupo, que consulta o GPT-4o mini.
// NUNCA coloque a chave da API aqui: qualquer pessoa conseguiria vê-la no navegador.
const PALAVRAS = {
  buraco:['buraco','asfalto','cratera','rachadura'],
  iluminacao:['lâmpada','lampada','poste','iluminação','iluminacao','escuro','luz'],
  lixo:['lixo','entulho','descarte','sujeira','resíduo','residuo'],
  sinalizacao:['placa','semáforo','semaforo','faixa','sinalização','sinalizacao']
};
async function classificarProblema(descricao, fotoBase64) {
  // const r = await fetch('/api/classificar', {method:'POST', headers:{'Content-Type':'application/json'},
  //   body: JSON.stringify({ descricao, foto: fotoBase64 })});
  // if (r.ok) return (await r.json()).categoria;
  await new Promise(r => setTimeout(r, 600));
  const t = descricao.toLowerCase();
  for (const [cat, ps] of Object.entries(PALAVRAS)) if (ps.some(p => t.includes(p))) return cat;
  return 'outros';
}
