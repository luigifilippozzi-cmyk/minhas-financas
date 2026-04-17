// ============================================================
// UTILITÁRIO: Burn Rate por Categoria — RF-069
// Módulo STATELESS e PURO: recebe arrays, retorna projeção por categoria.
// Sem queries diretas ao Firestore.
// ============================================================

import { isMovimentacaoReal } from './helpers.js';

/**
 * Calcula burn rate (velocidade de consumo) por categoria com orçamento ativo.
 *
 * RN1: Burn rate diário = SUM(despesas reais da categoria nos últimos 7 dias) / 7.
 * RN2: Projeção mensal = gasto realizado no mês até hoje + (burn rate diário * dias restantes).
 * RN3: Verde ≤90% | Amarelo 90–100% | Vermelho >100% do orçamento.
 * RN4: Apenas categorias com orçamento ativo (valorLimite > 0).
 * RN5: Filtrar via isMovimentacaoReal (exclui projeções e transferências internas).
 * RN7: < 3 dias com dados no período de 7 dias → "amostra insuficiente", sem projeção.
 *
 * @param {object} params
 * @param {Array}  params.despesasMes — despesas do mês atual (de onSnapshot)
 * @param {Array}  params.orcamentos  — orçamentos [{ categoriaId, valorLimite }]
 * @param {Array}  params.categorias  — categorias [{ id, nome, emoji }]
 * @param {Date}   params.hoje        — data de referência (default: new Date())
 *
 * @returns {Array<{
 *   categoriaId: string,
 *   categoriaNome: string,
 *   categoriaEmoji: string,
 *   gastoMes: number,
 *   orcamento: number,
 *   burnRateDiario: number,
 *   projecaoMensal: number,
 *   percentualProjetado: number,
 *   classificacao: 'verde'|'amarelo'|'vermelho',
 *   amostrasInsuficientes: boolean,
 * }>}
 */
export function calcularBurnRate({
  despesasMes = [],
  orcamentos = [],
  categorias = [],
  hoje = new Date(),
} = {}) {
  const orcMap = Object.fromEntries(
    orcamentos
      .filter((o) => (o.valorLimite ?? 0) > 0)
      .map((o) => [o.categoriaId, o.valorLimite]),
  );

  if (!Object.keys(orcMap).length) return [];

  const catMap = Object.fromEntries(categorias.map((c) => [c.id, c]));

  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = diasNoMes - hoje.getDate();

  // Início dos últimos 7 dias (incluindo hoje): hoje - 6 dias às 00:00
  const inicioUlt7 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6);

  const despesasReais = despesasMes.filter(isMovimentacaoReal);

  const ORDEM_CLASS = { vermelho: 0, amarelo: 1, verde: 2 };
  const resultado = [];

  for (const [catId, orcamento] of Object.entries(orcMap)) {
    const cat = catMap[catId];
    if (!cat || cat.tipo === 'receita') continue;

    const despCat = despesasReais.filter((d) => d.categoriaId === catId);
    const gastoMes = despCat.reduce((s, d) => s + (d.valor ?? 0), 0);

    const ult7 = despCat.filter((d) => {
      const dt = d.data?.toDate?.() ?? new Date(d.data);
      return dt >= inicioUlt7;
    });

    // Dias distintos com pelo menos uma transação nos últimos 7 dias — RN7
    const diasComDados = new Set(
      ult7.map((d) => {
        const dt = d.data?.toDate?.() ?? new Date(d.data);
        return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      }),
    ).size;

    const amostrasInsuficientes = diasComDados < 3;

    const totalUlt7 = ult7.reduce((s, d) => s + (d.valor ?? 0), 0);
    const burnRateDiario = totalUlt7 / 7; // RN1

    // RN2: sem projeção adicional quando amostra insuficiente
    const projecaoMensal = amostrasInsuficientes
      ? gastoMes
      : gastoMes + burnRateDiario * diasRestantes;

    const percentualProjetado = orcamento > 0 ? (projecaoMensal / orcamento) * 100 : 0;

    let classificacao;
    if (amostrasInsuficientes || percentualProjetado <= 90) {
      classificacao = 'verde';
    } else if (percentualProjetado <= 100) {
      classificacao = 'amarelo';
    } else {
      classificacao = 'vermelho';
    }

    resultado.push({
      categoriaId: catId,
      categoriaNome: cat.nome,
      categoriaEmoji: cat.emoji,
      gastoMes,
      orcamento,
      burnRateDiario,
      projecaoMensal,
      percentualProjetado,
      classificacao,
      amostrasInsuficientes,
    });
  }

  resultado.sort(
    (a, b) =>
      ORDEM_CLASS[a.classificacao] - ORDEM_CLASS[b.classificacao] ||
      b.percentualProjetado - a.percentualProjetado,
  );

  return resultado;
}
