// ============================================================
// MODEL: Orcamento — Minhas Finanças
// ============================================================

/**
 * Retorna o status visual do orçamento com base no percentual gasto.
 * @param {number} valorGasto
 * @param {number} valorLimite
 * @returns {{ percentual: number, status: string, classe: string }}
 */
export function calcularStatusOrcamento(valorGasto, valorLimite) {
  if (!valorLimite || valorLimite === 0) {
    return { percentual: 0, status: 'sem-orcamento', classe: '' };
  }

  const percentual = (valorGasto / valorLimite) * 100;

  let status, classe;
  if (percentual <= 70) {
    status = 'ok';
    classe = 'ok';
  } else if (percentual <= 90) {
    status = 'warning';
    classe = 'warning';
  } else if (percentual <= 100) {
    status = 'danger';
    classe = 'danger';
  } else {
    status = 'critical';
    classe = 'critical';
  }

  return { percentual: Math.round(percentual), status, classe };
}
