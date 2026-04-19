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

// ── ENH-002: filtro de tipo — transferencia_interna ──────────────────────────

// Replica o predicado de tipo da aplicarFiltros() (base-dados.js):
//
//   if (tipo === 'transferencia_interna' && t.tipo !== 'transferencia_interna') return false;
//   else if (tipo === 'projecao' && t.tipo !== 'projecao') return false;
//   else if (tipo === 'receita' && t._tipo !== 'receita') return false;
//   else if (tipo === 'despesa' && (t._tipo !== 'despesa' || t.tipo === 'projecao'
//            || t.tipo === 'transferencia_interna')) return false;
function passaFiltroTipo(t, tipo) {
  if (tipo === 'todos') return true;
  if (tipo === 'transferencia_interna' && t.tipo !== 'transferencia_interna') return false;
  else if (tipo === 'projecao' && t.tipo !== 'projecao') return false;
  else if (tipo === 'receita' && t._tipo !== 'receita') return false;
  else if (tipo === 'despesa' && (t._tipo !== 'despesa' || t.tipo === 'projecao' || t.tipo === 'transferencia_interna')) return false;
  return true;
}

// Replica _tipoLabel() de base-dados.js
function tipoLabel(t) {
  if (t.tipo === 'transferencia_interna') return '🔁 Transferência';
  if (t.tipo === 'projecao') return '📆 Projeção';
  if (t._tipo === 'receita') return '📥 Receita';
  return '💸 Despesa';
}

// Replica _tipoClass() de base-dados.js
function tipoClass(t) {
  if (t.tipo === 'transferencia_interna') return 'ger-tipo-transf';
  if (t.tipo === 'projecao') return 'ger-tipo-projecao';
  if (t._tipo === 'receita') return 'ger-tipo-receita';
  return 'ger-tipo-despesa';
}

describe('ENH-002: aplicarFiltros — filtro por tipo transferencia_interna', () => {
  const transfDesp = { _tipo: 'despesa', tipo: 'transferencia_interna' };
  const transfRec  = { _tipo: 'receita', tipo: 'transferencia_interna' };
  const despNormal = { _tipo: 'despesa', tipo: 'despesa' };
  const recNormal  = { _tipo: 'receita' };
  const projecao   = { _tipo: 'despesa', tipo: 'projecao' };

  it('filtra apenas transferencias quando tipo = transferencia_interna', () => {
    expect(passaFiltroTipo(transfDesp, 'transferencia_interna')).toBe(true);
    expect(passaFiltroTipo(transfRec,  'transferencia_interna')).toBe(true);
  });

  it('exclui despesas e receitas normais do filtro transferencia_interna', () => {
    expect(passaFiltroTipo(despNormal, 'transferencia_interna')).toBe(false);
    expect(passaFiltroTipo(recNormal,  'transferencia_interna')).toBe(false);
  });

  it('exclui transferencias do filtro despesa', () => {
    expect(passaFiltroTipo(transfDesp, 'despesa')).toBe(false);
    expect(passaFiltroTipo(transfRec,  'despesa')).toBe(false);
  });

  it('inclui despesas normais no filtro despesa (sem transferencias ou projecoes)', () => {
    expect(passaFiltroTipo(despNormal, 'despesa')).toBe(true);
  });

  it('exclui projecoes do filtro despesa', () => {
    expect(passaFiltroTipo(projecao, 'despesa')).toBe(false);
  });

  it('tipo todos passa qualquer transacao', () => {
    expect(passaFiltroTipo(transfDesp, 'todos')).toBe(true);
    expect(passaFiltroTipo(despNormal, 'todos')).toBe(true);
    expect(passaFiltroTipo(recNormal,  'todos')).toBe(true);
  });
});

describe('ENH-002: _tipoLabel — rótulo correto por tipo', () => {
  it('transferencia_interna retorna rótulo de transferência', () => {
    expect(tipoLabel({ tipo: 'transferencia_interna', _tipo: 'despesa' })).toBe('🔁 Transferência');
    expect(tipoLabel({ tipo: 'transferencia_interna', _tipo: 'receita' })).toBe('🔁 Transferência');
  });
  it('projecao retorna rótulo de projeção', () => {
    expect(tipoLabel({ tipo: 'projecao', _tipo: 'despesa' })).toBe('📆 Projeção');
  });
  it('receita retorna rótulo de receita', () => {
    expect(tipoLabel({ _tipo: 'receita' })).toBe('📥 Receita');
  });
  it('despesa padrão retorna rótulo de despesa', () => {
    expect(tipoLabel({ _tipo: 'despesa', tipo: 'despesa' })).toBe('💸 Despesa');
  });
});

describe('ENH-002: _tipoClass — classe CSS correta por tipo', () => {
  it('transferencia_interna retorna ger-tipo-transf', () => {
    expect(tipoClass({ tipo: 'transferencia_interna' })).toBe('ger-tipo-transf');
  });
  it('projecao retorna ger-tipo-projecao', () => {
    expect(tipoClass({ tipo: 'projecao' })).toBe('ger-tipo-projecao');
  });
  it('receita retorna ger-tipo-receita', () => {
    expect(tipoClass({ _tipo: 'receita' })).toBe('ger-tipo-receita');
  });
  it('despesa normal retorna ger-tipo-despesa', () => {
    expect(tipoClass({ _tipo: 'despesa', tipo: 'despesa' })).toBe('ger-tipo-despesa');
  });
});
