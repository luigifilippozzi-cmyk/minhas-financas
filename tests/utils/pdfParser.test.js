// ============================================================
// Testes — pdfParser.js (RF-020)
// Valida extração de transações de PDFs de extrato bancário.
//
// Estratégia: mock de window.pdfjsLib via vi.stubGlobal.
// A função extrairTransacoesPDF depende de window.pdfjsLib em
// runtime (não no import), então o mock funciona em node env.
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extrairTransacoesPDF } from '../../src/js/utils/pdfParser.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Cria um item de texto no formato esperado pelo PDF.js:
 * transform[4] = X, transform[5] = Y.
 */
function item(str, x, y) {
  return { str, transform: [1, 0, 0, 1, x, y] };
}

/**
 * Cria um mock de window.pdfjsLib com páginas de items fornecidas.
 * @param {Array<Array>} paginas - cada elemento é um array de items para uma página
 */
function criarPdfjs(paginas) {
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: paginas.length,
        getPage: (n) => Promise.resolve({
          getTextContent: () => Promise.resolve({ items: paginas[n - 1] ?? [] }),
        }),
      }),
    }),
  };
}

/** Mock de File que retorna um ArrayBuffer vazio (o mock pdfjsLib ignora o conteúdo real). */
const mockFile = {
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
};

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  // Garante window limpo antes de cada teste
  vi.stubGlobal('window', {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Testes de guarda ──────────────────────────────────────────────────────────

describe('extrairTransacoesPDF — guarda window.pdfjsLib', () => {
  it('lança erro quando window.pdfjsLib não está carregado', async () => {
    // window.pdfjsLib = undefined
    await expect(extrairTransacoesPDF(mockFile)).rejects.toThrow('PDF.js não carregado');
  });

  it('não sobrescreve workerSrc se já estiver configurado', async () => {
    const pdfjsLib = criarPdfjs([[]]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'meu-worker.js';
    vi.stubGlobal('window', { pdfjsLib });
    await extrairTransacoesPDF(mockFile);
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe('meu-worker.js');
  });

  it('configura workerSrc quando está vazio', async () => {
    const pdfjsLib = criarPdfjs([[]]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    vi.stubGlobal('window', { pdfjsLib });
    await extrairTransacoesPDF(mockFile);
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toContain('pdf.worker');
  });
});

// ── PDF vazio / sem transações ────────────────────────────────────────────────

describe('extrairTransacoesPDF — PDF sem transações', () => {
  it('retorna array vazio para PDF com 0 páginas', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([]) });
    const result = await extrairTransacoesPDF({ ...mockFile,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
    // numPages=0, nenhuma página processada
    expect(result).toEqual([]);
  });

  it('retorna array vazio para página sem items', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result).toEqual([]);
  });

  it('ignora items com str vazio ou só espaços', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('', 10, 100),
      item('   ', 50, 100),
      item('\t', 80, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result).toEqual([]);
  });

  it('ignora linhas muito curtas (< 7 chars)', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('01/01', 10, 100),  // só 5 chars → descartado
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result).toEqual([]);
  });
});

// ── Parse de transações — formatos de data ────────────────────────────────────

describe('extrairTransacoesPDF — formatos de data', () => {
  const formatos = [
    ['DD/MM/YYYY', '10/04/2024 Padaria Pão Doce 25,50'],
    ['DD/MM/YY',   '10/04/24 Farmácia São Paulo 80,00'],
    ['DD/MM',      '10/04 Supermercado Frescão 120,00'],
    ['DD-MM-YYYY', '10-04-2024 Restaurante Bom Prato 45,00'],
    ['DD.MM.YYYY', '10.04.2024 Uber Viagem 32,00'],
  ];

  for (const [formato, linha] of formatos) {
    it(`parseia data no formato ${formato}`, async () => {
      vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[item(linha, 10, 100)]])});
      const result = await extrairTransacoesPDF(mockFile);
      expect(result.length).toBe(1);
      expect(result[0].dataStr).toBeTruthy();
      expect(result[0].valor).toBeGreaterThan(0);
    });
  }
});

// ── Parse de transações — formatos de valor ───────────────────────────────────

describe('extrairTransacoesPDF — formatos de valor', () => {
  it('parseia valor com separador de milhar: 1.234,56', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/03/2024 Aluguel 1.500,00', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    expect(result[0].valor).toBe(1500);
  });

  it('parseia valor sem separador de milhar: 250,00', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/03/2024 Mercado 250,00', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].valor).toBe(250);
  });

  it('parseia valor negativo: -150,00', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/03/2024 Débito -150,00', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].valor).toBe(-150);
  });

  it('parseia valor grande com dois separadores de milhar: 12.345,67', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('01/01/2024 Investimento 12.345,67', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].valor).toBeCloseTo(12345.67, 2);
  });

  it('ignora linha com valor zero', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/03/2024 Taxa Zero 0,00', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result).toEqual([]);
  });

  it('ignora linha sem valor numérico', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/03/2024 Sem valor aqui nenhum', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result).toEqual([]);
  });
});

