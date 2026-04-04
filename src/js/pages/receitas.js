// ============================================================
// PAGE: Receitas — Gestão de receitas do grupo
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil, buscarGrupo } from '../services/database.js';
import {
  ouvirCategoriasReceita,
  ouvirReceitas,
  criarReceita,
  atualizarReceita,
  excluirReceita,
  garantirCategoriasReceita,
  ouvirContas,
  buscarChavesDedupReceitas,
} from '../services/database.js';
import { modelReceita, CATEGORIAS_RECEITA_PADRAO } from '../models/Receita.js';
import { formatarMoeda, formatarData, nomeMes } from '../utils/formatters.js';
import { dataHoje } from '../utils/helpers.js';

// ── Estado da página ──────────────────────────────────────────
let _usuario    = null;
let _grupoId    = null;
let _mes        = new Date().getMonth() + 1;
let _ano        = new Date().getFullYear();
let _receitas   = [];
let _categorias = [];
let _catMap     = {};
let _editandoId = null;   // null = nova receita; string = editar existente
let _excluindoId = null;

let _unsubRec     = null;
let _unsubCatRec  = null;

// ── Estado: Importação ────────────────────────────────────────
let _contas       = [];   // NRF-004
let _contaMap     = {};
let _unsubContas  = null;
let _linhasRec    = [];   // linhas lidas do arquivo
let _chavesRec    = new Set(); // chaves de dedup de receitas

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

  await garantirCategoriasReceita(_grupoId, CATEGORIAS_RECEITA_PADRAO).catch(() => {});

  // NRF-004: listener de contas para o import
  _unsubContas = ouvirContas(_grupoId, (contas) => {
    _contas   = contas.sort((a, b) => a.nome.localeCompare(b.nome));
    _contaMap = Object.fromEntries(_contas.map((c) => [c.id, c]));
    _preencherSelectsContasRec();
  });

  atualizarTituloMes();
  configurarEventos();
  iniciarListeners();
});

// ── Listeners ─────────────────────────────────────────────────
function iniciarListeners() {
  if (_unsubRec)    _unsubRec();
  if (_unsubCatRec) _unsubCatRec();

  _unsubCatRec = ouvirCategoriasReceita(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome));
    _catMap     = Object.fromEntries(_categorias.map((c) => [c.id, c]));
    preencherSelectCategorias();
  });

  _unsubRec = ouvirReceitas(_grupoId, _mes, _ano, (recs) => {
    _receitas = recs;
    renderizarLista();
    atualizarChips();
  });
}

