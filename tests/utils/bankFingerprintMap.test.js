// ============================================================
// Testes — bankFingerprintMap.js (RF-021)
// Valida integridade estrutural do mapa de fingerprints.
// ============================================================
import { describe, it, expect } from 'vitest';
import { BANK_FINGERPRINTS } from '../../src/js/utils/bankFingerprintMap.js';

describe('BANK_FINGERPRINTS — estrutura', () => {
  it('exporta um array não vazio', () => {
    expect(Array.isArray(BANK_FINGERPRINTS)).toBe(true);
    expect(BANK_FINGERPRINTS.length).toBeGreaterThan(0);
  });

  it('cobre pelo menos 15 bancos/emissores', () => {
    expect(BANK_FINGERPRINTS.length).toBeGreaterThanOrEqual(15);
  });

  it('cada entrada tem os campos obrigatórios', () => {
    for (const fp of BANK_FINGERPRINTS) {
      expect(fp).toHaveProperty('id');
      expect(fp).toHaveProperty('label');
      expect(fp).toHaveProperty('emoji');
      expect(fp).toHaveProperty('filePatterns');
      expect(fp).toHaveProperty('keywords');
      expect(fp.keywords).toHaveProperty('high');
      expect(fp.keywords).toHaveProperty('medium');
    }
  });

  it('IDs são strings únicas não vazias', () => {
    const ids = BANK_FINGERPRINTS.map(fp => fp.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.trim().length).toBeGreaterThan(0);
    }
  });

  it('labels são strings não vazias', () => {
    for (const fp of BANK_FINGERPRINTS) {
      expect(typeof fp.label).toBe('string');
      expect(fp.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('emojis são strings não vazias', () => {
    for (const fp of BANK_FINGERPRINTS) {
      expect(typeof fp.emoji).toBe('string');
      expect(fp.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  it('filePatterns são arrays de RegExp', () => {
    for (const fp of BANK_FINGERPRINTS) {
      expect(Array.isArray(fp.filePatterns)).toBe(true);
      expect(fp.filePatterns.length).toBeGreaterThan(0);
      for (const pat of fp.filePatterns) {
        expect(pat).toBeInstanceOf(RegExp);
      }
    }
  });

  it('keywords.high e keywords.medium são arrays de strings', () => {
    for (const fp of BANK_FINGERPRINTS) {
      expect(Array.isArray(fp.keywords.high)).toBe(true);
      expect(Array.isArray(fp.keywords.medium)).toBe(true);
      expect(fp.keywords.high.length).toBeGreaterThan(0);
      expect(fp.keywords.medium.length).toBeGreaterThan(0);
      for (const kw of [...fp.keywords.high, ...fp.keywords.medium]) {
        expect(typeof kw).toBe('string');
        expect(kw.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('keywords não estão em maiúsculas (são usadas via toLowerCase)', () => {
    for (const fp of BANK_FINGERPRINTS) {
      for (const kw of [...fp.keywords.high, ...fp.keywords.medium]) {
        expect(kw).toBe(kw.toLowerCase());
      }
    }
  });
});

describe('BANK_FINGERPRINTS — bancos presentes', () => {
  const ids = () => BANK_FINGERPRINTS.map(fp => fp.id);

  it('contém itau', ()       => expect(ids()).toContain('itau'));
  it('contém nubank', ()     => expect(ids()).toContain('nubank'));
  it('contém bradesco', ()   => expect(ids()).toContain('bradesco'));
  it('contém santander', ()  => expect(ids()).toContain('santander'));
  it('contém inter', ()      => expect(ids()).toContain('inter'));
  it('contém brasil', ()     => expect(ids()).toContain('brasil'));
  it('contém caixa', ()      => expect(ids()).toContain('caixa'));
  it('contém xp', ()         => expect(ids()).toContain('xp'));
  it('contém btg', ()        => expect(ids()).toContain('btg'));
  it('contém c6', ()         => expect(ids()).toContain('c6'));
  it('contém original', ()   => expect(ids()).toContain('original'));
  it('contém neon', ()       => expect(ids()).toContain('neon'));
  it('contém picpay', ()     => expect(ids()).toContain('picpay'));
  it('contém mercadopago', () => expect(ids()).toContain('mercadopago'));
  it('contém sicoob', ()     => expect(ids()).toContain('sicoob'));
});
