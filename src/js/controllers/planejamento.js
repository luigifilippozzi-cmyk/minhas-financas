// ============================================================
// CONTROLLER: planejamento.js — RF-060
// Lógica de negócio para o Planejamento Mensal:
// geração do plano, auto-matching, CRUD de itens.
// ============================================================

import {
  buscarDespesasMes,
  buscarOrcamentos,
  salvarItemPlanejamento,
  salvarItensPlanejamentoBatch,
  excluirItemPlanejamento,
  existePlanejamento,
  ouvirPlanejamento,
  ouvirDespesas,
  ouvirCategorias,
  ouvirOrcamentos,
} from '../services/database.js';
import { detectarRecorrentes, filtrarAutoInclusao } from '../utils/recurringDetector.js';

// ── Geração do Plano ─────────────────────────────────────────

/**
 * Gera itens de planejamento para um mês, combinando:
 * 1. Despesas recorrentes detectadas (meses N-1 e N-2)
 * 2. Parcelas de cartão (tipo='projecao') do mês
 * 3. Orçamentos por categoria (como itens de referência)
 *
 * @param {string} grupoId
 * @param {number} mes — 1 a 12
 * @param {number} ano
 * @returns {Promise<number>} quantidade de itens gerados
 */
export async function gerarPlanoPara(grupoId, mes, ano) {
  const jaExiste = await existePlanejamento(grupoId, mes, ano);
  if (jaExiste) return 0;

  // Calcular meses anteriores
  let mesN1 = mes - 1, anoN1 = ano;
  if (mesN1 < 1) { mesN1 = 12; anoN1--; }
  let mesN2 = mesN1 - 1, anoN2 = anoN1;
  if (mesN2 < 1) { mesN2 = 12; anoN2--; }

  const [despN1, despN2, despAtual, orcamentos] = await Promise.all([
    buscarDespesasMes(grupoId, anoN1, mesN1),
    buscarDespesasMes(grupoId, anoN2, mesN2),
    buscarDespesasMes(grupoId, ano, mes),
    buscarOrcamentos(grupoId, mes, ano),
  ]);

  const items = [];
  const chavesCriadas = new Set();

  // 1. Despesas recorrentes (confiança alta e média)
  const recorrentes = detectarRecorrentes(despN1, despN2);
  const autoInclusao = filtrarAutoInclusao(recorrentes);

  for (const rec of autoInclusao) {
    const chave = `${rec.descricao.toLowerCase().trim()}||${rec.categoriaId}`;
    if (chavesCriadas.has(chave)) continue;
    chavesCriadas.add(chave);

    items.push({
      grupoId, ano, mes,
      categoriaId: rec.categoriaId,
      descricao: rec.descricao,
      valorPrevisto: Math.round(rec.valorEstimado * 100) / 100,
      origem: 'recorrente',
      status: 'pendente',
      despesaId: null,
      valorRealizado: null,
      parcelamentoId: null,
      criadoEm: new Date(),
    });
  }

  // 2. Parcelas de cartão (tipo='projecao' no mês atual)
  const parcelas = despAtual.filter(d => d.tipo === 'projecao');
  for (const p of parcelas) {
    const chave = `${(p.descricao ?? '').toLowerCase().trim()}||${p.categoriaId ?? ''}`;
    if (chavesCriadas.has(chave)) continue;
    chavesCriadas.add(chave);

    items.push({
      grupoId, ano, mes,
      categoriaId: p.categoriaId ?? '',
      descricao: p.descricao ?? 'Parcela',
      valorPrevisto: p.valor ?? 0,
      origem: 'parcela',
      status: 'pendente',
      despesaId: null,
      valorRealizado: null,
      parcelamentoId: p.parcelamento_id ?? null,
      criadoEm: new Date(),
    });
  }

  // 3. Orçamentos como referência (categorias com limite e sem item)
  for (const orc of orcamentos) {
    if (!orc.valorLimite || orc.valorLimite <= 0) continue;
    const jaTemCategoria = items.some(i => i.categoriaId === orc.categoriaId);
    if (jaTemCategoria) continue;
    const chaveOrc = `__orc__||${orc.categoriaId}`;
    if (chavesCriadas.has(chaveOrc)) continue;
    chavesCriadas.add(chaveOrc);

    items.push({
      grupoId, ano, mes,
      categoriaId: orc.categoriaId,
      descricao: 'Orçamento da categoria',
      valorPrevisto: orc.valorLimite,
      origem: 'orcamento',
      status: 'pendente',
      despesaId: null,
      valorRealizado: null,
      parcelamentoId: null,
      criadoEm: new Date(),
    });
  }

  if (items.length > 0) {
    await salvarItensPlanejamentoBatch(items);
  }

  return items.length;
}