// ── Renderização da Lista ──────────────────────────────────────
function renderizarLista() {
  const container = document.getElementById('rec-lista');
  if (!container) return;

  if (!_receitas.length) {
    container.innerHTML = '<p class="empty-state">Nenhuma receita registrada neste mês.</p>';
    return;
  }

  // Ordena por data desc
  const sorted = [..._receitas].sort((a, b) => {
    const da = a.data?.toDate?.() ?? new Date(a.data);
    const db = b.data?.toDate?.() ?? new Date(b.data);
    return db - da;
  });

  container.innerHTML = sorted.map((r) => {
    const cat    = _catMap[r.categoriaId] ?? {};
    const emoji  = cat.emoji ?? '💰';
    const catNome = cat.nome  ?? '—';
    const d      = r.data?.toDate?.() ?? new Date(r.data);
    const dataFmt = formatarData(d);

    return `
      <div class="rec-item">
        <span class="rec-item-emoji">${emoji}</span>
        <div class="rec-item-info">
          <div class="rec-item-desc">${r.descricao || catNome}</div>
          <div class="rec-item-meta">${catNome} &middot; ${dataFmt}</div>
        </div>
        <span class="rec-item-valor">${formatarMoeda(r.valor ?? 0)}</span>
        <div class="rec-item-acoes">
          <button class="btn btn-outline btn-sm" onclick="editarReceita('${r.id}')">✏️</button>
          <button class="btn btn-danger  btn-sm" onclick="confirmarExclusaoReceita('${r.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function atualizarChips() {
  const total = _receitas.reduce((s, r) => s + (r.valor ?? 0), 0);
  const el = document.getElementById('chip-total-rec');
  if (el) el.textContent = formatarMoeda(total);
  const cnt = document.getElementById('chip-count-rec');
  if (cnt) cnt.textContent = String(_receitas.length);
}

// ── Modal ──────────────────────────────────────────────────────
function abrirModal(receita = null) {
  _editandoId = receita?.id ?? null;
  const titulo = document.getElementById('modal-rec-titulo');
  if (titulo) titulo.textContent = receita ? 'Editar Receita' : 'Nova Receita';

  document.getElementById('rec-descricao').value = receita?.descricao ?? '';
  document.getElementById('rec-valor').value     = receita?.valor     ?? '';

  // Data
  const dataEl = document.getElementById('rec-data');
  if (receita?.data) {
    const d = receita.data.toDate?.() ?? new Date(receita.data);
    dataEl.value = d.toISOString().slice(0, 10);
  } else {
    dataEl.value = dataHoje();
  }

  // Categoria
  const selCat = document.getElementById('rec-categoria');
  preencherSelectCategorias();
  if (receita?.categoriaId) selCat.value = receita.categoriaId;

  document.getElementById('modal-receita').style.display = 'flex';
  document.getElementById('rec-descricao').focus();
}

function fecharModal() {
  document.getElementById('modal-receita').style.display = 'none';
  document.getElementById('form-receita').reset();
  _editandoId = null;
}

function preencherSelectCategorias() {
  const sel = document.getElementById('rec-categoria');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione uma categoria</option>' +
    _categorias.map((c) => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Salvar ─────────────────────────────────────────────────────
async function salvarReceita(e) {
  e.preventDefault();

  const descricao   = document.getElementById('rec-descricao').value.trim();
  const valorRaw    = parseFloat(document.getElementById('rec-valor').value);
  const categoriaId = document.getElementById('rec-categoria').value;
  const dataVal     = document.getElementById('rec-data').value;

  if (!descricao)           { alert('Informe uma descrição.');   return; }
  if (!valorRaw || valorRaw <= 0) { alert('Informe um valor válido.'); return; }
  if (!dataVal)             { alert('Informe a data.');           return; }

  const dados = {
    grupoId:     _grupoId,
    usuarioId:   _usuario.uid,
    descricao,
    valor:       valorRaw,
    categoriaId: categoriaId || '',
    data:        new Date(dataVal + 'T12:00:00'),
  };

  const btnSalvar = document.getElementById('btn-salvar-rec');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando…';

  try {
    const rec = modelReceita(dados);
    if (_editandoId) {
      await atualizarReceita(_editandoId, rec);
    } else {
      await criarReceita(rec);
    }
    fecharModal();
  } catch (err) {
    console.error('[receitas] Erro ao salvar:', err);
    alert('Erro ao salvar receita. Tente novamente.');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';
  }
}

// ── Exclusão ───────────────────────────────────────────────────
function abrirConfirmarExclusao(id) {
  _excluindoId = id;
  document.getElementById('modal-confirmar-rec').style.display = 'flex';
}

function fecharConfirmarExclusao() {
  _excluindoId = null;
  document.getElementById('modal-confirmar-rec').style.display = 'none';
}

async function executarExclusao() {
  if (!_excluindoId) return;
  try {
    await excluirReceita(_excluindoId);
  } catch (err) {
    console.error('[receitas] Erro ao excluir:', err);
    alert('Erro ao excluir receita.');
  }
  fecharConfirmarExclusao();
}

// ── Navegação de mês ───────────────────────────────────────────
function atualizarTituloMes() {
  const el = document.getElementById('titulo-mes');
  if (el) el.textContent = `${nomeMes(_mes)} ${_ano}`;
}

function irMesAnterior() {
  if (_mes === 1) { _mes = 12; _ano--; } else { _mes--; }
  atualizarTituloMes();
  iniciarListeners();
}

function irMesProximo() {
  if (_mes === 12) { _mes = 1; _ano++; } else { _mes++; }
  atualizarTituloMes();
  iniciarListeners();
}

// ── Eventos ────────────────────────────────────────────────────
function configurarEventos() {
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());
  document.getElementById('btn-nova-receita')?.addEventListener('click', () => abrirModal());
  document.getElementById('btn-fechar-modal-rec')?.addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar-rec')?.addEventListener('click', fecharModal);
  document.getElementById('form-receita')?.addEventListener('submit', salvarReceita);

  document.getElementById('btn-fechar-confirm-rec')?.addEventListener('click', fecharConfirmarExclusao);
  document.getElementById('btn-cancelar-del-rec')?.addEventListener('click', fecharConfirmarExclusao);
  document.getElementById('btn-confirmar-del-rec')?.addEventListener('click', executarExclusao);

  document.getElementById('btn-mes-ant')?.addEventListener('click', irMesAnterior);
  document.getElementById('btn-mes-prox')?.addEventListener('click', irMesProximo);

  // ── Importação de Receitas ────────────────────────────────
  document.getElementById('btn-importar-receitas')?.addEventListener('click', () => {
    document.getElementById('sec-import-rec')?.classList.toggle('hidden');
  });
  document.getElementById('btn-fechar-import-rec')?.addEventListener('click', () => {
    document.getElementById('sec-import-rec')?.classList.add('hidden');
    _resetarImportRec();
  });
  document.getElementById('btn-baixar-template-rec')?.addEventListener('click', _gerarTemplateRec);

  // Upload
  const fileInputRec = document.getElementById('file-input-rec');
  const dropAreaRec  = document.getElementById('drop-area-rec');
  fileInputRec?.addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) _processarArquivoRec(f); });
  dropAreaRec?.addEventListener('dragover',  (e) => { e.preventDefault(); dropAreaRec.classList.add('imp-drop-area--over'); });
  dropAreaRec?.addEventListener('dragleave', () => dropAreaRec.classList.remove('imp-drop-area--over'));
  dropAreaRec?.addEventListener('drop', (e) => {
    e.preventDefault(); dropAreaRec.classList.remove('imp-drop-area--over');
    const f = e.dataTransfer.files?.[0]; if (f) _processarArquivoRec(f);
  });
  document.getElementById('btn-trocar-arquivo-rec')?.addEventListener('click', _resetarUploadRec);

  // Seleção em lote
  document.getElementById('chk-all-rec')?.addEventListener('change', (e) => {
    document.querySelectorAll('.chk-linha-rec').forEach((cb) => { cb.checked = e.target.checked; });
    _atualizarChipsRec();
  });
  document.getElementById('btn-sel-todos-rec')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-linha-rec').forEach((cb) => { cb.checked = true; });
    document.getElementById('chk-all-rec').checked = true;
    _atualizarChipsRec();
  });
  document.getElementById('btn-desel-todos-rec')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-linha-rec').forEach((cb) => { cb.checked = false; });
    document.getElementById('chk-all-rec').checked = false;
    _atualizarChipsRec();
  });
  document.getElementById('sel-cat-lote-rec')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    document.querySelectorAll('.sel-cat-linha-rec').forEach((sel) => { sel.value = e.target.value; });
    _atualizarChipsRec();
  });
  document.getElementById('sel-conta-lote-rec')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    document.querySelectorAll('.sel-conta-linha-rec').forEach((sel) => {
      sel.value = e.target.value;
      _linhasRec[+sel.dataset.idx].contaId = e.target.value;
    });
  });
  document.getElementById('sel-conta-global-rec')?.addEventListener('change', (e) => {
    document.querySelectorAll('.sel-conta-linha-rec').forEach((sel) => {
      sel.value = e.target.value;
      _linhasRec[+sel.dataset.idx].contaId = e.target.value;
    });
  });
  document.getElementById('btn-importar-rec')?.addEventListener('click', _executarImportacaoRec);
  document.getElementById('btn-nova-importacao-rec')?.addEventListener('click', _resetarImportRec);

  // Fecha modal ao clicar no overlay
  document.getElementById('modal-receita')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) fecharModal();
  });
  document.getElementById('modal-confirmar-rec')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) fecharConfirmarExclusao();
  });
}

// ── Funções expostas para botões inline ───────────────────────
window.editarReceita = (id) => {
  const r = _receitas.find((r) => r.id === id);
  if (r) abrirModal(r);
};

window.confirmarExclusaoReceita = (id) => {
  abrirConfirmarExclusao(id);
};

// ============================================================
// IMPORTAÇÃO DE RECEITAS
// Características:
//  • Colunas: Data, Descrição, Valor, Categoria (opt), Conta (opt)
//  • Sem portador, parcelas ou projeções futuras
//  • Sem isConjunta / valorAlocado
//  • Dedup simples: data + descricao + valor
//  • Categorias do tipo 'receita', não de despesa
//  • NRF-004: contaId por linha
// ============================================================

// ── Geração de template xlsx via SheetJS ──────────────────────
function _gerarTemplateRec() {
  if (typeof XLSX === 'undefined') { alert('SheetJS não carregado.'); return; }
  const wb = XLSX.utils.book_new();
  // Aba Receitas
  const dados = [
    ['Data',       'Descricao',      'Valor', 'Categoria',    'Conta'        ],
    ['25/03/2026', 'Salário março',  8500.00, 'Salário',      'Banco Itaú'   ],
    ['25/03/2026', 'Renda extra',     500.00, 'Freelance',    'Banco XP'     ],
    ['01/03/2026', 'Dividendos',      320.00, 'Rendimentos',  'Banco BTG'    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(dados);
  ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Receitas');
  // Aba instruções
  const wsInst = XLSX.utils.aoa_to_sheet([
    ['Campo',       'Obrigatório', 'Descrição'],
    ['Data',        'Sim',         'Formato DD/MM/YYYY ou YYYY-MM-DD'],
    ['Descricao',   'Sim',         'Descrição da receita'],
    ['Valor',       'Sim',         'Valor numérico positivo (ex: 8500.00)'],
    ['Categoria',   'Não',         'Nome da categoria — se não informado fica sem categoria'],
    ['Conta',       'Não',         'Nome do banco/conta — se não informado fica sem conta'],
  ]);
  wsInst['!cols'] = [{ wch: 14 }, { wch: 13 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções');
  XLSX.writeFile(wb, 'template-receitas.xlsx');
}

// ── Parser de arquivo (CSV ou XLSX) ──────────────────────────
async function _processarArquivoRec(file) {
  document.getElementById('erro-leitura-rec').classList.add('hidden');
  const isCSV  = /\.csv$/i.test(file.name);
  const isXLSX = /\.(xlsx|xls)$/i.test(file.name);
  if (!isCSV && !isXLSX) {
    _mostrarErroRec('Formato não suportado. Use o template Excel (.xlsx) ou CSV.');
    return;
  }
  // Carrega chaves de dedup da coleção receitas (corrigido: busca em receitas, não despesas)
  _chavesRec = await buscarChavesDedupReceitas(_grupoId).catch(() => new Set());

  const _parse = (rows) => {
    _linhasRec = _parsearLinhasRec(rows);
    if (!_linhasRec.length) { _mostrarErroRec('Nenhuma receita encontrada no arquivo.'); return; }
    _mostrarArquivoRec(file.name);
    _renderizarPreviewRec();
  };

  if (isCSV) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const texto = e.target.result.replace(/^\uFEFF/, '');
        const rows  = texto.split(/\r?\n/).filter(l => l.trim()).map(l => l.split(';').map(c => c.trim()));
        _parse(rows);
      } catch (err) { _mostrarErroRec('Erro ao ler o CSV: ' + err.message); }
    };
    reader.readAsText(file, 'UTF-8');
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
        const name = wb.SheetNames.find(n => /receit/i.test(n)) ?? wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, dateNF: 'DD/MM/YYYY' });
        _parse(rows);
      } catch (err) { _mostrarErroRec('Erro ao ler o Excel: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }
}

// ── Parse das linhas do extrato ───────────────────────────────
function _parsearLinhasRec(rows) {
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
    const dataRaw  = String(row[idxData]  ?? '').trim();
    const desc     = String(row[idxDesc]  ?? '').trim();
    const valorRaw = String(row[idxValor] ?? '').trim();
    const catNome  = idxCat   >= 0 ? String(row[idxCat]   ?? '').trim() : '';
    const contaNome = idxConta >= 0 ? String(row[idxConta] ?? '').trim() : '';
    if (!dataRaw && !desc && !valorRaw) continue;
    const valor = _normalizarValorRec(valorRaw);
    const data  = _normalizarDataRec(dataRaw);
    const erros = [];
    if (!data)                         erros.push('Data inválida');
    if (!desc)                         erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0)    erros.push('Valor inválido');
    // Resolve categoria por nome (match case-insensitive)
    const catObj  = catNome ? _categorias.find(c => c.nome.toLowerCase().includes(catNome.toLowerCase()) || catNome.toLowerCase().includes(c.nome.toLowerCase())) : null;
    const catId   = catObj?.id ?? '';
    // Resolve conta por nome (normalização de acentos para cobrir "Itau" → "Banco Itaú")
    const _norm      = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const contaNomeN = _norm(contaNome);
    const contaObj   = contaNome ? _contas.find(c => {
      const n = _norm(c.nome);
      return n.includes(contaNomeN) || contaNomeN.includes(n);
    }) : null;
    // Prioridade: coluna Conta → inferência pelo valor da coluna → inferência pela descrição → seletor global
    const contaId = contaObj?.id
      || _inferirContaDaDescricao(contaNome, _contas)
      || _inferirContaDaDescricao(desc, _contas)
      || (document.getElementById('sel-conta-global-rec')?.value ?? '');
    const chave    = erros.length ? null : _chaveDedup(data, desc, valor);
    const duplicado = chave ? _chavesRec.has(chave) : false;
    resultado.push({ _idx: resultado.length, data, descricao: desc, valor, categoriaId: catId, contaId, chave_dedup: chave, duplicado, erro: erros.length ? erros.join(', ') : null });
  }
  return resultado;
}

// ── NRF-004: Infere conta/banco a partir de palavras-chave na descrição ─────
function _inferirContaDaDescricao(descricao, contas) {
  if (!descricao || !contas.length) return '';
  const d = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Match direto contra nomes das contas do grupo
  for (const c of contas) {
    const palavras = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
    if (palavras.some(p => p.length > 3 && d.includes(p))) return c.id;
  }

  // 2. Mapa de palavras-chave → trecho do nome da conta
  const BANCO_KEYWORDS = [
    { keys: ['itau', 'itaú'],                              conta: 'itaú'       },
    { keys: ['bradesco'],                                  conta: 'bradesco'   },
    { keys: ['santander'],                                 conta: 'santander'  },
    { keys: ['btg'],                                       conta: 'btg'        },
    { keys: ['xp invest', 'xpinvest', 'xp corret', 'xp pagamento'], conta: 'xp' },
    { keys: ['nubank', 'nu pagamento', 'nu financ'],       conta: 'nubank'     },
    { keys: ['banco inter', 'inter pagamento'],            conta: 'inter'      },
    { keys: ['c6 bank', 'c6bank', 'c6 pagamento'],         conta: 'c6'         },
    { keys: ['caixa eco', 'cef ', 'cx eco'],               conta: 'caixa'      },
    { keys: ['banco do brasil', 'bb seg', 'bb pag'],       conta: 'brasil'     },
    { keys: ['sicoob', 'sicredi'],                         conta: 'sicoob'     },
    { keys: ['original'],                                  conta: 'original'   },
    { keys: ['next bank', 'next pag'],                     conta: 'next'       },
    { keys: ['neon'],                                      conta: 'neon'       },
    { keys: ['picpay'],                                    conta: 'picpay'     },
    { keys: ['mercado pago', 'mercadopago'],               conta: 'mercado'    },
    { keys: ['facilcred'],                                 conta: 'facilcred'  },
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

function _normalizarValorRec(val) {
  if (!val && val !== 0) return NaN;
  if (typeof val === 'number') return Math.abs(val); // aceita negativos (extrato bancário)
  const s = String(val).trim().replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
  return Math.abs(parseFloat(s));
}

function _normalizarDataRec(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s  = String(val).trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(`${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T12:00:00`);
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(s + 'T12:00:00');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function _chaveDedup(data, desc, valor) {
  if (!data || isNaN(valor)) return null;
  const iso  = (data instanceof Date ? data : new Date(data)).toISOString().slice(0, 10);
  const norm = String(desc).toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 60);
  return `rec||${iso}||${norm}||${Number(valor).toFixed(2)}`;
}

// ── Renderização da tabela de preview ────────────────────────
function _renderizarPreviewRec() {
  const tbody = document.getElementById('tbody-preview-rec');
  if (!tbody) return;
  tbody.innerHTML = '';

  _linhasRec.forEach((l) => {
    const tr = document.createElement('tr');
    if (l.erro)      tr.classList.add('imp-row-erro');
    if (l.duplicado) tr.classList.add('imp-row-dup');

    // Checkbox
    const tdChk = document.createElement('td');
    const chk   = document.createElement('input');
    chk.type = 'checkbox'; chk.className = 'chk-linha-rec'; chk.dataset.idx = l._idx;
    chk.checked = !l.erro && !l.duplicado;
    chk.addEventListener('change', () => _atualizarChipsRec());
    tdChk.appendChild(chk);

    // Data
    const tdData = document.createElement('td');
    tdData.textContent = l.data ? formatarData(l.data) : '—';

    // Descrição
    const tdDesc = document.createElement('td');
    tdDesc.textContent = l.descricao || '—';

    // Valor — positivo (receita)
    const tdVal = document.createElement('td');
    tdVal.textContent = isNaN(l.valor) ? '—' : formatarMoeda(l.valor);
    tdVal.style.cssText = 'text-align:right;font-weight:600;color:var(--color-income-dark);';

    // Categoria (receita)
    const tdCat  = document.createElement('td');
    const selCat = document.createElement('select');
    selCat.className = 'sel-cat-linha-rec select-input';
    selCat.style.cssText = 'font-size:.85rem;padding:.2rem .4rem;';
    selCat.dataset.idx = l._idx;
    selCat.innerHTML = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
    selCat.value = l.categoriaId ?? '';
    selCat.addEventListener('change', (e) => { _linhasRec[l._idx].categoriaId = e.target.value; });
    tdCat.appendChild(selCat);

    // Conta / Banco (NRF-004)
    const tdConta  = document.createElement('td');
    const selConta = document.createElement('select');
    selConta.className = 'sel-conta-linha-rec select-input';
    selConta.style.cssText = 'font-size:.85rem;padding:.2rem .4rem;';
    selConta.dataset.idx = l._idx;
    selConta.innerHTML = '<option value="">— sem conta —</option>' +
      _contas.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
    const contaGlobal = document.getElementById('sel-conta-global-rec')?.value ?? '';
    selConta.value = l.contaId || contaGlobal;
    if (selConta.value) _linhasRec[l._idx].contaId = selConta.value;
    selConta.addEventListener('change', (e) => { _linhasRec[l._idx].contaId = e.target.value; });
    tdConta.appendChild(selConta);

    // Status
    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    if (l.duplicado) {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--dup" title="Já importado">🔄</span>';
    } else if (l.erro) {
      tdStatus.innerHTML = `<span class="imp-badge imp-badge--erro" title="${l.erro}">⚠️</span>`;
    } else {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--ok">✓</span>';
    }

    tr.append(tdChk, tdData, tdDesc, tdVal, tdCat, tdConta, tdStatus);
    tbody.appendChild(tr);
  });

  document.getElementById('sec-preview-rec')?.classList.remove('hidden');
  document.getElementById('sec-resultado-rec')?.classList.add('hidden');
  _preencherLoteCatRec();
  _preencherSelectsContasRec();
  _atualizarChipsRec();
}

// ── Chips de resumo do preview ────────────────────────────────
function _atualizarChipsRec() {
  const sels    = [...document.querySelectorAll('.chk-linha-rec:checked')];
  const total   = sels.reduce((s, cb) => s + (_linhasRec[+cb.dataset.idx]?.valor || 0), 0);
  const erros   = _linhasRec.filter(l => l.erro).length;
  const dups    = _linhasRec.filter(l => l.duplicado).length;
  const selCount = sels.length;
  document.getElementById('chip-lidas-rec').textContent    = _linhasRec.length;
  document.getElementById('chip-sel-rec').textContent      = selCount;
  document.getElementById('chip-total-imp-rec').textContent = formatarMoeda(total);
  document.getElementById('btn-imp-count-rec').textContent  = selCount;
  const dupWrap = document.getElementById('chip-dup-rec-wrap');
  if (dupWrap) { document.getElementById('chip-dup-rec').textContent = dups; dupWrap.classList.toggle('hidden', dups === 0); }
  const errWrap = document.getElementById('chip-erro-rec-wrap');
  if (errWrap) { document.getElementById('chip-erro-rec').textContent = erros; errWrap.classList.toggle('hidden', erros === 0); }
}

// ── Importação em lote ────────────────────────────────────────
async function _executarImportacaoRec() {
  const idxs = [...document.querySelectorAll('.chk-linha-rec:checked')].map(cb => +cb.dataset.idx);
  if (!idxs.length) { document.getElementById('imp-aviso-zero-rec').classList.remove('hidden'); return; }
  document.getElementById('imp-aviso-zero-rec').classList.add('hidden');
  const btn = document.getElementById('btn-importar-rec');
  btn.disabled = true; btn.textContent = 'Importando…';
  let sucesso = 0, falha = 0;
  for (const idx of idxs) {
    const l      = _linhasRec[idx];
    const cat    = document.querySelector(`.sel-cat-linha-rec[data-idx="${idx}"]`)?.value ?? l.categoriaId ?? '';
    const contaId = document.querySelector(`.sel-conta-linha-rec[data-idx="${idx}"]`)?.value || l.contaId || undefined;
    try {
      const rec = {
        grupoId:     _grupoId,
        usuarioId:   _usuario.uid,
        descricao:   l.descricao,
        valor:       l.valor,
        categoriaId: cat,
        data:        l.data instanceof Date ? l.data : new Date(l.data),
        origem:      'importacao',
        importadoEm: new Date(),
        chave_dedup: l.chave_dedup,
      };
      if (contaId) rec.contaId = contaId;
      await criarReceita(rec);
      if (l.chave_dedup) _chavesRec.add(l.chave_dedup);
      sucesso++;
    } catch { falha++; }
  }
  btn.disabled = false; btn.textContent = `📥 Importar ${idxs.length} receitas`;
  _mostrarResultadoRec(sucesso, falha);
}

// ── Helpers de UI ─────────────────────────────────────────────
function _mostrarArquivoRec(nome) {
  document.getElementById('drop-area-rec')?.classList.add('hidden');
  document.getElementById('arquivo-info-rec')?.classList.remove('hidden');
  document.getElementById('arquivo-nome-rec').textContent = nome;
}

function _mostrarErroRec(msg) {
  const el = document.getElementById('erro-leitura-rec');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function _mostrarResultadoRec(sucesso, falha) {
  document.getElementById('sec-preview-rec')?.classList.add('hidden');
  const icon   = document.getElementById('resultado-icon-rec');
  const titulo = document.getElementById('resultado-titulo-rec');
  const msg    = document.getElementById('resultado-msg-rec');
  if (falha === 0) {
    if (icon)   icon.textContent   = '✅';
    if (titulo) titulo.textContent = 'Importação concluída!';
    if (msg)    msg.textContent    = `${sucesso} receita${sucesso !== 1 ? 's' : ''} importada${sucesso !== 1 ? 's' : ''} e sincronizada${sucesso !== 1 ? 's' : ''} com o grupo.`;
  } else {
    if (icon)   icon.textContent   = '⚠️';
    if (titulo) titulo.textContent = 'Importação concluída com avisos';
    if (msg)    msg.textContent    = `${sucesso} importada${sucesso !== 1 ? 's' : ''}. ${falha} falha${falha !== 1 ? 's' : ''}.`;
  }
  document.getElementById('sec-resultado-rec')?.classList.remove('hidden');
}

function _resetarUploadRec() {
  document.getElementById('file-input-rec').value = '';
  document.getElementById('drop-area-rec')?.classList.remove('hidden');
  document.getElementById('arquivo-info-rec')?.classList.add('hidden');
  document.getElementById('erro-leitura-rec')?.classList.add('hidden');
  document.getElementById('sec-preview-rec')?.classList.add('hidden');
  _linhasRec = [];
}

function _resetarImportRec() {
  _resetarUploadRec();
  document.getElementById('sec-resultado-rec')?.classList.add('hidden');
  document.getElementById('tbody-preview-rec').innerHTML = '';
}

function _preencherLoteCatRec() {
  const sel = document.getElementById('sel-cat-lote-rec');
  if (!sel) return;
  const v = sel.value;
  sel.innerHTML = '<option value="">— manter individual —</option>' +
    _categorias.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  sel.value = v;
}

function _preencherSelectsContasRec() {
  const optStr = '<option value="">— sem conta —</option>' +
    _contas.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  const optLote = '<option value="">— manter individual —</option>' +
    _contas.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  const selGlobal = document.getElementById('sel-conta-global-rec');
  if (selGlobal) { const v = selGlobal.value; selGlobal.innerHTML = optStr; selGlobal.value = v; }
  const selLote = document.getElementById('sel-conta-lote-rec');
  if (selLote) { const v = selLote.value; selLote.innerHTML = optLote; selLote.value = v; }
  document.querySelectorAll('.sel-conta-linha-rec').forEach((sel) => {
    const idx = +sel.dataset.idx, v = sel.value;
    sel.innerHTML = optStr;
    sel.value = v || _linhasRec[idx]?.contaId || '';
  });
}
