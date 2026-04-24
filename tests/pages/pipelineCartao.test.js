import { describe, it, expect } from 'vitest';
import { aplicarMesFatura, filtrarCreditos, processarFaturaCartao, gerarProjecoes } from '../../src/js/pages/pipelineCartao.js';

// ── Helpers ──────────────────────────────────────────────────────
function linha(overrides = {}) {
  const d = new Date('2026-03-05T12:00:00');
  return {
    data: d, dataOriginal: d,
    parcela: '-', erro: null, isNegativo: false, tipoLinha: null,
    ...overrides,
  };
}

// ── BUG-026: aplicarMesFatura deve propagar l.mesFatura ──────────
describe('aplicarMesFatura', () => {
  it('seta l.mesFatura em todas as linhas (BUG-026)', () => {
    const linhas = [linha(), linha({ parcela: '02/06' }), linha({ erro: 'Data inválida' })];
    aplicarMesFatura(linhas, '2026-03');
    expect(linhas[0].mesFatura).toBe('2026-03');
    expect(linhas[1].mesFatura).toBe('2026-03');
    expect(linhas[2].mesFatura).toBe('2026-03');
  });

  it('ajusta data de parceladas para 01/mês-fatura', () => {
    const l = linha({ parcela: '02/06' });
    aplicarMesFatura([l], '2026-03');
    expect(l.data.getFullYear()).toBe(2026);
    expect(l.data.getMonth()).toBe(2); // março = índice 2
    expect(l.data.getDate()).toBe(1);
    expect(l.dataAjustada).toBe(true);
  });

  it('não ajusta data de transações à vista', () => {
    const original = new Date('2026-03-15T12:00:00');
    const l = linha({ data: original, dataOriginal: original, parcela: '-' });
    aplicarMesFatura([l], '2026-03');
    expect(l.dataAjustada).toBe(false);
    expect(l.mesFatura).toBe('2026-03');
  });

  it('atualiza mesFatura ao trocar de mês (segunda chamada)', () => {
    const l = linha();
    aplicarMesFatura([l], '2026-03');
    expect(l.mesFatura).toBe('2026-03');
    aplicarMesFatura([l], '2026-04');
    expect(l.mesFatura).toBe('2026-04');
  });
});

// ── filtrarCreditos ───────────────────────────────────────────────
describe('filtrarCreditos', () => {
  it('marca isEstorno e tipoLinha=receita para valores negativos', () => {
    const l = linha({ isNegativo: true });
    filtrarCreditos([l]);
    expect(l.isEstorno).toBe(true);
    expect(l.tipoLinha).toBe('receita');
  });

  it('não marca linhas positivas como estorno', () => {
    const l = linha({ isNegativo: false });
    filtrarCreditos([l]);
    expect(l.isEstorno).toBeUndefined();
  });

  it('não marca linhas com erro como estorno', () => {
    const l = linha({ isNegativo: true, erro: 'Valor inválido' });
    filtrarCreditos([l]);
    expect(l.isEstorno).toBeUndefined();
  });
});

// ── processarFaturaCartao — integração ───────────────────────────
describe('processarFaturaCartao', () => {
  const rows = [
    ['Data', 'Estabelecimento', 'Portador', 'Valor', 'Parcela'],
    ['01/03/2026', 'NETFLIX', 'ANA', '44,90', '-'],
    ['05/02/2026', 'SHOPEE', 'ANA', '124,09', '6 de 12'],
    ['01/03/2026', 'ESTORNO XYZ', 'ANA', '-50,00', '-'],
  ];

  it('propaga mesFatura em todas as linhas via processarFaturaCartao', () => {
    const linhas = processarFaturaCartao({ rows, contas: [], categorias: [], mapaHist: {}, origemBanco: 'desconhecido', mesFatura: '2026-03' });
    expect(linhas.every(l => l.mesFatura === '2026-03')).toBe(true);
  });

  it('marca estorno como receita', () => {
    const linhas = processarFaturaCartao({ rows, contas: [], categorias: [], mapaHist: {}, origemBanco: 'desconhecido', mesFatura: '2026-03' });
    const estorno = linhas.find(l => l.descricao === 'ESTORNO XYZ');
    expect(estorno?.tipoLinha).toBe('receita');
    expect(estorno?.isEstorno).toBe(true);
  });
});

// ── RF-062: gerarProjecoes propaga contaId e mesFatura ──────────
describe('gerarProjecoes', () => {
  it('propaga contaId para todas as projeções', () => {
    const l = linha({
      descricao: 'SHOPEE', valor: 100, parcela: '01/06',
      portador: 'Ana', contaId: 'cartao-nubank-123',
    });
    const projs = gerarProjecoes(l, 'parc-001');
    expect(projs).toHaveLength(5);
    expect(projs.every(p => p.contaId === 'cartao-nubank-123')).toBe(true);
  });

  it('propaga mesFatura para todas as projeções', () => {
    const l = linha({
      descricao: 'SHOPEE', valor: 100, parcela: '01/06',
      portador: 'Ana', mesFatura: '2026-04',
    });
    const projs = gerarProjecoes(l, 'parc-001');
    expect(projs.every(p => p.mesFatura === '2026-04')).toBe(true);
  });

  it('contaId vazio quando não fornecido', () => {
    const l = linha({
      descricao: 'SHOPEE', valor: 100, parcela: '01/03',
      portador: 'Ana',
    });
    const projs = gerarProjecoes(l, 'parc-001');
    expect(projs.every(p => p.contaId === '')).toBe(true);
  });

  it('retorna vazio para linhas sem parcela', () => {
    const l = linha({ descricao: 'NETFLIX', valor: 44.90, parcela: '-' });
    const projs = gerarProjecoes(l, 'parc-001');
    expect(projs).toHaveLength(0);
  });

  it('gera N-atual projeções com tipo "projecao"', () => {
    const l = linha({
      descricao: 'MAGAZINELUIZA', valor: 200, parcela: '02/05',
      portador: 'Teste',
    });
    const projs = gerarProjecoes(l, 'parc-002');
    expect(projs).toHaveLength(3); // parcelas 3, 4, 5
    expect(projs.every(p => p.tipo === 'projecao')).toBe(true);
    expect(projs.every(p => p.parcelamento_id === 'parc-002')).toBe(true);
  });
});
