import { describe, it, expect } from 'vitest';
import {
  normalizarValorXP,
  normalizarData,
  normalizarParcela,
  parsearParcela,
  gerarChaveDedup,
  inferirContaDaDescricao,
  parsearCSVTexto,
  parsearLinhasCSVXLSX,
} from '../../src/js/utils/normalizadorTransacoes.js';

// ── normalizarValorXP ─────────────────────────────────────────────────────────
// BUG-014: detecta convenção de separador decimal pela posição do último ponto
// vs última vírgula para não destruir casas decimais.

describe('normalizarValorXP', () => {
  it('convenção BR: ponto=milhar, vírgula=decimal  →  "R$ 1.290,00"', () => {
    expect(normalizarValorXP('R$ 1.290,00')).toBe(1290);
  });

  it('convenção US/XP: vírgula=milhar, ponto=decimal  →  "1,290.00"', () => {
    expect(normalizarValorXP('1,290.00')).toBe(1290);
  });

  it('vírgula como decimal sem ponto  →  "1290,00"', () => {
    expect(normalizarValorXP('1290,00')).toBe(1290);
  });

  it('ponto como decimal sem vírgula  →  "100.50"', () => {
    expect(normalizarValorXP('100.50')).toBe(100.5);
  });

  it('número inteiro como string  →  "500"', () => {
    expect(normalizarValorXP('500')).toBe(500);
  });

  it('número já como tipo number passa direto', () => {
    expect(normalizarValorXP(1290)).toBe(1290);
    expect(normalizarValorXP(0.01)).toBe(0.01);
  });

  it('valor negativo  →  "-R$ 500,00"', () => {
    expect(normalizarValorXP('-R$ 500,00')).toBe(-500);
  });

  it('retorna NaN para string vazia', () => {
    expect(normalizarValorXP('')).toBeNaN();
  });

  it('retorna NaN para null e undefined', () => {
    expect(normalizarValorXP(null)).toBeNaN();
    expect(normalizarValorXP(undefined)).toBeNaN();
  });

  it('retorna NaN para texto não numérico', () => {
    expect(normalizarValorXP('abc')).toBeNaN();
  });

  it('lida com valor de milhar duplo: "1.000.000,00"', () => {
    expect(normalizarValorXP('1.000.000,00')).toBe(1000000);
  });
});

// ── normalizarData ────────────────────────────────────────────────────────────

describe('normalizarData', () => {
  it('parseia formato DD/MM/AAAA', () => {
    const d = normalizarData('25/03/2026');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // março = 2 (0-based)
    expect(d.getDate()).toBe(25);
  });

  it('parseia formato ISO AAAA-MM-DD', () => {
    const d = normalizarData('2026-03-25');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(25);
  });

  it('retorna null para string vazia', () => {
    expect(normalizarData('')).toBeNull();
  });

  it('retorna null para null', () => {
    expect(normalizarData(null)).toBeNull();
  });

  it('retorna null para data inválida', () => {
    expect(normalizarData('data-invalida')).toBeNull();
  });

  it('repassa objeto Date válido sem modificação', () => {
    const original = new Date('2026-01-15T12:00:00');
    const resultado = normalizarData(original);
    expect(resultado).toBeInstanceOf(Date);
    expect(resultado.getTime()).toBe(original.getTime());
  });

  it('lida com dia e mês com um dígito: "5/1/2026"', () => {
    const d = normalizarData('5/1/2026');
    expect(d).toBeInstanceOf(Date);
    expect(d.getMonth()).toBe(0); // janeiro
    expect(d.getDate()).toBe(5);
  });
});

// ── normalizarParcela ─────────────────────────────────────────────────────────
// NRF-002.1: normaliza para formato canônico "XX/YY"

describe('normalizarParcela', () => {
  it('formata "1/6" como "01/06"', () => {
    expect(normalizarParcela('1/6')).toBe('01/06');
  });

  it('formata "2 de 12" como "02/12"', () => {
    expect(normalizarParcela('2 de 12')).toBe('02/12');
  });

  it('aceita "1 DE 6" (maiúsculas)', () => {
    expect(normalizarParcela('1 DE 6')).toBe('01/06');
  });

  it('não modifica formato já canônico "03/06"', () => {
    expect(normalizarParcela('03/06')).toBe('03/06');
  });

  it('retorna "-" para string "-"', () => {
    expect(normalizarParcela('-')).toBe('-');
  });

  it('retorna "-" para string vazia', () => {
    expect(normalizarParcela('')).toBe('-');
  });

  it('retorna "-" para null e undefined', () => {
    expect(normalizarParcela(null)).toBe('-');
    expect(normalizarParcela(undefined)).toBe('-');
  });

  it('retorna "-" quando atual > total (inválido)', () => {
    expect(normalizarParcela('7/6')).toBe('-');
  });

  it('retorna "-" para formato inválido', () => {
    expect(normalizarParcela('parcela-x')).toBe('-');
  });
});

