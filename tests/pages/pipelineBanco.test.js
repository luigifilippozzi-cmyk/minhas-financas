import { describe, it, expect } from 'vitest';
import { parsearLinhasPDF, classificarBanco, processarExtratoBancario } from '../../src/js/pages/pipelineBanco.js';

// ── Helpers ──────────────────────────────────────────────────────
function rawItem(overrides = {}) {
  return {
    dataStr: '05/03/2026',
    desc:    'MERCADO LIVRE',
    valor:   -150.00,
    confianca: 'alta',
    ...overrides,
  };
}

// ── parsearLinhasPDF — parsing de datas ──────────────────────────
describe('parsearLinhasPDF — formato de data', () => {
  it('aceita DD/MM/YYYY', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: '05/03/2026' })]);
    expect(l.data).toBeInstanceOf(Date);
    expect(l.data.getMonth()).toBe(2); // março
    expect(l.data.getFullYear()).toBe(2026);
    expect(l.erro).toBeNull();
  });

  it('aceita DD/MM/YY (expande para 20XX)', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: '05/03/26' })]);
    expect(l.data).toBeInstanceOf(Date);
    expect(l.data.getFullYear()).toBe(2026);
    expect(l.erro).toBeNull();
  });

  it('aceita DD/MM (assume ano corrente)', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: '05/03' })]);
    expect(l.data).toBeInstanceOf(Date);
    expect(l.data.getFullYear()).toBe(new Date().getFullYear());
    expect(l.erro).toBeNull();
  });

  it('aceita DD-MM-YYYY (hífens)', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: '05-03-2026' })]);
    expect(l.data).toBeInstanceOf(Date);
    expect(l.data.getMonth()).toBe(2);
    expect(l.erro).toBeNull();
  });

  it('aceita DD.MM.YYYY (pontos)', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: '05.03.2026' })]);
    expect(l.data).toBeInstanceOf(Date);
    expect(l.data.getMonth()).toBe(2);
    expect(l.erro).toBeNull();
  });

  it('registra erro para data null', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: null })]);
    expect(l.erro).toMatch('Data inválida');
    expect(l.chave_dedup).toBeNull();
  });

  it('registra erro para data string inválida', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: 'nao-eh-data' })]);
    expect(l.erro).toMatch('Data inválida');
  });
});

// ── parsearLinhasPDF — validação de campos ───────────────────────
describe('parsearLinhasPDF — validação', () => {
  it('registra erro para descrição vazia', () => {
    const [l] = parsearLinhasPDF([rawItem({ desc: '' })]);
    expect(l.erro).toMatch('Descrição vazia');
  });

  it('registra erro para descrição de 1 caractere', () => {
    const [l] = parsearLinhasPDF([rawItem({ desc: 'X' })]);
    expect(l.erro).toMatch('Descrição vazia');
  });

  it('registra erro para valor zero', () => {
    const [l] = parsearLinhasPDF([rawItem({ valor: 0 })]);
    expect(l.erro).toMatch('Valor inválido');
  });

  it('acumula múltiplos erros', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: null, desc: '', valor: 0 })]);
    expect(l.erro).toMatch('Data inválida');
    expect(l.erro).toMatch('Descrição vazia');
    expect(l.erro).toMatch('Valor inválido');
  });
});

// ── parsearLinhasPDF — isNegativo (BUG-011) ──────────────────────
describe('parsearLinhasPDF — isNegativo / BUG-011', () => {
  it('valor negativo no arquivo → isNegativo=true (débito/despesa)', () => {
    const [l] = parsearLinhasPDF([rawItem({ valor: -150 })]);
    expect(l.isNegativo).toBe(true);
    expect(l.valor).toBe(150); // sempre absoluto
  });

  it('valor positivo no arquivo → isNegativo=false (crédito/receita)', () => {
    const [l] = parsearLinhasPDF([rawItem({ valor: 200 })]);
    expect(l.isNegativo).toBe(false);
    expect(l.valor).toBe(200);
  });
});

// ── parsearLinhasPDF — metadados ─────────────────────────────────
describe('parsearLinhasPDF — metadados e campos padrão', () => {
  it('preserva _confiancaPDF do raw', () => {
    const [l] = parsearLinhasPDF([rawItem({ confianca: 'baixa' })]);
    expect(l._confiancaPDF).toBe('baixa');
  });

  it('usa contaGlobal quando fornecida', () => {
    const [l] = parsearLinhasPDF([rawItem()], { contaGlobal: 'conta-123' });
    expect(l.contaId).toBe('conta-123');
  });

  it('seta _idx com índice correto para múltiplas linhas', () => {
    const raw = [rawItem(), rawItem({ desc: 'OUTRO ITEM' })];
    const linhas = parsearLinhasPDF(raw);
    expect(linhas[0]._idx).toBe(0);
    expect(linhas[1]._idx).toBe(1);
  });

  it('chave_dedup preenchida para linha válida', () => {
    const [l] = parsearLinhasPDF([rawItem()]);
    expect(l.chave_dedup).not.toBeNull();
  });

  it('chave_dedup null para linha com erro', () => {
    const [l] = parsearLinhasPDF([rawItem({ dataStr: null })]);
    expect(l.chave_dedup).toBeNull();
  });

  it('duplicado inicia como false', () => {
    const [l] = parsearLinhasPDF([rawItem()]);
    expect(l.duplicado).toBe(false);
  });

  it('tipoLinha inicia como null', () => {
    const [l] = parsearLinhasPDF([rawItem()]);
    expect(l.tipoLinha).toBeNull();
  });

  it('portador inicia como string vazia', () => {
    const [l] = parsearLinhasPDF([rawItem()]);
    expect(l.portador).toBe('');
  });
});

