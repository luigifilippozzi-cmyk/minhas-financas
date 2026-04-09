// ============================================================
// UTIL: Módulo Genérico de Importação — TD-006 (#96)
// Funções compartilhadas entre importar.js e receitas.js.
// Elimina duplicação de leitura de arquivo, normalização e UI.
// ============================================================

import { normalizarValorXP, normalizarData, inferirContaDaDescricao } from './normalizadorTransacoes.js';

// Re-exporta para que ambas as páginas importem daqui
export { inferirContaDaDescricao };

// ── Leitura de arquivo CSV → rows[][] ────────────────────────────
export function lerArquivoCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const texto = e.target.result.replace(/^\uFEFF/, '');
        const rows = texto
          .split(/\r?\n/)
          .filter(l => l.trim())
          .map(l => l.split(';').map(c => c.trim()));
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
    reader.readAsText(file, 'UTF-8');
  });
}

// ── Leitura de arquivo XLSX → rows[][] ──────────────────────────
// sheetNamePattern: RegExp opcional para selecionar aba por nome
export function lerArquivoXLSX(file, sheetNamePattern = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
        const name = sheetNamePattern
          ? (wb.SheetNames.find(n => sheetNamePattern.test(n)) ?? wb.SheetNames[0])
          : wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, dateNF: 'DD/MM/YYYY' });
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo Excel'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Detectar formato do arquivo ─────────────────────────────────
export function detectarFormato(fileName) {
  if (/\.csv$/i.test(fileName)) return 'csv';
  if (/\.(xlsx|xls)$/i.test(fileName)) return 'xlsx';
  if (/\.pdf$/i.test(fileName)) return 'pdf';
  return null;
}

// ── Chave de deduplicação para receitas ─────────────────────────
export function gerarChaveDedupReceita(data, desc, valor) {
  if (!data || isNaN(valor)) return null;
  const iso = (data instanceof Date ? data : new Date(data)).toISOString().slice(0, 10);
  const norm = String(desc).toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 60);
  return `rec||${iso}||${norm}||${Number(valor).toFixed(2)}`;
}

// ── Normalizar valor para receitas (sempre positivo) ────────────
export function normalizarValorReceita(val) {
  if (!val && val !== 0) return NaN;
  if (typeof val === 'number') return Math.abs(val);
  const v = normalizarValorXP(val);
  return isNaN(v) ? NaN : Math.abs(v);
}

// ── Resolver conta por nome (match fuzzy) ───────────────────────
// Tenta match direto pelo nome, depois delega para inferirContaDaDescricao.
export function resolverContaPorNome(contaNome, contas) {
  if (!contaNome || !contas.length) return '';
  const _norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const contaNomeN = _norm(contaNome);
  const contaObj = contas.find(c => {
    const n = _norm(c.nome);
    return n.includes(contaNomeN) || contaNomeN.includes(n);
  });
  return contaObj?.id || inferirContaDaDescricao(contaNome, contas);
}

// ── Resolver categoria por nome (match case-insensitive) ────────
export function resolverCategoriaPorNome(catNome, categorias) {
  if (!catNome || !categorias.length) return '';
  const catObj = categorias.find(c =>
    c.nome.toLowerCase().includes(catNome.toLowerCase()) ||
    catNome.toLowerCase().includes(c.nome.toLowerCase())
  );
  return catObj?.id ?? '';
}

