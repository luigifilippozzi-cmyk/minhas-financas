// ============================================================
// PAGE: planejamento.js — RF-060
// Planejamento Mensal: visão unificada de despesas previstas
// com tracking de realizado vs. planejado em tempo real.
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil } from '../services/database.js';
import { formatarMoeda, nomeMes, escHTML } from '../utils/formatters.js';
import { isMovimentacaoReal } from '../utils/helpers.js';
import { skeletonTableRows } from '../utils/skeletons.js';
import {
  gerarPlanoPara,
  autoMatch,
  aplicarMatches,
  analisarGaps,
  despesasNaoPlanejadas,
  ouvirPlanejamento,
  ouvirDespesas,
  ouvirCategorias,
  ouvirOrcamentos,
  salvarItemPlanejamento,
  excluirItemPlanejamento,
} from '../controllers/planejamento.js';

// ── Estado ────────────────────────────────────────────────────
let _grupoId    = null;
let _userId     = null;
let _categorias = [];
let _orcamentos = [];
let _planItems  = [];
let _despesas   = [];

let _mes = new Date().getMonth() + 1;
let _ano = new Date().getFullYear();

let _unsubPlan = null;
let _unsubDesp = null;
let _unsubCats = null;
let _unsubOrcs = null;

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
  _userId  = user.uid;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;

  iniciarApp();
  configurarEventos();
});

// ── Inicialização ─────────────────────────────────────────────

function iniciarApp() {
  pararListeners();
  atualizarTituloMes();

  // Skeleton enquanto dados carregam
  const tbody = document.getElementById('plan-tbody');
  if (tbody && !_planItems.length) tbody.innerHTML = skeletonTableRows(5, 7);

  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats
      .filter(c => c.tipo !== 'receita')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    preencherSelectCategorias();
    renderizar();
  });

  _unsubOrcs = ouvirOrcamentos(_grupoId, _mes, _ano, (orcs) => {
    _orcamentos = orcs;
    renderizar();
  });

  _unsubPlan = ouvirPlanejamento(_grupoId, _mes, _ano, (items) => {
    _planItems = items;
    executarAutoMatch();
    renderizar();
  });

  _unsubDesp = ouvirDespesas(_grupoId, _mes, _ano, (desp) => {
    _despesas = desp;
    executarAutoMatch();
    renderizar();
  });
}

function pararListeners() {
  if (_unsubPlan) _unsubPlan();
  if (_unsubDesp) _unsubDesp();
  if (_unsubCats) _unsubCats();
  if (_unsubOrcs) _unsubOrcs();
}

// ── Auto-Matching ─────────────────────────────────────────────

let _matchDebounce = null;

function executarAutoMatch() {
  clearTimeout(_matchDebounce);
  _matchDebounce = setTimeout(async () => {
    if (!_planItems.length || !_despesas.length) return;

    const realizadas = _despesas.filter(isMovimentacaoReal);
    const matches = autoMatch(_planItems, realizadas);

    const novos = matches.filter(m => {
      const item = _planItems.find(i => i.id === m.itemId);
      return item && item.status !== 'realizado';
    });

    if (novos.length > 0) {
      await aplicarMatches(novos);
    }
  }, 500);
}

// ── Renderização ──────────────────────────────────────────────

function atualizarTituloMes() {
  document.getElementById('plan-mes-titulo').textContent = `${nomeMes(_mes)} ${_ano}`;
}

function renderizar() {
  renderizarKPIs();
  renderizarTabela();
  renderizarGaps();
  renderizarNaoPlanejadas();
}

function renderizarKPIs() {
  const ativos = _planItems.filter(i => i.status !== 'cancelado');
  const totalPrevisto  = ativos.reduce((s, i) => s + (i.valorPrevisto ?? 0), 0);
  const totalRealizado = ativos.reduce((s, i) => s + (i.valorRealizado ?? 0), 0);
  const diferenca = totalPrevisto - totalRealizado;
  const cobertura = totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100) : 0;

  document.getElementById('kpi-previsto').textContent  = formatarMoeda(totalPrevisto);
  document.getElementById('kpi-realizado').textContent = formatarMoeda(totalRealizado);
  document.getElementById('kpi-diferenca').textContent = formatarMoeda(Math.abs(diferenca));
  document.getElementById('kpi-cobertura').textContent = `${cobertura}%`;

  const diffWrap = document.getElementById('kpi-diff-wrap');
  diffWrap.classList.remove('plan-kpi--positivo', 'plan-kpi--negativo');
  diffWrap.classList.add(diferenca >= 0 ? 'plan-kpi--positivo' : 'plan-kpi--negativo');
}

