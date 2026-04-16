// ============================================================
// Testes — forecastEngine.js (RF-067)
// Cobre cada componente do forecast separadamente.
// ============================================================
import { describe, it, expect } from 'vitest';
import { gerarForecast } from '../../src/js/utils/forecastEngine.js';

// ── Helpers ───────────────────────────────────────────────────

function mkDesp(descricao, valor, categoriaId = 'cat1', tipo = 'despesa') {
  return { descricao, valor, categoriaId, tipo };
}

function mkRec(descricao, valor, categoriaId = 'cat1') {
  return { descricao, valor, categoriaId };
}

function mkProj(mesFatura, valor) {
  return { mesFatura, valor, tipo: 'projecao' };
}

function mkOrc(ano, mes, valor) {
  return { ano, mes, valor }; // mes 1-based
}

const HOJE_ABRIL_2026 = new Date(2026, 3, 15); // 15 de Abril de 2026

// ── Estrutura básica do retorno ───────────────────────────────

describe('gerarForecast — estrutura', () => {
  it('retorna 6 meses por padrão', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    expect(r).toHaveLength(6);
  });

  it('respeita mesesFuturos personalizado', () => {
    expect(gerarForecast({ mesesFuturos: 3, hoje: HOJE_ABRIL_2026 })).toHaveLength(3);
    expect(gerarForecast({ mesesFuturos: 1, hoje: HOJE_ABRIL_2026 })).toHaveLength(1);
  });

  it('retorna campos esperados em cada mês', () => {
    const [m] = gerarForecast({ mesesFuturos: 1, hoje: HOJE_ABRIL_2026 });
    expect(m).toMatchObject({
      mesStr: expect.stringMatching(/^\d{4}-\d{2}$/),
      mesLabel: expect.any(String),
      ano: expect.any(Number),
      receitasEsperadas: expect.any(Number),
      recorrentes: expect.any(Number),
      parcelas: expect.any(Number),
      variaveis: expect.any(Number),
      saldoProjetado: expect.any(Number),
      estimativaLimitada: expect.any(Boolean),
    });
  });
});

// ── mesStr e mesLabel corretos ────────────────────────────────

describe('gerarForecast — meses e labels', () => {
  it('primeiro mês é mês seguinte ao hoje', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    expect(r[0].mesStr).toBe('2026-05');
    expect(r[0].mesLabel).toBe('Mai');
  });

  it('sequência de 6 meses a partir de Abril/2026', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    const esperados = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    expect(r.map((m) => m.mesStr)).toEqual(esperados);
  });

  it('labels corretos para os 6 meses', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    expect(r.map((m) => m.mesLabel)).toEqual(['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out']);
  });

  it('cross-year: de Out/2026 → inclui Jan/2027', () => {
    const r = gerarForecast({ mesesFuturos: 4, hoje: new Date(2026, 9, 15) }); // Out 2026
    expect(r[2].mesStr).toBe('2027-01');
    expect(r[2].mesLabel).toBe('Jan');
    expect(r[2].ano).toBe(2027);
  });

  it('cross-year: de Dez/2026 → primeiro mês é Jan/2027', () => {
    const r = gerarForecast({ mesesFuturos: 1, hoje: new Date(2026, 11, 1) }); // Dez 2026
    expect(r[0].mesStr).toBe('2027-01');
    expect(r[0].ano).toBe(2027);
  });
});

// ── Parcelas comprometidas ────────────────────────────────────

describe('gerarForecast — componente parcelas', () => {
  it('soma parcelas de projeções pelo mesFatura', () => {
    const projecoes = [
      mkProj('2026-05', 500),
      mkProj('2026-05', 300),
      mkProj('2026-06', 200),
    ];
    const r = gerarForecast({ projecoes, hoje: HOJE_ABRIL_2026 });
    expect(r[0].parcelas).toBe(800); // Mai
    expect(r[1].parcelas).toBe(200); // Jun
    expect(r[2].parcelas).toBe(0);   // Jul
  });

  it('parcelas zero quando não há projeções', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.parcelas).toBe(0));
  });

  it('ignora projeções de meses fora do range', () => {
    const projecoes = [
      mkProj('2026-01', 1000), // Janeiro — passado
      mkProj('2027-01', 999),  // fora dos 6 meses
    ];
    const r = gerarForecast({ projecoes, hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.parcelas).toBe(0));
  });
});

