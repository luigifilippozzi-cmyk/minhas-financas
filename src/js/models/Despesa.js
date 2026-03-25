// ============================================================
// MODEL: Despesa — Minhas Finanças
// ============================================================

/**
 * RF-014 — Monta objeto Despesa para salvar no Firestore.
 * Inclui campos opcionais de RF-014: responsavel, tipo, chave_dedup,
 * parcelamento_id, portador, parcela.
 * @param {object} dados
 * @returns {object}
 */
export function modelDespesa(dados) {
  const isConj = dados.isConjunta === true;
  const obj = {
    grupoId:      dados.grupoId,
    categoriaId:  dados.categoriaId ?? '',
    usuarioId:    dados.usuarioId,
    descricao:    String(dados.descricao ?? '').trim(),
    valor:        Number(dados.valor),
    data:         dados.data instanceof Date ? dados.data : new Date(dados.data),
    // NRF-001: sempre incluídos para evitar undefined em caches antigos do model
    isConjunta:   isConj,
    valorAlocado: isConj ? (dados.valorAlocado ?? Math.round(Number(dados.valor) * 100 / 2) / 100) : null,
  };
  // Campos opcionais: incluídos apenas se presentes
  const opcionais = [
    'origem', 'portador', 'parcela', 'responsavel',
    'tipo', 'chave_dedup', 'parcelamento_id', 'importadoEm', 'status',
    'contaId', // NRF-004: conta/banco de origem
  ];
  opcionais.forEach((k) => { if (dados[k] !== undefined) obj[k] = dados[k]; });
  return obj;
}

/**
 * Cria um objeto Despesa com validação básica.
 * @param {object} dados
 * @returns {object}
 */
export function criarDespesa({ grupoId, categoriaId, usuarioId, descricao, valor, data }) {
  if (!grupoId)     throw new Error('grupoId é obrigatório');
  if (!categoriaId) throw new Error('categoriaId é obrigatório');
  if (!usuarioId)   throw new Error('usuarioId é obrigatório');
  if (!descricao?.trim()) throw new Error('Descrição é obrigatória');
  if (!valor || valor <= 0) throw new Error('Valor deve ser maior que zero');
  if (!data) throw new Error('Data é obrigatória');

  return {
    grupoId,
    categoriaId,
    usuarioId,
    descricao: descricao.trim(),
    valor: Number(valor),
    data: data instanceof Date ? data : new Date(data),
  };
}