// ── parsearParcela ────────────────────────────────────────────────────────────
// BUG-015: condição era `atual >= total`, excluindo a última parcela (ex: 12/12)

describe('parsearParcela', () => {
  it('parseia "1/6"', () => {
    expect(parsearParcela('1/6')).toEqual({ atual: 1, total: 6 });
  });

  it('parseia "2 de 6"', () => {
    expect(parsearParcela('2 de 6')).toEqual({ atual: 2, total: 6 });
  });

  it('parseia "2 DE 12" (maiúsculas)', () => {
    expect(parsearParcela('2 DE 12')).toEqual({ atual: 2, total: 12 });
  });

  it('parseia "01/06" (formato canônico com zeros)', () => {
    expect(parsearParcela('01/06')).toEqual({ atual: 1, total: 6 });
  });

  it('REGRESSÃO BUG-015: parseia "12/12" (última parcela)', () => {
    // Antes do fix, atual >= total retornava null para 12/12
    expect(parsearParcela('12/12')).toEqual({ atual: 12, total: 12 });
  });

  it('retorna null para "7/6" (atual > total)', () => {
    expect(parsearParcela('7/6')).toBeNull();
  });

  it('retorna null para "-"', () => {
    expect(parsearParcela('-')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(parsearParcela('')).toBeNull();
  });

  it('retorna null para null', () => {
    expect(parsearParcela(null)).toBeNull();
  });

  it('retorna null para formato não reconhecido', () => {
    expect(parsearParcela('parcela-x')).toBeNull();
    expect(parsearParcela('X')).toBeNull();
  });
});

// ── gerarChaveDedup ───────────────────────────────────────────────────────────

describe('gerarChaveDedup', () => {
  const data = new Date('2026-03-25T12:00:00');

  it('chave com parcela NÃO inclui a data (compatibilidade com projeções)', () => {
    const chave = gerarChaveDedup(data, 'Shopee', 150, 'João', '01/06');
    expect(chave).not.toContain('2026-03-25');
    expect(chave).toContain('shopee');
    expect(chave).toContain('150.00');
    expect(chave).toContain('01/06');
  });

  it('chave sem parcela inclui a data ISO', () => {
    const chave = gerarChaveDedup(data, 'Nubank', 50, 'Maria', '-');
    expect(chave).toContain('2026-03-25');
    expect(chave).toContain('nubank');
    expect(chave).toContain('50.00');
  });

  it('é idempotente: mesma entrada gera mesma chave', () => {
    const c1 = gerarChaveDedup(data, 'iFood', 30, 'Ana', '02/06');
    const c2 = gerarChaveDedup(data, 'iFood', 30, 'Ana', '02/06');
    expect(c1).toBe(c2);
  });

  it('retorna null quando data é null', () => {
    expect(gerarChaveDedup(null, 'Shopee', 100, '', '-')).toBeNull();
  });

  it('retorna null quando valor é NaN', () => {
    expect(gerarChaveDedup(data, 'Shopee', NaN, '', '-')).toBeNull();
  });

  it('trunca estab em 50 caracteres', () => {
    const estabLongo = 'A'.repeat(60);
    const chave = gerarChaveDedup(data, estabLongo, 10, '', '-');
    const partes = chave.split('||');
    expect(partes[1].length).toBe(50);
  });

  it('transações com valores diferentes geram chaves diferentes', () => {
    const c1 = gerarChaveDedup(data, 'Shopee', 100, 'João', '-');
    const c2 = gerarChaveDedup(data, 'Shopee', 200, 'João', '-');
    expect(c1).not.toBe(c2);
  });
});

// ── inferirContaDaDescricao ───────────────────────────────────────────────────
// NRF-004: resolve conta/banco a partir de palavras-chave na descrição

describe('inferirContaDaDescricao', () => {
  it('retorna string vazia quando descrição está vazia', () => {
    expect(inferirContaDaDescricao('', [{ id: 'c1', nome: 'Nubank' }])).toBe('');
  });

  it('retorna string vazia quando não há contas', () => {
    expect(inferirContaDaDescricao('nubank pagamento', [])).toBe('');
  });

  it('passo 1 — match direto pelo nome da conta na descrição', () => {
    const contas = [{ id: 'c1', nome: 'Nubank' }];
    expect(inferirContaDaDescricao('pix enviado nubank', contas)).toBe('c1');
  });

  it('passo 1 — normaliza acentos ao comparar', () => {
    const contas = [{ id: 'c1', nome: 'Itaú Corrente' }];
    expect(inferirContaDaDescricao('pagamento itau debito', contas)).toBe('c1');
  });

  it('passo 2 — usa mapa de keywords quando nome da conta não consta na descrição', () => {
    // "BTG" tem apenas 3 chars, não passa pelo passo 1 (exige > 3)
    const contas = [{ id: 'c1', nome: 'BTG Pactual Conta' }];
    expect(inferirContaDaDescricao('pix rec btg', contas)).toBe('c1');
  });

  it('retorna string vazia quando não há match em nenhum passo', () => {
    const contas = [{ id: 'c1', nome: 'Banco X' }];
    expect(inferirContaDaDescricao('compra no supermercado', contas)).toBe('');
  });
});

// ── parsearCSVTexto ───────────────────────────────────────────────────────────

describe('parsearCSVTexto', () => {
  it('divide linhas e colunas por ponto-e-vírgula', () => {
    const resultado = parsearCSVTexto('data;descricao;valor\n2026-03-25;Shopee;100,00');
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual(['data', 'descricao', 'valor']);
    expect(resultado[1]).toEqual(['2026-03-25', 'Shopee', '100,00']);
  });

  it('remove BOM (\\uFEFF) do início', () => {
    const resultado = parsearCSVTexto('\uFEFFdata;valor\n25/03/2026;100');
    expect(resultado[0][0]).toBe('data');
  });

  it('ignora linhas vazias', () => {
    const resultado = parsearCSVTexto('a;b\n\nc;d\n');
    expect(resultado).toHaveLength(2);
  });

  it('lida com quebras de linha Windows (\\r\\n)', () => {
    const resultado = parsearCSVTexto('a;b\r\nc;d');
    expect(resultado).toHaveLength(2);
    expect(resultado[1]).toEqual(['c', 'd']);
  });
});

// ── parsearLinhasCSVXLSX ──────────────────────────────────────────────────────

describe('parsearLinhasCSVXLSX', () => {
  const HEADER = ['Data', 'Estabelecimento', 'Portador', 'Valor', 'Parcela'];

  it('retorna array vazio para entrada vazia', () => {
    expect(parsearLinhasCSVXLSX([])).toEqual([]);
  });

  it('REGRESSÃO BUG-012: lança erro quando arquivo usa vírgula como separador', () => {
    const rowsMalFormatadas = [['data,descricao,valor']];
    expect(() => parsearLinhasCSVXLSX(rowsMalFormatadas)).toThrow(/vírgula/);
  });

  it('parseia linhas válidas com cabeçalho detectado', () => {
    const rows = [
      HEADER,
      ['25/03/2026', 'Shopee Compras', 'João', '150,00', '1/6'],
    ];
    const resultado = parsearLinhasCSVXLSX(rows);
    expect(resultado).toHaveLength(1);
    const linha = resultado[0];
    expect(linha.descricao).toBe('Shopee Compras');
    expect(linha.valor).toBe(150);
    expect(linha.portador).toBe('João');
    expect(linha.parcela).toBe('01/06');
    expect(linha.erro).toBeNull();
  });

  it('REGRESSÃO BUG-011: valor negativo (crédito/estorno) tem isNegativo=true', () => {
    const rows = [
      HEADER,
      ['25/03/2026', 'Estorno Shopee', 'João', '-50,00', '-'],
    ];
    const resultado = parsearLinhasCSVXLSX(rows);
    expect(resultado[0].isNegativo).toBe(true);
    expect(resultado[0].valor).toBe(50); // Math.abs
  });

  it('REGRESSÃO BUG-016: ignora linha "Pagamento de Fatura"', () => {
    const rows = [
      HEADER,
      ['25/03/2026', 'Pagamento de Fatura', 'João', '1000,00', '-'],
      ['25/03/2026', 'Shopee', 'João', '50,00', '-'],
    ];
    const resultado = parsearLinhasCSVXLSX(rows);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].descricao).toBe('Shopee');
  });

  it('marca linha com erro quando data está ausente', () => {
    const rows = [
      HEADER,
      ['', 'Shopee', 'João', '50,00', '-'],
    ];
    const resultado = parsearLinhasCSVXLSX(rows);
    expect(resultado[0].erro).toMatch(/Data inválida/);
  });

  it('marca linha com erro quando valor é inválido', () => {
    const rows = [
      HEADER,
      ['25/03/2026', 'Shopee', 'João', 'sem-valor', '-'],
    ];
    const resultado = parsearLinhasCSVXLSX(rows);
    expect(resultado[0].erro).toMatch(/Valor inválido/);
  });

  // BUG-028: Suporte a extratos BTG XLS com header "Data e hora"
  describe('BTG XLS extrato — BUG-028', () => {
    it('detecta header "Data e hora" como coluna de data (startsWith)', () => {
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['', '30/03/2026 18:43', 'Alimentação', 'Compra no débito', '', '', 'Art Lanches', '', '', '', '-19.0'],
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      expect(resultado).toHaveLength(1);
      const linha = resultado[0];
      // Sem erro indica que a data foi parseada corretamente
      expect(linha.erro).toBeNull();
      expect(linha.data).toBeInstanceOf(Date);
    });

    it('strip do horário: "30/03/2026 18:43" → parseada como "30/03/2026"', () => {
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['', '30/03/2026 18:43', 'Alimentação', 'Compra no débito', '', '', 'Art Lanches', '', '', '', '-19.0'],
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      const linha = resultado[0];
      expect(linha.data.getFullYear()).toBe(2026);
      expect(linha.data.getMonth()).toBe(2); // março = 2
      expect(linha.data.getDate()).toBe(30);
    });

    it('coluna "Valor" em índice K é parseada corretamente: "-19.0" → R$ 19,00 despesa', () => {
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['', '30/03/2026 18:43', 'Alimentação', 'Compra no débito', '', '', 'Art Lanches', '', '', '', '-19.0'],
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      const linha = resultado[0];
      expect(linha.valor).toBe(19);
      expect(linha.isNegativo).toBe(true);
      expect(linha.erro).toBeNull();
    });

    it('linha "Banco Xp Sa / Pagamento de boleto" é detectada com valor e data válidos', () => {
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['', '15/03/2026 10:00', 'Transferência', 'Pagamento de boleto', '', '', 'Banco Xp Sa', '', '', '', '-16662.0'],
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      // Nota: "Pagamento de boleto" não contém "Pagamento de Fatura" exato, então não é filtrado
      // e passa para detecção posterior (ajusteDetector/pipelineBanco)
      expect(resultado).toHaveLength(1);
      const linha = resultado[0];
      expect(linha.descricao).toBe('Banco Xp Sa');
      expect(linha.valor).toBe(16662);
      expect(linha.isNegativo).toBe(true);
      expect(linha.erro).toBeNull();
    });

    it('linhas de metadata (sem data/valor válidos) são marcadas como erro', () => {
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['Cliente:', 'REDACTED_NAME', '', '', '', '', '', '', '', '', ''], // metadata
        ['CPF:', '123.456.789-00', '', '', '', '', '', '', '', '', ''], // metadata
        ['', '30/03/2026 18:43', 'Alimentação', 'Compra no débito', '', '', 'Art Lanches', '', '', '', '-19.0'], // dado válido
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      // Parser retorna todas as linhas (incluindo erros) — UI exibe ⚠️ nas inválidas
      const validas = resultado.filter(r => !r.erro);
      expect(validas).toHaveLength(1);
      expect(validas[0].descricao).toBe('Art Lanches');
    });

    it('linhas de "Saldo Diário" sem valor numérico válido são ignoradas', () => {
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['', '30/03/2026 18:43', 'Alimentação', 'Compra no débito', '', '', 'Art Lanches', '', '', '', '-19.0'],
        ['Saldo Diário', '', '', '', '', '', '', '', '', '', ''], // sem valor
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      // "Saldo Diário" tem headerIdx=0 (data), portanto não tem valor em idxValor
      // Esperado: apenas 1 linha válida
      expect(resultado).toHaveLength(1);
      expect(resultado[0].descricao).toBe('Art Lanches');
    });

    it('BUG-028: "Saldo Diário" com estrutura real BTG (data+valor válidos) é filtrado', () => {
      // Estrutura real do BTG XLS: 'Saldo Diário' em col 6, data válida em col 1, valor em col 10
      // Sem o filtro explícito, esta linha seria importada como transação real
      const rows = [
        ['', 'Data e hora', 'Categoria', 'Transação', '', '', 'Descrição', '', '', '', 'Valor'],
        ['', '30/03/2026 18:43', 'Alimentação', 'Compra no débito', '', '', 'Art Lanches', '', '', '', '-19.0'],
        ['', '30/03/2026 23:59', '', '', '', '', 'Saldo Diário', '', '', '', '163.55'], // snapshot de saldo
        ['', '31/03/2026 07:57', 'Salário', 'Portabilidade', '', '', 'Pagamento recebido', '', '', '', '2733.74'],
        ['', '31/03/2026 23:59', '', '', '', '', 'Saldo Diário', '', '', '', '2897.29'], // snapshot de saldo
      ];
      const resultado = parsearLinhasCSVXLSX(rows);
      // "Saldo Diário" deve ser filtrado — apenas 2 transações reais
      expect(resultado).toHaveLength(2);
      expect(resultado.map(r => r.descricao)).toEqual(['Art Lanches', 'Pagamento recebido']);
      expect(resultado.every(r => r.erro === null)).toBe(true);
    });
  });
});
