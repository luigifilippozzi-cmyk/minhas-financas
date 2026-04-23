// ============================================================
// Testes — receitas-dashboard.js controller
// Cobre: renderizarDashboardReceitas
//
// Estratégia: stub de document via vi.stubGlobal (mesma
// abordagem de dashboard.test.js). Valida cálculos de totais,
// saldo, HTML de grid e estado vazio.
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderizarDashboardReceitas } from '../../src/js/controllers/receitas-dashboard.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function criarElemento() {
  return { innerHTML: '', textContent: '', className: '', style: {} };
}

function criarDocStub() {
  const els = {
    'rec-total':    criarElemento(),
    'rec-saldo':    criarElemento(),
    'receitas-grid': criarElemento(),
  };
  return {
    getElementById: (id) => els[id] ?? null,
    _els: els,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CAT_SALARIO  = { id: 'c1', nome: 'Salário',    emoji: '💰', cor: '#22c55e' };
const CAT_FREELA   = { id: 'c2', nome: 'Freelance',  emoji: '💻', cor: '#3b82f6' };

function receita(categoriaId, valor) {
  return { categoriaId, valor };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('renderizarDashboardReceitas', () => {
  let doc;

  beforeEach(() => {
    doc = criarDocStub();
    vi.stubGlobal('document', doc);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Totais e saldo ────────────────────────────────────────────────────────

  it('exibe total de receitas formatado', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 3000)], 0);
    expect(doc._els['rec-total'].textContent).toContain('3.000');
  });

  it('saldo positivo = totalReceitas - totalDespesas', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 5000)], 2000);
    expect(doc._els['rec-saldo'].textContent).toContain('3.000');
  });

  it('saldo negativo quando despesas superam receitas', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 1000)], 2000);
    expect(doc._els['rec-saldo'].textContent).toContain('1.000');
  });

  it('saldo zero quando receitas igualam despesas', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 1000)], 1000);
    expect(doc._els['rec-saldo'].textContent).toContain('0');
  });

  // ── Classes de saldo ──────────────────────────────────────────────────────

  it('aplica classe positivo quando saldo >= 0', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 3000)], 1000);
    expect(doc._els['rec-saldo'].className).toContain('rec-saldo--positivo');
  });

  it('aplica classe negativo quando saldo < 0', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 500)], 2000);
    expect(doc._els['rec-saldo'].className).toContain('rec-saldo--negativo');
  });

  // ── Estado vazio ──────────────────────────────────────────────────────────

  it('exibe empty-state quando não há categorias de receita', () => {
    renderizarDashboardReceitas([], [], 0);
    expect(doc._els['receitas-grid'].innerHTML).toContain('empty-state');
  });

  it('não renderiza HTML de card quando não há categorias', () => {
    renderizarDashboardReceitas([], [], 0);
    expect(doc._els['receitas-grid'].innerHTML).not.toContain('categoria-card');
  });

  it('retorna cedo quando grid não existe no DOM', () => {
    // Não deve lançar erro mesmo sem o elemento grid
    doc._els['receitas-grid'] = null;
    expect(() =>
      renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 1000)], 0)
    ).not.toThrow();
  });

  // ── Grid de categorias ────────────────────────────────────────────────────

  it('renderiza um card por categoria de receita', () => {
    renderizarDashboardReceitas([CAT_SALARIO, CAT_FREELA], [], 0);
    const html = doc._els['receitas-grid'].innerHTML;
    expect(html).toContain('Salário');
    expect(html).toContain('Freelance');
  });

  it('exibe total da categoria com receitas lançadas', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [receita('c1', 4500)], 0);
    const html = doc._els['receitas-grid'].innerHTML;
    expect(html).toContain('4.500');
  });

  it('exibe Sem lançamentos quando categoria não tem receitas', () => {
    renderizarDashboardReceitas([CAT_FREELA], [], 0);
    const html = doc._els['receitas-grid'].innerHTML;
    expect(html).toContain('Sem lançamentos');
  });

  it('exibe emoji da categoria', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [], 0);
    expect(doc._els['receitas-grid'].innerHTML).toContain('💰');
  });

  it('exibe percentual quando há receitas totais', () => {
    renderizarDashboardReceitas(
      [CAT_SALARIO, CAT_FREELA],
      [receita('c1', 4000), receita('c2', 1000)],
      0
    );
    const html = doc._els['receitas-grid'].innerHTML;
    expect(html).toContain('80%');   // 4000/5000
    expect(html).toContain('20%');   // 1000/5000
  });

  it('não exibe percentual quando total de receitas é zero', () => {
    renderizarDashboardReceitas([CAT_SALARIO], [], 0);
    const html = doc._els['receitas-grid'].innerHTML;
    // O span de percentual (font-size:.72rem) deve estar vazio
    expect(html).not.toMatch(/font-size:\.72rem;">\d+%/);
  });

  it('acumula receitas de múltiplos lançamentos na mesma categoria', () => {
    renderizarDashboardReceitas(
      [CAT_SALARIO],
      [receita('c1', 2000), receita('c1', 1500)],
      0
    );
    expect(doc._els['receitas-grid'].innerHTML).toContain('3.500');
  });

  it('totalReceitas considera todas as categorias', () => {
    // rec-total deve ser 5000 (4000 + 1000)
    renderizarDashboardReceitas(
      [CAT_SALARIO, CAT_FREELA],
      [receita('c1', 4000), receita('c2', 1000)],
      0
    );
    expect(doc._els['rec-total'].textContent).toContain('5.000');
  });

  it('ignora receitas de categorias não listadas em categoriasReceita', () => {
    // categoria 'c-outro' não está no array → não afeta o grid
    renderizarDashboardReceitas(
      [CAT_SALARIO],
      [receita('c1', 3000), receita('c-outro', 999)],
      0
    );
    const html = doc._els['receitas-grid'].innerHTML;
    expect(html).not.toContain('c-outro');
  });
});
