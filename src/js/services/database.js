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
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';

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
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirCategorias] Erro no listener:', err); },
  );
}

export async function atualizarCategoria(categoriaId, dados) {
  return updateDoc(doc(db, 'categorias', categoriaId), dados);
}

export async function excluirCategoria(categoriaId) {
  return updateDoc(doc(db, 'categorias', categoriaId), { ativa: false });
}

/**
 * Remove todos os orçamentos associados a uma categoria excluída.
 * Chamado automaticamente por desativarCategoria().
 *
 * @param {string} grupoId
 * @param {string} categoriaId
 */
export async function excluirOrcamentosDaCategoria(grupoId, categoriaId) {
  const q = query(
    collection(db, 'orcamentos'),
    where('grupoId',     '==', grupoId),
    where('categoriaId', '==', categoriaId),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
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
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirDespesas] Erro no listener:', err); },
  );
}

export async function atualizarDespesa(despesaId, dados) {
  return updateDoc(doc(db, 'despesas', despesaId), dados);
}

// RF-064: retorna pagamentos de fatura de um cartão específico.
// pagamento_fatura tem contaId = conta bancária, não do cartão — query dedicada necessária.
export async function buscarPagamentosFaturaCartao(grupoId, contaCartaoId) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('tipo',    '==', 'pagamento_fatura'),
    orderBy('data',  'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.contaCartaoId === contaCartaoId);
}

// BUG-022: retorna despesas pelo campo mesFatura (ciclo de faturamento).
// Complementa ouvirDespesas (mês calendário) para cobrir transações com data fora do mês.
export function ouvirDespesasPorMesFatura(grupoId, mesFatura, callback) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('mesFatura', '==', mesFatura),
    orderBy('mesFatura', 'desc'),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirDespesasPorMesFatura] Erro:', err); },
  );
}

export async function excluirDespesa(despesaId) {
  return deleteDoc(doc(db, 'despesas', despesaId));
}

// ── Receitas ─────────────────────────────────────────────────

export async function criarReceita(dados) {
  return addDoc(collection(db, 'receitas'), {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

export function ouvirReceitas(grupoId, mes, ano, callback) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);
  const q = query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirReceitas] Erro no listener:', err); },
  );
}

export async function atualizarReceita(receitaId, dados) {
  return updateDoc(doc(db, 'receitas', receitaId), dados);
}

export async function excluirReceita(receitaId) {
  return deleteDoc(doc(db, 'receitas', receitaId));
}

export function ouvirCategoriasReceita(grupoId, callback) {
  const q = query(
    collection(db, 'categorias'),
    where('grupoId', '==', grupoId),
    where('tipo',    '==', 'receita'),
    where('ativa',   '==', true),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirCategoriasReceita] Erro no listener:', err); },
  );
}

/**
 * Migração: seta tipo='despesa' em categorias legado que não possuem o campo tipo.
 * Executa uma única vez por sessão; é idempotente.
 */
export async function migrarCategoriasLegado(grupoId) {
  const q = query(
    collection(db, 'categorias'),
    where('grupoId', '==', grupoId),
    where('ativa', '==', true),
  );
  const snap = await getDocs(q);
  const semTipo = snap.docs.filter((d) => !d.data().tipo);
  if (!semTipo.length) return;
  await Promise.all(semTipo.map((d) => updateDoc(d.ref, { tipo: 'despesa' })));
}

/**
 * Cria categorias de receita padrão caso o grupo ainda não tenha nenhuma.
 * Chamado ao iniciar o app para garantir que grupos existentes também recebam as categorias.
 */
export async function garantirCategoriasReceita(grupoId, categoriasPadrao) {
  const q    = query(collection(db, 'categorias'), where('grupoId', '==', grupoId), where('tipo', '==', 'receita'));
  const snap = await getDocs(q);
  if (!snap.empty) return; // já existem
  await Promise.all(categoriasPadrao.map((cat) =>
    addDoc(collection(db, 'categorias'), { ...cat, grupoId, ativa: true })
  ));
}

// ── NRF-004: Contas (Banco / Cartão) ─────────────────────────

/**
 * Cria uma nova conta no grupo.
 */
