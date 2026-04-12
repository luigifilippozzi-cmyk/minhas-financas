// ============================================================
// RF-063: Detector de Transferências Internas (PIX/TED)
// Identifica movimentações entre membros do mesmo grupo familiar.
// ============================================================

import { normalizarStr } from './helpers.js';

/**
 * Regex para detectar descritivos de transferência PIX/TED.
 * Cobre variantes comuns de bancos brasileiros.
 */
const REGEX_TRANSFERENCIA = /pix\s*(enviad|recebid|transfer|trans)|ted\s*(enviad|recebid)|transf\s*(para|de|enviad|recebid)|transferencia\s*(enviad|recebid|pix)|pagamento\s*pix|pix\s*-\s*(enviad|recebid)/i;

/**
 * Regex para detectar recebimentos (lado receita da transferência).
 */
const REGEX_RECEBIMENTO = /pix\s*recebid|ted\s*recebid|transf\s*(recebid|de)|transferencia\s*recebid/i;

/**
 * Valor mínimo para considerar como transferência interna (evita falsos positivos).
 */
const VALOR_MINIMO = 100;

/**
 * Janela temporal (em dias) para busca de contraparte.
 */
export const JANELA_DIAS = 2;

/**
 * Verifica se uma descrição contém o nome de um membro do grupo.
 * @param {string} descricao - descritivo da transação (já normalizado)
 * @param {Object<string, string>} nomesMembros - { uid: nomeCompleto }
 * @param {string} [uidExcluir] - uid do usuário que fez o upload (excluir da busca)
 * @returns {{ uid: string, nome: string } | null}
 */
export function detectarMembroNaDescricao(descricao, nomesMembros, uidExcluir = '') {
  if (!descricao || !nomesMembros) return null;
  const descNorm = normalizarStr(descricao);

  for (const [uid, nomeCompleto] of Object.entries(nomesMembros)) {
    if (uid === uidExcluir) continue;
    const partes = nomeCompleto.trim().split(/\s+/);
    // Tenta match com nome completo primeiro, depois primeiro nome (mín 3 chars)
    const nomeCompletoNorm = normalizarStr(nomeCompleto);
    if (nomeCompletoNorm && descNorm.includes(nomeCompletoNorm)) {
      return { uid, nome: nomeCompleto };
    }
    const primeiroNome = normalizarStr(partes[0]);
    if (primeiroNome && primeiroNome.length >= 3 && descNorm.includes(primeiroNome)) {
      return { uid, nome: nomeCompleto };
    }
  }
  return null;
}

/**
 * Analisa linhas de extrato bancário e marca candidatas a transferência interna.
 * Muta as linhas in-place adicionando:
 *   - tipoLinha: 'transferencia_interna' (se detectado)
 *   - _transferenciaInterna: { membroUid, membroNome, direcao: 'enviada'|'recebida' }
 *
 * @param {Array} linhas - linhas do extrato (já classificadas por classificarBanco)
 * @param {Object<string, string>} nomesMembros - { uid: nomeCompleto } do grupo
 * @param {string} [uidUploader] - uid de quem está importando
 * @returns {number} quantidade de transferências detectadas
 */
export function detectarTransferenciasInternas(linhas, nomesMembros, uidUploader = '') {
  if (!linhas?.length || !nomesMembros || Object.keys(nomesMembros).length < 2) return 0;

  let count = 0;
  for (const l of linhas) {
    if (l.erro) continue;
    if (l.valor < VALOR_MINIMO) continue;

    const descNorm = normalizarStr(l.descricao);
    if (!REGEX_TRANSFERENCIA.test(descNorm)) continue;

    const membro = detectarMembroNaDescricao(l.descricao, nomesMembros, uidUploader);
    if (!membro) continue;

    const isRecebimento = REGEX_RECEBIMENTO.test(descNorm);
    l._transferenciaInterna = {
      membroUid: membro.uid,
      membroNome: membro.nome,
      direcao: isRecebimento ? 'recebida' : 'enviada',
    };
    // Mantém tipoLinha original (despesa/receita) — a flag _transferenciaInterna
    // será usada no momento do save para definir tipo: 'transferencia_interna'
    count++;
  }
  return count;
}

/**
 * Verifica se duas transações formam um par de transferência interna.
 * Critérios: valor igual, janela temporal ±JANELA_DIAS, grupoId igual.
 * @param {object} a - despesa/receita existente no Firestore
 * @param {object} b - nova transação sendo importada
 * @returns {boolean}
 */
export function isParTransferencia(a, b) {
  if (!a || !b) return false;
  // Valores devem ser iguais (com tolerância de 1 centavo para arredondamento)
  if (Math.abs((a.valor ?? 0) - (b.valor ?? 0)) > 0.01) return false;

  // Janela temporal
  const dataA = a.data?.toDate?.() ?? (a.data instanceof Date ? a.data : new Date(a.data));
  const dataB = b.data instanceof Date ? b.data : new Date(b.data);
  if (isNaN(dataA?.getTime()) || isNaN(dataB?.getTime())) return false;
  const diffDias = Math.abs(dataA - dataB) / (1000 * 60 * 60 * 24);
  return diffDias <= JANELA_DIAS;
}
