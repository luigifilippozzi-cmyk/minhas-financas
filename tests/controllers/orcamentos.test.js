// ============================================================
// Testes — orcamentos.js controller
// Cobre: salvarOrcamento, copiarMesAnterior,
//        iniciarListenerOrcamentos, iniciarListenerDespesasOrcamento
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../../src/js/services/database.js', () => ({
  definirOrcamento: vi.fn(async () => {}),
  ouvirOrcamentos:  vi.fn(() => vi.fn()),
  buscarOrcamentos: vi.fn(async () => []),
  ouvirDespesas:    vi.fn(() => vi.fn()),
}));

import {
  salvarOrcamento,
  copiarMesAnterior,
  iniciarListenerOrcamentos,
  iniciarListenerDespesasOrcamento,
} from '../../src/js/controllers/orcamentos.js';

import {
  definirOrcamento,
  ouvirOrcamentos,
  buscarOrcamentos,
  ouvirDespesas,
} from '../../src/js/services/database.js';

// ── Suite: salvarOrcamento ────────────────────────────────────────────────────

describe('salvarOrcamento', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama definirOrcamento com os parâmetros corretos', async () => {
    await salvarOrcamento('g1', 'cat-1', 4, 2026, 500);
    expect(definirOrcamento).toHaveBeenCalledWith({
      grupoId: 'g1', categoriaId: 'cat-1', mes: 4, ano: 2026, valorLimite: 500,
    });
  });

  it('normaliza valor negativo para 0', async () => {
    await salvarOrcamento('g1', 'cat-1', 4, 2026, -100);
    const [arg] = definirOrcamento.mock.calls[0];
    expect(arg.valorLimite).toBe(0);
  });

  it('normaliza string numérica para number', async () => {
    await salvarOrcamento('g1', 'cat-1', 4, 2026, '250');
    const [arg] = definirOrcamento.mock.calls[0];
    expect(arg.valorLimite).toBe(250);
  });

  it('normaliza valor inválido (undefined) para 0', async () => {
    await salvarOrcamento('g1', 'cat-1', 4, 2026, undefined);
    const [arg] = definirOrcamento.mock.calls[0];
    expect(arg.valorLimite).toBe(0);
  });

  it('permite valor 0 explicitamente', async () => {
    await salvarOrcamento('g1', 'cat-1', 4, 2026, 0);
    const [arg] = definirOrcamento.mock.calls[0];
    expect(arg.valorLimite).toBe(0);
  });
});

// ── Suite: copiarMesAnterior ──────────────────────────────────────────────────

