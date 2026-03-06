// ============================================================
// MODEL: Usuario — Minhas Finanças
// ============================================================

/**
 * Cria um objeto de perfil de usuário.
 * @param {object} dados
 * @returns {object}
 */
export function criarPerfil({ nome, email, grupoId = null }) {
  if (!nome?.trim()) throw new Error('Nome é obrigatório');
  if (!email?.trim()) throw new Error('Email é obrigatório');

  return {
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    grupoId,
  };
}
