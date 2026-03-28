import { describe, it, expect } from 'vitest';
import {
  formatarMoeda,
  formatarData,
  nomeMes,
  formatarPercentual,
  escHTML,
} from '../../src/js/utils/formatters.js';

// ── nomeMes ───────────────────────────────────────────────────────────────────

describe('nomeMes', () => {
  it('retorna todos os meses corretamente', () => {
    const esperado = [
      [1, 'Janeiro'], [2, 'Fevereiro'], [3, 'Março'],
      [4, 'Abril'],   [5, 'Maio'],      [6, 'Junho'],
      [7, 'Julho'],   [8, 'Agosto'],    [9, 'Setembro'],
      [10, 'Outubro'], [11, 'Novembro'], [12, 'Dezembro'],
    ];
    for (const [mes, nome] of esperado) {
      expect(nomeMes(mes)).toBe(nome);
    }
  });

  it('retorna string vazia para mês 0', () => {
    expect(nomeMes(0)).toBe('');
  });

  it('retorna string vazia para mês acima de 12', () => {
    expect(nomeMes(13)).toBe('');
  });
});

// ── formatarPercentual ────────────────────────────────────────────────────────

describe('formatarPercentual', () => {
  it('arredonda e adiciona símbolo %', () => {
    expect(formatarPercentual(75)).toBe('75%');
    expect(formatarPercentual(75.6)).toBe('76%');
    expect(formatarPercentual(75.4)).toBe('75%');
  });

  it('funciona com 0%', () => {
    expect(formatarPercentual(0)).toBe('0%');
  });

  it('funciona com 100%', () => {
    expect(formatarPercentual(100)).toBe('100%');
  });
});

// ── escHTML ───────────────────────────────────────────────────────────────────
// Proteção contra XSS — crítico para qualquer texto renderizado via innerHTML.

describe('escHTML', () => {
  it('escapa tag de script (XSS básico)', () => {
    expect(escHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapa aspas duplas', () => {
    expect(escHTML('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('escapa aspas simples', () => {
    expect(escHTML("it's")).toBe('it&#39;s');
  });

  it('escapa ampersand', () => {
    expect(escHTML('A&B')).toBe('A&amp;B');
  });

  it('escapa todos os caracteres especiais juntos', () => {
    const entrada = '<img src="x" onerror=\'alert(1)\'>&';
    const saida = escHTML(entrada);
    expect(saida).not.toContain('<');
    expect(saida).not.toContain('>');
    expect(saida).not.toContain('"');
    expect(saida).not.toContain("'");
    expect(saida).not.toContain('&amp;amp;'); // não deve escapar duplamente
  });

  it('não modifica texto sem caracteres especiais', () => {
    expect(escHTML('Texto normal 123')).toBe('Texto normal 123');
  });

  it('lida com null e undefined sem lançar exceção', () => {
    expect(() => escHTML(null)).not.toThrow();
    expect(() => escHTML(undefined)).not.toThrow();
    expect(escHTML(null)).toBe('');
    expect(escHTML(undefined)).toBe('');
  });
});

// ── formatarMoeda ─────────────────────────────────────────────────────────────

describe('formatarMoeda', () => {
  it('formata valor positivo em BRL', () => {
    const resultado = formatarMoeda(1234.56);
    expect(resultado).toContain('1');
    expect(resultado).toContain('234');
    expect(resultado).toContain('56');
    expect(resultado).toMatch(/R\$|BRL/);
  });

  it('formata zero sem erro', () => {
    const resultado = formatarMoeda(0);
    expect(resultado).toContain('0');
  });

  it('aceita null sem lançar exceção (usa 0 como fallback)', () => {
    expect(() => formatarMoeda(null)).not.toThrow();
  });
});

// ── formatarData ──────────────────────────────────────────────────────────────

describe('formatarData', () => {
  it('formata uma Date para o padrão DD/MM/AAAA', () => {
    // Usa T12:00:00 para evitar deslocamento de fuso horário
    const data = new Date('2026-03-15T12:00:00');
    const resultado = formatarData(data);
    expect(resultado).toContain('15');
    expect(resultado).toContain('03');
    expect(resultado).toContain('2026');
  });

  it('aceita string ISO como entrada', () => {
    const resultado = formatarData('2026-01-01T12:00:00');
    expect(resultado).toContain('2026');
  });

  it('aceita objeto Firestore Timestamp simulado (com .toDate())', () => {
    const timestamp = { toDate: () => new Date('2026-06-20T12:00:00') };
    const resultado = formatarData(timestamp);
    expect(resultado).toContain('20');
    expect(resultado).toContain('06');
    expect(resultado).toContain('2026');
  });
});
