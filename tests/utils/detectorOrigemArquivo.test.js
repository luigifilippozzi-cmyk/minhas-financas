// ============================================================
// Testes — detectorOrigemArquivo.js (RF-021)
// ============================================================
import { describe, it, expect } from 'vitest';
import { detectarOrigemArquivo } from '../../src/js/utils/detectorOrigemArquivo.js';

// ── Detecção de tipo (CSV/XLSX rows) ─────────────────────────────────────────

describe('detectarOrigemArquivo — tipo por colunas CSV', () => {
  it('detecta cartão quando há portador + parcela', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Portador', 'Parcela']];
    const r = detectarOrigemArquivo({ fileName: 'extrato.csv', rows });
    expect(r.tipo).toBe('cartao');
    expect(r.confiancaTipo).toBeGreaterThanOrEqual(90);
    expect(r.confianca).toBe('alta');
    expect(r.pipeline).toBe('PIPELINE_CARTAO');
  });

  it('detecta receita quando há categoria mas não portador/parcela', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Categoria']];
    const r = detectarOrigemArquivo({ fileName: 'receitas.csv', rows });
    expect(r.tipo).toBe('receita');
    expect(r.confiancaTipo).toBeGreaterThanOrEqual(90);
    expect(r.confianca).toBe('alta');
    expect(r.pipeline).toBe('PIPELINE_BANCARIO');
  });

  it('detecta banco com 3 colunas exatas (Data, Descrição, Valor)', () => {
    const rows = [['Data', 'Descrição', 'Valor']];
    const r = detectarOrigemArquivo({ fileName: 'extrato.csv', rows });
    expect(r.tipo).toBe('banco');
    expect(r.confiancaTipo).toBeGreaterThanOrEqual(90);
    expect(r.confianca).toBe('alta');
    expect(r.pipeline).toBe('PIPELINE_BANCARIO');
  });

  it('detecta banco com baixa confiança (sem portador/parcela/categoria, >3 colunas)', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Saldo']];
    const r = detectarOrigemArquivo({ fileName: 'extrato.csv', rows });
    expect(r.tipo).toBe('banco');
    expect(r.confianca).toBe('baixa');
  });

  it('detecta despesa quando há portador mas não parcela', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Portador']];
    const r = detectarOrigemArquivo({ fileName: 'despesas.csv', rows });
    expect(r.tipo).toBe('despesa');
  });

  it('retorna colunas originais sem alterar capitalização', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Portador', 'Parcela']];
    const r = detectarOrigemArquivo({ fileName: 'f.csv', rows });
    expect(r.colunas).toEqual(['Data', 'Descrição', 'Valor', 'Portador', 'Parcela']);
  });

  it('ignora colunas vazias no array de colunas retornado', () => {
    const rows = [['Data', '', 'Valor', 'Portador', 'Parcela', '']];
    const r = detectarOrigemArquivo({ fileName: 'f.csv', rows });
    // colunas só tem os não-vazios
    expect(r.colunas).not.toContain('');
  });

  it('inspeciona até as 5 primeiras linhas para encontrar cabeçalho', () => {
    const rows = [
      ['lixo', 'cabeçalho inválido'],
      ['outro lixo'],
      ['Data', 'Descrição', 'Valor', 'Portador', 'Parcela'],
    ];
    const r = detectarOrigemArquivo({ fileName: 'f.csv', rows });
    expect(r.tipo).toBe('cartao');
  });

  it('retorna tipo despesa com baixa confiança quando sem cabeçalho válido', () => {
    const rows = [['Mês', 'Total', 'Impostos']];
    const r = detectarOrigemArquivo({ fileName: 'relatorio.csv', rows });
    expect(r.tipo).toBe('despesa');
    expect(r.confianca).toBe('baixa');
  });

  it('retorna tipo despesa com baixa confiança quando sem rows e sem textLines', () => {
    const r = detectarOrigemArquivo({ fileName: 'arquivo.csv' });
    expect(r.tipo).toBe('despesa');
    expect(r.confiancaTipo).toBe(30);
    expect(r.colunas).toEqual([]);
  });
});

// ── Detecção de tipo (PDF textLines) ─────────────────────────────────────────

