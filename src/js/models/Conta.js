// ============================================================
// MODEL: Conta — Minhas Finanças
// NRF-004: Identificação da conta/banco de origem de cada transação.
// Contas são armazenadas em Firestore (coleção `contas`) e vinculadas
// a um grupo. Cada despesa/receita pode referenciar uma contaId.
// ============================================================

/**
 * Monta objeto Conta para salvar no Firestore.
 * @param {object} dados
 * @returns {object}
 */
export function modelConta(dados) {
  return {
    grupoId: dados.grupoId,
    nome:    String(dados.nome ?? '').trim(),
    emoji:   dados.emoji   ?? '🏦',
    cor:     dados.cor     ?? '#546E7A',
    tipo:    dados.tipo    ?? 'banco',   // 'banco' | 'cartao' | 'dinheiro'
    ativa:   dados.ativa   !== false,    // default true
  };
}

/**
 * NRF-004: Contas padrão criadas automaticamente para grupos novos.
 * Inclui os bancos solicitados + Cartão de Crédito genérico + Dinheiro.
 */
export const CONTAS_PADRAO = [
  { nome: 'Cartão de Crédito', emoji: '💳', cor: '#7B1FA2', tipo: 'cartao'   },
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
