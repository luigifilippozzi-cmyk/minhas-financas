// ============================================================
// Testes — categorias.js controller
// Cobre: getCategorias, salvarCategoria, criarCategoriasPadrao,
//        desativarCategoria, iniciarListenerCategorias
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../../src/js/services/database.js', () => ({
  criarCategoria:              vi.fn(async () => ({ id: 'novo-id' })),
  ouvirCategorias:             vi.fn(() => vi.fn()),           // retorna unsubscribe
  atualizarCategoria:          vi.fn(async () => {}),
  excluirCategoria:            vi.fn(async () => {}),
  excluirOrcamentosDaCategoria: vi.fn(async () => {}),
}));

vi.mock('../../src/js/models/Categoria.js', () => ({
  criarCategoria: vi.fn((dados) => ({ ...dados, ativa: true })),
  CATEGORIAS_PADRAO: [
    { nome: 'Alimentação', emoji: '🍔', cor: '#FF6B6B', tipo: 'despesa' },
    { nome: 'Transporte',  emoji: '🚗', cor: '#4ECDC4', tipo: 'despesa' },
    { nome: 'Outros',      emoji: '📦', cor: '#95A5A6', tipo: 'despesa' },
  ],
}));

import {
  getCategorias,
  salvarCategoria,
  criarCategoriasPadrao,
  desativarCategoria,
  iniciarListenerCategorias,
} from '../../src/js/controllers/categorias.js';

import {
  criarCategoria as criarCategoriaDB,
  ouvirCategorias,
  atualizarCategoria,
  excluirCategoria,
  excluirOrcamentosDaCategoria,
} from '../../src/js/services/database.js';

import { CATEGORIAS_PADRAO } from '../../src/js/models/Categoria.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function docStubSemSelect() {
  return { getElementById: () => null };
}

// ── Suite: getCategorias ───────────────────────────────────────────────────────

describe('getCategorias', () => {
  it('retorna array (pode estar vazio no início do módulo isolado)', () => {
    const cats = getCategorias();
    expect(Array.isArray(cats)).toBe(true);
  });
});

// ── Suite: salvarCategoria — validações ───────────────────────────────────────

describe('salvarCategoria — validações', () => {
  it('rejeita quando nome está ausente', async () => {
    await expect(salvarCategoria({ emoji: '🍔' }, 'g1')).rejects.toThrow('nome');
  });

  it('rejeita quando nome é string vazia', async () => {
    await expect(salvarCategoria({ nome: '  ', emoji: '🍔' }, 'g1')).rejects.toThrow('nome');
  });

  it('rejeita quando emoji está ausente', async () => {
    await expect(salvarCategoria({ nome: 'Alimentação' }, 'g1')).rejects.toThrow('emoji');
  });

  it('rejeita quando emoji é string vazia', async () => {
    await expect(salvarCategoria({ nome: 'Alimentação', emoji: '  ' }, 'g1')).rejects.toThrow('emoji');
  });
});

// ── Suite: salvarCategoria — criação ──────────────────────────────────────────

describe('salvarCategoria — criação (sem categoriaId)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama criarCategoriaDB e retorna ID', async () => {
    const id = await salvarCategoria({ nome: 'Lazer', emoji: '🎮' }, 'g1');
    expect(criarCategoriaDB).toHaveBeenCalledOnce();
    expect(id).toBe('novo-id');
  });

  it('inclui grupoId no payload de criação', async () => {
    await salvarCategoria({ nome: 'Lazer', emoji: '🎮' }, 'grupo-abc');
    const [arg] = criarCategoriaDB.mock.calls[0];
    expect(arg).toMatchObject({ grupoId: 'grupo-abc' });
  });

  it('aplica cor padrão quando não fornecida', async () => {
    await salvarCategoria({ nome: 'X', emoji: '📦' }, 'g1');
    const [arg] = criarCategoriaDB.mock.calls[0];
    expect(arg).toMatchObject({ cor: '#95A5A6' });
  });

  it('respeita orcamentoMensal zero por padrão', async () => {
    await salvarCategoria({ nome: 'X', emoji: '📦' }, 'g1');
    const [arg] = criarCategoriaDB.mock.calls[0];
    expect(arg.orcamentoMensal).toBe(0);
  });

  it('define isConjuntaPadrao como false por padrão', async () => {
    await salvarCategoria({ nome: 'X', emoji: '📦' }, 'g1');
    const [arg] = criarCategoriaDB.mock.calls[0];
    expect(arg.isConjuntaPadrao).toBe(false);
  });

  it('define tipo como despesa por padrão', async () => {
    await salvarCategoria({ nome: 'X', emoji: '📦' }, 'g1');
    const [arg] = criarCategoriaDB.mock.calls[0];
    expect(arg.tipo).toBe('despesa');
  });

  it('respeita tipo receita quando fornecido', async () => {
    await salvarCategoria({ nome: 'Salário', emoji: '💰', tipo: 'receita' }, 'g1');
    const [arg] = criarCategoriaDB.mock.calls[0];
    expect(arg.tipo).toBe('receita');
  });
});

