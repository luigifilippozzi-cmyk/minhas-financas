// ============================================================
// ENTRY POINT — Minhas Finanças
// Ponto de entrada do dashboard (index.html)
// ============================================================

import { onAuthChange, logout } from './services/auth.js';
import { buscarPerfil } from './services/database.js';
import { iniciarListenerCategorias } from './controllers/categorias.js';
import {
  iniciarListenerDespesas,
  salvarDespesa,
  deletarDespesa,
  renderizarListaDespesas,
} from './controllers/despesas.js';
import { iniciarListenerOrcamentos } from './controllers/orcamentos.js';
import { renderizarDashboard } from './controllers/dashboard.js';
import { mesAnoAtual, dataHoje, definirTexto } from './utils/helpers.js';
import { nomeMes } from './utils/formatters.js';

// ── Estado Global ─────────────────────────────────────────────
let estadoApp = {
  usuario:    null,
  perfil:     null,
  mes:        mesAnoAtual().mes,
  ano:        mesAnoAtual().ano,
  categorias: [],
  despesas:   [],
  orcamentos: [],
};

// Referências para unsubscribe ao trocar período
let _unsubCats = null;
let _unsubDesp = null;
let _unsubOrc  = null;

// ── Inicialização ─────────────────────────────────────────────

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  estadoApp.usuario = user;
  estadoApp.perfil  = await buscarPerfil(user.uid);

  if (!estadoApp.perfil?.grupoId) {
    window.location.href = 'grupo.html';
    return;
  }

  definirTexto('usuario-nome', estadoApp.perfil.nome ?? user.email);
  atualizarTituloPeriodo();
  preencherSelectPeriodo();
  iniciarListeners();
  configurarEventos();
});

// ── Listeners em tempo real ────────────────────────────────────

function iniciarListeners() {
  const { grupoId } = estadoApp.perfil;
  const { mes, ano } = estadoApp;

  // Cancela listeners anteriores ao trocar de período
  if (_unsubCats) _unsubCats();
  if (_unsubDesp) _unsubDesp();
  if (_unsubOrc)  _unsubOrc();

  // Categorias — não filtram por mês
  _unsubCats = iniciarListenerCategorias(grupoId, (cats) => {
    estadoApp.categorias = cats;
    preencherSelectCategorias(cats);
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos);
    renderizarListaDespesas(estadoApp.despesas, estadoApp.categorias);
  });

  // Despesas do mês — sync bidirecional: qualquer escrita de qualquer membro
  // dispara este listener nos dois dispositivos simultaneamente
  _unsubDesp = iniciarListenerDespesas(grupoId, mes, ano, (desp) => {
    estadoApp.despesas = desp;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos);
    renderizarListaDespesas(estadoApp.despesas, estadoApp.categorias);
  });

  // Orçamentos do mês
  _unsubOrc = iniciarListenerOrcamentos(grupoId, mes, ano, (orc) => {
    estadoApp.orcamentos = orc;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos);
  });
}

// ── Categorias no select ───────────────────────────────────────

function preencherSelectCategorias(categorias) {
  const sel = document.getElementById('despesa-categoria');
  if (!sel) return;
  const valorAtual = sel.value;
  sel.innerHTML = '<option value="">Selecione uma categoria</option>' +
    categorias
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((c) => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`)
      .join('');
  // Preserva seleção ao recarregar (ex: ao editar)
  if (valorAtual) sel.value = valorAtual;
}

// ── Eventos de UI ─────────────────────────────────────────────

let _eventosConfigurados = false;

function configurarEventos() {
  if (_eventosConfigurados) return;
  _eventosConfigurados = true;

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await logout();
  });

  // Abrir modal nova despesa
  document.getElementById('btn-nova-despesa')?.addEventListener('click', () => {
    abrirModalDespesa();
  });

  // Fechar modal
  document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModalDespesa);
  document.getElementById('btn-cancelar-despesa')?.addEventListener('click', fecharModalDespesa);
  document.querySelector('.modal-backdrop')?.addEventListener('click', fecharModalDespesa);

  // Submit do formulário
  document.getElementById('form-despesa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl  = document.getElementById('despesa-erro');
    const btnSave = e.target.querySelector('[type="submit"]');
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
      await salvarDespesa(dados, estadoApp.perfil.grupoId, estadoApp.usuario.uid, despesaId);
      fecharModalDespesa();
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.classList.remove('hidden');
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    }
  });

  // Filtro de período
  document.getElementById('select-mes')?.addEventListener('change', (e) => {
    estadoApp.mes = Number(e.target.value);
    atualizarTituloPeriodo();
    iniciarListeners();
  });
  document.getElementById('select-ano')?.addEventListener('change', (e) => {
    estadoApp.ano = Number(e.target.value);
    atualizarTituloPeriodo();
    iniciarListeners();
  });
}

// ── Modal de Despesa ─────────────────────────────────────────

function abrirModalDespesa(despesa = null) {
  // Re-popula categorias caso ainda não tenham sido carregadas
  preencherSelectCategorias(estadoApp.categorias);

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
  document.getElementById('modal-despesa').classList.remove('hidden');
}

function fecharModalDespesa() {
  document.getElementById('modal-despesa').classList.add('hidden');
  document.getElementById('form-despesa').reset();
}

// Expõe funções para os botões inline na lista de despesas
window.editarDespesa = (id) => {
  const despesa = estadoApp.despesas.find((d) => d.id === id);
  if (despesa) abrirModalDespesa(despesa);
};

window.confirmarExcluirDespesa = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta despesa?')) {
    await deletarDespesa(id);
  }
};

// ── Período ──────────────────────────────────────────────────

function preencherSelectPeriodo() {
  const selMes = document.getElementById('select-mes');
  const selAno = document.getElementById('select-ano');
  if (!selMes || !selAno) return;

  const meses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];
  selMes.innerHTML = meses.map((m, i) =>
    `<option value="${i + 1}" ${i + 1 === estadoApp.mes ? 'selected' : ''}>${m}</option>`
  ).join('');

  const anoAtual = new Date().getFullYear();
  selAno.innerHTML = [anoAtual - 1, anoAtual, anoAtual + 1].map((a) =>
    `<option value="${a}" ${a === estadoApp.ano ? 'selected' : ''}>${a}</option>`
  ).join('');
}

function atualizarTituloPeriodo() {
  const el = document.getElementById('mes-ano-atual');
  if (el) el.textContent = `${nomeMes(estadoApp.mes)} ${estadoApp.ano}`;
}
