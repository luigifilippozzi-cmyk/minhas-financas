// ============================================================
// PAGE: Importar — RF-013
// Importação de transações de cartão de crédito.
//
// FORMATOS SUPORTADOS:
//  • CSV do extrato bancário (exportado diretamente pelo banco)
//    Layout: Data;Estabelecimento;Portador;Valor;Parcela
//  • Excel (.xlsx) com o mesmo layout (template disponível para download)
//
// REGRAS DE FILTRO:
//  • Lançamentos com valor negativo são ignorados (pagamentos/estornos)
//  • Linhas "Pagamento de fatura" e "Inclusao de Pagamento" são ignoradas
//
// SINCRONIZAÇÃO:
//  • Despesas importadas usam origem:'importacao' para rastreabilidade
//  • onSnapshot propaga para todos os membros do grupo em tempo real
// ============================================================

import { onAuthChange, logout }           from '../services/auth.js';
import { buscarPerfil, ouvirCategorias }  from '../services/database.js';
import { criarDespesa as criarDespesaDB } from '../services/database.js';
import { modelDespesa }                   from '../models/Despesa.js';
import { formatarMoeda, formatarData }    from '../utils/formatters.js';

// ── Estado ───────────────────────────────────────────────────
let _usuario    = null;
let _grupoId    = null;
let _categorias = [];
let _unsubCats  = null;
let _linhas     = [];

// ── Inicialização ─────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = '../login.html'; return; }
  _usuario = user;
  const perfil = await buscarPerfil(user.uid);
  if (!perfil?.grupoId) { window.location.href = '../grupo.html'; return; }
  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;
  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome));
    atualizarDropdownsCategoria();
    preencherSelCatLote();
  });
  configurarEventos();
});

// ── Eventos ───────────────────────────────────────────────────
function configurarEventos() {
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());

  const fileInput = document.getElementById('file-input');
  const dropArea  = document.getElementById('drop-area');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  });
  dropArea.addEventListener('dragover',  (e) => { e.preventDefault(); dropArea.classList.add('imp-drop-area--over'); });
  dropArea.addEventListener('dragleave', ()  => dropArea.classList.remove('imp-drop-area--over'));
  dropArea.addEventListener('drop',      (e) => {
    e.preventDefault();
    dropArea.classList.remove('imp-drop-area--over');
    const file = e.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  });

  document.getElementById('btn-trocar-arquivo')?.addEventListener('click', resetarUpload);
  document.getElementById('chk-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = e.target.checked; });
    atualizarChipsPreview();
  });
  document.getElementById('btn-sel-todos')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = true; });
    document.getElementById('chk-all').checked = true;
    atualizarChipsPreview();
  });
  document.getElementById('btn-desel-todos')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = false; });
    document.getElementById('chk-all').checked = false;
    atualizarChipsPreview();
  });
  document.getElementById('sel-cat-lote')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    document.querySelectorAll('.sel-cat-linha').forEach((sel) => { sel.value = e.target.value; });
    atualizarChipsPreview();
  });
  document.getElementById('btn-importar')?.addEventListener('click', () => executarImportacao());
  document.getElementById('btn-nova-importacao')?.addEventListener('click', resetarTudo);
}

// ── Processar arquivo ────────────────────────────────────────
function processarArquivo(file) {
  document.getElementById('erro-leitura').classList.add('hidden');

  const isCSV  = /\.csv$/i.test(file.name);
  const isXLSX = /\.(xlsx|xls)$/i.test(file.name);

  if (!isCSV && !isXLSX) {
    mostrarErroLeitura('Formato não suportado. Use o extrato CSV do banco ou o template Excel (.xlsx).');
    return;
  }

  if (isCSV) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parsearCSVTexto(e.target.result);
        _linhas    = parsearLinhasExtrato(rows);
        if (!_linhas.length) {
          mostrarErroLeitura('Nenhuma transação encontrada. Verifique se o arquivo está no formato correto.');
          return;
        }
        mostrarArquivoSelecionado(file.name);
        renderizarPreview();
      } catch (err) { mostrarErroLeitura(`Erro ao ler o CSV: ${err.message}`); }
    };
    reader.readAsText(file, 'UTF-8');
    return;
  }

  // Excel via SheetJS
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb   = XLSX.read(data, { type: 'array', cellDates: true });
      const name = wb.SheetNames.find(n => /transa/i.test(n)) ?? wb.SheetNames[0];
      const ws   = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'DD/MM/YYYY' });
      _linhas    = parsearLinhasExtrato(rows);
      if (!_linhas.length) {
        mostrarErroLeitura('Nenhuma transação encontrada no arquivo.');
        return;
      }
      mostrarArquivoSelecionado(file.name);
      renderizarPreview();
    } catch (err) { mostrarErroLeitura(`Erro ao ler o Excel: ${err.message}`); }
  };
  reader.readAsArrayBuffer(file);
}

