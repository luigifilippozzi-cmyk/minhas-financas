// ============================================================
// CONTROLLER: Orçamentos — RF-004
// ============================================================

import { definirOrcamento, ouvirOrcamentos } from '../services/database.js';

let _unsubscribeOrcamentos = null;

/**
 * Inicia listener de orçamentos em tempo real.
 * @param {string} grupoId
 * @param {number} mes
 * @param {number} ano
 * @param {function} onChange
 */
export function iniciarListenerOrcamentos(grupoId, mes, ano, onChange) {
  if (_unsubscribeOrcamentos) _unsubscribeOrcamentos();
  _unsubscribeOrcamentos = ouvirOrcamentos(grupoId, mes, ano, onChange);
}

/**
 * Salva ou atualiza o orçamento de uma categoria.
 * @param {string} grupoId
 * @param {string} categoriaId
 * @param {number} mes
 * @param {number} ano
 * @param {number} valorLimite
 */
export async function salvarOrcamento(grupoId, categoriaId, mes, ano, valorLimite) {
  await definirOrcamento({ grupoId, categoriaId, mes, ano, valorLimite: Number(valorLimite) });
}
