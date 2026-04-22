// ============================================================
// ENTRY POINT — Minhas Finanças
// Ponto de entrada do dashboard (dashboard.html)
// ============================================================

import { onAuthChange, logout } from './services/auth.js';
import {
  buscarPerfil,
  buscarGrupo,
  ouvirParcelamentosAbertos,
  ouvirReceitas,
  ouvirCategoriasReceita,
  ouvirDespesasPorMesFatura,  // RF-065: card Próxima Fatura
  garantirCategoriasReceita,
  garantirContasPadrao,       // NRF-004
  migrarCartaoGenerico,       // RF-062
  buscarDespesasPeriodo,      // RF-017: gráficos
  buscarReceitasPeriodo,      // RF-017: gráficos
  buscarDespesasAno,          // RF-017: filtro anual
  buscarReceitasAno,          // RF-017: filtro anual
  ouvirContas,                // RF-068: saldo real por conta
  ouvirDespesasDesdeData,     // RF-068
  ouvirReceitasDesdeData,     // RF-068
} from './services/database.js';
import { iniciarListenerCategorias } from './controllers/categorias.js';
import {
  iniciarListenerDespesas,
} from './controllers/despesas.js';
import { iniciarListenerOrcamentos } from './controllers/orcamentos.js';
import { renderizarDashboard } from './controllers/dashboard.js';
import { renderizarDashboardReceitas } from './controllers/receitas-dashboard.js';
import { CATEGORIAS_RECEITA_PADRAO } from './models/Receita.js';
import { CONTAS_PADRAO } from './models/Conta.js';            // NRF-004
import { mesAnoAtual, definirTexto, isMovimentacaoReal } from './utils/helpers.js';
import { coresGrafico } from './utils/chartColors.js';
import { nomeMes, escHTML } from './utils/formatters.js';
import { skeletonCards, skeletonKpiValue, skeletonChart, errorStateHTML } from './utils/skeletons.js';
import { inicializarCapacitor } from './utils/capacitor.js';
import { calcularBurnRate } from './utils/burnRateCalculator.js'; // RF-069
import { aplicarDefaultsControllerCharts } from './utils/chartDefaults.js'; // NRF-VISUAL F1

// ── Estado Global ─────────────────────────────────────────────
let estadoApp = {
  usuario:    null,
  perfil:     null,
  grupo:      null,         // RF-065: card Próxima Fatura — membros do grupo
  nomeAtual:  '',           // nome do usuário logado conforme nomesMembros do grupo (fix #90)
  mes:        mesAnoAtual().mes,
  ano:        mesAnoAtual().ano,
  categorias:         [],
  despesas:           [],
  orcamentos:         [],
  receitas:           [],
  categoriasReceita:  [],
};

// Referências para unsubscribe ao trocar período
let _unsubCats        = null;
let _unsubDesp        = null;
let _unsubOrc         = null;
let _unsubProj        = null; // RF-014: parcelamentos em aberto
let _unsubRec         = null; // receitas do mês
let _unsubCatRec      = null; // categorias de receita
let _unsubProxFatura  = null; // RF-065: card Próxima Fatura
// RF-068: saldo real por conta
let _unsubContas      = null;
let _unsubDespSaldo   = null;
let _unsubRecSaldo    = null;
let _contasAtivas     = [];
let _despesasSaldo    = [];
let _receitasSaldo    = [];

// ── RF-017: Gráficos ──────────────────────────────────────────
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtC = (v) => new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(v ?? 0);

let _chartCat    = null;  // Chart.js instance: categorias
let _chartEvol   = null;  // Chart.js instance: evolução mensal
let _filtroCat   = 'mes'; // 'mes' | '3meses' | 'ano'
let _dadosMeses  = null;  // cache: { despesas, receitas, meses } — últimos 6 meses
let _dadosAno    = null;  // cache: { despesas, receitas, ano } — ano completo

function _ultimos6Meses(mesAtual, anoAtual) {
  const r = [];
  for (let i = 5; i >= 0; i--) {
    let m = mesAtual - i, a = anoAtual;
    while (m <= 0) { m += 12; a--; }
    r.push({ mes: m, ano: a });
  }
  return r;
}

// ── Inicialização ─────────────────────────────────────────────

