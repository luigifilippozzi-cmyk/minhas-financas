// ============================================================
// UTILITÁRIO: Detecção de Despesas Recorrentes — RF-060
// Analisa meses N-1 e N-2 para identificar despesas fixas/recorrentes.
// ============================================================

/**
 * Descrições genéricas que geram falsos positivos no matching.
 * São rebaixadas para confiança 'baixa' mesmo com match exato.
 */
const DESCRICOES_GENERICAS = new Set([
  'pix', 'pix enviado', 'pix recebido', 'transferencia', 'transferência',
  'ted', 'doc', 'debito', 'débito', 'credito', 'crédito',
  'pagamento', 'compra', 'saque', 'deposito', 'depósito',
]);

/**
 * Normaliza descrição para comparação: lowercase, trim, espaços únicos.
 * @param {string} desc
 * @returns {string}
 */
function normalizar(desc) {
  return String(desc ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calcula a variação percentual entre dois valores.
 * @param {number} a
 * @param {number} b
 * @returns {number} variação absoluta (0 a 1+)
 */
function variacaoPercentual(a, b) {
  if (a === 0 && b === 0) return 0;
  if (a === 0 || b === 0) return 1;
  return Math.abs(a - b) / Math.max(a, b);
}

/**
 * Agrupa despesas por chave (descricao normalizada + categoriaId).
 * @param {Array} despesas — despesas realizadas (tipo !== 'projecao')
 * @returns {Map<string, {descricao: string, categoriaId: string, valor: number, count: number}>}
 */
function agruparPorChave(despesas) {
  const mapa = new Map();
  for (const d of despesas) {
    if (d.tipo === 'projecao' || d.tipo === 'projecao_paga') continue;
    const descNorm = normalizar(d.descricao);
    if (!descNorm) continue;
    const chave = `${descNorm}||${d.categoriaId ?? ''}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        descricao: d.descricao,
        descricaoNorm: descNorm,
        categoriaId: d.categoriaId ?? '',
        valor: 0,
        count: 0,
      });
    }
    const entry = mapa.get(chave);
    entry.valor += d.valor ?? 0;
    entry.count += 1;
  }
  // Normaliza valor para média (caso tenha múltiplas ocorrências do mesmo tipo no mês)
  for (const [, entry] of mapa) {
    entry.valor = entry.valor / entry.count;
  }
  return mapa;
}

/**
 * Detecta despesas recorrentes comparando dois meses de histórico.
 *
 * @param {Array} despesasMesN1 — despesas realizadas do mês N-1
 * @param {Array} despesasMesN2 — despesas realizadas do mês N-2
 * @returns {Array<{
 *   descricao: string,
 *   categoriaId: string,
 *   valorEstimado: number,
 *   confianca: 'alta'|'media'|'baixa',
 *   origem: 'recorrente'
 * }>}
 */
export function detectarRecorrentes(despesasMesN1, despesasMesN2) {
  const mapaN1 = agruparPorChave(despesasMesN1);
  const mapaN2 = agruparPorChave(despesasMesN2);

  const resultado = [];

  for (const [chave, entryN1] of mapaN1) {
    const entryN2 = mapaN2.get(chave);
    const isGenerica = DESCRICOES_GENERICAS.has(entryN1.descricaoNorm);

    if (entryN2) {
      // Aparece em ambos os meses — recorrente
      const variacao = variacaoPercentual(entryN1.valor, entryN2.valor);

      let confianca;
      if (isGenerica) {
        confianca = 'baixa';
      } else if (variacao <= 0.05) {
        confianca = 'alta';
      } else if (variacao <= 0.15) {
        confianca = 'media';
      } else {
        confianca = 'baixa';
      }

      resultado.push({
        descricao: entryN1.descricao,
        categoriaId: entryN1.categoriaId,
        valorEstimado: entryN1.valor, // usa o valor mais recente
        confianca,
        origem: 'recorrente',
      });
    }
  }

  // Ordena: alta > media > baixa, depois por valor desc
  const ordemConfianca = { alta: 0, media: 1, baixa: 2 };
  resultado.sort((a, b) =>
    ordemConfianca[a.confianca] - ordemConfianca[b.confianca]
    || b.valorEstimado - a.valorEstimado
  );

  return resultado;
}

/**
 * Filtra apenas recorrentes com confiança alta ou média (para auto-inclusão no plano).
 * @param {Array} recorrentes — resultado de detectarRecorrentes()
 * @returns {Array}
 */
export function filtrarAutoInclusao(recorrentes) {
  return recorrentes.filter(r => r.confianca === 'alta' || r.confianca === 'media');
}
