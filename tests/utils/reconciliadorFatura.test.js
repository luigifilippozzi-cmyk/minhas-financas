import { describe, it, expect } from 'vitest';
import {
  isPagamentoFatura,
  calcularScoreFatura,
  detectarPagamentoFatura,
  recalcularScoreFatura,
  REGEX_PAG_FATURA,
  VALOR_MINIMO_FATURA,
  JANELA_VENCIMENTO_DIAS,
  TOLERANCIA_VALOR_PERCENT,
} from '../../src/js/utils/reconciliadorFatura.js';

// ── isPagamentoFatura ────────────────────────────────────────────

describe('isPagamentoFatura', () => {
  it('detecta PAG FATURA', () => {
    expect(isPagamentoFatura('PAG FATURA CARTAO')).toBe(true);
  });

  it('detecta PAGAMENTO FATURA', () => {
    expect(isPagamentoFatura('PAGAMENTO FATURA NUBANK')).toBe(true);
  });

  it('detecta PGT FAT', () => {
    expect(isPagamentoFatura('PGT FAT 1234')).toBe(true);
  });

  it('detecta PGTO FAT', () => {
    expect(isPagamentoFatura('PGTO FAT CARTAO')).toBe(true);
  });

  it('detecta FATURA CARTAO', () => {
    expect(isPagamentoFatura('FATURA CARTAO VISA')).toBe(true);
  });

  it('detecta FAT CREDITO', () => {
    expect(isPagamentoFatura('FAT CREDITO MASTERCARD')).toBe(true);
  });

  it('detecta DEBITO AUTO CARTAO', () => {
    expect(isPagamentoFatura('DEBITO AUTO CARTAO')).toBe(true);
  });

  it('detecta PAG CARTAO', () => {
    expect(isPagamentoFatura('PAG CARTAO ITAU')).toBe(true);
  });

  it('detecta variante DEB AUTOMATICO CARTAO', () => {
    expect(isPagamentoFatura('DEB AUTOMATICO CARTAO NUBANK')).toBe(true);
  });

  it('detecta LIQ FATURA', () => {
    expect(isPagamentoFatura('LIQ FATURA BRADESCO')).toBe(true);
  });

  it('não detecta PIX genérico', () => {
    expect(isPagamentoFatura('PIX enviado Teste')).toBe(false);
  });

  it('não detecta supermercado', () => {
    expect(isPagamentoFatura('Supermercado Extra')).toBe(false);
  });

  it('não detecta TED sem fatura', () => {
    expect(isPagamentoFatura('TED transferencia enviada')).toBe(false);
  });

  it('não detecta string vazia', () => {
    expect(isPagamentoFatura('')).toBe(false);
  });

  it('não detecta null/undefined', () => {
    expect(isPagamentoFatura(null)).toBe(false);
    expect(isPagamentoFatura(undefined)).toBe(false);
  });

  it('é case-insensitive', () => {
    expect(isPagamentoFatura('pag fatura cartão')).toBe(true);
    expect(isPagamentoFatura('Pagamento Fatura Nubank')).toBe(true);
  });
});

// ── calcularScoreFatura ──────────────────────────────────────────

