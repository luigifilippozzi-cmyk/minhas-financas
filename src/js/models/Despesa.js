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
  const obj = {
    grupoId:     dados.grupoId,
    categoriaId: dados.categoriaId ?? '',
    usuarioId:   dados.usuarioId,
    descricao:   String(dados.descricao ?? '').trim(),
    valor:       Number(dados.valor),
    data:        dados.data instanceof Date ? dados.data : new Date(dados.data),
  };
  // Campos opcionais: incluídos apenas se presentes
  // NRF-001: isConjunta, valorAlocado
  // NRF-002: status
  const opcionais = [
    'origem', 'portador', 'parcela', 'responsavel',
    'tipo', 'chave_dedup', 'parcelamento_id', 'importadoEm',
    'isConjunta', 'valorAlocado', 'status',
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
