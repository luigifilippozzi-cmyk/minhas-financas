// ============================================================
// UTIL: Normalizador de Transações — RF-013 Pipeline Unificado
// Funções puras de parsing e normalização, sem estado global.
// ============================================================
import { categorizarTransacao } from './categorizer.js';

// ── Parser CSV com separador ";" ────────────────────────────────
export function parsearCSVTexto(content) {
  const texto = content.replace(/^\uFEFF/, '');
  return texto
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(parseLinhaCSVSemicolon);
}

function parseLinhaCSVSemicolon(linha) {
  const out = [];
  let atual = '';
  let emAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    const prox = linha[i + 1];
    if (ch === '"') {
      // CSV padrão: "" representa aspas literal dentro do campo
      if (emAspas && prox === '"') { atual += '"'; i++; continue; }
      emAspas = !emAspas;
      continue;
    }
    if (ch === ';' && !emAspas) {
      out.push(atual.trim());
      atual = '';
      continue;
    }
    atual += ch;
  }
  out.push(atual.trim());
  return out;
}

// ── Parser de linhas — layout do extrato/fatura (CSV ou XLSX) ──
// Versão parameterizada de parsearLinhasExtrato (sem closures).
// params: { contas, categorias, mapaHist, origemBanco }
export function parsearLinhasCSVXLSX(rows, {
  contas = [], categorias = [], mapaHist = {}, origemBanco = 'desconhecido',
} = {}) {
  if (!rows.length) return [];
  let headerIdx = -1;
  // BUG-028: BTG XLS tem 10 linhas de metadata antes do header → buscar até linha 15
  // BUG-028b: SheetJS retorna arrays sparse (holes são undefined, não null).
  //   Array.from() converte holes em undefined explícito → map/findIndex funcionam corretamente.
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = Array.from(rows[i], c => String(c ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    if (r.some(c => c === 'data' || c === 'data e hora') &&
        r.some(c => c.includes('estabelecimento') || c.includes('descri') || c === 'historico') &&
        r.some(c => c.includes('valor') || c.includes('credito') || c.includes('debito'))) {
      headerIdx = i; break;
    }
  }
  // BUG-012: detecta separador errado (vírgula em vez de ponto-e-vírgula)
  if (headerIdx < 0 && rows.some(r => r.length === 1 && String(r[0] ?? '').includes(','))) {
    throw new Error('Arquivo parece usar vírgula como separador. Exporte o CSV usando ponto-e-vírgula (;).');
  }
  let idxData = 0, idxEstab = 1, idxPortador = 2, idxValor = 3, idxParcela = 4, idxConta = -1;
  let idxCredito = -1, idxDebito = -1;
  if (headerIdx >= 0) {
    // BUG-028b: Array.from() para converter array sparse do SheetJS em dense
    const h = Array.from(rows[headerIdx], c => String(c ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    idxData     = h.findIndex(c => c === 'data' || c === 'data e hora');
    idxEstab    = h.findIndex(c => c.includes('estabelecimento') || c.includes('descri') || c === 'historico');
    idxPortador = h.findIndex(c => c.includes('portador') || c.includes('titular'));
    idxValor    = h.findIndex(c => c.includes('valor') && !c.includes('credito') && !c.includes('debito'));
    idxParcela  = h.findIndex(c => c.includes('parcela'));
    idxConta    = h.findIndex(c => c.includes('conta') || c.includes('banco'));
    idxCredito  = h.findIndex(c => c.includes('credito'));
    idxDebito   = h.findIndex(c => c.includes('debito'));
    if (idxData < 0)     idxData = 0;
    if (idxEstab < 0)    idxEstab = 1;
    if (idxPortador < 0) idxPortador = 2;
    if (idxValor < 0 && idxCredito < 0) idxValor = 3;
  }
  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);
  const resultado = [];
  const _normCell = s => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const row of dataRows) {
    if (!row?.some(c => c)) continue;
    // Para ao encontrar seções de rodapé (ex: Bradesco "Últimos Lançamentos", "Filtro de resultados")
    const c0 = _normCell(row[0]);
    if (/^(filtro\s+de\s+res|os\s+dados\s+acima|ultimos\s+lanc)/.test(c0)) break;
    // Para ao encontrar header repetido (segunda seção do extrato Bradesco)
    if (c0 === 'data' && _normCell(row[1]) === 'historico') break;
    // BUG-028: BTG XLS inclui horário em "Data e hora", e.g. "30/03/2026 18:43" → extrair só a data
    const dataRaw  = String(row[idxData]     ?? '').trim().split(' ')[0];
    const estab    = String(row[idxEstab]    ?? '').trim();
    const portador = String(row[idxPortador] ?? '').trim();
    const valorRaw = String(row[idxValor]    ?? '').trim();
    // NRF-002.1: normaliza "X de Y" → "XX/YY" para compatibilidade com projeções
    const parcela  = idxParcela >= 0 ? normalizarParcela(String(row[idxParcela] ?? '').trim()) : '-';
    // NRF-004: resolve coluna Conta/Banco → contaId
    const contaNome  = idxConta >= 0 ? String(row[idxConta] ?? '').trim() : '';
    const _norm      = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const contaNomeN = _norm(contaNome);
    const contaObj   = contaNome ? contas.find(c => {
      const n = _norm(c.nome);
      return n.includes(contaNomeN) || contaNomeN.includes(n);
    }) : null;
    const contaId = contaObj?.id
      || inferirContaDaDescricao(contaNome, contas)
      || inferirContaDaDescricao(estab, contas);
    if (!dataRaw && !estab && !valorRaw) continue;
    // BUG-028: BTG XLS — "Saldo Diário" são snapshots de saldo, não transações reais
    if (_normCell(estab) === 'saldo diario') continue;
    const estabLow = estab.toLowerCase();
    if (/pagamento de fatura|inclusao de pagamento|inclusão de pagamento|parcela de fatura rotativo/i.test(estabLow)) continue; // BUG-016: removido 'credito de refinanciamento' — é transação legítima
    // Bradesco (e similares): colunas separadas Crédito / Débito
    let valorBruto;
    if (idxCredito >= 0 && idxDebito >= 0) {
      const cred = normalizarValorXP(String(row[idxCredito] ?? '').trim());
      const deb  = normalizarValorXP(String(row[idxDebito]  ?? '').trim());
      const c = isNaN(cred) ? 0 : cred;
      const d = isNaN(deb)  ? 0 : deb;
      valorBruto = c > 0 ? c : -d;  // crédito = positivo, débito = negativo
    } else {
      valorBruto = normalizarValorXP(valorRaw);
    }
    // RF-024: valor zero = saldo/marcador (ex: COD. LANC. 0), descarte silencioso
    if (valorBruto === 0) continue;
    const valor = Math.abs(valorBruto);
    const isNegativo = valorBruto < 0;  // BUG-011: true = valor negativo (crédito/estorno em fatura)
    const dataFmt = normalizarData(dataRaw);
    const erros = [];
    if (!dataFmt) erros.push('Data inválida');
    if (!estab)   erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0) erros.push('Valor inválido');
    const chave = (!erros.length) ? gerarChaveDedup(dataFmt, estab, valor, portador, parcela) : null;
    resultado.push({
      _idx: resultado.length,
      data: dataFmt, dataOriginal: dataFmt,
      descricao: estab, portador, parcela, valor, isNegativo,
      categoriaId: categorizarTransacao(estab, origemBanco, categorias, mapaHist),
      contaId,
      erro: erros.length ? erros.join(', ') : null,
      _erroOriginal: erros.length ? erros.join(', ') : null,
      chave_dedup: chave, duplicado: false, tipoLinha: null,
    });
  }
  return resultado;
}

