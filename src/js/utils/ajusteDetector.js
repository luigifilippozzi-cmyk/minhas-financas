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
 *   2. Similaridade Levenshtein entre descrições ≥ simMinima
 *   3. Valor do crédito < valor da despesa (parcial, não estorno total)
 *   4. Diferença de data ≤ janelaDias
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
 * @param {number} opts.simMinima  — similaridade mínima Levenshtein (padrão 0.72)
 */
export function detectarAjustesParciais(linhas, {
  janelaDias = 7,
  simMinima  = 0.72,
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
    if (!classificarEstabelecimento(cred.descricao)) continue;

    const normCred = normalizarStr(cred.descricao);
    let melhorDesp = null;
    let melhorSim  = 0;

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

      // Similaridade de descrição
      const sim = similaridade(normCred, normalizarStr(desp.descricao));
      if (sim < simMinima) continue;
      if (sim > melhorSim) { melhorSim = sim; melhorDesp = desp; }
    }

    if (melhorDesp) {
      // Marcar crédito como ajuste parcial (ficará desmarcado no preview)
      cred.ajuste_parcial  = true;
      cred.ajuste_para_idx = melhorDesp._idx;
      cred.ajuste_sim      = Math.round(melhorSim * 100);

      // Atualizar despesa com valor líquido pós-ajuste
      melhorDesp.valorAjustado    = cred.valor;
      melhorDesp.valorLiquido     = Math.round((melhorDesp.valor - cred.valor) * 100) / 100;
      melhorDesp.ajuste_parcial_idx = cred._idx;
    }
  }
}
