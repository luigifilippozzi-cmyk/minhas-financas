import { describe, it, expect } from 'vitest';
import {
  detectarFormato,
  gerarChaveDedupReceita,
  normalizarValorReceita,
  resolverContaPorNome,
  resolverCategoriaPorNome,
  parsearLinhasReceita,
} from '../../src/js/utils/importacaoComum.js';

// ── detectarFormato ──────────────────────────────────────────────

describe('detectarFormato', () => {
  it('detecta CSV', () => {
    expect(detectarFormato('extrato.csv')).toBe('csv');
    expect(detectarFormato('FATURA.CSV')).toBe('csv');
  });

  it('detecta XLSX/XLS', () => {
    expect(detectarFormato('dados.xlsx')).toBe('xlsx');
    expect(detectarFormato('dados.xls')).toBe('xlsx');
    expect(detectarFormato('DADOS.XLSX')).toBe('xlsx');
  });

  it('detecta PDF', () => {
    expect(detectarFormato('extrato.pdf')).toBe('pdf');
    expect(detectarFormato('EXTRATO.PDF')).toBe('pdf');
  });

  it('retorna null para formato desconhecido', () => {
    expect(detectarFormato('dados.txt')).toBeNull();
    expect(detectarFormato('imagem.png')).toBeNull();
    expect(detectarFormato('')).toBeNull();
  });
});

// ── gerarChaveDedupReceita ───────────────────────────────────────

describe('gerarChaveDedupReceita', () => {
  it('gera chave com prefixo rec||', () => {
    const chave = gerarChaveDedupReceita(new Date('2026-03-15'), 'Salário março', 8500);
    expect(chave).toBe('rec||2026-03-15||salário março||8500.00');
  });

  it('normaliza descrição: lowercase + trim + espaços', () => {
    const chave = gerarChaveDedupReceita(new Date('2026-01-01'), '  Freelance   Projeto  Web  ', 1200);
    expect(chave).toBe('rec||2026-01-01||freelance projeto web||1200.00');
  });

  it('trunca descrição em 60 caracteres', () => {
    const desc = 'A'.repeat(80);
    const chave = gerarChaveDedupReceita(new Date('2026-01-01'), desc, 100);
    expect(chave).toContain('||' + 'a'.repeat(60) + '||');
  });

  it('aceita data como string ISO', () => {
    const chave = gerarChaveDedupReceita('2026-06-01', 'Teste', 50);
    expect(chave).toBe('rec||2026-06-01||teste||50.00');
  });

  it('retorna null para data ausente', () => {
    expect(gerarChaveDedupReceita(null, 'Desc', 100)).toBeNull();
  });

  it('retorna null para valor NaN', () => {
    expect(gerarChaveDedupReceita(new Date(), 'Desc', NaN)).toBeNull();
  });
});

// ── normalizarValorReceita ───────────────────────────────────────

describe('normalizarValorReceita', () => {
  it('retorna valor absoluto de número positivo', () => {
    expect(normalizarValorReceita(500)).toBe(500);
  });

  it('retorna valor absoluto de número negativo', () => {
    expect(normalizarValorReceita(-350.50)).toBe(350.50);
  });

  it('parseia string com formato BR: "R$ 1.290,00"', () => {
    expect(normalizarValorReceita('R$ 1.290,00')).toBe(1290);
  });

  it('parseia string negativa e retorna absoluto', () => {
    expect(normalizarValorReceita('-500,00')).toBe(500);
  });

  it('retorna NaN para null, undefined e string vazia', () => {
    expect(normalizarValorReceita(null)).toBeNaN();
    expect(normalizarValorReceita(undefined)).toBeNaN();
    expect(normalizarValorReceita('')).toBeNaN();
  });

  it('retorna zero como zero', () => {
    expect(normalizarValorReceita(0)).toBe(0);
  });
});

// ── resolverContaPorNome ─────────────────────────────────────────

describe('resolverContaPorNome', () => {
  const contas = [
    { id: 'c1', nome: 'Banco Itaú', emoji: '🏦' },
    { id: 'c2', nome: 'Nubank',     emoji: '💜' },
    { id: 'c3', nome: 'Banco BTG',  emoji: '🏦' },
  ];

  it('resolve por match direto (case-insensitive + sem acento)', () => {
    expect(resolverContaPorNome('Banco Itaú', contas)).toBe('c1');
    expect(resolverContaPorNome('banco itau', contas)).toBe('c1');
  });

  it('resolve por match parcial', () => {
    expect(resolverContaPorNome('Itaú', contas)).toBe('c1');
    expect(resolverContaPorNome('nubank', contas)).toBe('c2');
  });

  it('retorna vazio para nome não encontrado', () => {
    expect(resolverContaPorNome('Corretora XYZ', contas)).toBe('');
  });

  it('retorna vazio para entrada vazia ou contas vazias', () => {
    expect(resolverContaPorNome('', contas)).toBe('');
    expect(resolverContaPorNome('Itaú', [])).toBe('');
    expect(resolverContaPorNome(null, contas)).toBe('');
  });
});

