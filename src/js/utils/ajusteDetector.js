// ============================================================
// UTIL: Detector de Ajustes Parciais — NRF-002.2
// Identifica pares (despesa + crédito de ajuste) em extratos bancários
// para marketplaces e supermercados (iFood, MAMBO, etc.).
// Puro — sem estado global, sem Firestore.
// ============================================================
import { normalizarStr, similaridade } from './helpers.js';

// ── Mapa de padrões por tipo de estabelecimento ─────────────────
// Strings em UPPERCASE sem acento — comparadas após normalização
export const PADROES_ESTABELECIMENTO = {
  marketplace: [
    'IFOOD', 'MERCADO LIVRE', 'MERCADOLIVRE', 'AMAZON',
    'SHOPEE', 'AMERICANAS', 'MAGALU', 'MAGAZINE LUIZA',
    'ALIEXPRESS', 'SHEIN',
  ],
  supermercado: [
    'MAMBO', 'PAO DE ACUCAR', 'CARREFOUR', 'EXTRA',
    'ATACADAO', 'ASSAI', 'BIG', 'WALMART', 'PREZUNIC',
    'HORTIFRUTI', 'COOP', 'SONDA', 'ZONA SUL', 'SUPERNOSSO',
    'SUPERMERCADO', 'MERCADO',
  ],
  delivery: [
    'RAPPI', 'UBER EATS', 'UBEREATS', 'JAMES DELIVERY',
  ],
};

/**
 * Retorna o tipo do estabelecimento ('marketplace'|'supermercado'|'delivery')
 * ou null se a descrição não bater em nenhum padrão.
 * @param {string} descricao
 * @returns {string|null}
 */
export function classificarEstabelecimento(descricao) {
  if (!descricao) return null;
  const norm = descricao
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (const [tipo, padroes] of Object.entries(PADROES_ESTABELECIMENTO)) {
    if (padroes.some(p => norm.includes(p))) return tipo;
  }
  return null;
}

/**
 * Detecta pares (despesa + crédito de ajuste parcial) num lote de linhas
 * de extrato bancário. Muta as linhas in-place.
 *
 * Condições para considerar como ajuste parcial:
 *   1. Crédito pertence a estabelecimento elegível (marketplace/supermercado/delivery)
 *   2. Despesa contém a MESMA keyword identificadora do crédito (ex: 'IFOOD')  ← BUG-014 fix
 *   3. Valor do crédito < valor da despesa (parcial, não estorno total)
 *   4. Diferença de data ≤ janelaDias
 *   Levenshtein é usado somente como critério de desempate quando há múltiplas
 *   despesas candidatas — NÃO como gate de inclusão (threshold removido).
 *
 * Rationale BUG-014: em extratos bancários reais, o crédito/cashback raramente
 *   tem a mesma descrição da despesa original. Ex:
 *     despesa  → "IFOOD *RESTAURANTE ABC 01/11"
 *     crédito  → "IFOOD CREDITO" ou "PIX RECEBIDO IFOOD"
 *   Levenshtein full-string daria ~0.30, abaixo de qualquer threshold razoável.
 *   A keyword compartilhada é critério muito mais robusto para esses casos.
 *
 * Campos adicionados ao crédito (linha de ajuste):
 *   { ajuste_parcial: true, ajuste_para_idx, ajuste_sim }
 *
 * Campos adicionados à despesa vinculada:
 *   { valorAjustado, valorLiquido, ajuste_parcial_idx }
 *
 * @param {Array}  linhas
 * @param {Object} opts
 * @param {number} opts.janelaDias — janela máxima entre despesa e crédito (padrão 7)
 */
export function detectarAjustesParciais(linhas, {
  janelaDias = 7,
} = {}) {
  // Candidatos: despesas não-marcadas (sem erro, sem duplicata, sem ajuste já vinculado)
  const despesas = linhas.filter(l =>
    l.tipoLinha === 'despesa' && !l.erro && !l.duplicado && l.ajuste_parcial_idx == null,
  );
  // Candidatos: créditos não-marcados (tipoLinha='receita' no contexto bancário)
  const creditos = linhas.filter(l =>
    l.tipoLinha === 'receita' && !l.erro && !l.duplicado && !l.ajuste_parcial,
  );

  for (const cred of creditos) {
    // Só trata créditos de estabelecimentos elegíveis
    const tipoEst = classificarEstabelecimento(cred.descricao);
    if (!tipoEst) continue;

    // BUG-014: extrai a keyword que identificou o estabelecimento no crédito
    const normCredUpper = cred.descricao.toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const keyword = PADROES_ESTABELECIMENTO[tipoEst].find(p => normCredUpper.includes(p));
    if (!keyword) continue;

    const normCred = normalizarStr(cred.descricao);
    let melhorDesp = null;
    let melhorSim  = -1;

    for (const desp of despesas) {
      // Crédito deve ser menor que a despesa (ajuste parcial, não estorno total)
      if (cred.valor >= desp.valor) continue;

      // Janela temporal (aceita quando uma das datas está ausente)
      if (desp.data && cred.data) {
        const diffDias =
          Math.abs(new Date(cred.data) - new Date(desp.data)) /
          (1000 * 60 * 60 * 24);
        if (diffDias > janelaDias) continue;
      }

      // BUG-014: critério principal — despesa deve conter a MESMA keyword do crédito
      const normDespUpper = desp.descricao.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!normDespUpper.includes(keyword)) continue;

      // Levenshtein apenas como desempate entre múltiplas despesas candidatas
      const sim = similaridade(normCred, normalizarStr(desp.descricao));
      if (sim > melhorSim) { melhorSim = sim; melhorDesp = desp; }
    }

    if (melhorDesp) {
      // Marcar crédito como ajuste parcial (ficará desmarcado no preview)
      cred.ajuste_parcial  = true;
      cred.ajuste_para_idx = melhorDesp._idx;
      cred.ajuste_sim      = Math.round(Math.max(melhorSim, 0) * 100);

      // Atualizar despesa com valor líquido pós-ajuste
      melhorDesp.valorAjustado      = cred.valor;
      melhorDesp.valorLiquido       = Math.round((melhorDesp.valor - cred.valor) * 100) / 100;
      melhorDesp.ajuste_parcial_idx = cred._idx;
    }
  }
}
