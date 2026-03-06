// ============================================================
// UTILITÁRIOS: Formatação — Minhas Finanças
// ============================================================

/**
 * Formata um número como moeda BRL.
 * @param {number} valor
 * @returns {string} Ex: "R$ 1.234,56"
 */
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor ?? 0);
}

/**
 * Formata uma data para exibição.
 * @param {Date|string|import('firebase/firestore').Timestamp} data
 * @returns {string} Ex: "15/03/2026"
 */
export function formatarData(data) {
  const d = data?.toDate ? data.toDate() : new Date(data);
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Retorna o nome do mês em português.
 * @param {number} mes — 1 a 12
 * @returns {string}
 */
export function nomeMes(mes) {
  const nomes = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return nomes[mes] ?? '';
}

/**
 * Formata percentual.
 * @param {number} valor
 * @returns {string} Ex: "75%"
 */
export function formatarPercentual(valor) {
  return `${Math.round(valor)}%`;
}
