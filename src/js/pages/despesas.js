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
import { buscarPerfil, buscarGrupo } from '../services/database.js';
import { ouvirCategorias, ouvirParcelamentosAbertos } from '../services/database.js';
import {
  iniciarListenerDespesas,
  salvarDespesa,
  deletarDespesa,
} from '../controllers/despesas.js';
import { formatarMoeda, formatarData, nomeMes } from '../utils/formatters.js';
import { dataHoje } from '../utils/helpers.js';

// ── Estado da página ──────────────────────────────────────────
let _usuario    = null;
let _grupoId    = null;
let _grupo      = null;     // dados do grupo (nomesMembros)
let _mes        = new Date().getMonth() + 1;
let _ano        = new Date().getFullYear();
let _despesas   = [];
let _categorias = [];
let _catMap     = {};
let _projecoes  = [];       // RF-014: parcelas futuras em aberto

let _unsubDesp  = null;
let _unsubCats  = null;
let _unsubProj  = null;     // RF-014: listener de projeções
let _idParaExcluir = null;

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

  configurarEventos();
  atualizarTituloMes();
  iniciarListeners();
  iniciarListenerProjecoes();
});

// ── Listener de Projeções (RF-014) ────────────────────────────
function iniciarListenerProjecoes() {
  if (_unsubProj) _unsubProj();
  _unsubProj = ouvirParcelamentosAbertos(_grupoId, (projecoes) => {
    _projecoes = projecoes;
    renderizarPainelParcelamentos();
  });
}

// ── Listeners de Despesas ─────────────────────────────────────
function iniciarListeners() {
  if (_unsubDesp) _unsubDesp();
  if (_unsubCats) _unsubCats();

  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome));
    _catMap = Object.fromEntries(_categorias.map((c) => [c.id, c]));
    preencherSelectCategorias(_categorias);
    preencherFiltroCategorias(_categorias);
    renderizarLista();
  });

  _unsubDesp = iniciarListenerDespesas(_grupoId, _mes, _ano, (despesas) => {
    _despesas = despesas;
    atualizarChips();
    renderizarLista();
    renderizarChipsResponsavel();
    preencherFiltroResponsavel();
  });
}

// ── RF-014: Painel de Parcelamentos em Aberto ─────────────────
function renderizarPainelParcelamentos() {
  const widget = document.getElementById('parc-widget');
  const lista  = document.getElementById('parc-lista-desp');
  const total  = document.getElementById('parc-total-desp');
  if (!widget || !lista || !total) return;

  const hoje    = new Date();
  const futuras = _projecoes.filter(p => {
    const d = p.data?.toDate?.() ?? new Date(p.data);
    return d > hoje;
  });

  if (!futuras.length) {
    widget.classList.add('hidden');
    return;
  }

  widget.classList.remove('hidden');

  // Agrupa por responsável / portador
  const porResp = {};
  let totalGeral = 0;

  futuras.forEach(p => {
    const resp = p.responsavel || p.portador || '—';
    const val  = p.valor ?? 0;
    if (!porResp[resp]) porResp[resp] = { total: 0, items: [] };
    porResp[resp].total += val;
    porResp[resp].items.push(p);
    totalGeral += val;
  });

  total.textContent = formatarMoeda(totalGeral);

  // Renderiza linhas por responsável
  lista.innerHTML = Object.entries(porResp).map(([resp, dados]) => {
    const primeiroNome = resp.split(' ')[0];
    return `
    <div class="parc-resp-row">
      <div class="parc-resp-header">
        <span class="parc-resp-nome">👤 ${primeiroNome}</span>
        <span class="parc-resp-total">${formatarMoeda(dados.total)}</span>
      </div>
      <div class="parc-resp-items">
        ${agruparParPorCompra(dados.items)}
      </div>
    </div>`;
  }).join('');
}

function agruparParPorCompra(items) {
  // Agrupa pelo parcelamento_id para mostrar 1 linha por compra
  const compras = {};
  items.forEach(p => {
    const id = p.parcelamento_id ?? p.descricao;
    if (!compras[id]) compras[id] = { descricao: p.descricao, valor: p.valor, parcelas: [] };
    compras[id].parcelas.push(p.parcela ?? '—');
  });
  return Object.values(compras).map(c => {
    const qtd    = c.parcelas.length;
    const total  = c.valor * qtd;
    const parcs  = c.parcelas.slice(0, 3).join(', ') + (qtd > 3 ? '…' : '');
    return `
    <div class="parc-compra-item">
      <span class="parc-compra-desc">${c.descricao}</span>
      <span class="parc-compra-info">${qtd} parcela${qtd > 1 ? 's' : ''} (${parcs})</span>
      <span class="parc-compra-valor">${formatarMoeda(total)}</span>
    </div>`;
  }).join('');
}

