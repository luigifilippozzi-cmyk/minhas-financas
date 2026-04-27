// ============================================================
// RF-020: Parser de Extrato Bancário em PDF
// Usa PDF.js (window.pdfjsLib — carregado via CDN no HTML)
//
// Fluxo:
//  1. Extrai páginas do PDF via PDF.js
//  2. Agrupa itens de texto por linha (posição Y)
//  3. Identifica linhas de transação por regex de data + valor
//  4. Extrai: dataStr, desc, valor (com sinal), confiança
//
// Não trata faturas de cartão (NRF-002 / NRF-005) — apenas extratos bancários.
// ============================================================

// ── PDF.js worker (deve ser configurado antes do primeiro getDocument) ──
const PDFJS_WORKER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Extrai transações de um arquivo PDF de extrato bancário.
 *
 * @param {File} file
 * @returns {Promise<Array<{dataStr:string, desc:string, valor:number, confianca:'alta'|'media'|'baixa'}>>}
 * @throws {Error} Se PDF.js não estiver carregado ou parsing falhar
 */
export async function extrairTransacoesPDF(file) {
  const lib = window.pdfjsLib;
  if (!lib) throw new Error('PDF.js não carregado. Recarregue a página.');

  // Configurar worker apenas uma vez
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const todasLinhas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();
    const linhas  = _agruparItensPorLinha(content.items);
    todasLinhas.push(...linhas);
  }

  return _parseLinhasTransacao(todasLinhas);
}

// ── Agrupamento de itens por posição Y (mesma linha visual) ──────────────

/**
 * Agrupa itens de texto do PDF.js por posição Y aproximada (mesma linha).
 * Os itens dentro de cada grupo são ordenados por X (esquerda → direita).
 *
 * @param {Array}  items      - textContent.items do PDF.js
 * @param {number} tolerancia - diferença máxima de Y para mesma linha (points)
 */
function _agruparItensPorLinha(items, tolerancia = 2.5) {
  const validos = items.filter(i => i.str.trim().length > 0);
  if (!validos.length) return [];

  // PDF coordinate system: Y cresce de baixo para cima → ordena desc
  validos.sort((a, b) => b.transform[5] - a.transform[5]);

  const grupos = [];
  let grupo = [validos[0]];

  for (let i = 1; i < validos.length; i++) {
    const yGrupo = grupo[0].transform[5];
    const yItem  = validos[i].transform[5];
    if (Math.abs(yGrupo - yItem) <= tolerancia) {
      grupo.push(validos[i]);
    } else {
      grupos.push(grupo);
      grupo = [validos[i]];
    }
  }
  grupos.push(grupo);

  return grupos.map(g => ({
    y: g[0].transform[5],
    texto: g
      .sort((a, b) => a.transform[4] - b.transform[4])  // X crescente
      .map(i => i.str)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  })).filter(l => l.texto.length > 0);
}

// ── Regex patterns ────────────────────────────────────────────────────────

// Data: DD/MM/YYYY | DD/MM/YY | DD/MM | DD-MM-YYYY | DD.MM.YYYY
const RE_DATA = /\b(\d{2}[\/\-\.]\d{2}(?:[\/\-\.]\d{2,4})?)\b/;

// Valor ao final da linha (com separador D/C opcional em bancos brasileiros):
// Aceita: 1.234,56  -1.234,56  1234,56  -1234,56
// Seguido opcionalmente de [D/C] (débito/crédito)
const RE_VALOR_FINAL = /(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})\s*([DC])?\s*$/i;

// Valor em qualquer posição (fallback)
const RE_VALOR_QUALQUER = /(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})/g;

// Palavras que indicam linha de cabeçalho, rodapé ou saldo — ignorar
const RE_IGNORAR = /\b(saldo|total|extrato|agência|agencia|conta|período|periodo|banco|pág\.|page|cpf|cnpj)\b|data\s+hist|descrição\s+valor|debito\s+credito/i;

// ── Parser principal ──────────────────────────────────────────────────────

/**
 * Tenta parsear cada linha de texto como transação bancária.
 * Retorna apenas linhas que têm data + valor identificáveis.
 */
function _parseLinhasTransacao(linhas) {
  const resultado = [];

  for (const { texto } of linhas) {
    if (texto.length < 7)          continue;
    if (RE_IGNORAR.test(texto))    continue;

    const dataMatch = texto.match(RE_DATA);
    if (!dataMatch) continue;

    // Tenta pegar valor ao final da linha (mais comum)
    let valorMatch = texto.match(RE_VALOR_FINAL);
    let dcFlag     = null;

    if (!valorMatch) {
      // Fallback: último valor encontrado em qualquer posição
      const todos = [...texto.matchAll(RE_VALOR_QUALQUER)];
      if (!todos.length) continue;
      valorMatch = todos[todos.length - 1];
    } else {
      dcFlag = valorMatch[2]?.toUpperCase() ?? null;
    }

    const valorStr = (valorMatch[1] ?? valorMatch[0]).replace(/\./g, '').replace(',', '.');
    let valor = parseFloat(valorStr);
    if (isNaN(valor) || valor === 0) continue;

    // Ajuste D/C: alguns bancos imprimem valor absoluto + letra D ou C
    if (dcFlag === 'D' && valor > 0) valor = -valor;
    if (dcFlag === 'C' && valor < 0) valor = Math.abs(valor);

    // Descrição = texto entre data e valor (ou antes da data)
    const dataPos  = texto.indexOf(dataMatch[0]);
    const valorPosStr = (valorMatch[1] ?? valorMatch[0]) + (dcFlag ? ' ' + dcFlag : '');
    const valorPos = texto.lastIndexOf(valorMatch[1] ?? valorMatch[0]);

    let desc = texto
      .substring(dataPos + dataMatch[0].length, valorPos)
      .replace(/[^\w\sÀ-ÿ\-\/\.,]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // BUG-033: BTG Pactual (e outros) incluem HH:MM após a data no PDF
    // ("30/03/2026 18:43 PIX RECEBIDO..."). O timestamp ficaria na descrição
    // e quebraria a chave_dedup vs. CSV do mesmo banco (sem timestamp).
    desc = desc.replace(/^\d{2}:\d{2}(?::\d{2})?\s+/, '').trim();

    // Se a descrição ficou vazia, tenta o que precede a data
    if (!desc || desc.length < 2) {
      desc = texto.substring(0, dataPos).replace(/\s{2,}/g, ' ').trim();
    }
    if (!desc || desc.length < 2) desc = 'Transação';

    resultado.push({
      dataStr:   dataMatch[1],
      desc:      desc.substring(0, 100),
      valor,                              // mantém sinal original
      confianca: _calcularConfianca(desc, valor, texto),
    });
  }

  return resultado;
}

// ── Qualidade da extração ─────────────────────────────────────────────────

function _calcularConfianca(desc, valor, textoOriginal) {
  let score = 100;

  if (!desc || desc.length < 3)        score -= 40;
  else if (desc.length < 8)            score -= 15;
  if (/^\d+$/.test(desc))              score -= 30;  // só números = provável lixo
  if (Math.abs(valor) > 500_000)       score -= 25;  // valor improvável (PF)
  if (textoOriginal.length > 180)      score -= 10;  // linha muito longa (fusão)
  if (valor > 0 && valor < 0.01)       score -= 40;  // valor quase zero

  if (score >= 80) return 'alta';
  if (score >= 50) return 'media';
  return 'baixa';
}
