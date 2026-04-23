// ============================================================
// PÁGINA: Fluxo de Caixa — visão orçamentária anual
// Usa Chart.js v4 (github.com/chartjs/Chart.js) via CDN
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil } from '../services/database.js';
import {
  buscarDespesasAno,
  buscarReceitasAno,
  buscarOrcamentosAno,
  buscarDespesasMes,
  buscarReceitasMes,
  buscarProjecoesRange,
} from '../services/database.js';
import { gerarForecast } from '../utils/forecastEngine.js';
import { coresGrafico, getChartColors } from '../utils/chartColors.js';
import { isMovimentacaoReal } from '../utils/helpers.js';
import { buscarProjecoesAgregadas } from '../utils/projecoesCartao.js';
import { skeletonTableRows, emptyStateHTML } from '../utils/skeletons.js';

// ── Ícones SVG para empty states ──────────────────────────────
const SVG_BAR_CHART = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>';
const SVG_CHECK_CIRCLE = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

// ── Constantes ────────────────────────────────────────────────

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];
const MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Estado local ──────────────────────────────────────────────

let _grupoId  = null;
let _ano      = new Date().getFullYear();
let _chart    = null;

// ── Formatador ────────────────────────────────────────────────

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// ── Auth & Init ───────────────────────────────────────────────

onAuthChange(async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  const perfil = await buscarPerfil(user.uid);
  if (!perfil?.grupoId) { window.location.href = 'grupo.html'; return; }

  _grupoId = perfil.grupoId;

  const nomeEl = document.getElementById('usuario-nome');
  if (nomeEl) nomeEl.textContent = perfil.nome ?? user.email;

  preencherSelectAno();
  configurarEventos();
  await carregarFluxo();
});

// ── Select de ano ─────────────────────────────────────────────

function preencherSelectAno() {
  const sel = document.getElementById('fc-select-ano');
  if (!sel) return;
  const atual = new Date().getFullYear();
  [atual - 1, atual, atual + 1].forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (a === _ano) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());

  document.getElementById('fc-select-ano')?.addEventListener('change', (e) => {
    _ano = Number(e.target.value);
    document.getElementById('fc-titulo-ano').textContent = _ano;
    carregarFluxo();
  });

  document.getElementById('fc-btn-atualizar')?.addEventListener('click', () => {
    carregarFluxo();
  });
}

// ── Carregamento e agregação ──────────────────────────────────

async function carregarFluxo() {
  mostrarLoading(true);
  try {
    const [despesas, receitas, orcamentos] = await Promise.all([
      buscarDespesasAno(_grupoId, _ano),
      buscarReceitasAno(_grupoId, _ano),
      buscarOrcamentosAno(_grupoId, _ano),
    ]);

    const dadosMensais = agregarMensalmente(despesas, receitas, orcamentos);
    renderizarCards(dadosMensais);
    renderizarGrafico(dadosMensais);
    renderizarTabela(dadosMensais);
  } catch (err) {
    console.error('[fluxo-caixa] Erro ao carregar dados:', err);
  } finally {
    mostrarLoading(false);
  }
  // Forecast e compromissos: sempre baseados na data atual
  await Promise.all([carregarForecast(), carregarCompromissos()]);
}

function agregarMensalmente(despesas, receitas, orcamentos) {
  const recMes  = Array(12).fill(0);
  const despMes = Array(12).fill(0);
  const orcMes  = Array(12).fill(0);

  receitas.forEach((r) => {
    const d = r.data?.toDate?.() ?? new Date(r.data);
    recMes[d.getMonth()] += r.valor ?? 0;
  });

  // Exclui projeções e transferências internas das despesas realizadas
  despesas.filter(isMovimentacaoReal).forEach((d) => {
    const dt = d.data?.toDate?.() ?? new Date(d.data);
    despMes[dt.getMonth()] += d.valor ?? 0;
  });

  // Inclui projeções separadas para visualização futura
  const projMes = Array(12).fill(0);
  despesas.filter((d) => d.tipo === 'projecao').forEach((d) => {
    const dt = d.data?.toDate?.() ?? new Date(d.data);
    projMes[dt.getMonth()] += d.valor ?? 0;
  });

  orcamentos.forEach((o) => {
    const idx = (o.mes ?? 1) - 1; // orcamentos têm mes 1-based
    orcMes[idx] += o.valor ?? 0;
  });

  const mesAtual = new Date().getFullYear() === _ano ? new Date().getMonth() : 11;

  return MESES.map((_, i) => {
    const rec    = recMes[i];
    const desp   = despMes[i];
    const proj   = projMes[i];
    const orc    = orcMes[i];
    const saldo  = rec - desp;
    return { mes: i, rec, desp, proj, orc, saldo, isFuturo: i > mesAtual };
  }).reduce((acc, item, i) => {
    const acum = (acc[i - 1]?.acum ?? 0) + item.saldo;
    acc.push({ ...item, acum });
    return acc;
  }, []);
}

