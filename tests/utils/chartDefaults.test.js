import { describe, it, expect, afterEach } from 'vitest';
import { aplicarDefaultsControllerCharts } from '../../src/js/utils/chartDefaults.js';

describe('chartDefaults', () => {
  afterEach(() => {
    delete globalThis.Chart;
  });

  it('não lança erro quando Chart não está disponível', () => {
    expect(() => aplicarDefaultsControllerCharts()).not.toThrow();
  });

  it('configura font.size global para 14', () => {
    globalThis.Chart = { defaults: { font: {}, plugins: { tooltip: {}, legend: { labels: {} } } } };
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.font.size).toBe(14);
  });

  it('configura tooltip bodyFont para size 14', () => {
    globalThis.Chart = { defaults: { font: {}, plugins: { tooltip: {}, legend: { labels: {} } } } };
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.plugins.tooltip.bodyFont).toEqual({ size: 14 });
  });

  it('configura tooltip titleFont para size 14', () => {
    globalThis.Chart = { defaults: { font: {}, plugins: { tooltip: {}, legend: { labels: {} } } } };
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.plugins.tooltip.titleFont).toEqual({ size: 14 });
  });

  it('configura legend labels font para size 14', () => {
    globalThis.Chart = { defaults: { font: {}, plugins: { tooltip: {}, legend: { labels: {} } } } };
    aplicarDefaultsControllerCharts();
    expect(globalThis.Chart.defaults.plugins.legend.labels.font).toEqual({ size: 14 });
  });

  it('não altera Chart quando Chart é undefined explícito', () => {
    globalThis.Chart = undefined;
    expect(() => aplicarDefaultsControllerCharts()).not.toThrow();
  });
});
