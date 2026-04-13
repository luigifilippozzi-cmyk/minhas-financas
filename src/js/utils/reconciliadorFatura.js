// ============================================================
// RF-064: Reconciliador de Pagamento de Fatura
// Detecta linhas de extrato bancário que representam pagamento
// de fatura de cartão de crédito e as marca para exclusão dos
// agregados de gastos (elimina double-count).
// ============================================================

import { normalizarStr } from './helpers.js';

/**
 * Regex para detectar descritivos de pagamento de fatura no extrato bancário.
 * Cobre variações comuns de bancos brasileiros.
 */
export const REGEX_PAG_FATURA = /pag(?:amento)?\s*(?:de\s*)?(?:fat(?:ura)?|cartao|cart[aã]o)|fat(?:ura)?\s*(?:cart[aã]o|cred(?:ito)?)|pgt\s*fat|pgto\s*fat|pgmto\s*fat|liq(?:uid)?\s*fat|debit(?:o)?\s*(?:fat|cart)/i;

/**
 * Regex adicional para bancos que usam "CARTÃO" sem "FATURA".
 * Exige que a descrição seja claramente de débito automático ou pagamento.
 */
const REGEX_PAG_CARTAO_DEBITO = /d[eé]b(?:ito)?\s*(?:auto(?:m[aá]tico)?\s*)?cart[aã]o|pagto\s*cart[aã]o|pag\s*cart[aã]o\b/i;

/**
 * Valor mínimo para considerar como pagamento de fatura (filtra microtransações).
 */
export const VALOR_MINIMO_FATURA = 10;

/**
 * Janela temporal em dias em relação ao vencimento da fatura para considerar
 * um pagamento como match. Default ±7 dias (mais generoso que RF-063).
 */
export const JANELA_VENCIMENTO_DIAS = 7;

/**
 * Tolerância de valor para considerar pagamento parcial vs total.
 * ≤5% de diferença = match de valor (pode ser arredondamento ou ajuste).
 */
export const TOLERANCIA_VALOR_PERCENT = 0.05;

/**
 * Verifica se uma descrição de transação corresponde a um pagamento de fatura.
 * @param {string} descricao
 * @returns {boolean}
 */
export function isPagamentoFatura(descricao) {
  if (!descricao) return false;
  const desc = normalizarStr(descricao);
  return REGEX_PAG_FATURA.test(desc) || REGEX_PAG_CARTAO_DEBITO.test(desc);
}

/**
 * Calcula um score de confiança (0–100) para o match entre uma linha de
 * pagamento bancário e um ciclo de fatura de cartão.
 *
 * Componentes:
 *  - Regex match: +40 pts (base — descritivo claramente indica PAG FATURA)
 *  - Valor match: +40 pts (valor == total do ciclo, com tolerância de 5%)
 *  - Janela temporal: +20 pts (dentro de ±7 dias do vencimento do ciclo)
 *
 * @param {object} params
 * @param {boolean} params.regexMatch         — true se descritivo bateu
 * @param {number}  params.valorLinha         — valor da linha de extrato
 * @param {number}  [params.totalFatura]      — total calculado da fatura (0 = desconhecido)
 * @param {number}  [params.diffDiasVencimento] — diferença em dias do vencimento (abs)
 * @returns {{ score: number, status: 'auto'|'pendente'|'ignorado', isParcial: boolean }}
 */
export function calcularScoreFatura({ regexMatch, valorLinha, totalFatura = 0, diffDiasVencimento = null }) {
  let score = 0;

  // Componente 1: Regex
  if (regexMatch) score += 40;

  // Componente 2: Valor
  let isParcial = false;
  if (totalFatura > 0 && valorLinha > 0) {
    const diff = Math.abs(valorLinha - totalFatura) / totalFatura;
    if (diff <= TOLERANCIA_VALOR_PERCENT) {
      score += 40;
    } else if (diff <= 0.20) {
      // Pagamento parcial detectado — pontua parcialmente
      score += 15;
      isParcial = true;
    }
    // diff > 20%: 0 pts (provavelmente não é pagamento desta fatura)
  }
  // Valor desconhecido: não penaliza (aguarda reconciliação posterior)

  // Componente 3: Janela temporal
  if (diffDiasVencimento !== null && diffDiasVencimento <= JANELA_VENCIMENTO_DIAS) {
    score += 20;
  } else if (diffDiasVencimento !== null) {
    // Fora da janela mas ainda pode ser pagamento tardio/adiantado
    if (diffDiasVencimento <= 15) score += 10;
  }
  // Janela desconhecida: não penaliza

  // Classificar status
  let status;
  if (score >= 80) {
    status = 'auto';
  } else if (score >= 40) {
    status = 'pendente';
  } else {
    status = 'ignorado';
  }

  return { score, status, isParcial };
}