inicializarCapacitor();
aplicarDefaultsControllerCharts(); // NRF-VISUAL F1: tipografia Controller nos gráficos

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  estadoApp.usuario = user;

  try {
    estadoApp.perfil = await buscarPerfil(user.uid);
    // Resolve nome do usuário logado para cálculo correto de "Meu Bolso" (fix #90)
    const grupo = await buscarGrupo(estadoApp.perfil?.grupoId);
    estadoApp.nomeAtual = grupo?.nomesMembros?.[user.uid] ?? user.email ?? '';
    estadoApp.grupo = grupo; // RF-065: armazenar membros para card Próxima Fatura
  } catch (_err) {
    // Falha ao buscar perfil (ex: erro de rede) → redireciona para login por segurança
    window.location.href = 'login.html';
    return;
  }

  if (!estadoApp.perfil?.grupoId) {
    window.location.href = 'grupo.html';
    return;
  }

  definirTexto('usuario-nome', estadoApp.perfil.nome ?? user.email);
  atualizarTituloPeriodo();
  preencherSelectPeriodo();
  iniciarListeners();
  iniciarListenerParcelamentos(estadoApp.perfil.grupoId);   // RF-014
  iniciarListenerCategoriasReceita(estadoApp.perfil.grupoId);
  iniciarListenerProximaFatura(estadoApp.perfil.grupoId);   // RF-065
  iniciarListenerSaldoReal(estadoApp.perfil.grupoId);       // RF-068
  garantirCategoriasReceita(estadoApp.perfil.grupoId, CATEGORIAS_RECEITA_PADRAO).catch(() => {});
  garantirContasPadrao(estadoApp.perfil.grupoId, CONTAS_PADRAO).catch(() => {}); // NRF-004
  migrarCartaoGenerico(estadoApp.perfil.grupoId).catch(() => {}); // RF-062: marca cartão genérico como _legado
  configurarEventos();
  carregarDadosMeses(); // RF-017: carrega dados para gráficos (assíncrono)
});

// ── Listeners em tempo real ────────────────────────────────────

function iniciarListeners() {
  const { grupoId } = estadoApp.perfil;
  const { mes, ano } = estadoApp;

  // Cancela listeners anteriores ao trocar de período
  if (_unsubCats) _unsubCats();
  if (_unsubDesp) _unsubDesp();
  if (_unsubOrc)  _unsubOrc();
  if (_unsubRec)  _unsubRec();

  // Skeleton enquanto dados carregam
  const catGrid = document.getElementById('categorias-grid');
  if (catGrid && !estadoApp.categorias.length) catGrid.innerHTML = skeletonCards(6);
  ['total-orcado', 'total-gasto', 'total-disponivel', 'rec-total', 'rec-saldo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = skeletonKpiValue();
  });
  ['dash-chart-categorias', 'dash-chart-evolucao'].forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas && canvas.parentElement) {
      canvas.parentElement.dataset.canvasId = id;
      canvas.style.display = 'none';
      if (!canvas.parentElement.querySelector('.skeleton-chart')) {
        const ph = document.createElement('div');
        ph.className = 'skeleton skeleton-chart';
        ph.setAttribute('aria-hidden', 'true');
        canvas.parentElement.insertBefore(ph, canvas);
      }
    }
  });

  // Categorias — não filtram por mês
  _unsubCats = iniciarListenerCategorias(grupoId, (cats) => {
    estadoApp.categorias = cats;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos, estadoApp.nomeAtual);
    const cg = document.getElementById('categorias-grid');
    if (cg) cg.classList.add('fade-in');
    if (_filtroCat === 'mes') renderizarGraficoCategorias(); // RF-017
  });

  // Despesas do mês — sync bidirecional: qualquer escrita de qualquer membro
  // dispara este listener nos dois dispositivos simultaneamente
  _unsubDesp = iniciarListenerDespesas(grupoId, mes, ano, (desp) => {
    estadoApp.despesas = desp;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos, estadoApp.nomeAtual);
    // Re-render receitas so saldo stays in sync when despesas change
    renderizarDashboardReceitas(
      estadoApp.categoriasReceita,
      estadoApp.receitas,
      estadoApp.despesas.filter(isMovimentacaoReal).reduce((s, d) => s + (d.valor ?? 0), 0),
    );
    renderizarBurnRate(); // RF-069
    if (_filtroCat === 'mes') renderizarGraficoCategorias(); // RF-017
    renderizarGraficoEvolucao(); // RF-017
  });

  // Orçamentos do mês
  _unsubOrc = iniciarListenerOrcamentos(grupoId, mes, ano, (orc) => {
    estadoApp.orcamentos = orc;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos, estadoApp.nomeAtual);
    renderizarBurnRate(); // RF-069
  });

  // Receitas do mês
  _unsubRec = ouvirReceitas(grupoId, mes, ano, (recs) => {
    estadoApp.receitas = recs;
    atualizarTituloReceitas();
    renderizarDashboardReceitas(
      estadoApp.categoriasReceita,
      estadoApp.receitas,
      estadoApp.despesas.filter(isMovimentacaoReal).reduce((s, d) => s + (d.valor ?? 0), 0),
    );
    if (_filtroCat === 'mes') renderizarGraficoCategorias(); // RF-017
    renderizarGraficoEvolucao(); // RF-017
  });
}

