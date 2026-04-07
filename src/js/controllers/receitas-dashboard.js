// ============================================================
// CONTROLLER: Receitas — Dashboard
// Renderiza a seção de receitas no dashboard principal.
// ============================================================

import { formatarMoeda } from '../utils/formatters.js';
import { definirTexto } from '../utils/helpers.js';

/**
 * Renderiza o painel de receitas no dashboard.
 * @param {Array} categoriasReceita  — categorias do tipo 'receita'
 * @param {Array} receitas           — receitas do mês
 * @param {number} totalDespesas     — total gasto no mês (para calcular saldo)
 */
export function renderizarDashboardReceitas(categoriasReceita, receitas, totalDespesas = 0) {
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
    const cor   = cat.cor ?? 'var(--color-income-dark)';

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
}
