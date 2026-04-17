import { describe, it, expect } from 'vitest';
import { calcularBurnRate } from '../../src/js/utils/burnRateCalculator.js';

// Helpers para criar dados de teste
function despesa(catId, valor, daysAgo, tipo = 'despesa') {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(10, 0, 0, 0);
  return { categoriaId: catId, valor, data: dt, tipo };
}

function orc(catId, valorLimite) {
  return { categoriaId: catId, valorLimite };
}

function cat(id, nome = 'Cat', emoji = '🏷️', tipo = 'despesa') {
  return { id, nome, emoji, tipo };
}

// Data de referência fixa para testes determinísticos (dia 16 do mês)
const HOJE = new Date(2026, 3, 16, 12, 0, 0); // Abril 16, 2026

describe('calcularBurnRate', () => {
  it('retorna array vazio sem orçamentos', () => {
    const r = calcularBurnRate({ hoje: HOJE });
    expect(r).toEqual([]);
  });

  it('retorna array vazio quando todos valorLimite = 0', () => {
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 0)],
      categorias: [cat('cat1')],
      despesasMes: [],
      hoje: HOJE,
    });
    expect(r).toEqual([]);
  });

  it('exclui categorias de receita do cálculo', () => {
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 500)],
      categorias: [cat('cat1', 'Salário', '💰', 'receita')],
      despesasMes: [despesa('cat1', 100, 1)],
      hoje: HOJE,
    });
    expect(r).toEqual([]);
  });

  it('exclui projeções via isMovimentacaoReal', () => {
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 200, 2),              // real
        { ...despesa('cat1', 300, 3), tipo: 'projecao' }, // excluída
        { ...despesa('cat1', 100, 1), tipo: 'transferencia_interna' }, // excluída
      ],
      hoje: HOJE,
    });
    expect(r).toHaveLength(1);
    expect(r[0].gastoMes).toBe(200);
  });

  it('marca amostra insuficiente quando < 3 dias com dados nos últimos 7 dias', () => {
    // Apenas 2 dias distintos nos últimos 7
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 100, 1), // dia N-1
        despesa('cat1', 100, 1), // mesmo dia N-1 (conta 1 único dia)
        despesa('cat1', 100, 2), // dia N-2 (2 dias únicos → insuficiente)
      ],
      hoje: HOJE,
    });
    expect(r[0].amostrasInsuficientes).toBe(true);
    expect(r[0].projecaoMensal).toBe(r[0].gastoMes); // sem projeção extra
  });

  it('classifica corretamente com 3+ dias de dados', () => {
    // 3 dias distintos com 100 cada = burn rate 300/7 ≈ 42.86/dia
    // diasRestantes = 30 - 16 = 14
    // projecao = 300 + 42.86 * 14 ≈ 900
    // orcamento = 1000 → 90% → verde
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 100, 1),
        despesa('cat1', 100, 2),
        despesa('cat1', 100, 3),
      ],
      hoje: HOJE,
    });
    expect(r[0].amostrasInsuficientes).toBe(false);
    expect(r[0].classificacao).toBe('verde');
    expect(r[0].burnRateDiario).toBeCloseTo(300 / 7, 2);
  });

  it('classifica amarelo quando projeção entre 90% e 100%', () => {
    // burn rate alto: 700 nos últimos 7 dias (3 dias distintos)
    // diasRestantes = 14; projecao = 700 + (100) * 14 = 700 + (700/7)*14 = 700 + 1400 = 2100 → 2100/2200 ≈ 95.4%
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 2200)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 350, 1),
        despesa('cat1', 200, 2),
        despesa('cat1', 150, 3),
      ],
      hoje: HOJE,
    });
    expect(r[0].classificacao).toBe('amarelo');
    expect(r[0].percentualProjetado).toBeGreaterThan(90);
    expect(r[0].percentualProjetado).toBeLessThanOrEqual(100);
  });

  it('classifica vermelho quando projeção > 100%', () => {
    // 3 dias distintos, 1000 gasto cada = burn rate 3000/7 ≈ 428.6/dia
    // projecao = 3000 + 428.6 * 14 ≈ 9000 → muito acima de orcamento 4000
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 4000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 1000, 1),
        despesa('cat1', 1000, 2),
        despesa('cat1', 1000, 3),
      ],
      hoje: HOJE,
    });
    expect(r[0].classificacao).toBe('vermelho');
    expect(r[0].percentualProjetado).toBeGreaterThan(100);
  });

  it('ordena: vermelho antes de amarelo antes de verde', () => {
    const r = calcularBurnRate({
      orcamentos: [
        orc('verde', 10000),
        orc('vermelho', 100),
        orc('amarelo', 2200),
      ],
      categorias: [
        cat('verde', 'Verde', '🟢'),
        cat('vermelho', 'Vermelho', '🔴'),
        cat('amarelo', 'Amarelo', '🟡'),
      ],
      despesasMes: [
        // verde: 3 dias, baixo gasto
        despesa('verde', 10, 1),
        despesa('verde', 10, 2),
        despesa('verde', 10, 3),
        // vermelho: 3 dias, alto gasto
        despesa('vermelho', 50, 1),
        despesa('vermelho', 50, 2),
        despesa('vermelho', 50, 3),
        // amarelo: 3 dias, gasto moderado
        despesa('amarelo', 350, 1),
        despesa('amarelo', 200, 2),
        despesa('amarelo', 150, 3),
      ],
      hoje: HOJE,
    });
    expect(r.map((i) => i.categoriaId)).toEqual(['vermelho', 'amarelo', 'verde']);
  });

  it('ignora despesas de outros categoriaId', () => {
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 100, 1),
        despesa('cat1', 100, 2),
        despesa('cat1', 100, 3),
        despesa('cat2', 9999, 1), // outro cat, sem orçamento
      ],
      hoje: HOJE,
    });
    expect(r).toHaveLength(1);
    expect(r[0].gastoMes).toBe(300);
  });

  it('exclui despesas fora dos últimos 7 dias do burn rate diário', () => {
    // Despesa de 30 dias atrás não entra no burn rate
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 5000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 1000, 30), // fora dos últimos 7
        despesa('cat1', 100, 1),
        despesa('cat1', 100, 2),
        despesa('cat1', 100, 3),
      ],
      hoje: HOJE,
    });
    // gastoMes inclui o de 30 dias
    expect(r[0].gastoMes).toBe(1300);
    // burnRateDiario usa apenas os últimos 7 dias (300 total)
    expect(r[0].burnRateDiario).toBeCloseTo(300 / 7, 2);
  });

  it('retorna campos obrigatórios no resultado', () => {
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000)],
      categorias: [cat('cat1', 'Alimentação', '🍔')],
      despesasMes: [
        despesa('cat1', 100, 1),
        despesa('cat1', 100, 2),
        despesa('cat1', 100, 3),
      ],
      hoje: HOJE,
    });
    const item = r[0];
    expect(item).toHaveProperty('categoriaId', 'cat1');
    expect(item).toHaveProperty('categoriaNome', 'Alimentação');
    expect(item).toHaveProperty('categoriaEmoji', '🍔');
    expect(item).toHaveProperty('gastoMes');
    expect(item).toHaveProperty('orcamento', 1000);
    expect(item).toHaveProperty('burnRateDiario');
    expect(item).toHaveProperty('projecaoMensal');
    expect(item).toHaveProperty('percentualProjetado');
    expect(item).toHaveProperty('classificacao');
    expect(item).toHaveProperty('amostrasInsuficientes');
  });

  it('usa defaults seguros quando chamado sem parâmetros', () => {
    expect(() => calcularBurnRate()).not.toThrow();
    expect(calcularBurnRate()).toEqual([]);
  });

  it('aceita data como objeto Firestore Timestamp (com método toDate)', () => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 1);
    const firestoreTs = { toDate: () => dt };
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000)],
      categorias: [cat('cat1')],
      despesasMes: [
        { categoriaId: 'cat1', valor: 100, data: firestoreTs, tipo: 'despesa' },
        { categoriaId: 'cat1', valor: 100, data: firestoreTs, tipo: 'despesa' },
        { categoriaId: 'cat1', valor: 100, data: { toDate: () => { const d2 = new Date(); d2.setDate(d2.getDate() - 2); return d2; } }, tipo: 'despesa' },
        { categoriaId: 'cat1', valor: 100, data: { toDate: () => { const d3 = new Date(); d3.setDate(d3.getDate() - 3); return d3; } }, tipo: 'despesa' },
      ],
      hoje: HOJE,
    });
    expect(r).toHaveLength(1);
    expect(r[0].burnRateDiario).toBeGreaterThan(0);
  });

  it('ignora catId do orçamento sem categoria correspondente', () => {
    const r = calcularBurnRate({
      orcamentos: [orc('inexistente', 500), orc('cat1', 1000)],
      categorias: [cat('cat1')],
      despesasMes: [
        despesa('cat1', 100, 1),
        despesa('cat1', 100, 2),
        despesa('cat1', 100, 3),
      ],
      hoje: HOJE,
    });
    // 'inexistente' não está em categorias → ignorado
    expect(r).toHaveLength(1);
    expect(r[0].categoriaId).toBe('cat1');
  });

  it('trata valorLimite null/undefined no orçamento como ausente (ignora categoria)', () => {
    const r = calcularBurnRate({
      orcamentos: [{ categoriaId: 'cat1', valorLimite: null }],
      categorias: [cat('cat1')],
      despesasMes: [despesa('cat1', 100, 1)],
      hoje: HOJE,
    });
    expect(r).toEqual([]);
  });

  it('ordena por percentualProjetado desc quando mesma classificação', () => {
    // Dois itens com amostra insuficiente (ambos verde), mas percentuais diferentes
    const r = calcularBurnRate({
      orcamentos: [orc('cat1', 1000), orc('cat2', 100)],
      categorias: [cat('cat1', 'Cat1', '🍕'), cat('cat2', 'Cat2', '🍔')],
      despesasMes: [
        despesa('cat1', 10, 1),  // gastoMes=10, pct=1%
        despesa('cat2', 90, 1),  // gastoMes=90, pct=90%
      ],
      hoje: HOJE,
    });
    // Ambas: 1 dia → amostrasInsuficientes=true → projecaoMensal=gastoMes
    // cat2: 90/100=90% > cat1: 10/1000=1% → cat2 primeiro
    expect(r[0].categoriaId).toBe('cat2');
    expect(r[1].categoriaId).toBe('cat1');
  });
});
