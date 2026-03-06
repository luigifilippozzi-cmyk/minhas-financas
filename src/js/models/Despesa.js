// ============================================================
// MODEL: Despesa — Minhas Finanças
// ============================================================

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