// ── Despesas recorrentes ──────────────────────────────────────

describe('gerarForecast — componente recorrentes', () => {
  const despN1 = [
    mkDesp('Netflix',  39.9, 'ent'),
    mkDesp('Spotify',  21.9, 'ent'),
    mkDesp('Academia', 100,  'sau'),
  ];
  const despN2 = [
    mkDesp('Netflix',  39.9, 'ent'),
    mkDesp('Spotify',  21.9, 'ent'),
    mkDesp('Academia', 100,  'sau'),
  ];

  it('soma recorrentes alta+media', () => {
    const r = gerarForecast({ despesasMesN1: despN1, despesasMesN2: despN2, hoje: HOJE_ABRIL_2026 });
    expect(r[0].recorrentes).toBeCloseTo(161.8);
  });

  it('recorrentes é igual em todos os meses futuros', () => {
    const r = gerarForecast({ despesasMesN1: despN1, despesasMesN2: despN2, hoje: HOJE_ABRIL_2026 });
    const valor = r[0].recorrentes;
    r.forEach((m) => expect(m.recorrentes).toBeCloseTo(valor));
  });

  it('retorna 0 sem histórico', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.recorrentes).toBe(0));
  });

  it('exclui recorrente com confiança baixa (variação > 15%)', () => {
    // Netflix com variação grande → confiança baixa → excluído
    const r = gerarForecast({
      despesasMesN1: [mkDesp('Netflix', 100, 'ent')],
      despesasMesN2: [mkDesp('Netflix', 50,  'ent')], // 50% variação
      hoje: HOJE_ABRIL_2026,
    });
    r.forEach((m) => expect(m.recorrentes).toBe(0));
  });
});

// ── Receitas esperadas ────────────────────────────────────────

describe('gerarForecast — componente receitasEsperadas', () => {
  it('detecta receitas recorrentes', () => {
    const recN1 = [mkRec('Salário Luigi', 5000, 'sal')];
    const recN2 = [mkRec('Salário Luigi', 5000, 'sal')];
    const r = gerarForecast({ receitasMesN1: recN1, receitasMesN2: recN2, hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.receitasEsperadas).toBe(5000));
  });

  it('retorna 0 sem histórico de receitas', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.receitasEsperadas).toBe(0));
  });

  it('soma múltiplas receitas recorrentes', () => {
    const recN1 = [mkRec('Salário Luigi', 5000, 'sal'), mkRec('Freela', 1000, 'fre')];
    const recN2 = [mkRec('Salário Luigi', 5000, 'sal'), mkRec('Freela', 1000, 'fre')];
    const r = gerarForecast({ receitasMesN1: recN1, receitasMesN2: recN2, hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.receitasEsperadas).toBe(6000));
  });
});

// ── Gastos variáveis (orçamentos) ────────────────────────────

describe('gerarForecast — componente variaveis', () => {
  it('soma orçamentos do mês (múltiplas categorias)', () => {
    const orcamentos = [
      mkOrc(2026, 5, 1000), // Mai — cat A
      mkOrc(2026, 5, 500),  // Mai — cat B
      mkOrc(2026, 6, 800),  // Jun
    ];
    const r = gerarForecast({ orcamentos, hoje: HOJE_ABRIL_2026 });
    expect(r[0].variaveis).toBe(1500); // Mai
    expect(r[1].variaveis).toBe(800);  // Jun
    expect(r[2].variaveis).toBe(0);    // Jul
  });

  it('retorna 0 quando sem orçamentos', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.variaveis).toBe(0));
  });

  it('orçamentos cross-year somados corretamente', () => {
    const orcamentos = [mkOrc(2027, 1, 2000)];
    const r = gerarForecast({ mesesFuturos: 4, orcamentos, hoje: new Date(2026, 9, 15) });
    // M3 = Jan/2027
    expect(r[2].variaveis).toBe(2000);
  });
});

// ── saldoProjetado ────────────────────────────────────────────

