/**
 * Cores para Chart.js — leitura única dos CSS custom properties.
 * Evita hardcodar hex nos datasets dos gráficos.
 */

const _css = (prop) =>
  getComputedStyle(document.documentElement).getPropertyValue(prop).trim();

let _cache = null;

export function coresGrafico() {
  if (_cache) return _cache;
  const income  = _css('--color-income')  || '#10b981';
  const expense = _css('--color-danger')  || '#ef4444';
  const info    = _css('--color-info')    || '#1565c0';
  const muted   = _css('--color-text-muted') || '#94a3b8';

  _cache = {
    receita:      { bg: 'rgba(46,125,50,0.75)',  border: income },
    receitaFade:  'rgba(46,125,50,0.3)',
    despesa:      { bg: 'rgba(198,40,40,0.75)',   border: expense },
    despesaFade:  'rgba(198,40,40,0.3)',
    saldo:        { border: info, bg: 'rgba(21,101,192,0.08)' },
    saldoNeg:     expense,
    orcado:       { bg: 'rgba(120,120,120,0.18)', border: muted },
    pontoPositivo: info,
    pontoNegativo: expense,
  };
  return _cache;
}