// ── Parser genérico de linhas de receitas ────────────────────────
// Extraído de receitas.js `_parsearLinhasRec` para reutilização.
export function parsearLinhasReceita(rows, { categorias = [], contas = [], chavesRec = new Set(), contaGlobalId = '' } = {}) {
  if (!rows.length) return [];
  // Detecta linha de cabeçalho
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(c => String(c ?? '').toLowerCase().trim());
    if (r.some(c => c === 'data') && r.some(c => c.includes('descri') || c.includes('estabele'))) {
      headerIdx = i; break;
    }
  }
  let idxData = 0, idxDesc = 1, idxValor = 2, idxCat = 3, idxConta = 4;
  if (headerIdx >= 0) {
    const h = rows[headerIdx].map(c => String(c ?? '').toLowerCase().trim());
    idxData  = h.findIndex(c => c === 'data');
    idxDesc  = h.findIndex(c => c.includes('descri') || c.includes('estabele'));
    idxValor = h.findIndex(c => c.includes('valor'));
    idxCat   = h.findIndex(c => c.includes('categ'));
    idxConta = h.findIndex(c => c.includes('conta') || c.includes('banco'));
    if (idxData < 0)  idxData  = 0;
    if (idxDesc < 0)  idxDesc  = 1;
    if (idxValor < 0) idxValor = 2;
  }
  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);
  const resultado = [];
  for (const row of dataRows) {
    if (!row?.some(c => c)) continue;
    const dataRaw   = String(row[idxData]  ?? '').trim();
    const desc      = String(row[idxDesc]  ?? '').trim();
    const valorRaw  = String(row[idxValor] ?? '').trim();
    const catNome   = idxCat   >= 0 ? String(row[idxCat]   ?? '').trim() : '';
    const contaNome = idxConta >= 0 ? String(row[idxConta] ?? '').trim() : '';
    if (!dataRaw && !desc && !valorRaw) continue;
    const valor = normalizarValorReceita(valorRaw);
    const data  = normalizarData(dataRaw);
    const erros = [];
    if (!data)                      erros.push('Data inválida');
    if (!desc)                      erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0) erros.push('Valor inválido');
    const catId   = resolverCategoriaPorNome(catNome, categorias);
    const contaId = resolverContaPorNome(contaNome, contas)
      || inferirContaDaDescricao(desc, contas)
      || contaGlobalId;
    const chave    = erros.length ? null : gerarChaveDedupReceita(data, desc, valor);
    const duplicado = chave ? chavesRec.has(chave) : false;
    resultado.push({
      _idx: resultado.length, data, descricao: desc, valor,
      categoriaId: catId, contaId, chave_dedup: chave,
      duplicado, erro: erros.length ? erros.join(', ') : null,
    });
  }
  return resultado;
}

// ── UI: Mostrar arquivo selecionado ─────────────────────────────
export function mostrarArquivoUI(nomeArquivo, { dropAreaId, arquivoInfoId, arquivoNomeId }) {
  document.getElementById(dropAreaId)?.classList.add('hidden');
  document.getElementById(arquivoInfoId)?.classList.remove('hidden');
  const el = document.getElementById(arquivoNomeId);
  if (el) el.textContent = nomeArquivo;
}

// ── UI: Mostrar erro de leitura ─────────────────────────────────
export function mostrarErroUI(msg, erroElementId) {
  const el = document.getElementById(erroElementId);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

// ── UI: Preencher selects de contas ─────────────────────────────
export function preencherSelectsContasUI(contas, { globalId, loteId, linhaClass, linhasArray }) {
  const optStr = '<option value="">— sem conta —</option>' +
    contas.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  const optLote = '<option value="">— manter individual —</option>' +
    contas.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (globalId) {
    const selGlobal = document.getElementById(globalId);
    if (selGlobal) { const v = selGlobal.value; selGlobal.innerHTML = optStr; selGlobal.value = v; }
  }
  if (loteId) {
    const selLote = document.getElementById(loteId);
    if (selLote) { const v = selLote.value; selLote.innerHTML = optLote; selLote.value = v; }
  }
  if (linhaClass && linhasArray) {
    document.querySelectorAll(`.${linhaClass}`).forEach((sel) => {
      const idx = +sel.dataset.idx, v = sel.value;
      sel.innerHTML = optStr;
      sel.value = v || linhasArray[idx]?.contaId || '';
    });
  }
}

// ── UI: Resetar área de upload ──────────────────────────────────
export function resetarUploadUI({ fileInputId, dropAreaId, arquivoInfoId, erroId, previewSecId }) {
  const fileInput = document.getElementById(fileInputId);
  if (fileInput) fileInput.value = '';
  document.getElementById(dropAreaId)?.classList.remove('hidden');
  document.getElementById(arquivoInfoId)?.classList.add('hidden');
  document.getElementById(erroId)?.classList.add('hidden');
  document.getElementById(previewSecId)?.classList.add('hidden');
}