// ── Normalização de valor XP: "R$ 1.290,00" → 1290.00 ─────────
// BUG-014: detecta convenção de separador decimal via posição do
// último ponto vs última vírgula para evitar destruir casas decimais.
export function normalizarValorXP(val) {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  let s = String(val).trim().replace(/R\$\s*/i, '').replace(/\s/g, '');
  const lastDot   = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastComma > lastDot) {
    // Convenção BR: ponto = milhar, vírgula = decimal  →  "1.290,00"
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Convenção US/XP: vírgula = milhar, ponto = decimal  →  "1,290.00"
    s = s.replace(/,/g, '');
  }
  // Se só tem vírgula (sem ponto), trata como decimal BR  →  "1290,00"
  if (lastComma >= 0 && lastDot < 0) s = s.replace(',', '.');
  return parseFloat(s);
}

// ── Normalização de data ─────────────────────────────────────────
export function normalizarData(val) {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // XLSX: datas podem vir como serial numérico (dias desde 1899-12-30)
  if (typeof val === 'number' && isFinite(val)) {
    const base = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.round(val * 86400000);
    const d = new Date(base.getTime() + ms);
    d.setUTCHours(12, 0, 0, 0); // reduz risco de virar dia por timezone
    return isNaN(d.getTime()) ? null : d;
  }

  const s  = String(val).trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(m1[3] + '-' + m1[2].padStart(2,'0') + '-' + m1[1].padStart(2,'0') + 'T12:00:00');
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(s + 'T12:00:00');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ── NRF-002.1: Normaliza parcela para formato canônico "XX/YY" ──
// Aceita "X/Y", "X de Y" (CSV fatura) ou "-"
export function normalizarParcela(str) {
  if (!str || String(str).trim() === '-') return '-';
  const s = String(str).trim();
  const m = s.match(/^(\d+)\s+de\s+(\d+)$/i) || s.match(/^(\d+)\/(\d+)$/);
  if (!m) return '-';
  const a = parseInt(m[1], 10), t = parseInt(m[2], 10);
  if (a <= 0 || t <= 0 || a > t) return '-';
  return String(a).padStart(2, '0') + '/' + String(t).padStart(2, '0');
}

// ── RF-014: Interpreta campo Parcela "02/06" ou "2 de 6" ────────
export function parsearParcela(str) {
  if (!str || String(str).trim() === '-' || !String(str).trim()) return null;
  const s = String(str).trim();
  const m = s.match(/^(\d+)\/(\d+)$/) || s.match(/^(\d+)\s+de\s+(\d+)$/i);
  if (!m) return null;
  const atual = parseInt(m[1], 10);
  const total = parseInt(m[2], 10);
  if (atual > total || total <= 0 || atual <= 0) return null; // BUG-015: >= excluía última parcela (ex: 12/12)
  return { atual, total };
}

// ── RF-014: Gera chave de deduplicação ─────────────────────────
export function gerarChaveDedup(data, estab, valor, portador, parcela) {
  if (!data || isNaN(valor)) return null;
  const estabNorm = String(estab    ?? '').toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 50);
  const portNorm  = String(portador ?? '').toLowerCase().trim().substring(0, 30);
  const parc = parcela && String(parcela).trim() !== '-' ? String(parcela).trim() : null;
  if (parc) return estabNorm + '||' + Number(valor).toFixed(2) + '||' + portNorm + '||' + parc;
  const dataObj = data instanceof Date ? data : new Date(data);
  if (isNaN(dataObj.getTime())) return null;
  const dataISO = dataObj.toISOString().slice(0, 10);
  return dataISO + '||' + estabNorm + '||' + Number(valor).toFixed(2) + '||' + portNorm;
}

