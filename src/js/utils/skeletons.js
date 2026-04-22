// ============================================================
// UTILS: Skeleton / Empty-State / Error-State HTML generators
// Sprint 2 — Melhorias Visuais (v3.16.0)
// ============================================================

/**
 * Gera N cards skeleton para listas de transações (despesas/receitas).
 * @param {number} count — quantidade de itens skeleton
 * @returns {string} HTML string
 */
export function skeletonCards(count = 5) {
  const widths = ['70%', '55%', '80%', '60%', '75%'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const w = widths[i % widths.length];
    html += `
      <div class="skeleton-item" aria-hidden="true">
        <div class="skeleton skeleton-circle"></div>
        <div class="skeleton-lines">
          <div class="skeleton skeleton-line" style="width:${w}"></div>
          <div class="skeleton skeleton-line--sm"></div>
        </div>
        <div class="skeleton skeleton-amount"></div>
      </div>`;
  }
  return html;
}

/**
 * Gera N linhas skeleton para tabelas (fatura/planejamento).
 * @param {number} count — quantidade de linhas
 * @param {number} cols  — número de colunas
 * @returns {string} HTML string (<tr> elements)
 */
export function skeletonTableRows(count = 6, cols = 7) {
  const colWidths = ['60px', '80%', '50%', '40%', '60px', '70px', '50px'];
  let html = '';
  for (let i = 0; i < count; i++) {
    html += '<tr aria-hidden="true">';
    for (let c = 0; c < cols; c++) {
      const w = colWidths[c % colWidths.length];
      html += `<td><div class="skeleton skeleton-line" style="width:${w};margin:0"></div></td>`;
    }
    html += '</tr>';
  }
  return html;
}

/**
 * Gera um span skeleton inline para valores KPI numéricos (ex: "R$ 0,00" enquanto carrega).
 * @param {string} [width] — largura do placeholder
 * @returns {string} HTML string
 */
export function skeletonKpiValue(width = '90px') {
  return `<span class="skeleton skeleton-kpi" style="width:${width};display:inline-block"></span>`;
}

/**
 * Gera um bloco skeleton para área de gráfico (canvas container).
 * @param {number} [height] — altura em px do placeholder
 * @returns {string} HTML string
 */
export function skeletonChart(height = 200) {
  return `<div class="skeleton skeleton-chart" style="height:${height}px" aria-hidden="true"></div>`;
}

/**
 * Gera N itens skeleton para listas de investimentos ou passivos (patrimônio).
 * @param {number} count — quantidade de itens
 * @returns {string} HTML string
 */
export function skeletonPatrimonioItems(count = 3) {
  const widths = ['55%', '70%', '45%'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const w = widths[i % widths.length];
    html += `
      <div class="skeleton-patrimonio-item" aria-hidden="true">
        <div class="skeleton-patrimonio-info">
          <div class="skeleton skeleton-line" style="width:${w}"></div>
          <div class="skeleton skeleton-line--sm"></div>
        </div>
        <div class="skeleton skeleton-patrimonio-value"></div>
      </div>`;
  }
  return html;
}

/**
 * Gera bloco de empty-state centralizado.
 * @param {string} icon    — emoji ou ícone
 * @param {string} title   — título principal
 * @param {string} [hint]  — dica secundária
 * @returns {string} HTML string
 */
export function emptyStateHTML(icon, title, hint = '') {
  return `
    <div class="empty-state">
      <span class="empty-state__icon">${icon}</span>
      <p class="empty-state__title">${title}</p>
      ${hint ? `<p class="empty-state__hint">${hint}</p>` : ''}
    </div>`;
}

/**
 * Gera bloco de error-state com botão de retry.
 * @param {string} title — título do erro
 * @param {string} hint  — dica para o usuário
 * @returns {string} HTML string
 */
export function errorStateHTML(title, hint) {
  return `
    <div class="error-state">
      <p class="error-state__title">${title}</p>
      <p class="error-state__hint">${hint}</p>
      <button class="btn btn-outline btn-sm error-retry">Tentar novamente</button>
    </div>`;
}
