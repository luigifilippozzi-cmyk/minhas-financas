// ============================================================
// UTILITÁRIOS: Helpers gerais — Minhas Finanças
// ============================================================

/**
 * Exibe ou oculta um elemento pelo ID.
 * @param {string} id
 * @param {boolean} visivel
 */
export function toggleVisibilidade(id, visivel) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', !visivel);
}

/**
 * Define o texto de um elemento pelo ID.
 * @param {string} id
 * @param {string} texto
 */
export function definirTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD (para inputs type="date").
 * @returns {string}
 */
export function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Retorna o mês e ano atuais.
 * @returns {{ mes: number, ano: number }}
 */
export function mesAnoAtual() {
  const now = new Date();
  return { mes: now.getMonth() + 1, ano: now.getFullYear() };
}

/**
 * Debounce: atrasa execução de uma função.
 * @param {function} fn
 * @param {number} delay ms
 * @returns {function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