describe('calcularScoreFatura', () => {
  it('score máximo (80+) → status auto com regex + valor + janela', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3500,
      totalFatura: 3500,
      diffDiasVencimento: 2,
    });
    expect(result.score).toBe(100);
    expect(result.status).toBe('auto');
    expect(result.isParcial).toBe(false);
  });

  it('score com regex + valor, sem janela → 80 → auto', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3500,
      totalFatura: 3500,
      diffDiasVencimento: null,
    });
    expect(result.score).toBe(80);
    expect(result.status).toBe('auto');
  });

  it('score com regex apenas → 40 → pendente', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3500,
      totalFatura: 0,
      diffDiasVencimento: null,
    });
    expect(result.score).toBe(40);
    expect(result.status).toBe('pendente');
  });

  it('score 0 sem regex → ignorado', () => {
    const result = calcularScoreFatura({
      regexMatch: false,
      valorLinha: 3500,
      totalFatura: 3500,
      diffDiasVencimento: 2,
    });
    expect(result.score).toBe(60); // valor(40) + janela(20)
    expect(result.status).toBe('pendente');
  });

  it('sem nenhum componente → score 0 → ignorado', () => {
    const result = calcularScoreFatura({
      regexMatch: false,
      valorLinha: 0,
      totalFatura: 0,
      diffDiasVencimento: null,
    });
    expect(result.score).toBe(0);
    expect(result.status).toBe('ignorado');
  });

  it('tolerância de 5% no valor → match completo', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3490,
      totalFatura: 3500, // diff = 10/3500 ≈ 0.29% < 5%
      diffDiasVencimento: null,
    });
    expect(result.score).toBe(80);
    expect(result.isParcial).toBe(false);
  });

  it('diferença 10% → pagamento parcial → isParcial true', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3150,
      totalFatura: 3500, // diff = 350/3500 = 10% > 5%
      diffDiasVencimento: null,
    });
    expect(result.isParcial).toBe(true);
    expect(result.score).toBe(55); // regex(40) + parcial(15)
  });

  it('diferença 25% → sem pontuação de valor', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 2625, // 75% de 3500
      totalFatura: 3500,
      diffDiasVencimento: null,
    });
    expect(result.score).toBe(40); // apenas regex
    expect(result.isParcial).toBe(false);
  });

  it('fora da janela temporal ±7 dias → sem pontos de janela', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3500,
      totalFatura: 3500,
      diffDiasVencimento: 20,
    });
    expect(result.score).toBe(80); // regex + valor (sem janela)
  });

  it('entre 8-15 dias → 10 pts parciais de janela', () => {
    const result = calcularScoreFatura({
      regexMatch: true,
      valorLinha: 3500,
      totalFatura: 3500,
      diffDiasVencimento: 10,
    });
    expect(result.score).toBe(90); // regex(40) + valor(40) + janela_parcial(10)
  });
});

// ── detectarPagamentoFatura ──────────────────────────────────────

describe('detectarPagamentoFatura', () => {
  function criarLinha(overrides = {}) {
    return {
      descricao: 'PAG FATURA CARTAO',
      valor: 3500,
      tipoLinha: 'despesa',
      erro: null,
      ...overrides,
    };
  }

  it('marca linha de pagamento de fatura', () => {
    const linhas = [criarLinha()];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(1);
    expect(linhas[0]._pagamentoFatura).toBeDefined();
    expect(linhas[0]._pagamentoFatura.statusReconciliacaoFatura).toBe('pendente');
    expect(linhas[0]._pagamentoFatura.scoreFatura).toBeGreaterThanOrEqual(40);
  });

  it('não marca linha de receita', () => {
    const linhas = [criarLinha({ tipoLinha: 'receita' })];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(0);
    expect(linhas[0]._pagamentoFatura).toBeUndefined();
  });

  it('não marca linha com erro', () => {
    const linhas = [criarLinha({ erro: 'Data inválida' })];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(0);
  });

  it('não marca linha abaixo do valor mínimo', () => {
    const linhas = [criarLinha({ valor: VALOR_MINIMO_FATURA - 1 })];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(0);
  });

  it('não reclassifica linha já marcada como transferência interna', () => {
    const linhas = [criarLinha({ _transferenciaInterna: { membroUid: 'uid2', membroNome: 'Ana', direcao: 'enviada' } })];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(0);
    expect(linhas[0]._pagamentoFatura).toBeUndefined();
  });

  it('não marca descrição sem regex', () => {
    const linhas = [criarLinha({ descricao: 'Supermercado Extra' })];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(0);
  });

  it('processa múltiplas linhas corretamente', () => {
    const linhas = [
      criarLinha({ descricao: 'PAG FATURA NUBANK' }),
      criarLinha({ descricao: 'Supermercado Extra', valor: 200 }),
      criarLinha({ descricao: 'PAGAMENTO FATURA VISA', valor: 5000 }),
    ];
    const count = detectarPagamentoFatura(linhas, []);
    expect(count).toBe(2);
    expect(linhas[0]._pagamentoFatura).toBeDefined();
    expect(linhas[1]._pagamentoFatura).toBeUndefined();
    expect(linhas[2]._pagamentoFatura).toBeDefined();
  });

  it('retorna 0 para array vazio', () => {
    expect(detectarPagamentoFatura([], [])).toBe(0);
    expect(detectarPagamentoFatura(null, [])).toBe(0);
  });

  it('infere contaCartaoId quando cartão encontrado na descrição', () => {
    const contas = [
      { id: 'cartao-nubank', tipo: 'cartao', nome: 'Nubank', emissor: 'nubank', _legado: false },
      { id: 'cartao-itau', tipo: 'cartao', nome: 'Itaú', emissor: 'itau', _legado: false },
    ];
    const linhas = [criarLinha({ descricao: 'PAG FATURA NUBANK' })];
    detectarPagamentoFatura(linhas, contas);
    expect(linhas[0]._pagamentoFatura.contaCartaoId).toBe('cartao-nubank');
  });

  it('contaCartaoId null quando cartão não encontrado', () => {
    const contas = [
      { id: 'cartao-itau', tipo: 'cartao', nome: 'Itaú', emissor: 'itau', _legado: false },
    ];
    const linhas = [criarLinha({ descricao: 'PAG FATURA BRADESCO' })];
    detectarPagamentoFatura(linhas, contas);
    expect(linhas[0]._pagamentoFatura.contaCartaoId).toBeNull();
  });

  it('ignora cartões legado na inferência', () => {
    const contas = [
      { id: 'cartao-legado', tipo: 'cartao', nome: 'Nubank', emissor: 'nubank', _legado: true },
      { id: 'cartao-real', tipo: 'cartao', nome: 'Nubank Real', emissor: 'nubank', _legado: false },
    ];
    const linhas = [criarLinha({ descricao: 'PAG FATURA NUBANK' })];
    detectarPagamentoFatura(linhas, contas);
    // Deve encontrar o não-legado (cartao-real)
    expect(linhas[0]._pagamentoFatura.contaCartaoId).toBe('cartao-real');
  });
});

