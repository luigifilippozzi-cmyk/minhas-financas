// ============================================================
// projecoesCartao.js — Módulo reutilizável de projeções de cartão
// NRF-NAV Fase 2 (#186) — extração de fatura.js para uso compartilhado
// ============================================================

import { ouvirDespesas } from '../services/database.js';
import { buscarProjecoesRange } from '../services/database.js';

/**
 * Inicia listeners em tempo real de projeções de um cartão específico
 * para os próximos 6 meses a partir do mês/ano fornecido.
 *
 * @param {string} grupoId   - ID do grupo familiar
 * @param {string} cartaoId  - contaId do cartão filtrado
 * @param {number} mes       - mês de referência (1-12)
 * @param {number} ano       - ano de referência (ex: 2026)
 * @param {function} onUpdate - callback chamado com dadosPorMes quando dados mudam
 * @returns {Function[]} array de unsubscribes — caller gerencia cleanup
 *
 * dadosPorMes format: { [key: string]: { mes, ano, total, despesas[] } }
 * onde key = "YYYY-M"
 */
export function iniciar(grupoId, cartaoId, mes, ano, onUpdate) {
  const unsubscribes = [];
  const dadosPorMes = {};
  const respondidos = new Set();

  const inicio = new Date(ano, mes - 1, 1);
  inicio.setMonth(inicio.getMonth() + 1);

  for (let i = 0; i < 6; i++) {
    const m = new Date(inicio);
    m.setMonth(m.getMonth() + i);
    const mMes = m.getMonth() + 1;
    const mAno = m.getFullYear();
    const key = `${mAno}-${mMes}`;

    dadosPorMes[key] = { mes: mMes, ano: mAno, total: 0, despesas: [] };

    const unsub = ouvirDespesas(grupoId, mMes, mAno, (desp) => {
      const filtradas = desp.filter(d => d.contaId === cartaoId && d.tipo === 'projecao');
      dadosPorMes[key] = {
        mes: mMes,
        ano: mAno,
        total: filtradas.reduce((s, d) => s + (d.valor ?? 0), 0),
        despesas: filtradas,
      };
      respondidos.add(key);
      if (respondidos.size >= 6) onUpdate({ ...dadosPorMes });
    });
    unsubscribes.push(unsub);
  }

  return unsubscribes;
}

/**
 * Busca pontual (one-shot) de projeções de todos os cartões para os próximos
 * 6 meses. Filtra por mesFatura para precisão de ciclo de faturamento.
 * Usado pela página fluxo-caixa.js para agregação entre cartões.
 *
 * @param {string} grupoId - ID do grupo familiar
 * @param {number} mes     - mês de referência (1-12)
 * @param {number} ano     - ano de referência
 * @returns {Promise<{ [mesFatura: string]: { mes, ano, total, despesas[] } }>}
 */
export async function buscarProjecoesAgregadas(grupoId, mes, ano) {
  const inicio = new Date(ano, mes - 1, 1);
  inicio.setMonth(inicio.getMonth() + 1);
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + 5);

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const todasProjecoes = await buscarProjecoesRange(grupoId, fmt(inicio), fmt(fim));

  const resultado = {};
  for (let i = 0; i < 6; i++) {
    const m = new Date(inicio);
    m.setMonth(m.getMonth() + i);
    const key = fmt(m);
    resultado[key] = { mes: m.getMonth() + 1, ano: m.getFullYear(), total: 0, despesas: [] };
  }

  todasProjecoes.forEach(d => {
    const key = d.mesFatura;
    if (resultado[key]) {
      resultado[key].despesas.push(d);
      resultado[key].total += d.valor ?? 0;
    }
  });

  return resultado;
}
