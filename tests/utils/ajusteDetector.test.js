import { describe, it, expect } from 'vitest';
import {
  classificarEstabelecimento,
  detectarAjustesParciais,
} from '../../src/js/utils/ajusteDetector.js';

// ── classificarEstabelecimento ────────────────────────────────────────────────

describe('classificarEstabelecimento', () => {
  it('classifica iFood como marketplace', () => {
    expect(classificarEstabelecimento('IFOOD *RESTAURANTE ABC')).toBe('marketplace');
    expect(classificarEstabelecimento('ifood credito')).toBe('marketplace');
  });

  it('classifica Amazon como marketplace', () => {
    expect(classificarEstabelecimento('AMAZON MARKETPLACE')).toBe('marketplace');
  });

  it('classifica Shopee como marketplace', () => {
    expect(classificarEstabelecimento('SHOPEE PAGAMENTO')).toBe('marketplace');
  });

  it('classifica Carrefour como supermercado', () => {
    expect(classificarEstabelecimento('CARREFOUR BARRA')).toBe('supermercado');
  });

  it('classifica Mambo como supermercado', () => {
    expect(classificarEstabelecimento('MAMBO SUPERMERCADO')).toBe('supermercado');
  });

  it('classifica Rappi como delivery', () => {
    expect(classificarEstabelecimento('RAPPI PEDIDO 123')).toBe('delivery');
  });

  it('classifica Uber Eats como delivery', () => {
    expect(classificarEstabelecimento('UBER EATS ENTREGA')).toBe('delivery');
  });

  it('retorna null para estabelecimento desconhecido', () => {
    expect(classificarEstabelecimento('POSTO SHELL')).toBeNull();
    expect(classificarEstabelecimento('FARMACIA DROGASIL')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(classificarEstabelecimento('')).toBeNull();
    expect(classificarEstabelecimento(null)).toBeNull();
  });

  it('é case-insensitive (normaliza antes de comparar)', () => {
    expect(classificarEstabelecimento('ifood compra')).toBe('marketplace');
    expect(classificarEstabelecimento('Mercado Livre')).toBe('marketplace');
  });
});

// ── detectarAjustesParciais ───────────────────────────────────────────────────
// BUG-018: critério principal é keyword compartilhada, não Levenshtein full-string

describe('detectarAjustesParciais', () => {
  function criarDesp(overrides = {}) {
    return {
      _idx: 0,
      tipoLinha: 'despesa',
      descricao: 'IFOOD *RESTAURANTE ABC',
      valor: 50,
      data: new Date('2026-03-20T12:00:00'),
      duplicado: false,
      erro: null,
      ajuste_parcial_idx: null,
      ...overrides,
    };
  }

  function criarCred(overrides = {}) {
    return {
      _idx: 1,
      tipoLinha: 'receita',
      descricao: 'IFOOD CREDITO',
      valor: 5,
      data: new Date('2026-03-21T12:00:00'),
      duplicado: false,
      erro: null,
      ajuste_parcial: false,
      ...overrides,
    };
  }

  it('REGRESSÃO BUG-018: vincula crédito à despesa pela keyword compartilhada', () => {
    const desp = criarDesp();
    const cred = criarCred();
    detectarAjustesParciais([desp, cred]);

    expect(cred.ajuste_parcial).toBe(true);
    expect(cred.ajuste_para_idx).toBe(desp._idx);
    expect(desp.valorLiquido).toBe(45);
    expect(desp.valorAjustado).toBe(5);
  });

  it('NÃO vincula quando valor do crédito >= valor da despesa (estorno total)', () => {
    const desp = criarDesp({ valor: 5 });
    const cred = criarCred({ valor: 5 }); // igual, não é parcial
    detectarAjustesParciais([desp, cred]);

    expect(cred.ajuste_parcial).toBe(false);
  });

  it('NÃO vincula quando diferença de data excede janela de 7 dias', () => {
    const desp = criarDesp({ data: new Date('2026-03-01T12:00:00') });
    const cred = criarCred({ data: new Date('2026-03-10T12:00:00') }); // 9 dias depois
    detectarAjustesParciais([desp, cred]);

    expect(cred.ajuste_parcial).toBe(false);
  });

  it('NÃO vincula quando estabelecimento do crédito não é reconhecido', () => {
    const desp = criarDesp({ descricao: 'POSTO SHELL' });
    const cred = criarCred({ descricao: 'POSTO CREDITO' });
    detectarAjustesParciais([desp, cred]);

    expect(cred.ajuste_parcial).toBe(false);
  });

  it('NÃO vincula quando a despesa não contém a keyword do crédito', () => {
    // Crédito é do iFood, mas a despesa é de outro estabelecimento
    const desp = criarDesp({ descricao: 'CARREFOUR COMPRAS' });
    const cred = criarCred({ descricao: 'IFOOD CREDITO' });
    detectarAjustesParciais([desp, cred]);

    expect(cred.ajuste_parcial).toBe(false);
  });

  it('ignora linhas com erro ou já marcadas como duplicatas', () => {
    const desp = criarDesp({ erro: 'Valor inválido' });
    const cred = criarCred();
    detectarAjustesParciais([desp, cred]);

    expect(cred.ajuste_parcial).toBe(false);
  });

  it('respeita janela customizada via parâmetro janelaDias', () => {
    const desp = criarDesp({ data: new Date('2026-03-01T12:00:00') });
    const cred = criarCred({ data: new Date('2026-03-09T12:00:00') }); // 8 dias
    detectarAjustesParciais([desp, cred], { janelaDias: 10 });

    expect(cred.ajuste_parcial).toBe(true);
  });

  it('com múltiplas despesas candidatas, escolhe a com maior similaridade', () => {
    const despA = criarDesp({ _idx: 0, descricao: 'IFOOD *RESTAURANTE ABC 01/03', valor: 50 });
    const despB = { ...criarDesp(), _idx: 2, descricao: 'IFOOD *PIZZARIA XYZ 01/03', valor: 80 };
    const cred = criarCred({ valor: 5, descricao: 'IFOOD CREDITO RESTAURANTE ABC' });

    detectarAjustesParciais([despA, despB, cred]);

    // despA tem descrição mais similar ao crédito
    expect(cred.ajuste_para_idx).toBe(despA._idx);
  });

  it('valorLiquido é arredondado para 2 casas decimais', () => {
    const desp = criarDesp({ valor: 33.33 });
    const cred = criarCred({ valor: 10.01 });
    detectarAjustesParciais([desp, cred]);

    expect(desp.valorLiquido).toBe(23.32);
  });
});