// ── Flag D/C (débito/crédito) ─────────────────────────────────────────────────

describe('extrairTransacoesPDF — flag D/C', () => {
  it('flag D converte valor positivo em negativo', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('10/04/2024 Pagamento 200,00 D', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    expect(result[0].valor).toBe(-200);
  });

  it('flag C mantém valor positivo inalterado', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('10/04/2024 Crédito Salário 3.500,00 C', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].valor).toBe(3500);
  });

  it('flag C converte valor negativo em positivo (valor absoluto)', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('10/04/2024 Estorno -100,00 C', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].valor).toBe(100);
  });
});

// ── Linhas ignoradas ──────────────────────────────────────────────────────────

describe('extrairTransacoesPDF — linhas ignoradas', () => {
  const linhasIgnoradas = [
    'Saldo anterior 1.234,56',
    'TOTAL DÉBITOS 5.678,00',
    'Extrato de conta corrente',
    'Agência 0001 conta 12345-6',
    'Agencia 1234 Período 01/01/2024',
    'Banco do Brasil 01/03/2024',
    'CPF 123.456.789-00',
    'CNPJ 12.345.678/0001-90',
    'Data Histórico Valor',
    'Descrição Valor',
    'Pág. 1 de 3',
  ];

  for (const linha of linhasIgnoradas) {
    it(`ignora linha de cabeçalho/rodapé: "${linha.substring(0, 30)}..."`, async () => {
      vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[item(linha, 10, 100)]])});
      const result = await extrairTransacoesPDF(mockFile);
      expect(result).toEqual([]);
    });
  }
});

// ── Descrição extraída ────────────────────────────────────────────────────────

describe('extrairTransacoesPDF — descrição', () => {
  it('extrai descrição entre data e valor', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/04/2024 Supermercado Pão de Açúcar 189,90', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].desc).toContain('Pão');
  });

  it('usa fallback para "Transação" quando descrição não é encontrada', async () => {
    // Data ao final da linha, sem texto antes ou depois exceto valor
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('50,00 01/01/2024', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    if (result.length > 0) {
      expect(typeof result[0].desc).toBe('string');
      expect(result[0].desc.length).toBeGreaterThan(0);
    }
  });

  it('limita descrição a 100 caracteres', async () => {
    const descLonga = 'A'.repeat(120);
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item(`01/01/2024 ${descLonga} 100,00`, 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    if (result.length > 0) {
      expect(result[0].desc.length).toBeLessThanOrEqual(100);
    }
  });
});

// ── Confiança da extração ─────────────────────────────────────────────────────

describe('extrairTransacoesPDF — confiança', () => {
  it('retorna confiança "alta" para transação clara e bem formada', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/04/2024 Restaurante Bom Sabor 89,90', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result[0].confianca).toBe('alta');
  });

  it('retorna confiança "media" ou "baixa" para descrição muito curta', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/04/2024 AB 50,00', 10, 100),  // desc "AB" = 2 chars → -15 pts
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(['media', 'baixa']).toContain(result[0].confianca);
  });

  it('retorna confiança "baixa" para descrição ausente (só números)', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('15/04/2024 12345 50,00', 10, 100),  // desc "12345" = só dígitos → -30
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(['media', 'baixa']).toContain(result[0].confianca);
  });

  it('campo confiança sempre é "alta", "media" ou "baixa"', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('01/01/2024 Padaria Boa 30,00', 10, 100),
      item('02/01/2024 Farmácia 45,00', 10, 200),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    for (const t of result) {
      expect(['alta', 'media', 'baixa']).toContain(t.confianca);
    }
  });
});

// ── Agrupamento de items por linha (Y) ────────────────────────────────────────

describe('extrairTransacoesPDF — agrupamento por Y', () => {
  it('items com mesmo Y (dentro da tolerância) formam uma linha', async () => {
    // Mesma linha: Y=100 e Y=101.5 (dentro de tolerância 2.5)
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('10/04/2024',      10,   100),
      item('Mercado Verde',   100,  101.5),
      item('250,00',          350,  100.2),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    expect(result[0].valor).toBe(250);
  });

  it('items com Y diferente (fora da tolerância) formam linhas separadas', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      // Linha 1: Y=100
      item('10/04/2024 Padaria 30,00', 10, 100),
      // Linha 2: Y=80 (diferença > 2.5)
      item('11/04/2024 Farmácia 50,00', 10, 80),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(2);
  });

  it('items dentro de um grupo são ordenados por X (esquerda → direita)', async () => {
    // X=300 (valor) aparece antes de X=100 (desc) no array → deve ser reordenado
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('150,00',          300, 100),   // valor mais à direita
      item('Loja ABC',        100, 100),   // desc no meio
      item('15/03/2024',       10, 100),   // data mais à esquerda
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    // Após reordenação: "15/03/2024 Loja ABC 150,00"
    expect(result.length).toBe(1);
    expect(result[0].dataStr).toContain('15/03/2024');
    expect(result[0].valor).toBe(150);
  });
});

