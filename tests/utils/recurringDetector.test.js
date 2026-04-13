// ============================================================
// Testes — recurringDetector.js (RF-060)
// ============================================================
import { describe, it, expect } from 'vitest';
import { detectarRecorrentes, filtrarAutoInclusao } from '../../src/js/utils/recurringDetector.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkDespesa(descricao, valor, categoriaId = 'cat1', tipo = 'despesa') {
  return { descricao, valor, categoriaId, tipo };
}

// ── detectarRecorrentes ───────────────────────────────────────────────────────

describe('detectarRecorrentes — básico', () => {
  it('retorna vazio quando ambos os meses são vazios', () => {
    expect(detectarRecorrentes([], [])).toEqual([]);
  });

  it('retorna vazio quando N-1 está vazio', () => {
    expect(detectarRecorrentes([], [mkDespesa('Netflix', 39.9)])).toEqual([]);
  });

  it('retorna vazio quando despesa aparece só em N-1 (sem histórico N-2)', () => {
    const r = detectarRecorrentes([mkDespesa('Netflix', 39.9)], []);
    expect(r).toEqual([]);
  });

  it('detecta recorrente quando despesa aparece em N-1 e N-2', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Netflix', 39.9)],
      [mkDespesa('Netflix', 39.9)],
    );
    expect(r).toHaveLength(1);
    expect(r[0].descricao).toBe('Netflix');
    expect(r[0].valorEstimado).toBe(39.9);
    expect(r[0].origem).toBe('recorrente');
  });

  it('usa valor de N-1 como valorEstimado (mais recente)', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Spotify', 21.9)],
      [mkDespesa('Spotify', 19.9)],
    );
    expect(r[0].valorEstimado).toBe(21.9);
  });

  it('matching é case-insensitive e ignora espaços extras', () => {
    const r = detectarRecorrentes(
      [mkDespesa('  Netflix  ', 39.9)],
      [mkDespesa('netflix', 39.9)],
    );
    expect(r).toHaveLength(1);
  });

  it('exige mesma categoriaId para considerar recorrente', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Academia', 100, 'saude')],
      [mkDespesa('Academia', 100, 'lazer')],
    );
    expect(r).toHaveLength(0);
  });

  it('inclui categoriaId na saída', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Academia', 100, 'saude')],
      [mkDespesa('Academia', 100, 'saude')],
    );
    expect(r[0].categoriaId).toBe('saude');
  });
});

// ── Confiança ─────────────────────────────────────────────────────────────────

describe('detectarRecorrentes — confiança', () => {
  it('confiança alta quando variação ≤ 5%', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Aluguel', 1000)],
      [mkDespesa('Aluguel', 1000)],
    );
    expect(r[0].confianca).toBe('alta');
  });

  it('confiança alta para valor idêntico (variação 0%)', () => {
    const r = detectarRecorrentes(
      [mkDespesa('IPTU', 250)],
      [mkDespesa('IPTU', 250)],
    );
    expect(r[0].confianca).toBe('alta');
  });

  it('confiança alta quando variação é exatamente 5%', () => {
    // 100 vs 95: variacao = 5/100 = 0.05 → alta
    const r = detectarRecorrentes(
      [mkDespesa('Seguro', 100)],
      [mkDespesa('Seguro', 95)],
    );
    expect(r[0].confianca).toBe('alta');
  });

  it('confiança media quando variação está entre 5% e 15%', () => {
    // 100 vs 85: variacao = 15/100 = 0.15 → limite media
    const r = detectarRecorrentes(
      [mkDespesa('Plano', 100)],
      [mkDespesa('Plano', 87)],
    );
    expect(r[0].confianca).toBe('media');
  });

  it('confiança baixa quando variação > 15%', () => {
    // 100 vs 70: variacao = 30/100 = 0.3 → baixa
    const r = detectarRecorrentes(
      [mkDespesa('Luz', 100)],
      [mkDespesa('Luz', 70)],
    );
    expect(r[0].confianca).toBe('baixa');
  });

  it('confiança baixa para descrições genéricas mesmo com valor idêntico', () => {
    const genericas = ['pix', 'transferência', 'ted', 'debito', 'pagamento', 'compra'];
    for (const desc of genericas) {
      const r = detectarRecorrentes(
        [mkDespesa(desc, 500)],
        [mkDespesa(desc, 500)],
      );
      if (r.length > 0) {
        expect(r[0].confianca).toBe('baixa');
      }
    }
  });

  it('confiança baixa para "pix" mesmo com valor idêntico', () => {
    const r = detectarRecorrentes(
      [mkDespesa('pix', 200)],
      [mkDespesa('pix', 200)],
    );
    expect(r[0].confianca).toBe('baixa');
  });
});

// ── Projeções ignoradas ───────────────────────────────────────────────────────

describe('detectarRecorrentes — ignora projeções', () => {
  it('ignora tipo projecao em N-1', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Netflix', 39.9, 'cat1', 'projecao')],
      [mkDespesa('Netflix', 39.9)],
    );
    expect(r).toHaveLength(0);
  });

  it('ignora tipo projecao_paga em N-2', () => {
    const r = detectarRecorrentes(
      [mkDespesa('Netflix', 39.9)],
      [mkDespesa('Netflix', 39.9, 'cat1', 'projecao_paga')],
    );
    expect(r).toHaveLength(0);
  });

  it('ignora despesa com descrição vazia', () => {
    const r = detectarRecorrentes(
      [mkDespesa('', 100)],
      [mkDespesa('', 100)],
    );
    expect(r).toHaveLength(0);
  });
});

// ── Múltiplas ocorrências no mesmo mês ───────────────────────────────────────