// ── Auto-Matching ────────────────────────────────────────────

/**
 * Compara despesas realizadas com itens do plano e retorna matches.
 */
export function autoMatch(planejamentoItems, despesasRealizadas) {
  const matches = [];
  const despUsadas = new Set();

  for (const item of planejamentoItems) {
    if (item.status === 'realizado') continue;

    // Match por parcelamentoId
    if (item.parcelamentoId) {
      const match = despesasRealizadas.find(d =>
        !despUsadas.has(d.id) &&
        d.parcelamento_id === item.parcelamentoId &&
        (d.tipo === 'projecao_paga' || !d.tipo)
      );
      if (match) {
        despUsadas.add(match.id);
        matches.push({ itemId: item.id, despesaId: match.id, valorRealizado: match.valor ?? 0 });
        continue;
      }
    }

    // Match por categoriaId + descrição
    const descNorm = (item.descricao ?? '').toLowerCase().trim();
    if (!descNorm || item.origem === 'orcamento') continue;

    const match = despesasRealizadas.find(d => {
      if (despUsadas.has(d.id)) return false;
      if (d.tipo === 'projecao') return false;
      if (d.categoriaId !== item.categoriaId) return false;
      const dNorm = (d.descricao ?? '').toLowerCase().trim();
      return dNorm === descNorm || dNorm.includes(descNorm) || descNorm.includes(dNorm);
    });

    if (match) {
      despUsadas.add(match.id);
      matches.push({ itemId: item.id, despesaId: match.id, valorRealizado: match.valor ?? 0 });
    }
  }

  return matches;
}

/**
 * Aplica matches no Firestore.
 */
export async function aplicarMatches(matches) {
  for (const m of matches) {
    await salvarItemPlanejamento({
      id: m.itemId,
      status: 'realizado',
      despesaId: m.despesaId,
      valorRealizado: m.valorRealizado,
    });
  }
}

// ── Análise de Gaps ──────────────────────────────────────────

export function analisarGaps(orcamentos, planejamentoItems, categorias) {
  const catMap = new Map(categorias.map(c => [c.id, c]));

  const planejadoPorCat = {};
  planejamentoItems.forEach(item => {
    if (item.status === 'cancelado') return;
    planejadoPorCat[item.categoriaId] = (planejadoPorCat[item.categoriaId] ?? 0) + (item.valorPrevisto ?? 0);
  });

  const semPlano = [];
  const excedidos = [];

  for (const orc of orcamentos) {
    if (!orc.valorLimite || orc.valorLimite <= 0) continue;
    const cat = catMap.get(orc.categoriaId);
    const planejado = planejadoPorCat[orc.categoriaId] ?? 0;

    if (planejado === 0) {
      semPlano.push({ categoriaId: orc.categoriaId, nome: cat?.nome ?? 'Sem nome', emoji: cat?.emoji ?? '', valorOrcado: orc.valorLimite });
    } else if (planejado > orc.valorLimite) {
      excedidos.push({ categoriaId: orc.categoriaId, nome: cat?.nome ?? 'Sem nome', emoji: cat?.emoji ?? '', valorOrcado: orc.valorLimite, valorPlanejado: planejado, excesso: planejado - orc.valorLimite });
    }
  }

  return { semPlano, excedidos };
}

export function despesasNaoPlanejadas(despesasRealizadas, planejamentoItems) {
  const idsMatch = new Set(planejamentoItems.filter(i => i.despesaId).map(i => i.despesaId));
  return despesasRealizadas.filter(d =>
    d.tipo !== 'projecao' && d.tipo !== 'projecao_paga'
    && d.tipo !== 'transferencia_interna' // RF-063
    && !idsMatch.has(d.id)
  );
}

// ── Re-exports ───────────────────────────────────────────────

export { ouvirPlanejamento, ouvirDespesas, ouvirCategorias, ouvirOrcamentos };
export { salvarItemPlanejamento, excluirItemPlanejamento };