// ── Listener de Categorias de Receita (persistente — não muda com período) ──

function iniciarListenerCategoriasReceita(grupoId) {
  if (_unsubCatRec) _unsubCatRec();
  _unsubCatRec = ouvirCategoriasReceita(grupoId, (cats) => {
    estadoApp.categoriasReceita = cats;
    renderizarDashboardReceitas(
      estadoApp.categoriasReceita,
      estadoApp.receitas,
      estadoApp.despesas.filter(isMovimentacaoReal).reduce((s, d) => s + (d.valor ?? 0), 0),
    );
    if (_filtroCat === 'mes') renderizarGraficoCategorias(); // RF-017
  });
}

function atualizarTituloReceitas() {
  const el = document.getElementById('rec-mes-titulo');
  if (el) el.textContent = `${nomeMes(estadoApp.mes)} ${estadoApp.ano}`;
}

// ── RF-017: Carregar dados dos gráficos ───────────────────────

async function carregarDadosMeses() {
  const { grupoId } = estadoApp.perfil;
  const { mes, ano } = estadoApp;
  const meses6 = _ultimos6Meses(mes, ano);
  const inicio = new Date(meses6[0].ano, meses6[0].mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59); // último dia do mês selecionado
  try {
    const [desp, rec] = await Promise.all([
      buscarDespesasPeriodo(grupoId, inicio, fim),
      buscarReceitasPeriodo(grupoId, inicio, fim),
    ]);
    _dadosMeses = { despesas: desp, receitas: rec, meses: meses6 };
    renderizarGraficoEvolucao();
    if (_filtroCat === '3meses') renderizarGraficoCategorias();
  } catch (err) {
    console.error('[dashboard] Erro ao carregar dados de gráficos:', err);
    const wrap = document.getElementById('section-graficos');
    if (wrap) wrap.innerHTML = errorStateHTML('Erro ao carregar gráficos', 'Verifique sua conexão e tente novamente.');
  }
}

async function carregarDadosAno() {
  const { grupoId } = estadoApp.perfil;
  const { ano } = estadoApp;
  if (_dadosAno?.ano === ano) { renderizarGraficoCategorias(); return; }
  try {
    const [desp, rec] = await Promise.all([
      buscarDespesasAno(grupoId, ano),
      buscarReceitasAno(grupoId, ano),
    ]);
    _dadosAno = { despesas: desp, receitas: rec, ano };
    renderizarGraficoCategorias();
  } catch (err) {
    console.error('[dashboard] Erro ao carregar dados anuais:', err);
  }
}

// ── RF-017: Gráfico 1 — Receitas × Despesas por Categoria ────

function _revelarCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  canvas.style.display = '';
  canvas.parentElement?.querySelectorAll('.skeleton-chart').forEach(el => el.remove());
}

