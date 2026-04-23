// ============================================================
// Testes — planejamento.js controller (funções puras)
// Cobre: autoMatch, analisarGaps, despesasNaoPlanejadas
//
// Estratégia: funções puras — sem mocks de serviço.
// gerarPlanoPara e aplicarMatches dependem do Firestore e
// são cobertas pelos testes de integração.
// ============================================================
import { describe, it, expect, vi } from 'vitest';

// ── Mocks de serviços (não usados nas funções puras) ───────────────────────────

vi.mock('../../src/js/services/database.js', () => ({
  buscarDespesasMes:           vi.fn(async () => []),
  buscarOrcamentos:            vi.fn(async () => []),
  salvarItemPlanejamento:      vi.fn(async () => {}),
  salvarItensPlanejamentoBatch: vi.fn(async () => {}),
  excluirItemPlanejamento:     vi.fn(async () => {}),
  existePlanejamento:          vi.fn(async () => false),
  ouvirPlanejamento:           vi.fn(() => vi.fn()),
  ouvirDespesas:               vi.fn(() => vi.fn()),
  ouvirCategorias:             vi.fn(() => vi.fn()),
  ouvirOrcamentos:             vi.fn(() => vi.fn()),
}));

vi.mock('../../src/js/utils/recurringDetector.js', () => ({
  detectarRecorrentes: vi.fn(() => []),
  filtrarAutoInclusao: vi.fn((r) => r),
}));

import {
  autoMatch,
  analisarGaps,
  despesasNaoPlanejadas,
} from '../../src/js/controllers/planejamento.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function item(overrides = {}) {
  return {
    id: 'item-1',
    categoriaId: 'c1',
    descricao: 'Netflix',
    valorPrevisto: 50,
    status: 'pendente',
    parcelamentoId: null,
    origem: 'recorrente',
    ...overrides,
  };
}

function despesa(overrides = {}) {
  return {
    id: 'd1',
    categoriaId: 'c1',
    descricao: 'Netflix',
    valor: 55,
    tipo: 'despesa',
    ...overrides,
  };
}

function orcamento(overrides = {}) {
  return { categoriaId: 'c1', valorLimite: 200, ...overrides };
}

function categoria(overrides = {}) {
  return { id: 'c1', nome: 'Lazer', emoji: '🎮', ...overrides };
}

// ── Suite: autoMatch ─────────────────────────────────────────────────────────