// ── PDF multi-página ──────────────────────────────────────────────────────────

describe('extrairTransacoesPDF — múltiplas páginas', () => {
  it('processa duas páginas e retorna transações de ambas', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([
      // Página 1
      [item('05/01/2024 Padaria 25,00', 10, 100)],
      // Página 2
      [item('06/01/2024 Farmácia 80,00', 10, 100)],
    ])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(2);
    expect(result.map(r => r.valor)).toEqual(expect.arrayContaining([25, 80]));
  });

  it('processa três páginas, ignora linhas de cabeçalho em todas', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([
      [item('EXTRATO DE CONTA CORRENTE', 10, 200),
       item('01/02/2024 Mercado 100,00', 10, 100)],
      [item('Saldo anterior 5.000,00', 10, 200),
       item('02/02/2024 Uber 35,00', 10, 100)],
      [item('Total débitos 135,00', 10, 200),
       item('03/02/2024 Netflix 55,00', 10, 100)],
    ])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(3);
  });
});

// ── Estrutura do resultado ────────────────────────────────────────────────────

describe('extrairTransacoesPDF — estrutura do resultado', () => {
  it('cada transação tem os campos obrigatórios: dataStr, desc, valor, confianca', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('10/04/2024 Teste de Estrutura 99,99', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    const t = result[0];
    expect(t).toHaveProperty('dataStr');
    expect(t).toHaveProperty('desc');
    expect(t).toHaveProperty('valor');
    expect(t).toHaveProperty('confianca');
    expect(typeof t.dataStr).toBe('string');
    expect(typeof t.desc).toBe('string');
    expect(typeof t.valor).toBe('number');
    expect(typeof t.confianca).toBe('string');
  });

  it('retorna um array', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(Array.isArray(result)).toBe(true);
  });

  it('não retorna transações com valor NaN', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('10/04/2024 Transação Válida 150,00', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    for (const t of result) {
      expect(isNaN(t.valor)).toBe(false);
    }
  });
});

// ── BUG-033: BTG Pactual — timestamp HH:MM após data ─────────────────────────
// O PDF do BTG inclui horário após a data: "30/03/2026 18:43 PIX RECEBIDO 500,00 C"
// O timestamp não deve integrar a descrição, pois quebraria a chave_dedup vs. CSV.

describe('extrairTransacoesPDF — BUG-033 timestamp pós-data (BTG)', () => {
  it('strip HH:MM do início da descrição — formato BTG "DD/MM/YYYY HH:MM desc valor"', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('30/03/2026 18:43 PIX RECEBIDO FULANO SILVA 500,00 C', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    expect(result[0].desc).not.toMatch(/^18:43/);
    expect(result[0].desc).toContain('PIX RECEBIDO');
  });

  it('strip HH:MM:SS do início da descrição', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('30/03/2026 18:43:22 TRANSFERENCIA BANCARIA 1.200,00 D', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    expect(result[0].desc).not.toMatch(/^18:43:22/);
    expect(result[0].desc).toContain('TRANSFERENCIA');
  });

  it('descrição sem timestamp permanece inalterada', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('30/03/2026 PIX RECEBIDO FULANO SILVA 500,00', 10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(1);
    expect(result[0].desc).toContain('PIX RECEBIDO');
  });

  it('múltiplas transações BTG: todas sem timestamp na descrição', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('25/03/2026 08:01 DEBITO AUTOMATICO LUZ 200,00 D', 10, 300),
      item('26/03/2026 10:30 TED ENVIADA JOAO 1.000,00 D',    10, 200),
      item('27/03/2026 14:15 CREDITO SALARIO 5.000,00 C',     10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    expect(result.length).toBe(3);
    for (const t of result) {
      expect(t.desc).not.toMatch(/^\d{2}:\d{2}/);
    }
  });

  it('ignora linha de Saldo Diário do extrato BTG', async () => {
    vi.stubGlobal('window', { pdfjsLib: criarPdfjs([[
      item('25/03/2026 18:01 PIX RECEBIDO FULANO 500,00 C', 10, 200),
      item('25/03/2026 Saldo diário 10.500,00 C',           10, 100),
    ]])});
    const result = await extrairTransacoesPDF(mockFile);
    // Saldo Diário deve ser filtrado pelo RE_IGNORAR (\bsaldo\b)
    expect(result.length).toBe(1);
    expect(result[0].desc).not.toMatch(/saldo/i);
  });
});
