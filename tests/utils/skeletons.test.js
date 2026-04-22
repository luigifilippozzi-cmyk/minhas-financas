import { describe, it, expect } from 'vitest';
import {
  skeletonCards,
  skeletonTableRows,
  skeletonKpiValue,
  skeletonChart,
  skeletonPatrimonioItems,
  emptyStateHTML,
  errorStateHTML,
} from '../../src/js/utils/skeletons.js';

// ============================================================
// skeletons.test.js — 52 TCs
// Módulo: src/js/utils/skeletons.js
// Cobertura: skeletonCards, skeletonTableRows, skeletonKpiValue,
//            skeletonChart, skeletonPatrimonioItems, emptyStateHTML, errorStateHTML
// ============================================================

describe('skeletonCards', () => {
  it('retorna string vazia para count=0', () => {
    expect(skeletonCards(0)).toBe('');
  });

  it('gera 1 card com count=1', () => {
    const html = skeletonCards(1);
    const matches = html.match(/class="skeleton-item"/g);
    expect(matches).toHaveLength(1);
  });

  it('gera 5 cards com count=5 (default)', () => {
    const html = skeletonCards(5);
    const matches = html.match(/class="skeleton-item"/g);
    expect(matches).toHaveLength(5);
  });

  it('gera 10 cards com count=10', () => {
    const html = skeletonCards(10);
    const matches = html.match(/class="skeleton-item"/g);
    expect(matches).toHaveLength(10);
  });

  it('cada card contém skeleton-circle', () => {
    const html = skeletonCards(3);
    const matches = html.match(/class="skeleton skeleton-circle"/g);
    expect(matches).toHaveLength(3);
  });

  it('cada card contém skeleton-amount', () => {
    const html = skeletonCards(3);
    const matches = html.match(/class="skeleton skeleton-amount"/g);
    expect(matches).toHaveLength(3);
  });

  it('primeiro card usa largura 70%', () => {
    const html = skeletonCards(1);
    expect(html).toContain('width:70%');
  });

  it('itens têm aria-hidden para acessibilidade', () => {
    const html = skeletonCards(3);
    const matches = html.match(/aria-hidden="true"/g);
    expect(matches).toHaveLength(3);
  });

  it('cicla as 5 larguras corretamente', () => {
    const html = skeletonCards(5);
    expect(html).toContain('width:70%');
    expect(html).toContain('width:55%');
    expect(html).toContain('width:80%');
    expect(html).toContain('width:60%');
    expect(html).toContain('width:75%');
  });

  it('cicla larguras a partir do índice 5 (volta ao início)', () => {
    const html = skeletonCards(6);
    // 6º item → widths[0] = 70%
    const first70 = html.indexOf('width:70%');
    const second70 = html.indexOf('width:70%', first70 + 1);
    expect(second70).toBeGreaterThan(first70);
  });

  it('retorna string (não null/undefined)', () => {
    expect(typeof skeletonCards()).toBe('string');
  });
});

describe('skeletonTableRows', () => {
  it('retorna string vazia para count=0', () => {
    expect(skeletonTableRows(0)).toBe('');
  });

  it('gera 1 linha com count=1', () => {
    const html = skeletonTableRows(1, 3);
    const rows = html.match(/<tr\b/g);
    expect(rows).toHaveLength(1);
  });

  it('gera 6 linhas com defaults (count=6, cols=7)', () => {
    const html = skeletonTableRows();
    const rows = html.match(/<tr\b/g);
    expect(rows).toHaveLength(6);
  });

  it('linhas têm aria-hidden para acessibilidade', () => {
    const html = skeletonTableRows(3, 2);
    const matches = html.match(/aria-hidden="true"/g);
    expect(matches).toHaveLength(3);
  });

  it('cada linha fecha com </tr>', () => {
    const html = skeletonTableRows(3, 2);
    const rows = html.match(/<\/tr>/g);
    expect(rows).toHaveLength(3);
  });

  it('cada linha tem o número correto de colunas', () => {
    const html = skeletonTableRows(2, 4);
    const tds = html.match(/<td>/g);
    expect(tds).toHaveLength(8); // 2 rows × 4 cols
  });

  it('cada célula contém skeleton-line', () => {
    const html = skeletonTableRows(1, 3);
    const lines = html.match(/class="skeleton skeleton-line"/g);
    expect(lines).toHaveLength(3);
  });

  it('cada célula tem margin:0', () => {
    const html = skeletonTableRows(1, 2);
    const margins = html.match(/margin:0/g);
    expect(margins).toHaveLength(2);
  });

  it('retorna string para count=6 (default)', () => {
    expect(typeof skeletonTableRows()).toBe('string');
  });
});