export async function criarConta(dados) {
  return addDoc(collection(db, 'contas'), {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

/**
 * Listener em tempo real de todas as contas ativas do grupo.
 */
export function ouvirContas(grupoId, callback) {
  const q = query(
    collection(db, 'contas'),
    where('grupoId', '==', grupoId),
    where('ativa',   '==', true),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirContas] Erro no listener:', err); },
  );
}

export async function atualizarConta(contaId, dados) {
  return updateDoc(doc(db, 'contas', contaId), dados);
}

export async function excluirConta(contaId) {
  return updateDoc(doc(db, 'contas', contaId), { ativa: false });
}

/**
 * RF-068: Listener em tempo real de despesas do grupo desde uma data de referência.
 * Usado para cálculo de saldo real por conta.
 * @param {string} grupoId
 * @param {Date}   dataReferencia — data mínima (inclusive)
 * @param {Function} callback — recebe array de despesas
 * @returns {Function} unsubscribe
 */
export function ouvirDespesasDesdeData(grupoId, dataReferencia, callback) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', dataReferencia),
    orderBy('data', 'desc'),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirDespesasDesdeData] Erro no listener:', err); },
  );
}

/**
 * RF-068: Listener em tempo real de receitas do grupo desde uma data de referência.
 * Usado para cálculo de saldo real por conta.
 * @param {string} grupoId
 * @param {Date}   dataReferencia — data mínima (inclusive)
 * @param {Function} callback — recebe array de receitas
 * @returns {Function} unsubscribe
 */
export function ouvirReceitasDesdeData(grupoId, dataReferencia, callback) {
  const q = query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', dataReferencia),
    orderBy('data', 'desc'),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirReceitasDesdeData] Erro no listener:', err); },
  );
}

/**
 * Garante que todas as contas padrão existam para o grupo (upsert por nome).
 * Novos bancos adicionados ao CONTAS_PADRAO serão inseridos automaticamente
 * mesmo em grupos que já possuem contas.
 * @param {string} grupoId
 * @param {Array}  contasPadrao  — importar de models/Conta.js
 */
