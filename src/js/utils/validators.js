// ============================================================
// UTILITÁRIOS: Validação — Minhas Finanças
// ============================================================

/**
 * Verifica se um email tem formato válido.
 * @param {string} email
 * @returns {boolean}
 */
export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Verifica se a senha tem o tamanho mínimo.
 * @param {string} senha
 * @param {number} minimo
 * @returns {boolean}
 */
export function senhaValida(senha, minimo = 6) {
  return typeof senha === 'string' && senha.length >= minimo;
}

/**
 * Verifica se um valor monetário é válido.
 * @param {any} valor
 * @returns {boolean}
 */
export function valorMonetarioValido(valor) {
  const num = Number(valor);
  return !isNaN(num) && num > 0;
}

/**
 * Verifica se uma string não está vazia.
 * @param {string} str
 * @returns {boolean}
 */
export function naoVazio(str) {
  return typeof str === 'string' && str.trim().length > 0;
}
