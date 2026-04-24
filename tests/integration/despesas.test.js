// ============================================================
// TESTES DE INTEGRAÇÃO — CRUD de Despesas
//
// Testa o ciclo completo de vida de uma despesa no Firestore:
// criação, leitura, atualização e exclusão, usando o emulador.
//
// Os testes passam pelas regras de segurança reais, garantindo
// que o fluxo completo funciona para um usuário autenticado.
//
// Para rodar: npm run test:integration
// ============================================================

import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, orderBy,
  writeBatch,
} from 'firebase/firestore';
import { createTestEnv, seedGrupo, seedDespesa } from './setup/testEnv.js';

const GRUPO_ID   = 'grupo-teste-crud';
const MEMBRO_UID = 'user-teste';

let testEnv;
let membroDb;

beforeAll(async () => {
  testEnv = await createTestEnv();
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedGrupo(ctx.firestore(), { grupoId: GRUPO_ID, users: [MEMBRO_UID] });
  });

  membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
});

// ── CREATE ───────────────────────────────────────────────────

describe('CREATE — salvar despesa', () => {
  it('salva despesa e retorna o documento com os dados corretos', async () => {
    const despesaId = 'despesa-nova';
    const despesa = {
      grupoId:     GRUPO_ID,
      valor:       89.90,
      descricao:   'Farmácia',
      categoria:   'Saúde',
      data:        '2026-03-20',
      responsavel: 'Teste',
    };

    await setDoc(doc(membroDb, 'despesas', despesaId), despesa);

    // Lê de volta via admin para confirmar persistência
    const snap = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return getDoc(doc(ctx.firestore(), 'despesas', despesaId));
    });

    expect(snap.exists()).toBe(true);
    expect(snap.data().valor).toBe(89.90);
    expect(snap.data().descricao).toBe('Farmácia');
    expect(snap.data().grupoId).toBe(GRUPO_ID);
  });

  it('salva despesa conjunta com isConjunta=true e valorAlocado=50%', async () => {
    const despesa = {
      grupoId:      GRUPO_ID,
      valor:        300.00,
      valorAlocado: 150.00,
      isConjunta:   true,
      descricao:    'Mercado Conjunto',
      data:         '2026-03-15',
      responsavel:  'Teste',
    };

    await setDoc(doc(membroDb, 'despesas', 'conjunta-01'), despesa);

    const snap = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return getDoc(doc(ctx.firestore(), 'despesas', 'conjunta-01'));
    });

    expect(snap.data().isConjunta).toBe(true);
    expect(snap.data().valorAlocado).toBe(150.00);
  });

  it('salva despesa com mesFatura para ciclo de faturamento (BUG-021 fix)', async () => {
    const despesa = {
      grupoId:    GRUPO_ID,
      valor:      500.00,
      descricao:  'Compra parcelada',
      data:       '2026-02-20',   // data da compra
      mesFatura:  '2026-03',      // mês em que cai na fatura
      responsavel: 'Teste',
    };

    await setDoc(doc(membroDb, 'despesas', 'despesa-mesfatura'), despesa);

    const snap = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return getDoc(doc(ctx.firestore(), 'despesas', 'despesa-mesfatura'));
    });

    expect(snap.data().mesFatura).toBe('2026-03');
    expect(snap.data().data).toBe('2026-02-20');
  });
});

// ── READ ─────────────────────────────────────────────────────

describe('READ — ler despesas', () => {
  it('lê despesas do grupo e retorna apenas as do mês correto', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await seedDespesa(ctx.firestore(), GRUPO_ID, { data: '2026-03-10', descricao: 'Março' });
      await seedDespesa(ctx.firestore(), GRUPO_ID, { data: '2026-02-10', descricao: 'Fevereiro' });
    });

    // Filtra por mês de março
    const q = query(
      collection(membroDb, 'despesas'),
      where('grupoId', '==', GRUPO_ID),
      where('data', '>=', '2026-03-01'),
      where('data', '<=', '2026-03-31'),
    );
    const snap = await getDocs(q);

    expect(snap.size).toBe(1);
    expect(snap.docs[0].data().descricao).toBe('Março');
  });

  it('lê documento individual pelo ID e retorna dados completos', async () => {
    const id = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return seedDespesa(ctx.firestore(), GRUPO_ID, { valor: 99.99, descricao: 'Leitura direta' });
    });

    const snap = await getDoc(doc(membroDb, 'despesas', id));

    expect(snap.exists()).toBe(true);
    expect(snap.data().valor).toBe(99.99);
  });
});

// ── UPDATE ────────────────────────────────────────────────────

describe('UPDATE — atualizar despesa', () => {
  it('atualiza campo valor e persiste corretamente', async () => {
    const id = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return seedDespesa(ctx.firestore(), GRUPO_ID, { valor: 100, descricao: 'Original' });
    });

    await updateDoc(doc(membroDb, 'despesas', id), { valor: 120, descricao: 'Atualizado' });

    const snap = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return getDoc(doc(ctx.firestore(), 'despesas', id));
    });

    expect(snap.data().valor).toBe(120);
    expect(snap.data().descricao).toBe('Atualizado');
  });

  it('atualiza mesFatura após importação (fix BUG-021)', async () => {
    const id = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return seedDespesa(ctx.firestore(), GRUPO_ID, { mesFatura: null });
    });

    await updateDoc(doc(membroDb, 'despesas', id), { mesFatura: '2026-03' });

    const snap = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return getDoc(doc(ctx.firestore(), 'despesas', id));
    });

    expect(snap.data().mesFatura).toBe('2026-03');
  });
});

// ── DELETE ────────────────────────────────────────────────────

describe('DELETE — excluir despesa', () => {
  it('exclui despesa individualmente e confirma remoção', async () => {
    const id = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return seedDespesa(ctx.firestore(), GRUPO_ID, { descricao: 'Para excluir' });
    });

    await deleteDoc(doc(membroDb, 'despesas', id));

    const snap = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return getDoc(doc(ctx.firestore(), 'despesas', id));
    });

    expect(snap.exists()).toBe(false);
  });

  it('exclui múltiplas despesas em batch (fluxo excluirEmMassa)', async () => {
    const ids = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const a = await seedDespesa(ctx.firestore(), GRUPO_ID, { descricao: 'Em massa 1' });
      const b = await seedDespesa(ctx.firestore(), GRUPO_ID, { descricao: 'Em massa 2' });
      const c = await seedDespesa(ctx.firestore(), GRUPO_ID, { descricao: 'Em massa 3' });
      return [a, b, c];
    });

    const adminDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    const batch = writeBatch(adminDb);
    for (const id of ids) {
      batch.delete(doc(adminDb, 'despesas', id));
    }
    await batch.commit();

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      for (const id of ids) {
        const snap = await getDoc(doc(ctx.firestore(), 'despesas', id));
        expect(snap.exists()).toBe(false);
      }
    });
  });
});
