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

function _hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getChartColors() {
  const patrimonio = _css('--color-balance') || '#4A7FA5';
  const ativos     = _css('--color-income')  || '#5B8C6B';
  const passivos   = _css('--color-danger')  || '#B55440';
  return {
    ...coresGrafico(),
    patrimonio:  { border: patrimonio, bg: _hexToRgba(patrimonio, 0.08) },
    ativos:      { border: ativos,     bg: _hexToRgba(ativos,     0.08) },
    passivos:    { border: passivos,   bg: _hexToRgba(passivos,   0.08) },
    grid:        _css('--chart-grid')         || 'rgba(0,0,0,.05)',
    pointBorder: _css('--chart-point-border') || '#fff',
  };
}

export const CORES_CATEGORIA = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  '#d37295', '#a0cbe8',
];

export function corPorIndice(i) {
  return CORES_CATEGORIA[i % CORES_CATEGORIA.length];
}
