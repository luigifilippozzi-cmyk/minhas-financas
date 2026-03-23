// ============================================================
// MODEL: Receita — Minhas Finanças
// ============================================================

/**
 * Monta objeto Receita para salvar no Firestore.
 * @param {object} dados
 * @returns {object}
 */
export function modelReceita(dados) {
  const obj = {
    grupoId:     dados.grupoId,
    categoriaId: dados.categoriaId ?? '',
    usuarioId:   dados.usuarioId,
    descricao:   String(dados.descricao ?? '').trim(),
    valor:       Number(dados.valor),
    data:        dados.data instanceof Date ? dados.data : new Date(dados.data),
  };
  if (dados.responsavel !== undefined) obj.responsavel = dados.responsavel;
  return obj;
}

/** Categorias de receita criadas automaticamente para novos grupos */
export const CATEGORIAS_RECEITA_PADRAO = [
  { nome: 'Salário',           emoji: '💼', cor: '#2E7D32', tipo: 'receita' },
  { nome: 'Rendimentos',       emoji: '📈', cor: '#1565C0', tipo: 'receita' },
  { nome: 'Freelance',         emoji: '💻', cor: '#6A1B9A', tipo: 'receita' },
  { nome: 'Aluguel Recebido',  emoji: '🏠', cor: '#E65100', tipo: 'receita' },
  { nome: 'Outros',            emoji: '🎁', cor: '#546E7A', tipo: 'receita' },
];