function renderizarGraficoCategorias() {
  const canvas = document.getElementById('dash-chart-categorias');
  if (!canvas || typeof Chart === 'undefined') return;
  _revelarCanvas('dash-chart-categorias');

  let despFiltradas, recFiltradas;

  if (_filtroCat === 'mes') {
    despFiltradas = estadoApp.despesas.filter(isMovimentacaoReal);
    recFiltradas  = estadoApp.receitas;
  } else if (_filtroCat === '3meses') {
    if (!_dadosMeses) return;
    const meses3 = _dadosMeses.meses.slice(-3);
    despFiltradas = _dadosMeses.despesas.filter(d => {
      if (!isMovimentacaoReal(d)) return false;
      const dt = d.data?.toDate?.() ?? new Date(d.data);
      return meses3.some(m => dt.getFullYear() === m.ano && dt.getMonth() + 1 === m.mes);
    });
    recFiltradas = _dadosMeses.receitas.filter(r => {
      const dt = r.data?.toDate?.() ?? new Date(r.data);
      return meses3.some(m => dt.getFullYear() === m.ano && dt.getMonth() + 1 === m.mes);
    });
  } else { // 'ano'
    if (!_dadosAno) return;
    despFiltradas = _dadosAno.despesas.filter(isMovimentacaoReal);
    recFiltradas  = _dadosAno.receitas;
  }

  // Agregação por categoria
  const despMap = {}, recMap = {};
  despFiltradas.forEach(d => { despMap[d.categoriaId] = (despMap[d.categoriaId] ?? 0) + (d.valor ?? 0); });
  recFiltradas.forEach(r => { recMap[r.categoriaId]   = (recMap[r.categoriaId]   ?? 0) + (r.valor ?? 0); });

  // Mapa de todas as categorias (despesa + receita)
  const todasCats = [...estadoApp.categorias, ...estadoApp.categoriasReceita];
  const catMap    = Object.fromEntries(todasCats.map(c => [c.id, c]));
  const catIds    = new Set([...Object.keys(despMap), ...Object.keys(recMap)]);

  const cats = [...catIds]
    .map(id => catMap[id])
    .filter(Boolean)
    .sort((a, b) =>
      ((despMap[b.id] ?? 0) + (recMap[b.id] ?? 0)) -
      ((despMap[a.id] ?? 0) + (recMap[a.id] ?? 0))
    );

  if (_chartCat) { _chartCat.destroy(); _chartCat = null; }
  if (!cats.length) return;

  const labels    = cats.map(c => `${c.emoji} ${c.nome}`);
  const recData   = cats.map(c => recMap[c.id]  ?? 0);
  const despData  = cats.map(c => despMap[c.id] ?? 0);
  const totalRec  = recData.reduce((a, b) => a + b, 0);
  const totalDesp = despData.reduce((a, b) => a + b, 0);

  _chartCat = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: recData,
          backgroundColor: coresGrafico().receita.bg,
          borderColor: coresGrafico().receita.border,
          borderWidth: 1,
        },
        {
          label: 'Despesas',
          data: despData,
          backgroundColor: coresGrafico().despesa.bg,
          borderColor: coresGrafico().despesa.border,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 14 }, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.datasetIndex === 0 ? totalRec : totalDesp;
              const pct   = total > 0 ? ((ctx.parsed.y / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { size: 13 } } },
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => fmtC(v), font: { size: 13 } },
        },
      },
    },
  });
}

// ── RF-017: Gráfico 2 — Evolução Mensal (últimos 6 meses) ─────

