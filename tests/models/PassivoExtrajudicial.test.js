import { describe, it, expect } from 'vitest';
import { modelPassivoExtrajudicial, criarPassivoExtrajudicial, STATUS_PASSIVO } from '../../src/js/models/PassivoExtrajudicial.js';

describe('STATUS_PASSIVO', () => {
  it('contém todos os status esperados', () => {
    expect(STATUS_PASSIVO).toContain('em_acompanhamento');
    expect(STATUS_PASSIVO).toContain('em_negociacao');
    expect(STATUS_PASSIVO).toContain('parcelada');
    expect(STATUS_PASSIVO).toContain('quitada');
  });
});

describe('modelPassivoExtrajudicial', () => {
  const base = {
    grupoId: 'g1',
    credor: 'Banco Safra',
    descricao: 'Dívida contrato 123',
    valorOriginal: 50000,
    valorAtualizado: 52000,
    dataOrigem: new Date('2024-01-15'),
    status: 'em_acompanhamento',
  };

  it('cria modelo com campos obrigatórios', () => {
    const p = modelPassivoExtrajudicial(base);
    expect(p.grupoId).toBe('g1');
    expect(p.credor).toBe('Banco Safra');
    expect(p.valorOriginal).toBe(50000);
    expect(p.valorAtualizado).toBe(52000);
    expect(p.status).toBe('em_acompanhamento');
  });

  it('valorAtualizado fallback para valorOriginal', () => {
    const p = modelPassivoExtrajudicial({ ...base, valorAtualizado: undefined });
    expect(p.valorAtualizado).toBe(50000);
  });

  it('status default é em_acompanhamento', () => {
    const p = modelPassivoExtrajudicial({ ...base, status: undefined });
    expect(p.status).toBe('em_acompanhamento');
  });

  it('aceita dataOrigem como string', () => {
    const p = modelPassivoExtrajudicial({ ...base, dataOrigem: '2024-06-01' });
    expect(p.dataOrigem).toBeInstanceOf(Date);
  });

  it('inclui campo observacoes quando presente', () => {
    const p = modelPassivoExtrajudicial({ ...base, observacoes: 'nota legal' });
    expect(p.observacoes).toBe('nota legal');
  });

  it('omite observacoes quando ausente', () => {
    const p = modelPassivoExtrajudicial(base);
    expect(p).not.toHaveProperty('observacoes');
  });

  it('trim no credor', () => {
    const p = modelPassivoExtrajudicial({ ...base, credor: '  Banco ABC  ' });
    expect(p.credor).toBe('Banco ABC');
  });
});

describe('criarPassivoExtrajudicial', () => {
  const base = {
    grupoId: 'g1',
    credor: 'Credor X',
    descricao: 'Desc',
    valorOriginal: 10000,
    valorAtualizado: 11000,
    dataOrigem: new Date('2025-01-01'),
    status: 'em_negociacao',
  };

  it('cria com dados válidos', () => {
    const p = criarPassivoExtrajudicial(base);
    expect(p.credor).toBe('Credor X');
    expect(p.valorOriginal).toBe(10000);
  });

  it('lança erro sem grupoId', () => {
    expect(() => criarPassivoExtrajudicial({ ...base, grupoId: '' })).toThrow('grupoId');
  });

  it('lança erro sem credor', () => {
    expect(() => criarPassivoExtrajudicial({ ...base, credor: '  ' })).toThrow('Credor');
  });

  it('lança erro com valorOriginal zero', () => {
    expect(() => criarPassivoExtrajudicial({ ...base, valorOriginal: 0 })).toThrow('Valor');
  });

  it('lança erro com valorOriginal negativo', () => {
    expect(() => criarPassivoExtrajudicial({ ...base, valorOriginal: -500 })).toThrow('Valor');
  });
});
