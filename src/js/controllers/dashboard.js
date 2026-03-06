// ============================================================
// CONTROLLER: Dashboard — RF-009
// ============================================================

import { formatarMoeda, formatarPercentual } from '../utils/formatters.js';
import { calcularStatusOrcamento } from '../models/Orcamento.js';
import { definirTexto } from '../utils/helpers.js';

/**
 * Renderiza o dashboard de orçamentos.
 * @param {Array} categorias
 * @param {Array} despesas
 * @param {Array} orcamentos
 */
export function renderizarDashboard(categorias, despesas, orcamentos) {
  const grid = document.getElementById('categorias-grid');
  if (!grid) return;

  // Mapeia orçamentos por categoriaId
  const orcMap = Object.fromEntries(orcamentos.map((o) => [o.categoriaId, o.valorLimite]));

  // Soma despesas por categoria
  const gastoMap = {};
  despesas.forEach((d) => {
    gastoMap[d.categoriaId] = (gastoMap[d.categoriaId] ?? 0) + d.valor;
  });

  // Totais gerais
  const totalOrcado = Object.values(orcMap).reduce((a, b) => a + b, 0);
  const totalGasto  = Object.values(gastoMap).reduce((a, b) => a + b, 0);

  definirTexto('total-orcado',    formatarMoeda(totalOrcado));
  definirTexto('total-gasto',     formatarMoeda(totalGasto));
  definirTexto('total-disponivel', formatarMoeda(totalOrcado - totalGasto));

  // Renderiza cards de categoria
  if (!categorias.length) {
    grid.innerHTML = '<p class="empty-state">Nenhuma categoria cadastrada.</p>';
    return;
  }

  grid.innerHTML = categorias.map((cat) => {
    const limite  = orcMap[cat.id] ?? 0;
    const gasto   = gastoMap[cat.id] ?? 0;
    const { percentual, classe } = calcularStatusOrcamento(gasto, limite);

    const largura = Math.min(percentual, 100);

    return `
      <div class="card categoria-card">
        <div class="categoria-card-header">
          <span class="categoria-nome">
            <span>${cat.emoji}</span>
            <span>${cat.nome}</span>
          </span>
          ${limite ? `<span class="categoria-percentual perc-${classe}">${formatarPercentual(percentual)}</span>` : ''}
        </div>

        <div class="progress-bar-track">
          <div
            class="progress-bar-fill progress-${classe}"
            style="width: ${largura}%"
          ></div>
        </div>

        <div class="categoria-valores">
          <span>Gasto: ${formatarMoeda(gasto)}</span>
          <span>${limite ? `Limite: ${formatarMoeda(limite)}` : 'Sem orçamento'}</span>
        </div>
      </div>
    `;
  }).join('');
}
