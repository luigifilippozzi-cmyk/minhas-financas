// ============================================================
// MODEL: Investimento — RF-066
// ============================================================

export const TIPOS_INVESTIMENTO = [
  'renda_fixa',
  'renda_variavel',
  'previdencia',
  'criptoativo',
  'outro',
];

export function modelInvestimento(dados) {
  const obj = {
    grupoId:         dados.grupoId,
    nome:            String(dados.nome ?? '').trim(),
    tipo:            dados.tipo ?? 'outro',
    instituicao:     String(dados.instituicao ?? '').trim(),
    valorAplicado:   Number(dados.valorAplicado ?? 0),
    valorAtual:      Number(dados.valorAtual ?? dados.valorAplicado ?? 0),
    dataAtualizacao: dados.dataAtualizacao instanceof Date
      ? dados.dataAtualizacao
      : new Date(dados.dataAtualizacao ?? Date.now()),
    ativo:           dados.ativo !== false,
  };
  const opcionais = ['liquidez', 'vencimento', 'observacoes'];
  opcionais.forEach((k) => { if (dados[k] !== undefined) obj[k] = dados[k]; });
  return obj;
}

export function criarInvestimento({ grupoId, nome, tipo, instituicao, valorAplicado, valorAtual }) {
  if (!grupoId)          throw new Error('grupoId é obrigatório');
  if (!nome?.trim())     throw new Error('Nome é obrigatório');
  if (!valorAplicado || valorAplicado <= 0) throw new Error('Valor aplicado deve ser maior que zero');
  return modelInvestimento({ grupoId, nome, tipo, instituicao, valorAplicado, valorAtual });
}
