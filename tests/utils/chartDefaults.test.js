import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { aplicarDefaultsControllerCharts } from '../../src/js/utils/chartDefaults.js';

const TOKEN_MAP = {
  '--font-size-chart-tick':    '13px',
  '--font-size-chart-legend':  '14px',
  '--font-size-chart-tooltip': '14px',
  '--font-family':             "'Inter', sans-serif",
  '--fw-chart':                '500',
};

function mockBrowserGlobals() {
  globalThis.document = { documentElement: {} };
  globalThis.getComputedStyle = () => ({
    getPropertyValue: (prop) => TOKEN_MAP[prop] ?? '',
  });
}

function cleanupBrowserGlobals() {
  delete globalThis.document;
  delete globalThis.getComputedStyle;
  delete globalThis.Chart;
}

function makeChart() {
  return { defaults: { font: {}, plugins: { tooltip: {}, legend: { labels: {} } } } };
}

describe('chartDefaults', () => {
  beforeEach(mockBrowserGlobals);
  afterEach(cleanupBrowserGlobals);

  it('não lança erro quando Chart não está disponível', () => {
    expect(() => aplicarDefaultsControllerCharts()).not.toThrow();
  });

  it('não altera Chart quando Chart é undefined explícito', () => {
    globalThis.Chart = undefined;
    expect(() => aplicarDefaultsControllerCharts()).not.toThrow();
  });

  it('configura font.size via token --font-size-chart-tick (13px)', () => {
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.font.size).toBe(13);
  });

  it('configura font.family via token --font-family', () => {
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.font.family).toBe("'Inter', sans-serif");
  });

  it('configura font.weight via token --fw-chart', () => {
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.font.weight).toBe('500');
  });

  it('configura tooltip bodyFont via tokens', () => {
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.plugins.tooltip.bodyFont).toEqual({
      size: 14, family: "'Inter', sans-serif", weight: '500',
    });
  });

  it('configura tooltip titleFont com weight 600', () => {
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.plugins.tooltip.titleFont).toEqual({
      size: 14, family: "'Inter', sans-serif", weight: '600',
    });
  });

  it('configura legend labels font via tokens', () => {
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.plugins.legend.labels.font).toEqual({
      size: 14, family: "'Inter', sans-serif", weight: '500',
    });
  });

  it('usa fallbacks quando tokens CSS retornam vazio', () => {
    globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
    globalThis.Chart = makeChart();
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.font.size).toBe(13);
    expect(globalThis.Chart.defaults.font.family).toBe("'Inter', sans-serif");
    expect(globalThis.Chart.defaults.font.weight).toBe('500');
  });
});
