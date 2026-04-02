// ============================================================
// RF-021: Motor de Detecção, Roteamento e Identificação de Origem
//
// Responsável por:
//   1. Identificar tipo do arquivo (banco/cartão/receita/despesa)
//   2. Identificar banco/emissor (Itaú, Nubank, Bradesco, ...)
//   3. Definir pipeline a utilizar
//
// Saída:
//   {
//     tipo:           'banco'|'cartao'|'receita'|'despesa'
//     confiancaTipo:  0-100 (número)
//     confianca:      'alta'|'baixa'  (compatibilidade com modal existente)
//     colunas:        string[]         (colunas detectadas — para o modal)
//     origem:         'itau'|'nubank'|...|'desconhecido'
//     origemLabel:    string           (ex: 'Itaú')
//     origemEmoji:    string           (ex: '🏦')
//     confiancaOrigem: 0-100
//     pipeline:       'PIPELINE_BANCARIO' | 'PIPELINE_CARTAO'
//   }
// ============================================================
import { BANK_FINGERPRINTS } from './bankFingerprintMap.js';

/**
 * Detecta tipo e origem de um arquivo de transações.
 *
 * @param {Object}   opts
 * @param {string}   opts.fileName    - Nome do arquivo
 * @param {string[][]} [opts.rows]    - Linhas do arquivo (CSV/XLSX)
 * @param {string[]}   [opts.textLines] - Linhas de texto extraídas (PDF)
 */
export function detectarOrigemArquivo({ fileName = '', rows = [], textLines = [] }) {
  const tipoResult  = _detectarTipo(rows, textLines);
  const bancoResult = _detectarBanco(fileName, rows, textLines);

  return {
    tipo:            tipoResult.tipo,
    confiancaTipo:   tipoResult.confiancaNum,
    confianca:       tipoResult.confianca,   // 'alta'|'baixa' — backward compat
    colunas:         tipoResult.colunas,
    origem:          bancoResult.id,
    origemLabel:     bancoResult.label,
    origemEmoji:     bancoResult.emoji,
    confiancaOrigem: bancoResult.score,
    pipeline:        tipoResult.tipo === 'cartao' ? 'PIPELINE_CARTAO' : 'PIPELINE_BANCARIO',
  };
}

// ── Detecção de tipo ────────────────────────────────────────────────────────

function _detectarTipo(rows, textLines) {
  const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 1. Analisa estrutura das colunas (CSV/XLSX)
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const h     = rows[i].map(norm);
    const hOrig = rows[i].map(c => String(c ?? '').trim()).filter(Boolean);
    const temData      = h.some(c => c === 'data');
    const temValor     = h.some(c => c === 'valor' || c.startsWith('valor'));
    if (!temData || !temValor) continue;
    const temPortador  = h.some(c => c.includes('portador') || c.includes('titular'));
    const temParcela   = h.some(c => c === 'parcela');
    const temCategoria = h.some(c => c.startsWith('categor'));
    if (temPortador && temParcela)                   return { tipo: 'cartao',  confianca: 'alta',  confiancaNum: 90, colunas: hOrig };
    if (temCategoria && !temPortador && !temParcela) return { tipo: 'receita', confianca: 'alta',  confiancaNum: 90, colunas: hOrig };
    // RF-024: template padrão de extrato — exatamente 3 colunas (Data, Descrição, Valor)
    // Sem portador/parcela/categoria → extrato bancário com sinal do valor determinando tipo
    if (!temPortador && !temParcela && !temCategoria && hOrig.length === 3 &&
        temData && h.some(c => c.includes('descri')) && temValor) {
      return { tipo: 'banco', confianca: 'alta', confiancaNum: 90, colunas: hOrig };
    }
    if (!temPortador && !temParcela)                 return { tipo: 'banco',   confianca: 'baixa', confiancaNum: 60, colunas: hOrig };
    return { tipo: 'despesa', confianca: 'baixa', confiancaNum: 50, colunas: hOrig };
  }

  // 2. Analisa conteúdo textual (PDF)
  if (textLines.length > 0) {
    const allText = textLines.join(' ').toLowerCase();
    if (/fatura|cartao|cartão|limite\s+disponível|vencimento\s+da\s+fatura/.test(allText)) {
      return { tipo: 'cartao', confianca: 'alta', confiancaNum: 75, colunas: [] };
    }
    return { tipo: 'banco', confianca: 'alta', confiancaNum: 70, colunas: [] };
  }

  return { tipo: 'despesa', confianca: 'baixa', confiancaNum: 30, colunas: [] };
}

// ── Identificação de banco por scoring ────────────────────────────────────

function _n(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function _detectarBanco(fileName, rows, textLines) {
  const fileNorm = _n(fileName);
  const bodyText = _n(textLines.join(' ') + ' ' + rows.flat().join(' '));

  const scores = {};
  for (const fp of BANK_FINGERPRINTS) {
    let score = 0;

    // Nome do arquivo (+40 se bate)
    for (const pat of fp.filePatterns) {
      if (pat.test(fileNorm)) { score += 40; break; }
    }
    // Keyword de alta confiança (+40 se bate)
    for (const kw of fp.keywords.high) {
      if (bodyText.includes(_n(kw))) { score += 40; break; }
    }
    // Keyword de média confiança (+20 se bate)
    for (const kw of fp.keywords.medium) {
      if (bodyText.includes(_n(kw))) { score += 20; break; }
    }

    if (score > 0) scores[fp.id] = Math.min(score, 100);
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] < 20) {
    return { id: 'desconhecido', label: '', emoji: '🏦', score: 0 };
  }
  const fp = BANK_FINGERPRINTS.find(f => f.id === best[0]);
  return { id: fp.id, label: fp.label, emoji: fp.emoji, score: best[1] };
}