describe('gerarForecast — saldoProjetado', () => {
  it('saldo = receitasEsperadas − recorrentes − parcelas − variaveis', () => {
    const recN1 = [mkRec('Salário', 5000, 'sal')];
    const recN2 = [mkRec('Salário', 5000, 'sal')];
    const despN1 = [
      mkDesp('Aluguel', 1500, 'mor'),
      mkDesp('Aluguel', 1500, 'mor'), // duplo para criar média
    ];
    const despN2 = [
      mkDesp('Aluguel', 1500, 'mor'),
      mkDesp('Aluguel', 1500, 'mor'),
    ];
    const projecoes = [mkProj('2026-05', 300)];
    const orcamentos = [mkOrc(2026, 5, 500)];

    const r = gerarForecast({
      receitasMesN1: recN1, receitasMesN2: recN2,
      despesasMesN1: despN1, despesasMesN2: despN2,
      projecoes, orcamentos,
      hoje: HOJE_ABRIL_2026,
    });
    // Mai: 5000 - 1500 - 300 - 500 = 2700
    expect(r[0].saldoProjetado).toBeCloseTo(2700);
  });

  it('saldo negativo quando despesas > receitas', () => {
    const despN1 = [mkDesp('Aluguel', 3000, 'mor'), mkDesp('Carro', 2000, 'tra'), mkDesp('Agua', 200, 'mor')];
    const despN2 = [mkDesp('Aluguel', 3000, 'mor'), mkDesp('Carro', 2000, 'tra'), mkDesp('Agua', 200, 'mor')];
    const r = gerarForecast({
      despesasMesN1: despN1, despesasMesN2: despN2,
      hoje: HOJE_ABRIL_2026,
    });
    r.forEach((m) => expect(m.saldoProjetado).toBeLessThan(0));
  });
});

// ── estimativaLimitada ────────────────────────────────────────

describe('gerarForecast — estimativaLimitada', () => {
  it('true quando N-1 tem < 3 transações', () => {
    const r = gerarForecast({
      despesasMesN1: [mkDesp('Netflix', 39.9, 'ent'), mkDesp('Spotify', 21.9, 'ent')], // 2 itens
      despesasMesN2: Array(5).fill(mkDesp('Netflix', 39.9, 'ent')),
      hoje: HOJE_ABRIL_2026,
    });
    expect(r.every((m) => m.estimativaLimitada)).toBe(true);
  });

  it('true quando N-2 tem < 3 transações', () => {
    const r = gerarForecast({
      despesasMesN1: Array(5).fill(mkDesp('Netflix', 39.9, 'ent')),
      despesasMesN2: [mkDesp('Netflix', 39.9, 'ent')], // 1 item
      hoje: HOJE_ABRIL_2026,
    });
    expect(r.every((m) => m.estimativaLimitada)).toBe(true);
  });

  it('true quando sem histórico (arrays vazios)', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    expect(r.every((m) => m.estimativaLimitada)).toBe(true);
  });

  it('false quando N-1 e N-2 têm 3+ transações', () => {
    const tresDesp = [
      mkDesp('A', 100, 'c'),
      mkDesp('B', 200, 'c'),
      mkDesp('C', 300, 'c'),
    ];
    const r = gerarForecast({
      despesasMesN1: tresDesp,
      despesasMesN2: tresDesp,
      hoje: HOJE_ABRIL_2026,
    });
    expect(r.every((m) => !m.estimativaLimitada)).toBe(true);
  });

  it('estimativaLimitada é igual para todos os meses do forecast', () => {
    const r = gerarForecast({ hoje: HOJE_ABRIL_2026 });
    const primeira = r[0].estimativaLimitada;
    r.forEach((m) => expect(m.estimativaLimitada).toBe(primeira));
  });
});

// ── Defaults e edge cases ─────────────────────────────────────

describe('gerarForecast — edge cases', () => {
  it('aceita chamada sem parâmetros (usa defaults)', () => {
    expect(() => gerarForecast()).not.toThrow();
    const r = gerarForecast();
    expect(r).toHaveLength(6);
  });

  it('projeções sem mesFatura são ignoradas', () => {
    const projecoes = [{ valor: 999, tipo: 'projecao' }]; // sem mesFatura
    const r = gerarForecast({ projecoes, hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.parcelas).toBe(0));
  });

  it('projeções com mesFatura undefined/null são ignoradas', () => {
    const projecoes = [
      { mesFatura: null, valor: 500, tipo: 'projecao' },
      { mesFatura: undefined, valor: 500, tipo: 'projecao' },
    ];
    const r = gerarForecast({ projecoes, hoje: HOJE_ABRIL_2026 });
    r.forEach((m) => expect(m.parcelas).toBe(0));
  });
});
