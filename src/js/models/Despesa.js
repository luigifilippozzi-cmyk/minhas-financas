// ============================================================
// MODEL: Despesa — Minhas Finanças
// ============================================================

/**
 * RF-014 — Monta objeto Despesa para salvar no Firestore.
 * Inclui campos opcionais de RF-014: responsavel, tipo, chave_dedup,
 * parcelamento_id, portador, parcela.
 * @param {object} dados
 * @returns {object}
 */
export function modelDespesa(dados) {
  const isConj = dados.isConjunta === true;
  const obj = {
    grupoId:      dados.grupoId,
    categoriaId:  dados.categoriaId ?? '',
    usuarioId:    dados.usuarioId,
    descricao:    String(dados.descricao ?? '').trim(),
    valor:        Number(dados.valor),
    data:         dados.data instanceof Date ? dados.data : new Date(dados.data),
    // NRF-001: sempre incluídos para evitar undefined em caches antigos do model
    isConjunta:   isConj,
    valorAlocado: isConj ? (dados.valorAlocado ?? Math.round(Number(dados.valor) * 100 / 2) / 100) : null,
  };
  // Campos opcionais: incluídos apenas se presentes
  const opcionais = [
    'origem', 'portador', 'parcela', 'responsavel',
    'tipo', 'chave_dedup', 'parcelamento_id', 'importadoEm', 'status',
    'contaId',      // NRF-004: conta/banco de origem
    'dataOriginal', // NRF-002.1: data original da compra (parceladas com data ajustada)
    'origemBanco',  // RF-021: banco/emissor detectado ('itau', 'nubank', ...)
    'contrapartidaId',         // RF-063: id da despesa/receita contraparte
    'membroDestinoId',         // RF-063: uid do membro destinatário
    'membroOrigemId',          // RF-063: uid do membro remetente
    'statusReconciliacao',     // RF-063: 'auto' | 'manual' | 'pendente_contraparte'
    'mesFaturaRelacionado',    // RF-063: hint visual para RF-064
    'contaCartaoIdRelacionado', // RF-063: hint visual para RF-064
    'mesFaturaQuitado',        // RF-064: "YYYY-MM" — ciclo de fatura que este pagamento quita
    'contaCartaoId',           // RF-064: conta cartão vinculada ao pagamento de fatura
    'statusReconciliacaoFatura', // RF-064: 'auto' | 'manual' | 'pendente' | 'ignorado' | 'parcial'
    'scoreFatura',             // RF-064: score 0–100 do match automático
    'valorFaturaTotal',        // RF-064: total do ciclo da fatura na época do pagamento
  ];
  opcionais.forEach((k) => { if (dados[k] !== undefined) obj[k] = dados[k]; });
  return obj;
}

/**
 * Cria um objeto Despesa com validação básica.
 * @param {object} dados
 * @returns {object}
 */
export function criarDespesa({ grupoId, categoriaId, usuarioId, descricao, valor, data }) {
  if (!grupoId)     throw new Error('grupoId é obrigatório');
  if (!categoriaId) throw new Error('categoriaId é obrigatório');
  if (!usuarioId)   throw new Error('usuarioId é obrigatório');
  if (!descricao?.trim()) throw new Error('Descrição é obrigatória');
  if (!valor || valor <= 0) throw new Error('Valor deve ser maior que zero');
  if (!data) throw new Error('Data é obrigatória');

  return {
    grupoId,
    categoriaId,
    usuarioId,
    descricao: descricao.trim(),
    valor: Number(valor),
    data: data instanceof Date ? data : new Date(data),
  };
}