describe('detectarRecorrentes — múltiplas ocorrências no mês', () => {
  it('normaliza valor para média quando há múltiplas ocorrências da mesma despesa no mês', () => {
    // 2 vezes 'Academia' em N-1: valor médio = (100 + 100) / 2 = 100
    const r = detectarRecorrentes(
      [mkDespesa('Academia', 100), mkDespesa('Academia', 100)],
      [mkDespesa('Academia', 100)],
    );
    expect(r[0].valorEstimado).toBe(100);
  });
});

// ── Ordenação ─────────────────────────────────────────────────────────────────

describe('detectarRecorrentes — ordenação', () => {
  it('ordena: alta antes de media antes de baixa', () => {
    const n1 = [
      mkDespesa('pix', 100),         // baixa (genérica)
      mkDespesa('Aluguel', 1000),    // alta
      mkDespesa('Luz', 100),         // baixa (variação alta)
      mkDespesa('Internet', 105),    // media
    ];
    const n2 = [
      mkDespesa('pix', 100),
      mkDespesa('Aluguel', 1000),
      mkDespesa('Luz', 70),
      mkDespesa('Internet', 98),     // ~7% de variação → media
    ];
    const r = detectarRecorrentes(n1, n2);
    const confiancas = r.map(x => x.confianca);
    const ordemIdx = { alta: 0, media: 1, baixa: 2 };
    for (let i = 0; i < confiancas.length - 1; i++) {
      expect(ordemIdx[confiancas[i]]).toBeLessThanOrEqual(ordemIdx[confiancas[i + 1]]);
    }
  });

  it('dentro da mesma confiança, ordena por valor descrescente', () => {
    const n1 = [
      mkDespesa('Aluguel', 1000),
      mkDespesa('IPTU', 500),
      mkDespesa('Condomínio', 800),
    ];
    const n2 = [
      mkDespesa('Aluguel', 1000),
      mkDespesa('IPTU', 500),
      mkDespesa('Condomínio', 800),
    ];
    const r = detectarRecorrentes(n1, n2);
    // Todos alta confiança → deve estar ordenado por valor desc
    expect(r[0].valorEstimado).toBeGreaterThanOrEqual(r[1].valorEstimado);
    expect(r[1].valorEstimado).toBeGreaterThanOrEqual(r[2].valorEstimado);
  });
});

// ── Valores e campos opcionais ────────────────────────────────────────────────

describe('detectarRecorrentes — campos opcionais', () => {
  it('trata categoriaId ausente (undefined) como string vazia', () => {
    // Ambas as despesas sem categoriaId → chave idêntica → detecta recorrente
    const n1 = [{ descricao: 'Netflix', valor: 39.9, tipo: 'despesa' }];
    const n2 = [{ descricao: 'Netflix', valor: 39.9, tipo: 'despesa' }];
    const r = detectarRecorrentes(n1, n2);
    expect(r).toHaveLength(1);
    expect(r[0].categoriaId).toBe('');
  });

  it('trata valor ausente (undefined) como zero', () => {
    const n1 = [{ descricao: 'Teste', categoriaId: 'cat1', tipo: 'despesa' }];
    const n2 = [{ descricao: 'Teste', categoriaId: 'cat1', tipo: 'despesa' }];
    const r = detectarRecorrentes(n1, n2);
    expect(r).toHaveLength(1);
    expect(r[0].valorEstimado).toBe(0);
  });

  it('trata descrição null como vazia (ignorada)', () => {
    const n1 = [{ descricao: null, valor: 100, categoriaId: 'cat1', tipo: 'despesa' }];
    const n2 = [{ descricao: null, valor: 100, categoriaId: 'cat1', tipo: 'despesa' }];
    const r = detectarRecorrentes(n1, n2);
    expect(r).toHaveLength(0);
  });

  it('variacaoPercentual com um valor zero e outro não-zero retorna 1 (baixa confiança)', () => {
    // a = 0, b = 100 → variação = 1 → baixa
    const r = detectarRecorrentes(
      [mkDespesa('ServicoX', 0, 'cat1')],
      [mkDespesa('ServicoX', 100, 'cat1')],
    );
    expect(r).toHaveLength(1);
    expect(r[0].confianca).toBe('baixa');
  });
});

// ── filtrarAutoInclusao ───────────────────────────────────────────────────────

describe('filtrarAutoInclusao', () => {
  it('retorna vazio para lista vazia', () => {
    expect(filtrarAutoInclusao([])).toEqual([]);
  });

  it('inclui confiança alta', () => {
    const lista = [{ confianca: 'alta', descricao: 'Netflix', valorEstimado: 39.9 }];
    expect(filtrarAutoInclusao(lista)).toHaveLength(1);
  });

  it('inclui confiança media', () => {
    const lista = [{ confianca: 'media', descricao: 'Internet', valorEstimado: 105 }];
    expect(filtrarAutoInclusao(lista)).toHaveLength(1);
  });

  it('exclui confiança baixa', () => {
    const lista = [{ confianca: 'baixa', descricao: 'pix', valorEstimado: 200 }];
    expect(filtrarAutoInclusao(lista)).toHaveLength(0);
  });

  it('filtra corretamente lista mista', () => {
    const lista = [
      { confianca: 'alta',  descricao: 'Aluguel', valorEstimado: 1000 },
      { confianca: 'baixa', descricao: 'pix',     valorEstimado: 200  },
      { confianca: 'media', descricao: 'Internet', valorEstimado: 105 },
    ];
    const r = filtrarAutoInclusao(lista);
    expect(r).toHaveLength(2);
    expect(r.map(x => x.descricao)).toContain('Aluguel');
    expect(r.map(x => x.descricao)).toContain('Internet');
    expect(r.map(x => x.descricao)).not.toContain('pix');
  });
});
