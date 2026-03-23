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
export function renderizarDashboard(categorias, despesas, orcamentos, nomeAtual = '') {
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

  // NRF-001: cálculo "Meu Bolso" vs "Família" (fix #90)
  // totalFamilia  = soma de todos os gastos reais (valor inteiro de cada despesa)
  // totalMeuBolso = minhas individuais (responsavel == eu) + 50% das conjuntas (todas)
  const despesasReais = despesas.filter(d => d.tipo !== 'projecao');
  const hasConjunta   = despesasReais.some(d => d.isConjunta);
  const totalFamilia  = despesasReais.reduce((s, d) => s + (d.valor ?? 0), 0);
  const totalMeuBolso = despesasReais.reduce((s, d) => {
    if (d.isConjunta) {
      // Despesa compartilhada: conta 50% independentemente de quem lançou
      return s + (d.valorAlocado ?? (d.valor ?? 0) / 2);
    }
    // Despesa individual: conta apenas se o responsável for o usuário logado
    const resp = (d.responsavel || d.portador || '').trim();
    if (!nomeAtual || resp === nomeAtual) return s + (d.valor ?? 0);
    return s;
  }, 0);

  const cardMB  = document.getElementById('card-meu-bolso');
  const cardFam = document.getElementById('card-familia');
  if (cardMB)  cardMB.style.display  = hasConjunta ? '' : 'none';
  if (cardFam) cardFam.style.display = hasConjunta ? '' : 'none';
  definirTexto('total-meu-bolso', formatarMoeda(totalMeuBolso));
  definirTexto('total-familia',   formatarMoeda(totalFamilia));

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
