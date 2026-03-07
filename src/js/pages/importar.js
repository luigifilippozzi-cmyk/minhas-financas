// ============================================================
// PAGE: Importar — RF-013
// Importação de transações de cartão de crédito via Excel.
//
// FLUXO:
//  1. Usuário baixa o template Excel
//  2. Preenche e carrega o arquivo (.xlsx)
//  3. SheetJS (global XLSX) lê e valida as linhas
//  4. Tabela de preview com checkbox + dropdown de categoria por linha
//  5. Confirma → batch write no Firestore com origem: 'importacao'
//  6. Sync bidirecional via onSnapshot exibe para ambos os membros
// ============================================================

import { onAuthChange, logout }       from '../services/auth.js';
import { buscarPerfil, ouvirCategorias } from '../services/database.js';
import { criarDespesa as criarDespesaDB } from '../services/database.js';
import { modelDespesa }                from '../models/Despesa.js';
import { formatarMoeda, formatarData } from '../utils/formatters.js';

// ── Estado ───────────────────────────────────────────────────
let _usuario    = null;
let _grupoId    = null;
let _categorias = [];
let _unsubCats  = null;

// Linhas lidas do Excel
let _linhas = [];  // [{ _idx, data, descricao, valor, categoriaHint, categoriaId, erro }]

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
    // Atualiza dropdowns existentes na tabela (se já aberta)
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

  // Click na label já aciona o input; aqui tratamos o change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  });

  // Drag & drop
  dropArea.addEventListener('dragover',  (e) => { e.preventDefault(); dropArea.classList.add('imp-drop-area--over'); });
  dropArea.addEventListener('dragleave', ()  => dropArea.classList.remove('imp-drop-area--over'));
  dropArea.addEventListener('drop',      (e) => {
    e.preventDefault();
    dropArea.classList.remove('imp-drop-area--over');
    const file = e.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  });

  // Trocar arquivo
  document.getElementById('btn-trocar-arquivo')?.addEventListener('click', () => {
    resetarUpload();
  });

  // Check-all
  document.getElementById('chk-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = e.target.checked; });
    atualizarChipsPreview();
  });

  // Selecionar / Desmarcar todos
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

  // Categoria em lote
  document.getElementById('sel-cat-lote')?.addEventListener('change', (e) => {
    const catId = e.target.value;
    if (!catId) return;
    document.querySelectorAll('.sel-cat-linha').forEach((sel) => { sel.value = catId; });
    atualizarChipsPreview();
  });

  // Importar
  document.getElementById('btn-importar')?.addEventListener('click', () => executarImportacao());

  // Nova importação
  document.getElementById('btn-nova-importacao')?.addEventListener('click', () => {
    resetarTudo();
  });
}

// ── Processar arquivo Excel ───────────────────────────────────
function processarArquivo(file) {
  const erroEl = document.getElementById('erro-leitura');
  erroEl.classList.add('hidden');

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    mostrarErroLeitura('Arquivo inválido. Use apenas arquivos Excel (.xlsx).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      // XLSX é global carregado via <script> em importar.html
      const wb   = XLSX.read(data, { type: 'array', cellDates: true });

      // Tenta a primeira sheet com dados (prefere "Transações")
      const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('transa')) ?? wb.SheetNames[0];
      const ws        = wb.Sheets[sheetName];
      const rows      = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'DD/MM/YYYY' });

      _linhas = parsearLinhas(rows);

      if (!_linhas.length) {
        mostrarErroLeitura('Nenhuma transação encontrada no arquivo. Verifique se preencheu a partir da linha 5.');
        return;
      }

      mostrarArquivoSelecionado(file.name);
      renderizarPreview();
    } catch (err) {
      mostrarErroLeitura(`Erro ao ler o arquivo: ${err.message}`);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── Parser de linhas ─────────────────────────────────────────
function parsearLinhas(rows) {
  // Detecta a linha de cabeçalho (procura "data" ou "descrição")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(c => String(c ?? '').toLowerCase());
    if (r.some(c => c.includes('data')) && r.some(c => c.includes('descri'))) {
      headerIdx = i;
      break;
    }
  }

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);

  const resultado = [];
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const [colData, colDesc, colValor, colCat] = row;

    // Ignora linhas completamente vazias
    if (!colData && !colDesc && !colValor) continue;
    // Ignora linhas de exemplo do template
    if (String(colDesc ?? '').toLowerCase().includes('supermercado pão de açúcar') && i < 10) continue;

    const dataFmt   = normalizarData(colData);
    const descricao = String(colDesc ?? '').trim();
    const valor     = normalizarValor(colValor);
    const catHint   = String(colCat ?? '').trim();

    const erros = [];
    if (!dataFmt)       erros.push('Data inválida');
    if (!descricao)     erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0) erros.push('Valor inválido');

    resultado.push({
      _idx:         resultado.length,
      data:         dataFmt,
      descricao,
      valor,
      categoriaHint: catHint,
      categoriaId:  mapearCategoria(catHint),
      erro:         erros.length ? erros.join(', ') : null,
    });
  }
  return resultado;
}