// ── Cards de resumo ───────────────────────────────────────────

function renderizarCards(dados) {
  const totalRec  = dados.reduce((s, d) => s + d.rec,  0);
  const totalDesp = dados.reduce((s, d) => s + d.desp, 0);
  const totalOrc  = dados.reduce((s, d) => s + d.orc,  0);
  const saldoAno  = totalRec - totalDesp;

  setTexto('fc-total-receitas', fmt(totalRec));
  setTexto('fc-total-despesas', fmt(totalDesp));
  setTexto('fc-total-orcado',   fmt(totalOrc));

  const saldoEl = document.getElementById('fc-saldo-ano');
  if (saldoEl) {
    saldoEl.textContent = fmt(saldoAno);
    saldoEl.className   = 'resumo-valor ' + (saldoAno >= 0 ? 'rec-saldo--positivo' : 'rec-saldo--negativo');
  }
}

// ── Gráfico (Chart.js) ────────────────────────────────────────

function renderizarGrafico(dados) {
  const canvas = document.getElementById('fc-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (_chart) { _chart.destroy(); _chart = null; }

  const recData  = dados.map((d) => d.rec);
  const despData = dados.map((d) => d.desp + d.proj); // real + projeção
  const orcData  = dados.map((d) => d.orc || null);
  const acumData = dados.map((d) => d.acum);

  _chart = new Chart(canvas, {
    data: {
      labels: MESES,
      datasets: [
        {
          type: 'bar',
          label: 'Receitas',
          data: recData,
          backgroundColor: coresGrafico().receita.bg,
          borderColor: coresGrafico().receita.border,
          borderWidth: 1,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Despesas',
          data: despData,
          backgroundColor: dados.map((d) =>
            d.isFuturo
              ? coresGrafico().despesaFade
              : coresGrafico().despesa.bg,
          ),
          borderColor: coresGrafico().despesa.border,
          borderWidth: 1,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Orçado',
          data: orcData,
          backgroundColor: coresGrafico().orcado.bg,
          borderColor: coresGrafico().orcado.border,
          borderWidth: 1,
          borderDash: [4, 4],
          order: 3,
        },
        {
          type: 'line',
          label: 'Saldo Acumulado',
          data: acumData,
          borderColor: coresGrafico().saldo.border,
          backgroundColor: coresGrafico().saldo.bg,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: acumData.map((v) => (v >= 0 ? coresGrafico().pontoPositivo : coresGrafico().pontoNegativo)),
          pointBorderColor: getChartColors().pointBorder,
          pointBorderWidth: 1.5,
          yAxisID: 'yAcum',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: getChartColors().grid },
          ticks: { font: { size: 13 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: getChartColors().grid },
          ticks: {
            callback: (v) =>
              new Intl.NumberFormat('pt-BR', {
                notation: 'compact', style: 'currency', currency: 'BRL',
              }).format(v),
            font: { size: 13 },
          },
          title: { display: true, text: 'R$ / mês', font: { size: 13 } },
        },
        yAcum: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            callback: (v) =>
              new Intl.NumberFormat('pt-BR', {
                notation: 'compact', style: 'currency', currency: 'BRL',
              }).format(v),
            font: { size: 13 },
          },
          title: { display: true, text: 'Acumulado', font: { size: 13 } },
        },
      },
    },
  });
}

// ── Tabela mensal ─────────────────────────────────────────────

