// ============================================================
// UTILITÁRIO: Forecast de Caixa Prospectivo — RF-067
// Módulo STATELESS e PURO: recebe arrays, retorna projeção por mês.
// Sem queries diretas ao Firestore.
// ============================================================

import { detectarRecorrentes, filtrarAutoInclusao } from './recurringDetector.js';

const MESES_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/**
 * Formata ano + mês (0-based) como 'YYYY-MM'.
 * @param {number} ano
 * @param {number} mes0 — mês 0-based (0=Jan … 11=Dez)
 * @returns {string}
 */
function toMesStr(ano, mes0) {
  return `${ano}-${String(mes0 + 1).padStart(2, '0')}`;
}

/**
 * Gera forecast de caixa para os próximos mesesFuturos meses.
 *
 * Componentes por mês futuro:
 *   - receitasEsperadas  → receitas recorrentes (alta+media) via recurringDetector
 *   - recorrentes        → despesas recorrentes (alta+media) via recurringDetector
 *   - parcelas           → tipo:'projecao' do Firestore (parcelas comprometidas, certo)
 *   - variaveis          → total dos orçamentos do mês (gastos variáveis, teto)
 *
 * Limiar recurringDetector: item deve aparecer em N-1 E N-2 com confiança alta ou média.
 *
 * @param {object} params
 * @param {Array}  params.despesasMesN1   — despesas realizadas do mês N-1
 * @param {Array}  params.despesasMesN2   — despesas realizadas do mês N-2
 * @param {Array}  params.receitasMesN1   — receitas do mês N-1
 * @param {Array}  params.receitasMesN2   — receitas do mês N-2
 * @param {Array}  params.projecoes       — tipo:'projecao' (parcelas comprometidas futuras)
 * @param {Array}  params.orcamentos      — orçamentos { ano, mes(1-based), valor }
 * @param {number} params.mesesFuturos    — quantos meses calcular (default 6)
 * @param {Date}   params.hoje            — data de referência (default new Date())
 *
 * @returns {Array<{
 *   mesStr: string,              // 'YYYY-MM'
 *   mesLabel: string,            // 'Jan'|'Fev'|...
 *   ano: number,
 *   receitasEsperadas: number,   // receitas recorrentes estimadas
 *   recorrentes: number,         // despesas recorrentes estimadas
 *   parcelas: number,            // parcelas comprometidas (certo)
 *   variaveis: number,           // teto de gastos variáveis (orçamentos)
 *   saldoProjetado: number,      // receitasEsperadas − recorrentes − parcelas − variaveis
 *   estimativaLimitada: boolean, // true quando < 3 transações em N-1 ou N-2
 * }>}
 */
export function gerarForecast({
  despesasMesN1 = [],
  despesasMesN2 = [],
  receitasMesN1 = [],
  receitasMesN2 = [],
  projecoes = [],
  orcamentos = [],
  mesesFuturos = 6,
  hoje = new Date(),
} = {}) {
  // Recorrentes filtrados (confiança alta + média)
  const despRecorrentes = filtrarAutoInclusao(
    detectarRecorrentes(despesasMesN1, despesasMesN2),
  );
  const recRecorrentes = filtrarAutoInclusao(
    detectarRecorrentes(receitasMesN1, receitasMesN2),
  );

  const totalDespRecorrentes = despRecorrentes.reduce(
    (s, r) => s + r.valorEstimado, 0,
  );
  const totalReceitasEsperadas = recRecorrentes.reduce(
    (s, r) => s + r.valorEstimado, 0,
  );

  // Estimativa limitada: menos de 3 transações reais em algum dos meses de referência
  const estimativaLimitada =
    despesasMesN1.length < 3 || despesasMesN2.length < 3;

  const resultado = [];

  for (let i = 1; i <= mesesFuturos; i++) {
    const dt   = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const ano  = dt.getFullYear();
    const mes0 = dt.getMonth(); // 0-based
    const ms   = toMesStr(ano, mes0);

    // Parcelas comprometidas (tipo:'projecao') para este mesFatura
    const parcelas = projecoes
      .filter((p) => p.mesFatura === ms)
      .reduce((s, p) => s + (p.valor ?? 0), 0);

    // Gastos variáveis: total dos orçamentos deste mês (mes é 1-based nos orcamentos)
    const variaveis = orcamentos
      .filter((o) => o.ano === ano && o.mes === mes0 + 1)
      .reduce((s, o) => s + (o.valor ?? 0), 0);

    const saldoProjetado =
      totalReceitasEsperadas - totalDespRecorrentes - parcelas - variaveis;

    resultado.push({
      mesStr: ms,
      mesLabel: MESES_LABELS[mes0],
      ano,
      receitasEsperadas: totalReceitasEsperadas,
      recorrentes: totalDespRecorrentes,
      parcelas,
      variaveis,
      saldoProjetado,
      estimativaLimitada,
    });
  }

  return resultado;
}