// ── Parser CSV com separador ";" ─────────────────────────────
function parsearCSVTexto(content) {
  const texto = content.replace(/^\uFEFF/, ''); // remove BOM
  return texto
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(l => l.split(';').map(c => c.trim()));
}

// ── Parser de linhas — layout do extrato bancário ─────────────
// Colunas: Data | Estabelecimento | Portador | Valor | Parcela
function parsearLinhasExtrato(rows) {
  if (!rows.length) return [];

  // Detecta linha de cabeçalho
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(c => String(c ?? '').toLowerCase().trim());
    if (r.some(c => c === 'data') &&
        r.some(c => c.includes('estabelecimento') || c.includes('descri')) &&
        r.some(c => c.includes('valor'))) {
      headerIdx = i; break;
    }
  }

  // Índices das colunas
  let idxData = 0, idxEstab = 1, idxPortador = 2, idxValor = 3, idxParcela = 4;
  if (headerIdx >= 0) {
    const h = rows[headerIdx].map(c => String(c ?? '').toLowerCase().trim());
    idxData     = h.findIndex(c => c === 'data');
    idxEstab    = h.findIndex(c => c.includes('estabelecimento') || c.includes('descri'));
    idxPortador = h.findIndex(c => c.includes('portador') || c.includes('titular'));
    idxValor    = h.findIndex(c => c.includes('valor'));
    idxParcela  = h.findIndex(c => c.includes('parcela'));
    if (idxData     < 0) idxData     = 0;
    if (idxEstab    < 0) idxEstab    = 1;
    if (idxPortador < 0) idxPortador = 2;
    if (idxValor    < 0) idxValor    = 3;
  }

  const dataRows  = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);
  const resultado = [];

  for (const row of dataRows) {
    if (!row?.some(c => c)) continue; // linha vazia

    const dataRaw  = String(row[idxData]     ?? '').trim();
    const estab    = String(row[idxEstab]    ?? '').trim();
    const portador = String(row[idxPortador] ?? '').trim();
    const valorRaw = String(row[idxValor]    ?? '').trim();
    const parcela  = idxParcela >= 0 ? String(row[idxParcela] ?? '').trim() : '-';

    if (!dataRaw && !estab && !valorRaw) continue;

    // Filtra lançamentos de pagamento
    const estabLow = estab.toLowerCase();
    if (/pagamento de fatura|inclusao de pagamento|inclusão de pagamento|parcela de fatura rotativo/i.test(estabLow)) continue;

    const valor = normalizarValorXP(valorRaw);
    if (!isNaN(valor) && valor < 0) continue; // descarta negativos (estornos/créditos)

    const dataFmt = normalizarData(dataRaw);
    const erros   = [];
    if (!dataFmt)                  erros.push('Data inválida');
    if (!estab)                    erros.push('Estabelecimento vazio');
    if (isNaN(valor) || valor <= 0) erros.push('Valor inválido');

    resultado.push({
      _idx:        resultado.length,
      data:        dataFmt,
      descricao:   estab,
      portador,
      parcela,
      valor,
      categoriaId: mapearCategoria(estab),
      erro:        erros.length ? erros.join(', ') : null,
    });
  }
  return resultado;
}

// ── Normalização valor XP: "R$ 1.290,00" → 1290.00 ──────────
function normalizarValorXP(val) {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  const s = String(val).trim()
    .replace(/R\$\s*/i, '')
    .replace(/\./g, '')    // ponto de milhar
    .replace(',', '.');    // decimal
  return parseFloat(s);
}

