// ============================================================
// PAGE: Despesas — RF-005 + RF-012 + RF-014
//
// RF-014 ADIÇÕES:
//  • Campo "responsável" no formulário de nova/edição de despesa
//  • Chips de total por responsável no resumo do mês
//  • Filtro de lista por responsável
//  • Painel de Parcelamentos em Aberto (tipo='projecao')
//  • Despesas projetadas exibidas com estilo diferenciado
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil, buscarGrupo, atualizarDespesa } from '../services/database.js';
import { ouvirCategorias, ouvirContas } from '../services/database.js';
import {
  iniciarListenerDespesas,
  salvarDespesa,
  deletarDespesa,
} from '../controllers/despesas.js';
import { formatarMoeda, formatarData, nomeMes, escHTML } from '../utils/formatters.js';
import { dataHoje, isMovimentacaoReal } from '../utils/helpers.js';
import { skeletonCards, emptyStateHTML, errorStateHTML } from '../utils/skeletons.js';

const _COR_CAT_FALLBACK = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-text-muted').trim() || '#8B8A82';

// ── Estado da página ──────────────────────────────────────────
let _usuario    = null;
let _grupoId    = null;
let _grupo      = null;     // dados do grupo (nomesMembros)
let _mes        = new Date().getMonth() + 1;
let _ano        = new Date().getFullYear();
let _despesas   = [];
let _categorias = [];
let _catMap     = {};

let _contas     = [];       // NRF-004: contas/bancos do grupo
let _contaMap   = {};       // NRF-004: id → conta

let _unsubDesp   = null;
let _unsubCats   = null;
let _unsubContas = null;    // NRF-004: listener de contas
let _idParaExcluir = null;

// Atalhos de abertura automática do modal (via URL params do dashboard)
let _atalhoAbrirNova   = false;
let _atalhoAbrirEditar = null;

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

  // RF-014: carrega dados do grupo para obter nomes dos membros
  _grupo = await buscarGrupo(_grupoId);
  preencherDropdownResponsavel();

  // Atalhos do dashboard: flags setadas ANTES de iniciarListeners() para evitar
  // race condition quando Firestore usa cache e dispara callback sincronamente
  const _urlParams = new URLSearchParams(window.location.search);
  if (_urlParams.get('nova') === '1')  _atalhoAbrirNova   = true;
  if (_urlParams.get('editar'))        _atalhoAbrirEditar = _urlParams.get('editar');
  if (_atalhoAbrirNova || _atalhoAbrirEditar) {
    history.replaceState(null, '', window.location.pathname);
  }

  configurarEventos();
  atualizarTituloMes();
  iniciarListeners();
  iniciarListenerContas(); // NRF-004
});

// ── NRF-004: Listener de Contas ───────────────────────────────
function iniciarListenerContas() {
  if (_unsubContas) _unsubContas();
  _unsubContas = ouvirContas(_grupoId, (contas) => {
    _contas   = contas.sort((a, b) => a.nome.localeCompare(b.nome));
    _contaMap = Object.fromEntries(_contas.map((c) => [c.id, c]));
    preencherSelectContas(_contas);
    preencherFiltroContas(_contas);
    renderizarLista();
  });
}

// ── Listeners de Despesas ─────────────────────────────────────
function iniciarListeners() {
  if (_unsubDesp) _unsubDesp();
  if (_unsubCats) _unsubCats();

  // Skeleton enquanto dados carregam
  const lista = document.getElementById('despesas-lista');
  if (lista && !_despesas.length) lista.innerHTML = skeletonCards(5);

  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    // ENH-003: seletores de despesas exibem apenas categorias de tipo 'despesa'.
    // Categorias legacy sem campo tipo são tratadas como despesa (padrão histórico).
    _categorias = cats
      .filter(c => !c.tipo || c.tipo === 'despesa')
      .sort((a, b) => a.nome.localeCompare(b.nome));
    _catMap = Object.fromEntries(_categorias.map((c) => [c.id, c]));
    preencherSelectCategorias(_categorias);
    preencherFiltroCategorias(_categorias);
    renderizarLista();
    // Atalho ?nova=1: abre modal assim que categorias chegam (primeira vez)
    if (_atalhoAbrirNova) {
      _atalhoAbrirNova = false;
      abrirModalDespesa();
    }
  });

  try {
    _unsubDesp = iniciarListenerDespesas(_grupoId, _mes, _ano, (despesas) => {
      _despesas = despesas;
      atualizarChips();
      renderizarLista();
      preencherFiltroResponsavel();
      // Atalho ?editar=ID: abre modal com a despesa assim que dados chegam
      if (_atalhoAbrirEditar) {
        const d = _despesas.find(d => d.id === _atalhoAbrirEditar);
        if (d) { _atalhoAbrirEditar = null; abrirModalDespesa(d); }
      }
    });
  } catch (err) {
    console.error('Erro ao ouvir despesas:', err);
    if (lista) {
      lista.innerHTML = errorStateHTML('Erro ao carregar despesas', 'Verifique sua conexão e tente novamente.');
      lista.querySelector('.error-retry')?.addEventListener('click', iniciarListeners);
    }
  }
}

