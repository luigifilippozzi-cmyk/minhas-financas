import { describe, it, expect, vi } from 'vitest';
import {
  levenshtein,
  normalizarStr,
  similaridade,
  debounce,
  isMovimentacaoReal,
} from '../../src/js/utils/helpers.js';

// ── levenshtein ───────────────────────────────────────────────────────────────

describe('levenshtein', () => {
  it('retorna 0 para strings idênticas', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
    expect(levenshtein('', '')).toBe(0);
  });

  it('retorna o comprimento da string quando a outra é vazia', () => {
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('conta uma substituição', () => {
    expect(levenshtein('abc', 'abd')).toBe(1);
    expect(levenshtein('kitten', 'sitten')).toBe(1);
  });

  it('conta uma inserção', () => {
    expect(levenshtein('ab', 'abc')).toBe(1);
  });

  it('conta uma remoção', () => {
    expect(levenshtein('abc', 'ab')).toBe(1);
  });

  it('calcula distância entre palavras completamente diferentes', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('lida com strings longas de nomes de estabelecimentos', () => {
    // Dois nomes muito similares devem ter distância baixa
    const d = levenshtein('ifood restaurante abc', 'ifood restaurante abx');
    expect(d).toBe(1);
  });
});

// ── normalizarStr ─────────────────────────────────────────────────────────────

describe('normalizarStr', () => {
  it('converte para minúsculas', () => {
    expect(normalizarStr('SHOPEE')).toBe('shopee');
  });

  it('remove acentos', () => {
    expect(normalizarStr('Pão de Açúcar')).toBe('pao de acucar');
    expect(normalizarStr('Café')).toBe('cafe');
  });

  it('substitui pontuação por espaço e compacta', () => {
    expect(normalizarStr('IFOOD*RESTAURANTE')).toBe('ifood restaurante');
    expect(normalizarStr('A  B')).toBe('a b');
  });

  it('remove espaços extras das bordas', () => {
    expect(normalizarStr('  texto  ')).toBe('texto');
  });

  it('retorna string vazia para entrada falsy', () => {
    expect(normalizarStr('')).toBe('');
    expect(normalizarStr(null)).toBe('');
    expect(normalizarStr(undefined)).toBe('');
  });
});

// ── similaridade ─────────────────────────────────────────────────────────────

describe('similaridade', () => {
  it('retorna 1 para strings idênticas', () => {
    expect(similaridade('ifood restaurante', 'ifood restaurante')).toBe(1);
  });

  it('retorna 0 quando uma string é vazia e a outra não', () => {
    expect(similaridade('', 'abc')).toBe(0);
    expect(similaridade('abc', '')).toBe(0);
  });

  it('retorna 1 para duas strings vazias', () => {
    expect(similaridade('', '')).toBe(1);
  });

  it('retorna valor ≥ 0.85 para strings muito similares (threshold de reconciliação)', () => {
    // Diferença de um caractere em string de 20
    const sim = similaridade('shopee compra online', 'shopee compra onlinx');
    expect(sim).toBeGreaterThanOrEqual(0.85);
  });

  it('retorna valor < 0.85 para strings pouco similares', () => {
    const sim = similaridade('nubank', 'bradesco');
    expect(sim).toBeLessThan(0.85);
  });

  it('é simétrica: similaridade(a,b) === similaridade(b,a)', () => {
    const a = 'supermercado mambo';
    const b = 'supermercado mamba';
    expect(similaridade(a, b)).toBe(similaridade(b, a));
  });
});

// ── debounce ──────────────────────────────────────────────────────────────────

describe('debounce', () => {
  it('chama a função somente após o delay', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('cancela chamadas anteriores se chamada novamente antes do delay', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

// ── isMovimentacaoReal (RF-063) ──────────────────────────────────

describe('isMovimentacaoReal', () => {
  it('retorna true para despesa normal', () => {
    expect(isMovimentacaoReal({ tipo: 'despesa' })).toBe(true);
  });

  it('retorna true para despesa sem tipo', () => {
    expect(isMovimentacaoReal({})).toBe(true);
  });

  it('retorna true para projecao_paga', () => {
    expect(isMovimentacaoReal({ tipo: 'projecao_paga' })).toBe(true);
  });

  it('retorna false para projecao', () => {
    expect(isMovimentacaoReal({ tipo: 'projecao' })).toBe(false);
  });

  it('retorna false para transferencia_interna', () => {
    expect(isMovimentacaoReal({ tipo: 'transferencia_interna' })).toBe(false);
  });
});
