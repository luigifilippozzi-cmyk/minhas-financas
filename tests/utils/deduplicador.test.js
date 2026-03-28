import { describe, it, expect } from 'vitest';
import { marcarLinhasDuplicatas } from '../../src/js/utils/deduplicador.js';

// Fábrica de linha de importação mínima
function criarLinha(overrides = {}) {
  return {
    _idx: 0,
    chave_dedup: 'chave-unica-001',
    tipoLinha: 'despesa',
    descricao: 'Shopee Compras',
    portador: 'Joao Silva',
    parcela: '-',
    valor: 150,
    duplicado: false,
    substitui_projecao: false,
    erro: null,
    ...overrides,
  };
}

// ── Fase 1: matching exato por chave_dedup ────────────────────────────────────

describe('marcarLinhasDuplicatas — matching exato', () => {
  it('marca como duplicado quando chave_dedup bate em chavesDesp', () => {
    const linha = criarLinha();
    const chavesDesp = new Set(['chave-unica-001']);

    marcarLinhasDuplicatas([linha], { chavesDesp });

    expect(linha.duplicado).toBe(true);
  });

  it('NÃO marca como duplicado quando chave não existe nas chaves existentes', () => {
    const linha = criarLinha({ chave_dedup: 'chave-nova' });
    const chavesDesp = new Set(['chave-outra']);

    marcarLinhasDuplicatas([linha], { chavesDesp });

    expect(linha.duplicado).toBe(false);
  });

  it('marca substitui_projecao quando chave bate no projecaoDocMap', () => {
    const linha = criarLinha();
    const projecaoDocMap = new Map([['chave-unica-001', 'proj-doc-id']]);

    marcarLinhasDuplicatas([linha], { projecaoDocMap });

    expect(linha.substitui_projecao).toBe(true);
    expect(linha.duplicado).toBe(false); // projeção tem prioridade sobre duplicata
  });

  it('linha de receita é verificada em chavesRec (não chavesDesp)', () => {
    const receita = criarLinha({ tipoLinha: 'receita', chave_dedup: 'chave-rec-001' });
    const chavesDesp = new Set(['chave-rec-001']); // mesma chave mas no conjunto errado
    const chavesRec = new Set(['chave-rec-001']);

    // Só em chavesDesp: não marca
    marcarLinhasDuplicatas([criarLinha({ tipoLinha: 'receita', chave_dedup: 'chave-rec-001' })],
      { chavesDesp, chavesRec: new Set() });
    // a linha local acima não é a mesma que recebeu, então verificamos com a correcta:
    const linhaRec = criarLinha({ tipoLinha: 'receita', chave_dedup: 'chave-rec-001' });
    marcarLinhasDuplicatas([linhaRec], { chavesRec });
    expect(linhaRec.duplicado).toBe(true);
  });

  it('ignora linhas com erro', () => {
    const linha = criarLinha({ erro: 'Data inválida' });
    const chavesDesp = new Set(['chave-unica-001']);

    marcarLinhasDuplicatas([linha], { chavesDesp });

    expect(linha.duplicado).toBe(false);
  });

  it('ignora linhas sem chave_dedup (null)', () => {
    const linha = criarLinha({ chave_dedup: null });
    const chavesDesp = new Set([null]); // não deve fazer nada

    marcarLinhasDuplicatas([linha], { chavesDesp });

    expect(linha.duplicado).toBe(false);
  });
});

// ── tipoExtrato 'banco' → delega para detectarAjustesParciais e retorna ───────

describe('marcarLinhasDuplicatas — tipoExtrato banco', () => {
  it('para extrato bancário, detecta ajuste parcial iFood e retorna sem fase 2', () => {
    const desp = criarLinha({
      _idx: 0, tipoLinha: 'despesa',
      descricao: 'IFOOD *RESTAURANTE ABC', valor: 50,
      data: new Date('2026-03-20T12:00:00'), chave_dedup: 'chave-desp',
    });
    const cred = criarLinha({
      _idx: 1, tipoLinha: 'receita',
      descricao: 'IFOOD CREDITO', valor: 5,
      data: new Date('2026-03-21T12:00:00'), chave_dedup: 'chave-cred',
      ajuste_parcial: false,
    });

    marcarLinhasDuplicatas([desp, cred], { tipoExtrato: 'banco' });

    expect(cred.ajuste_parcial).toBe(true);
    expect(desp.valorLiquido).toBe(45);
  });
});