describe('copiarMesAnterior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 0 quando não há orçamentos no mês anterior', async () => {
    buscarOrcamentos.mockResolvedValue([]);
    const copiados = await copiarMesAnterior('g1', 4, 2026);
    expect(copiados).toBe(0);
    expect(definirOrcamento).not.toHaveBeenCalled();
  });

  it('copia orçamentos do mês anterior para o atual', async () => {
    buscarOrcamentos
      .mockResolvedValueOnce([{ categoriaId: 'c1', valorLimite: 300 }])  // mês anterior
      .mockResolvedValueOnce([]);                                          // mês atual (vazio)

    const copiados = await copiarMesAnterior('g1', 4, 2026);

    expect(copiados).toBe(1);
    expect(definirOrcamento).toHaveBeenCalledWith({
      grupoId: 'g1', categoriaId: 'c1', mes: 4, ano: 2026, valorLimite: 300,
    });
  });

  it('não sobrescreve orçamentos já definidos no mês atual', async () => {
    buscarOrcamentos
      .mockResolvedValueOnce([
        { categoriaId: 'c1', valorLimite: 300 },
        { categoriaId: 'c2', valorLimite: 200 },
      ])
      .mockResolvedValueOnce([{ categoriaId: 'c1', valorLimite: 400 }]);   // c1 já definido

    const copiados = await copiarMesAnterior('g1', 4, 2026);

    expect(copiados).toBe(1);
    expect(definirOrcamento).toHaveBeenCalledWith(
      expect.objectContaining({ categoriaId: 'c2', valorLimite: 200 })
    );
    expect(definirOrcamento).not.toHaveBeenCalledWith(
      expect.objectContaining({ categoriaId: 'c1' })
    );
  });

  it('copia múltiplos orçamentos em paralelo', async () => {
    buscarOrcamentos
      .mockResolvedValueOnce([
        { categoriaId: 'c1', valorLimite: 100 },
        { categoriaId: 'c2', valorLimite: 200 },
        { categoriaId: 'c3', valorLimite: 300 },
      ])
      .mockResolvedValueOnce([]);

    const copiados = await copiarMesAnterior('g1', 4, 2026);
    expect(copiados).toBe(3);
    expect(definirOrcamento).toHaveBeenCalledTimes(3);
  });

  // Transição de janeiro → dezembro do ano anterior
  it('janeiro: busca mês anterior como dezembro do ano anterior', async () => {
    buscarOrcamentos.mockResolvedValue([]);
    await copiarMesAnterior('g1', 1, 2026);
    const [grupoIdArg, mesArg, anoArg] = buscarOrcamentos.mock.calls[0];
    expect(mesArg).toBe(12);
    expect(anoArg).toBe(2025);
  });

  it('janeiro: copia para janeiro do ano atual', async () => {
    buscarOrcamentos
      .mockResolvedValueOnce([{ categoriaId: 'c1', valorLimite: 150 }])
      .mockResolvedValueOnce([]);

    await copiarMesAnterior('g1', 1, 2026);
    const [arg] = definirOrcamento.mock.calls[0];
    expect(arg.mes).toBe(1);
    expect(arg.ano).toBe(2026);
  });

  it('fevereiro: busca janeiro do mesmo ano', async () => {
    buscarOrcamentos.mockResolvedValue([]);
    await copiarMesAnterior('g1', 2, 2026);
    const [, mesArg, anoArg] = buscarOrcamentos.mock.calls[0];
    expect(mesArg).toBe(1);
    expect(anoArg).toBe(2026);
  });
});

// ── Suite: iniciarListenerOrcamentos ─────────────────────────────────────────

describe('iniciarListenerOrcamentos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama ouvirOrcamentos com os parâmetros corretos', () => {
    iniciarListenerOrcamentos('g1', 4, 2026, vi.fn());
    expect(ouvirOrcamentos).toHaveBeenCalledWith('g1', 4, 2026, expect.any(Function));
  });

  it('retorna função unsubscribe', () => {
    const unsub = iniciarListenerOrcamentos('g1', 4, 2026, vi.fn());
    expect(typeof unsub).toBe('function');
  });

  it('cancela listener anterior antes de criar novo', () => {
    const unsubAnterior = vi.fn();
    ouvirOrcamentos.mockReturnValueOnce(unsubAnterior);

    iniciarListenerOrcamentos('g1', 4, 2026, vi.fn());
    iniciarListenerOrcamentos('g1', 5, 2026, vi.fn());

    expect(unsubAnterior).toHaveBeenCalledOnce();
  });
});

// ── Suite: iniciarListenerDespesasOrcamento ───────────────────────────────────

describe('iniciarListenerDespesasOrcamento', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama ouvirDespesas com os parâmetros corretos', () => {
    iniciarListenerDespesasOrcamento('g1', 4, 2026, vi.fn());
    expect(ouvirDespesas).toHaveBeenCalledWith('g1', 4, 2026, expect.any(Function));
  });

  it('retorna função unsubscribe', () => {
    const unsub = iniciarListenerDespesasOrcamento('g1', 4, 2026, vi.fn());
    expect(typeof unsub).toBe('function');
  });

  it('cancela listener de despesas anterior antes de criar novo', () => {
    const unsubAnterior = vi.fn();
    ouvirDespesas.mockReturnValueOnce(unsubAnterior);

    iniciarListenerDespesasOrcamento('g1', 4, 2026, vi.fn());
    iniciarListenerDespesasOrcamento('g1', 5, 2026, vi.fn());

    expect(unsubAnterior).toHaveBeenCalledOnce();
  });
});
