// ============================================================
// MODEL: Conta — Minhas Finanças
// NRF-004: Identificação da conta/banco de origem de cada transação.
// Contas são armazenadas em Firestore (coleção `contas`) e vinculadas
// a um grupo. Cada despesa/receita pode referenciar uma contaId.
//
// RF-062: Cartões de crédito como contas individuais.
// Quando `tipo === 'cartao'`, campos adicionais descrevem o cartão real:
// bandeira, emissor, ultimos4, diaFechamento, diaVencimento,
// contaPagadoraId, titularPadraoId, _legado.
// ============================================================

/**
 * Monta objeto Conta para salvar no Firestore.
 * @param {object} dados
 * @returns {object}
 */
export function modelConta(dados) {
  const base = {
    grupoId: dados.grupoId,
    nome:    String(dados.nome ?? '').trim(),
    emoji:   dados.emoji   ?? '🏦',
    cor:     dados.cor     ?? '#546E7A',
    tipo:    dados.tipo    ?? 'banco',   // 'banco' | 'cartao' | 'dinheiro'
    ativa:   dados.ativa   !== false,    // default true
  };

  // RF-068: campos de saldo para contas bancárias e dinheiro
  if (base.tipo !== 'cartao') {
    base.saldoInicial        = dados.saldoInicial != null ? Number(dados.saldoInicial) : 0;
    base.dataReferenciaSaldo = dados.dataReferenciaSaldo ?? null;
  }

  // RF-062: campos adicionais para cartões de crédito
  if (base.tipo === 'cartao') {
    if (dados.bandeira)        base.bandeira        = dados.bandeira;
    if (dados.emissor)         base.emissor          = dados.emissor;
    if (dados.ultimos4)        base.ultimos4         = dados.ultimos4;
    if (dados.diaFechamento)   base.diaFechamento    = Number(dados.diaFechamento);
    if (dados.diaVencimento)   base.diaVencimento    = Number(dados.diaVencimento);
    if (dados.contaPagadoraId) base.contaPagadoraId  = dados.contaPagadoraId;
    if (dados.titularPadraoId) base.titularPadraoId  = dados.titularPadraoId;
    if (dados._legado)         base._legado          = true;
  }

  return base;
}

/**
 * RF-062: Bandeiras de cartão suportadas.
 */
export const BANDEIRAS_CARTAO = ['visa', 'mastercard', 'elo', 'amex', 'hiper', 'outros'];

/**
 * NRF-004: Contas padrão criadas automaticamente para grupos novos.
 * RF-062: A conta genérica "Cartão de Crédito" foi REMOVIDA.
 * Cartões agora são criados individualmente pelo usuário.
 */
export const CONTAS_PADRAO = [
  { nome: 'Banco Itaú',        emoji: '🟠', cor: '#EC6600', tipo: 'banco'    },
  { nome: 'Banco Bradesco',    emoji: '🔴', cor: '#D32F2F', tipo: 'banco'    },
  { nome: 'Banco XP',          emoji: '📊', cor: '#1565C0', tipo: 'banco'    },
  { nome: 'Banco Santander',   emoji: '🔴', cor: '#CC0000', tipo: 'banco'    },
  { nome: 'Banco BTG',         emoji: '💼', cor: '#B8860B', tipo: 'banco'    },
  { nome: 'Nubank',            emoji: '💜', cor: '#820AD1', tipo: 'banco'    },
  { nome: 'Banco Inter',       emoji: '🟡', cor: '#FF6B00', tipo: 'banco'    },
  { nome: 'Caixa Econômica',   emoji: '🏛️', cor: '#003399', tipo: 'banco'    },
  { nome: 'Banco do Brasil',   emoji: '💛', cor: '#FFCC00', tipo: 'banco'    },
  { nome: 'Dinheiro',          emoji: '💵', cor: '#2E7D32', tipo: 'dinheiro' },
];