// ── Normalização de data ──────────────────────────────────────
function normalizarData(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(`${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T12:00:00`);
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(`${s}T12:00:00`);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ── Auto-mapeamento por palavras-chave do estabelecimento ────
function mapearCategoria(estab) {
  if (!estab || !_categorias.length) return '';
  const e = estab.toLowerCase();
  const regras = [
    { keys: ['mercado','supermercado','pao','padaria','hortifruti','feira','lemon','sams','açougue','boutique do pao'], cat: 'alimentação' },
    { keys: ['restauran','rest ','lanche','burger','pizza','sushi','ifood','ifd*','acai','delivery','cafe ','coffee','bistrô'], cat: 'alimentação' },
    { keys: ['uber','99*','taxi','cabify','combustivel','gasolina','posto ','shell','ipiranga','estacion'], cat: 'transporte' },
    { keys: ['farmacia','drogaria','droga','raia','ultrafarma','panvel','medic','clinica','hospital','laborat','odonto','saude'], cat: 'saúde' },
    { keys: ['netflix','spotify','disney','amazon prime','hbo','youtube','globoplay','cinema','teatro','show','ingresso'], cat: 'lazer' },
    { keys: ['apple.com','google','icloud','microsoft','shopee','amazon','mercadolivre','aliexpress','temu','magazine'], cat: 'compras' },
    { keys: ['escola','faculdade','curso','educacao','educação','duolingo','udemy','coursera'], cat: 'educação' },
    { keys: ['luz','energia','agua','gás','gas','internet','telefone','tim ','vivo ','claro ','oi ','sabesp','cemig','enel','copel'], cat: 'moradia' },
    { keys: ['pet','cobasi','patagrife','petlove','finpet','nutricar','vet'], cat: 'pets' },
    { keys: ['gympass','wellhub','academia','smartfit','bodytech','total pass'], cat: 'saúde' },
  ];

  for (const regra of regras) {
    if (regra.keys.some(k => e.includes(k))) {
      const cat = _categorias.find(c =>
        c.nome.toLowerCase().includes(regra.cat) || regra.cat.includes(c.nome.toLowerCase())
      );
      if (cat) return cat.id;
    }
  }
  return '';
}

// ── Renderização da tabela de preview ────────────────────────
function renderizarPreview() {
  const tbody = document.getElementById('tbody-preview');
  tbody.innerHTML = '';

  _linhas.forEach((l) => {
    const tr = document.createElement('tr');
    if (l.erro) tr.classList.add('imp-row-erro');

    // Checkbox
    const tdChk = document.createElement('td');
    const chk   = document.createElement('input');
    chk.type = 'checkbox'; chk.className = 'chk-linha';
    chk.dataset.idx = l._idx; chk.checked = !l.erro;
    chk.addEventListener('change', () => atualizarChipsPreview());
    tdChk.appendChild(chk);

    // Data
    const tdData = criarTd(l.data ? formatarData(l.data) : '—');

    // Estabelecimento
    const tdEstab = criarTd(l.descricao || '—');

    // Portador (primeiros 2 nomes)
    const portCurto = l.portador ? l.portador.split(' ').slice(0,2).join(' ') : '—';
    const tdPortador = criarTd(portCurto, '.82rem', 'var(--text-muted)');

    // Parcela
    const tdParcela = criarTd(l.parcela || '-', '.82rem',
      (l.parcela && l.parcela !== '-') ? '#1565c0' : 'var(--text-muted)');
    tdParcela.style.textAlign = 'center';
    if (l.parcela && l.parcela !== '-') tdParcela.style.fontWeight = '600';

    // Valor
    const tdVal = criarTd(isNaN(l.valor) ? '—' : formatarMoeda(l.valor));
    tdVal.style.textAlign = 'right'; tdVal.style.fontWeight = '600';
    if (!isNaN(l.valor)) tdVal.style.color = 'var(--danger)';

    // Categoria (dropdown)
    const tdCat  = document.createElement('td');
    const selCat = document.createElement('select');
    selCat.className    = 'sel-cat-linha select-input';
    selCat.style.cssText = 'font-size:.85rem;padding:.2rem .4rem;';
    selCat.dataset.idx  = l._idx;
    selCat.innerHTML    = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
    selCat.value = l.categoriaId ?? '';
    selCat.addEventListener('change', (e) => {
      _linhas[l._idx].categoriaId = e.target.value;
      atualizarChipsPreview();
    });
    tdCat.appendChild(selCat);

    // Status
    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    tdStatus.innerHTML = l.erro
      ? `<span class="imp-badge imp-badge--erro" title="${l.erro}">⚠️</span>`
      : '<span class="imp-badge imp-badge--ok">✓</span>';

    tr.append(tdChk, tdData, tdEstab, tdPortador, tdParcela, tdVal, tdCat, tdStatus);
    tbody.appendChild(tr);
  });

  document.getElementById('sec-preview').classList.remove('hidden');
  atualizarChipsPreview();
}

function criarTd(texto, fontSize, color) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (fontSize) td.style.fontSize = fontSize;
  if (color)    td.style.color    = color;
  return td;
}

