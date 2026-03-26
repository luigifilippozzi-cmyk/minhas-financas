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

// ── RF-014: Deduplicação ──────────────────────────────────────

/**
 * Retorna um Set com todas as chave_dedup já gravadas no grupo (despesas).
 * Usado para detectar duplicatas no import.
 */
export async function buscarChavesDedup(grupoId) {
  const q    = query(collection(db, 'despesas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().chave_dedup).filter(Boolean));
}

/**
 * Retorna um Set com todas as chave_dedup já gravadas na coleção receitas.
 * Usado para detectar duplicatas no import de receitas.
 */
export async function buscarChavesDedupReceitas(grupoId) {
  const q    = query(collection(db, 'receitas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().chave_dedup).filter(Boolean));
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
      for (let i = 1; i < docs.length; i++) {
        await deleteDoc(docs[i].ref);
        deletadas++;
      }
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
  for (const [, docs] of grupos) {
    if (docs.length <= 1) continue;
    encontradas += docs.length - 1;
    if (!dryRun) {
      docs.sort((a, b) => {
        const ta = a.data().dataCriacao?.toMillis?.() ?? a.data().data?.toDate?.()?.getTime?.() ?? 0;
        const tb = b.data().dataCriacao?.toMillis?.() ?? b.data().data?.toDate?.()?.getTime?.() ?? 0;
        return ta - tb;
      });
      for (let i = 1; i < docs.length; i++) {
        await deleteDoc(docs[i].ref);
        deletadas++;
      }
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
    const { descricao, categoriaId } = d.data();
    if (descricao && categoriaId) {
      mapa[descricao.toLowerCase().trim()] = categoriaId;
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
    orderBy('data'),
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
    orderBy('data'),
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
    orderBy('data'),
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
    orderBy('data'),
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