// ── RF-014: Dropdown de responsável no modal ─────────────────
function preencherDropdownResponsavel() {
  const sel = document.getElementById('despesa-responsavel');
  if (!sel || !_grupo) return;

  const nomes = Object.values(_grupo.nomesMembros ?? {});
  sel.innerHTML = '<option value="">Selecione o responsável</option>' +
    nomes.map(n => `<option value="${escHTML(n)}">${escHTML(n)}</option>`).join('');
}

// ── RF-014: Filtro por responsável ──────────────────────────
function preencherFiltroResponsavel() {
  const sel = document.getElementById('filtro-responsavel');
  if (!sel) return;
  const atual = sel.value;

  // Coleta responsáveis únicos do mês
  const responsaveis = [...new Set(
    _despesas
      .map(d => d.responsavel || d.portador || '')
      .filter(Boolean)
      .map(r => r.split(' ')[0]) // primeiro nome
  )].sort();

  sel.innerHTML = '<option value="">Todos os responsáveis</option>' +
    responsaveis.map(r => `<option value="${escHTML(r)}">${escHTML(r)}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Renderização ──────────────────────────────────────────────
function renderizarLista() {
  const lista = document.getElementById('despesas-lista');
  if (!lista) return;

  const filtroTexto = (document.getElementById('filtro-texto')?.value ?? '').toLowerCase().trim();
  const filtroCat   = document.getElementById('filtro-categoria')?.value  ?? '';
  const filtroResp  = document.getElementById('filtro-responsavel')?.value ?? '';
  const filtroConta = document.getElementById('filtro-conta')?.value ?? '';   // NRF-004

  let filtradas = _despesas;
  if (filtroCat)    filtradas = filtradas.filter(d => d.categoriaId === filtroCat);
  if (filtroConta)  filtradas = filtradas.filter(d => d.contaId === filtroConta); // NRF-004
  if (filtroTexto)  filtradas = filtradas.filter(d => d.descricao.toLowerCase().includes(filtroTexto));
  // RF-014: filtro por responsável (primeiro nome, case-insensitive)
  if (filtroResp)  filtradas = filtradas.filter(d => {
    const resp = (d.responsavel || d.portador || '').split(' ')[0].toLowerCase();
    return resp === filtroResp.toLowerCase();
  });

  if (!filtradas.length) {
    lista.innerHTML = _despesas.length
      ? emptyStateHTML('', 'Nenhuma despesa encontrada com os filtros aplicados.')
      : emptyStateHTML('', 'Nenhuma despesa registrada neste período.', 'Clique em + Nova Despesa para começar.');
    return;
  }

  lista.innerHTML = filtradas.map((d) => {
    const cat      = _catMap[d.categoriaId];
    const emoji    = cat?.emoji ?? '❓';
    const nome     = cat?.nome  ?? '—';
    const cor      = cat?.cor   ?? _COR_CAT_FALLBACK;
    const badge    = `<span class="desp-cat-badge" style="background:${cor}22;color:${cor};">${escHTML(emoji)} ${escHTML(nome)}</span>`;
    const dataFmt  = formatarData(d.data);
    const isProj   = d.tipo === 'projecao';

    // RF-014: badges adicionais
    const portBadge = d.isConjunta
      ? `<span class="desp-resp-badge desp-resp-badge--conjunta">👫 compartilhada</span>`
      : (d.responsavel || d.portador)
        ? `<span class="desp-resp-badge">${escHTML((d.responsavel || d.portador).split(' ')[0])}</span>`
        : '';
    const parcelaBadge = (d.parcela && d.parcela !== '-')
      ? `<span class="desp-parcela-badge">${d.parcela}</span>`
      : '';
    const projBadge = isProj
      ? '<span class="desp-proj-badge" title="Parcela projetada — ainda não confirmada pela fatura">projeção</span>'
      : '';
    // NRF-004: badge conta/banco
    const conta = _contaMap[d.contaId];
    const contaBadge = conta
      ? `<span class="desp-conta-badge" style="background:${conta.cor}18;color:${conta.cor};border-color:${conta.cor}44;" title="${escHTML(conta.nome)}">${escHTML(conta.emoji)} ${escHTML(conta.nome)}</span>`
      : '';
    // NRF-001: badge conjunta
    const conjuntaBadge = d.isConjunta
      ? `<span class="desp-conjunta-badge" title="Dividida 50/50 — Meu Bolso: ${formatarMoeda(d.valorAlocado ?? d.valor / 2)}">👫 conjunta</span>`
      : '';
    // RF-063: badge transferência interna
    const isTransf = d.tipo === 'transferencia_interna';
    const transfBadge = isTransf
      ? '<span class="desp-transf-badge" title="Transferência entre membros do grupo — excluída dos agregados">🔁 transferência interna</span>'
      : '';

    // ENH-004: 1 badge visível no estado compacto (hierarquia: transf > projeção > parcela > conjunta > portador)
    let compactBadge = '';
    if (isTransf)                          compactBadge = transfBadge;
    else if (isProj)                       compactBadge = projBadge;
    else if (d.parcela && d.parcela !== '-') compactBadge = parcelaBadge;
    else if (d.isConjunta)                 compactBadge = conjuntaBadge;
    else if (portBadge)                    compactBadge = portBadge;

    // ENH-004: painel expansível com todos os metadados
    const allBadges = [contaBadge, portBadge, parcelaBadge, projBadge, conjuntaBadge, transfBadge].filter(Boolean);
    const detailPanel = allBadges.length > 1 ? `
      <details class="desp-detail">
        <summary class="desp-detail-toggle">▾</summary>
        <div class="desp-detail-panel">${allBadges.join('')}</div>
      </details>` : '';

    return `
    <div class="desp-item card${isProj ? ' desp-item--proj' : ''}${isTransf ? ' desp-item--transf' : ''}">
      <div class="desp-item-left">
        ${badge}
        <span class="desp-item-descricao">${escHTML(d.descricao)}</span>
        <div class="desp-item-meta">
          <span class="desp-item-data">${dataFmt}</span>
          ${compactBadge}${detailPanel}
        </div>
      </div>
      <div class="desp-item-right">
        <span class="desp-item-valor${isProj ? ' desp-item-valor--proj' : ''}">${formatarMoeda(d.isConjunta ? (d.valorAlocado ?? d.valor / 2) : d.valor)}</span>
        <div class="desp-item-acoes">
          <button
            class="btn btn-sm btn-outline"
            onclick="window._despEditar('${escHTML(d.id)}')"
            title="Editar"
          >✏️</button>
          ${!isTransf ? `<button
            class="btn btn-sm btn-outline"
            onclick="window._despMarcarTransferencia('${escHTML(d.id)}')"
            title="Marcar como transferência interna"
          >🔁</button>` : `<button
            class="btn btn-sm btn-outline"
            onclick="window._despDesmarcarTransferencia('${escHTML(d.id)}')"
            title="Desmarcar transferência interna"
          >↩️</button>`}
          <button
            class="btn btn-sm btn-danger"
            onclick="window._despExcluir('${escHTML(d.id)}','${escHTML(d.descricao).replace(/'/g, "\\'")}')"
            title="Excluir"
          >🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
  lista.classList.add('fade-in');
}

