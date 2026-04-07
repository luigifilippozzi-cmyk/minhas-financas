// ============================================================
// TESTES DE INTEGRAÇÃO — Regras de Segurança do Firestore
//
// Valida as regras de firestore.rules contra o emulador real.
// Cada teste verifica um cenário de autorização crítico.
//
// Para rodar: npm run test:integration
// ============================================================

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { createTestEnv, seedGrupo, seedDespesa } from './setup/testEnv.js';

const GRUPO_ID    = 'grupo-teste-rules';
const MEMBRO_UID  = 'user-teste';
const EXTERNO_UID = 'user-externo';

let testEnv;

beforeAll(async () => {
  testEnv = await createTestEnv();
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed: grupo + usuário membro
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedGrupo(ctx.firestore(), {
      grupoId: GRUPO_ID,
      users:   [MEMBRO_UID],
    });
    // Despesa pré-existente para testes de leitura/atualização/exclusão
    await seedDespesa(ctx.firestore(), GRUPO_ID, { _id: 'despesa-alvo' });
  });
});

// ── Autenticação ──────────────────────────────────────────────

describe('Acesso não autenticado', () => {
  it('deve BLOQUEAR leitura de despesas sem login', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    const q = query(collection(anonDb, 'despesas'), where('grupoId', '==', GRUPO_ID));
    await assertFails(getDocs(q));
  });

  it('deve BLOQUEAR criação de despesa sem login', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anonDb, 'despesas', 'nova'), {
        grupoId: GRUPO_ID,
        valor: 50,
        descricao: 'Teste',
      }),
    );
  });
});

// ── Isolamento entre grupos ───────────────────────────────────

describe('Isolamento de grupos', () => {
  it('deve BLOQUEAR usuário fora do grupo de ler despesas alheias', async () => {
    // EXTERNO_UID não tem documento em /usuarios, portanto isMemberOfGroup() falha
    const externoDb = testEnv.authenticatedContext(EXTERNO_UID).firestore();
    const q = query(collection(externoDb, 'despesas'), where('grupoId', '==', GRUPO_ID));
    await assertFails(getDocs(q));
  });

  it('deve BLOQUEAR usuário de outro grupo de excluir despesa alheia', async () => {
    // Cria um segundo grupo com o usuário externo
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await seedGrupo(ctx.firestore(), {
        grupoId: 'outro-grupo',
        users:   [EXTERNO_UID],
      });
    });

    const externoDb = testEnv.authenticatedContext(EXTERNO_UID).firestore();
    // Tenta excluir despesa do GRUPO_ID
    const ids = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDocs(collection(ctx.firestore(), 'despesas'));
      return snap.docs.map((d) => d.id);
    });

    await assertFails(deleteDoc(doc(externoDb, 'despesas', ids[0])));
  });
});

// ── Membro do grupo — operações permitidas ────────────────────

describe('Membro do grupo — operações permitidas', () => {
  it('deve PERMITIR leitura de despesas do próprio grupo', async () => {
    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    const q = query(collection(membroDb, 'despesas'), where('grupoId', '==', GRUPO_ID));
    await assertSucceeds(getDocs(q));
  });

  it('deve PERMITIR criar despesa com schema válido', async () => {
    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    await assertSucceeds(
      setDoc(doc(membroDb, 'despesas', 'nova-valida'), {
        grupoId:    GRUPO_ID,
        valor:      200.00,
        descricao:  'Farmácia',
        data:       '2026-03-20',
        responsavel: 'Luigi',
      }),
    );
  });

  it('deve BLOQUEAR criar despesa com valor inválido (zero)', async () => {
    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    await assertFails(
      setDoc(doc(membroDb, 'despesas', 'invalida-zero'), {
        grupoId: GRUPO_ID,
        valor:   0,           // isValidTransacao() requer valor > 0
        descricao: 'Teste',
      }),
    );
  });

  it('deve BLOQUEAR criar despesa sem grupoId', async () => {
    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    await assertFails(
      setDoc(doc(membroDb, 'despesas', 'invalida-sem-grupo'), {
        valor:    100,
        descricao: 'Sem grupo',
        // grupoId ausente — isValidTransacao() rejeita
      }),
    );
  });
});

// ── BUG-020 — Exclusão (regressão crítica) ────────────────────

describe('BUG-020 — delete não deve chamar isValidTransacao()', () => {
  it('deve PERMITIR membro excluir despesa (delete não valida request.resource)', async () => {
    // Antes do fix: allow write incluía isValidTransacao() → request.resource = null em delete → BLOCKED
    // Após o fix:   allow delete separado sem isValidTransacao()              → deve PASSAR
    const ids = await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDocs(collection(ctx.firestore(), 'despesas'));
      return snap.docs.map((d) => d.id);
    });

    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    await assertSucceeds(deleteDoc(doc(membroDb, 'despesas', ids[0])));
  });

  it('deve PERMITIR membro excluir receita (mesma correção aplicada)', async () => {
    // Seed: cria uma receita
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const { doc: d, setDoc: s } = await import('firebase/firestore');
      await s(d(ctx.firestore(), 'receitas', 'receita-alvo'), {
        grupoId:    GRUPO_ID,
        valor:      3000,
        descricao:  'Salário',
        data:       '2026-03-01',
        responsavel: 'Luigi',
      });
    });

    const membroDb = testEnv.authenticatedContext(MEMBRO_UID).firestore();
    await assertSucceeds(deleteDoc(doc(membroDb, 'receitas', 'receita-alvo')));
  });
});
