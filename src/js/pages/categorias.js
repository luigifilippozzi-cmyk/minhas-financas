// ============================================================
// PAGE: categorias.js — RF-003
// Gerenciamento de Categorias com sync em tempo real.
// Ambos os membros do grupo podem criar, editar e desativar.
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil } from '../services/database.js';
import { ouvirCategorias } from '../services/database.js';
import { salvarCategoria, desativarCategoria } from '../controllers/categorias.js';

// ── Estado ────────────────────────────────────────────────────
let _grupoId    = null;
let _categorias = [];
let _unsubscribe = null;

// ── Bootstrap ─────────────────────────────────────────────────

onAuthChange(async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  let perfil;
  try {
    perfil = await buscarPerfil(user.uid);
  } catch (_err) {
    window.location.href = 'login.html';
    return;
  }
  if (!perfil?.grupoId) { window.location.href = 'grupo.html'; return; }

  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;

  iniciarApp();
  configurarEventos();
});

// ── App ───────────────────────────────────────────────────────

function iniciarApp() {
  // Cancela listener anterior (caso reiniciado)
  if (_unsubscribe) _unsubscribe();

  // Listener em tempo real — atualiza para AMBOS os membros do grupo
  _unsubscribe = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats;
    renderizarLista(cats);
  });
}

// ── Renderização ──────────────────────────────────────────────

function renderizarLista(cats) {
  const lista = document.getElementById('categorias-lista');

  if (!cats.length) {
    lista.innerHTML = `<p class="empty-state">Nenhuma categoria ativa. Crie a primeira!</p>`;
    return;
  }

  lista.innerHTML = cats
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((cat) => `
      <div class="cat-item" data-id="${cat.id}">
        <div class="cat-item-left">
          <span class="cat-item-emoji">${cat.emoji}</span>
          <div class="cat-item-info">
            <span class="cat-item-nome">${cat.nome}</span>
            <span class="cat-item-orcamento">
              ${cat.orcamentoMensal > 0
                ? `Limite: R$ ${Number(cat.orcamentoMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Sem limite definido'}
            </span>
          </div>
        </div>
        <div class="cat-item-right">
          <span class="cat-cor-badge" style="background:${cat.cor}"></span>
          <button
            class="btn btn-outline btn-sm"
            onclick="window.abrirEditar('${cat.id}')"
          >✏️ Editar</button>
          <button
            class="btn btn-sm cat-btn-desativar"
            onclick="window.confirmarDesativar('${cat.id}', '${cat.nome}')"
          >🗑️</button>
        </div>
      </div>
    `).join('');
}

// ── Modal Criar / Editar ──────────────────────────────────────

const CORES_RAPIDAS = [
  '#FF6B6B','#FF9F43','#F9CA24','#6AB04C','#4ECDC4',
  '#45B7D1','#4F46E5','#A29BFE','#FD79A8','#95A5A6',
];

function abrirModal(cat = null) {
  // Título
  document.getElementById('modal-cat-titulo').textContent =
    cat ? 'Editar Categoria' : 'Nova Categoria';

  // Preenche campos
  document.getElementById('cat-id').value         = cat?.id ?? '';
  document.getElementById('cat-emoji').value      = cat?.emoji ?? '📦';
  document.getElementById('cat-nome').value       = cat?.nome ?? '';
  document.getElementById('cat-cor').value        = cat?.cor ?? '#95A5A6';
  document.getElementById('cat-orcamento').value  = cat?.orcamentoMensal ?? '';
  document.getElementById('cat-erro').classList.add('hidden');

  // Atualiza prévia
  atualizarPrevia();

  // Cores rápidas
  const swatches = document.getElementById('color-swatches');
  swatches.innerHTML = CORES_RAPIDAS.map((c) =>
    `<button type="button" class="color-swatch" style="background:${c}" data-cor="${c}" title="${c}"></button>`
  ).join('');

  swatches.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('cat-cor').value = btn.dataset.cor;
      atualizarPrevia();
    });
  });

  document.getElementById('modal-categoria').classList.remove('hidden');
  document.getElementById('cat-emoji').focus();
}

function fecharModal() {
  document.getElementById('modal-categoria').classList.add('hidden');
  document.getElementById('form-categoria').reset();
}

function atualizarPrevia() {
  const emoji = document.getElementById('cat-emoji').value || '📦';
  const nome  = document.getElementById('cat-nome').value  || 'Nova Categoria';
  const cor   = document.getElementById('cat-cor').value   || '#95A5A6';

  document.getElementById('preview-emoji').textContent = emoji;
  document.getElementById('preview-nome').textContent  = nome;
  document.getElementById('preview-cor').style.background = cor;
}

// ── Modal Confirmar Desativação ───────────────────────────────

let _pendingDesativarId = null;

function abrirConfirmar(id, nome) {
  _pendingDesativarId = id;
  document.getElementById('confirmar-mensagem').textContent =
    `Deseja desativar a categoria "${nome}"? As despesas existentes não serão apagadas.`;
  document.getElementById('modal-confirmar').classList.remove('hidden');
}

function fecharConfirmar() {
  _pendingDesativarId = null;
  document.getElementById('modal-confirmar').classList.add('hidden');
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  // Logout
  document.getElementById('btn-logout')
    ?.addEventListener('click', () => logout());

  // Abrir modal nova categoria
  document.getElementById('btn-nova-categoria')
    .addEventListener('click', () => abrirModal());

  // Fechar modal categoria
  document.getElementById('btn-fechar-modal-cat')
    .addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar-cat')
    .addEventListener('click', fecharModal);
  document.getElementById('backdrop-categoria')
    .addEventListener('click', fecharModal);

  // Atualiza prévia ao digitar
  document.getElementById('cat-emoji')
    .addEventListener('input', atualizarPrevia);
  document.getElementById('cat-nome')
    .addEventListener('input', atualizarPrevia);
  document.getElementById('cat-cor')
    .addEventListener('input', atualizarPrevia);

  // Submit do formulário
  document.getElementById('form-categoria')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const erroEl  = document.getElementById('cat-erro');
      const btnSalvar = document.getElementById('btn-salvar-cat');
      erroEl.classList.add('hidden');
      btnSalvar.disabled = true;
      btnSalvar.textContent = 'Salvando…';

      const catId = document.getElementById('cat-id').value || null;
      const dados = {
        emoji:           document.getElementById('cat-emoji').value,
        nome:            document.getElementById('cat-nome').value,
        cor:             document.getElementById('cat-cor').value,
        orcamentoMensal: document.getElementById('cat-orcamento').value,
      };

      try {
        await salvarCategoria(dados, _grupoId, catId);
        fecharModal();
      } catch (err) {
        erroEl.textContent = err.message;
        erroEl.classList.remove('hidden');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar';
      }
    });

  // Fechar modal confirmar desativação
  document.getElementById('btn-fechar-confirmar')
    .addEventListener('click', fecharConfirmar);
  document.getElementById('btn-cancelar-confirmar')
    .addEventListener('click', fecharConfirmar);
  document.getElementById('backdrop-confirmar')
    .addEventListener('click', fecharConfirmar);

  // Confirmar desativação
  document.getElementById('btn-confirmar-acao')
    .addEventListener('click', async () => {
      if (!_pendingDesativarId) return;
      await desativarCategoria(_pendingDesativarId);
      fecharConfirmar();
    });
}

// ── Funções expostas para botões inline ──────────────────────

window.abrirEditar = (id) => {
  const cat = _categorias.find((c) => c.id === id);
  if (cat) abrirModal(cat);
};

window.confirmarDesativar = (id, nome) => abrirConfirmar(id, nome);
