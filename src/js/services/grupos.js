// ============================================================
// SERVIÇO DE GRUPOS — RF-002
// Gerenciamento de Grupos Familiares
// ============================================================

import { db } from '../config/firebase.js';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { criarGrupo } from '../models/Grupo.js';
import { CATEGORIAS_PADRAO } from '../models/Categoria.js';

// ── Criar Grupo ───────────────────────────────────────────────

/**
 * Cria um novo grupo familiar e configura as categorias padrão.
 * Atualiza o perfil do usuário com o grupoId.
 *
 * @param {string} nomeGrupo    - Nome do grupo (ex: "Família Silva")
 * @param {string} userId       - UID do usuário criador
 * @param {string} nomeUsuario  - Nome do usuário para o mapa de membros
 * @returns {Promise<string>}   - ID do grupo criado
 */
export async function criarNovoGrupo(nomeGrupo, userId, nomeUsuario) {
  // 1. Cria o documento do grupo no Firestore
  const dadosGrupo = criarGrupo({ nome: nomeGrupo, userId, nomeUsuario });
  const grupoRef = await addDoc(collection(db, 'grupos'), {
    ...dadosGrupo,
    dataCriacao: serverTimestamp(),
  });

  // 2. Vincula o usuário ao grupo ANTES de criar categorias.
  //    Usa setDoc com merge para funcionar mesmo se o documento não existir
  //    (caso em que criarPerfil falhou em uma tentativa anterior de cadastro).
  await setDoc(doc(db, 'usuarios', userId), {
    grupoId:      grupoRef.id,
    nome:         nomeUsuario || '',
    criadoPor:    userId,
  }, { merge: true });

  // 3. Cria as 6 categorias padrão para este grupo (agora o usuário já é membro)
  const categoriasPromises = CATEGORIAS_PADRAO.map((cat) =>
    addDoc(collection(db, 'categorias'), {
      grupoId: grupoRef.id,
      nome: cat.nome,
      emoji: cat.emoji,
      cor: cat.cor,
      orcamentoMensal: 0,
      ativa: true,
    })
  );
  await Promise.all(categoriasPromises);

  return grupoRef.id;
}

// ── Entrar em Grupo ───────────────────────────────────────────

/**
 * Adiciona o usuário a um grupo existente usando o código de convite.
 *
 * @param {string} codigo       - Código de 6 caracteres do grupo
 * @param {string} userId       - UID do usuário que quer entrar
 * @param {string} nomeUsuario  - Nome do usuário para o mapa de membros
 * @returns {Promise<string>}   - ID do grupo encontrado
 * @throws {Error}              - Se código inválido ou grupo cheio
 */
export async function entrarNoGrupo(codigo, userId, nomeUsuario) {
  // 1. Busca o grupo pelo código de convite
  const q = query(
    collection(db, 'grupos'),
    where('codigoConvite', '==', codigo.toUpperCase().trim())
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Código inválido. Verifique o código e tente novamente.');
  }

  const grupoDoc = snap.docs[0];
  const grupo = grupoDoc.data();

  // 2. Verifica se já é membro
  if (grupo.membros.includes(userId)) {
    throw new Error('Você já faz parte deste grupo.');
  }

  // 3. Verifica limite de membros
  if (grupo.membros.length >= grupo.maxMembros) {
    throw new Error('Este grupo já está com o número máximo de membros.');
  }

  // 4. Adiciona o usuário ao grupo
  await updateDoc(doc(db, 'grupos', grupoDoc.id), {
    membros: arrayUnion(userId),
    [`nomesMembros.${userId}`]: nomeUsuario || 'Membro',
  });

  // 5. Vincula o usuário ao grupo (usa setDoc+merge para tolerar perfil inexistente)
  await setDoc(doc(db, 'usuarios', userId), {
    grupoId: grupoDoc.id,
    nome:    nomeUsuario || '',
  }, { merge: true });

  return grupoDoc.id;
}

// ── Buscar Grupo ──────────────────────────────────────────────

/**
 * Busca os dados de um grupo pelo ID.
 * @param {string} grupoId
 * @returns {Promise<Object|null>}
 */
export async function buscarGrupo(grupoId) {
  const snap = await getDoc(doc(db, 'grupos', grupoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
