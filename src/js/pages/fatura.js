// ============================================================
// PAGE: Fatura do Cartão — NRF-005
//
// Visualização mensal da fatura do cartão de crédito com:
//  • Segregação por responsável (individual vs conjunta)
//  • Separação à vista / parcelado
//  • Cálculo do total a pagar por pessoa
//  • Projeções de parcelas futuras (6 meses)
//  • Exportação para Excel (substituindo a planilha manual)
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil, buscarGrupo, ouvirContas, ouvirCategorias, ouvirDespesas, ouvirDespesasPorMesFatura, garantirContasPadrao, buscarPagamentosFaturaCartao } from '../services/database.js';
import { formatarMoeda, formatarData, nomeMes, escHTML } from '../utils/formatters.js';
import { recalcularScoreFatura } from '../utils/reconciliadorFatura.js';
import { skeletonTableRows, skeletonChart, errorStateHTML, emptyStateHTML } from '../utils/skeletons.js';
import { CONTAS_PADRAO } from '../models/Conta.js';
import { iniciar as iniciarProjecoes } from '../utils/projecoesCartao.js';

// ── Ícones SVG para empty states ──────────────────────────────
const SVG_INBOX = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
const SVG_FILTER_EMPTY = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2" y1="3" x2="22" y2="3"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="10" y1="15" x2="14" y2="15"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="18" y1="12" x2="22" y2="16"/><line x1="22" y1="12" x2="18" y2="16"/></svg>';

// ── Estado ────────────────────────────────────────────────────
let _usuario    = null;
let _grupoId    = null;
let _grupo      = null;
let _mes        = new Date().getMonth() + 1;
let _ano        = new Date().getFullYear();
let _contas     = [];
let _contaMap   = {};
let _categorias = [];
let _catMap     = {};
let _despesas   = [];        // despesas do mês filtradas pelo cartão
let _cartaoId   = '';        // contaId do cartão selecionado
let _tabAtiva   = 'todas';
let _tabInicial = null;      // RF-065: tab a ativar na primeira renderização (via URL ?tab=)

let _unsubContas        = null;
let _unsubCats          = null;
let _unsubDesp          = null;
let _unsubDespMesFatura = null;  // BUG-022: listener paralelo por mesFatura
let _unsubProjecoes     = [];    // NRF-NAV F2: listeners do módulo projecoesCartao

// ── Inicialização ─────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = '../login.html'; return; }
  _usuario = user;

  let perfil;
  try { perfil = await buscarPerfil(user.uid); } catch (_) { window.location.href = '../login.html'; return; }
  if (!perfil?.grupoId) { window.location.href = '../grupo.html'; return; }

  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;
  document.getElementById('btn-logout').addEventListener('click', () => logout().then(() => { window.location.href = '../login.html'; }));

  _grupo = await buscarGrupo(_grupoId);

  configurarEventos();
  atualizarTituloMes();

  // Garante que contas padrão existam (ex: usuário que nunca visitou o dashboard)
  await garantirContasPadrao(_grupoId, CONTAS_PADRAO).catch(() => {});

  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats;
    _catMap = Object.fromEntries(cats.map(c => [c.id, c]));
    if (_despesas.length) renderizarTudo();
  });

  _unsubContas = ouvirContas(_grupoId, (contas) => {
    _contas = contas;
    _contaMap = Object.fromEntries(contas.map(c => [c.id, c]));
    preencherSeletorCartao();
  });
});

// ── Configuração de eventos ───────────────────────────────────
function configurarEventos() {
  // RF-065: se URL contém ?tab=projecoes (link do card Próxima Fatura no dashboard),
  // ativar a tab Projeções na primeira renderização dos dados.
  const tabParam = new URLSearchParams(window.location.search).get('tab');
  if (['todas', 'projecoes', 'conjuntas', 'liquidacao'].includes(tabParam)) {
    _tabAtiva   = tabParam;
    _tabInicial = tabParam;
  }

  document.getElementById('btn-mes-ant').addEventListener('click', () => {
    _mes--; if (_mes < 1) { _mes = 12; _ano--; }
    atualizarTituloMes();
    recarregarDespesas();
  });
  document.getElementById('btn-mes-prox').addEventListener('click', () => {
    _mes++; if (_mes > 12) { _mes = 1; _ano++; }
    atualizarTituloMes();
    recarregarDespesas();
  });
  document.getElementById('sel-cartao').addEventListener('change', (e) => {
    _cartaoId = e.target.value;
    recarregarDespesas();
  });
  document.getElementById('btn-exportar').addEventListener('click', exportarExcel);
  document.getElementById('fat-busca').addEventListener('input', () => renderizarTabela('todas'));

  // Tabs (delegação)
  document.querySelector('.fat-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.fat-tab');
    if (!btn) return;
    const tab = btn.dataset.tab;
    if (tab) ativarTab(tab);
  });
}

