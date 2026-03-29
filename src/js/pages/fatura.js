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
import { buscarPerfil, buscarGrupo, ouvirContas, ouvirCategorias, ouvirDespesas, ouvirDespesasPorMesFatura } from '../services/database.js';
import { formatarMoeda, formatarData, nomeMes } from '../utils/formatters.js';

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

let _unsubContas        = null;
let _unsubCats          = null;
let _unsubDesp          = null;
let _unsubDespMesFatura = null;  // BUG-022: listener paralelo por mesFatura

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
  // Mostra todos os tipos para permitir análise de qualquer conta
  sel.innerHTML = '<option value="">— selecione —</option>' +
    _contas.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('');
  if (anterior && _contas.find(c => c.id === anterior)) {
    sel.value = anterior;
    _cartaoId = anterior;
  }
  // Auto-seleciona o primeiro cartão de crédito se nenhum selecionado
  if (!_cartaoId) {
    const cartao = _contas.find(c => c.tipo === 'cartao');
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

  _unsubDesp = ouvirDespesas(_grupoId, _mes, _ano, (todas) => {
    _calendarSet = todas;
    _merge();
  });

  _unsubDespMesFatura = ouvirDespesasPorMesFatura(_grupoId, mesFaturaStr, (todas) => {
    _mesFaturaSet = todas;
    _merge();
  });
}

