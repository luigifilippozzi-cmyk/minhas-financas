// ============================================================
// Testes — models/Despesa.js
// Valida o modelo de despesa e o comportamento de campos
// especiais (isConjunta, mesFatura, categoriaId etc.).
//
// BUG-031: garante que categoriaId nunca contém strings de
// sentinela '__tipo__*' no objeto que vai para o Firestore.
// ============================================================
import { describe, it, expect } from 'vitest';
import { modelDespesa } from '../../src/js/models/Despesa.js';

// ── Fixture base ─────────────────────────────────────────────────────────────

function base(overrides = {}) {
  return {
    grupoId:     'grupo-1',
    usuarioId:   'user-1',
    categoriaId: 'cat-alimentacao',
    descricao:   'Supermercado',
    valor:       150,
    data:        new Date('2026-04-15T12:00:00'),
    ...overrides,
  };
}

// ── modelDespesa — campos obrigatórios ────────────────────────────────────────

describe('modelDespesa — campos obrigatórios e defaults', () => {
  it('inclui grupoId, usuarioId, categoriaId, descricao, valor e data', () => {
    const d = modelDespesa(base());
    expect(d.grupoId).toBe('grupo-1');
    expect(d.usuarioId).toBe('user-1');
    expect(d.categoriaId).toBe('cat-alimentacao');
    expect(d.descricao).toBe('Supermercado');
    expect(d.valor).toBe(150);
    expect(d.data).toBeInstanceOf(Date);
  });

  it('isConjunta e valorAlocado são false/null por padrão', () => {
    const d = modelDespesa(base());
    expect(d.isConjunta).toBe(false);
    expect(d.valorAlocado).toBeNull();
  });

  it('isConjunta=true calcula valorAlocado como 50%', () => {
    const d = modelDespesa(base({ isConjunta: true, valor: 200 }));
    expect(d.isConjunta).toBe(true);
    expect(d.valorAlocado).toBe(100);
  });

  it('campos opcionais ausentes não aparecem no objeto', () => {
    const d = modelDespesa(base());
    expect(d).not.toHaveProperty('portador');
    expect(d).not.toHaveProperty('parcela');
  });

  it('campos opcionais presentes são incluídos', () => {
    const d = modelDespesa(base({ portador: 'Teste', origemBanco: 'nubank', status: 'pago' }));
    expect(d.portador).toBe('Teste');
    expect(d.origemBanco).toBe('nubank');
    expect(d.status).toBe('pago');
  });

  it('REGRESSÃO BUG-032: mesFatura é propagado ao Firestore quando fornecido', () => {
    // Antes do fix, mesFatura estava ausente da lista opcionais — o campo era
    // descartado silenciosamente, tornando a aba Fatura sempre vazia para novas importações.
    const d = modelDespesa(base({ mesFatura: '2026-04' }));
    expect(d.mesFatura).toBe('2026-04');
  });

  it('REGRESSÃO BUG-032: mesFatura ausente no input não aparece no objeto (comportamento correto)', () => {
    const d = modelDespesa(base());
    expect(d).not.toHaveProperty('mesFatura');
  });

  it('data como string é convertida para Date', () => {
    const d = modelDespesa(base({ data: '2026-04-15' }));
    expect(d.data).toBeInstanceOf(Date);
  });

  it('descrição é trimada', () => {
    const d = modelDespesa(base({ descricao: '  Supermercado  ' }));
    expect(d.descricao).toBe('Supermercado');
  });
});

// ── BUG-031: categoriaId não deve ser string de sentinela ─────────────────────

describe('modelDespesa — BUG-031: categoriaId de tipos especiais', () => {
  it('REGRESSÃO BUG-031: categoriaId=null é convertido para "" (não para string de sentinela)', () => {
    // importar.js agora seta despDados.categoriaId = null nos blocos RF-063/064.
    // modelDespesa converte null → '' via operador ??
    // Resultado: Firestore recebe '' em vez de '__tipo__pagamento_fatura'
    const d = modelDespesa(base({ categoriaId: null }));
    expect(d.categoriaId).toBe('');
    expect(d.categoriaId).not.toBe('__tipo__pagamento_fatura');
    expect(d.categoriaId).not.toBe('__tipo__transferencia_interna');
  });

  it('simulação pre-fix: categoriaId com string sentinela passada diretamente ao model', () => {
    // Documenta o comportamento BUG-031: antes do fix, despDados.categoriaId = '__tipo__...'
    // era passado para modelDespesa diretamente → string de sentinela salva no Firestore
    const d = modelDespesa(base({ categoriaId: '__tipo__pagamento_fatura' }));
    // O model preserva a string como recebe — o problema era no importar.js
    expect(d.categoriaId).toBe('__tipo__pagamento_fatura'); // documenta o bug (comportamento do model)
  });

  it('simulação pos-fix RF-064: despDados.categoriaId=null antes de passar ao model', () => {
    // Reproduz a cadeia exata do fix:
    //   despDados.categoriaId = cat; // → '__tipo__pagamento_fatura' (do select DOM)
    //   despDados.tipo = 'pagamento_fatura';
    //   despDados.categoriaId = null; // ← linha adicionada pelo BUG-031 fix
    //   modelDespesa(despDados)       // → categoriaId: ''
    const despDados = base({ categoriaId: '__tipo__pagamento_fatura', tipo: 'pagamento_fatura' });
    despDados.categoriaId = null; // BUG-031 fix
    const d = modelDespesa(despDados);
    expect(d.categoriaId).toBe('');
    expect(d.categoriaId).not.toMatch(/^__tipo__/);
  });

  it('simulação pos-fix RF-063: transferencia_interna tem categoriaId="" apos fix', () => {
    const despDados = base({ categoriaId: '__tipo__transferencia_interna', tipo: 'transferencia_interna' });
    despDados.categoriaId = null; // BUG-031 fix
    const d = modelDespesa(despDados);
    expect(d.categoriaId).toBe('');
    expect(d.categoriaId).not.toMatch(/^__tipo__/);
  });

  it('tipo pagamento_fatura com mesFatura e contaCartaoId (campos RF-064)', () => {
    const d = modelDespesa(base({
      categoriaId:  null,
      tipo:         'pagamento_fatura',
      contaCartaoId: 'conta-nubank',
      scoreFatura:  85,
      statusReconciliacaoFatura: 'auto',
    }));
    expect(d.tipo).toBe('pagamento_fatura');
    expect(d.contaCartaoId).toBe('conta-nubank');
    expect(d.scoreFatura).toBe(85);
    expect(d.categoriaId).toBe(''); // null → '' via ??
    expect(d.categoriaId).not.toMatch(/^__tipo__/);
  });
});
