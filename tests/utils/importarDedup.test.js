import { describe, it, expect } from 'vitest';
import { deveCarregarChavesReceitas } from '../../src/js/utils/importarDedup.js';

describe('deveCarregarChavesReceitas', () => {
  it('retorna true para banco', () => {
    expect(deveCarregarChavesReceitas('banco')).toBe(true);
  });

  it('retorna true para receita', () => {
    expect(deveCarregarChavesReceitas('receita')).toBe(true);
  });

  it('retorna true para cartao (estornos em fatura)', () => {
    expect(deveCarregarChavesReceitas('cartao')).toBe(true);
  });

  it('retorna false para despesa', () => {
    expect(deveCarregarChavesReceitas('despesa')).toBe(false);
  });
});

