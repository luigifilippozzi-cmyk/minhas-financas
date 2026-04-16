// ============================================================
// Testes — dashboard.js controller (BUG-029)
// Valida que categorias de receita não aparecem no grid de despesas.
//
// Estratégia: mock de document via vi.stubGlobal.
// O controller usa document.getElementById para ler/escrever
// elementos DOM — o stub simula esse comportamento em node env.
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderizarDashboard } from '../../src/js/controllers/dashboard.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cria um elemento DOM mínimo com innerHTML e style. */
function criarElemento() {
  return { innerHTML: '', textContent: '', style: { display: '' } };
}

/**
 * Monta o stub de document com os elementos do dashboard.
 * Retorna o elemento grid (categorias-grid) para inspeção.
 */
function criarDocStub() {
  const els = {
    'categorias-grid':   criarElemento(),
    'card-meu-bolso':    criarElemento(),
    'card-familia':      criarElemento(),
    'total-orcado':      criarElemento(),
    'total-gasto':       criarElemento(),
    'total-disponivel':  criarElemento(),
    'total-meu-bolso':   criarElemento(),
    'total-familia':     criarElemento(),
    'rec-saldo':         criarElemento(),
  };
  return {
    getElementById: (id) => els[id] ?? null,
    _els: els,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CAT_ALIMENTACAO = { id: 'c1', nome: 'Alimentação', emoji: '🍔', tipo: 'despesa' };
const CAT_TRANSPORTE  = { id: 'c2', nome: 'Transporte',  emoji: '🚗', tipo: 'despesa' };
const CAT_REEMBOLSO   = { id: 'c3', nome: 'Reembolso Médico', emoji: '💊', tipo: 'receita' };
const CAT_SALARIO     = { id: 'c4', nome: 'Salário',     emoji: '💰', tipo: 'receita' };
const CAT_LEGACY      = { id: 'c5', nome: 'Mercado',     emoji: '🛒' }; // sem campo tipo

function despesa(categoriaId, valor, extra = {}) {
  return { categoriaId, valor, tipo: 'despesa', ...extra };
}

// ── Suite BUG-029 ─────────────────────────────────────────────────────────────

describe('renderizarDashboard — BUG-029: filtro de categorias por tipo', () => {
  let docStub;

  beforeEach(() => {
    docStub = criarDocStub();
    vi.stubGlobal('document', docStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('REGRESSÃO BUG-029: categorias de receita NÃO aparecem no categorias-grid', () => {
    const cats = [CAT_ALIMENTACAO, CAT_REEMBOLSO, CAT_SALARIO];
    renderizarDashboard(cats, [], [], '');
    const html = docStub._els['categorias-grid'].innerHTML;
    expect(html).toContain('Alimentação');
    expect(html).not.toContain('Reembolso Médico');
    expect(html).not.toContain('Salário');
  });

  it('categorias de despesa aparecem no grid', () => {
    const cats = [CAT_ALIMENTACAO, CAT_TRANSPORTE];
    renderizarDashboard(cats, [], [], '');
    const html = docStub._els['categorias-grid'].innerHTML;
    expect(html).toContain('Alimentação');
    expect(html).toContain('Transporte');
  });

  it('categoria legacy sem campo tipo é tratada como despesa (não filtrada)', () => {
    const cats = [CAT_LEGACY];
    renderizarDashboard(cats, [], [], '');
    const html = docStub._els['categorias-grid'].innerHTML;
    expect(html).toContain('Mercado');
  });

  it('mix: apenas categorias de despesa (+ legacy) renderizadas; receitas excluídas', () => {
    const cats = [CAT_ALIMENTACAO, CAT_TRANSPORTE, CAT_REEMBOLSO, CAT_LEGACY, CAT_SALARIO];
    renderizarDashboard(cats, [], [], '');
    const html = docStub._els['categorias-grid'].innerHTML;
    expect(html).toContain('Alimentação');
    expect(html).toContain('Transporte');
    expect(html).toContain('Mercado');
    expect(html).not.toContain('Reembolso Médico');
    expect(html).not.toContain('Salário');
  });

  it('grid exibe empty-state quando só há categorias de receita', () => {
    const cats = [CAT_REEMBOLSO, CAT_SALARIO];
    renderizarDashboard(cats, [], [], '');
    const html = docStub._els['categorias-grid'].innerHTML;
    expect(html).toContain('empty-state');
    expect(html).not.toContain('Reembolso');
    expect(html).not.toContain('Salário');
  });

  it('gastos de despesas são calculados corretamente mesmo com categorias de receita no array', () => {
    // Garante que a despesa de Alimentação (c1) é contabilizada no KPI
    const cats = [CAT_ALIMENTACAO, CAT_REEMBOLSO];
    const desps = [despesa('c1', 150), despesa('c3', 200)];
    renderizarDashboard(cats, desps, [], '');
    const html = docStub._els['categorias-grid'].innerHTML;
    // Alimentação com gasto R$ 150,00 deve aparecer
    expect(html).toContain('150');
    // Reembolso não deve aparecer no grid
    expect(html).not.toContain('Reembolso');
  });
});
