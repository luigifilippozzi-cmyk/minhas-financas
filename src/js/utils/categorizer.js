// ============================================================
// RF-022: Categorizador Inteligente Sensível à Origem
//
// Sugere categorias para transações em três camadas:
//   1. Histórico com contexto de banco/emissor   (origin-aware)
//   2. Histórico global (sem contexto de banco)
//   3. Regras por palavras-chave (fallback estático)
//
// A chave de histórico com contexto é:
//   descricao_normalizada + '|' + origemBanco
//
// Para aprendizado, o campo origemBanco é salvo nas despesas/receitas
// importadas e indexado por buscarMapaCategorias() (database.js).
// ============================================================

/**
 * Sugere a categoria de uma transação.
 *
 * @param {string} estab       - Descrição/estabelecimento da transação
 * @param {string} origem      - ID do banco (ex: 'itau', 'nubank', 'desconhecido')
 * @param {Array}  categorias  - Lista de categorias [{id, nome, emoji, tipo}]
 * @param {Object} mapaHist    - Mapa de histórico {chave: categoriaId}
 * @returns {string} categoriaId ou '' se não encontrado
 */
export function categorizarTransacao(estab, origem, categorias, mapaHist) {
  if (!estab || !categorias.length) return '';
  const chave = estab.toLowerCase().trim();

  // 1. Histórico com contexto de banco (RF-022)
  if (origem && origem !== 'desconhecido') {
    const chaveOrig = chave + '|' + origem;
    if (mapaHist[chaveOrig]) {
      const cat = categorias.find(c => c.id === mapaHist[chaveOrig]);
      if (cat) return cat.id;
    }
  }

  // 2. Histórico global
  if (mapaHist[chave]) {
    const cat = categorias.find(c => c.id === mapaHist[chave]);
    if (cat) return cat.id;
  }

  // 3. Regras por palavras-chave (fallback estático)
  return _regrasPorPalavraChave(estab, categorias);
}

// ── Regras por palavras-chave ─────────────────────────────────────────────

const REGRAS = [
  { keys: ['mercado','supermercado','pao','padaria','hortifruti','feira','lemon','sams','açougue','boutique do pao'], cat: 'alimentação' },
  { keys: ['restauran','rest ','lanche','burger','pizza','sushi','ifood','ifd*','acai','delivery','cafe ','coffee','bistrô'], cat: 'alimentação' },
  { keys: ['uber','99*','taxi','cabify','combustivel','gasolina','posto ','shell','ipiranga','estacion'], cat: 'transporte' },
  { keys: ['farmacia','drogaria','droga','raia','ultrafarma','panvel','medic','clinica','hospital','laborat','odonto','saude'], cat: 'saúde' },
  { keys: ['netflix','spotify','disney','amazon prime','hbo','youtube','globoplay','cinema','teatro','show','ingresso'], cat: 'lazer' },
  { keys: ['apple.com','google','icloud','microsoft','shopee','amazon','mercadolivre','aliexpress','temu','magazine'], cat: 'compras' },
  { keys: ['escola','faculdade','curso','educacao','educação','duolingo','udemy','coursera'], cat: 'educação' },
  { keys: ['luz','energia','agua','gás','gas','internet','telefone','tim ','vivo ','claro ','oi ','sabesp','cemig','enel','copel'], cat: 'moradia' },
  { keys: ['pet','cobasi','patagrife','petlove','findet','nutricar','vet'], cat: 'pets' },
  { keys: ['gympass','wellhub','academia','smartfit','bodytech','total pass'], cat: 'saúde' },
];

function _regrasPorPalavraChave(estab, categorias) {
  const e = estab.toLowerCase();
  for (const regra of REGRAS) {
    if (regra.keys.some(k => e.includes(k))) {
      const cat = categorias.find(c =>
        c.nome.toLowerCase().includes(regra.cat) || regra.cat.includes(c.nome.toLowerCase())
      );
      if (cat) return cat.id;
    }
  }
  return '';
}
