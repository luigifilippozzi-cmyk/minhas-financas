// ============================================================
// MODEL: Grupo — Minhas Finanças
// ============================================================

/**
 * Gera um código de convite aleatório de 6 caracteres.
 * @returns {string}
 */
export function gerarCodigoConvite() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Cria um objeto Grupo com validação básica.
 * @param {object} dados
 * @returns {object}
 */
export function criarGrupo({ nome, userId }) {
  if (!nome?.trim()) throw new Error('Nome do grupo é obrigatório');
  if (!userId) throw new Error('userId é obrigatório');

  return {
    nome: nome.trim(),
    membros: [userId],
    codigoConvite: gerarCodigoConvite(),
  };
}
