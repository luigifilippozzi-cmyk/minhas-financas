// ============================================================
// Testes — models/Receita.js
//
// BUG-032: garante que mesFatura é propagado ao Firestore
// quando presente no objeto de entrada (estava ausente da
// lista opcionais, tornando a aba Fatura vazia para estornos
// de cartão importados).
// ============================================================
import { describe, it, expect } from 'vitest';
import { modelReceita } from '../../src/js/models/Receita.js';

function base(overrides = {}) {
  return {
    grupoId:     'grupo-1',
    usuarioId:   'user-1',
    categoriaId: 'cat-outros',
    descricao:   'Crédito Estorno',
    valor:       50,
    data:        new Date('2026-04-15T12:00:00'),
    ...overrides,
  };
}

describe('modelReceita — campos obrigatórios e defaults', () => {
  it('inclui grupoId, usuarioId, categoriaId, descricao, valor e data', () => {
    const r = modelReceita(base());
    expect(r.grupoId).toBe('grupo-1');
    expect(r.usuarioId).toBe('user-1');
    expect(r.categoriaId).toBe('cat-outros');
    expect(r.descricao).toBe('Crédito Estorno');
    expect(r.valor).toBe(50);
    expect(r.data).toBeInstanceOf(Date);
  });

  it('campos opcionais ausentes não aparecem no objeto', () => {
    const r = modelReceita(base());
    expect(r).not.toHaveProperty('responsavel');
    expect(r).not.toHaveProperty('origemBanco');
  });

  it('data como string é convertida para Date', () => {
    const r = modelReceita(base({ data: '2026-04-15' }));
    expect(r.data).toBeInstanceOf(Date);
  });
});

describe('modelReceita — BUG-032: mesFatura deve ser propagado', () => {
  it('REGRESSÃO BUG-032: mesFatura é incluído no objeto quando fornecido', () => {
    // Antes do fix, mesFatura estava ausente da lista opcionais — estornos
    // de cartão importados não apareciam corretamente na aba Fatura.
    const r = modelReceita(base({ mesFatura: '2026-04', origem: 'importacao' }));
    expect(r.mesFatura).toBe('2026-04');
    expect(r.origem).toBe('importacao');
  });

  it('REGRESSÃO BUG-032: mesFatura ausente no input não aparece no objeto (comportamento correto)', () => {
    const r = modelReceita(base());
    expect(r).not.toHaveProperty('mesFatura');
  });
});