describe('emptyStateHTML', () => {
  it('inclui o ícone passado', () => {
    const html = emptyStateHTML('📭', 'Nenhuma despesa', '');
    expect(html).toContain('📭');
  });

  it('inclui o título passado', () => {
    const html = emptyStateHTML('💡', 'Sem dados', '');
    expect(html).toContain('Sem dados');
  });

  it('inclui o hint quando fornecido', () => {
    const html = emptyStateHTML('📭', 'Vazio', 'Adicione uma despesa');
    expect(html).toContain('Adicione uma despesa');
    expect(html).toContain('empty-state__hint');
  });

  it('omite o bloco hint quando hint é vazio string', () => {
    const html = emptyStateHTML('📭', 'Vazio', '');
    expect(html).not.toContain('empty-state__hint');
  });

  it('omite o bloco hint quando hint não é fornecido', () => {
    const html = emptyStateHTML('📭', 'Vazio');
    expect(html).not.toContain('empty-state__hint');
  });

  it('contém classe empty-state', () => {
    const html = emptyStateHTML('🎉', 'OK');
    expect(html).toContain('class="empty-state"');
  });

  it('contém classe empty-state__title', () => {
    const html = emptyStateHTML('🎉', 'OK');
    expect(html).toContain('empty-state__title');
  });
});

describe('skeletonKpiValue', () => {
  it('retorna string', () => {
    expect(typeof skeletonKpiValue()).toBe('string');
  });

  it('contém classe skeleton-kpi', () => {
    expect(skeletonKpiValue()).toContain('skeleton-kpi');
  });

  it('usa largura padrão 90px', () => {
    expect(skeletonKpiValue()).toContain('width:90px');
  });

  it('aceita largura customizada', () => {
    expect(skeletonKpiValue('120px')).toContain('width:120px');
  });

  it('é um elemento inline (span)', () => {
    expect(skeletonKpiValue()).toContain('<span');
  });
});

describe('skeletonChart', () => {
  it('retorna string', () => {
    expect(typeof skeletonChart()).toBe('string');
  });

  it('contém classe skeleton-chart', () => {
    expect(skeletonChart()).toContain('skeleton-chart');
  });

  it('usa altura padrão 200px', () => {
    expect(skeletonChart()).toContain('height:200px');
  });

  it('aceita altura customizada', () => {
    expect(skeletonChart(120)).toContain('height:120px');
  });

  it('tem aria-hidden para acessibilidade', () => {
    expect(skeletonChart()).toContain('aria-hidden="true"');
  });
});

describe('skeletonPatrimonioItems', () => {
  it('retorna string', () => {
    expect(typeof skeletonPatrimonioItems()).toBe('string');
  });

  it('gera 3 itens com count=3 (default)', () => {
    const html = skeletonPatrimonioItems(3);
    const matches = html.match(/class="skeleton-patrimonio-item"/g);
    expect(matches).toHaveLength(3);
  });

  it('gera 1 item com count=1', () => {
    const html = skeletonPatrimonioItems(1);
    const matches = html.match(/class="skeleton-patrimonio-item"/g);
    expect(matches).toHaveLength(1);
  });

  it('retorna string vazia para count=0', () => {
    expect(skeletonPatrimonioItems(0)).toBe('');
  });

  it('cada item contém skeleton-patrimonio-info', () => {
    const html = skeletonPatrimonioItems(2);
    const matches = html.match(/skeleton-patrimonio-info/g);
    expect(matches).toHaveLength(2);
  });

  it('cada item contém skeleton-patrimonio-value', () => {
    const html = skeletonPatrimonioItems(2);
    const matches = html.match(/skeleton-patrimonio-value/g);
    expect(matches).toHaveLength(2);
  });

  it('cada item contém skeleton-line para a descrição', () => {
    const html = skeletonPatrimonioItems(2);
    const matches = html.match(/class="skeleton skeleton-line"/g);
    expect(matches).toHaveLength(2);
  });

  it('itens têm aria-hidden para acessibilidade', () => {
    const html = skeletonPatrimonioItems(2);
    const matches = html.match(/aria-hidden="true"/g);
    expect(matches).toHaveLength(2);
  });
});

describe('errorStateHTML', () => {
  it('inclui o título do erro', () => {
    const html = errorStateHTML('Erro ao carregar', 'Tente novamente');
    expect(html).toContain('Erro ao carregar');
  });

  it('inclui o hint do erro', () => {
    const html = errorStateHTML('Falha', 'Verifique sua conexão');
    expect(html).toContain('Verifique sua conexão');
  });

  it('contém classe error-state', () => {
    const html = errorStateHTML('Erro', 'Dica');
    expect(html).toContain('class="error-state"');
  });

  it('contém botão de retry', () => {
    const html = errorStateHTML('Erro', 'Dica');
    expect(html).toContain('error-retry');
    expect(html).toContain('Tentar novamente');
  });

  it('contém classe error-state__title', () => {
    const html = errorStateHTML('Título', 'Hint');
    expect(html).toContain('error-state__title');
  });

  it('contém classe error-state__hint', () => {
    const html = errorStateHTML('Título', 'Hint');
    expect(html).toContain('error-state__hint');
  });
});
