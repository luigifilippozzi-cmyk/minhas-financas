// ============================================================
// chartDefaults — aplica tipografia Controller nos gráficos
// NRF-VISUAL F1 (#192): tamanhos alinhados aos tokens CSS
// ============================================================

export function aplicarDefaultsControllerCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.size = 14;
  Chart.defaults.plugins.tooltip.bodyFont  = { size: 14 };
  Chart.defaults.plugins.tooltip.titleFont = { size: 14 };
  Chart.defaults.plugins.legend.labels.font = { size: 14 };
}
