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
} from '../services/database.js';
import { coresGrafico } from '../utils/chartColors.js';

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
}

function agregarMensalmente(despesas, receitas, orcamentos) {
  const recMes  = Array(12).fill(0);
  const despMes = Array(12).fill(0);
  const orcMes  = Array(12).fill(0);

  receitas.forEach((r) => {
    const d = r.data?.toDate?.() ?? new Date(r.data);
    recMes[d.getMonth()] += r.valor ?? 0;
  });

  // Exclui projeções (parcelamentos futuros) das despesas realizadas
  despesas.filter((d) => d.tipo !== 'projecao').forEach((d) => {
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
          pointBorderColor: '#fff',
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
          grid: { color: 'rgba(0,0,0,.05)' },
          ticks: { font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,.05)' },
          ticks: {
            callback: (v) =>
              new Intl.NumberFormat('pt-BR', {
                notation: 'compact', style: 'currency', currency: 'BRL',
              }).format(v),
            font: { size: 11 },
          },
          title: { display: true, text: 'R$ / mês', font: { size: 11 } },
        },
        yAcum: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            callback: (v) =>
              new Intl.NumberFormat('pt-BR', {
                notation: 'compact', style: 'currency', currency: 'BRL',
              }).format(v),
            font: { size: 11 },
          },
          title: { display: true, text: 'Acumulado', font: { size: 11 } },
        },
      },
    },
  });
}

// ── Tabela mensal ─────────────────────────────────────────────

function renderizarTabela(dados) {
  const tbody = document.getElementById('fc-tbody');
  if (!tbody) return;

  if (!dados.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="fc-empty">Nenhum dado para o período.</td></tr>';
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
