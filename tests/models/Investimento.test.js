import { describe, it, expect } from 'vitest';
import { modelInvestimento, criarInvestimento, TIPOS_INVESTIMENTO } from '../../src/js/models/Investimento.js';

describe('TIPOS_INVESTIMENTO', () => {
  it('contém todos os tipos esperados', () => {
    expect(TIPOS_INVESTIMENTO).toContain('renda_fixa');
    expect(TIPOS_INVESTIMENTO).toContain('renda_variavel');
    expect(TIPOS_INVESTIMENTO).toContain('previdencia');
    expect(TIPOS_INVESTIMENTO).toContain('criptoativo');
    expect(TIPOS_INVESTIMENTO).toContain('outro');
  });
});

describe('modelInvestimento', () => {
  const base = {
    grupoId: 'g1',
    nome: 'Tesouro IPCA+ 2029',
    tipo: 'renda_fixa',
    instituicao: 'XP',
    valorAplicado: 10000,
    valorAtual: 10500,
    dataAtualizacao: new Date('2026-01-01'),
  };

  it('cria modelo com campos obrigatórios', () => {
    const inv = modelInvestimento(base);
    expect(inv.grupoId).toBe('g1');
    expect(inv.nome).toBe('Tesouro IPCA+ 2029');
    expect(inv.tipo).toBe('renda_fixa');
    expect(inv.valorAplicado).toBe(10000);
    expect(inv.valorAtual).toBe(10500);
    expect(inv.ativo).toBe(true);
  });

  it('ativo default é true', () => {
    const inv = modelInvestimento(base);
    expect(inv.ativo).toBe(true);
  });

  it('respeita ativo: false explícito', () => {
    const inv = modelInvestimento({ ...base, ativo: false });
    expect(inv.ativo).toBe(false);
  });

  it('valorAtual fallback para valorAplicado quando não fornecido', () => {
    const inv = modelInvestimento({ ...base, valorAtual: undefined });
    expect(inv.valorAtual).toBe(10000);
  });

  it('inclui campos opcionais quando presentes', () => {
    const inv = modelInvestimento({ ...base, liquidez: 'D+1', observacoes: 'nota' });
    expect(inv.liquidez).toBe('D+1');
    expect(inv.observacoes).toBe('nota');
  });

  it('omite campos opcionais quando ausentes', () => {
    const inv = modelInvestimento(base);
    expect(inv).not.toHaveProperty('liquidez');
    expect(inv).not.toHaveProperty('observacoes');
  });

  it('aceita dataAtualizacao como string', () => {
    const inv = modelInvestimento({ ...base, dataAtualizacao: '2026-03-01' });
    expect(inv.dataAtualizacao).toBeInstanceOf(Date);
  });

  it('usa data atual quando dataAtualizacao não fornecida', () => {
    const before = Date.now();
    const inv = modelInvestimento({ ...base, dataAtualizacao: undefined });
    expect(inv.dataAtualizacao).toBeInstanceOf(Date);
    expect(inv.dataAtualizacao.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it('trim no nome', () => {
    const inv = modelInvestimento({ ...base, nome: '  CDB Bradesco  ' });
    expect(inv.nome).toBe('CDB Bradesco');
  });
});

describe('criarInvestimento', () => {
  const base = {
    grupoId: 'g1',
    nome: 'CDB',
    tipo: 'renda_fixa',
    instituicao: 'Bradesco',
    valorAplicado: 5000,
    valorAtual: 5200,
  };

  it('cria com dados válidos', () => {
    const inv = criarInvestimento(base);
    expect(inv.nome).toBe('CDB');
    expect(inv.valorAplicado).toBe(5000);
  });

  it('lança erro sem grupoId', () => {
    expect(() => criarInvestimento({ ...base, grupoId: '' })).toThrow('grupoId');
  });

  it('lança erro sem nome', () => {
    expect(() => criarInvestimento({ ...base, nome: '   ' })).toThrow('Nome');
  });

  it('lança erro com valorAplicado zero', () => {
    expect(() => criarInvestimento({ ...base, valorAplicado: 0 })).toThrow('Valor');
  });

  it('lança erro com valorAplicado negativo', () => {
    expect(() => criarInvestimento({ ...base, valorAplicado: -100 })).toThrow('Valor');
  });
});
