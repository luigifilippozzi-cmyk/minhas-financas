// ============================================================
// PAGE: Despesas — RF-005
// Registro, edição e exclusão de despesas.
//
// SINCRONIZAÇÃO BIDIRECIONAL:
//   Ambos os membros do grupo compartilham o mesmo grupoId.
//   Qualquer escrita (criar/editar/excluir) feita por um usuário
//   dispara o onSnapshot no outro dispositivo em tempo real,
//   sem necessidade de refresh.
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil } from '../services/database.js';
import { ouvirCategorias } from '../services/database.js';
import {
  iniciarListenerDespesas,
  salvarDespesa,
  deletarDespesa,
} from '../controllers/despesas.js';
import { formatarMoeda, formatarData, nomeMes } from '../utils/formatters.js';
import { dataHoje } from '../utils/helpers.js';

// ── Estado da página ──────────────────────────────────────────
let _usuario    = null;
let _perfil     = null;
let _grupoId    = null;
let _mes        = new Date().getMonth() + 1;  // 1-12
let _ano        = new Date().getFullYear();
let _despesas   = [];   // lista completa do mês (sem filtro)
let _categorias = [];   // lista de categorias ativas do grupo
let _catMap     = {};   // { [id]: categoria } — lookup rápido

// Listeners ativos
let _unsubDesp = null;
let _unsubCats = null;

// ID da despesa a excluir (para o modal de confirmação)
let _idParaExcluir = null;

// ── Inicialização ─────────────────────────────────────────────

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = '../login.html';
    return;
  }

  _usuario = user;
  _perfil  = await buscarPerfil(user.uid);

  if (!_perfil?.grupoId) {
    window.location.href = '../grupo.html';
    return;
  }

  _grupoId = _perfil.grupoId;
  document.getElementById('usuario-nome').textContent = _perfil.nome ?? user.email;

  configurarEventos();
  atualizarTituloMes();
  iniciarListeners();
});

// ── Listeners em tempo real ────────────────────────────────────

function iniciarListeners() {
  // Cancela listeners anteriores ao trocar de mês
  if (_unsubDesp) _unsubDesp();
  if (_unsubCats) _unsubCats();

  // Categorias: listener permanente (não depende do mês)
  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome));
    _catMap = Object.fromEntries(_categorias.map((c) => [c.id, c]));
    preencherSelectCategorias(_categorias);
    preencherFiltroCategorias(_categorias);
    renderizarLista(); // re-renderiza com os novos nomes/emojis
  });

  // Despesas do mês: listener em tempo real (bidirecional)
  // Quando qualquer membro do grupo criar, editar ou excluir uma despesa,
  // este callback é chamado automaticamente pelo Firestore.
  _unsubDesp = iniciarListenerDespesas(_grupoId, _mes, _ano, (despesas) => {
    _despesas = despesas;
    atualizarChips();
    renderizarLista();
  });
}

// ── Renderização ──────────────────────────────────────────────

