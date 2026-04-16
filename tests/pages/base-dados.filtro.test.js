// ============================================================
// Testes — base-dados.js: lógica de filtro por categoria
//
// ENH-003: adiciona sentinela '__nao_categorizada__' ao filtro
// de categorias em base-dados.html, exibindo transações onde
// categoriaId é null, '' ou aponta para categoria inexistente.
//
// Estratégia: testa o predicado de filtragem de forma isolada —
// base-dados.js é um script de página sem exports, mas a lógica
// adicionada é pura (sem side effects DOM). O predicado está em
// aplicarFiltros(), linha ~382.
// ============================================================
import { describe, it, expect } from 'vitest';

// Replica exatamente o predicado da linha ~382 de base-dados.js:
//
//   if (cat === '__nao_categorizada__') {
//     if (t.categoriaId && _categorias.some(c => c.id === t.categoriaId)) return false;
//   } else if (cat && t.categoriaId !== cat) return false;
//
// Retorna true se a transação PASSA o filtro (deve aparecer na lista).
function passaFiltroCategoria(t, cat, categorias) {
  if (cat === '__nao_categorizada__') {
    if (t.categoriaId && categorias.some(c => c.id === t.categoriaId)) return false;
  } else if (cat && t.categoriaId !== cat) return false;
  return true;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const CAT_ALIMENTACAO = { id: 'cat-alimentacao', nome: 'Alimentação', tipo: 'despesa' };
const CAT_TRANSPORTE  = { id: 'cat-transporte',  nome: 'Transporte',  tipo: 'despesa' };
const CATEGORIAS = [CAT_ALIMENTACAO, CAT_TRANSPORTE];

const transacaoComCat      = { categoriaId: 'cat-alimentacao' };
const transacaoSemCatId    = { categoriaId: '' };
const transacaoNullCatId   = { categoriaId: null };
const transacaoUndefCatId  = {};
const transacaoIdInvalido  = { categoriaId: 'cat-inexistente' };

// ── Filtro "Todas as categorias" (cat = '') ──────────────────────────────────

describe('aplicarFiltros — cat = "" (todas as categorias)', () => {
  it('passa qualquer transação quando filtro está vazio', () => {
    expect(passaFiltroCategoria(transacaoComCat,     '', CATEGORIAS)).toBe(true);
    expect(passaFiltroCategoria(transacaoSemCatId,   '', CATEGORIAS)).toBe(true);
    expect(passaFiltroCategoria(transacaoNullCatId,  '', CATEGORIAS)).toBe(true);
    expect(passaFiltroCategoria(transacaoIdInvalido, '', CATEGORIAS)).toBe(true);
  });
});

// ── Filtro por categoria específica ──────────────────────────────────────────

describe('aplicarFiltros — cat = ID específico', () => {
  it('passa transação com o mesmo categoriaId', () => {
    expect(passaFiltroCategoria(transacaoComCat, 'cat-alimentacao', CATEGORIAS)).toBe(true);
  });

  it('bloqueia transação com categoriaId diferente', () => {
    expect(passaFiltroCategoria(transacaoComCat, 'cat-transporte', CATEGORIAS)).toBe(false);
  });

  it('bloqueia transação sem categoriaId quando filtro está setado', () => {
    expect(passaFiltroCategoria(transacaoSemCatId,  'cat-alimentacao', CATEGORIAS)).toBe(false);
    expect(passaFiltroCategoria(transacaoNullCatId, 'cat-alimentacao', CATEGORIAS)).toBe(false);
  });
});

// ── ENH-003: Filtro "Não categorizada" ───────────────────────────────────────

describe('aplicarFiltros — cat = "__nao_categorizada__" (ENH-003)', () => {
  it('passa transação sem categoriaId (string vazia)', () => {
    expect(passaFiltroCategoria(transacaoSemCatId, '__nao_categorizada__', CATEGORIAS)).toBe(true);
  });

  it('passa transação com categoriaId null', () => {
    expect(passaFiltroCategoria(transacaoNullCatId, '__nao_categorizada__', CATEGORIAS)).toBe(true);
  });

  it('passa transação com categoriaId undefined', () => {
    expect(passaFiltroCategoria(transacaoUndefCatId, '__nao_categorizada__', CATEGORIAS)).toBe(true);
  });

  it('passa transação com categoriaId que não existe nas categorias ativas', () => {
    // categoriaId pode ser de uma categoria excluída ou nunca atribuída
    expect(passaFiltroCategoria(transacaoIdInvalido, '__nao_categorizada__', CATEGORIAS)).toBe(true);
  });

  it('bloqueia transação com categoriaId válido (categoria existe na lista)', () => {
    expect(passaFiltroCategoria(transacaoComCat, '__nao_categorizada__', CATEGORIAS)).toBe(false);
  });

  it('bloqueia transação com qualquer categoria válida da lista', () => {
    const transporte = { categoriaId: 'cat-transporte' };
    expect(passaFiltroCategoria(transporte, '__nao_categorizada__', CATEGORIAS)).toBe(false);
  });

  it('sem categorias cadastradas: toda transação com qualquer categoriaId passa (ID inválido)', () => {
    // Grupo sem categorias: todo categoriaId é tecnicamente inválido
    expect(passaFiltroCategoria(transacaoComCat, '__nao_categorizada__', [])).toBe(true);
  });
});

// ── Segregação de tipo: padrão de filtro para despesas.js (ENH-003 Part 2) ───

describe('ENH-003 Part 2: filtro de tipo em seletor de categorias (despesas.js)', () => {
  const cats = [
    { id: 'c1', nome: 'Alimentação',   tipo: 'despesa'  },
    { id: 'c2', nome: 'Salário',       tipo: 'receita'  },
    { id: 'c3', nome: 'Transporte',    tipo: 'despesa'  },
    { id: 'c4', nome: 'Sem tipo',      /* sem campo tipo */  },
    { id: 'c5', nome: 'Reembolso',     tipo: 'receita'  },
  ];

  // Predicado adicionado em despesas.js: .filter(c => !c.tipo || c.tipo === 'despesa')
  const despesas = cats.filter(c => !c.tipo || c.tipo === 'despesa');

  it('exclui categorias de receita dos seletores de despesa', () => {
    expect(despesas.find(c => c.tipo === 'receita')).toBeUndefined();
  });

  it('inclui categorias de despesa', () => {
    expect(despesas.some(c => c.id === 'c1')).toBe(true);
    expect(despesas.some(c => c.id === 'c3')).toBe(true);
  });

  it('inclui categorias legacy sem campo tipo (tratadas como despesa)', () => {
    expect(despesas.some(c => c.id === 'c4')).toBe(true);
  });

  it('lista filtrada tem exatamente despesas + legacy', () => {
    expect(despesas).toHaveLength(3); // c1, c3, c4
  });
});