function renderizarTabela() {
  const tbody = document.getElementById('plan-tbody');
  const catMap = new Map(_categorias.map(c => [c.id, c]));

  if (!_planItems.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="plan-empty">
        <p>Nenhum item planejado para este mês.</p>
        <p>Clique em <strong>"🔄 Gerar Plano"</strong> para criar automaticamente com base no histórico.</p>
      </td></tr>`;
    return;
  }

  // Agrupar por categoria
  const grupos = {};
  for (const item of _planItems) {
    const catId = item.categoriaId || '__sem_cat__';
    if (!grupos[catId]) grupos[catId] = [];
    grupos[catId].push(item);
  }

  const catIds = Object.keys(grupos).sort((a, b) => {
    const na = catMap.get(a)?.nome ?? 'zzz';
    const nb = catMap.get(b)?.nome ?? 'zzz';
    return na.localeCompare(nb, 'pt-BR');
  });

  let html = '';

  for (const catId of catIds) {
    const items = grupos[catId];
    const cat = catMap.get(catId);
    const catNome = cat ? `${cat.emoji} ${cat.nome}` : 'Sem categoria';

    let subtotalPrev = 0, subtotalReal = 0;

    for (const item of items) {
      if (item.status === 'cancelado') continue;
      subtotalPrev += item.valorPrevisto ?? 0;
      subtotalReal += item.valorRealizado ?? 0;

      const statusIcon = _statusIcon(item);
      const badge = _badgeOrigem(item.origem);
      const valorRealClass = _classeValorReal(item);
      const valorRealText = item.valorRealizado != null ? formatarMoeda(item.valorRealizado) : '---';
      const podeDeletar = item.origem === 'manual';

      html += `
        <tr data-item-id="${item.id}">
          <td>${statusIcon}</td>
          <td>${badge}</td>
          <td>${escHTML(item.descricao)}</td>
          <td>${escHTML(catNome)}</td>
          <td style="text-align:right;" class="plan-valor-previsto">${formatarMoeda(item.valorPrevisto ?? 0)}</td>
          <td style="text-align:right;" class="${valorRealClass}">${valorRealText}</td>
          <td><div class="plan-acoes-item">
            ${podeDeletar ? `<button class="btn-del-item" data-id="${item.id}" title="Excluir">🗑</button>` : ''}
            ${item.status === 'pendente' ? `<button class="btn-mark-item" data-id="${item.id}" title="Marcar como realizado">✓</button>` : ''}
          </div></td>
        </tr>`;
    }

    html += `
      <tr class="plan-row-subtotal">
        <td></td><td></td>
        <td colspan="2" style="text-align:right;">Subtotal ${escHTML(catNome)}</td>
        <td style="text-align:right;">${formatarMoeda(subtotalPrev)}</td>
        <td style="text-align:right;">${formatarMoeda(subtotalReal)}</td>
        <td></td>
      </tr>`;
  }

  tbody.innerHTML = html;
  tbody.classList.add('fade-in');

  tbody.querySelectorAll('.btn-del-item').forEach(btn =>
    btn.addEventListener('click', () => handleExcluirItem(btn.dataset.id)));
  tbody.querySelectorAll('.btn-mark-item').forEach(btn =>
    btn.addEventListener('click', () => handleMarcarRealizado(btn.dataset.id)));
}

function _statusIcon(item) {
  if (item.status === 'realizado') {
    if (item.valorRealizado > item.valorPrevisto * 1.1)
      return '<span class="plan-status plan-status--acima" title="Acima do previsto">⚠</span>';
    return '<span class="plan-status plan-status--realizado" title="Realizado">✓</span>';
  }
  if (item.status === 'cancelado')
    return '<span class="plan-status plan-status--cancelado" title="Cancelado">✕</span>';
  return '<span class="plan-status plan-status--pendente" title="Pendente">○</span>';
}

function _badgeOrigem(origem) {
  const map = {
    recorrente: '<span class="plan-badge plan-badge--recorrente">Recorrente</span>',
    parcela:    '<span class="plan-badge plan-badge--parcela">Parcela</span>',
    orcamento:  '<span class="plan-badge plan-badge--orcamento">Orçamento</span>',
    manual:     '<span class="plan-badge plan-badge--manual">Manual</span>',
  };
  return map[origem] ?? '';
}

function _classeValorReal(item) {
  if (item.valorRealizado == null) return 'plan-valor-realizado plan-valor-realizado--vazio';
  if (item.valorRealizado > (item.valorPrevisto ?? 0) * 1.1) return 'plan-valor-realizado plan-valor-realizado--acima';
  return 'plan-valor-realizado plan-valor-realizado--ok';
}

// ── Gaps ──────────────────────────────────────────────────────

function renderizarGaps() {
  const container = document.getElementById('plan-gaps');
  if (!_orcamentos.length && !_planItems.length) { container.innerHTML = ''; return; }

  const { semPlano, excedidos } = analisarGaps(_orcamentos, _planItems, _categorias);
  let html = '';

  if (semPlano.length) {
    html += `<div class="plan-gap-card"><h4>📭 Categorias com orçamento sem itens planejados</h4>
      ${semPlano.map(g => `<div class="plan-gap-item"><span>${g.emoji} ${escHTML(g.nome)}</span><span>${formatarMoeda(g.valorOrcado)}</span></div>`).join('')}
    </div>`;
  }

  if (excedidos.length) {
    html += `<div class="plan-gap-card"><h4>⚠️ Planejado acima do orçamento</h4>
      ${excedidos.map(g => `<div class="plan-gap-item"><span>${g.emoji} ${escHTML(g.nome)}</span><span class="plan-gap-excesso">+${formatarMoeda(g.excesso)}</span></div>`).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

// ── Despesas Não Planejadas ───────────────────────────────────

function renderizarNaoPlanejadas() {
  const realizadas = _despesas.filter(isMovimentacaoReal);
  const naoPlan = despesasNaoPlanejadas(realizadas, _planItems);
  const catMap = new Map(_categorias.map(c => [c.id, c]));

  document.getElementById('count-nao-plan').textContent = naoPlan.length;

  const lista = document.getElementById('lista-nao-planejadas');
  if (!naoPlan.length) {
    lista.innerHTML = '<p class="empty-state" style="font-size:.85rem;padding:.5rem 0;">Todas as despesas realizadas estão no plano.</p>';
    return;
  }

  lista.innerHTML = `
    <table class="plan-tabela" style="margin-top:.5rem;">
      <thead><tr><th>Descrição</th><th>Categoria</th><th style="text-align:right;">Valor</th></tr></thead>
      <tbody>${naoPlan.map(d => {
        const cat = catMap.get(d.categoriaId);
        return `<tr><td>${escHTML(d.descricao ?? '')}</td><td>${cat ? `${cat.emoji} ${escHTML(cat.nome)}` : '—'}</td><td style="text-align:right;">${formatarMoeda(d.valor ?? 0)}</td></tr>`;
      }).join('')}</tbody>
    </table>`;
}

// ── Handlers ──────────────────────────────────────────────────

async function handleGerarPlano() {
  const btn = document.getElementById('btn-gerar-plano');
  btn.disabled = true;
  btn.textContent = '⏳ Gerando...';
  try {
    const qtd = await gerarPlanoPara(_grupoId, _mes, _ano);
    mostrarFeedback(qtd > 0
      ? `✅ Plano gerado com ${qtd} item(ns)`
      : 'ℹ️ Já existe um plano para este mês. Adicione itens manualmente.');
  } catch (err) {
    mostrarFeedback('❌ Erro ao gerar plano: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Gerar Plano';
  }
}

async function handleAdicionarItem() {
  const descricao = document.getElementById('add-descricao').value.trim();
  const categoriaId = document.getElementById('add-categoria').value;
  const valor = parseFloat(document.getElementById('add-valor').value) || 0;

  if (!descricao) { mostrarFeedback('⚠️ Informe a descrição', true); return; }

  try {
    await salvarItemPlanejamento({
      grupoId: _grupoId, ano: _ano, mes: _mes,
      categoriaId, descricao, valorPrevisto: valor,
      origem: 'manual', status: 'pendente',
      despesaId: null, valorRealizado: null, parcelamentoId: null,
      criadoEm: new Date(),
    });
    mostrarFeedback('✅ Item adicionado');
    document.getElementById('add-descricao').value = '';
    document.getElementById('add-valor').value = '';
    document.getElementById('plan-form-add').classList.add('hidden');
  } catch (err) {
    mostrarFeedback('❌ Erro: ' + err.message, true);
  }
}

async function handleExcluirItem(itemId) {
  try {
    await excluirItemPlanejamento(itemId);
    mostrarFeedback('✅ Item excluído');
  } catch (err) {
    mostrarFeedback('❌ Erro ao excluir: ' + err.message, true);
  }
}

async function handleMarcarRealizado(itemId) {
  try {
    await salvarItemPlanejamento({
      id: itemId,
      status: 'realizado',
      valorRealizado: _planItems.find(i => i.id === itemId)?.valorPrevisto ?? 0,
    });
    mostrarFeedback('✓ Marcado como realizado');
  } catch (err) {
    mostrarFeedback('❌ Erro: ' + err.message, true);
  }
}

// ── UI Helpers ────────────────────────────────────────────────

function preencherSelectCategorias() {
  const sel = document.getElementById('add-categoria');
  sel.innerHTML = _categorias.map(c =>
    `<option value="${c.id}">${c.emoji} ${escHTML(c.nome)}</option>`
  ).join('');
}

function mostrarFeedback(msg, erro = false) {
  const el = document.getElementById('plan-feedback');
  el.textContent = msg;
  el.className = `plan-feedback ${erro ? 'plan-feedback-erro' : 'plan-feedback-ok'}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── Navegação de Mês ──────────────────────────────────────────

function irParaMes(delta) {
  _mes += delta;
  if (_mes > 12) { _mes = 1;  _ano++; }
  if (_mes < 1)  { _mes = 12; _ano--; }
  iniciarApp();
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());
  document.getElementById('btn-mes-anterior').addEventListener('click', () => irParaMes(-1));
  document.getElementById('btn-mes-proximo').addEventListener('click', () => irParaMes(+1));
  document.getElementById('btn-gerar-plano').addEventListener('click', handleGerarPlano);
  document.getElementById('btn-add-item').addEventListener('click', () => {
    document.getElementById('plan-form-add').classList.toggle('hidden');
  });
  document.getElementById('btn-salvar-item').addEventListener('click', handleAdicionarItem);
  document.getElementById('btn-cancelar-item').addEventListener('click', () => {
    document.getElementById('plan-form-add').classList.add('hidden');
  });
}
