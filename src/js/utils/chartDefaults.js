// ============================================================
// chartDefaults — aplica tipografia nos gráficos Chart.js
// NRF-UX F7 (#199): lê tokens CSS em vez de valores fixos
// ============================================================

const _css = (prop) => {
  if (typeof getComputedStyle === 'undefined' || typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
};

const _px = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
};

export function aplicarDefaultsControllerCharts() {
  if (typeof Chart === 'undefined') return;

  const family = _css('--font-family') || "'Inter', sans-serif";
  const weight = _css('--fw-chart')    || '500';
  const tick    = _px(_css('--font-size-chart-tick'),    13);
  const legend  = _px(_css('--font-size-chart-legend'),  14);
  const tooltip = _px(_css('--font-size-chart-tooltip'), 14);

  Chart.defaults.font.size   = tick;
  Chart.defaults.font.family = family;
  Chart.defaults.font.weight = weight;

  Chart.defaults.plugins.tooltip.bodyFont  = { size: tooltip, family, weight };
  Chart.defaults.plugins.tooltip.titleFont = { size: tooltip, family, weight: '600' };
  Chart.defaults.plugins.legend.labels.font = { size: legend, family, weight };
}
