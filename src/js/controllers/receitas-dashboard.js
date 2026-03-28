// ============================================================
// CONTROLLER: Receitas — Dashboard
// Renderiza a seção de receitas no dashboard principal.
// ============================================================

import { formatarMoeda } from '../utils/formatters.js';
import { definirTexto } from '../utils/helpers.js';

let _chartRecVsDesp = null;

/**
 * Renderiza o painel de receitas no dashboard.
 * @param {Array} categoriasReceita  — categorias do tipo 'receita'
 * @param {Array} receitas           — receitas do mês
 * @param {Array} categoriasDespesa  — categorias do tipo 'despesa'
 * @param {Array} despesas           — despesas do mês
 */
export function renderizarDashboardReceitas(categoriasReceita, receitas, categoriasDespesa = [], despesas = []) {
  const despesasReais = despesas.filter((d) => d.tipo !== 'projecao');
  const totalDespesas = despesasReais.reduce((s, d) => s + (d.valor ?? 0), 0);
  const totalReceitas = receitas.reduce((s, r) => s + (r.valor ?? 0), 0);
  const saldo         = totalReceitas - totalDespesas;

  definirTexto('rec-total',  formatarMoeda(totalReceitas));
  definirTexto('rec-saldo',  formatarMoeda(saldo));

  const saldoEl = document.getElementById('rec-saldo');
  if (saldoEl) {
    saldoEl.className = 'resumo-valor ' + (saldo >= 0 ? 'rec-saldo--positivo' : 'rec-saldo--negativo');
  }

  // Grid de categorias de receita
  const grid = document.getElementById('receitas-grid');
  if (!grid) return;

  if (!categoriasReceita.length) {
    grid.innerHTML = '<p class="empty-state">Nenhuma categoria de receita cadastrada.</p>';
    return;
  }

  // Soma receitas por categoria
  const gastoMap = {};
  receitas.forEach((r) => {
    gastoMap[r.categoriaId] = (gastoMap[r.categoriaId] ?? 0) + r.valor;
  });

  grid.innerHTML = categoriasReceita.map((cat) => {
    const total = gastoMap[cat.id] ?? 0;
    const cor   = cat.cor ?? '#2E7D32';

    return `
      <div class="card categoria-card rec-categoria-card">
        <div class="categoria-card-header">
          <span class="categoria-nome">
            <span>${cat.emoji}</span>
            <span>${cat.nome}</span>
          </span>
          ${total > 0 ? `<span class="rec-cat-valor" style="color:${cor};">${formatarMoeda(total)}</span>` : ''}
        </div>
        <div class="rec-bar-track">
          <div class="rec-bar-fill" style="width:${totalReceitas > 0 ? Math.min(total / totalReceitas * 100, 100) : 0}%; background:${cor};"></div>
        </div>
        <div class="categoria-valores">
          <span>${total > 0 ? formatarMoeda(total) : 'Sem lançamentos'}</span>
          <span style="color:${cor};font-size:.72rem;">${totalReceitas > 0 && total > 0 ? Math.round(total / totalReceitas * 100) + '%' : ''}</span>
        </div>
      </div>
    `;
  }).join('');

  renderizarGraficoReceitasDespesas(categoriasReceita, receitas, categoriasDespesa, despesasReais);
}

function renderizarGraficoReceitasDespesas(categoriasReceita, receitas, categoriasDespesa, despesas) {
  const canvas = document.getElementById('rec-vs-desp-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (_chartRecVsDesp) {
    _chartRecVsDesp.destroy();
    _chartRecVsDesp = null;
  }

  const mapNomeRec = Object.fromEntries(categoriasReceita.map((c) => [c.id, c.nome]));
  const mapNomeDesp = Object.fromEntries(categoriasDespesa.map((c) => [c.id, c.nome]));
  const recPorNome = new Map();
  const despPorNome = new Map();

  receitas.forEach((r) => {
    const nome = mapNomeRec[r.categoriaId] ?? 'Outras Receitas';
    recPorNome.set(nome, (recPorNome.get(nome) ?? 0) + (r.valor ?? 0));
  });
  despesas.forEach((d) => {
    const nome = mapNomeDesp[d.categoriaId] ?? 'Outras Despesas';
    despPorNome.set(nome, (despPorNome.get(nome) ?? 0) + (d.valor ?? 0));
  });

  const labels = Array.from(new Set([...recPorNome.keys(), ...despPorNome.keys()])).slice(0, 8);
  if (!labels.length) return;

  _chartRecVsDesp = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: labels.map((l) => recPorNome.get(l) ?? 0),
          backgroundColor: 'rgba(46, 125, 50, 0.75)',
          borderColor: '#2e7d32',
          borderWidth: 1,
        },
        {
          label: 'Despesas',
          data: labels.map((l) => despPorNome.get(l) ?? 0),
          backgroundColor: 'rgba(198, 40, 40, 0.72)',
          borderColor: '#c62828',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}