function renderizarTabela(dados) {
  const tbody = document.getElementById('fc-tbody');
  if (!tbody) return;

  // ENH-007 Cenário A — ano selecionado sem nenhuma movimentação
  const temDados = dados.some(d => d.rec > 0 || d.desp > 0);
  if (!temDados) {
    tbody.innerHTML = `<tr><td colspan="7">
      ${emptyStateHTML(
        SVG_BAR_CHART,
        `Nenhuma movimentação em ${_ano}.`,
        'Adicione uma receita ou despesa para começar.',
        `<a href="despesas.html" class="btn btn-primary btn-sm">Nova movimentação</a>`
      )}
    </td></tr>`;
    return;
  }

  const mesAtualIdx = new Date().getFullYear() === _ano ? new Date().getMonth() : -1;

  tbody.innerHTML = dados.map(({ mes, rec, desp, orc, saldo, acum, isFuturo }) => {
    const isAtual = mes === mesAtualIdx;
    const situacao = getSituacao(rec, desp, orc, isFuturo);
    return `
      <tr class="${isAtual ? 'fc-tr--atual' : ''} ${isFuturo ? 'fc-tr--futuro' : ''}">
        <td class="fc-td-mes">${isAtual ? '▶ ' : ''}${MESES_COMPLETOS[mes]}</td>
        <td class="fc-td-num fc-verde">${fmt(rec)}</td>
        <td class="fc-td-num fc-vermelho">${fmt(desp)}</td>
        <td class="fc-td-num fc-cinza">${orc ? fmt(orc) : '—'}</td>
        <td class="fc-td-num ${saldo >= 0 ? 'fc-verde' : 'fc-vermelho'}">${fmt(saldo)}</td>
        <td class="fc-td-num ${acum >= 0 ? 'fc-azul' : 'fc-vermelho'}">${fmt(acum)}</td>
        <td class="fc-td-sit">${situacao}</td>
      </tr>`;
  }).join('');
}

function getSituacao(rec, desp, orc, isFuturo) {
  if (isFuturo) return '<span class="fc-badge fc-badge--futuro">Previsto</span>';
  if (rec === 0 && desp === 0) return '<span class="fc-badge fc-badge--vazio">Sem dados</span>';
  const saldo = rec - desp;
  if (orc > 0 && desp > orc)   return '<span class="fc-badge fc-badge--critico">Acima orç.</span>';
  if (saldo >= 0)               return '<span class="fc-badge fc-badge--ok">Positivo</span>';
  return '<span class="fc-badge fc-badge--negativo">Negativo</span>';
}

// ── Helpers ───────────────────────────────────────────────────

function setTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function mostrarLoading(show) {
  const el = document.getElementById('fc-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ── Forecast de Caixa (RF-067) ────────────────────────────────

/**
 * Formata ano + mês (0-based) como 'YYYY-MM'.
 * @param {number} ano
 * @param {number} mes0 — mês 0-based
 * @returns {string}
 */
function toMesStr(ano, mes0) {
  return `${ano}-${String(mes0 + 1).padStart(2, '0')}`;
}

async function carregarForecast() {
  const tbody = document.getElementById('fc-forecast-tbody');
  if (!tbody) return;
  tbody.innerHTML = skeletonTableRows(6, 6);

  try {
    const hoje    = new Date();
    const anoHoje = hoje.getFullYear();
    const mesHoje = hoje.getMonth(); // 0-based

    // N-1 e N-2 relativos ao mês atual
    const dtN1 = new Date(anoHoje, mesHoje - 1, 1);
    const dtN2 = new Date(anoHoje, mesHoje - 2, 1);

    // Range dos próximos 6 meses (para parcelas)
    const dtM1  = new Date(anoHoje, mesHoje + 1, 1);
    const dtM6  = new Date(anoHoje, mesHoje + 6, 1);
    const mesInicio = toMesStr(dtM1.getFullYear(), dtM1.getMonth());
    const mesFim    = toMesStr(dtM6.getFullYear(), dtM6.getMonth());

    // Anos cobertos pelos próximos 6 meses (pode cruzar ano)
    const yearsNeeded = new Set();
    for (let i = 1; i <= 6; i++) {
      yearsNeeded.add(new Date(anoHoje, mesHoje + i, 1).getFullYear());
    }

    const [despN1, despN2, recN1, recN2, projecoes, ...orcArrays] = await Promise.all([
      buscarDespesasMes(_grupoId, dtN1.getFullYear(), dtN1.getMonth() + 1),
      buscarDespesasMes(_grupoId, dtN2.getFullYear(), dtN2.getMonth() + 1),
      buscarReceitasMes(_grupoId, dtN1.getFullYear(), dtN1.getMonth() + 1),
      buscarReceitasMes(_grupoId, dtN2.getFullYear(), dtN2.getMonth() + 1),
      buscarProjecoesRange(_grupoId, mesInicio, mesFim),
      ...[...yearsNeeded].map((y) => buscarOrcamentosAno(_grupoId, y)),
    ]);

    const orcamentos = orcArrays.flat();

    const forecast = gerarForecast({
      despesasMesN1: despN1,
      despesasMesN2: despN2,
      receitasMesN1: recN1,
      receitasMesN2: recN2,
      projecoes,
      orcamentos,
      hoje,
    });

    renderizarForecast(forecast);
  } catch (err) {
    console.error('[fluxo-caixa] Erro ao carregar forecast:', err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="fc-empty">Erro ao calcular forecast.</td></tr>';
    }
  }
}

function renderizarForecast(forecast) {
  const tbody = document.getElementById('fc-forecast-tbody');
  if (!tbody) return;

  // Flag estimativa limitada
  const notaEl = document.getElementById('fc-forecast-nota');
  if (notaEl) {
    notaEl.style.display = forecast.some((m) => m.estimativaLimitada) ? '' : 'none';
  }

  if (!forecast.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      ${emptyStateHTML(
        SVG_BAR_CHART,
        'Sem dados suficientes para forecast.',
        'Adicione movimentações dos últimos meses para ativar a previsão.'
      )}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = forecast.map(({ mesLabel, ano, receitasEsperadas, recorrentes, parcelas, variaveis, saldoProjetado, estimativaLimitada }) => {
    const saldoCls = saldoProjetado >= 0 ? 'fc-verde' : 'fc-vermelho';
    const estimFlag = estimativaLimitada
      ? '<span class="fc-badge fc-badge--estimativa" title="Dados históricos insuficientes (< 3 transações)">estimativa ✲</span>'
      : '';
    return `
      <tr class="fc-tr--futuro">
        <td class="fc-td-mes">${escMesLabel(mesLabel, ano)}</td>
        <td class="fc-td-num fc-verde">${fmt(receitasEsperadas)}</td>
        <td class="fc-td-num fc-vermelho">${fmt(recorrentes)}</td>
        <td class="fc-td-num fc-vermelho">${fmt(parcelas)}</td>
        <td class="fc-td-num fc-cinza">${variaveis > 0 ? fmt(variaveis) : '—'}</td>
        <td class="fc-td-num ${saldoCls}">${fmt(saldoProjetado)} ${estimFlag}</td>
      </tr>`;
  }).join('');
}

/**
 * Formata label do mês sem dados externos (apenas constante interna).
 * Seguro para innerHTML — não usa dados do Firestore.
 */
function escMesLabel(label, ano) {
  return `${label}/${String(ano).slice(2)}`;
}

// ── NRF-NAV F2: Compromissos Comprometidos ────────────────────

async function carregarCompromissos() {
  const tbody = document.getElementById('fc-compromissos-tbody');
  if (!tbody) return;

  tbody.innerHTML = skeletonTableRows(3, 2);

  try {
    const hoje = new Date();
    const dadosPorMes = await buscarProjecoesAgregadas(_grupoId, hoje.getMonth() + 1, hoje.getFullYear());
    const meses = Object.values(dadosPorMes).sort((a, b) =>
      a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes
    );

    const temDados = meses.some(m => m.total > 0);
    if (!temDados) {
      tbody.innerHTML = `<tr><td colspan="2">
        ${emptyStateHTML(
          SVG_CHECK_CIRCLE,
          'Nenhuma parcela comprometida nos próximos 6 meses.',
          'Ótimo — sem compromissos futuros de cartão.'
        )}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = meses.map(({ mes, ano, total }) => {
      if (total === 0) return '';
      const saldoCls = 'fc-vermelho';
      return `<tr class="fc-tr--futuro">
        <td class="fc-td-mes">${MESES_COMPLETOS[mes - 1]} ${ano}</td>
        <td class="fc-td-num ${saldoCls}">${fmt(total)}</td>
      </tr>`;
    }).filter(Boolean).join('');
  } catch (err) {
    console.error('[fluxo-caixa] Erro ao carregar compromissos:', err);
    const tbody2 = document.getElementById('fc-compromissos-tbody');
    if (tbody2) tbody2.innerHTML = '<tr><td colspan="2" class="fc-empty">Erro ao carregar compromissos.</td></tr>';
  }
}