// ── Selector de cartão ────────────────────────────────────────
function preencherSeletorCartao() {
  const sel = document.getElementById('sel-cartao');
  const anterior = sel.value;
  // RF-062: mostra cartões reais + legado (backward compat)
  const cartoes = _contas.filter(c => c.tipo === 'cartao');
  sel.innerHTML = '<option value="">— selecione —</option>' +
    cartoes.map(c => {
      const tag = c._legado ? ' (legado)' : '';
      return `<option value="${escHTML(c.id)}">${escHTML(c.emoji)} ${escHTML(c.nome)}${escHTML(tag)}</option>`;
    }).join('');
  if (anterior && cartoes.find(c => c.id === anterior)) {
    sel.value = anterior;
    _cartaoId = anterior;
  }
  // Auto-seleciona o primeiro cartão real (não-legado) ou legado como fallback
  if (!_cartaoId) {
    const real = cartoes.find(c => !c._legado);
    const cartao = real ?? cartoes[0];
    if (cartao) { sel.value = cartao.id; _cartaoId = cartao.id; recarregarDespesas(); }
  }
}

// ── Listener de despesas ──────────────────────────────────────
// BUG-022: usa dois listeners — mês calendário (backward compat) + mesFatura (ciclo de faturamento).
// Transações com data em meses adjacentes mas pertencentes a este ciclo ficam visíveis.
function recarregarDespesas() {
  if (_unsubDesp)          { _unsubDesp();          _unsubDesp = null; }
  if (_unsubDespMesFatura) { _unsubDespMesFatura();  _unsubDespMesFatura = null; }
  if (!_cartaoId) {
    _despesas = [];
    mostrarEmpty(true);
    return;
  }
  mostrarEmpty(false);
  const mesFaturaStr = String(_ano) + '-' + String(_mes).padStart(2, '0');
  let _calendarSet   = [];
  let _mesFaturaSet  = [];

  // Skeleton enquanto dados carregam
  const tbody = document.getElementById('fat-tbody-todas');
  if (tbody) tbody.innerHTML = skeletonTableRows(6, 8);

  function _merge() {
    const seen = new Set();
    _despesas = [..._calendarSet, ..._mesFaturaSet].filter(d => {
      if (d.tipo === 'projecao' || d.tipo === 'projecao_paga') return false;  // BUG-023
      if (d.contaId !== _cartaoId) return false;
      if (seen.has(d.id))           return false;
      seen.add(d.id);
      return true;
    });
    renderizarTudo();
    carregarProjecoes();
  }

  try {
    _unsubDesp = ouvirDespesas(_grupoId, _mes, _ano, (todas) => {
      _calendarSet = todas;
      _merge();
    });

    _unsubDespMesFatura = ouvirDespesasPorMesFatura(_grupoId, mesFaturaStr, (todas) => {
      _mesFaturaSet = todas;
      _merge();
    });
  } catch (err) {
    console.error('Erro ao ouvir fatura:', err);
    const conteudo = document.getElementById('fat-conteudo');
    if (conteudo) {
      conteudo.innerHTML = errorStateHTML('Erro ao carregar fatura', 'Verifique sua conexão e tente novamente.');
      conteudo.querySelector('.error-retry')?.addEventListener('click', recarregarDespesas);
    }
  }
}

// ── Render principal ──────────────────────────────────────────
function renderizarTudo() {
  // ENH-007 Cenário A — cartão selecionado mas período sem despesas
  if (!_despesas.length) {
    mostrarEmpty(true, 'semDados');
    return;
  }
  mostrarEmpty(false);
  const membros = _membrosDoGrupo();
  renderizarCards(membros);
  gerarTabsMembros(membros);
  renderizarTabela('todas');
  renderizarTabela('conjuntas');
  membros.forEach(m => renderizarTabela(m.key));
  renderizarResumoDetalhado(membros);
  document.getElementById('fat-resumo-cards').style.display = '';
  const conteudo = document.getElementById('fat-conteudo');
  if (conteudo) { conteudo.style.display = ''; conteudo.classList.add('fade-in'); }
  // RF-065: ativar tab inicial (via ?tab= URL param) apenas uma vez
  if (_tabInicial) {
    ativarTab(_tabInicial);
    _tabInicial = null;
  }
}