function atualizarChips() {
  const reais  = _despesas.filter(isMovimentacaoReal);
  const total  = reais.reduce((s, d) => s + d.valor, 0);
  const count  = reais.length;
  const chipTotal = document.getElementById('chip-total');
  const chipCount = document.getElementById('chip-count');
  if (chipTotal) chipTotal.textContent = formatarMoeda(total);
  if (chipCount) chipCount.textContent = count;
}

function atualizarTituloMes() {
  const el = document.getElementById('titulo-mes');
  if (el) el.textContent = `${nomeMes(_mes)} ${_ano}`;
}

// NRF-001: atualiza texto de preview do split no modal (fix #72 — radio)
function atualizarPreviewConjunta() {
  const isConj  = document.querySelector('[name="despesa-tipo"]:checked')?.value === 'conjunta';
  const preview = document.getElementById('conjunta-preview-text');
  if (!preview) return;
  if (!isConj) { preview.textContent = '50/50'; return; }
  const val = parseFloat(document.getElementById('despesa-valor')?.value ?? 0);
  if (val > 0) {
    preview.textContent = `→ Meu Bolso: ${formatarMoeda(val / 2)}`;
  } else {
    preview.textContent = 'Informe o valor para ver a divisão.';
  }
}

// ── Selects ───────────────────────────────────────────────────
function preencherSelectCategorias(cats) {
  const sel = document.getElementById('despesa-categoria');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione uma categoria</option>' +
    cats.map(c => `<option value="${escHTML(c.id)}">${escHTML(c.emoji)} ${escHTML(c.nome)}</option>`).join('');
  if (atual) sel.value = atual;
}

