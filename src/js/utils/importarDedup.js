// ============================================================
// UTIL: Regras de deduplicação do fluxo de importação
// ============================================================

/**
 * Define quando a importação precisa carregar chaves de dedup da coleção de receitas.
 * Cartão pode conter estornos/créditos (tipoLinha='receita') no mesmo arquivo.
 * @param {string} tipoExtrato
 * @returns {boolean}
 */
export function deveCarregarChavesReceitas(tipoExtrato) {
  return tipoExtrato === 'banco' || tipoExtrato === 'receita' || tipoExtrato === 'cartao';
}

