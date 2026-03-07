// ============================================================
// CONTROLLER: Orçamentos — RF-004
// Orçamentos mensais por categoria, compartilhados entre membros.
// Qualquer alteração feita por um usuário é sincronizada em
// tempo real para o outro via onSnapshot.
// ============================================================

import {
  definirOrcamento,
  ouvirOrcamentos,
  buscarOrcamentos,
  ouvirDespesas,
} from '../services/database.js';

let _unsubscribeOrcamentos = null;
let _unsubscribeDespesas   = null;

// ── Listeners ─────────────────────────────────────────────────

/**
 * Listener em tempo real de orçamentos para o mês/ano.
 * Ambos os membros do grupo recebem atualizações imediatamente.
 *
 * @param {string}   grupoId
 * @param {number}   mes
 * @param {number}   ano
 * @param {function} onChange  - callback({ [categoriaId]: valorLimite })
 * @returns {function} unsubscribe
 */
export function iniciarListenerOrcamentos(grupoId, mes, ano, onChange) {
  if (_unsubscribeOrcamentos) _unsubscribeOrcamentos();
  _unsubscribeOrcamentos = ouvirOrcamentos(grupoId, mes, ano, onChange);
  return _unsubscribeOrcamentos;
}

/**
 * Listener em tempo real de despesas para o mês/ano.
 * Usado na página de orçamentos para exibir gasto atual.
 *
 * @param {string}   grupoId
 * @param {number}   mes
 * @param {number}   ano
 * @param {function} onChange  - callback(despesas[])
 * @returns {function} unsubscribe
 */
export function iniciarListenerDespesasOrcamento(grupoId, mes, ano, onChange) {
  if (_unsubscribeDespesas) _unsubscribeDespesas();
  _unsubscribeDespesas = ouvirDespesas(grupoId, mes, ano, onChange);
  return _unsubscribeDespesas;
}

// ── Escritas ──────────────────────────────────────────────────

/**
 * Salva ou atualiza o limite de orçamento de uma categoria.
 * Usa setDoc com merge=true → qualquer usuário pode salvar sem sobrescrever outros campos.
 * A alteração dispara onSnapshot em todos os listeners ativos do grupo.
 *
 * @param {string} grupoId
 * @param {string} categoriaId
 * @param {number} mes
 * @param {number} ano
 * @param {number} valorLimite   — 0 = sem limite
 */
export async function salvarOrcamento(grupoId, categoriaId, mes, ano, valorLimite) {
  const valor = Math.max(0, Number(valorLimite) || 0);
  await definirOrcamento({ grupoId, categoriaId, mes, ano, valorLimite: valor });
}

/**
 * Copia os orçamentos do mês anterior para o mês atual.
 * Não sobrescreve valores já definidos para o mês atual.
 *
 * @param {string} grupoId
 * @param {number} mes      — mês destino (atual)
 * @param {number} ano      — ano destino (atual)
 * @returns {Promise<number>} — quantidade de orçamentos copiados
 */
export async function copiarMesAnterior(grupoId, mes, ano) {
  // Calcula mês anterior
  const mesAnt = mes === 1 ? 12 : mes - 1;
  const anoAnt = mes === 1 ? ano - 1 : ano;

  // Busca orçamentos do mês anterior (leitura única)
  const anteriores = await buscarOrcamentos(grupoId, mesAnt, anoAnt);
  if (!anteriores.length) return 0;

  // Busca orçamentos já existentes no mês atual para não sobrescrever
  const atuais = await buscarOrcamentos(grupoId, mes, ano);
  const jaDefinidos = new Set(atuais.map((o) => o.categoriaId));

  // Copia apenas os que ainda não foram definidos no mês atual
  const copias = anteriores.filter((o) => !jaDefinidos.has(o.categoriaId));
  await Promise.all(
    copias.map((o) =>
      definirOrcamento({
        grupoId,
        categoriaId: o.categoriaId,
        mes,
        ano,
        valorLimite: o.valorLimite,
      })
    )
  );

  return copias.length;
}