function preencherFiltroCategorias(cats) {
  const sel = document.getElementById('filtro-categoria');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map(c => `<option value="${escHTML(c.id)}">${escHTML(c.emoji)} ${escHTML(c.nome)}</option>`).join('');
  if (atual) sel.value = atual;
}

// NRF-004: Contas
function preencherSelectContas(contas) {
  const sel = document.getElementById('despesa-conta');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione a conta (opcional)</option>' +
    contas.map(c => `<option value="${escHTML(c.id)}">${escHTML(c.emoji)} ${escHTML(c.nome)}</option>`).join('');
  if (atual) sel.value = atual;
}

function preencherFiltroContas(contas) {
  const sel = document.getElementById('filtro-conta');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as contas</option>' +
    contas.map(c => `<option value="${escHTML(c.id)}">${escHTML(c.emoji)} ${escHTML(c.nome)}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Modal de Despesa ─────────────────────────────────────────
function abrirModalDespesa(despesa = null) {
  preencherSelectCategorias(_categorias);
  preencherDropdownResponsavel();
  preencherSelectContas(_contas); // NRF-004

  document.getElementById('despesa-id').value        = despesa?.id ?? '';
  document.getElementById('despesa-descricao').value = despesa?.descricao ?? '';
  document.getElementById('despesa-valor').value     = despesa?.valor ?? '';
  document.getElementById('despesa-categoria').value = despesa?.categoriaId ?? '';
  // NRF-004: pré-seleciona a conta ao editar
  const selConta = document.getElementById('despesa-conta');
  if (selConta) selConta.value = despesa?.contaId ?? '';
  document.getElementById('despesa-data').value      = despesa
    ? (despesa.data?.toDate?.() ?? new Date(despesa.data)).toISOString().slice(0, 10)
    : dataHoje();
  // RF-014: campo responsável — obrigatório (Issue #49)
  // Para nova despesa: pré-seleciona o usuário logado
  // Para edição: mantém o responsável original
  const selResp = document.getElementById('despesa-responsavel');
  if (selResp) {
    if (despesa) {
      selResp.value = despesa.responsavel ?? '';
    } else {
      // Determina o nome do usuário atual pelo nomesMembros do grupo
      const nomeUsuarioAtual = _grupo?.nomesMembros?.[_usuario?.uid] ?? '';
      selResp.value = nomeUsuarioAtual;
    }
  }

  // NRF-001: tipo de despesa — preenche ao editar; limpa para nova (usuário deve escolher)
  document.querySelectorAll('[name="despesa-tipo"]').forEach(r => r.checked = false);
  document.querySelectorAll('.despesa-tipo-option').forEach(l => l.classList.remove('selecionado'));

  const _selecionarTipo = (val) => {
    const radio = document.querySelector(`[name="despesa-tipo"][value="${val}"]`);
    if (radio) {
      radio.checked = true;
      radio.closest('.despesa-tipo-option')?.classList.add('selecionado');
    }
  };

  if (despesa) {
    _selecionarTipo(despesa.isConjunta ? 'conjunta' : 'individual');
  } else {
    // Auto-seleciona só se a categoria tiver isConjuntaPadrao definido explicitamente
    const catId = document.getElementById('despesa-categoria').value;
    const cat   = _categorias.find(c => c.id === catId);
    if (cat?.isConjuntaPadrao !== undefined) {
      _selecionarTipo(cat.isConjuntaPadrao ? 'conjunta' : 'individual');
    }
  }
  atualizarPreviewConjunta();

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
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());
  document.getElementById('btn-nova-despesa')?.addEventListener('click', () => abrirModalDespesa());
  document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModalDespesa);
  document.getElementById('btn-cancelar-despesa')?.addEventListener('click', fecharModalDespesa);
  document.querySelector('#modal-despesa .modal-backdrop')?.addEventListener('click', fecharModalDespesa);

  // Submit do formulário
  document.getElementById('form-despesa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl  = document.getElementById('despesa-erro');
    const btnSave = document.getElementById('btn-salvar-despesa');
    erroEl.classList.add('hidden');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando…';

    const responsavel = document.getElementById('despesa-responsavel')?.value ?? '';

    // Validação do responsável — obrigatório (Issue #49)
    if (!responsavel) {
      erroEl.textContent = 'Selecione o responsável pela despesa.';
      erroEl.classList.remove('hidden');
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
      document.getElementById('despesa-responsavel')?.focus();
      return;
    }

    const valor       = parseFloat(document.getElementById('despesa-valor').value);
    // NRF-001 fix #72 — radio obrigatório
    const tipoSelecionado = document.querySelector('[name="despesa-tipo"]:checked')?.value;
    if (!tipoSelecionado) {
      erroEl.textContent = 'Selecione o tipo da despesa: Individual ou Conjunta.';
      erroEl.classList.remove('hidden');
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
      document.getElementById('form-group-tipo-despesa')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const isConjunta = tipoSelecionado === 'conjunta';
    const contaIdSel = document.getElementById('despesa-conta')?.value || undefined;
    const dados = {
      descricao:    document.getElementById('despesa-descricao').value.trim(),
      valor,
      categoriaId:  document.getElementById('despesa-categoria').value,
      data:         new Date(document.getElementById('despesa-data').value + 'T12:00:00'),
      responsavel,      // RF-014 — agora obrigatório
      // NRF-001: divisão conjunta
      isConjunta,
      valorAlocado: isConjunta ? Math.round(valor * 100 / 2) / 100 : undefined,
      contaId: contaIdSel,  // NRF-004
    };
    const despesaId = document.getElementById('despesa-id').value || null;

    try {
      await salvarDespesa(dados, _grupoId, _usuario.uid, despesaId);
      fecharModalDespesa();
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.classList.remove('hidden');
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    }
  });

  // Modal exclusão
  document.getElementById('btn-fechar-excluir')?.addEventListener('click', fecharModalExcluir);
  document.getElementById('btn-cancelar-excluir')?.addEventListener('click', fecharModalExcluir);
  document.querySelector('#modal-excluir .modal-backdrop')?.addEventListener('click', fecharModalExcluir);
  document.getElementById('btn-confirmar-excluir')?.addEventListener('click', async () => {
    if (!_idParaExcluir) return;
    const btn = document.getElementById('btn-confirmar-excluir');
    btn.disabled = true; btn.textContent = 'Excluindo…';
    try {
      await deletarDespesa(_idParaExcluir);
      fecharModalExcluir();
    } finally {
      btn.disabled = false; btn.textContent = 'Excluir';
    }
  });

  // Navegação de mês
  document.getElementById('btn-mes-ant')?.addEventListener('click', () => {
    if (_mes === 1) { _mes = 12; _ano--; } else { _mes--; }
    atualizarTituloMes(); atualizarChips(); iniciarListeners();
  });
  document.getElementById('btn-mes-prox')?.addEventListener('click', () => {
    if (_mes === 12) { _mes = 1; _ano++; } else { _mes++; }
    atualizarTituloMes(); atualizarChips(); iniciarListeners();
  });

  // Filtros
  document.getElementById('filtro-texto')?.addEventListener('input',  () => renderizarLista());
  document.getElementById('filtro-categoria')?.addEventListener('change',   () => renderizarLista());
  document.getElementById('filtro-responsavel')?.addEventListener('change', () => renderizarLista());  // RF-014
  document.getElementById('filtro-conta')?.addEventListener('change',       () => renderizarLista());  // NRF-004

  // NRF-001: auto-toggle conjunta ao mudar categoria no modal
  document.getElementById('despesa-categoria')?.addEventListener('change', () => {
    const catId = document.getElementById('despesa-categoria').value;
    const cat   = _categorias.find(c => c.id === catId);
    if (cat?.isConjuntaPadrao !== undefined) {
      const valCat = cat.isConjuntaPadrao ? 'conjunta' : 'individual';
      const rCat = document.querySelector(`[name="despesa-tipo"][value="${valCat}"]`);
      if (rCat) {
        rCat.checked = true;
        document.querySelectorAll('.despesa-tipo-option').forEach(l => l.classList.remove('selecionado'));
        rCat.closest('.despesa-tipo-option')?.classList.add('selecionado');
      }
    }
    atualizarPreviewConjunta();
  });
  // NRF-001: handler explícito nos cards — garante que o radio é marcado
  // mesmo em navegadores onde display:none impede o comportamento nativo do label
  document.querySelectorAll('.despesa-tipo-option').forEach(label => {
    label.addEventListener('click', () => {
      const radio = label.querySelector('input[type="radio"]');
      if (!radio) return;
      radio.checked = true;
      // Fallback visual via classe (browsers sem suporte a :has)
      document.querySelectorAll('.despesa-tipo-option').forEach(l => l.classList.remove('selecionado'));
      label.classList.add('selecionado');
      atualizarPreviewConjunta();
    });
  });
  // NRF-001: atualiza preview quando toggle ou valor mudam
  document.querySelectorAll('[name="despesa-tipo"]').forEach(r =>
    r.addEventListener('change', atualizarPreviewConjunta)
  );
  document.getElementById('despesa-valor')?.addEventListener('input', atualizarPreviewConjunta);

  // Exportar CSV
  document.getElementById('btn-exportar-csv')?.addEventListener('click', () => exportarCSV());
}

// ── Exportação CSV ────────────────────────────────────────────
function exportarCSV() {
  const exportaveis = _despesas.filter(isMovimentacaoReal);
  if (!exportaveis.length) { alert('Nenhuma despesa para exportar neste período.'); return; }

  const cabecalho = ['Data', 'Descrição', 'Responsável', 'Categoria', 'Emoji', 'Parcela', 'Valor (R$)'];
  const ordenadas = [...exportaveis].sort((a, b) => {
    const da = (a.data?.toDate?.() ?? new Date(a.data)).getTime();
    const db = (b.data?.toDate?.() ?? new Date(b.data)).getTime();
    return da - db;
  });

  const linhas = ordenadas.map((d) => {
    const cat       = _catMap[d.categoriaId];
    const dataFmt   = formatarData(d.data);
    const descricao = `"${d.descricao.replace(/"/g, '""')}"`;
    const resp      = d.responsavel || d.portador || '';
    const catNome   = cat?.nome  ?? '—';
    const catEmoji  = cat?.emoji ?? '';
    const parcela   = d.parcela || '-';
    const valor     = d.valor.toFixed(2).replace('.', ',');
    return [dataFmt, descricao, `"${resp}"`, `"${catNome}"`, catEmoji, parcela, valor].join(';');
  });

  const csv  = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `despesas-${nomeMes(_mes).toLowerCase().replace(/\s/g, '-')}-${_ano}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Funções globais (chamadas pelos botões inline) ────────────
window._despEditar = (id) => {
  const despesa = _despesas.find(d => d.id === id);
  if (despesa) abrirModalDespesa(despesa);
};
window._despExcluir = (id, descricao) => abrirModalExcluir(id, descricao);

// RF-063: Marcar/desmarcar despesa como transferência interna
window._despMarcarTransferencia = async (id) => {
  try {
    await atualizarDespesa(id, {
      tipo: 'transferencia_interna',
      statusReconciliacao: 'manual',
    });
  } catch (err) {
    console.error('[despesas] Erro ao marcar transferência:', err);
    alert('Erro ao marcar como transferência interna.');
  }
};
window._despDesmarcarTransferencia = async (id) => {
  try {
    await atualizarDespesa(id, {
      tipo: 'despesa',
      statusReconciliacao: null,
      contrapartidaId: null,
    });
  } catch (err) {
    console.error('[despesas] Erro ao desmarcar transferência:', err);
    alert('Erro ao desmarcar transferência interna.');
  }
};