// ── Render principal ──────────────────────────────────────────
function renderizarTudo() {
  const membros = _membrosDoGrupo();
  renderizarCards(membros);
  gerarTabsMembros(membros);
  renderizarTabela('todas');
  renderizarTabela('conjuntas');
  membros.forEach(m => renderizarTabela(m.key));
  renderizarResumoDetalhado(membros);
  document.getElementById('fat-resumo-cards').style.display = '';
  document.getElementById('fat-conteudo').style.display = '';
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
        <div class="fat-card-label">${m.nome.split(' ')[0]}</div>
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
    `<button class="fat-tab${_tabAtiva === m.key ? ' fat-tab--active' : ''}" data-tab="${m.key}">
      ${m.nome.split(' ')[0]}
    </button>`
  ).join('');

  // Conteúdo das tabs por membro
  const container = document.getElementById('fat-tab-membros-container');
  container.innerHTML = membros.map(m => `
    <div id="fat-tab-${m.key}" class="fat-tab-content${_tabAtiva === m.key ? ' fat-tab-content--active' : ''}">
      <div class="card">
        <div class="fat-table-header">
          <span class="fat-table-title">Despesas — ${m.nome.split(' ')[0]}</span>
        </div>
        <div class="fat-table-wrap">
          <table class="fat-table">
            <thead><tr>
              <th>Data</th><th>Estabelecimento</th><th>Tipo</th>
              <th>Parcela</th><th>Categoria</th>
              <th class="fat-th-valor">Valor</th>
            </tr></thead>
            <tbody id="fat-tbody-${m.key}"></tbody>
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
    tbody.innerHTML = rows.map(d => _rowTodas(d)).join('') ||
      '<tr><td colspan="8" class="fat-td-empty">Nenhuma transação</td></tr>';
    return;
  }

  if (tipo === 'conjuntas') {
    const tbody = document.getElementById('fat-tbody-conjuntas');
    if (!tbody) return;
    const conj = _despesas.filter(d => d.isConjunta).sort((a, b) => _toTs(b.data) - _toTs(a.data));
    tbody.innerHTML = conj.map(d => `
      <tr>
        <td>${formatarData(d.data?.toDate?.() ?? d.data)}</td>
        <td class="fat-td-estab">${d.descricao ?? '—'}</td>
        <td><span class="fat-badge fat-badge--${d.parcela && d.parcela !== '-' ? 'parc' : 'vista'}">${d.parcela && d.parcela !== '-' ? 'P' : 'V'}</span></td>
        <td>${d.parcela && d.parcela !== '-' ? d.parcela : '—'}</td>
        <td>${_catMap[d.categoriaId]?.nome ?? '—'}</td>
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
      <td class="fat-td-estab">${d.descricao ?? '—'}</td>
      <td><span class="fat-badge fat-badge--${d.parcela && d.parcela !== '-' ? 'parc' : 'vista'}">${d.parcela && d.parcela !== '-' ? 'P' : 'V'}</span></td>
      <td>${d.parcela && d.parcela !== '-' ? d.parcela : '—'}</td>
      <td>${_catMap[d.categoriaId]?.nome ?? '—'}</td>
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
    <td class="fat-td-estab">${d.descricao ?? '—'}</td>
    <td><span class="fat-resp-chip">${resp.split(' ')[0]}</span></td>
    <td><span class="fat-badge fat-badge--${tipo === 'P' ? 'parc' : 'vista'}">${tipo}</span></td>
    <td>${d.parcela && d.parcela !== '-' ? d.parcela : '—'}</td>
    <td>${_catMap[d.categoriaId]?.nome ?? '—'}</td>
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
        <div class="fat-resumo-membro-nome">${m.nome.split(' ')[0]}</div>
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
async function carregarProjecoes() {
  const container = document.getElementById('fat-proj-content');
  container.innerHTML = '<p class="fat-loading">Carregando...</p>';
  if (!_cartaoId) { container.innerHTML = '<p class="fat-loading">Selecione um cartão.</p>'; return; }

  // Carrega próximos 6 meses de projeções (parcelas pendentes)
  const projecoesPorMes = {};
  const hoje = new Date();
  const inicio = new Date(_ano, _mes - 1, 1); // mês atual + 1
  inicio.setMonth(inicio.getMonth() + 1);

  for (let i = 0; i < 6; i++) {
    const m = new Date(inicio);
    m.setMonth(m.getMonth() + i);
    projecoesPorMes[`${m.getFullYear()}-${m.getMonth() + 1}`] = {
      mes: m.getMonth() + 1, ano: m.getFullYear(), total: 0, porMembro: {}
    };
  }

  // Usa os dados já importados (projeções são status='pendente' com data futura)
  // Cria listeners para cada mês futuro
  const membros = _membrosDoGrupo();
  let pendentes = 0;
  const unsubProjs = [];

  for (let i = 0; i < 6; i++) {
    const m = new Date(inicio);
    m.setMonth(m.getMonth() + i);
    const mes = m.getMonth() + 1, ano = m.getFullYear();
    const key = `${ano}-${mes}`;

    const unsub = ouvirDespesas(_grupoId, mes, ano, (desp) => {
      const filtradas = desp.filter(d => d.contaId === _cartaoId && d.tipo === 'projecao');
      projecoesPorMes[key] = { mes, ano, total: 0, porMembro: {}, despesas: filtradas };

      // Calcula por membro
      membros.forEach(memb => {
        const ind = filtradas.filter(d => !d.isConjunta && (d.responsavel || d.portador || '').toLowerCase().startsWith(memb.key));
        const conj = filtradas.filter(d => d.isConjunta);
        const tInd  = ind.reduce((s, d) => s + (d.valor ?? 0), 0);
        const tConj = conj.reduce((s, d) => s + (d.valorAlocado ?? (d.valor ?? 0) / 2), 0);
        projecoesPorMes[key].porMembro[memb.key] = tInd + tConj;
      });
      projecoesPorMes[key].total = Object.values(projecoesPorMes[key].porMembro).reduce((s, v) => s + v, 0);

      pendentes++;
      if (pendentes >= 6) renderizarProjecoes(projecoesPorMes, membros);
    });
    unsubProjs.push(unsub);
  }
}

function renderizarProjecoes(projecoesPorMes, membros) {
  const container = document.getElementById('fat-proj-content');
  const meses = Object.values(projecoesPorMes).sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes);

  const temDados = meses.some(m => m.total > 0);
  if (!temDados) {
    container.innerHTML = '<p class="fat-loading fat-loading--ok">✅ Nenhuma parcela futura encontrada para este cartão.</p>';
    return;
  }

  const cols = membros.map(m => `<th class="fat-th-valor">${m.nome.split(' ')[0]}</th>`).join('');
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
    </div>`;
}

// ── Tabs ──────────────────────────────────────────────────────
function ativarTab(tab) {
  _tabAtiva = tab;
  document.querySelectorAll('.fat-tab').forEach(b => b.classList.toggle('fat-tab--active', b.dataset.tab === tab));
  // Esconde todos os conteúdos
  document.querySelectorAll('.fat-tab-content').forEach(el => el.classList.remove('fat-tab-content--active'));
  // Mostra o ativo
  const alvo = tab === 'conjuntas' ? document.getElementById('fat-tab-conjuntas')
    : tab === 'projecoes'         ? document.getElementById('fat-tab-projecoes')
    : tab === 'todas'             ? document.getElementById('fat-tab-todas')
    : document.getElementById(`fat-tab-${tab}`);
  if (alvo) alvo.classList.add('fat-tab-content--active');
}

// ── Exportação para Excel ─────────────────────────────────────
function exportarExcel() {
  if (typeof XLSX === 'undefined') { alert('SheetJS não carregado.'); return; }
  if (!_despesas.length) { alert('Nenhuma transação para exportar.'); return; }

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

function mostrarEmpty(show) {
  document.getElementById('fat-empty').style.display         = show ? '' : 'none';
  document.getElementById('fat-resumo-cards').style.display  = show ? 'none' : '';
  document.getElementById('fat-conteudo').style.display      = show ? 'none' : '';
}

function _toTs(data) {
  if (!data) return 0;
  if (typeof data.toDate === 'function') return data.toDate().getTime();
  if (data instanceof Date) return data.getTime();
  return new Date(data).getTime();
}
