import { describe, it, expect } from 'vitest';
import {
  detectarMembroNaDescricao,
  detectarTransferenciasInternas,
  isParTransferencia,
  JANELA_DIAS,
} from '../../src/js/utils/detectorTransferenciaInterna.js';

const MEMBROS = {
  uid1: 'Luigi Filippozzi',
  uid2: 'Ana Silva',
};

// ── detectarMembroNaDescricao ────────────────────────────────────

describe('detectarMembroNaDescricao', () => {
  it('detecta nome completo na descrição', () => {
    const result = detectarMembroNaDescricao('PIX enviado Luigi Filippozzi', MEMBROS);
    expect(result).toEqual({ uid: 'uid1', nome: 'Luigi Filippozzi' });
  });

  it('detecta primeiro nome na descrição', () => {
    const result = detectarMembroNaDescricao('PIX recebido Ana', MEMBROS);
    expect(result).toEqual({ uid: 'uid2', nome: 'Ana Silva' });
  });

  it('ignora nomes com menos de 3 caracteres', () => {
    const membros = { uid1: 'Li', uid2: 'Ana Silva' };
    const result = detectarMembroNaDescricao('PIX enviado Li', membros);
    // Li tem < 3 chars, não deve dar match pelo primeiro nome
    expect(result).toBeNull();
  });

  it('exclui o uid do uploader', () => {
    const result = detectarMembroNaDescricao('PIX enviado Luigi', MEMBROS, 'uid1');
    expect(result).toBeNull();
  });

  it('retorna null se nenhum membro encontrado', () => {
    const result = detectarMembroNaDescricao('PIX enviado João', MEMBROS);
    expect(result).toBeNull();
  });

  it('retorna null para descrição vazia', () => {
    expect(detectarMembroNaDescricao('', MEMBROS)).toBeNull();
    expect(detectarMembroNaDescricao(null, MEMBROS)).toBeNull();
  });

  it('retorna null para nomesMembros vazio', () => {
    expect(detectarMembroNaDescricao('PIX enviado Luigi', {})).toBeNull();
    expect(detectarMembroNaDescricao('PIX enviado Luigi', null)).toBeNull();
  });

  it('ignora acentos e case na comparação', () => {
    const membros = { uid1: 'José Maria', uid2: 'Ana' };
    const result = detectarMembroNaDescricao('PIX ENVIADO JOSE MARIA', membros);
    expect(result).toEqual({ uid: 'uid1', nome: 'José Maria' });
  });
});

// ── detectarTransferenciasInternas ───────────────────────────────

describe('detectarTransferenciasInternas', () => {
  function criarLinha(overrides = {}) {
    return {
      _idx: 0,
      data: new Date('2026-04-10'),
      descricao: 'PIX enviado Ana Silva',
      valor: 1750,
      tipoLinha: 'despesa',
      isNegativo: true,
      erro: null,
      ...overrides,
    };
  }

  it('detecta PIX enviado para membro do grupo', () => {
    const linhas = [criarLinha()];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(1);
    expect(linhas[0]._transferenciaInterna).toEqual({
      membroUid: 'uid2',
      membroNome: 'Ana Silva',
      direcao: 'enviada',
    });
  });

  it('detecta PIX recebido de membro do grupo', () => {
    const linhas = [criarLinha({ descricao: 'PIX recebido Luigi Filippozzi', tipoLinha: 'receita', valor: 1750 })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid2');
    expect(count).toBe(1);
    expect(linhas[0]._transferenciaInterna.direcao).toBe('recebida');
  });

  it('detecta TED enviado', () => {
    const linhas = [criarLinha({ descricao: 'TED enviado Ana Silva' })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(1);
  });

  it('detecta transferência para + nome', () => {
    const linhas = [criarLinha({ descricao: 'Transf para Ana' })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(1);
  });

  it('NÃO detecta descrição sem pattern de transferência', () => {
    const linhas = [criarLinha({ descricao: 'Supermercado Ana' })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(0);
    expect(linhas[0]._transferenciaInterna).toBeUndefined();
  });

  it('NÃO detecta transferência sem nome de membro', () => {
    const linhas = [criarLinha({ descricao: 'PIX enviado João Pedro' })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(0);
  });

  it('NÃO detecta valor abaixo do mínimo (R$ 100)', () => {
    const linhas = [criarLinha({ valor: 50 })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(0);
  });

  it('ignora linhas com erro', () => {
    const linhas = [criarLinha({ erro: 'Data inválida' })];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(0);
  });

  it('retorna 0 para grupo com menos de 2 membros', () => {
    const linhas = [criarLinha()];
    const count = detectarTransferenciasInternas(linhas, { uid1: 'Luigi' }, 'uid1');
    expect(count).toBe(0);
  });

  it('retorna 0 para linhas nulas/vazias', () => {
    expect(detectarTransferenciasInternas([], MEMBROS)).toBe(0);
    expect(detectarTransferenciasInternas(null, MEMBROS)).toBe(0);
  });

  it('detecta múltiplas transferências no mesmo lote', () => {
    const linhas = [
      criarLinha({ _idx: 0, descricao: 'PIX enviado Ana Silva', valor: 1750 }),
      criarLinha({ _idx: 1, descricao: 'Supermercado Extra', valor: 200 }),
      criarLinha({ _idx: 2, descricao: 'PIX enviado Ana', valor: 500 }),
    ];
    const count = detectarTransferenciasInternas(linhas, MEMBROS, 'uid1');
    expect(count).toBe(2);
    expect(linhas[0]._transferenciaInterna).toBeDefined();
    expect(linhas[1]._transferenciaInterna).toBeUndefined();
    expect(linhas[2]._transferenciaInterna).toBeDefined();
  });
});

// ── isParTransferencia ──────────────────────────────────────────

describe('isParTransferencia', () => {
  const base = {
    valor: 1750,
    data: new Date('2026-04-10'),
  };

  it('retorna true para par com mesmo valor e data', () => {
    expect(isParTransferencia(base, { valor: 1750, data: new Date('2026-04-10') })).toBe(true);
  });

  it('retorna true dentro da janela temporal', () => {
    expect(isParTransferencia(base, { valor: 1750, data: new Date('2026-04-11') })).toBe(true);
    expect(isParTransferencia(base, { valor: 1750, data: new Date('2026-04-12') })).toBe(true);
  });

  it('retorna false fora da janela temporal', () => {
    expect(isParTransferencia(base, { valor: 1750, data: new Date('2026-04-15') })).toBe(false);
  });

  it('retorna false para valores diferentes', () => {
    expect(isParTransferencia(base, { valor: 1800, data: new Date('2026-04-10') })).toBe(false);
  });

  it('tolera diferença de 1 centavo', () => {
    expect(isParTransferencia(base, { valor: 1750.01, data: new Date('2026-04-10') })).toBe(true);
  });

  it('retorna false para entradas nulas', () => {
    expect(isParTransferencia(null, base)).toBe(false);
    expect(isParTransferencia(base, null)).toBe(false);
    expect(isParTransferencia(null, null)).toBe(false);
  });

  it('lida com Firestore Timestamp (toDate)', () => {
    const firestoreDate = { toDate: () => new Date('2026-04-10') };
    expect(isParTransferencia({ valor: 1750, data: firestoreDate }, base)).toBe(true);
  });

  it('lida com string de data', () => {
    expect(isParTransferencia(base, { valor: 1750, data: '2026-04-10' })).toBe(true);
  });
});