function renderizarLista() {
  const lista       = document.getElementById('despesas-lista');
  if (!lista) return;

  const filtroTexto = (document.getElementById('filtro-texto')?.value ?? '').toLowerCase().trim();
  const filtroCat   = document.getElementById('filtro-categoria')?.value ?? '';

  // Aplica filtros locais (sem re-query ao Firestore)
  let filtradas = _despesas;
  if (filtroCat)   filtradas = filtradas.filter((d) => d.categoriaId === filtroCat);
  if (filtroTexto) filtradas = filtradas.filter((d) =>
    d.descricao.toLowerCase().includes(filtroTexto)
  );

  if (!filtradas.length) {
    lista.innerHTML = `<p class="empty-state">${
      _despesas.length
        ? 'Nenhuma despesa encontrada com os filtros aplicados.'
        : 'Nenhuma despesa registrada neste período.<br>Clique em <strong>+ Nova Despesa</strong> para começar.'
    }</p>`;
    return;
  }

  lista.innerHTML = filtradas.map((d) => {
    const cat    = _catMap[d.categoriaId];
    const emoji  = cat?.emoji ?? '❓';
    const nome   = cat?.nome  ?? '—';
    const cor    = cat?.cor   ?? '#6c757d';
    const badge  = `<span class="desp-cat-badge" style="background:${cor}22;color:${cor};">${emoji} ${nome}</span>`;
    const dataFmt = formatarData(d.data);

    return `
    <div class="desp-item card">
      <div class="desp-item-left">
        ${badge}
        <span class="desp-item-descricao">${d.descricao}</span>
        <span class="desp-item-data">${dataFmt}</span>
      </div>
      <div class="desp-item-right">
        <span class="desp-item-valor">${formatarMoeda(d.valor)}</span>
        <div class="desp-item-acoes">
          <button
            class="btn btn-sm btn-outline"
            onclick="window._despEditar('${d.id}')"
            title="Editar"
          >✏️</button>
          <button
            class="btn btn-sm btn-danger"
            onclick="window._despExcluir('${d.id}','${d.descricao.replace(/'/g, "\\'")}')"
            title="Excluir"
          >🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function atualizarChips() {
  const total = _despesas.reduce((s, d) => s + d.valor, 0);
  const chipTotal = document.getElementById('chip-total');
  const chipCount = document.getElementById('chip-count');
  if (chipTotal) chipTotal.textContent = formatarMoeda(total);
  if (chipCount) chipCount.textContent = _despesas.length;
}

function atualizarTituloMes() {
  const el = document.getElementById('titulo-mes');
  if (el) el.textContent = `${nomeMes(_mes)} ${_ano}`;
}

// ── Selects ───────────────────────────────────────────────────

function preencherSelectCategorias(cats) {
  const sel = document.getElementById('despesa-categoria');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione uma categoria</option>' +
    cats.map((c) => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (atual) sel.value = atual;
}

function preencherFiltroCategorias(cats) {
  const sel = document.getElementById('filtro-categoria');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map((c) => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Modal de Despesa ─────────────────────────────────────────

function abrirModalDespesa(despesa = null) {
  preencherSelectCategorias(_categorias);

  document.getElementById('despesa-id').value        = despesa?.id ?? '';
  document.getElementById('despesa-descricao').value = despesa?.descricao ?? '';
  document.getElementById('despesa-valor').value     = despesa?.valor ?? '';
  document.getElementById('despesa-categoria').value = despesa?.categoriaId ?? '';
  document.getElementById('despesa-data').value      = despesa
    ? (despesa.data?.toDate?.() ?? new Date(despesa.data)).toISOString().slice(0, 10)
    : dataHoje();

  document.getElementById('modal-despesa-titulo').textContent =
    despesa ? 'Editar Despesa' : 'Nova Despesa';
  document.getElementById('despesa-erro').classList.add('hidden');
  document.getElementById('btn-salvar-despesa').disabled = false;
  document.getElementById('btn-salvar-despesa').textContent = 'Salvar';
  document.getElementById('modal-despesa').classList.remove('hidden');
  document.getElementById('despesa-descricao').focus();
}

function fecharModalDespesa() {
  document.getElementById('modal-despesa').classList.add('hidden');
  document.getElementById('form-despesa').reset();
}

// ── Modal de Exclusão ─────────────────────────────────────────

function abrirModalExcluir(id, descricao) {
  _idParaExcluir = id;
  document.getElementById('excluir-descricao').textContent = `"${descricao}"`;
  document.getElementById('modal-excluir').classList.remove('hidden');
}

function fecharModalExcluir() {
  _idParaExcluir = null;
  document.getElementById('modal-excluir').classList.add('hidden');
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());

  // Nova despesa
  document.getElementById('btn-nova-despesa')?.addEventListener('click', () => {
    abrirModalDespesa();
  });

  // Fechar modal despesa
  document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModalDespesa);
  document.getElementById('btn-cancelar-despesa')?.addEventListener('click', fecharModalDespesa);
  document.querySelector('#modal-despesa .modal-backdrop')?.addEventListener('click', fecharModalDespesa);

  // Submit formulário despesa
  document.getElementById('form-despesa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl  = document.getElementById('despesa-erro');
    const btnSave = document.getElementById('btn-salvar-despesa');
    erroEl.classList.add('hidden');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando…';

    const dados = {
      descricao:   document.getElementById('despesa-descricao').value.trim(),
      valor:       parseFloat(document.getElementById('despesa-valor').value),
      categoriaId: document.getElementById('despesa-categoria').value,
      data:        new Date(document.getElementById('despesa-data').value + 'T12:00:00'),
    };
    const despesaId = document.getElementById('despesa-id').value || null;

    try {
      await salvarDespesa(dados, _grupoId, _usuario.uid, despesaId);
      fecharModalDespesa();
      // O listener onSnapshot atualiza a lista automaticamente
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.classList.remove('hidden');
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    }
  });

  // Fechar modal exclusão
  document.getElementById('btn-fechar-excluir')?.addEventListener('click', fecharModalExcluir);
  document.getElementById('btn-cancelar-excluir')?.addEventListener('click', fecharModalExcluir);
  document.querySelector('#modal-excluir .modal-backdrop')?.addEventListener('click', fecharModalExcluir);

  // Confirmar exclusão
  document.getElementById('btn-confirmar-excluir')?.addEventListener('click', async () => {
    if (!_idParaExcluir) return;
    const btn = document.getElementById('btn-confirmar-excluir');
    btn.disabled = true;
    btn.textContent = 'Excluindo…';
    try {
      await deletarDespesa(_idParaExcluir);
      fecharModalExcluir();
      // O listener onSnapshot remove o item da lista automaticamente
    } finally {
      btn.disabled = false;
      btn.textContent = 'Excluir';
    }
  });

  // Navegação de mês
  document.getElementById('btn-mes-ant')?.addEventListener('click', () => {
    if (_mes === 1) { _mes = 12; _ano--; }
    else { _mes--; }
    atualizarTituloMes();
    atualizarChips();
    iniciarListeners();
  });

  document.getElementById('btn-mes-prox')?.addEventListener('click', () => {
    if (_mes === 12) { _mes = 1; _ano++; }
    else { _mes++; }
    atualizarTituloMes();
    atualizarChips();
    iniciarListeners();
  });

  // Filtros locais (sem re-query)
  document.getElementById('filtro-texto')?.addEventListener('input', () => renderizarLista());
  document.getElementById('filtro-categoria')?.addEventListener('change', () => renderizarLista());
}

// ── Funções globais (chamadas pelos botões inline) ────────────
window._despEditar = (id) => {
  const despesa = _despesas.find((d) => d.id === id);
  if (despesa) abrirModalDespesa(despesa);
};

window._despExcluir = (id, descricao) => {
  abrirModalExcluir(id, descricao);
};