// ── NRF-004: Infere conta/banco a partir de palavras-chave ──────
// Prioridade: match direto contra nome das contas → mapa de keywords.
export function inferirContaDaDescricao(descricao, contas) {
  if (!descricao || !contas.length) return '';
  const d = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Tenta match direto pelo nome da conta
  for (const c of contas) {
    const palavras = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
    if (palavras.some(p => p.length > 3 && d.includes(p))) return c.id;
  }

  // 2. Mapa de palavras-chave → trecho do nome da conta
  const BANCO_KEYWORDS = [
    { keys: ['itau', 'itaú'],                                     conta: 'itaú'      },
    { keys: ['bradesco'],                                          conta: 'bradesco'  },
    { keys: ['santander'],                                         conta: 'santander' },
    { keys: ['btg'],                                               conta: 'btg'       },
    { keys: ['xp invest', 'xpinvest', 'xp corret', 'xp pagamento'], conta: 'xp'     },
    { keys: ['nubank', 'nu pagamento', 'nu financ'],               conta: 'nubank'    },
    { keys: ['banco inter', 'inter pagamento'],                    conta: 'inter'     },
    { keys: ['c6 bank', 'c6bank', 'c6 pagamento'],                 conta: 'c6'        },
    { keys: ['caixa eco', 'cef ', 'cx eco'],                       conta: 'caixa'     },
    { keys: ['banco do brasil', 'bb seg', 'bb pag'],               conta: 'brasil'    },
    { keys: ['sicoob', 'sicredi'],                                 conta: 'sicoob'    },
    { keys: ['original'],                                          conta: 'original'  },
    { keys: ['next bank', 'next pag'],                             conta: 'next'      },
    { keys: ['neon'],                                              conta: 'neon'      },
    { keys: ['picpay'],                                            conta: 'picpay'    },
    { keys: ['mercado pago', 'mercadopago'],                       conta: 'mercado'   },
    { keys: ['facilcred'],                                         conta: 'facilcred' },
  ];

  for (const regra of BANCO_KEYWORDS) {
    if (regra.keys.some(k => d.includes(k))) {
      const match = contas.find(c =>
        c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(regra.conta)
      );
      if (match) return match.id;
    }
  }
  return '';
}
