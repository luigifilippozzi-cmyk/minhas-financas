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

// ── RF-063: Filtro de movimentações reais ─────────────────────

/**
 * Retorna true se a despesa/receita representa uma movimentação financeira real
 * (não é projeção nem transferência interna entre membros do grupo).
 * Usar em todos os agregados de "gastos" e "receita" do mês.
 * @param {{ tipo?: string }} d
 * @returns {boolean}
 */
export function isMovimentacaoReal(d) {
  return d.tipo !== 'projecao'
      && d.tipo !== 'transferencia_interna';
  // RF-064 (futuro): && d.tipo !== 'pagamento_fatura'
}

// ── NRF-002: Fuzzy Matching ─────────────────────────────────

/**
 * Calcula a distância de Levenshtein entre duas strings.
 * Complexidade O(m × n) — adequado para nomes de estabelecimentos curtos.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  // Otimização: usa apenas duas linhas do DP
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Normaliza string para comparação fuzzy:
 * lowercase, remove acentos, compacta espaços, remove pontuação especial.
 * @param {string} str
 * @returns {string}
 */
export function normalizarStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove diacríticos
    .replace(/[^a-z0-9\s]/g, ' ')       // troca pontuação por espaço
    .replace(/\s+/g, ' ')               // compacta múltiplos espaços
    .trim();
}

/**
 * Retorna similaridade de 0 a 1 (1 = idênticas) entre duas strings,
 * usando distância de Levenshtein normalizada pelo comprimento máximo.
 * Threshold recomendado para reconciliação: ≥ 0.85
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function similaridade(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}
