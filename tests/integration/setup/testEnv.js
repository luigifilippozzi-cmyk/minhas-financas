// ============================================================
// HELPER COMPARTILHADO — Ambiente de Testes de Integração
//
// Fornece funções para criar/destruir o ambiente de testes
// apontado para o Firebase Emulator (Firestore na porta 8080).
//
// Pré-requisito: emulador rodando via `firebase emulators:start`
// ou automaticamente via `npm run test:integration`.
// ============================================================

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');

/**
 * Cria o RulesTestEnvironment apontado para o Firestore Emulator.
 * Lê as regras reais de firestore.rules para validá-las nos testes.
 *
 * @returns {Promise<import('@firebase/rules-unit-testing').RulesTestEnvironment>}
 */
export async function createTestEnv() {
  return initializeTestEnvironment({
    projectId: 'minhas-financas-test',
    firestore: {
      rules: readFileSync(resolve(ROOT, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

/**
 * Popula dados mínimos de seed: um grupo e N usuários membros.
 * Deve ser chamado dentro de `testEnv.withSecurityRulesDisabled()`,
 * pois contorna as regras de segurança (necessário para setup).
 *
 * @param {import('firebase/firestore').Firestore} db  - ctx.firestore()
 * @param {object} opts
 * @param {string} [opts.grupoId='grupo-test']
 * @param {string[]} [opts.users=['user-teste','user-ana']]
 */
export async function seedGrupo(db, {
  grupoId = 'grupo-test',
  users = ['user-teste', 'user-ana'],
} = {}) {
  const { doc, setDoc } = await import('firebase/firestore');

  await setDoc(doc(db, 'grupos', grupoId), {
    nome: 'Família Test',
    membros: users,
    maxMembros: 5,
    codigoConvite: 'TEST123',
  });

  for (const uid of users) {
    await setDoc(doc(db, 'usuarios', uid), {
      nome: uid,
      grupoId,
      email: `${uid}@test.com`,
    });
  }

  return { grupoId, users };
}

/**
 * Cria uma despesa de teste via admin (sem regras) e retorna o ID.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} grupoId
 * @param {object} [overrides] - campos extras ou sobrescritos
 * @returns {Promise<string>} ID do documento criado
 */
export async function seedDespesa(db, grupoId, overrides = {}) {
  const { doc, setDoc } = await import('firebase/firestore');

  const id = `despesa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const despesa = {
    grupoId,
    valor: 150.00,
    descricao: 'Supermercado',
    categoria: 'Alimentação',
    data: '2026-03-15',
    responsavel: 'Luigi',
    ...overrides,
  };

  await setDoc(doc(db, 'despesas', id), despesa);
  return id;
}