describe('detectarOrigemArquivo — tipo por textLines PDF', () => {
  it('detecta cartão quando textLines contém "fatura"', () => {
    const r = detectarOrigemArquivo({
      fileName: 'doc.pdf',
      textLines: ['Fatura do cartão Nubank', 'Vencimento: 10/04/2026'],
    });
    expect(r.tipo).toBe('cartao');
    expect(r.pipeline).toBe('PIPELINE_CARTAO');
  });

  it('detecta cartão quando textLines contém "vencimento da fatura"', () => {
    const r = detectarOrigemArquivo({
      fileName: 'doc.pdf',
      textLines: ['vencimento da fatura em 15/04/2026'],
    });
    expect(r.tipo).toBe('cartao');
  });

  it('detecta cartão quando textLines contém "limite disponível"', () => {
    const r = detectarOrigemArquivo({
      fileName: 'doc.pdf',
      textLines: ['Limite disponível: R$ 5.000,00'],
    });
    expect(r.tipo).toBe('cartao');
  });

  it('detecta banco quando textLines não contém palavras de cartão', () => {
    const r = detectarOrigemArquivo({
      fileName: 'doc.pdf',
      textLines: ['Extrato bancário Itaú', 'Período: março/2026'],
    });
    expect(r.tipo).toBe('banco');
    expect(r.confiancaTipo).toBeGreaterThanOrEqual(70);
  });

  it('textLines tem prioridade sobre rows ausentes', () => {
    const r = detectarOrigemArquivo({
      fileName: 'doc.pdf',
      textLines: ['cartao nubank fatura'],
    });
    expect(r.tipo).toBe('cartao');
  });
});

// ── Detecção de banco (fileName) ──────────────────────────────────────────────

describe('detectarOrigemArquivo — banco por nome de arquivo', () => {
  it('detecta Itaú por nome de arquivo', () => {
    const r = detectarOrigemArquivo({ fileName: 'extrato-itau-2026.csv' });
    expect(r.origem).toBe('itau');
    expect(r.origemLabel).toBe('Itaú');
    expect(r.confiancaOrigem).toBeGreaterThanOrEqual(40);
  });

  it('detecta Nubank por nome de arquivo', () => {
    const r = detectarOrigemArquivo({ fileName: 'nubank_fatura.csv' });
    expect(r.origem).toBe('nubank');
  });

  it('detecta Bradesco por nome de arquivo', () => {
    const r = detectarOrigemArquivo({ fileName: 'bradesco_extrato.csv' });
    expect(r.origem).toBe('bradesco');
  });

  it('detecta C6 Bank por nome de arquivo', () => {
    const r = detectarOrigemArquivo({ fileName: 'c6bank_extrato.csv' });
    expect(r.origem).toBe('c6');
  });

  it('detecta Mercado Pago por nome de arquivo', () => {
    const r = detectarOrigemArquivo({ fileName: 'mercadopago_extrato.csv' });
    expect(r.origem).toBe('mercadopago');
  });

  it('retorna desconhecido para nome sem banco reconhecível', () => {
    const r = detectarOrigemArquivo({ fileName: 'extrato_generico.csv' });
    expect(r.origem).toBe('desconhecido');
    expect(r.confiancaOrigem).toBe(0);
  });
});

// ── Detecção de banco (keywords no corpo) ────────────────────────────────────

