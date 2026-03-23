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
