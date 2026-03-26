// ============================================================
// MODEL: Receita — Minhas Finanças
// ============================================================

/**
 * Monta objeto Receita para salvar no Firestore.
 * @param {object} dados
 * @returns {object}
 */
export function modelReceita(dados) {
  const obj = {
    grupoId:     dados.grupoId,
    categoriaId: dados.categoriaId ?? '',
    usuarioId:   dados.usuarioId,
    descricao:   String(dados.descricao ?? '').trim(),
    valor:       Number(dados.valor),
    data:        dados.data instanceof Date ? dados.data : new Date(dados.data),
  };
  // Campos opcionais
  const opcionais = [
    'responsavel',
    'contaId',      // NRF-004
    'origem',       // NRF-006: 'importacao' | 'manual'
    'chave_dedup',  // NRF-006: deduplicação
    'importadoEm',  // NRF-006: timestamp de importação
  ];
  opcionais.forEach((k) => { if (dados[k] !== undefined) obj[k] = dados[k]; });
  return obj;
}

/** Categorias de receita criadas automaticamente para novos grupos */
export const CATEGORIAS_RECEITA_PADRAO = [
  { nome: 'Salário',           emoji: '💼', cor: '#2E7D32', tipo: 'receita' },
  { nome: 'Rendimentos',       emoji: '📈', cor: '#1565C0', tipo: 'receita' },
  { nome: 'Freelance',         emoji: '💻', cor: '#6A1B9A', tipo: 'receita' },
  { nome: 'Aluguel Recebido',  emoji: '🏠', cor: '#E65100', tipo: 'receita' },
  { nome: 'Outros',            emoji: '🎁', cor: '#546E7A', tipo: 'receita' },
];