describe('detectarOrigemArquivo — banco por keywords', () => {
  it('detecta Itaú por keyword high no conteúdo', () => {
    const rows = [['itaú unibanco s.a.', 'extrato', '2026']];
    const r = detectarOrigemArquivo({ fileName: 'extrato.csv', rows });
    expect(r.origem).toBe('itau');
    expect(r.confiancaOrigem).toBeGreaterThanOrEqual(40);
  });

  it('detecta Nubank por keyword medium no conteúdo', () => {
    const rows = [['Data', 'Nubank', 'Valor']];
    const r = detectarOrigemArquivo({ fileName: 'extrato.csv', rows });
    expect(r.origem).toBe('nubank');
  });

  it('detecta Bradesco por keyword high', () => {
    const textLines = ['Banco Bradesco S.A. - Extrato de Conta Corrente'];
    const r = detectarOrigemArquivo({ fileName: 'extrato.pdf', textLines });
    expect(r.origem).toBe('bradesco');
  });

  it('detecta Santander por keyword medium', () => {
    const textLines = ['santander extrato mensal'];
    const r = detectarOrigemArquivo({ fileName: 'extrato.pdf', textLines });
    expect(r.origem).toBe('santander');
  });

  it('detecta Banco do Brasil por keyword', () => {
    const textLines = ['Banco do Brasil S.A. - Extrato'];
    const r = detectarOrigemArquivo({ fileName: 'bb.pdf', textLines });
    expect(r.origem).toBe('brasil');
  });

  it('detecta Caixa Econômica por keyword high', () => {
    const textLines = ['caixa econômica federal - extrato'];
    const r = detectarOrigemArquivo({ fileName: 'cef.pdf', textLines });
    expect(r.origem).toBe('caixa');
  });

  it('detecta Inter por keyword', () => {
    const textLines = ['banco inter pagamento'];
    const r = detectarOrigemArquivo({ fileName: 'inter.pdf', textLines });
    expect(r.origem).toBe('inter');
  });

  it('score é limitado a 100 mesmo com fileName + keywords high + medium', () => {
    const rows = [['itaú unibanco s.a.', 'itaú']];
    const r = detectarOrigemArquivo({ fileName: 'extrato-itau.csv', rows });
    expect(r.confiancaOrigem).toBeLessThanOrEqual(100);
  });

  it('prefere banco com maior score quando ambos aparecem', () => {
    // Itaú tem keyword high (40 pts) + fileName (40 pts) = 80
    // Nubank tem keyword medium (20 pts)
    const rows = [['itaú unibanco s.a.', 'nubank']];
    const r = detectarOrigemArquivo({ fileName: 'extrato-itau.csv', rows });
    expect(r.origem).toBe('itau');
  });

  it('ignora banco com score < 20', () => {
    // Nenhum keyword bate
    const r = detectarOrigemArquivo({
      fileName: 'relatorio.csv',
      textLines: ['transferência enviada'],
    });
    expect(r.origem).toBe('desconhecido');
  });

  it('keyword é case-insensitive e ignora acentos', () => {
    // "Itau Unibanco S.A." sem acento deve bater em "itaú unibanco s.a."
    const textLines = ['Itau Unibanco S.A. extrato'];
    const r = detectarOrigemArquivo({ fileName: 'extrato.pdf', textLines });
    expect(r.origem).toBe('itau');
  });
});

// ── Saída completa / pipeline ─────────────────────────────────────────────────

describe('detectarOrigemArquivo — saída completa', () => {
  it('retorna todos os campos esperados', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Portador', 'Parcela']];
    const r = detectarOrigemArquivo({ fileName: 'nubank_fatura.csv', rows });
    expect(r).toHaveProperty('tipo');
    expect(r).toHaveProperty('confiancaTipo');
    expect(r).toHaveProperty('confianca');
    expect(r).toHaveProperty('colunas');
    expect(r).toHaveProperty('origem');
    expect(r).toHaveProperty('origemLabel');
    expect(r).toHaveProperty('origemEmoji');
    expect(r).toHaveProperty('confiancaOrigem');
    expect(r).toHaveProperty('pipeline');
  });

  it('pipeline é PIPELINE_CARTAO para tipo cartao', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Portador', 'Parcela']];
    const r = detectarOrigemArquivo({ fileName: 'cartao.csv', rows });
    expect(r.pipeline).toBe('PIPELINE_CARTAO');
  });

  it('pipeline é PIPELINE_BANCARIO para tipo banco', () => {
    const rows = [['Data', 'Descrição', 'Valor']];
    const r = detectarOrigemArquivo({ fileName: 'banco.csv', rows });
    expect(r.pipeline).toBe('PIPELINE_BANCARIO');
  });

  it('pipeline é PIPELINE_BANCARIO para tipo receita', () => {
    const rows = [['Data', 'Descrição', 'Valor', 'Categoria']];
    const r = detectarOrigemArquivo({ fileName: 'receitas.csv', rows });
    expect(r.pipeline).toBe('PIPELINE_BANCARIO');
  });

  it('pipeline é PIPELINE_BANCARIO para tipo despesa (fallback)', () => {
    const r = detectarOrigemArquivo({ fileName: 'relatorio.csv' });
    expect(r.pipeline).toBe('PIPELINE_BANCARIO');
  });

  it('fileName vazio não quebra a função', () => {
    expect(() => detectarOrigemArquivo({ fileName: '' })).not.toThrow();
    const r = detectarOrigemArquivo({ fileName: '' });
    expect(r.origem).toBe('desconhecido');
  });

  it('rows e textLines vazios retornam defaults seguros', () => {
    const r = detectarOrigemArquivo({ fileName: 'arquivo.csv', rows: [], textLines: [] });
    expect(r.tipo).toBe('despesa');
    expect(r.colunas).toEqual([]);
    expect(r.origem).toBe('desconhecido');
  });
});