// ── Suite: salvarCategoria — edição ───────────────────────────────────────────

describe('salvarCategoria — edição (com categoriaId)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama atualizarCategoria e retorna o mesmo categoriaId', async () => {
    const id = await salvarCategoria({ nome: 'Alimentação', emoji: '🍔' }, 'g1', 'cat-123');
    expect(atualizarCategoria).toHaveBeenCalledOnce();
    expect(criarCategoriaDB).not.toHaveBeenCalled();
    expect(id).toBe('cat-123');
  });

  it('passa categoriaId correto para atualizarCategoria', async () => {
    await salvarCategoria({ nome: 'X', emoji: '📦' }, 'g1', 'cat-xyz');
    const [idArg] = atualizarCategoria.mock.calls[0];
    expect(idArg).toBe('cat-xyz');
  });

  it('payload de atualização não inclui grupoId', async () => {
    await salvarCategoria({ nome: 'X', emoji: '📦' }, 'g1', 'cat-xyz');
    const [, payload] = atualizarCategoria.mock.calls[0];
    expect(payload).not.toHaveProperty('grupoId');
  });
});

// ── Suite: criarCategoriasPadrao ──────────────────────────────────────────────

describe('criarCategoriasPadrao', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama criarCategoriaDB uma vez por categoria padrão', async () => {
    await criarCategoriasPadrao('g-novo');
    expect(criarCategoriaDB).toHaveBeenCalledTimes(CATEGORIAS_PADRAO.length);
  });

  it('inclui grupoId em cada chamada', async () => {
    await criarCategoriasPadrao('g-novo');
    for (const [arg] of criarCategoriaDB.mock.calls) {
      expect(arg).toMatchObject({ grupoId: 'g-novo' });
    }
  });
});

// ── Suite: desativarCategoria ─────────────────────────────────────────────────

describe('desativarCategoria', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama excluirCategoria com o categoriaId correto', async () => {
    await desativarCategoria('cat-1', 'g1');
    expect(excluirCategoria).toHaveBeenCalledWith('cat-1');
  });

  it('chama excluirOrcamentosDaCategoria com grupoId e categoriaId', async () => {
    await desativarCategoria('cat-1', 'g1');
    expect(excluirOrcamentosDaCategoria).toHaveBeenCalledWith('g1', 'cat-1');
  });

  it('executa ambas as operações mesmo quando chamar na ordem correta', async () => {
    await desativarCategoria('cat-2', 'g2');
    expect(excluirCategoria).toHaveBeenCalledOnce();
    expect(excluirOrcamentosDaCategoria).toHaveBeenCalledOnce();
  });
});

// ── Suite: iniciarListenerCategorias ──────────────────────────────────────────

describe('iniciarListenerCategorias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('document', docStubSemSelect());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('chama ouvirCategorias com grupoId correto', () => {
    iniciarListenerCategorias('g1', vi.fn());
    expect(ouvirCategorias).toHaveBeenCalledWith('g1', expect.any(Function));
  });

  it('retorna função unsubscribe', () => {
    const unsub = iniciarListenerCategorias('g1', vi.fn());
    expect(typeof unsub).toBe('function');
  });

  it('dispara onChange quando ouvirCategorias emite dados', () => {
    const onChange = vi.fn();
    let capturedCb;
    ouvirCategorias.mockImplementation((_, cb) => { capturedCb = cb; return vi.fn(); });

    iniciarListenerCategorias('g1', onChange);
    capturedCb([{ id: 'c1', nome: 'Teste', emoji: '📦', tipo: 'despesa' }]);

    expect(onChange).toHaveBeenCalledWith([{ id: 'c1', nome: 'Teste', emoji: '📦', tipo: 'despesa' }]);
  });
});
