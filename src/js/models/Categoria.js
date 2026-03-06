// ============================================================
// MODEL: Categoria — Minhas Finanças
// ============================================================

/** Categorias criadas automaticamente ao criar um novo grupo */
export const CATEGORIAS_PADRAO = [
  { nome: 'Alimentação', emoji: '🍔', cor: '#FF6B6B' },
  { nome: 'Transporte',  emoji: '🚗', cor: '#4ECDC4' },
  { nome: 'Saúde',       emoji: '🏥', cor: '#45B7D1' },
  { nome: 'Lazer',       emoji: '🎮', cor: '#FFA07A' },
  { nome: 'Educação',    emoji: '📚', cor: '#98D8C8' },
  { nome: 'Outros',      emoji: '📦', cor: '#95A5A6' },
];

/**
 * Cria um objeto Categoria com validação básica.
 * @param {object} dados
 * @returns {object}
 */
export function criarCategoria({ grupoId, nome, emoji = '📦', cor = '#95A5A6', orcamentoMensal = 0 }) {
  if (!grupoId) throw new Error('grupoId é obrigatório');
  if (!nome?.trim()) throw new Error('Nome é obrigatório');

  return {
    grupoId,
    nome: nome.trim(),
    emoji,
    cor,
    orcamentoMensal: Number(orcamentoMensal),
    ativa: true,
  };
}
