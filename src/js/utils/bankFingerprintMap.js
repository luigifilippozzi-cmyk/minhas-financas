// ============================================================
// RF-021: Mapa de Fingerprints de Bancos/Emissores Brasileiros
//
// Usado por detectorOrigemArquivo.js para identificar o banco
// pelo nome do arquivo, cabeçalhos e conteúdo textual.
//
// Estrutura de cada entrada:
//   id            — slug identificador ('itau', 'nubank', ...)
//   label         — nome de exibição
//   emoji         — emoji do banco
//   filePatterns  — regex aplicados ao nome do arquivo (baixo custo)
//   keywords.high   — textos de alta confiança (+40 pts cada)
//   keywords.medium — textos de média confiança (+20 pts cada)
// ============================================================

export const BANK_FINGERPRINTS = [
  {
    id: 'itau',
    label: 'Itaú',
    emoji: '🏦',
    filePatterns: [/itau/i, /unibanco/i],
    keywords: {
      high:   ['itaú unibanco s.a.', 'itau unibanco', 'banco itaú s.a.', 'banco itau s.a.'],
      medium: ['itaú', 'itau', 'unibanco'],
    },
  },
  {
    id: 'nubank',
    label: 'Nubank',
    emoji: '💜',
    filePatterns: [/nubank/i],
    keywords: {
      high:   ['nu pagamentos s.a.', 'nubank s.a.', 'nu financeira s.a.'],
      medium: ['nubank', 'nu pagamento'],
    },
  },
  {
    id: 'bradesco',
    label: 'Bradesco',
    emoji: '🔴',
    filePatterns: [/bradesco/i],
    keywords: {
      high:   ['banco bradesco s.a.', 'bradesco s.a.', 'rentab.invest facilcred', 'facilcred'],
      medium: ['bradesco', 'extrato de: ag:'],
    },
  },
  {
    id: 'santander',
    label: 'Santander',
    emoji: '🔥',
    filePatterns: [/santander/i],
    keywords: {
      high:   ['banco santander brasil s.a.', 'banco santander s.a.'],
      medium: ['santander'],
    },
  },
  {
    id: 'inter',
    label: 'Banco Inter',
    emoji: '🧡',
    filePatterns: [/banco.?inter/i, /binterdigital/i],
    keywords: {
      high:   ['banco inter s.a.', 'binterdigital', 'banco inter'],
      medium: ['inter pagamento', 'banco inter'],
    },
  },
  {
    id: 'brasil',
    label: 'Banco do Brasil',
    emoji: '💛',
    filePatterns: [/banco.do.brasil/i, /\bbb\b/],
    keywords: {
      high:   ['banco do brasil s.a.', 'banco do brasil - extrato'],
      medium: ['banco do brasil', 'bb seguridade', 'bb pag'],
    },
  },
  {
    id: 'caixa',
    label: 'Caixa Econômica',
    emoji: '🟦',
    filePatterns: [/caixa.econ/i, /\bcef\b/i],
    keywords: {
      high:   ['caixa economica federal', 'caixa econômica federal'],
      medium: ['caixa economica', 'caixa econômica', 'cef '],
    },
  },
  {
    id: 'xp',
    label: 'XP Investimentos',
    emoji: '📈',
    filePatterns: [/\bxp\b/i, /xpinvestimentos/i],
    keywords: {
      high:   ['xp investimentos s.a.', 'xp corretora de cambio'],
      medium: ['xp invest', 'xp pagamento'],
    },
  },
  {
    id: 'btg',
    label: 'BTG Pactual',
    emoji: '🏛️',
    filePatterns: [/btg/i],
    keywords: {
      high:   ['btg pactual s.a.', 'btg pactual digital'],
      medium: ['btg pactual', 'btg'],
    },
  },
  {
    id: 'c6',
    label: 'C6 Bank',
    emoji: '⚫',
    filePatterns: [/c6.?bank/i],
    keywords: {
      high:   ['c6 bank s.a.', 'c6bank'],
      medium: ['c6 bank', 'c6 pagamento'],
    },
  },
  {
    id: 'original',
    label: 'Banco Original',
    emoji: '🟢',
    filePatterns: [/banco.original/i],
    keywords: {
      high:   ['banco original s.a.'],
      medium: ['banco original'],
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    emoji: '💙',
    filePatterns: [/\bneon\b/i],
    keywords: {
      high:   ['neon pagamentos s.a.'],
      medium: ['neon pagamento', 'banco neon'],
    },
  },
  {
    id: 'picpay',
    label: 'PicPay',
    emoji: '💚',
    filePatterns: [/picpay/i],
    keywords: {
      high:   ['picpay serviços s.a.', 'picpay bank'],
      medium: ['picpay'],
    },
  },
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    emoji: '🛒',
    filePatterns: [/mercado.?pago/i],
    keywords: {
      high:   ['mercado pago s.a.', 'mercadopago'],
      medium: ['mercado pago'],
    },
  },
  {
    id: 'sicoob',
    label: 'Sicoob',
    emoji: '🌾',
    filePatterns: [/sicoob/i, /sicredi/i],
    keywords: {
      high:   ['banco sicoob', 'sicoob creditag'],
      medium: ['sicoob', 'sicredi'],
    },
  },
];