// ── Chips de preview ─────────────────────────────────────────
function atualizarChipsPreview() {
  const sel    = [...document.querySelectorAll('.chk-linha:checked')];
  const total  = sel.reduce((s, cb) => s + (_linhas[+cb.dataset.idx]?.valor || 0), 0);
  const erros  = _linhas.filter(l => l.erro).length;

  document.getElementById('chip-lidas').textContent        = _linhas.length;
  document.getElementById('chip-selecionadas').textContent = sel.length;
  document.getElementById('chip-total-imp').textContent    = formatarMoeda(total);
  document.getElementById('btn-imp-count').textContent     = sel.length;
  if (erros > 0) {
    document.getElementById('chip-erros').textContent = erros;
    document.getElementById('chip-erros-wrap').classList.remove('hidden');
  }
}

// ── Importação em lote ────────────────────────────────────────
async function executarImportacao() {
  const idxs = [...document.querySelectorAll('.chk-linha:checked')].map(cb => +cb.dataset.idx);
  if (!idxs.length) {
    document.getElementById('imp-aviso-zero').classList.remove('hidden');
    return;
  }
  document.getElementById('imp-aviso-zero').classList.add('hidden');
  const btn = document.getElementById('btn-importar');
  btn.disabled = true; btn.textContent = 'Importando…';

  let sucesso = 0, falha = 0;
  for (const idx of idxs) {
    const l   = _linhas[idx];
    const cat = document.querySelector(`.sel-cat-linha[data-idx="${idx}"]`)?.value ?? l.categoriaId ?? '';
    try {
      await criarDespesaDB(modelDespesa({
        descricao:   l.descricao,
        valor:       l.valor,
        categoriaId: cat,
        data:        l.data instanceof Date ? l.data : new Date(l.data),
        grupoId:     _grupoId,
        usuarioId:   _usuario.uid,
        origem:      'importacao',
        portador:    l.portador  ?? '',
        parcela:     l.parcela   ?? '-',
        importadoEm: new Date(),
      }));
      sucesso++;
    } catch { falha++; }
  }
  mostrarResultado(sucesso, falha);
}

// ── Resultado ─────────────────────────────────────────────────
function mostrarResultado(sucesso, falha) {
  document.getElementById('sec-preview').classList.add('hidden');
  document.getElementById('sec-upload').classList.add('hidden');
  const icon   = document.getElementById('resultado-icon');
  const titulo = document.getElementById('resultado-titulo');
  const msg    = document.getElementById('resultado-msg');
  if (falha === 0) {
    icon.textContent   = '✅';
    titulo.textContent = 'Importação concluída com sucesso!';
    msg.textContent    = `${sucesso} despesa${sucesso !== 1 ? 's' : ''} importada${sucesso !== 1 ? 's' : ''} e já sincronizadas com o grupo.`;
  } else {
    icon.textContent   = '⚠️';
    titulo.textContent = 'Importação concluída com avisos';
    msg.textContent    = `${sucesso} importada${sucesso !== 1 ? 's' : ''} com sucesso. ${falha} falha${falha !== 1 ? 's' : ''}.`;
  }
  document.getElementById('sec-resultado').classList.remove('hidden');
}

// ── Helpers de UI ─────────────────────────────────────────────
function mostrarArquivoSelecionado(nome) {
  document.getElementById('drop-area').classList.add('hidden');
  document.getElementById('arquivo-info').classList.remove('hidden');
  document.getElementById('arquivo-nome').textContent = nome;
}
function mostrarErroLeitura(msg) {
  const el = document.getElementById('erro-leitura');
  el.textContent = msg; el.classList.remove('hidden');
}
function preencherSelCatLote() {
  const sel = document.getElementById('sel-cat-lote');
  if (!sel) return;
  sel.innerHTML = '<option value="">— manter individual —</option>' +
    _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
}
function atualizarDropdownsCategoria() {
  document.querySelectorAll('.sel-cat-linha').forEach((sel) => {
    const idx = +sel.dataset.idx, atual = sel.value;
    sel.innerHTML = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
    sel.value = atual || mapearCategoria(_linhas[idx]?.descricao ?? '');
  });
  preencherSelCatLote();
}
function resetarUpload() {
  document.getElementById('file-input').value = '';
  document.getElementById('drop-area').classList.remove('hidden');
  document.getElementById('arquivo-info').classList.add('hidden');
  document.getElementById('erro-leitura').classList.add('hidden');
  document.getElementById('sec-preview').classList.add('hidden');
  _linhas = [];
}
function resetarTudo() {
  resetarUpload();
  document.getElementById('sec-upload').classList.remove('hidden');
  document.getElementById('sec-resultado').classList.add('hidden');
  document.getElementById('tbody-preview').innerHTML = '';
}
