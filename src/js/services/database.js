// ============================================================
// SERVIÇO DE BANCO DE DADOS (Firestore) — Minhas Finanças
// ============================================================

import { db } from '../config/firebase.js';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ── Usuários ─────────────────────────────────────────────────

export async function criarPerfil(userId, dados) {
  return setDoc(doc(db, 'usuarios', userId), {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

export async function buscarPerfil(userId) {
  const snap = await getDoc(doc(db, 'usuarios', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function atualizarPerfil(userId, dados) {
  return updateDoc(doc(db, 'usuarios', userId), dados);
}

// ── Grupos ───────────────────────────────────────────────────

export async function criarGrupo(dados) {
  return addDoc(collection(db, 'grupos'), {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

export async function buscarGrupo(grupoId) {
  const snap = await getDoc(doc(db, 'grupos', grupoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function buscarGrupoPorCodigo(codigo) {
  const q = query(collection(db, 'grupos'), where('codigoConvite', '==', codigo));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc_ = snap.docs[0];
  return { id: doc_.id, ...doc_.data() };
}

export async function atualizarGrupo(grupoId, dados) {
  return updateDoc(doc(db, 'grupos', grupoId), dados);
}

// ── Categorias ───────────────────────────────────────────────

export async function criarCategoria(dados) {
  return addDoc(collection(db, 'categorias'), dados);
}

export function ouvirCategorias(grupoId, callback) {
  const q = query(
    collection(db, 'categorias'),
    where('grupoId', '==', grupoId),
    where('ativa', '==', true),
  );
  return onSnapshot(q, (snap) => {
    const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(cats);
  });
}

export async function atualizarCategoria(categoriaId, dados) {
  return updateDoc(doc(db, 'categorias', categoriaId), dados);
}

export async function excluirCategoria(categoriaId) {
  return updateDoc(doc(db, 'categorias', categoriaId), { ativa: false });
}

// ── Despesas ─────────────────────────────────────────────────

export async function criarDespesa(dados) {
  return addDoc(collection(db, 'despesas'), {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

export function ouvirDespesas(grupoId, mes, ano, callback) {
  // Início e fim do mês para filtrar por data
  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);

  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const despesas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(despesas);
  });
}

export async function atualizarDespesa(despesaId, dados) {
  return updateDoc(doc(db, 'despesas', despesaId), dados);
}

export async function excluirDespesa(despesaId) {
  return deleteDoc(doc(db, 'despesas', despesaId));
}

// ── RF-014: Deduplicação ──────────────────────────────────────

/**
 * Retorna um Set com todas as chave_dedup já gravadas no grupo.
 * Usado para detectar duplicatas no import.
 */
export async function buscarChavesDedup(grupoId) {
  const q    = query(collection(db, 'despesas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().chave_dedup).filter(Boolean));
}

// ── RF-014: Parcelamentos em Aberto ───────────────────────────

/**
 * Listener em tempo real de todas as despesas com tipo='projecao'
 * do grupo (parcelas futuras geradas automaticamente no import).
 * Requer composite index: (grupoId ASC, tipo ASC, data ASC).
 */
export function ouvirParcelamentosAbertos(grupoId, callback) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'projecao'),
    orderBy('data', 'asc'),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

// ── Orçamentos ───────────────────────────────────────────────

export async function definirOrcamento(dados) {
  // Usa um ID composto para facilitar upsert (grupo+categoria+mes+ano)
  const id = `${dados.grupoId}_${dados.categoriaId}_${dados.ano}_${dados.mes}`;
  return setDoc(doc(db, 'orcamentos', id), dados, { merge: true });
}

/**
 * Busca orçamentos de um mês/ano específico (leitura única, sem listener).
 * Usado para copiar orçamentos do mês anterior.
 */
export async function buscarOrcamentos(grupoId, mes, ano) {
  const q = query(
    collection(db, 'orcamentos'),
    where('grupoId', '==', grupoId),
    where('mes', '==', mes),
    where('ano', '==', ano),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function ouvirOrcamentos(grupoId, mes, ano, callback) {
  const q = query(
    collection(db, 'orcamentos'),
    where('grupoId', '==', grupoId),
    where('mes', '==', mes),
    where('ano', '==', ano),
  );
  return onSnapshot(q, (snap) => {
    const orc = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(orc);
  });
}
