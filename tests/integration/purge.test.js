// ============================================================
// TESTES DE INTEGRAÇÃO — Purge / Exclusão em Massa
//
// Regressão crítica para BUG-020:
//   Antes do fix, `allow write` incluía isValidTransacao() que
//   acessa request.resource.data. Em operações de DELETE,
//   request.resource é null → regra lançava exceção → BLOCKED.
//
//   Fix: separar allow write em allow create + allow update +
//   allow delete. O allow delete não chama isValidTransacao().
//
// Estes testes garantem que o purge nunca volta a quebrar.
//
// Para rodar: npm run test:integration
// ============================================================

import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection, getDocs, query, where,
  deleteDoc, doc, writeBatch, getDoc,
} from 'firebase/firestore';
import { createTestEnv, seedGrupo, seedDespesa } from './setup/testEnv.js';

const GRUPO_ID   = 'grupo-teste-purge';
const MEMBRO_UID = 'user-admin';

let testEnv;

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
});

// ── BUG-020 — Regressão ───────────────────────────────────────

describe('BUG-020 — purgeGrupoCompleto não deve ser bloqueado pelas regras', () => {
  it('exclui todas as despesas do grupo em batch sem erro de permissão', async () => {
    // Cria 5 despesas
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      for (let i = 1; i <= 5; i++) {
        await seedDespesa(ctx.firestore(), GRUPO_ID, { descricao: `Despesa ${i}` });
      }
    });

    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();

    // Busca todas as despesas do grupo
    const q = query(collection(membroDb, 'despesas'), where('grupoId', '==', GRUPO_ID));
    const snap = await getDocs(q);
    expect(snap.size).toBe(5);

    // Deleta em batch (simula purgeGrupoCompleto)
    const batch = writeBatch(membroDb);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await assertSucceeds(batch.commit());

    // Confirma que ficou vazio
    const depois = await getDocs(q);
    expect(depois.size).toBe(0);
  });

  it('exclui todas as receitas do grupo em batch sem erro de permissão', async () => {
    // Seed: 3 receitas
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const { doc: d, setDoc: s } = await import('firebase/firestore');
      for (let i = 1; i <= 3; i++) {
        await s(d(ctx.firestore(), 'receitas', `receita-${i}`), {
          grupoId:    GRUPO_ID,
          valor:      1000 * i,
          descricao:  `Receita ${i}`,
          data:       '2026-03-01',
          responsavel: 'Teste',
        });
      }
    });

    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();

    const q = query(collection(membroDb, 'receitas'), where('grupoId', '==', GRUPO_ID));
    const snap = await getDocs(q);
    expect(snap.size).toBe(3);

    const batch = writeBatch(membroDb);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await assertSucceeds(batch.commit());

    const depois = await getDocs(q);
    expect(depois.size).toBe(0);
  });

  it('exclui categorias e orçamentos sem erro (purge completo)', async () => {
    // Seed: categoria + orçamento
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const { doc: d, setDoc: s } = await import('firebase/firestore');
      await s(d(ctx.firestore(), 'categorias', 'cat-1'), {
        grupoId: GRUPO_ID,
        nome:    'Alimentação',
        ativa:   true,
      });
      await s(d(ctx.firestore(), 'orcamentos', 'orc-1'), {
        grupoId:     GRUPO_ID,
        categoriaId: 'cat-1',
        valor:       800,
        mes:         3,
        ano:         2026,
      });
    });

    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();

    // Exclui categoria
    await assertSucceeds(deleteDoc(doc(membroDb, 'categorias', 'cat-1')));

    // Exclui orçamento
    await assertSucceeds(deleteDoc(doc(membroDb, 'orcamentos', 'orc-1')));

    // Confirma
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const cat = await getDoc(doc(ctx.firestore(), 'categorias', 'cat-1'));
      const orc = await getDoc(doc(ctx.firestore(), 'orcamentos', 'orc-1'));
      expect(cat.exists()).toBe(false);
      expect(orc.exists()).toBe(false);
    });
  });
});

// ── Exclusão individual (excluirDespesa / excluirReceita) ─────

describe('Exclusão individual — não deve ser bloqueada por isValidTransacao()', () => {
  it('exclui despesa individual sem passar por validação de schema', async () => {
    // A despesa NÃO tem campo `categoria` — schema incompleto
    // O allow delete NÃO deve validar schema, apenas membresia
    const id = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      return seedDespesa(ctx.firestore(), GRUPO_ID, {
        descricao: 'Despesa schema mínimo',
        // intencionalmente sem `categoria` e `responsavel`
      });
    });

    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    await assertSucceeds(deleteDoc(doc(membroDb, 'despesas', id)));
  });
});
