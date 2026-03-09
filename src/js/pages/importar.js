// ============================================================
// PAGE: Importar — RF-013 + RF-014
// Importação de transações de cartão de crédito.
//
// FORMATOS SUPORTADOS:
//  • CSV do extrato bancário (separador ";")
//    Layout: Data;Estabelecimento;Portador;Valor;Parcela
//  • Excel (.xlsx) com o mesmo layout (template disponível)
//
// RF-014 — NOVAS FUNCIONALIDADES:
//  • Deduplicação: chave única por transação, evita duplicatas
//  • Projeção de parcelas: gera parcelas futuras (tipo='projecao')
//    automaticamente para compras parceladas
//  • Campo responsável: portador mapeado como responsável
// ============================================================

import { onAuthChange, logout }             from '../services/auth.js';
import { buscarPerfil, ouvirCategorias,
         criarDespesa as criarDespesaDB,
         excluirDespesa,
         buscarChavesDedup,
         buscarMapaProjecoes,
         buscarMapaCategorias }             from '../services/database.js';
import { modelDespesa }                     from '../models/Despesa.js';
import { formatarMoeda, formatarData }      from '../utils/formatters.js';

// ── Estado ───────────────────────────────────────────────────
let _usuario              = null;
let _grupoId              = null;
let _categorias           = [];
let _unsubCats            = null;
let _linhas               = [];
let _chavesExistentes     = new Set(); // RF-014: chaves já importadas
let _projecaoDocMap       = new Map(); // RF-051: chave_dedup → docId de projeções
let _mapaCategoriasHist   = {};        // RF-051: descricaoLow → categoriaId

// ── Inicialização ─────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = '../login.html'; return; }
  _usuario = user;
  let perfil;
  try {
    perfil = await buscarPerfil(user.uid);
  } catch (_err) {
    window.location.href = '../login.html';
    return;
  }
  if (!perfil?.grupoId) { window.location.href = '../grupo.html'; return; }
  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;

  // RF-014: pré-carrega chaves de deduplicação
  _chavesExistentes = await buscarChavesDedup(_grupoId);
  // RF-051: pré-carrega mapa de projeções e histórico de categorias
  _projecaoDocMap     = await buscarMapaProjecoes(_grupoId);
  _mapaCategoriasHist = await buscarMapaCategorias(_grupoId);

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
async function processarArquivo(file) {
  document.getElementById('erro-leitura').classList.add('hidden');

  const isCSV  = /\.csv$/i.test(file.name);
  const isXLSX = /\.(xlsx|xls)$/i.test(file.name);

  if (!isCSV && !isXLSX) {
    mostrarErroLeitura('Formato não suportado. Use o extrato CSV do banco ou o template Excel (.xlsx).');
    return;
  }

  if (isCSV) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rows  = parsearCSVTexto(e.target.result);
        _linhas     = parsearLinhasExtrato(rows);
        if (!_linhas.length) {
          mostrarErroLeitura('Nenhuma transação encontrada. Verifique se o arquivo está no formato correto.');
          return;
        }
        await marcarDuplicatas();
        mostrarArquivoSelecionado(file.name);
        renderizarPreview();
      } catch (err) { mostrarErroLeitura(`Erro ao ler o CSV: ${err.message}`); }
    };
    reader.readAsText(file, 'UTF-8');
    return;
  }

  // Excel via SheetJS
  const reader = new FileReader();
  reader.onload = async (e) => {
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
      await marcarDuplicatas();
      mostrarArquivoSelecionado(file.name);
      renderizarPreview();
    } catch (err) { mostrarErroLeitura(`Erro ao ler o Excel: ${err.message}`); }
  };
  reader.readAsArrayBuffer(file);
}

// ── RF-014 / RF-051: Marca duplicatas antes de exibir o preview ──
async function marcarDuplicatas() {
  // Recarrega os dados existentes no momento do upload
  _chavesExistentes = await buscarChavesDedup(_grupoId);
  _projecaoDocMap   = await buscarMapaProjecoes(_grupoId);
  _mapaCategoriasHist = await buscarMapaCategorias(_grupoId);

  _linhas.forEach((l) => {
    if (!l.chave_dedup || l.erro) return;
    if (_projecaoDocMap.has(l.chave_dedup)) {
      // RF-051: existe uma projeção para esta parcela — pode substituí-la pela real
      l.substitui_projecao = true;
      l.duplicado = false;
    } else if (_chavesExistentes.has(l.chave_dedup)) {
      l.duplicado = true;
    }
  });
}

// ── Parser CSV com separador ";" ─────────────────────────────
function parsearCSVTexto(content) {
  const texto = content.replace(/^\uFEFF/, '');
  return texto
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(l => l.split(';').map(c => c.trim()));
}