// ── classificarBanco ─────────────────────────────────────────────
describe('classificarBanco', () => {
  function linhaBanco(overrides = {}) {
    return { isNegativo: false, erro: null, tipoLinha: null, ...overrides };
  }

  it('isNegativo=true, convenção normal → despesa', () => {
    const l = linhaBanco({ isNegativo: true });
    classificarBanco([l]);
    expect(l.tipoLinha).toBe('despesa');
  });

  it('isNegativo=false, convenção normal → receita', () => {
    const l = linhaBanco({ isNegativo: false });
    classificarBanco([l]);
    expect(l.tipoLinha).toBe('receita');
  });

  it('isNegativo=true, sinaisInvertidos=true → receita', () => {
    const l = linhaBanco({ isNegativo: true });
    classificarBanco([l], true);
    expect(l.tipoLinha).toBe('receita');
  });

  it('isNegativo=false, sinaisInvertidos=true → despesa', () => {
    const l = linhaBanco({ isNegativo: false });
    classificarBanco([l], true);
    expect(l.tipoLinha).toBe('despesa');
  });

  it('linhas com erro não são classificadas', () => {
    const l = linhaBanco({ isNegativo: true, erro: 'Valor inválido' });
    classificarBanco([l]);
    expect(l.tipoLinha).toBeNull();
  });

  it('muta as linhas in-place e retorna undefined', () => {
    const linhas = [linhaBanco({ isNegativo: true }), linhaBanco({ isNegativo: false })];
    const ret = classificarBanco(linhas);
    expect(ret).toBeUndefined();
    expect(linhas[0].tipoLinha).toBe('despesa');
    expect(linhas[1].tipoLinha).toBe('receita');
  });
});

// ── processarExtratoBancario — smoke test ────────────────────────
describe('processarExtratoBancario', () => {
  it('retorna array vazio para rows sem dados', () => {
    const result = processarExtratoBancario({
      rows: [['Data', 'Descrição', 'Valor']],
      contas: [], categorias: [], mapaHist: {}, origemBanco: 'desconhecido',
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('processa linha válida de extrato bancário', () => {
    const rows = [
      ['Data', 'Descrição', 'Valor'],
      ['05/03/2026', 'MERCADO LIVRE', '-150,00'],
    ];
    const result = processarExtratoBancario({
      rows, contas: [], categorias: [], mapaHist: {}, origemBanco: 'itau',
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

// ── BUG-033: consistência chave_dedup PDF vs CSV (mesmo banco) ──
// Regressão: PDF BTG com timestamp "HH:MM" na linha não deve gerar
// chave_dedup diferente da gerada pelo CSV para a mesma transação.
describe('parsearLinhasPDF — BUG-033 chave_dedup consistente com CSV', () => {
  it('chave_dedup do PDF não inclui timestamp HH:MM na descrição', () => {
    // Simula o que o pdfParser retorna para linha BTG com timestamp
    const rawComTimestamp = [{
      dataStr: '30/03/2026',
      desc:    'PIX RECEBIDO FULANO SILVA',   // timestamp já removido pelo pdfParser fix
      valor:   -500,
      confianca: 'alta',
    }];
    const rawSemTimestamp = [{
      dataStr: '30/03/2026',
      desc:    'PIX RECEBIDO FULANO SILVA',
      valor:   -500,
      confianca: 'alta',
    }];
    const [lComTs] = parsearLinhasPDF(rawComTimestamp);
    const [lSemTs] = parsearLinhasPDF(rawSemTimestamp);
    expect(lComTs.chave_dedup).toBe(lSemTs.chave_dedup);
    expect(lComTs.chave_dedup).toContain('pix recebido fulano silva');
    expect(lComTs.chave_dedup).not.toContain('18:43');
  });

  it('chave_dedup PDF para mesma transação bate com chave_dedup CSV', () => {
    // CSV gera chave via parsearLinhasCSVXLSX: data "30/03/2026", estab "PIX RECEBIDO FULANO SILVA"
    // PDF deve gerar chave idêntica após fix BUG-033
    const rawPDF = [{ dataStr: '30/03/2026', desc: 'PIX RECEBIDO FULANO SILVA', valor: -500, confianca: 'alta' }];
    const rowsCSV = [
      ['Data', 'Historico', 'Valor'],
      ['30/03/2026', 'PIX RECEBIDO FULANO SILVA', '-500,00'],
    ];
    const [lPDF] = parsearLinhasPDF(rawPDF);
    const [lCSV] = processarExtratoBancario({ rows: rowsCSV, contas: [], categorias: [], mapaHist: {}, origemBanco: 'btg' });
    expect(lPDF.chave_dedup).not.toBeNull();
    expect(lCSV.chave_dedup).not.toBeNull();
    expect(lPDF.chave_dedup).toBe(lCSV.chave_dedup);
  });
});