/**
 * Analisa linhas de extrato bancário e marca candidatas a pagamento de fatura.
 * Muta as linhas in-place adicionando `_pagamentoFatura` nas detectadas.
 *
 * O campo `_pagamentoFatura` contém:
 *  - contaCartaoId: string|null — conta cartão identificada pela conta pagadora (se disponível)
 *  - statusReconciliacaoFatura: 'auto' | 'pendente' | 'ignorado'
 *  - scoreFatura: number (0–100)
 *  - isParcial: boolean
 *
 * @param {Array}  linhas  — linhas do extrato (já classificadas por classificarBanco)
 * @param {Array}  contas  — contas do grupo (para tentar inferir cartão de destino)
 * @returns {number} quantidade de pagamentos detectados
 */
export function detectarPagamentoFatura(linhas, contas = []) {
  if (!linhas?.length) return 0;

  // Cartões cadastrados (para inferir destino)
  const cartoes = contas.filter(c => c.tipo === 'cartao' && !c._legado);

  let count = 0;
  for (const l of linhas) {
    if (l.erro) continue;
    // Só débitos bancários podem ser pagamento de fatura
    if (l.tipoLinha !== 'despesa') continue;
    if (l.valor < VALOR_MINIMO_FATURA) continue;
    // Já marcado como transferência interna → não reclassificar
    if (l._transferenciaInterna) continue;

    const regexMatch = isPagamentoFatura(l.descricao);
    if (!regexMatch) continue;

    // Tenta inferir cartão de destino pela descrição (ex: "PAG FATURA ITAU")
    const contaCartaoId = _inferirCartaoNaDescricao(l.descricao, cartoes);

    const { score, status, isParcial } = calcularScoreFatura({
      regexMatch,
      valorLinha: l.valor,
      // totalFatura não disponível nesta fase (sem query Firestore no preview)
      // Será atualizado na fase de reconciliação posterior (fatura.js)
    });

    if (status === 'ignorado') continue;

    l._pagamentoFatura = {
      contaCartaoId,
      statusReconciliacaoFatura: status,
      scoreFatura: score,
      isParcial,
    };
    count++;
  }
  return count;
}

/**
 * Tenta inferir a conta cartão a partir da descrição do pagamento.
 * Ex: "PAG FATURA NUBANK" → conta cartão Nubank.
 * @param {string} descricao
 * @param {Array}  cartoes — lista de contas do tipo cartão
 * @returns {string|null} contaId ou null
 */
function _inferirCartaoNaDescricao(descricao, cartoes) {
  if (!descricao || !cartoes.length) return null;
  const descNorm = normalizarStr(descricao);
  for (const c of cartoes) {
    const nomeNorm = normalizarStr(c.nome);
    const emissorNorm = c.emissor ? normalizarStr(c.emissor) : null;
    if (nomeNorm && descNorm.includes(nomeNorm)) return c.id;
    if (emissorNorm && descNorm.includes(emissorNorm)) return c.id;
  }
  return null;
}

/**
 * Recalcula o score de match de um pagamento de fatura contra o total real
 * do ciclo de fatura (chamado da página de fatura após carregar as despesas).
 *
 * @param {object} pagamento       — despesa do tipo 'pagamento_fatura' do Firestore
 * @param {number} totalFatura     — soma real das despesas do ciclo mesFaturaQuitado
 * @param {Date}   [dataVencimento] — data de vencimento do ciclo (opcional)
 * @returns {{ score: number, status: string, isParcial: boolean }}
 */
export function recalcularScoreFatura(pagamento, totalFatura, dataVencimento = null) {
  const dataPag = pagamento.data?.toDate?.()
    ?? (pagamento.data instanceof Date ? pagamento.data : new Date(pagamento.data));

  let diffDiasVencimento = null;
  if (dataVencimento && !isNaN(dataPag?.getTime())) {
    diffDiasVencimento = Math.abs(dataPag - dataVencimento) / (1000 * 60 * 60 * 24);
  }

  return calcularScoreFatura({
    regexMatch: true, // já foi detectado pelo regex na importação
    valorLinha: pagamento.valor ?? 0,
    totalFatura,
    diffDiasVencimento,
  });
}