// ── recalcularScoreFatura ────────────────────────────────────────

describe('recalcularScoreFatura', () => {
  function criarPagamento(overrides = {}) {
    return {
      valor: 3500,
      data: new Date('2026-03-15'),
      ...overrides,
    };
  }

  it('recalcula score com totalFatura conhecido', () => {
    const pag = criarPagamento();
    const { score, status } = recalcularScoreFatura(pag, 3500);
    expect(score).toBe(80); // regex(40) + valor(40) sem janela
    expect(status).toBe('auto');
  });

  it('recalcula com janela temporal correta', () => {
    const vencimento = new Date('2026-03-16'); // 1 dia de diferença
    const pag = criarPagamento({ data: new Date('2026-03-15') });
    const { score } = recalcularScoreFatura(pag, 3500, vencimento);
    expect(score).toBe(100); // regex(40) + valor(40) + janela(20)
  });

  it('detecta pagamento parcial ao recalcular', () => {
    const pag = criarPagamento({ valor: 3000 }); // 85.7% de 3500 → diff ~14% > 5%
    const { isParcial } = recalcularScoreFatura(pag, 3500);
    expect(isParcial).toBe(true);
  });

  it('aceita data como Firestore Timestamp (com toDate)', () => {
    const pag = criarPagamento({
      data: { toDate: () => new Date('2026-03-15') },
    });
    const vencimento = new Date('2026-03-15');
    const { score } = recalcularScoreFatura(pag, 3500, vencimento);
    expect(score).toBeGreaterThan(80);
  });
});

// ── Constantes exportadas ────────────────────────────────────────

describe('Constantes', () => {
  it('VALOR_MINIMO_FATURA deve ser número positivo', () => {
    expect(VALOR_MINIMO_FATURA).toBeGreaterThan(0);
  });

  it('JANELA_VENCIMENTO_DIAS deve ser número positivo', () => {
    expect(JANELA_VENCIMENTO_DIAS).toBeGreaterThan(0);
  });

  it('TOLERANCIA_VALOR_PERCENT deve ser entre 0 e 1', () => {
    expect(TOLERANCIA_VALOR_PERCENT).toBeGreaterThan(0);
    expect(TOLERANCIA_VALOR_PERCENT).toBeLessThan(1);
  });

  it('REGEX_PAG_FATURA é um RegExp', () => {
    expect(REGEX_PAG_FATURA).toBeInstanceOf(RegExp);
  });
});
