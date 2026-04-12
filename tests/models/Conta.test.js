import { describe, it, expect } from 'vitest';
import { modelConta, CONTAS_PADRAO, BANDEIRAS_CARTAO } from '../../src/js/models/Conta.js';

// ── RF-062: modelConta ──────────────────────────────────────────

describe('modelConta', () => {
  it('retorna campos base para conta tipo banco', () => {
    const c = modelConta({ grupoId: 'g1', nome: 'Itaú', tipo: 'banco' });
    expect(c.grupoId).toBe('g1');
    expect(c.nome).toBe('Itaú');
    expect(c.tipo).toBe('banco');
    expect(c.ativa).toBe(true);
    expect(c.emoji).toBe('🏦');
    expect(c).not.toHaveProperty('bandeira');
    expect(c).not.toHaveProperty('emissor');
  });

  it('tipo padrão é banco', () => {
    const c = modelConta({ grupoId: 'g1', nome: 'Teste' });
    expect(c.tipo).toBe('banco');
  });

  it('ativa é true por padrão', () => {
    const c = modelConta({ grupoId: 'g1', nome: 'Teste' });
    expect(c.ativa).toBe(true);
  });

  it('ativa pode ser false', () => {
    const c = modelConta({ grupoId: 'g1', nome: 'Teste', ativa: false });
    expect(c.ativa).toBe(false);
  });

  it('trim no nome', () => {
    const c = modelConta({ grupoId: 'g1', nome: '  Nubank  ' });
    expect(c.nome).toBe('Nubank');
  });

  it('nome null vira string vazia', () => {
    const c = modelConta({ grupoId: 'g1', nome: null });
    expect(c.nome).toBe('');
  });

  // RF-062: campos de cartão
  it('inclui campos de cartão quando tipo === "cartao"', () => {
    const c = modelConta({
      grupoId: 'g1', nome: 'Nubank Ana', tipo: 'cartao',
      bandeira: 'mastercard', emissor: 'nubank', ultimos4: '1234',
      diaFechamento: 20, diaVencimento: 5,
      contaPagadoraId: 'conta1', titularPadraoId: 'user1',
    });
    expect(c.tipo).toBe('cartao');
    expect(c.bandeira).toBe('mastercard');
    expect(c.emissor).toBe('nubank');
    expect(c.ultimos4).toBe('1234');
    expect(c.diaFechamento).toBe(20);
    expect(c.diaVencimento).toBe(5);
    expect(c.contaPagadoraId).toBe('conta1');
    expect(c.titularPadraoId).toBe('user1');
  });

  it('não inclui campos de cartão quando tipo !== "cartao"', () => {
    const c = modelConta({
      grupoId: 'g1', nome: 'Itaú', tipo: 'banco',
      bandeira: 'visa', emissor: 'itau',
    });
    expect(c).not.toHaveProperty('bandeira');
    expect(c).not.toHaveProperty('emissor');
  });

  it('campos de cartão opcionais não são incluídos quando vazios', () => {
    const c = modelConta({
      grupoId: 'g1', nome: 'Cartão Básico', tipo: 'cartao',
    });
    expect(c.tipo).toBe('cartao');
    expect(c).not.toHaveProperty('bandeira');
    expect(c).not.toHaveProperty('emissor');
    expect(c).not.toHaveProperty('ultimos4');
    expect(c).not.toHaveProperty('diaFechamento');
  });

  it('diaFechamento e diaVencimento são convertidos para number', () => {
    const c = modelConta({
      grupoId: 'g1', nome: 'Cartão', tipo: 'cartao',
      diaFechamento: '20', diaVencimento: '5',
    });
    expect(c.diaFechamento).toBe(20);
    expect(c.diaVencimento).toBe(5);
  });

  it('_legado é setado apenas quando tipo === "cartao"', () => {
    const c = modelConta({
      grupoId: 'g1', nome: 'Cartão Legado', tipo: 'cartao', _legado: true,
    });
    expect(c._legado).toBe(true);

    const c2 = modelConta({
      grupoId: 'g1', nome: 'Banco', tipo: 'banco', _legado: true,
    });
    expect(c2).not.toHaveProperty('_legado');
  });
});

// ── RF-062: CONTAS_PADRAO ───────────────────────────────────────

describe('CONTAS_PADRAO', () => {
  it('não contém "Cartão de Crédito" genérico', () => {
    const nomes = CONTAS_PADRAO.map(c => c.nome.toLowerCase());
    expect(nomes).not.toContain('cartão de crédito');
  });

  it('contém 10 contas padrão (9 bancos + Dinheiro)', () => {
    expect(CONTAS_PADRAO).toHaveLength(10);
  });

  it('todas as contas têm nome, emoji, cor e tipo', () => {
    for (const c of CONTAS_PADRAO) {
      expect(c.nome).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.cor).toBeTruthy();
      expect(['banco', 'dinheiro']).toContain(c.tipo);
    }
  });

  it('nenhuma conta padrão é tipo cartao', () => {
    expect(CONTAS_PADRAO.every(c => c.tipo !== 'cartao')).toBe(true);
  });
});

// ── RF-062: BANDEIRAS_CARTAO ────────────────────────────────────

describe('BANDEIRAS_CARTAO', () => {
  it('contém as bandeiras esperadas', () => {
    expect(BANDEIRAS_CARTAO).toContain('visa');
    expect(BANDEIRAS_CARTAO).toContain('mastercard');
    expect(BANDEIRAS_CARTAO).toContain('elo');
    expect(BANDEIRAS_CARTAO).toContain('amex');
    expect(BANDEIRAS_CARTAO).toContain('hiper');
    expect(BANDEIRAS_CARTAO).toContain('outros');
    expect(BANDEIRAS_CARTAO).toHaveLength(6);
  });
});