export async function garantirContasPadrao(grupoId, contasPadrao) {
  const q    = query(collection(db, 'contas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  const existentes = new Set(snap.docs.map(d => d.data().nome?.toLowerCase().trim()));
  const faltando   = contasPadrao.filter(c => !existentes.has(c.nome.toLowerCase().trim()));
  if (!faltando.length) return;
  await Promise.all(faltando.map((c) =>
    addDoc(collection(db, 'contas'), { ...c, grupoId, ativa: true })
  ));
}

// ── RF-062: Migração de cartão genérico ──────────────────────────

/**
 * Migra a conta genérica "Cartão de Crédito" para _legado: true.
 * Idempotente: se já migrada, não faz nada.
 * @param {string} grupoId
 * @returns {Promise<string|null>} ID da conta migrada ou null se não existia
 */
export async function migrarCartaoGenerico(grupoId) {
  const q = query(
    collection(db, 'contas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'cartao'),
  );
  const snap = await getDocs(q);
  const legado = snap.docs.find(d => {
    const data = d.data();
    return data.nome?.toLowerCase().trim() === 'cartão de crédito' && !data._legado;
  });
  if (!legado) return null;
  await updateDoc(doc(db, 'contas', legado.id), { _legado: true });
  return legado.id;
}

/**
 * RF-062: Verifica se o grupo tem a conta genérica legado sem migrar.
 * @param {string} grupoId
 * @returns {Promise<boolean>}
 */
export async function temCartaoLegado(grupoId) {
  const q = query(
    collection(db, 'contas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'cartao'),
  );
  const snap = await getDocs(q);
  return snap.docs.some(d => d.data()._legado === true);
}

/**
 * RF-062: Verifica se o grupo já possui ao menos um cartão real (não-legado).
 * @param {string} grupoId
 * @returns {Promise<boolean>}
 */
export async function temCartaoReal(grupoId) {
  const q = query(
    collection(db, 'contas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'cartao'),
    where('ativa', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs.some(d => !d.data()._legado);
}

// ── RF-014: Deduplicação ──────────────────────────────────────

/**
 * Retorna um Map<chave_dedup, docId> com todas as despesas do grupo.
 * BUG-021: Map (em vez de Set) permite recuperar o docId para atualizar mesFatura em duplicatas.
 */
export async function buscarChavesDedup(grupoId) {
  const q    = query(collection(db, 'despesas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  return new Map(snap.docs.filter(d => d.data().chave_dedup).map(d => [d.data().chave_dedup, d.id]));
}

/**
 * Retorna um Map<chave_dedup, docId> com todas as receitas do grupo.
 * BUG-024: Map (em vez de Set) permite recuperar o docId para atualizar mesFatura em estornos duplicados.
 */
export async function buscarChavesDedupReceitas(grupoId) {
  const q    = query(collection(db, 'receitas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  return new Map(snap.docs.filter(d => d.data().chave_dedup).map(d => [d.data().chave_dedup, d.id]));
}

// ── NRF-008: Purga de Duplicatas ─────────────────────────────

/**
 * Gera chave simplificada para detecção de duplicatas: data + descrição + valor.
 * Independente do portador/parcela, apenas data+estabelecimento+valor.
 */
function _chaveSimplificada(dadosDoc) {
  const raw  = dadosDoc.data;
  const ts   = raw?.toDate ? raw.toDate() : (raw instanceof Date ? raw : new Date(raw));
  const dt   = isNaN(ts) ? '0000-00-00' : ts.toISOString().split('T')[0];
  const desc = String(dadosDoc.descricao ?? '').toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 60);
  const val  = parseFloat(dadosDoc.valor ?? 0).toFixed(2);
  return `${dt}||${desc}||${val}`;
}

/**
 * Purga (ou apenas analisa) duplicatas na coleção `despesas`.
 * Critério: mesma data + descrição + valor.
 * Mantém o documento mais antigo (por dataCriacao); deleta os demais.
 * @param {string}  grupoId
 * @param {boolean} [dryRun=false]  — true = só conta, não deleta
 * @returns {{ total: number, encontradas: number, deletadas: number }}
 */
export async function purgarDuplicatasDespesas(grupoId, dryRun = false) {
  const q    = query(collection(db, 'despesas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);

  const grupos = new Map();
  snap.docs.forEach((d) => {
    const chave = _chaveSimplificada(d.data());
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(d);
  });

  let encontradas = 0, deletadas = 0;
  // Bug 5: coleta todos os docs a deletar, depois usa writeBatch em lotes de 500
  const paraDeletear = [];
  for (const [, docs] of grupos) {
    if (docs.length <= 1) continue;
    encontradas += docs.length - 1;
    if (!dryRun) {
      // Mantém o mais antigo (menor dataCriacao ou data)
      docs.sort((a, b) => {
        const ta = a.data().dataCriacao?.toMillis?.() ?? a.data().data?.toDate?.()?.getTime?.() ?? 0;
        const tb = b.data().dataCriacao?.toMillis?.() ?? b.data().data?.toDate?.()?.getTime?.() ?? 0;
        return ta - tb;
      });
      for (let i = 1; i < docs.length; i++) paraDeletear.push(docs[i].ref);
    }
  }
  if (paraDeletear.length) {
    const BATCH = 500;
    for (let i = 0; i < paraDeletear.length; i += BATCH) {
      const batch = writeBatch(db);
      paraDeletear.slice(i, i + BATCH).forEach(ref => batch.delete(ref));
      await batch.commit();
      deletadas += Math.min(BATCH, paraDeletear.length - i);
    }
  }
  return { total: snap.docs.length, encontradas, deletadas };
}

/**
 * Purga (ou apenas analisa) duplicatas na coleção `receitas`.
 * Critério: mesma data + descrição + valor.
 * @param {string}  grupoId
 * @param {boolean} [dryRun=false]  — true = só conta, não deleta
 * @returns {{ total: number, encontradas: number, deletadas: number }}
 */
export async function purgarDuplicatasReceitas(grupoId, dryRun = false) {
  const q    = query(collection(db, 'receitas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);

  const grupos = new Map();
  snap.docs.forEach((d) => {
    const chave = _chaveSimplificada(d.data());
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(d);
  });

  let encontradas = 0, deletadas = 0;
  // Bug 5: coleta todos os docs a deletar, depois usa writeBatch em lotes de 500
  const paraDeletear = [];
  for (const [, docs] of grupos) {
    if (docs.length <= 1) continue;
    encontradas += docs.length - 1;
    if (!dryRun) {
      docs.sort((a, b) => {
        const ta = a.data().dataCriacao?.toMillis?.() ?? a.data().data?.toDate?.()?.getTime?.() ?? 0;
        const tb = b.data().dataCriacao?.toMillis?.() ?? b.data().data?.toDate?.()?.getTime?.() ?? 0;
        return ta - tb;
      });
      for (let i = 1; i < docs.length; i++) paraDeletear.push(docs[i].ref);
    }
  }
  if (paraDeletear.length) {
    const BATCH = 500;
    for (let i = 0; i < paraDeletear.length; i += BATCH) {
      const batch = writeBatch(db);
      paraDeletear.slice(i, i + BATCH).forEach(ref => batch.delete(ref));
      await batch.commit();
      deletadas += Math.min(BATCH, paraDeletear.length - i);
    }
  }
  return { total: snap.docs.length, encontradas, deletadas };
}

/**
 * RF-051: Retorna mapa de chave_dedup → docId para projeções (tipo='projecao').
 * Permite substituir uma projeção pela despesa real ao importar.
 */
export async function buscarMapaProjecoes(grupoId) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'projecao'),
  );
  const snap = await getDocs(q);
  const mapa = new Map();
  snap.docs.forEach((d) => {
    const chave = d.data().chave_dedup;
    if (chave) mapa.set(chave, d.id);
  });
  return mapa;
}

/**
 * RF-051: Retorna mapa descricaoLower → categoriaId de importações anteriores.
 * Melhora o auto-preenchimento de categoria para compras recorrentes/parceladas.
 */
export async function buscarMapaCategorias(grupoId) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('origem', '==', 'importacao'),
  );
  const snap = await getDocs(q);
  const mapa = {};
  snap.docs.forEach((d) => {
    const { descricao, categoriaId, origemBanco } = d.data();
    if (descricao && categoriaId) {
      const chave = descricao.toLowerCase().trim();
      mapa[chave] = categoriaId;
      // RF-022: índice origin-aware para categorização contextual
      if (origemBanco && origemBanco !== 'desconhecido') {
        mapa[chave + '|' + origemBanco] = categoriaId;
      }
    }
  });
  return mapa;
}

// ── RF-014: Parcelamentos em Aberto ───────────────────────────

/**
 * Listener em tempo real de todas as despesas com tipo='projecao'
 * do grupo (parcelas futuras geradas automaticamente no import).
 * Usa o índice (grupoId ASC, data DESC) já existente e filtra tipo='projecao'
 * client-side, evitando depender do índice composto (grupoId, tipo, data)
 * que pode ainda estar sendo construído no Firestore.
 */
export function ouvirParcelamentosAbertos(grupoId, callback) {
  const hoje = new Date();
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', hoje),
    orderBy('data', 'desc'),
  );
  return onSnapshot(q,
    (snap) => {
      const projecoes = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => d.tipo === 'projecao');
      callback(projecoes);
    },
    (err) => { console.error('[ouvirParcelamentosAbertos] Erro no listener:', err); },
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
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirOrcamentos] Erro no listener:', err); },
  );
}


// ── RF-017: Dashboard — consultas por período ─────────────────

/**
 * Busca despesas em um intervalo de datas (gráficos do dashboard).
 */
export async function buscarDespesasPeriodo(grupoId, inicio, fim) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Busca receitas em um intervalo de datas (gráficos do dashboard).
 */
export async function buscarReceitasPeriodo(grupoId, inicio, fim) {
  const q = query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Fluxo de Caixa: consultas anuais ─────────────────────────

export async function buscarDespesasAno(grupoId, ano) {
  const inicio = new Date(ano, 0, 1);
  const fim    = new Date(ano, 11, 31, 23, 59, 59);
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function buscarReceitasAno(grupoId, ano) {
  const inicio = new Date(ano, 0, 1);
  const fim    = new Date(ano, 11, 31, 23, 59, 59);
  const q = query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function buscarOrcamentosAno(grupoId, ano) {
  const q = query(
    collection(db, 'orcamentos'),
    where('grupoId', '==', grupoId),
    where('ano', '==', ano),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── RF-067: Forecast de Caixa — consultas mensais ──────────

/**
 * Busca despesas de um mês específico (para forecastEngine).
 * @param {string} grupoId
 * @param {number} ano
 * @param {number} mes — 1-based (1=Jan … 12=Dez)
 */
export async function buscarDespesasMes(grupoId, ano, mes) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Busca receitas de um mês específico (para forecastEngine).
 * @param {string} grupoId
 * @param {number} ano
 * @param {number} mes — 1-based (1=Jan … 12=Dez)
 */
export async function buscarReceitasMes(grupoId, ano, mes) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);
  const q = query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<=', fim),
    orderBy('data', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Busca projeções (tipo:'projecao') em range de mesFatura.
 * Filtragem por range feita no cliente para evitar índice composto adicional.
 * @param {string} grupoId
 * @param {string} mesInicio — 'YYYY-MM' inclusive
 * @param {string} mesFim    — 'YYYY-MM' inclusive
 */
export async function buscarProjecoesRange(grupoId, mesInicio, mesFim) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'projecao'),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((d) => {
      const mf = d.mesFatura ?? '';
      return mf >= mesInicio && mf <= mesFim;
    });
}

// ── NRF-002: Parcelamentos (coleção mestre) ─────────────────

/**
 * Cria um registro mestre de parcelamento na coleção 'parcelamentos'.
 * Dados: { grupoId, estabelecimento, valorTotal, totalParcelas,
 *           portador, usuarioId, dataOriginal }
 */
export async function criarParcelamento(dados) {
  return addDoc(collection(db, 'parcelamentos'), {
    ...dados,
    parcelasPagas: 0,
    status: 'ativo',        // 'ativo' | 'quitado'
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Listener em tempo real de todos os parcelamentos ativos do grupo.
 * Requer índice: (grupoId ASC, status ASC, criadoEm ASC).
 */
export function ouvirParcelamentos(grupoId, callback) {
  const q = query(
    collection(db, 'parcelamentos'),
    where('grupoId', '==', grupoId),
    where('status', '==', 'ativo'),
    orderBy('criadoEm', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('[ouvirParcelamentos] Erro no listener:', err);
  });
}

/**
 * Incrementa parcelasPagas de um parcelamento mestre.
 * Se parcelasPagas >= totalParcelas → status = 'quitado'.
 */
export async function reconciliarParcela(parcelamentoId, totalParcelas) {
  const ref = doc(db, 'parcelamentos', parcelamentoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const { parcelasPagas = 0 } = snap.data();
  const novoTotal = parcelasPagas + 1;
  return updateDoc(ref, {
    parcelasPagas: novoTotal,
    status: novoTotal >= totalParcelas ? 'quitado' : 'ativo',
    atualizadoEm: serverTimestamp(),
  });
}

// ── NRF-002: Fuzzy Matching de Projeções ───────────────────

/**
 * Retorna todas as projeções do grupo com dados completos.
 * Usado pelo algoritmo de fuzzy matching no processo de importação.
 * (Leitura única — não usa listener para evitar custo desnecessário.)
 */
export async function buscarProjecoesDetalhadas(grupoId) {
  const q = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'projecao'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Atualiza o status de uma parcela projetada: 'pendente' → 'pago'.
 * Também grava a referência para a despesa real que a substituiu.
 * @param {string} despesaId   – docId da projeção
 * @param {string} despesaRealId – docId da despesa real importada
 */
export async function atualizarStatusParcela(despesaId, despesaRealId) {
  return updateDoc(doc(db, 'despesas', despesaId), {
    status: 'pago',
    despesaRealId,
    pagaEm: serverTimestamp(),
    tipo: 'projecao_paga',   // distingue de projecoes pendentes nos listeners
  });
}

// ── RF-018: Base de Dados — Gerenciar / Limpeza ───────────────

/**
 * Busca todas as transações reais do grupo (despesas + receitas),
 * ordenadas por data descendente. Filtros opcionais aplicados client-side.
 * @param {string} grupoId
 * @returns {Promise<Array>}  Array de { id, _tipo:'despesa'|'receita', ...campos }
 */
export async function buscarTodasTransacoes(grupoId) {
  const [snapDesp, snapRec] = await Promise.all([
    getDocs(query(
      collection(db, 'despesas'),
      where('grupoId', '==', grupoId),
      orderBy('data', 'desc'),
    )),
    getDocs(query(
      collection(db, 'receitas'),
      where('grupoId', '==', grupoId),
      orderBy('data', 'desc'),
    )),
  ]);

  const despesas = snapDesp.docs.map(d => ({ id: d.id, _tipo: 'despesa',  ...d.data() }));
  const receitas = snapRec.docs.map(d => ({ id: d.id, _tipo: 'receita', ...d.data() }));

  // Merge e ordena por data desc
  return [...despesas, ...receitas].sort((a, b) => {
    const da    = a.data?.toDate?.() ?? new Date(a.data);
    const dateB = b.data?.toDate?.() ?? new Date(b.data);
    return dateB - da;
  });
}

// ── RF-025: Filtragem server-side, real-time e contagem ──────

/**
 * RF-025.1 + RF-025.3: Escuta transações (despesas + receitas) do grupo
 * filtradas por período (mês/ano) via server-side where clauses.
 * Retorna uma função unsubscribe que cancela AMBOS os listeners.
 */
export function ouvirTransacoesPeriodo(grupoId, mes, ano, callback) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 1);

  let despesas = [];
  let receitas = [];
  let despReady = false;
  let recReady  = false;

  function merge() {
    if (!despReady || !recReady) return;
    const merged = [...despesas, ...receitas].sort((a, b) => {
      const da = a.data?.toDate?.() ?? new Date(a.data);
      const db2 = b.data?.toDate?.() ?? new Date(b.data);
      return db2 - da;
    });
    callback(merged);
  }

  const qDesp = query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<', fim),
    orderBy('data', 'desc'),
  );
  const qRec = query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('data', '>=', inicio),
    where('data', '<', fim),
    orderBy('data', 'desc'),
  );

  const unsubDesp = onSnapshot(qDesp,
    (snap) => { despesas = snap.docs.map(d => ({ id: d.id, _tipo: 'despesa', ...d.data() })); despReady = true; merge(); },
    (err) => { console.error('[ouvirTransacoesPeriodo] despesas:', err); },
  );
  const unsubRec = onSnapshot(qRec,
    (snap) => { receitas = snap.docs.map(d => ({ id: d.id, _tipo: 'receita', ...d.data() })); recReady = true; merge(); },
    (err) => { console.error('[ouvirTransacoesPeriodo] receitas:', err); },
  );

  return () => { unsubDesp(); unsubRec(); };
}

/**
 * RF-025.2 + RF-025.5: Busca uma página de transações com cursor pagination.
 * Usado no modo "Carregar tudo" (sem filtro de período).
 * @param {string} grupoId
 * @param {{despesas?: DocumentSnapshot, receitas?: DocumentSnapshot}} cursores
 * @param {number} limite — docs por coleção por página (default 100, 200 total merged)
 * @returns {Promise<{dados: Array, proximosCursores: object, temMais: boolean}>}
 */
export async function buscarTransacoesPaginadas(grupoId, cursores = {}, limite = 100) {
  function buildQ(col, cursor) {
    const constraints = [
      where('grupoId', '==', grupoId),
      orderBy('data', 'desc'),
      limit(limite),
    ];
    if (cursor) constraints.push(startAfter(cursor));
    return query(collection(db, col), ...constraints);
  }

  const [snapDesp, snapRec] = await Promise.all([
    getDocs(buildQ('despesas', cursores.despesas ?? null)),
    getDocs(buildQ('receitas', cursores.receitas ?? null)),
  ]);

  const despesas = snapDesp.docs.map(d => ({ id: d.id, _tipo: 'despesa', ...d.data() }));
  const receitas = snapRec.docs.map(d => ({ id: d.id, _tipo: 'receita', ...d.data() }));

  const proximosCursores = {
    despesas: snapDesp.docs.length ? snapDesp.docs[snapDesp.docs.length - 1] : null,
    receitas: snapRec.docs.length ? snapRec.docs[snapRec.docs.length - 1] : null,
  };

  const temMais = snapDesp.docs.length === limite || snapRec.docs.length === limite;

  const dados = [...despesas, ...receitas].sort((a, b) => {
    const da = a.data?.toDate?.() ?? new Date(a.data);
    const db2 = b.data?.toDate?.() ?? new Date(b.data);
    return db2 - da;
  });

  return { dados, proximosCursores, temMais };
}

/**
 * RF-025.4: Conta transações do grupo (estimativa server-side, sem custo por doc).
 * Se mes/ano fornecidos, conta apenas aquele período.
 */
export async function contarTransacoesPeriodo(grupoId, mes = null, ano = null) {
  function buildConstraints(col) {
    const c = [where('grupoId', '==', grupoId)];
    if (mes && ano) {
      c.push(where('data', '>=', new Date(ano, mes - 1, 1)));
      c.push(where('data', '<', new Date(ano, mes, 1)));
    }
    return query(collection(db, col), ...c);
  }

  const [snapDesp, snapRec] = await Promise.all([
    getCountFromServer(buildConstraints('despesas')),
    getCountFromServer(buildConstraints('receitas')),
  ]);

  return snapDesp.data().count + snapRec.data().count;
}

/**
 * RF-023: Atualiza responsavel + portador em lote para uma lista de { id, colecao }.
 * Executa em batches de 500 (limite Firestore).
 * @param {Array<{id:string, colecao:string}>} items
 * @param {string} responsavel  — nome do membro válido do grupo
 */
export async function atualizarResponsavelEmMassa(items, responsavel) {
  const BATCH = 500;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = writeBatch(db);
    items.slice(i, i + BATCH).forEach(({ id, colecao }) => {
      batch.update(doc(db, colecao, id), { responsavel, portador: responsavel });
    });
    await batch.commit();
  }
}

/**
 * Exclui em lote uma lista de { id, colecao } em batches de 500.
 * @param {Array<{id:string, colecao:string}>} items
 */
export async function excluirEmMassa(items) {
  const BATCH = 500;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = writeBatch(db);
    items.slice(i, i + BATCH).forEach(({ id, colecao }) => batch.delete(doc(db, colecao, id)));
    await batch.commit();
  }
}

/**
 * Purga COMPLETA do grupo: apaga todas as despesas, receitas e parcelamentos.
 * NÃO remove categorias, orçamentos, contas, usuários ou o grupo em si.
 * Executa em batches de 500 para evitar timeout.
 * @param {string} grupoId
 * @returns {Promise<{despesas: number, receitas: number, parcelamentos: number}>}
 */
export async function purgeGrupoCompleto(grupoId) {
  const resultado = { despesas: 0, receitas: 0, parcelamentos: 0 };
  const colecoes  = ['despesas', 'receitas', 'parcelamentos'];

  for (const col of colecoes) {
    const snap = await getDocs(query(collection(db, col), where('grupoId', '==', grupoId)));
    const BATCH = 500;
    for (let i = 0; i < snap.docs.length; i += BATCH) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + BATCH).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    resultado[col] = snap.docs.length;
  }
  return resultado;
}

// ── RF-063: Transferências Internas ─────────────────────────

/**
 * Busca despesas e receitas pendentes de reconciliação de contraparte.
 * Retorna itens com statusReconciliacao === 'pendente_contraparte'.
 * @param {string} grupoId
 * @returns {Promise<{ despesas: Array, receitas: Array }>}
 */
export async function buscarTransferenciasPendentes(grupoId) {
  const despSnap = await getDocs(query(
    collection(db, 'despesas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'transferencia_interna'),
    where('statusReconciliacao', '==', 'pendente_contraparte'),
  ));
  const recSnap = await getDocs(query(
    collection(db, 'receitas'),
    where('grupoId', '==', grupoId),
    where('tipo', '==', 'transferencia_interna'),
    where('statusReconciliacao', '==', 'pendente_contraparte'),
  ));
  return {
    despesas: despSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    receitas: recSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  };
}

/**
 * Reconcilia pares de transferências internas pendentes.
 * Para cada despesa 'pendente_contraparte', busca receita correspondente
 * (mesmo valor, janela ±2 dias) e cross-linka via contrapartidaId.
 * @param {string} grupoId
 * @returns {Promise<number>} quantidade de pares reconciliados
 */
export async function reconciliarTransferenciasPendentes(grupoId) {
  const { despesas, receitas } = await buscarTransferenciasPendentes(grupoId);
  if (!despesas.length || !receitas.length) return 0;

  const JANELA_MS = 2 * 24 * 60 * 60 * 1000; // 2 dias
  const usados = new Set();
  const pares = [];

  for (const desp of despesas) {
    const dataDesp = desp.data?.toDate?.() ?? new Date(desp.data);
    for (const rec of receitas) {
      if (usados.has(rec.id)) continue;
      if (Math.abs((desp.valor ?? 0) - (rec.valor ?? 0)) > 0.01) continue;
      const dataRec = rec.data?.toDate?.() ?? new Date(rec.data);
      if (Math.abs(dataDesp - dataRec) > JANELA_MS) continue;
      // Par encontrado
      pares.push({ despId: desp.id, recId: rec.id });
      usados.add(rec.id);
      break;
    }
  }

  if (!pares.length) return 0;

  // Atualiza em batch
  const BATCH_SIZE = 250; // cada par usa 2 ops
  for (let i = 0; i < pares.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    pares.slice(i, i + BATCH_SIZE).forEach(({ despId, recId }) => {
      batch.update(doc(db, 'despesas', despId), {
        contrapartidaId: recId,
        statusReconciliacao: 'auto',
      });
      batch.update(doc(db, 'receitas', recId), {
        contrapartidaId: despId,
        statusReconciliacao: 'auto',
      });
    });
    await batch.commit();
  }
  return pares.length;
}

// ── Planejamento Mensal (RF-060) ────────────────────────────

/**
 * Verifica se já existe planejamento para grupoId/mes/ano.
 */
export async function existePlanejamento(grupoId, mes, ano) {
  const q = query(
    collection(db, 'planejamento_items'),
    where('grupoId', '==', grupoId),
    where('mes', '==', mes),
    where('ano', '==', ano),
    limit(1),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Listener real-time para itens de planejamento de um mês.
 */
export function ouvirPlanejamento(grupoId, mes, ano, callback) {
  const q = query(
    collection(db, 'planejamento_items'),
    where('grupoId', '==', grupoId),
    where('mes', '==', mes),
    where('ano', '==', ano),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Salva (cria ou atualiza) um item de planejamento.
 */
export async function salvarItemPlanejamento(dados) {
  if (dados.id) {
    const { id, ...rest } = dados;
    return updateDoc(doc(db, 'planejamento_items', id), rest);
  }
  return addDoc(collection(db, 'planejamento_items'), {
    ...dados,
    criadoEm: serverTimestamp(),
  });
}

/**
 * Salva múltiplos itens de planejamento em batch.
 */
export async function salvarItensPlanejamentoBatch(items) {
  const BATCH_SIZE = 500;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    items.slice(i, i + BATCH_SIZE).forEach((item) => {
      const ref = doc(collection(db, 'planejamento_items'));
      batch.set(ref, { ...item, criadoEm: serverTimestamp() });
    });
    await batch.commit();
  }
}

/**
 * Exclui um item de planejamento.
 */
export async function excluirItemPlanejamento(itemId) {
  return deleteDoc(doc(db, 'planejamento_items', itemId));
}

// ── RF-066: Patrimônio — Investimentos ───────────────────────

export async function criarInvestimento(dados) {
  return addDoc(collection(db, 'investimentos'), {
    ...dados,
    ativo: true,
    dataCriacao: serverTimestamp(),
  });
}

export function ouvirInvestimentos(grupoId, callback) {
  const q = query(
    collection(db, 'investimentos'),
    where('grupoId', '==', grupoId),
    where('ativo', '==', true),
    orderBy('dataCriacao', 'desc'),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirInvestimentos] Erro no listener:', err); },
  );
}

export async function atualizarInvestimento(investimentoId, dados) {
  return updateDoc(doc(db, 'investimentos', investimentoId), dados);
}

// NUNCA deletar investimentos — apenas arquivar (ativo: false)
export async function arquivarInvestimento(investimentoId) {
  return updateDoc(doc(db, 'investimentos', investimentoId), { ativo: false });
}

// ── RF-066: Patrimônio — Passivos Extrajudiciais ─────────────

export async function criarPassivoExtrajudicial(dados) {
  return addDoc(collection(db, 'passivos_extraju'), {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

export function ouvirPassivosExtrajudiciais(grupoId, callback) {
  const q = query(
    collection(db, 'passivos_extraju'),
    where('grupoId', '==', grupoId),
    orderBy('dataCriacao', 'desc'),
  );
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); },
    (err)  => { console.error('[ouvirPassivosExtrajudiciais] Erro no listener:', err); },
  );
}

export async function atualizarPassivoExtrajudicial(passivoId, dados) {
  return updateDoc(doc(db, 'passivos_extraju', passivoId), dados);
}

// ── RF-066: Patrimônio — Snapshot Mensal ─────────────────────

export async function salvarSnapshotPatrimonial(grupoId, mesAno, dados) {
  return setDoc(
    doc(db, 'patrimonio_historico', grupoId, mesAno, 'snapshot'),
    { ...dados, snapshotEm: serverTimestamp() },
    { merge: true },
  );
}

export async function buscarHistoricoPatrimonial(grupoId) {
  const colRef = collection(db, 'patrimonio_historico', grupoId);
  const snap   = await getDocs(colRef);
  const itens  = [];
  for (const mesDoc of snap.docs) {
    const snapshotSnap = await getDoc(doc(db, 'patrimonio_historico', grupoId, mesDoc.id, 'snapshot'));
    if (snapshotSnap.exists()) {
      itens.push({ mesAno: mesDoc.id, ...snapshotSnap.data() });
    }
  }
  return itens.sort((a, b) => a.mesAno.localeCompare(b.mesAno));
}
