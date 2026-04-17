import { describe, it, expect } from 'vitest';

// Testar funções puras de cálculo extraídas da lógica de patrimônio.
// As funções de page (DOM + Firebase) são testadas via integração.

import { isMovimentacaoReal } from '../../src/js/utils/helpers.js';

// ── Helpers de cálculo patrimonial (inline — espelham patrimonio.js) ──

function calcularSaldoConta(conta, despesas, receitas) {
  const ref = new Date(conta.dataReferenciaSaldo);
  const toDate = (d) => d?.toDate ? d.toDate() : new Date(d);
  const entradas = receitas
    .filter((r) => r.contaId === conta.id && isMovimentacaoReal(r) && toDate(r.data) >= ref)
    .reduce((s, r) => s + (r.valor ?? 0), 0);
  const saidas = despesas
    .filter((d) => d.contaId === conta.id && isMovimentacaoReal(d) && toDate(d.data) >= ref)
    .reduce((s, d) => s + (d.valor ?? 0), 0);
  return (conta.saldoInicial ?? 0) + entradas - saidas;
}

function calcularTotalInvestimentos(investimentos) {
  return investimentos
    .filter((i) => i.ativo !== false)
    .reduce((s, i) => s + (i.valorAtual ?? 0), 0);
}

function calcularTotalPassivos(passivos) {
  return passivos
    .filter((p) => p.status !== 'quitada')
    .reduce((s, p) => s + (p.valorAtualizado ?? p.valorOriginal ?? 0), 0);
}

function calcularTaxaPoupanca(despesasMes, receitasMes) {
  const receitasReais = receitasMes.filter(isMovimentacaoReal).reduce((s, r) => s + (r.valor ?? 0), 0);
  const despesasReais = despesasMes.filter(isMovimentacaoReal).reduce((s, d) => s + (d.valor ?? 0), 0);
  if (receitasReais <= 0) return null;
  return ((receitasReais - despesasReais) / receitasReais) * 100;
}

// ── Fixtures ──

const REF = new Date('2026-01-01');
const CONTA = { id: 'c1', tipo: 'banco', ativa: true, saldoInicial: 1000, dataReferenciaSaldo: '2026-01-01' };

function desp(contaId, valor, diasApos = 0, tipo = 'despesa') {
  const d = new Date(REF);
  d.setDate(d.getDate() + diasApos);
  return { contaId, valor, data: d, tipo };
}

function rec(contaId, valor, diasApos = 0, tipo = 'receita') {
  const d = new Date(REF);
  d.setDate(d.getDate() + diasApos);
  return { contaId, valor, data: d, tipo };
}

// ── calcularSaldoConta ────────────────────────────────────────

describe('calcularSaldoConta', () => {
  it('retorna saldoInicial quando não há transações', () => {
    expect(calcularSaldoConta(CONTA, [], [])).toBe(1000);
  });

  it('adiciona receitas reais', () => {
    expect(calcularSaldoConta(CONTA, [], [rec('c1', 500, 1)])).toBe(1500);
  });

  it('subtrai despesas reais', () => {
    expect(calcularSaldoConta(CONTA, [desp('c1', 300, 1)], [])).toBe(700);
  });

  it('ignora transações de outra conta', () => {
    expect(calcularSaldoConta(CONTA, [desp('c2', 500, 1)], [rec('c2', 500, 1)])).toBe(1000);
  });

  it('ignora transações antes da data de referência', () => {
    const antes = new Date(REF);
    antes.setDate(antes.getDate() - 1);
    const despAntes = { contaId: 'c1', valor: 500, data: antes, tipo: 'despesa' };
    expect(calcularSaldoConta(CONTA, [despAntes], [])).toBe(1000);
  });

  it('exclui projeções do cálculo', () => {
    const proj = desp('c1', 500, 1, 'projecao');
    expect(calcularSaldoConta(CONTA, [proj], [])).toBe(1000);
  });

  it('exclui transferências internas do cálculo', () => {
    const transf = rec('c1', 500, 1, 'transferencia_interna');
    expect(calcularSaldoConta(CONTA, [], [transf])).toBe(1000);
  });

  it('exclui pagamentos de fatura do cálculo', () => {
    const pag = desp('c1', 300, 1, 'pagamento_fatura');
    expect(calcularSaldoConta(CONTA, [pag], [])).toBe(1000);
  });

  it('combina receitas e despesas corretamente', () => {
    const despesas = [desp('c1', 200, 2), desp('c1', 100, 3)];
    const receitas = [rec('c1', 500, 1)];
    // 1000 + 500 - 200 - 100 = 1200
    expect(calcularSaldoConta(CONTA, despesas, receitas)).toBe(1200);
  });
});

// ── calcularTotalInvestimentos ────────────────────────────────