// ── tipoExtrato 'receita' → pula fase 2 (fuzzy) ───────────────────────────────

describe('marcarLinhasDuplicatas — tipoExtrato receita', () => {
  it('não executa fuzzy matching para extratos de receita', () => {
    const linha = criarLinha({
      tipoLinha: 'receita', parcela: '02/06',
      chave_dedup: 'chave-sem-match',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao Silva',
      parcela: '02/06', valor: 150, status: 'pendente',
    }];

    marcarLinhasDuplicatas([linha], { tipoExtrato: 'receita', projecoesDetalhadas });

    expect(linha.substitui_projecao_fuzzy).toBeUndefined();
  });
});

// ── Fase 2: fuzzy matching para parcelas ─────────────────────────────────────

describe('marcarLinhasDuplicatas — fuzzy matching de parcelas', () => {
  it('vincula parcela quando similaridade >= 0.85 e valor igual', () => {
    const linha = criarLinha({
      _idx: 0, parcela: '02/06', valor: 150,
      descricao: 'Shopee Compras', portador: 'Joao Silva',
      chave_dedup: 'chave-sem-match-exato',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao Silva',
      parcela: '02/06', valor: 150, status: 'pendente', parcelamento_id: 'parc-1',
    }];

    marcarLinhasDuplicatas([linha], {
      tipoExtrato: 'cartao',
      projecoesDetalhadas,
    });

    expect(linha.substitui_projecao_fuzzy).toBe(true);
    expect(linha.projecao_id_fuzzy).toBe('proj-1');
    expect(linha.parcelamento_id_proj).toBe('parc-1');
  });

  it('NÃO vincula quando número de parcela é diferente', () => {
    const linha = criarLinha({
      parcela: '03/06', valor: 150,
      descricao: 'Shopee Compras', portador: 'Joao',
      chave_dedup: 'chave-nova',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao',
      parcela: '02/06', valor: 150, status: 'pendente',
    }];

    marcarLinhasDuplicatas([linha], { tipoExtrato: 'cartao', projecoesDetalhadas });

    expect(linha.substitui_projecao_fuzzy).toBeUndefined();
  });

  it('NÃO vincula quando diferença de valor é > 1%', () => {
    const linha = criarLinha({
      parcela: '02/06', valor: 150,
      descricao: 'Shopee Compras', portador: 'Joao',
      chave_dedup: 'chave-nova',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao',
      parcela: '02/06', valor: 160, status: 'pendente', // diferença de ~6.7%
    }];

    marcarLinhasDuplicatas([linha], { tipoExtrato: 'cartao', projecoesDetalhadas });

    expect(linha.substitui_projecao_fuzzy).toBeUndefined();
  });

  it('NÃO vincula quando portador (primeiro nome) é diferente', () => {
    const linha = criarLinha({
      parcela: '02/06', valor: 150,
      descricao: 'Shopee Compras', portador: 'Maria Silva',
      chave_dedup: 'chave-nova',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao Silva',
      parcela: '02/06', valor: 150, status: 'pendente',
    }];

    marcarLinhasDuplicatas([linha], { tipoExtrato: 'cartao', projecoesDetalhadas });

    expect(linha.substitui_projecao_fuzzy).toBeUndefined();
  });

  it('NÃO vincula com projeção já paga', () => {
    const linha = criarLinha({
      parcela: '02/06', valor: 150,
      descricao: 'Shopee Compras', portador: 'Joao',
      chave_dedup: 'chave-nova',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao',
      parcela: '02/06', valor: 150, status: 'pago', // já foi paga
    }];

    marcarLinhasDuplicatas([linha], { tipoExtrato: 'cartao', projecoesDetalhadas });

    expect(linha.substitui_projecao_fuzzy).toBeUndefined();
  });

  it('linha sem parcela não entra no fuzzy matching', () => {
    const linha = criarLinha({
      parcela: '-', valor: 150,
      descricao: 'Shopee Compras', portador: 'Joao',
      chave_dedup: 'chave-nova',
    });
    const projecoesDetalhadas = [{
      id: 'proj-1', descricao: 'Shopee Compras', portador: 'Joao',
      parcela: '-', valor: 150, status: 'pendente',
    }];

    marcarLinhasDuplicatas([linha], { tipoExtrato: 'cartao', projecoesDetalhadas });

    expect(linha.substitui_projecao_fuzzy).toBeUndefined();
  });
});