// ── Membros do grupo ──────────────────────────────────────────
function _membrosDoGrupo() {
  if (_grupo?.nomesMembros) {
    return Object.entries(_grupo.nomesMembros).map(([uid, nome]) => ({
      uid, nome, key: nome.split(' ')[0].toLowerCase()
    }));
  }
  // Fallback: inferir dos dados de despesas
  const nomes = [...new Set(
    _despesas
      .filter(d => !d.isConjunta && (d.responsavel || d.portador))
      .map(d => d.responsavel || d.portador || '')
      .filter(Boolean)
  )];
  return nomes.map(nome => ({ uid: nome, nome, key: nome.split(' ')[0].toLowerCase() }));
}

// ── Cards de resumo ───────────────────────────────────────────
function renderizarCards(membros) {
  const totais = calcularTotais(membros);

  document.getElementById('fat-total').textContent = formatarMoeda(totais.grand);
  document.getElementById('fat-total-sub').textContent =
    `${_despesas.length} transações · ${_despesas.filter(d => d.parcela && d.parcela !== '-').length} parceladas`;

  const container = document.getElementById('fat-cards-membros');
  container.innerHTML = membros.map(m => {
    const t = totais.porMembro[m.key] ?? { individual: 0, conjunta: 0, total: 0 };
    return `
      <div class="fat-card fat-card--membro">
        <div class="fat-card-label">${escHTML(m.nome.split(' ')[0])}</div>
        <div class="fat-card-valor">${formatarMoeda(t.total)}</div>
        <div class="fat-card-sub">
          Indiv: ${formatarMoeda(t.individual)} + Conj: ${formatarMoeda(t.conjunta)}
        </div>
      </div>`;
  }).join('');
}

// ── Cálculo de totais ─────────────────────────────────────────
function calcularTotais(membros) {
  const conjuntas = _despesas.filter(d => d.isConjunta);
  const totalConj = conjuntas.reduce((s, d) => s + (d.valor ?? 0), 0);
  const splitConj = totalConj / 2; // Assumindo 2 membros 50/50

  const porMembro = {};
  membros.forEach(m => {
    const individuais = _despesas.filter(d =>
      !d.isConjunta &&
      (d.responsavel || d.portador || '').toLowerCase().startsWith(m.key)
    );
    const totalInd = individuais.reduce((s, d) => s + (d.valor ?? 0), 0);
    const totalConjMembro = conjuntas.reduce((s, d) => s + (d.valorAlocado ?? (d.valor ?? 0) / 2), 0);
    porMembro[m.key] = {
      individual: totalInd,
      conjunta: totalConjMembro,
      total: totalInd + totalConjMembro,
      despesas: individuais,
    };
  });

  const grand = membros.length > 0
    ? Object.values(porMembro).reduce((s, m) => s + m.total, 0)
    : _despesas.reduce((s, d) => s + (d.valor ?? 0), 0);

  return { grand, porMembro, totalConj, splitConj };
}

// ── Tabs dinâmicas por membro ─────────────────────────────────
function gerarTabsMembros(membros) {
  // Tabs
  const tabsContainer = document.getElementById('fat-tabs-membros');
  tabsContainer.innerHTML = membros.map(m =>
    `<button class="fat-tab${_tabAtiva === m.key ? ' fat-tab--active' : ''}" data-tab="${escHTML(m.key)}">
      ${escHTML(m.nome.split(' ')[0])}
    </button>`
  ).join('');

  // Conteúdo das tabs por membro
  const container = document.getElementById('fat-tab-membros-container');
  container.innerHTML = membros.map(m => `
    <div id="fat-tab-${escHTML(m.key)}" class="fat-tab-content${_tabAtiva === m.key ? ' fat-tab-content--active' : ''}">
      <div class="card">
        <div class="fat-table-header">
          <span class="fat-table-title">Despesas — ${escHTML(m.nome.split(' ')[0])}</span>
        </div>
        <div class="fat-table-wrap">
          <table class="fat-table">
            <thead><tr>
              <th>Data</th><th>Estabelecimento</th><th>Tipo</th>
              <th>Parcela</th><th>Categoria</th>
              <th class="fat-th-valor">Valor</th>
            </tr></thead>
            <tbody id="fat-tbody-${escHTML(m.key)}"></tbody>
          </table>
        </div>
      </div>
    </div>`
  ).join('');
}