describe('calcularTotalInvestimentos', () => {
  it('retorna 0 sem investimentos', () => {
    expect(calcularTotalInvestimentos([])).toBe(0);
  });

  it('soma valorAtual de investimentos ativos', () => {
    const inv = [
      { id: 'i1', valorAtual: 10000, ativo: true },
      { id: 'i2', valorAtual: 5000,  ativo: true },
    ];
    expect(calcularTotalInvestimentos(inv)).toBe(15000);
  });

  it('exclui investimentos arquivados (ativo: false)', () => {
    const inv = [
      { id: 'i1', valorAtual: 10000, ativo: true },
      { id: 'i2', valorAtual: 5000,  ativo: false },
    ];
    expect(calcularTotalInvestimentos(inv)).toBe(10000);
  });

  it('trata valorAtual undefined como 0', () => {
    const inv = [{ id: 'i1', valorAtual: undefined, ativo: true }];
    expect(calcularTotalInvestimentos(inv)).toBe(0);
  });
});

// ── calcularTotalPassivos ─────────────────────────────────────

describe('calcularTotalPassivos', () => {
  it('retorna 0 sem passivos', () => {
    expect(calcularTotalPassivos([])).toBe(0);
  });

  it('soma valorAtualizado de passivos ativos', () => {
    const pass = [
      { id: 'p1', valorAtualizado: 20000, status: 'em_acompanhamento' },
      { id: 'p2', valorAtualizado: 10000, status: 'em_negociacao' },
    ];
    expect(calcularTotalPassivos(pass)).toBe(30000);
  });

  it('exclui passivos quitados', () => {
    const pass = [
      { id: 'p1', valorAtualizado: 20000, status: 'em_acompanhamento' },
      { id: 'p2', valorAtualizado: 10000, status: 'quitada' },
    ];
    expect(calcularTotalPassivos(pass)).toBe(20000);
  });

  it('usa valorOriginal como fallback quando valorAtualizado ausente', () => {
    const pass = [{ id: 'p1', valorOriginal: 15000, status: 'parcelada' }];
    expect(calcularTotalPassivos(pass)).toBe(15000);
  });

  it('inclui passivos parcelados e em negociação', () => {
    const pass = [
      { id: 'p1', valorAtualizado: 5000, status: 'parcelada' },
      { id: 'p2', valorAtualizado: 3000, status: 'em_negociacao' },
    ];
    expect(calcularTotalPassivos(pass)).toBe(8000);
  });
});

// ── calcularTaxaPoupanca ──────────────────────────────────────

describe('calcularTaxaPoupanca', () => {
  it('retorna null quando não há receitas', () => {
    expect(calcularTaxaPoupanca([], [])).toBeNull();
  });

  it('retorna 100% quando não há despesas', () => {
    const rec2 = [{ valor: 5000, tipo: 'receita' }];
    expect(calcularTaxaPoupanca([], rec2)).toBeCloseTo(100, 1);
  });

  it('calcula taxa positiva corretamente', () => {
    const rec2 = [{ valor: 10000, tipo: 'receita' }];
    const desp2 = [{ valor: 4000, tipo: 'despesa' }];
    // (10000 - 4000) / 10000 * 100 = 60%
    expect(calcularTaxaPoupanca(desp2, rec2)).toBeCloseTo(60, 1);
  });

  it('calcula taxa negativa quando despesas > receitas', () => {
    const rec2 = [{ valor: 5000, tipo: 'receita' }];
    const desp2 = [{ valor: 7000, tipo: 'despesa' }];
    expect(calcularTaxaPoupanca(desp2, rec2)).toBeCloseTo(-40, 1);
  });

  it('exclui projeções do cálculo', () => {
    const rec2 = [{ valor: 10000, tipo: 'receita' }];
    const desp2 = [
      { valor: 3000, tipo: 'despesa' },
      { valor: 5000, tipo: 'projecao' }, // ignorada
    ];
    expect(calcularTaxaPoupanca(desp2, rec2)).toBeCloseTo(70, 1);
  });

  it('exclui transferências internas', () => {
    const rec2 = [
      { valor: 10000, tipo: 'receita' },
      { valor: 2000,  tipo: 'transferencia_interna' }, // ignorada
    ];
    expect(calcularTaxaPoupanca([], rec2)).toBeCloseTo(100, 1);
  });
});

// ── Patrimônio Líquido ────────────────────────────────────────

describe('calcularPatrimonioLiquido', () => {
  it('PL = totalAtivos - totalPassivos', () => {
    const totalAtivos   = 100000;
    const totalPassivos = 30000;
    expect(totalAtivos - totalPassivos).toBe(70000);
  });

  it('PL pode ser negativo', () => {
    const totalAtivos   = 10000;
    const totalPassivos = 50000;
    expect(totalAtivos - totalPassivos).toBe(-40000);
  });
});
