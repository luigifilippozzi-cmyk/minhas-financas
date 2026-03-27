// ============================================================
// UTIL: Deduplicador — RF-013 Pipeline Unificado
// Marcação pura de duplicatas e reconciliações. Sem Firestore.
// ============================================================
import { normalizarStr, similaridade } from './helpers.js';
import { parsearParcela } from './normalizadorTransacoes.js';

// Marca duplicatas e reconciliações em `linhas` (mutação in-place).
// Mantém Firestore fora: o chamador fornece os conjuntos pré-buscados.
//
// params:
//   chavesDesp: Set<string>          — chaves de despesas existentes no Firestore
//   chavesRec: Set<string>           — chaves de receitas existentes no Firestore
//   projecaoDocMap: Map<string,string> — chave_dedup → docId das projeções
//   projecoesDetalhadas: Array       — projeções completas para fuzzy matching
//   tipoExtrato: string              — 'cartao'|'banco'|'receita'|'despesa'
export function marcarLinhasDuplicatas(linhas, {
  chavesDesp = new Set(),
  chavesRec = new Set(),
  projecaoDocMap = new Map(),
  projecoesDetalhadas = [],
  tipoExtrato = 'despesa',
}) {
  // Fase 1: matching exato por chave_dedup
  linhas.forEach((l) => {
    if (!l.chave_dedup || l.erro) return;
    const chavesRef = l.tipoLinha === 'receita' ? chavesRec : chavesDesp;
    if (projecaoDocMap.has(l.chave_dedup) && l.tipoLinha !== 'receita') {
      l.substitui_projecao = true;
      l.duplicado = false;
    } else if (chavesRef.has(l.chave_dedup)) {
      l.duplicado = true;
    }
  });

  // NRF-002 — Fase 2: fuzzy matching (apenas para cartão/despesas com parcelas)
  if (tipoExtrato === 'banco' || tipoExtrato === 'receita') return;
  linhas.forEach((l) => {
    if (l.duplicado || l.substitui_projecao || l.erro) return;
    const info = parsearParcela(l.parcela);
    if (!info) return;  // só parceladas
    const estabL = normalizarStr(l.descricao);
    const portL  = normalizarStr(l.portador ?? '');
    let melhorSim  = 0;
    let melhorProj = null;
    for (const proj of projecoesDetalhadas) {
      if (proj.status === 'pago' || proj.tipo === 'projecao_paga') continue;
      const infoProj = parsearParcela(proj.parcela);
      if (!infoProj) continue;
      if (infoProj.atual !== info.atual || infoProj.total !== info.total) continue;
      // Portador: exige match parcial pelo primeiro nome
      if (l.portador && proj.portador) {
        const portP     = normalizarStr(proj.portador);
        const primeiroL = portL.split(' ')[0];
        const primeiroP = portP.split(' ')[0];
        if (primeiroL && primeiroP && primeiroL !== primeiroP) continue;
      }
      // Valor: ±1% ou ±R$ 0,50
      const diff    = Math.abs((proj.valor ?? 0) - l.valor);
      const pctDiff = l.valor > 0 ? diff / l.valor : 1;
      if (pctDiff > 0.01 && diff > 0.50) continue;
      // Estabelecimento: similaridade Levenshtein >= 0.85
      const sim = similaridade(estabL, normalizarStr(proj.descricao ?? ''));
      if (sim >= 0.85 && sim > melhorSim) { melhorSim = sim; melhorProj = proj; }
    }
    if (melhorProj) {
      l.substitui_projecao_fuzzy = true;
      l.projecao_id_fuzzy        = melhorProj.id;
      l.projecao_sim             = Math.round(melhorSim * 100);
      l.parcelamento_id_proj     = melhorProj.parcelamento_id ?? null;
    }
  });
}