// ── Render de tabelas ─────────────────────────────────────────
function renderizarTabela(tipo) {
  const busca = (document.getElementById('fat-busca')?.value ?? '').toLowerCase();

  if (tipo === 'todas') {
    const tbody = document.getElementById('fat-tbody-todas');
    if (!tbody) return;
    const rows = _despesas
      .filter(d => !busca || (d.descricao ?? '').toLowerCase().includes(busca))
      .sort((a, b) => _toTs(b.data) - _toTs(a.data));
    if (!rows.length) {
      if (busca && _despesas.length) {
        // ENH-007 Cenário B — filtro sem resultado
        tbody.innerHTML = `<tr><td colspan="8">
          <div class="empty-state empty-state--compact" role="status">
            <span class="empty-state__icon" aria-hidden="true">${SVG_FILTER_EMPTY}</span>
            <p class="empty-state__title">Nenhum resultado com os filtros aplicados.</p>
            <p class="empty-state__hint">Ajuste a busca ou limpe para ver todos os lançamentos.</p>
            <div class="empty-state__cta">
              <button class="btn btn-outline btn-sm fat-busca-limpar">Limpar busca</button>
            </div>
          </div>
        </td></tr>`;
        tbody.querySelector('.fat-busca-limpar')?.addEventListener('click', () => {
          const inp = document.getElementById('fat-busca');
          if (inp) { inp.value = ''; renderizarTabela('todas'); }
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="8" class="fat-td-empty">Nenhuma transação</td></tr>';
      }
      return;
    }
    tbody.innerHTML = rows.map(d => _rowTodas(d)).join('');
    return;
  }

  if (tipo === 'conjuntas') {
    const tbody = document.getElementById('fat-tbody-conjuntas');
    if (!tbody) return;
    const conj = _despesas.filter(d => d.isConjunta).sort((a, b) => _toTs(b.data) - _toTs(a.data));
    tbody.innerHTML = conj.map(d => `
      <tr>
        <td>${formatarData(d.data?.toDate?.() ?? d.data)}</td>
        <td class="fat-td-estab">${escHTML(d.descricao ?? '—')}</td>
        <td><span class="fat-badge fat-badge--${d.parcela && d.parcela !== '-' ? 'parc' : 'vista'}">${d.parcela && d.parcela !== '-' ? 'P' : 'V'}</span></td>
        <td>${d.parcela && d.parcela !== '-' ? escHTML(d.parcela) : '—'}</td>
        <td>${escHTML(_catMap[d.categoriaId]?.nome ?? '—')}</td>
        <td class="fat-td-valor">${formatarMoeda(d.valor)}</td>
        <td class="fat-td-valor fat-td-split">${formatarMoeda(d.valorAlocado ?? (d.valor ?? 0) / 2)}</td>
      </tr>`).join('') || '<tr><td colspan="7" class="fat-td-empty">Nenhuma despesa conjunta</td></tr>';

    // Footer com total conjuntas
    const totalConj = conj.reduce((s, d) => s + (d.valor ?? 0), 0);
    const por = conj.reduce((s, d) => s + (d.valorAlocado ?? (d.valor ?? 0) / 2), 0);
    document.getElementById('fat-conjuntas-footer').innerHTML =
      `<span class="fat-footer-label">Total:</span>
       <span class="fat-footer-valor">${formatarMoeda(totalConj)}</span>
       <span class="fat-footer-sep">→ por pessoa:</span>
       <span class="fat-footer-valor fat-footer-split">${formatarMoeda(por)}</span>`;
    return;
  }

  // Tab de membro individual
  const tbody = document.getElementById(`fat-tbody-${tipo}`);
  if (!tbody) return;
  const rows = _despesas
    .filter(d => !d.isConjunta && (d.responsavel || d.portador || '').toLowerCase().startsWith(tipo))
    .sort((a, b) => _toTs(b.data) - _toTs(a.data));
  tbody.innerHTML = rows.map(d => `
    <tr>
      <td>${formatarData(d.data?.toDate?.() ?? d.data)}</td>
      <td class="fat-td-estab">${escHTML(d.descricao ?? '—')}</td>
      <td><span class="fat-badge fat-badge--${d.parcela && d.parcela !== '-' ? 'parc' : 'vista'}">${d.parcela && d.parcela !== '-' ? 'P' : 'V'}</span></td>
      <td>${d.parcela && d.parcela !== '-' ? escHTML(d.parcela) : '—'}</td>
      <td>${escHTML(_catMap[d.categoriaId]?.nome ?? '—')}</td>
      <td class="fat-td-valor">${formatarMoeda(d.valor)}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="fat-td-empty">Nenhuma despesa individual</td></tr>';
}

function _rowTodas(d) {
  const isConj = d.isConjunta;
  const resp   = isConj ? '👫 Conjunta' : (d.responsavel || d.portador || '—');
  const mesBol = isConj ? (d.valorAlocado ?? (d.valor ?? 0) / 2) : (d.valor ?? 0);
  const tipo   = d.parcela && d.parcela !== '-' ? 'P' : 'V';
  return `<tr class="${isConj ? 'fat-tr-conjunta' : ''}">
    <td>${formatarData(d.data?.toDate?.() ?? d.data)}</td>
    <td class="fat-td-estab">${escHTML(d.descricao ?? '—')}</td>
    <td><span class="fat-resp-chip">${escHTML(resp.split(' ')[0])}</span></td>
    <td><span class="fat-badge fat-badge--${tipo === 'P' ? 'parc' : 'vista'}">${tipo}</span></td>
    <td>${d.parcela && d.parcela !== '-' ? escHTML(d.parcela) : '—'}</td>
    <td>${escHTML(_catMap[d.categoriaId]?.nome ?? '—')}</td>
    <td class="fat-td-valor">${formatarMoeda(d.valor)}</td>
    <td class="fat-td-valor ${isConj ? 'fat-td-split' : ''}">${formatarMoeda(mesBol)}</td>
  </tr>`;
}

// ── Resumo detalhado por pessoa ───────────────────────────────
function renderizarResumoDetalhado(membros) {
  const totais = calcularTotais(membros);
  const rows = document.getElementById('fat-resumo-rows');
  rows.innerHTML = membros.map(m => {
    const t = totais.porMembro[m.key] ?? { individual: 0, conjunta: 0, total: 0 };
    const vistaInd = (t.despesas ?? []).filter(d => !d.parcela || d.parcela === '-').reduce((s, d) => s + (d.valor ?? 0), 0);
    const parcInd  = (t.despesas ?? []).filter(d => d.parcela && d.parcela !== '-').reduce((s, d) => s + (d.valor ?? 0), 0);
    return `
      <div class="fat-resumo-membro">
        <div class="fat-resumo-membro-nome">${escHTML(m.nome.split(' ')[0])}</div>
        <div class="fat-resumo-linha">
          <span>Individuais à vista</span><span>${formatarMoeda(vistaInd)}</span>
        </div>
        <div class="fat-resumo-linha">
          <span>Individuais parceladas</span><span>${formatarMoeda(parcInd)}</span>
        </div>
        <div class="fat-resumo-linha">
          <span>Conjuntas (50%)</span><span>${formatarMoeda(t.conjunta)}</span>
        </div>
        <div class="fat-resumo-linha fat-resumo-total">
          <span>Total a pagar</span><span>${formatarMoeda(t.total)}</span>
        </div>
      </div>`;
  }).join('');
}

// ── Projeções futuras ─────────────────────────────────────────
function carregarProjecoes() {
  _unsubProjecoes.forEach(fn => fn());
  _unsubProjecoes = [];

  const container = document.getElementById('fat-proj-content');
  container.innerHTML = skeletonChart(120);
  if (!_cartaoId) { container.innerHTML = '<p class="fat-loading">Selecione um cartão.</p>'; return; }

  const membros = _membrosDoGrupo();

  _unsubProjecoes = iniciarProjecoes(_grupoId, _cartaoId, _mes, _ano, (dadosPorMes) => {
    // Enriquecer com porMembro antes de renderizar
    Object.values(dadosPorMes).forEach(entry => {
      entry.porMembro = {};
      membros.forEach(memb => {
        const ind  = entry.despesas.filter(d => !d.isConjunta && (d.responsavel || d.portador || '').toLowerCase().startsWith(memb.key));
        const conj = entry.despesas.filter(d => d.isConjunta);
        const tInd  = ind.reduce((s, d) => s + (d.valor ?? 0), 0);
        const tConj = conj.reduce((s, d) => s + (d.valorAlocado ?? (d.valor ?? 0) / 2), 0);
        entry.porMembro[memb.key] = tInd + tConj;
      });
      entry.total = Object.values(entry.porMembro).reduce((s, v) => s + v, 0);
    });
    renderizarProjecoes(dadosPorMes, membros);
  });
}

function renderizarProjecoes(projecoesPorMes, membros) {
  const container = document.getElementById('fat-proj-content');
  const meses = Object.values(projecoesPorMes).sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes);

  const temDados = meses.some(m => m.total > 0);
  if (!temDados) {
    container.innerHTML = '<p class="fat-loading fat-loading--ok">✅ Nenhuma parcela futura encontrada para este cartão.</p>';
    return;
  }

  const cols = membros.map(m => `<th class="fat-th-valor">${escHTML(m.nome.split(' ')[0])}</th>`).join('');
  const rows = meses.map(m => {
    if (m.total === 0) return '';
    const memCols = membros.map(memb =>
      `<td class="fat-td-valor">${formatarMoeda(m.porMembro[memb.key] ?? 0)}</td>`
    ).join('');
    return `<tr>
      <td>${nomeMes(m.mes)} ${m.ano}</td>
      ${memCols}
      <td class="fat-td-valor fat-td-total-proj">${formatarMoeda(m.total)}</td>
    </tr>`;
  }).filter(Boolean).join('');

  container.innerHTML = `
    <div class="fat-table-wrap">
      <table class="fat-table">
        <thead><tr>
          <th>Mês</th>${cols}<th class="fat-th-valor">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="fat-proj-link-futuro">
      <a href="fluxo-caixa.html#compromissos" class="link-sutil"ver todos os cartões consolidados em Futuro →</a>
    </p>`;
}

// ── Tabs ──────────────────────────────────────────────────────
function ativarTab(tab) {
  _tabAtiva = tab;
  document.querySelectorAll('.fat-tab').forEach(b => b.classList.toggle('fat-tab--active', b.dataset.tab === tab));
  // Esconde todos os conteúdos
  document.querySelectorAll('.fat-tab-content').forEach(el => el.classList.remove('fat-tab-content--active'));
  // Mostra o ativo
  const alvo = tab === 'conjuntas'   ? document.getElementById('fat-tab-conjuntas')
    : tab === 'projecoes'           ? document.getElementById('fat-tab-projecoes')
    : tab === 'liquidacao'          ? document.getElementById('fat-tab-liquidacao')
    : tab === 'todas'               ? document.getElementById('fat-tab-todas')
    : document.getElementById(`fat-tab-${tab}`);
  if (tab === 'liquidacao') renderizarLiquidacao();
  if (alvo) alvo.classList.add('fat-tab-content--active');
}

// ── Exportação para Excel ─────────────────────────────────────
function exportarExcel() {
  if (typeof XLSX === 'undefined') { console.error('[fatura] SheetJS não carregado'); return; }
  if (!_despesas.length) return;

  const membros = _membrosDoGrupo();
  const totais  = calcularTotais(membros);
  const wb      = XLSX.utils.book_new();
  const cartao  = _contaMap[_cartaoId]?.nome ?? 'Cartão';
  const titulo  = `${cartao} — ${nomeMes(_mes)} ${_ano}`;

  // ── Aba Transações ──────────────────────────────────────────
  const header = ['Data', 'Estabelecimento', 'Responsável', 'Tipo', 'Parcela', 'Categoria', 'Valor', 'Meu Bolso'];
  const linhas = _despesas
    .sort((a, b) => _toTs(b.data) - _toTs(a.data))
    .map(d => {
      const tipo   = d.parcela && d.parcela !== '-' ? 'P' : 'V';
      const resp   = d.isConjunta ? 'Conjunta (50/50)' : (d.responsavel || d.portador || '—');
      const mesBol = d.isConjunta ? (d.valorAlocado ?? (d.valor ?? 0) / 2) : (d.valor ?? 0);
      return [
        formatarData(d.data?.toDate?.() ?? d.data),
        d.descricao ?? '',
        resp,
        tipo,
        d.parcela && d.parcela !== '-' ? d.parcela : '—',
        _catMap[d.categoriaId]?.nome ?? '',
        d.valor ?? 0,
        mesBol,
      ];
    });

  const wsTransacoes = XLSX.utils.aoa_to_sheet([[titulo], [], header, ...linhas]);
  wsTransacoes['!cols'] = [{ wch: 12 }, { wch: 36 }, { wch: 22 }, { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações');

  // ── Aba Resumo ──────────────────────────────────────────────
  const resumoRows = [
    [`Resumo — ${titulo}`], [],
    ['Pessoa', 'Individual', 'Conjunta (50%)', 'Total a Pagar'],
  ];
  membros.forEach(m => {
    const t = totais.porMembro[m.key] ?? { individual: 0, conjunta: 0, total: 0 };
    resumoRows.push([m.nome.split(' ')[0], t.individual, t.conjunta, t.total]);
  });
  resumoRows.push([], ['Total Fatura', '', '', totais.grand]);

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
  wsResumo['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // ── Aba Conjuntas ───────────────────────────────────────────
  const conjHeader = ['Data', 'Estabelecimento', 'Tipo', 'Parcela', 'Categoria', 'Valor Total', 'Por Pessoa'];
  const conjLinhas = _despesas
    .filter(d => d.isConjunta)
    .sort((a, b) => _toTs(b.data) - _toTs(a.data))
    .map(d => [
      formatarData(d.data?.toDate?.() ?? d.data),
      d.descricao ?? '',
      d.parcela && d.parcela !== '-' ? 'P' : 'V',
      d.parcela && d.parcela !== '-' ? d.parcela : '—',
      _catMap[d.categoriaId]?.nome ?? '',
      d.valor ?? 0,
      d.valorAlocado ?? (d.valor ?? 0) / 2,
    ]);
  const wsConj = XLSX.utils.aoa_to_sheet([conjHeader, ...conjLinhas]);
  wsConj['!cols'] = [{ wch: 12 }, { wch: 36 }, { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsConj, 'Conjuntas');

  XLSX.writeFile(wb, `fatura-${cartao.toLowerCase().replace(/\s+/g, '-')}-${_ano}-${String(_mes).padStart(2, '0')}.xlsx`);
}

// ── Helpers ───────────────────────────────────────────────────
function atualizarTituloMes() {
  document.getElementById('fat-mes-titulo').textContent = `${nomeMes(_mes)} ${_ano}`;
}

/**
 * @param {boolean} show
 * @param {'semCartao'|'semDados'} [tipo='semCartao']
 */
function mostrarEmpty(show, tipo = 'semCartao') {
  const el = document.getElementById('fat-empty');
  if (show) {
    if (tipo === 'semDados') {
      // ENH-007 Cenário A — cartão selecionado mas sem despesas no período
      el.innerHTML = emptyStateHTML(
        SVG_INBOX,
        `Nenhuma despesa em ${escHTML(nomeMes(_mes))}/${_ano}.`,
        'Importe um extrato da fatura ou adicione uma despesa manualmente.',
        `<a href="importar.html" class="btn btn-primary btn-sm">Importar extrato</a>
         <a href="despesas.html" class="btn btn-outline btn-sm">Adicionar despesa</a>`
      );
    } else {
      el.innerHTML = `
        <div class="fat-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
        <p>Selecione um cartão para visualizar a fatura do mês.</p>`;
    }
  }
  el.style.display = show ? '' : 'none';
  document.getElementById('fat-resumo-cards').style.display = show ? 'none' : '';
  document.getElementById('fat-conteudo').style.display     = show ? 'none' : '';
}

function _toTs(data) {
  if (!data) return 0;
  if (typeof data.toDate === 'function') return data.toDate().getTime();
  if (data instanceof Date) return data.getTime();
  return new Date(data).getTime();
}

// ── RF-064: Aba de Liquidação da Fatura ──────────────────────
/**
 * Renderiza o painel de liquidação: mostra se o ciclo atual tem pagamentos
 * de fatura associados e o status de reconciliação.
 */
async function renderizarLiquidacao() {
  const container = document.getElementById('fat-liquidacao-content');
  if (!container) return;

  if (!_cartaoId) {
    container.innerHTML = '<p class="fat-empty-text">Selecione um cartão para ver os dados de liquidação.</p>';
    return;
  }

  container.innerHTML = '<p class="fat-empty-text">Carregando…</p>';

  // Despesas reais (excluindo projeções) do ciclo desta fatura — já em _despesas
  const despesasReais = _despesas.filter(d =>
    d.tipo === 'despesa' || d.tipo === 'projecao_paga'
  );
  const totalFatura = despesasReais.reduce((s, d) => s + (d.valor ?? 0), 0);

  // BUG-035: pagamento_fatura tem contaId = conta bancária (não o cartão), portanto
  // _despesas nunca os inclui (filtro d.contaId !== _cartaoId em _merge()).
  // Query dedicada por contaCartaoId garante que os pagamentos apareçam.
  let candidatos = [];
  try {
    candidatos = await buscarPagamentosFaturaCartao(_grupoId, _cartaoId);
  } catch (err) {
    console.error('[fatura] Erro ao buscar pagamentos de fatura:', err);
  }

  // Janela temporal: ±2 meses do ciclo. Evita mostrar pagamentos de outros anos.
  const janelainicio = new Date(_ano, _mes - 2, 1);
  const janelaFim   = new Date(_ano, _mes + 2, 1);
  const pagamentos  = candidatos.filter(p => {
    const dt = p.data?.toDate?.() ?? (p.data instanceof Date ? p.data : new Date(p.data));
    return !isNaN(dt?.getTime()) && dt >= janelainicio && dt <= janelaFim;
  });

  if (pagamentos.length === 0) {
    const aviso = totalFatura > 0
      ? `<div class="fat-liquidacao-alert fat-liquidacao-alert--warn">
          <span>⚠️</span>
          <div>
            <strong>Fatura em aberto</strong>
            <p>Total do ciclo: <strong>${escHTML(formatarMoeda(totalFatura))}</strong>. Nenhum pagamento de fatura detectado para este ciclo. Ao importar o extrato bancário com o débito do PAG FATURA, ele será vinculado automaticamente.</p>
          </div>
        </div>`
      : '<p class="fat-empty-text">Nenhuma despesa ou pagamento de fatura registrado para este ciclo.</p>';
    container.innerHTML = aviso;
    return;
  }

  const rows = pagamentos.map((p) => {
    const { score, status, isParcial } = recalcularScoreFatura(p, totalFatura);
    const statusLabel = {
      auto:     '<span class="fat-badge fat-badge--ok">✅ Auto ✲</span>',
      pendente: '<span class="fat-badge fat-badge--warn">⏳ Pendente</span>',
      ignorado: '<span class="fat-badge fat-badge--neutral">— Ignorado</span>',
    }[status] ?? '';
    const dataPag = p.data?.toDate?.() ?? (p.data instanceof Date ? p.data : new Date(p.data));
    const dataStr = isNaN(dataPag?.getTime()) ? '—' : formatarData(dataPag);
    const parcialBadge = isParcial ? ' <span class="fat-badge fat-badge--warn">Parcial</span>' : '';
    return `<tr>
      <td>${escHTML(dataStr)}</td>
      <td>${escHTML(p.descricao ?? '')}</td>
      <td class="fat-valor">${escHTML(formatarMoeda(p.valor ?? 0))}</td>
      <td>${statusLabel}${parcialBadge}</td>
      <td class="fat-score">${score}/100</td>
    </tr>`;
  }).join('');

  const totalPago = pagamentos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const diff = totalFatura - totalPago;
  const diffClass = Math.abs(diff) < 0.01 ? 'fat-liquidacao-alert--ok'
    : diff > 0 ? 'fat-liquidacao-alert--warn'
    : 'fat-liquidacao-alert--info';
  const diffMsg = Math.abs(diff) < 0.01
    ? '✅ Fatura totalmente liquidada'
    : diff > 0
      ? `⚠️ Diferença: ${escHTML(formatarMoeda(diff))} ainda não pago`
      : `ℹ️ Pago a mais: ${escHTML(formatarMoeda(Math.abs(diff)))} (pode incluir outros ciclos)`;

  container.innerHTML = `
    <div class="fat-liquidacao-alert ${escHTML(diffClass)}">
      <span>${diffMsg}</span>
      <small>Total fatura: ${escHTML(formatarMoeda(totalFatura))} · Total pago: ${escHTML(formatarMoeda(totalPago))}</small>
    </div>
    <table class="fat-table" style="margin-top:1rem">
      <thead><tr>
        <th>Data Pagamento</th>
        <th>Descrição</th>
        <th>Valor</th>
        <th>Status</th>
        <th>Score</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
