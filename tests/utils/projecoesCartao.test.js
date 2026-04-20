// ============================================================
// Testes — projecoesCartao.js (NRF-NAV F2 #186)
// Cobre: iniciar() (listener) + buscarProjecoesAgregadas() (one-shot)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────

vi.mock('../../src/js/services/database.js', () => ({
  ouvirDespesas: vi.fn(),
  buscarProjecoesRange: vi.fn(),
}));

import { ouvirDespesas, buscarProjecoesRange } from '../../src/js/services/database.js';
import { iniciar, buscarProjecoesAgregadas } from '../../src/js/utils/projecoesCartao.js';

// ── Helpers ───────────────────────────────────────────────────

function mkProj({ contaId = 'c1', valor = 100, isConjunta = false, mesFatura = '2026-05', valorAlocado = null } = {}) {
  return { contaId, valor, tipo: 'projecao', isConjunta, mesFatura, valorAlocado };
}

function mkUnsub() {
  return vi.fn();
}

// ── iniciar() ─────────────────────────────────────────────────

describe('iniciar', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna 6 unsubscribes', () => {
    ouvirDespesas.mockReturnValue(mkUnsub());
    const unsubs = iniciar('g1', 'c1', 4, 2026, vi.fn());
    expect(unsubs).toHaveLength(6);
    expect(ouvirDespesas).toHaveBeenCalledTimes(6);
  });

  it('filtra apenas tipo=projecao do cartaoId correto', () => {
    const onUpdate = vi.fn();
    let capturedCallbacks = [];
    ouvirDespesas.mockImplementation((grupoId, mes, ano, cb) => {
      capturedCallbacks.push({ mes, cb });
      return mkUnsub();
    });

    iniciar('g1', 'c1', 4, 2026, onUpdate);

    // Simula snapshot com despesas mistas
    capturedCallbacks.forEach(({ cb }) => {
      cb([
        mkProj({ contaId: 'c1', valor: 200 }),      // deve incluir
        mkProj({ contaId: 'outro', valor: 999 }),    // cartão errado — ignorar
        { contaId: 'c1', valor: 50, tipo: 'despesa' }, // tipo errado — ignorar
      ]);
    });

    // onUpdate chamado após 6 respostas, total = 200 * 6
    expect(onUpdate).toHaveBeenCalled();
    const dadosPorMes = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    Object.values(dadosPorMes).forEach(entry => {
      expect(entry.total).toBe(200);
      expect(entry.despesas).toHaveLength(1);
    });
  });

  it('não chama onUpdate antes de todas as 6 respostas chegarem', () => {
    const onUpdate = vi.fn();
    let callbacks = [];
    ouvirDespesas.mockImplementation((grupoId, mes, ano, cb) => {
      callbacks.push(cb);
      return mkUnsub();
    });

    iniciar('g1', 'c1', 4, 2026, onUpdate);

    // Dispara apenas 5 dos 6 callbacks
    callbacks.slice(0, 5).forEach(cb => cb([]));
    expect(onUpdate).not.toHaveBeenCalled();

    // 6ª resposta dispara onUpdate
    callbacks[5]([]);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('continua chamando onUpdate após atualização subsequente', () => {
    const onUpdate = vi.fn();
    let callbacks = [];
    ouvirDespesas.mockImplementation((grupoId, mes, ano, cb) => {
      callbacks.push(cb);
      return mkUnsub();
    });

    iniciar('g1', 'c1', 4, 2026, onUpdate);

    // Todas as 6 respondem
    callbacks.forEach(cb => cb([]));
    expect(onUpdate).toHaveBeenCalledTimes(1);

    // Atualização em tempo real de um listener
    callbacks[0]([mkProj({ contaId: 'c1', valor: 300 })]);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('agrupa meses corretamente (próximos 6 a partir do mês seguinte)', () => {
    const onUpdate = vi.fn();
    let mesAnoCapturados = [];
    ouvirDespesas.mockImplementation((grupoId, mes, ano, cb) => {
      mesAnoCapturados.push({ mes, ano });
      cb([]);
      return mkUnsub();
    });

    iniciar('g1', 'c1', 12, 2026, onUpdate);

    // Começando de Dez/2026, próximos 6 = Jan-Jun/2027
    expect(mesAnoCapturados[0]).toEqual({ mes: 1, ano: 2027 });
    expect(mesAnoCapturados[5]).toEqual({ mes: 6, ano: 2027 });
  });

  it('retorna total zero quando não há projeções para o cartão', () => {
    const onUpdate = vi.fn();
    ouvirDespesas.mockImplementation((grupoId, mes, ano, cb) => {
      cb([]);
      return mkUnsub();
    });

    iniciar('g1', 'c1', 4, 2026, onUpdate);

    expect(onUpdate).toHaveBeenCalled();
    const dadosPorMes = onUpdate.mock.calls[0][0];
    Object.values(dadosPorMes).forEach(entry => {
      expect(entry.total).toBe(0);
      expect(entry.despesas).toHaveLength(0);
    });
  });
});

// ── buscarProjecoesAgregadas() ────────────────────────────────

describe('buscarProjecoesAgregadas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna 6 meses no resultado mesmo sem projeções', async () => {
    buscarProjecoesRange.mockResolvedValue([]);
    const resultado = await buscarProjecoesAgregadas('g1', 4, 2026);
    expect(Object.keys(resultado)).toHaveLength(6);
    Object.values(resultado).forEach(entry => {
      expect(entry.total).toBe(0);
      expect(entry.despesas).toHaveLength(0);
    });
  });

  it('agrega totais por mesFatura corretamente', async () => {
    buscarProjecoesRange.mockResolvedValue([
      mkProj({ mesFatura: '2026-05', valor: 150 }),
      mkProj({ mesFatura: '2026-05', valor: 250 }),
      mkProj({ mesFatura: '2026-07', valor: 400 }),
    ]);
    const resultado = await buscarProjecoesAgregadas('g1', 4, 2026);
    expect(resultado['2026-05'].total).toBe(400);
    expect(resultado['2026-05'].despesas).toHaveLength(2);
    expect(resultado['2026-07'].total).toBe(400);
  });

  it('ignora projeções fora do range de 6 meses', async () => {
    buscarProjecoesRange.mockResolvedValue([
      mkProj({ mesFatura: '2025-01', valor: 999 }), // fora do range
      mkProj({ mesFatura: '2026-05', valor: 100 }),
    ]);
    const resultado = await buscarProjecoesAgregadas('g1', 4, 2026);
    expect(resultado['2026-05'].total).toBe(100);
    // 2025-01 não aparece no resultado
    expect(resultado['2025-01']).toBeUndefined();
  });

  it('chama buscarProjecoesRange com range correto (próximos 6 meses)', async () => {
    buscarProjecoesRange.mockResolvedValue([]);
    await buscarProjecoesAgregadas('g1', 12, 2026);
    // Dez/2026 → próximos 6 = Jan-Jun/2027
    expect(buscarProjecoesRange).toHaveBeenCalledWith('g1', '2027-01', '2027-06');
  });

  it('passa grupoId corretamente para buscarProjecoesRange', async () => {
    buscarProjecoesRange.mockResolvedValue([]);
    await buscarProjecoesAgregadas('grupo-abc', 4, 2026);
    expect(buscarProjecoesRange).toHaveBeenCalledWith('grupo-abc', expect.any(String), expect.any(String));
  });
});
