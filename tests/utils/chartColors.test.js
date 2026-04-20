import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// chartColors.js usa getComputedStyle(document.documentElement) que não existe
// no ambiente Node. Mockamos os globais antes de importar o módulo.

function makeGetComputedStyle(overrides = {}) {
  return vi.fn().mockReturnValue({
    getPropertyValue: vi.fn((prop) => (overrides[prop] ?? '')),
  });
}

describe('coresGrafico', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('document', { documentElement: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna objeto com todas as chaves esperadas', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle());
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores).toHaveProperty('receita');
    expect(cores).toHaveProperty('receitaFade');
    expect(cores).toHaveProperty('despesa');
    expect(cores).toHaveProperty('despesaFade');
    expect(cores).toHaveProperty('saldo');
    expect(cores).toHaveProperty('saldoNeg');
    expect(cores).toHaveProperty('orcado');
    expect(cores).toHaveProperty('pontoPositivo');
    expect(cores).toHaveProperty('pontoNegativo');
  });

  it('usa valores fallback quando CSS custom properties estão vazias', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle()); // tudo vazio
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores.receita.border).toBe('#10b981');
    expect(cores.despesa.border).toBe('#ef4444');
    expect(cores.saldo.border).toBe('#1565c0');
    expect(cores.saldoNeg).toBe('#ef4444');
    expect(cores.pontoPositivo).toBe('#1565c0');
    expect(cores.pontoNegativo).toBe('#ef4444');
  });

  it('usa CSS custom properties quando disponíveis', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle({
      '--color-income':     '#custom-income',
      '--color-danger':     '#custom-danger',
      '--color-info':       '#custom-info',
      '--color-text-muted': '#custom-muted',
    }));
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores.receita.border).toBe('#custom-income');
    expect(cores.despesa.border).toBe('#custom-danger');
    expect(cores.saldo.border).toBe('#custom-info');
    expect(cores.orcado.border).toBe('#custom-muted');
  });

  it('cores de receita e despesa têm bg e border definidos', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle());
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores.receita).toHaveProperty('bg');
    expect(cores.receita).toHaveProperty('border');
    expect(cores.despesa).toHaveProperty('bg');
    expect(cores.despesa).toHaveProperty('border');
  });

  it('saldo tem bg semitransparente e border', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle());
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores.saldo).toHaveProperty('bg');
    expect(cores.saldo).toHaveProperty('border');
  });

  it('receitaFade e despesaFade são strings rgba', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle());
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores.receitaFade).toMatch(/^rgba\(/);
    expect(cores.despesaFade).toMatch(/^rgba\(/);
  });

  it('retorna a mesma referência de cache nas chamadas subsequentes', async () => {
    const mockGetCS = makeGetComputedStyle();
    vi.stubGlobal('getComputedStyle', mockGetCS);
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores1 = coresGrafico();
    const callsAfterFirst = mockGetCS.mock.calls.length;
    const cores2 = coresGrafico();
    // mesma referência (cache hit)
    expect(cores1).toBe(cores2);
    // segunda chamada não aciona getComputedStyle novamente
    expect(mockGetCS.mock.calls.length).toBe(callsAfterFirst);
  });

  it('CSS property com espaços extras é limpa pelo trim()', async () => {
    vi.stubGlobal('getComputedStyle', makeGetComputedStyle({
      '--color-income': '  #spacedColor  ',
    }));
    const { coresGrafico } = await import('../../src/js/utils/chartColors.js');
    const cores = coresGrafico();
    expect(cores.receita.border).toBe('#spacedColor');
  });
});