// ── Parser de linhas — layout do extrato bancário ─────────────
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
    if (!row?.some(c => c)) continue;

    const dataRaw  = String(row[idxData]     ?? '').trim();
    const estab    = String(row[idxEstab]    ?? '').trim();
    const portador = String(row[idxPortador] ?? '').trim();
    const valorRaw = String(row[idxValor]    ?? '').trim();
    const parcela  = idxParcela >= 0 ? String(row[idxParcela] ?? '').trim() : '-';

    if (!dataRaw && !estab && !valorRaw) continue;

    const estabLow = estab.toLowerCase();
    if (/pagamento de fatura|inclusao de pagamento|inclusão de pagamento|parcela de fatura rotativo/i.test(estabLow)) continue;

    const valor = normalizarValorXP(valorRaw);
    if (!isNaN(valor) && valor < 0) continue;

    const dataFmt = normalizarData(dataRaw);
    const erros   = [];
    if (!dataFmt)                   erros.push('Data inválida');
    if (!estab)                     erros.push('Estabelecimento vazio');
    if (isNaN(valor) || valor <= 0) erros.push('Valor inválido');

    const chave = (!erros.length)
      ? gerarChaveDedup(dataFmt, estab, valor, portador, parcela)
      : null;

    resultado.push({
      _idx:        resultado.length,
      data:        dataFmt,
      descricao:   estab,
      portador,
      parcela,
      valor,
      categoriaId: mapearCategoria(estab),
      erro:        erros.length ? erros.join(', ') : null,
      chave_dedup: chave,
      duplicado:   false,
    });
  }
  return resultado;
}

// ── RF-014: Gera chave de deduplicação ───────────────────────
// Compras parceladas: usa parcela no lugar da data → permite detectar
// projeções existentes quando o extrato real do mês chegar.
function gerarChaveDedup(data, estab, valor, portador, parcela) {
  if (!data || isNaN(valor)) return null;
  const estabNorm = String(estab ?? '').toLowerCase().trim()
    .replace(/\s+/g, ' ').substring(0, 50);
  const portNorm = String(portador ?? '').toLowerCase().trim().substring(0, 30);
  const parc     = parcela && String(parcela).trim() !== '-' ? String(parcela).trim() : null;

  if (parc) {
    // Ex: "lemon supermercado ltda||35.08||luigi filippozzi||02/06"
    return `${estabNorm}||${Number(valor).toFixed(2)}||${portNorm}||${parc}`;
  }
  const dataISO = (data instanceof Date ? data : new Date(data)).toISOString().slice(0, 10);
  return `${dataISO}||${estabNorm}||${Number(valor).toFixed(2)}||${portNorm}`;
}

// ── RF-014: Interpreta campo Parcela "02/06" ─────────────────
function parsearParcela(str) {
  if (!str || String(str).trim() === '-' || !String(str).trim()) return null;
  const m = String(str).trim().match(/^(\d+)\/(\d+)$/);
  if (!m) return null;
  const atual = parseInt(m[1], 10);
  const total = parseInt(m[2], 10);
  if (atual >= total || total <= 0 || atual <= 0) return null;
  return { atual, total };
}

// ── RF-014: Gera linhas de projeção para parcelas futuras ────
function gerarProjecoes(linha, parcelamentoId) {
  const info = parsearParcela(linha.parcela);
  if (!info) return [];

  const projecoes = [];
  for (let n = info.atual + 1; n <= info.total; n++) {
    const dataBase = linha.data instanceof Date ? linha.data : new Date(linha.data);
    const dataProj = new Date(dataBase);
    // Avança 1 mês por parcela
    dataProj.setMonth(dataProj.getMonth() + (n - info.atual));
    const parcelaStr = `${String(n).padStart(2, '0')}/${String(info.total).padStart(2, '0')}`;
    const chaveDedup = gerarChaveDedup(dataProj, linha.descricao, linha.valor, linha.portador, parcelaStr);

    projecoes.push({
      descricao:       linha.descricao,
      valor:           linha.valor,
      categoriaId:     linha.categoriaId ?? '',
      data:            dataProj,
      portador:        linha.portador    ?? '',
      responsavel:     linha.portador    ?? '',
      parcela:         parcelaStr,
      tipo:            'projecao',
      parcelamento_id: parcelamentoId,
      chave_dedup:     chaveDedup,
    });
  }
  return projecoes;
}

