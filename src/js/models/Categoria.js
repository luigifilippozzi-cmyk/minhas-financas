// ============================================================
// MODEL: Categoria — Minhas Finanças
// ============================================================

/** Categorias criadas automaticamente ao criar um novo grupo */
export const CATEGORIAS_PADRAO = [
  { nome: 'Alimentação', emoji: '🍔', cor: '#FF6B6B', tipo: 'despesa' },
  { nome: 'Transporte',  emoji: '🚗', cor: '#4ECDC4', tipo: 'despesa' },
  { nome: 'Saúde',       emoji: '🏥', cor: '#45B7D1', tipo: 'despesa' },
  { nome: 'Lazer',       emoji: '🎮', cor: '#FFA07A', tipo: 'despesa' },
  { nome: 'Educação',    emoji: '📚', cor: '#98D8C8', tipo: 'despesa' },
  { nome: 'Outros',      emoji: '📦', cor: '#95A5A6', tipo: 'despesa' },
];

/**
 * Cria um objeto Categoria com validação básica.
 * @param {object} dados
 * @returns {object}
 */
export function criarCategoria({ grupoId, nome, emoji = '📦', cor = '#95A5A6', orcamentoMensal = 0, isConjuntaPadrao = false, tipo = 'despesa' }) {
  if (!grupoId) throw new Error('grupoId é obrigatório');
  if (!nome?.trim()) throw new Error('Nome é obrigatório');

  return {
    grupoId,
    nome: nome.trim(),
    emoji,
    cor,
    orcamentoMensal: Number(orcamentoMensal),
    // NRF-001: se verdadeiro, despesas desta categoria são
    // automaticamente marcadas como conjuntas (50/50)
    isConjuntaPadrao: Boolean(isConjuntaPadrao),
    tipo,
    ativa: true,
  };
}