// ── resolverCategoriaPorNome ─────────────────────────────────────

describe('resolverCategoriaPorNome', () => {
  const categorias = [
    { id: 'cat1', nome: 'Salário',      emoji: '💰' },
    { id: 'cat2', nome: 'Freelance',    emoji: '💻' },
    { id: 'cat3', nome: 'Rendimentos',  emoji: '📈' },
  ];

  it('resolve por match direto', () => {
    expect(resolverCategoriaPorNome('Salário', categorias)).toBe('cat1');
  });

  it('resolve por match case-insensitive parcial', () => {
    expect(resolverCategoriaPorNome('freelance', categorias)).toBe('cat2');
    expect(resolverCategoriaPorNome('Rendimento', categorias)).toBe('cat3');
  });

  it('retorna vazio para categoria não encontrada', () => {
    expect(resolverCategoriaPorNome('Investimentos', categorias)).toBe('');
  });

  it('retorna vazio para entrada vazia', () => {
    expect(resolverCategoriaPorNome('', categorias)).toBe('');
    expect(resolverCategoriaPorNome(null, categorias)).toBe('');
    expect(resolverCategoriaPorNome('Salário', [])).toBe('');
  });
});

// ── parsearLinhasReceita ─────────────────────────────────────────

describe('parsearLinhasReceita', () => {
  const categorias = [
    { id: 'cat1', nome: 'Salário',   emoji: '💰' },
    { id: 'cat2', nome: 'Freelance', emoji: '💻' },
  ];
  const contas = [
    { id: 'c1', nome: 'Banco Itaú', emoji: '🏦' },
  ];

  it('parseia rows com cabeçalho detectado', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor', 'Categoria', 'Conta'],
      ['15/03/2026', 'Salário março', '8500,00', 'Salário', 'Banco Itaú'],
      ['20/03/2026', 'Freelance', '1200,00', 'Freelance', ''],
    ];
    const result = parsearLinhasReceita(rows, { categorias, contas });
    expect(result).toHaveLength(2);
    expect(result[0].descricao).toBe('Salário março');
    expect(result[0].valor).toBe(8500);
    expect(result[0].categoriaId).toBe('cat1');
    expect(result[0].contaId).toBe('c1');
    expect(result[0].erro).toBeNull();
    expect(result[1].descricao).toBe('Freelance');
    expect(result[1].categoriaId).toBe('cat2');
  });

  it('parseia rows sem cabeçalho (posicionamento padrão)', () => {
    const rows = [
      ['Coluna1', 'Coluna2', 'Coluna3'],
      ['15/03/2026', 'Renda extra', '500,00'],
    ];
    const result = parsearLinhasReceita(rows);
    expect(result).toHaveLength(1);
    expect(result[0].descricao).toBe('Renda extra');
    expect(result[0].valor).toBe(500);
  });

  it('marca erros para dados inválidos', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['', 'Sem data', '100,00'],
      ['15/03/2026', '', '100,00'],
      ['15/03/2026', 'Valor zero', '0'],
    ];
    const result = parsearLinhasReceita(rows);
    expect(result[0].erro).toContain('Data inválida');
    expect(result[1].erro).toContain('Descrição vazia');
    expect(result[2].erro).toContain('Valor inválido');
  });

  it('marca duplicatas quando chave existe no Set', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['15/03/2026', 'Salário', '5000,00'],
    ];
    const chave = 'rec||2026-03-15||salário||5000.00';
    const chavesRec = new Set([chave]);
    const result = parsearLinhasReceita(rows, { chavesRec });
    expect(result[0].duplicado).toBe(true);
  });

  it('não marca duplicata quando chave não existe', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['15/03/2026', 'Renda nova', '3000,00'],
    ];
    const result = parsearLinhasReceita(rows, { chavesRec: new Set() });
    expect(result[0].duplicado).toBe(false);
  });

  it('retorna array vazio para input vazio', () => {
    expect(parsearLinhasReceita([])).toEqual([]);
  });

  it('pula linhas completamente vazias', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['', '', ''],
      ['15/03/2026', 'Teste', '100,00'],
    ];
    const result = parsearLinhasReceita(rows);
    expect(result).toHaveLength(1);
  });

  it('resolve contaId pelo seletor global quando coluna e inferência falham', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['15/03/2026', 'Dividendos FII', '300,00'],
    ];
    const result = parsearLinhasReceita(rows, { contas: [], contaGlobalId: 'global-1' });
    expect(result[0].contaId).toBe('global-1');
  });

  it('gera chave_dedup no formato rec||iso||desc||valor', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['01/06/2026', 'Aluguel', '2500,00'],
    ];
    const result = parsearLinhasReceita(rows);
    expect(result[0].chave_dedup).toBe('rec||2026-06-01||aluguel||2500.00');
  });

  it('não gera chave_dedup para linhas com erro', () => {
    const rows = [
      ['Data', 'Descricao', 'Valor'],
      ['', 'Sem data', '100,00'],
    ];
    const result = parsearLinhasReceita(rows);
    expect(result[0].chave_dedup).toBeNull();
  });
});