// ── RF-014: Chips por responsável ────────────────────────────
function renderizarChipsResponsavel() {
  const container = document.getElementById('chips-responsavel');
  if (!container) return;

  const porResp = {};
  _despesas
    .filter(d => d.tipo !== 'projecao')
    .forEach(d => {
      const resp = d.responsavel || d.portador || '';
      if (!resp) return;
      const nome = resp.split(' ')[0]; // primeiro nome
      if (!porResp[nome]) porResp[nome] = 0;
      porResp[nome] += d.valor ?? 0;
    });

  if (!Object.keys(porResp).length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = Object.entries(porResp).map(([nome, val]) => `
    <div class="desp-chip desp-chip-resp">
      <span class="desp-chip-label">💳 ${nome}</span>
      <span class="desp-chip-valor">${formatarMoeda(val)}</span>
    </div>`
  ).join('');
}

// ── RF-014: Dropdown de responsável no modal ─────────────────
function preencherDropdownResponsavel() {
  const sel = document.getElementById('despesa-responsavel');
  if (!sel || !_grupo) return;

  const nomes = Object.values(_grupo.nomesMembros ?? {});
  sel.innerHTML = '<option value="">Selecione o responsável</option>' +
    nomes.map(n => `<option value="${n}">${n}</option>`).join('');
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
    responsaveis.map(r => `<option value="${r}">${r}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Renderização ──────────────────────────────────────────────
function renderizarLista() {
  const lista = document.getElementById('despesas-lista');
  if (!lista) return;

  const filtroTexto = (document.getElementById('filtro-texto')?.value ?? '').toLowerCase().trim();
  const filtroCat   = document.getElementById('filtro-categoria')?.value  ?? '';
  const filtroResp  = document.getElementById('filtro-responsavel')?.value ?? '';

  let filtradas = _despesas;
  if (filtroCat)   filtradas = filtradas.filter(d => d.categoriaId === filtroCat);
  if (filtroTexto) filtradas = filtradas.filter(d => d.descricao.toLowerCase().includes(filtroTexto));
  // RF-014: filtro por responsável (primeiro nome, case-insensitive)
  if (filtroResp)  filtradas = filtradas.filter(d => {
    const resp = (d.responsavel || d.portador || '').split(' ')[0].toLowerCase();
    return resp === filtroResp.toLowerCase();
  });

  if (!filtradas.length) {
    lista.innerHTML = `<p class="empty-state">${
      _despesas.length
        ? 'Nenhuma despesa encontrada com os filtros aplicados.'
        : 'Nenhuma despesa registrada neste período.<br>Clique em <strong>+ Nova Despesa</strong> para começar.'
    }</p>`;
    return;
  }

  lista.innerHTML = filtradas.map((d) => {
    const cat      = _catMap[d.categoriaId];
    const emoji    = cat?.emoji ?? '❓';
    const nome     = cat?.nome  ?? '—';
    const cor      = cat?.cor   ?? '#6c757d';
    const badge    = `<span class="desp-cat-badge" style="background:${cor}22;color:${cor};">${emoji} ${nome}</span>`;
    const dataFmt  = formatarData(d.data);
    const isProj   = d.tipo === 'projecao';

    // RF-014: badges adicionais
    const portBadge = (d.responsavel || d.portador)
      ? `<span class="desp-resp-badge">${(d.responsavel || d.portador).split(' ')[0]}</span>`
      : '';
    const parcelaBadge = (d.parcela && d.parcela !== '-')
      ? `<span class="desp-parcela-badge">${d.parcela}</span>`
      : '';
    const projBadge = isProj
      ? '<span class="desp-proj-badge" title="Parcela projetada — ainda não confirmada pela fatura">📋 projeção</span>'
      : '';
    // NRF-001: badge conjunta
    const conjuntaBadge = d.isConjunta
      ? `<span class="desp-conjunta-badge" title="Dividida 50/50 — Meu Bolso: ${formatarMoeda(d.valorAlocado ?? d.valor / 2)}">👫 conjunta</span>`
      : '';

    return `
    <div class="desp-item card${isProj ? ' desp-item--proj' : ''}">
      <div class="desp-item-left">
        ${badge}
        <span class="desp-item-descricao">${d.descricao}</span>
        <div class="desp-item-meta">
          <span class="desp-item-data">${dataFmt}</span>
          ${portBadge}${parcelaBadge}${projBadge}${conjuntaBadge}
        </div>
      </div>
      <div class="desp-item-right">
        <span class="desp-item-valor${isProj ? ' desp-item-valor--proj' : ''}">${formatarMoeda(d.valor)}</span>
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
  const reais  = _despesas.filter(d => d.tipo !== 'projecao');
  const total  = reais.reduce((s, d) => s + d.valor, 0);
  const count  = reais.length;
  const chipTotal = document.getElementById('chip-total');
  const chipCount = document.getElementById('chip-count');
  if (chipTotal) chipTotal.textContent = formatarMoeda(total);
  if (chipCount) chipCount.textContent = count;

  // NRF-001: "Meu Bolso" = individuais + valorAlocado das conjuntas
  const meuBolso = reais.reduce((s, d) => {
    if (d.isConjunta) return s + (d.valorAlocado ?? d.valor / 2);
    return s + d.valor;
  }, 0);
  const chipMB    = document.getElementById('chip-meu-bolso');
  const chipMBVal = document.getElementById('chip-meu-bolso-valor');
  if (chipMB && chipMBVal) {
    const hasConjunta = reais.some(d => d.isConjunta);
    chipMB.style.display = hasConjunta ? '' : 'none';
    chipMBVal.textContent = formatarMoeda(meuBolso);
  }
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
    cats.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (atual) sel.value = atual;
}

function preencherFiltroCategorias(cats) {
  const sel = document.getElementById('filtro-categoria');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Modal de Despesa ─────────────────────────────────────────
function abrirModalDespesa(despesa = null) {
  preencherSelectCategorias(_categorias);
  preencherDropdownResponsavel();

  document.getElementById('despesa-id').value        = despesa?.id ?? '';
  document.getElementById('despesa-descricao').value = despesa?.descricao ?? '';
  document.getElementById('despesa-valor').value     = despesa?.valor ?? '';
  document.getElementById('despesa-categoria').value = despesa?.categoriaId ?? '';
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
  if (despesa) {
    const radioVal = despesa.isConjunta ? 'conjunta' : 'individual';
    const radioEl  = document.querySelector(`[name="despesa-tipo"][value="${radioVal}"]`);
    if (radioEl) radioEl.checked = true;
  } else {
    // Auto-seleciona só se a categoria tiver isConjuntaPadrao definido explicitamente
    const catId = document.getElementById('despesa-categoria').value;
    const cat   = _categorias.find(c => c.id === catId);
    if (cat?.isConjuntaPadrao !== undefined) {
      const val = cat.isConjuntaPadrao ? 'conjunta' : 'individual';
      const r   = document.querySelector(`[name="despesa-tipo"][value="${val}"]`);
      if (r) r.checked = true;
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
    const dados = {
      descricao:    document.getElementById('despesa-descricao').value.trim(),
      valor,
      categoriaId:  document.getElementById('despesa-categoria').value,
      data:         new Date(document.getElementById('despesa-data').value + 'T12:00:00'),
      responsavel,      // RF-014 — agora obrigatório
      // NRF-001: divisão conjunta
      isConjunta,
      valorAlocado: isConjunta ? Math.round(valor * 100 / 2) / 100 : undefined,
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

  // NRF-001: auto-toggle conjunta ao mudar categoria no modal
  document.getElementById('despesa-categoria')?.addEventListener('change', () => {
    const catId = document.getElementById('despesa-categoria').value;
    const cat   = _categorias.find(c => c.id === catId);
    if (cat?.isConjuntaPadrao !== undefined) {
      const valCat = cat.isConjuntaPadrao ? 'conjunta' : 'individual';
      const rCat = document.querySelector(`[name="despesa-tipo"][value="${valCat}"]`);
      if (rCat) rCat.checked = true;
    }
    atualizarPreviewConjunta();
  });
  // NRF-001: atualiza preview quando toggle ou valor mudam
  document.querySelectorAll('[name="despesa-tipo"]').forEach(r =>
    r.addEventListener('change', atualizarPreviewConjunta)
  );
  document.getElementById('despesa-valor')?.addEventListener('input', atualizarPreviewConjunta);

  // Exportar CSV
  document.getElementById('btn-exportar-csv')?.addEventListener('click', () => exportarCSV());

  // RF-014: toggle painel parcelamentos (header interno)
  document.getElementById('parc-toggle')?.addEventListener('click', () => {
    const body = document.getElementById('parc-body-desp');
    if (body) body.classList.toggle('parc-body--collapsed');
    const icon = document.querySelector('#parc-toggle .parc-toggle-icon');
    if (icon) icon.textContent = body?.classList.contains('parc-body--collapsed') ? '▸' : '▾';
  });

  // CT-009.5: botão externo de visibilidade do painel de parcelamentos
  document.getElementById('btn-ver-parc-desp')?.addEventListener('click', () => {
    const widget = document.getElementById('parc-widget');
    if (!widget) return;
    if (widget.classList.contains('hidden')) {
      widget.classList.remove('hidden');
      // Expande o body caso esteja colapsado
      const body = document.getElementById('parc-body-desp');
      if (body) body.classList.remove('parc-body--collapsed');
      const icon = document.querySelector('#parc-toggle .parc-toggle-icon');
      if (icon) icon.textContent = '▾';
      // Mostra empty-state se não houver lista
      const lista = document.getElementById('parc-lista-desp');
      if (lista && !lista.querySelector('.parc-resp-row')) {
        lista.innerHTML = '<p class="empty-state" style="font-size:.85rem;padding:.5rem 0;">Nenhum parcelamento em aberto no momento.</p>';
      }
    } else {
      widget.classList.add('hidden');
    }
    widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// ── Exportação CSV ────────────────────────────────────────────
function exportarCSV() {
  const exportaveis = _despesas.filter(d => d.tipo !== 'projecao');
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