function renderizarGraficoEvolucao() {
  const canvas = document.getElementById('dash-chart-evolucao');
  if (!canvas || typeof Chart === 'undefined' || !_dadosMeses) return;
  _revelarCanvas('dash-chart-evolucao');

  const meses6   = _dadosMeses.meses;
  const hoje     = new Date();
  const mesHoje  = hoje.getMonth() + 1;
  const anoHoje  = hoje.getFullYear();

  const dados = meses6.map(({ mes, ano: mAno }) => {
    const isFuturo = mAno > anoHoje || (mAno === anoHoje && mes > mesHoje);
    const isAtual  = mAno === estadoApp.ano && mes === estadoApp.mes;

    let totalDesp, totalRec;
    if (isAtual) {
      // Usa dados do onSnapshot (mais recentes)
      totalDesp = estadoApp.despesas.filter(isMovimentacaoReal).reduce((s, d) => s + (d.valor ?? 0), 0);
      totalRec  = estadoApp.receitas.reduce((s, r) => s + (r.valor ?? 0), 0);
    } else {
      totalDesp = _dadosMeses.despesas.filter(d => {
        if (!isMovimentacaoReal(d)) return false;
        const dt = d.data?.toDate?.() ?? new Date(d.data);
        return dt.getFullYear() === mAno && dt.getMonth() + 1 === mes;
      }).reduce((s, d) => s + (d.valor ?? 0), 0);
      totalRec = _dadosMeses.receitas.filter(r => {
        const dt = r.data?.toDate?.() ?? new Date(r.data);
        return dt.getFullYear() === mAno && dt.getMonth() + 1 === mes;
      }).reduce((s, r) => s + (r.valor ?? 0), 0);
    }
    return { mes, ano: mAno, totalDesp, totalRec, saldo: totalRec - totalDesp, isFuturo };
  });

  // Saldo acumulado
  let acum = 0;
  const dadosAcum = dados.map(d => { acum += d.saldo; return { ...d, acum }; });

  const labels   = meses6.map(({ mes, ano: a }) => `${MESES_ABREV[mes - 1]}/${String(a).slice(-2)}`);
  const recData  = dadosAcum.map(d => d.totalRec);
  const despData = dadosAcum.map(d => d.totalDesp);
  const acumData = dadosAcum.map(d => d.acum);

  if (_chartEvol) { _chartEvol.destroy(); _chartEvol = null; }

  _chartEvol = new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
          type: 'bar', label: 'Receitas', data: recData, order: 2,
          backgroundColor: dadosAcum.map(d => d.isFuturo ? coresGrafico().receitaFade : coresGrafico().receita.bg),
          borderColor: coresGrafico().receita.border, borderWidth: 1,
        },
        {
          type: 'bar', label: 'Despesas', data: despData, order: 2,
          backgroundColor: dadosAcum.map(d => d.isFuturo ? coresGrafico().despesaFade : coresGrafico().despesa.bg),
          borderColor: coresGrafico().despesa.border, borderWidth: 1,
        },
        {
          type: 'line', label: 'Saldo Acumulado', data: acumData, order: 1,
          borderColor: coresGrafico().saldo.border, backgroundColor: coresGrafico().saldo.bg,
          borderWidth: 2.5, tension: 0.35, fill: true, pointRadius: 4,
          pointBackgroundColor: acumData.map(v => v >= 0 ? coresGrafico().pontoPositivo : coresGrafico().pontoNegativo),
          pointBorderColor: '#fff', pointBorderWidth: 1.5,
          yAxisID: 'yAcum',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 14 }, boxWidth: 14 } },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { size: 13 } } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,.04)' },
          ticks: { callback: (v) => fmtC(v), font: { size: 13 } },
          title: { display: true, text: 'R$ / mês', font: { size: 13 } },
        },
        yAcum: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { callback: (v) => fmtC(v), font: { size: 13 } },
          title: { display: true, text: 'Acumulado', font: { size: 13 } },
        },
      },
    },
  });
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

  // Atalho para nova despesa — redireciona para despesas.html e abre o modal lá
  document.getElementById('btn-nova-despesa')?.addEventListener('click', () => {
    window.location.href = 'despesas.html?nova=1';
  });

  // RF-014: toggle painel parcelamentos (header interno)
  document.getElementById('parc-toggle-dash')?.addEventListener('click', () => {
    const body = document.getElementById('parc-body-dash');
    if (body) body.classList.toggle('parc-body--collapsed');
    const icon = document.querySelector('#parc-toggle-dash .parc-toggle-icon');
    if (icon) icon.textContent = body?.classList.contains('parc-body--collapsed') ? '▸' : '▾';
  });

  // CT-009.5: botão externo de visibilidade do painel de parcelamentos
  document.getElementById('btn-ver-parc-dash')?.addEventListener('click', () => {
    const widget = document.getElementById('parc-widget-dash');
    if (!widget) return;
    if (widget.classList.contains('hidden')) {
      widget.classList.remove('hidden');
      // Expande o body caso esteja colapsado
      const body = document.getElementById('parc-body-dash');
      if (body) body.classList.remove('parc-body--collapsed');
      const icon = document.querySelector('#parc-toggle-dash .parc-toggle-icon');
      if (icon) icon.textContent = '▾';
      // Mostra empty-state se não houver lista ainda
      const lista = document.getElementById('parc-lista-dash');
      if (lista && !lista.querySelector('.parc-resp-row')) {
        lista.innerHTML = '<p class="empty-state" style="font-size:.85rem;padding:.5rem 0;">Nenhum parcelamento em aberto no momento.</p>';
      }
    } else {
      widget.classList.add('hidden');
    }
    widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // RF-017: Filtros do gráfico de categorias
  document.querySelectorAll('.dash-filtro-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.dash-filtro-btn').forEach(b => b.classList.remove('dash-filtro-btn--ativo'));
      btn.classList.add('dash-filtro-btn--ativo');
      _filtroCat = btn.dataset.periodo;
      if (_filtroCat === 'ano') {
        await carregarDadosAno();
      } else {
        renderizarGraficoCategorias();
      }
    });
  });

  // Filtro de período (mês/ano do dashboard)
  document.getElementById('select-mes')?.addEventListener('change', (e) => {
    estadoApp.mes = Number(e.target.value);
    _dadosMeses = null; // invalida cache de gráficos
    _dadosAno   = null;
    atualizarTituloPeriodo();
    iniciarListeners();
    carregarDadosMeses(); // RF-017
  });
  document.getElementById('select-ano')?.addEventListener('change', (e) => {
    estadoApp.ano = Number(e.target.value);
    _dadosMeses = null;
    _dadosAno   = null;
    atualizarTituloPeriodo();
    iniciarListeners();
    carregarDadosMeses(); // RF-017
  });
}