// Tenta mapear o hint de categoria para um id real (case-insensitive, parcial)
function mapearCategoria(hint) {
  if (!hint) return '';
  const h = hint.toLowerCase().trim();
  const match = _categorias.find((c) =>
    c.nome.toLowerCase().includes(h) || h.includes(c.nome.toLowerCase())
  );
  return match?.id ?? '';
}

// Normaliza data: aceita Date, string DD/MM/AAAA, string AAAA-MM-DD, etc.
function normalizarData(val) {
  if (!val) return null;
  // Se já é Date (cellDates:true do SheetJS)
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();
  // DD/MM/AAAA
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(`${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T12:00:00`);
  // AAAA-MM-DD
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(`${s}T12:00:00`);
  // Tenta genérico
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// Normaliza valor: "189,90" → 189.90
function normalizarValor(val) {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  const s = String(val).trim().replace(/[R$\s]/g, '').replace(',', '.');
  return parseFloat(s);
}

// ── Renderização do preview ───────────────────────────────────
function renderizarPreview() {
  const tbody = document.getElementById('tbody-preview');
  tbody.innerHTML = '';

  _linhas.forEach((l) => {
    const tr = document.createElement('tr');
    if (l.erro) tr.classList.add('imp-row-erro');

    // Checkbox
    const tdChk = document.createElement('td');
    const chk   = document.createElement('input');
    chk.type    = 'checkbox';
    chk.className = 'chk-linha';
    chk.dataset.idx = l._idx;
    chk.checked = !l.erro; // Linhas com erro começam desmarcadas
    chk.addEventListener('change', () => atualizarChipsPreview());
    tdChk.appendChild(chk);

    // Data
    const tdData = document.createElement('td');
    tdData.textContent = l.data ? formatarData(l.data) : '—';

    // Descrição
    const tdDesc = document.createElement('td');
    tdDesc.textContent = l.descricao || '—';

    // Valor
    const tdVal = document.createElement('td');
    tdVal.style.textAlign = 'right';
    tdVal.style.fontWeight = '600';
    tdVal.textContent = isNaN(l.valor) ? '—' : formatarMoeda(l.valor);
    if (!isNaN(l.valor)) tdVal.style.color = 'var(--danger)';

    // Categoria (dropdown)
    const tdCat  = document.createElement('td');
    const selCat = document.createElement('select');
    selCat.className = 'sel-cat-linha select-input';
    selCat.style.fontSize = '.85rem';
    selCat.style.padding  = '.2rem .4rem';
    selCat.dataset.idx = l._idx;
    // Opção vazia
    const optVazio = document.createElement('option');
    optVazio.value = '';
    optVazio.textContent = '— sem categoria —';
    selCat.appendChild(optVazio);
    _categorias.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.emoji} ${c.nome}`;
      selCat.appendChild(opt);
    });
    selCat.value = l.categoriaId ?? '';
    selCat.addEventListener('change', (e) => {
      _linhas[l._idx].categoriaId = e.target.value;
      atualizarChipsPreview();
    });
    tdCat.appendChild(selCat);

    // Status
    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    if (l.erro) {
      tdStatus.innerHTML = `<span class="imp-badge imp-badge--erro" title="${l.erro}">⚠️</span>`;
    } else {
      tdStatus.innerHTML = `<span class="imp-badge imp-badge--ok">✓</span>`;
    }

    tr.append(tdChk, tdData, tdDesc, tdVal, tdCat, tdStatus);
    tbody.appendChild(tr);
  });

  document.getElementById('sec-preview').classList.remove('hidden');
  atualizarChipsPreview();
}

// ── Chips de preview ─────────────────────────────────────────
function atualizarChipsPreview() {
  const selecionadas = [...document.querySelectorAll('.chk-linha:checked')];
  const total = selecionadas.reduce((s, cb) => {
    const l = _linhas[parseInt(cb.dataset.idx)];
    return s + (isNaN(l.valor) ? 0 : l.valor);
  }, 0);
  const comErro = _linhas.filter(l => l.erro).length;

  document.getElementById('chip-lidas').textContent         = _linhas.length;
  document.getElementById('chip-selecionadas').textContent  = selecionadas.length;
  document.getElementById('chip-total-imp').textContent     = formatarMoeda(total);
  document.getElementById('btn-imp-count').textContent      = selecionadas.length;

  if (comErro > 0) {
    document.getElementById('chip-erros').textContent = comErro;
    document.getElementById('chip-erros-wrap').classList.remove('hidden');
  }
}

// ── Importação ────────────────────────────────────────────────
async function executarImportacao() {
  const selecionadas = [...document.querySelectorAll('.chk-linha:checked')].map(cb => parseInt(cb.dataset.idx));

  if (!selecionadas.length) {
    document.getElementById('imp-aviso-zero').classList.remove('hidden');
    return;
  }
  document.getElementById('imp-aviso-zero').classList.add('hidden');

  const btnImportar = document.getElementById('btn-importar');
  btnImportar.disabled    = true;
  btnImportar.textContent = 'Importando…';

  let sucesso = 0;
  let falha   = 0;

  for (const idx of selecionadas) {
    const l = _linhas[idx];
    // Pega categoriaId do dropdown (pode ter sido alterado pelo usuário)
    const selEl = document.querySelector(`.sel-cat-linha[data-idx="${idx}"]`);
    const catId = selEl?.value ?? l.categoriaId ?? '';

    try {
      const despesa = modelDespesa({
        descricao:   l.descricao,
        valor:       l.valor,
        categoriaId: catId,
        data:        l.data instanceof Date ? l.data : new Date(l.data),
        grupoId:     _grupoId,
        usuarioId:   _usuario.uid,
        origem:      'importacao',   // RF-013: rastreabilidade
        importadoEm: new Date(),
      });
      await criarDespesaDB(despesa);
      sucesso++;
    } catch {
      falha++;
    }
  }

  mostrarResultado(sucesso, falha);
}

// ── Resultado ─────────────────────────────────────────────────
function mostrarResultado(sucesso, falha) {
  document.getElementById('sec-preview').classList.add('hidden');
  document.getElementById('sec-upload').classList.add('hidden');

  const secRes  = document.getElementById('sec-resultado');
  const icon    = document.getElementById('resultado-icon');
  const titulo  = document.getElementById('resultado-titulo');
  const msg     = document.getElementById('resultado-msg');

  if (falha === 0) {
    icon.textContent  = '✅';
    titulo.textContent = 'Importação concluída com sucesso!';
    msg.textContent    = `${sucesso} despesa${sucesso !== 1 ? 's' : ''} importada${sucesso !== 1 ? 's' : ''} e já sincronizadas com o grupo.`;
  } else {
    icon.textContent   = '⚠️';
    titulo.textContent = 'Importação concluída com avisos';
    msg.textContent    = `${sucesso} importada${sucesso !== 1 ? 's' : ''} com sucesso. ${falha} falha${falha !== 1 ? 's' : ''} (verifique os dados e tente novamente).`;
  }

  secRes.classList.remove('hidden');
}

// ── Helpers de UI ─────────────────────────────────────────────
function mostrarArquivoSelecionado(nome) {
  document.getElementById('drop-area').classList.add('hidden');
  document.getElementById('arquivo-info').classList.remove('hidden');
  document.getElementById('arquivo-nome').textContent = nome;
}

function mostrarErroLeitura(msg) {
  const el = document.getElementById('erro-leitura');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function preencherSelCatLote() {
  const sel = document.getElementById('sel-cat-lote');
  if (!sel) return;
  sel.innerHTML = '<option value="">— manter individual —</option>' +
    _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
}

function atualizarDropdownsCategoria() {
  // Atualiza todos os dropdowns já renderizados na tabela
  document.querySelectorAll('.sel-cat-linha').forEach((sel) => {
    const idx  = parseInt(sel.dataset.idx);
    const atual = sel.value;
    sel.innerHTML = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
    sel.value = atual;
    // Tenta re-mapear se ainda não tem categoria
    if (!sel.value && _linhas[idx]?.categoriaHint) {
      sel.value = mapearCategoria(_linhas[idx].categoriaHint);
    }
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
