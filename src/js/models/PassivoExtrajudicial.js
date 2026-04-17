// ============================================================
// MODEL: PassivoExtrajudicial — RF-066
// ============================================================

export const STATUS_PASSIVO = [
  'em_acompanhamento',
  'em_negociacao',
  'parcelada',
  'quitada',
];

export function modelPassivoExtrajudicial(dados) {
  const obj = {
    grupoId:        dados.grupoId,
    credor:         String(dados.credor ?? '').trim(),
    descricao:      String(dados.descricao ?? '').trim(),
    valorOriginal:  Number(dados.valorOriginal ?? 0),
    valorAtualizado: Number(dados.valorAtualizado ?? dados.valorOriginal ?? 0),
    dataOrigem:     dados.dataOrigem instanceof Date
      ? dados.dataOrigem
      : new Date(dados.dataOrigem ?? Date.now()),
    status:         dados.status ?? 'em_acompanhamento',
  };
  const opcionais = ['observacoes'];
  opcionais.forEach((k) => { if (dados[k] !== undefined) obj[k] = dados[k]; });
  return obj;
}

export function criarPassivoExtrajudicial({ grupoId, credor, descricao, valorOriginal, valorAtualizado, dataOrigem, status }) {
  if (!grupoId)          throw new Error('grupoId é obrigatório');
  if (!credor?.trim())   throw new Error('Credor é obrigatório');
  if (!valorOriginal || valorOriginal <= 0) throw new Error('Valor original deve ser maior que zero');
  return modelPassivoExtrajudicial({ grupoId, credor, descricao, valorOriginal, valorAtualizado, dataOrigem, status });
}