// ── RF-014: Parcelamentos em Aberto ──────────────────────────

function iniciarListenerParcelamentos(grupoId) {
  if (_unsubProj) _unsubProj();
  _unsubProj = ouvirParcelamentosAbertos(grupoId, (projecoes) => {
    renderizarPainelParcelamentos(projecoes);
  });
}

function renderizarPainelParcelamentos(projecoes) {
  const widget = document.getElementById('parc-widget-dash');
  const lista  = document.getElementById('parc-lista-dash');
  const total  = document.getElementById('parc-total-dash');
  if (!widget || !lista || !total) return;

  const hoje    = new Date();
  const futuras = projecoes.filter(p => {
    const d = p.data?.toDate?.() ?? new Date(p.data);
    return d > hoje;
  });

  if (!futuras.length) {
    widget.classList.add('hidden');
    return;
  }
  widget.classList.remove('hidden');

  // Totais por responsável
  const porResp = {};
  let totalGeral = 0;
  futuras.forEach(p => {
    const resp = (p.responsavel || p.portador || '—').split(' ')[0];
    if (!porResp[resp]) porResp[resp] = { total: 0, compras: {} };
    porResp[resp].total += p.valor ?? 0;
    totalGeral          += p.valor ?? 0;
    const cid = p.parcelamento_id ?? p.descricao;
    if (!porResp[resp].compras[cid])
      porResp[resp].compras[cid] = { descricao: p.descricao, valor: p.valor, qtd: 0 };
    porResp[resp].compras[cid].qtd++;
  });

  total.textContent = formatarMoedaDash(totalGeral);
  lista.innerHTML = Object.entries(porResp).map(([resp, d]) => `
    <div class="parc-resp-row">
      <div class="parc-resp-header">
        <span class="parc-resp-nome">👤 ${escHTML(resp)}</span>
        <span class="parc-resp-total">${formatarMoedaDash(d.total)}</span>
      </div>
      <div class="parc-resp-items">
        ${Object.values(d.compras).map(c => `
          <div class="parc-compra-item">
            <span class="parc-compra-desc">${escHTML(c.descricao)}</span>
            <span class="parc-compra-info">${c.qtd} parcela${c.qtd > 1 ? 's' : ''} restante${c.qtd > 1 ? 's' : ''}</span>
            <span class="parc-compra-valor">${formatarMoedaDash(c.valor * c.qtd)}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function formatarMoedaDash(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}

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

// ── RF-065: Card Próxima Fatura ───────────────────────────────

function iniciarListenerProximaFatura(grupoId) {
  if (_unsubProxFatura) _unsubProxFatura();
  const agora = new Date();
  let nextMes = agora.getMonth() + 2; // +1 zero-index, +1 próximo mês
  let nextAno = agora.getFullYear();
  if (nextMes > 12) { nextMes = 1; nextAno++; }
  const proximoMesFatura = `${nextAno}-${String(nextMes).padStart(2, '0')}`;

  _unsubProxFatura = ouvirDespesasPorMesFatura(grupoId, proximoMesFatura, (despesas) => {
    const projecoes = despesas.filter(d => d.tipo === 'projecao');
    renderizarCardProximaFatura(projecoes, proximoMesFatura);
  });
}

// ── RF-068: Saldo Real por Conta ──────────────────────────────

function iniciarListenerSaldoReal(grupoId) {
  if (_unsubContas) _unsubContas();

  _unsubContas = ouvirContas(grupoId, (contas) => {
    _contasAtivas = contas.filter(c => c.tipo !== 'cartao' && c.saldoInicial != null && c.dataReferenciaSaldo);

    if (!_contasAtivas.length) {
      const card = document.getElementById('card-saldo-real');
      if (card) card.style.display = 'none';
      return;
    }

    // Data de referência mais antiga entre todas as contas com saldo configurado
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const dataMinIso = _contasAtivas
      .map(c => c.dataReferenciaSaldo)
      .filter(d => ISO_DATE_RE.test(d))
      .sort()[0];
    if (!dataMinIso) return;
    const dataMin = new Date(dataMinIso + 'T00:00:00');

    if (_unsubDespSaldo) _unsubDespSaldo();
    if (_unsubRecSaldo)  _unsubRecSaldo();

    _unsubDespSaldo = ouvirDespesasDesdeData(grupoId, dataMin, (desp) => {
      _despesasSaldo = desp;
      renderizarCardSaldoReal();
    });
    _unsubRecSaldo = ouvirReceitasDesdeData(grupoId, dataMin, (recs) => {
      _receitasSaldo = recs;
      renderizarCardSaldoReal();
    });
  });
}

function renderizarCardSaldoReal() {
  const card = document.getElementById('card-saldo-real');
  if (!card || !_contasAtivas.length) return;

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

  // Calcula saldo real por conta
  const saldosPorConta = _contasAtivas.map((conta) => {
    const dataRef = new Date(conta.dataReferenciaSaldo + 'T00:00:00');

    const totalDesp = _despesasSaldo
      .filter(d => {
        if (!d.contaId || d.contaId !== conta.id) return false;
        // RN3: apenas movimentações reais
        if (d.tipo === 'projecao' || d.tipo === 'projecao_paga' || d.tipo === 'transferencia_interna') return false;
        const dt = d.data?.toDate?.() ?? new Date(d.data);
        return dt >= dataRef;
      })
      .reduce((s, d) => s + (d.valor ?? 0), 0);

    const totalRec = _receitasSaldo
      .filter(r => {
        if (!r.contaId || r.contaId !== conta.id) return false;
        const dt = r.data?.toDate?.() ?? new Date(r.data);
        return dt >= dataRef;
      })
      .reduce((s, r) => s + (r.valor ?? 0), 0);

    const saldo = (conta.saldoInicial ?? 0) + totalRec - totalDesp;
    return { conta, saldo };
  });

  const totalConsolidado = saldosPorConta.reduce((s, x) => s + x.saldo, 0);

  const totalEl    = document.getElementById('saldo-real-consolidado');
  const detalhesEl = document.getElementById('saldo-real-detalhes');

  if (totalEl) {
    totalEl.textContent = fmt(totalConsolidado);
    totalEl.style.color = totalConsolidado < 0 ? 'var(--color-expense)' : '';
  }

  if (detalhesEl) {
    detalhesEl.innerHTML = saldosPorConta.map(({ conta, saldo }) => {
      const negativo = saldo < 0 ? ' saldo-real-linha--negativo' : '';
      return `<div class="saldo-real-linha${negativo}">
        <span>${escHTML(conta.emoji)} ${escHTML(conta.nome)}</span>
        <span>${escHTML(fmt(saldo))}</span>
      </div>`;
    }).join('');
  }

  card.style.display = '';
  card.classList.add('card-hero'); // RF-068: saldo real é sempre hero quando visível (PV2)
}

// ── RF-069: Burn Rate por Categoria ─────────────────────────

function renderizarBurnRate() {
  const widget = document.getElementById('burn-rate-widget');
  const lista  = document.getElementById('burn-rate-lista');
  if (!widget || !lista) return;

  const hoje = new Date();
  const mesHoje = hoje.getMonth() + 1;
  const anoHoje = hoje.getFullYear();

  // Burn rate só faz sentido para o mês corrente (dados em tempo real)
  if (estadoApp.mes !== mesHoje || estadoApp.ano !== anoHoje) {
    widget.classList.add('hidden');
    return;
  }

  const itens = calcularBurnRate({
    despesasMes: estadoApp.despesas,
    orcamentos:  estadoApp.orcamentos,
    categorias:  estadoApp.categorias,
    hoje,
  });

  if (!itens.length) {
    widget.classList.add('hidden');
    return;
  }

  widget.classList.remove('hidden');

  // NRF-VISUAL F1: hero quando qualquer categoria projeta estouro > 10% (PV4)
  const temEstouro = itens.some(i => !i.amostrasInsuficientes && i.percentualProjetado > 110);
  widget.classList.toggle('card-hero', temEstouro);

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

  const labelBadge = { verde: 'OK', amarelo: 'ATENÇÃO', vermelho: 'RISCO' };

  lista.innerHTML = itens.map((item) => {
    const cls = item.classificacao;
    const pctFmt = item.amostrasInsuficientes
      ? '—'
      : `${item.percentualProjetado.toFixed(0)}%`;

    const valoresHtml = item.amostrasInsuficientes
      ? `<span class="burn-rate-insuficiente">amostra insuficiente (&lt;3 dias com dados)</span>`
      : `Gasto: <strong>${escHTML(fmt(item.gastoMes))}</strong> · Projeção: <strong>${escHTML(fmt(item.projecaoMensal))}</strong> de ${escHTML(fmt(item.orcamento))}`;

    return `
      <div class="burn-rate-item">
        <div class="burn-rate-item-nome">
          <span>${escHTML(item.categoriaEmoji)}</span>
          <span>${escHTML(item.categoriaNome)}</span>
          <span class="burn-rate-badge burn-rate-badge--${cls}">${labelBadge[cls]}</span>
        </div>
        <div class="burn-rate-item-pct burn-rate-item-pct--${cls}">${escHTML(pctFmt)}</div>
        <div class="burn-rate-item-valores">${valoresHtml}</div>
      </div>`;
  }).join('');
}

function renderizarCardProximaFatura(projecoes, proximoMesFatura) {
  const card = document.getElementById('card-proxima-fatura');
  if (!card) return;
  if (!projecoes.length) {
    card.style.display = 'none';
    card.classList.remove('card-hero');
    return;
  }
  card.style.display = '';

  // NRF-VISUAL F1: hero quando fatura vence em ≤ 7 dias (PV4)
  if (proximoMesFatura) {
    const [fatAno, fatMes] = proximoMesFatura.split('-').map(Number);
    const faturaDue = new Date(fatAno, fatMes - 1, 1);
    const diasAte   = Math.ceil((faturaDue - new Date()) / 86_400_000);
    card.classList.toggle('card-hero', diasAte <= 7);
  }

  // Total geral da fatura (soma de todos os valores)
  const total = projecoes.reduce((s, d) => s + (d.valor ?? 0), 0);

  // Totais por membro (individual + 50% conjuntas via valorAlocado)
  const membros = estadoApp.grupo?.nomesMembros
    ? Object.entries(estadoApp.grupo.nomesMembros).map(([, nome]) => ({
        nome,
        key: nome.split(' ')[0].toLowerCase(),
      }))
    : [];

  const conjuntas = projecoes.filter(d => d.isConjunta);
  const porMembro = {};
  membros.forEach(m => {
    const ind   = projecoes.filter(d =>
      !d.isConjunta && (d.responsavel || d.portador || '').toLowerCase().startsWith(m.key)
    );
    const tInd  = ind.reduce((s, d) => s + (d.valor ?? 0), 0);
    const tConj = conjuntas.reduce((s, d) => s + (d.valorAlocado ?? (d.valor ?? 0) / 2), 0);
    porMembro[m.key] = tInd + tConj;
  });

  const totalEl   = document.getElementById('proxima-fatura-total');
  const membrosEl = document.getElementById('proxima-fatura-membros');
  if (totalEl) totalEl.textContent = formatarMoedaDash(total);
  if (membrosEl && membros.length) {
    membrosEl.innerHTML = membros.map(m =>
      `${escHTML(m.nome.split(' ')[0])}: ${formatarMoedaDash(porMembro[m.key] ?? 0)}`
    ).join(' · ');
  }
}
