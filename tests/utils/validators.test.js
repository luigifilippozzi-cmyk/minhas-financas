import { describe, it, expect } from 'vitest';
import {
  emailValido,
  senhaValida,
  valorMonetarioValido,
  naoVazio,
} from '../../src/js/utils/validators.js';

// ── emailValido ───────────────────────────────────────────────────────────────

describe('emailValido', () => {
  it('aceita email no formato padrão', () => {
    expect(emailValido('usuario@gmail.com')).toBe(true);
  });

  it('aceita email com subdomínio', () => {
    expect(emailValido('user@mail.empresa.com.br')).toBe(true);
  });

  it('rejeita email sem @', () => {
    expect(emailValido('usuariogmail.com')).toBe(false);
  });

  it('rejeita email sem domínio após @', () => {
    expect(emailValido('usuario@')).toBe(false);
  });

  it('rejeita email sem TLD', () => {
    expect(emailValido('usuario@gmail')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(emailValido('')).toBe(false);
  });

  it('rejeita email com espaço', () => {
    expect(emailValido('usu ario@gmail.com')).toBe(false);
  });
});

// ── senhaValida ───────────────────────────────────────────────────────────────

describe('senhaValida', () => {
  it('aceita senha com exatamente 6 caracteres (mínimo padrão)', () => {
    expect(senhaValida('abc123')).toBe(true);
  });

  it('aceita senha longa', () => {
    expect(senhaValida('senha-muito-segura-2026!')).toBe(true);
  });

  it('rejeita senha com 5 caracteres (abaixo do mínimo)', () => {
    expect(senhaValida('12345')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(senhaValida('')).toBe(false);
  });

  it('respeita mínimo customizado', () => {
    expect(senhaValida('abcdefgh', 8)).toBe(true);
    expect(senhaValida('abcdefg', 8)).toBe(false);
  });

  it('rejeita valor não-string', () => {
    expect(senhaValida(null)).toBe(false);
    expect(senhaValida(123456)).toBe(false);
  });
});

// ── valorMonetarioValido ──────────────────────────────────────────────────────

describe('valorMonetarioValido', () => {
  it('aceita número positivo', () => {
    expect(valorMonetarioValido(100)).toBe(true);
    expect(valorMonetarioValido(0.01)).toBe(true);
  });

  it('aceita string numérica positiva', () => {
    expect(valorMonetarioValido('250.50')).toBe(true);
  });

  it('rejeita zero', () => {
    expect(valorMonetarioValido(0)).toBe(false);
  });

  it('rejeita número negativo', () => {
    expect(valorMonetarioValido(-50)).toBe(false);
  });

  it('rejeita NaN', () => {
    expect(valorMonetarioValido(NaN)).toBe(false);
  });

  it('rejeita string não-numérica', () => {
    expect(valorMonetarioValido('abc')).toBe(false);
  });

  it('rejeita null e undefined', () => {
    expect(valorMonetarioValido(null)).toBe(false);
    expect(valorMonetarioValido(undefined)).toBe(false);
  });
});

// ── naoVazio ──────────────────────────────────────────────────────────────────

describe('naoVazio', () => {
  it('aceita string com conteúdo', () => {
    expect(naoVazio('Alimentação')).toBe(true);
  });

  it('aceita string com um caractere', () => {
    expect(naoVazio('x')).toBe(true);
  });

  it('rejeita string vazia', () => {
    expect(naoVazio('')).toBe(false);
  });

  it('rejeita string de espaços', () => {
    expect(naoVazio('   ')).toBe(false);
  });

  it('rejeita valor não-string', () => {
    expect(naoVazio(null)).toBe(false);
    expect(naoVazio(undefined)).toBe(false);
    expect(naoVazio(42)).toBe(false);
  });
});
