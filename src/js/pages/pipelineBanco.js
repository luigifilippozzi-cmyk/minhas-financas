// ============================================================
// PIPELINE: Extrato Bancário — RF-013 + RF-020
// Parsing e classificação de extratos bancários (CSV/XLSX/PDF).
// ============================================================
import { parsearLinhasCSVXLSX, normalizarData, gerarChaveDedup, inferirContaDaDescricao } from '../utils/normalizadorTransacoes.js';
import { categorizarTransacao } from '../utils/categorizer.js';

// ── RF-020: Normaliza string de data do PDF para Date ────────────
// Suporta: DD/MM/YYYY, DD/MM/YY, DD/MM, DD-MM-YYYY, DD.MM.YYYY
function _normalizarDataPDF(dataStr) {
  if (!dataStr) return null;
  let s = dataStr.replace(/[-\.]/g, '/');
  const parts = s.split('/');
  if (parts.length === 2) {
    // DD/MM → assume ano corrente
    s = parts[0].padStart(2,'0') + '/' + parts[1].padStart(2,'0') + '/' + new Date().getFullYear();
  } else if (parts.length === 3 && parts[2].length === 2) {
    // DD/MM/YY → DD/MM/20YY
    s = parts[0].padStart(2,'0') + '/' + parts[1].padStart(2,'0') + '/20' + parts[2];
  }
  return normalizarData(s);
}

// ── Processa extrato bancário CSV/XLSX ─────────────────────────
// Delega a parsearLinhasCSVXLSX com os parâmetros do contexto.
export function processarExtratoBancario({ rows, contas, categorias, mapaHist, origemBanco }) {
  return parsearLinhasCSVXLSX(rows, { contas, categorias, mapaHist, origemBanco });
}

// ── RF-020: Converte resultado do pdfParser para linhas ─────────
// raw: [{dataStr, desc, valor, confianca}]
// valor negativo = débito (despesa), positivo = crédito (receita)
export function parsearLinhasPDF(raw, {
  contas = [], categorias = [], mapaHist = {},
  origemBanco = 'desconhecido', contaGlobal = '',
} = {}) {
  return raw.map((item, idx) => {
    const data  = _normalizarDataPDF(item.dataStr);
    const valor = Math.abs(item.valor);
    const isCredito = item.valor < 0;  // negativo = débito = isCredito para o pipeline
    const erros = [];
    if (!data)                              erros.push('Data inválida');
    if (!item.desc || item.desc.length < 2) erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0)         erros.push('Valor inválido');
    const chave = erros.length ? null : gerarChaveDedup(data, item.desc, valor, '', '-');
    return {
      _idx: idx,
      data, dataOriginal: data,
      descricao: item.desc, portador: '', parcela: '-', valor, isCredito,
      categoriaId: categorizarTransacao(item.desc, origemBanco, categorias, mapaHist),
      contaId: contaGlobal || inferirContaDaDescricao(item.desc, contas),
      erro: erros.length ? erros.join(', ') : null,
      _erroOriginal: erros.length ? erros.join(', ') : null,
      chave_dedup: chave, duplicado: false, tipoLinha: null,
      _confiancaPDF: item.confianca,  // 'alta' | 'media' | 'baixa'
    };
  });
}

// ── RF-020: Classifica linhas de extrato como despesa/receita ───
// Usa o sinal do valor original (isCredito) para determinar a direção.
// sinaisInvertidos=true: bancos que usam convenção oposta (positivo=despesa).
// Muta as linhas in-place.
export function classificarBanco(linhas, sinaisInvertidos = false) {
  linhas.forEach((l) => {
    if (!l.erro) {
      const isDebt = sinaisInvertidos ? !l.isCredito : l.isCredito;
      l.tipoLinha = isDebt ? 'despesa' : 'receita';
    }
  });
}
