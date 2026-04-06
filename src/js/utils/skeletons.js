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
      <div class="skeleton-item">
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
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      const w = colWidths[c % colWidths.length];
      html += `<td><div class="skeleton skeleton-line" style="width:${w};margin:0"></div></td>`;
    }
    html += '</tr>';
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
