// ============================================================
// MODEL: Grupo — Minhas Finanças (RF-002)
// ============================================================

/**
 * Gera um código de convite aleatório de 6 caracteres.
 * Remove caracteres confusos: 0, O, 1, I.
 * Exemplo: "A3F9KZ"
 * @returns {string}
 */
export function gerarCodigoConvite() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Cria o objeto base de um novo Grupo para salvar no Firestore.
 * @param {string} nome        - Nome do grupo (ex: "Família Silva")
 * @param {string} userId      - UID do usuário criador
 * @param {string} nomeUsuario - Nome de exibição do usuário criador
 * @returns {object}
 */
export function criarGrupo({ nome, userId, nomeUsuario }) {
  if (!nome?.trim()) throw new Error('Nome do grupo é obrigatório');
  if (!userId) throw new Error('userId é obrigatório');

  return {
    nome: nome.trim(),
    membros: [userId],
    nomesMembros: { [userId]: nomeUsuario || 'Membro' },
    codigoConvite: gerarCodigoConvite(),
    criadoPor: userId,
    maxMembros: 2,
  };
}