// ── Normalização valor XP: "R$ 1.290,00" → 1290.00 ──────────
function normalizarValorXP(val) {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  const s = String(val).trim()
    .replace(/R\$\s*/i, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(s);
}

// ── Normalização de data ──────────────────────────────────────
function normalizarData(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s  = String(val).trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(`${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T12:00:00`);
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(`${s}T12:00:00`);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ── Auto-mapeamento de categorias ────────────────────────────
function mapearCategoria(estab) {
  if (!estab || !_categorias.length) return '';

  // RF-051: prioriza correspondência exata com importações anteriores
  const chaveHist = estab.toLowerCase().trim();
  if (_mapaCategoriasHist[chaveHist]) {
    // Confirma que a categoria ainda existe no grupo
    const catExiste = _categorias.find(c => c.id === _mapaCategoriasHist[chaveHist]);
    if (catExiste) return _mapaCategoriasHist[chaveHist];
  }

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
    if (l.erro)              tr.classList.add('imp-row-erro');
    if (l.duplicado)         tr.classList.add('imp-row-dup');
    if (l.substitui_projecao) tr.classList.add('imp-row-subst');

    // Checkbox
    const tdChk = document.createElement('td');
    const chk   = document.createElement('input');
    chk.type = 'checkbox'; chk.className = 'chk-linha';
    chk.dataset.idx = l._idx;
    // Duplicatas e erros ficam desmarcados; "substitui projeção" fica marcado (é importação real)
    chk.checked = !l.erro && !l.duplicado;
    chk.addEventListener('change', () => atualizarChipsPreview());
    tdChk.appendChild(chk);

    // Data
    const tdData = criarTd(l.data ? formatarData(l.data) : '—');

    // Estabelecimento
    const tdEstab = criarTd(l.descricao || '—');

    // Portador (primeiros 2 nomes)
    const portCurto  = l.portador ? l.portador.split(' ').slice(0, 2).join(' ') : '—';
    const tdPortador = criarTd(portCurto, '.82rem', 'var(--text-muted)');

    // Parcela — destaca parcelados
    const parcelaInfo = parsearParcela(l.parcela);
    const tdParcela   = criarTd(l.parcela || '-', '.82rem',
      parcelaInfo ? '#1565c0' : 'var(--text-muted)');
    tdParcela.style.textAlign = 'center';
    if (parcelaInfo) tdParcela.style.fontWeight = '600';

    // Projeções que serão geradas
    if (parcelaInfo) {
      const qtdProj = parcelaInfo.total - parcelaInfo.atual;
      const tip = document.createElement('span');
      tip.className   = 'imp-badge-proj';
      tip.textContent = `+${qtdProj} parcela${qtdProj > 1 ? 's' : ''}`;
      tip.title       = `Gerará ${qtdProj} parcela(s) futura(s) projetada(s)`;
      tdParcela.appendChild(tip);
    }

    // Valor
    const tdVal = criarTd(isNaN(l.valor) ? '—' : formatarMoeda(l.valor));
    tdVal.style.textAlign = 'right'; tdVal.style.fontWeight = '600';
    if (!isNaN(l.valor)) tdVal.style.color = 'var(--danger)';

    // Categoria
    const tdCat  = document.createElement('td');
    const selCat = document.createElement('select');
    selCat.className     = 'sel-cat-linha select-input';
    selCat.style.cssText = 'font-size:.85rem;padding:.2rem .4rem;';
    selCat.dataset.idx   = l._idx;
    selCat.innerHTML     = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
    selCat.value = l.categoriaId ?? '';
    selCat.addEventListener('change', (e) => {
      _linhas[l._idx].categoriaId = e.target.value;
    });
    tdCat.appendChild(selCat);

    // Status
    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    if (l.substitui_projecao) {
      // RF-051: badge especial — substitui projeção pela despesa real
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--subst" title="Substitui parcela projetada pela despesa real — a projeção será removida">🔄 Real</span>';
    } else if (l.duplicado) {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--dup" title="Já importado anteriormente">🔄</span>';
    } else if (l.erro) {
      tdStatus.innerHTML = `<span class="imp-badge imp-badge--erro" title="${l.erro}">⚠️</span>`;
    } else {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--ok">✓</span>';
    }

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
  const sel      = [...document.querySelectorAll('.chk-linha:checked')];
  const total    = sel.reduce((s, cb) => s + (_linhas[+cb.dataset.idx]?.valor || 0), 0);
  const erros    = _linhas.filter(l => l.erro).length;
  const dups     = _linhas.filter(l => l.duplicado).length;
  const subst    = _linhas.filter(l => l.substitui_projecao).length;

  // Conta projeções que serão geradas
  const projTotal = sel.reduce((acc, cb) => {
    const info = parsearParcela(_linhas[+cb.dataset.idx]?.parcela);
    return acc + (info ? info.total - info.atual : 0);
  }, 0);

  document.getElementById('chip-lidas').textContent        = _linhas.length;
  document.getElementById('chip-selecionadas').textContent = sel.length;
  document.getElementById('chip-total-imp').textContent    = formatarMoeda(total);
  document.getElementById('btn-imp-count').textContent     = sel.length;

  // Chip de erros
  if (erros > 0) {
    document.getElementById('chip-erros').textContent = erros;
    document.getElementById('chip-erros-wrap').classList.remove('hidden');
  }
  // Chip de duplicatas
  const dupWrap = document.getElementById('chip-dup-wrap');
  if (dupWrap) {
    document.getElementById('chip-dup').textContent = dups;
    dupWrap.classList.toggle('hidden', dups === 0);
  }
  // Chip de projeções
  const projWrap = document.getElementById('chip-proj-wrap');
  if (projWrap) {
    document.getElementById('chip-proj').textContent = projTotal;
    projWrap.classList.toggle('hidden', projTotal === 0);
  }
}

// ── RF-014: Importação em lote com projeções ─────────────────
async function executarImportacao() {
  const idxs = [...document.querySelectorAll('.chk-linha:checked')].map(cb => +cb.dataset.idx);
  if (!idxs.length) {
    document.getElementById('imp-aviso-zero').classList.remove('hidden');
    return;
  }
  document.getElementById('imp-aviso-zero').classList.add('hidden');
  const btn = document.getElementById('btn-importar');
  btn.disabled = true; btn.textContent = 'Importando…';

  let sucesso = 0, falha = 0, projGeradas = 0;

  for (const idx of idxs) {
    const l      = _linhas[idx];
    const cat    = document.querySelector(`.sel-cat-linha[data-idx="${idx}"]`)?.value ?? l.categoriaId ?? '';
    const info   = parsearParcela(l.parcela);
    const parc_id = info ? crypto.randomUUID() : null;

    try {
      // RF-051: se esta parcela substitui uma projeção, remove a projeção antes de gravar
      if (l.substitui_projecao && l.chave_dedup && _projecaoDocMap.has(l.chave_dedup)) {
        const projecaoId = _projecaoDocMap.get(l.chave_dedup);
        await excluirDespesa(projecaoId);
        _projecaoDocMap.delete(l.chave_dedup); // evita tentar excluir duas vezes no mesmo lote
      }

      // Salva a despesa principal
      await criarDespesaDB(modelDespesa({
        descricao:       l.descricao,
        valor:           l.valor,
        categoriaId:     cat,
        data:            l.data instanceof Date ? l.data : new Date(l.data),
        grupoId:         _grupoId,
        usuarioId:       _usuario.uid,
        origem:          'importacao',
        portador:        l.portador      ?? '',
        responsavel:     l.portador      ?? '',
        parcela:         l.parcela       ?? '-',
        tipo:            'despesa',
        chave_dedup:     l.chave_dedup,
        parcelamento_id: parc_id,
        importadoEm:     new Date(),
      }));

      // RF-014: Gera e salva parcelas futuras projetadas
      if (info && parc_id) {
        const projecoes = gerarProjecoes({ ...l, categoriaId: cat }, parc_id);
        for (const p of projecoes) {
          // Pula se a projeção já existe (evita duplicar projeções)
          if (p.chave_dedup && _chavesExistentes.has(p.chave_dedup)) continue;
          await criarDespesaDB(modelDespesa({
            ...p,
            grupoId:     _grupoId,
            usuarioId:   _usuario.uid,
            origem:      'projecao',
            importadoEm: new Date(),
          }));
          _chavesExistentes.add(p.chave_dedup); // evita duplicar dentro do mesmo lote
          projGeradas++;
        }
      }
      sucesso++;
    } catch { falha++; }
  }
  mostrarResultado(sucesso, falha, projGeradas);
}

// ── Resultado ─────────────────────────────────────────────────
function mostrarResultado(sucesso, falha, projGeradas = 0) {
  document.getElementById('sec-preview').classList.add('hidden');
  document.getElementById('sec-upload').classList.add('hidden');
  const icon   = document.getElementById('resultado-icon');
  const titulo = document.getElementById('resultado-titulo');
  const msg    = document.getElementById('resultado-msg');
  const projEl = document.getElementById('resultado-proj');

  if (falha === 0) {
    icon.textContent   = '✅';
    titulo.textContent = 'Importação concluída com sucesso!';
    msg.textContent    = `${sucesso} despesa${sucesso !== 1 ? 's' : ''} importada${sucesso !== 1 ? 's' : ''} e sincronizadas com o grupo.`;
  } else {
    icon.textContent   = '⚠️';
    titulo.textContent = 'Importação concluída com avisos';
    msg.textContent    = `${sucesso} importada${sucesso !== 1 ? 's' : ''} com sucesso. ${falha} falha${falha !== 1 ? 's' : ''}.`;
  }
  if (projEl) {
    projEl.textContent = projGeradas > 0
      ? `💳 ${projGeradas} parcela${projGeradas !== 1 ? 's' : ''} futura${projGeradas !== 1 ? 's' : ''} projetada${projGeradas !== 1 ? 's' : ''} e visíveis no painel de parcelamentos.`
      : '';
    projEl.classList.toggle('hidden', projGeradas === 0);
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