describe('autoMatch', () => {
  it('retorna array vazio quando não há itens', () => {
    expect(autoMatch([], [despesa()])).toEqual([]);
  });

  it('retorna array vazio quando não há despesas', () => {
    expect(autoMatch([item()], [])).toEqual([]);
  });

  it('faz match por parcelamentoId', () => {
    const i = item({ parcelamentoId: 'parc-1', descricao: 'Samsung' });
    const d = despesa({ id: 'd-parc', parcelamento_id: 'parc-1', tipo: 'projecao_paga' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ itemId: 'item-1', despesaId: 'd-parc', valorRealizado: 55 });
  });

  it('faz match por categoriaId + descrição exata', () => {
    const result = autoMatch([item()], [despesa()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ itemId: 'item-1', despesaId: 'd1' });
  });

  it('faz match por substring (descrição do item contida na despesa)', () => {
    const i = item({ descricao: 'Netflix' });
    const d = despesa({ descricao: 'Netflix Premium' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(1);
  });

  it('faz match por substring (despesa contida no item)', () => {
    const i = item({ descricao: 'Netflix Premium Anual' });
    const d = despesa({ descricao: 'Netflix' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(1);
  });

  it('não faz match quando categoriaId difere', () => {
    const i = item({ categoriaId: 'c1' });
    const d = despesa({ categoriaId: 'c2' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(0);
  });

  it('não reutiliza a mesma despesa em dois itens diferentes', () => {
    const i1 = item({ id: 'item-1', descricao: 'Netflix' });
    const i2 = item({ id: 'item-2', descricao: 'Netflix' });
    const d = despesa({ id: 'd1' });
    const result = autoMatch([i1, i2], [d]);
    expect(result).toHaveLength(1);
  });

  it('ignora item com status realizado', () => {
    const i = item({ status: 'realizado' });
    const result = autoMatch([i], [despesa()]);
    expect(result).toHaveLength(0);
  });

  it('ignora despesa do tipo projecao no match por descrição', () => {
    const i = item({ parcelamentoId: null });
    const d = despesa({ tipo: 'projecao' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(0);
  });

  it('não faz match de descrição para item com origem orcamento', () => {
    const i = item({ origem: 'orcamento', descricao: 'Orçamento da categoria' });
    const d = despesa({ descricao: 'Orçamento da categoria' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(0);
  });

  it('retorna valorRealizado correto da despesa', () => {
    const d = despesa({ valor: 123.45 });
    const result = autoMatch([item()], [d]);
    expect(result[0].valorRealizado).toBe(123.45);
  });

  it('match é case-insensitive', () => {
    const i = item({ descricao: 'NETFLIX' });
    const d = despesa({ descricao: 'netflix' });
    const result = autoMatch([i], [d]);
    expect(result).toHaveLength(1);
  });
});

// ── Suite: analisarGaps ───────────────────────────────────────────────────────

describe('analisarGaps', () => {
  it('retorna semPlano e excedidos vazios quando não há orçamentos', () => {
    const { semPlano, excedidos } = analisarGaps([], [], []);
    expect(semPlano).toHaveLength(0);
    expect(excedidos).toHaveLength(0);
  });

  it('ignora orçamento com valorLimite zero', () => {
    const { semPlano } = analisarGaps([orcamento({ valorLimite: 0 })], [], [categoria()]);
    expect(semPlano).toHaveLength(0);
  });

  it('detecta categoria sem plano', () => {
    const { semPlano } = analisarGaps([orcamento()], [], [categoria()]);
    expect(semPlano).toHaveLength(1);
    expect(semPlano[0]).toMatchObject({ categoriaId: 'c1', nome: 'Lazer', valorOrcado: 200 });
  });

  it('detecta categoria excedida', () => {
    const items = [item({ valorPrevisto: 300, status: 'pendente' })];
    const { excedidos } = analisarGaps([orcamento()], items, [categoria()]);
    expect(excedidos).toHaveLength(1);
    expect(excedidos[0]).toMatchObject({ categoriaId: 'c1', excesso: 100 });
  });

  it('não detecta excesso quando planejado igual ao orçado', () => {
    const items = [item({ valorPrevisto: 200 })];
    const { excedidos } = analisarGaps([orcamento()], items, [categoria()]);
    expect(excedidos).toHaveLength(0);
  });

  it('ignora itens cancelados no cálculo do planejado', () => {
    const items = [
      item({ valorPrevisto: 300, status: 'cancelado' }),
      item({ id: 'item-2', valorPrevisto: 50, status: 'pendente' }),
    ];
    const { excedidos, semPlano } = analisarGaps([orcamento()], items, [categoria()]);
    expect(excedidos).toHaveLength(0);   // 50 < 200
    expect(semPlano).toHaveLength(0);    // tem planejado (50)
  });

  it('usa nome padrão quando categoria não encontrada no mapa', () => {
    const { semPlano } = analisarGaps([orcamento()], [], []);
    expect(semPlano[0].nome).toBe('Sem nome');
  });

  it('acumula valorPrevisto de múltiplos itens da mesma categoria', () => {
    const items = [
      item({ valorPrevisto: 120, status: 'pendente' }),
      item({ id: 'item-2', valorPrevisto: 100, status: 'pendente' }),
    ];
    const { excedidos } = analisarGaps([orcamento()], items, [categoria()]);
    expect(excedidos[0].valorPlanejado).toBe(220);
    expect(excedidos[0].excesso).toBe(20);
  });
});

// ── Suite: despesasNaoPlanejadas ──────────────────────────────────────────────

describe('despesasNaoPlanejadas', () => {
  it('retorna array vazio quando todas despesas têm match', () => {
    const d = despesa({ id: 'd1' });
    const items = [item({ despesaId: 'd1' })];
    expect(despesasNaoPlanejadas([d], items)).toHaveLength(0);
  });

  it('retorna despesas sem match no planejamento', () => {
    const d = despesa({ id: 'd1' });
    expect(despesasNaoPlanejadas([d], [])).toHaveLength(1);
  });

  it('filtra despesas do tipo projecao', () => {
    const d = despesa({ tipo: 'projecao' });
    expect(despesasNaoPlanejadas([d], [])).toHaveLength(0);
  });

  it('filtra despesas do tipo projecao_paga', () => {
    const d = despesa({ tipo: 'projecao_paga' });
    expect(despesasNaoPlanejadas([d], [])).toHaveLength(0);
  });

  it('filtra transferências internas (RF-063)', () => {
    const d = despesa({ tipo: 'transferencia_interna' });
    expect(despesasNaoPlanejadas([d], [])).toHaveLength(0);
  });

  it('inclui despesa comum sem tipo (undefined)', () => {
    const d = despesa({ tipo: undefined });
    expect(despesasNaoPlanejadas([d], [])).toHaveLength(1);
  });

  it('inclui múltiplas despesas sem match', () => {
    const ds = [despesa({ id: 'd1' }), despesa({ id: 'd2' })];
    expect(despesasNaoPlanejadas(ds, [])).toHaveLength(2);
  });

  it('não inclui despesa cujo id está em despesaId de algum item', () => {
    const d1 = despesa({ id: 'd1' });
    const d2 = despesa({ id: 'd2' });
    const items = [item({ despesaId: 'd1' })];
    const result = despesasNaoPlanejadas([d1, d2], items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d2');
  });
});
