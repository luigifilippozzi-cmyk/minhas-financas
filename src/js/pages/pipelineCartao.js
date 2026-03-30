// ============================================================
// PIPELINE: Fatura de Cartão — RF-013 + NRF-002.1
// Parsing, filtragem e projeção de parcelas para faturas de cartão.
// ============================================================
import { parsearLinhasCSVXLSX, parsearParcela, gerarChaveDedup } from '../utils/normalizadorTransacoes.js';

// ── Processa fatura de cartão CSV/XLSX ─────────────────────────
// Aplica filtro de créditos e ajuste de mês de fatura já no parse.
export function processarFaturaCartao({ rows, contas, categorias, mapaHist, origemBanco, mesFatura }) {
  const linhas = parsearLinhasCSVXLSX(rows, { contas, categorias, mapaHist, origemBanco });
  if (mesFatura) linhas.forEach(l => { l.mesFatura = mesFatura; });  // BUG-021: propaga ciclo de faturamento
  filtrarCreditos(linhas);
  if (mesFatura) aplicarMesFatura(linhas, mesFatura);
  return linhas;
}

// ── NRF-002.1: Marca créditos/estornos para revisão no preview ──
// BUG-013: em vez de bloquear com erro, marca isEstorno=true para
// que o usuário possa decidir no preview se importa como receita.
export function filtrarCreditos(linhas) {
  linhas.forEach((l) => {
    if (l.isNegativo && !l.erro) {
      l.isEstorno = true;
      l.tipoLinha = 'receita'; // estorno reduz fatura → salvo como receita se importado
    }
  });
}

// ── NRF-002.1: Ajusta datas de parceladas para o mês da fatura ──
// Para à vista: mantém a data original do CSV.
// Para parceladas: substitui por 01/mês-fatura.
// mesFatura: "YYYY-MM"
export function aplicarMesFatura(linhas, mesFatura) {
  if (!mesFatura || !linhas.length) return;
  const [ano, mes] = mesFatura.split('-').map(Number);
  const dataFatura = new Date(ano, mes - 1, 1);
  linhas.forEach((l) => {
    // BUG-026: propaga mesFatura para cada linha para que o campo seja salvo no Firestore
    l.mesFatura = mesFatura;
    // Restaura data original antes de aplicar (permite trocar de mês)
    l.data = l.dataOriginal instanceof Date ? l.dataOriginal : new Date(l.dataOriginal);
    if (!l.erro && l.parcela && l.parcela !== '-') {
      l.data = new Date(dataFatura);
      l.dataAjustada = true;
    } else {
      l.dataAjustada = false;
    }
  });
}

// ── RF-014: Gera projeções para parcelas futuras ────────────────
export function gerarProjecoes(linha, parcelamentoId) {
  const info = parsearParcela(linha.parcela);
  if (!info) return [];
  const projecoes = [];
  for (let n = info.atual + 1; n <= info.total; n++) {
    const dataBase   = linha.data instanceof Date ? linha.data : new Date(linha.data);
    const dataProj   = new Date(dataBase);
    dataProj.setMonth(dataProj.getMonth() + (n - info.atual));
    const parcelaStr = String(n).padStart(2, '0') + '/' + String(info.total).padStart(2, '0');
    const chaveDedup = gerarChaveDedup(dataProj, linha.descricao, linha.valor, linha.portador, parcelaStr);
    projecoes.push({
      descricao: linha.descricao, valor: linha.valor, categoriaId: linha.categoriaId ?? '',
      data: dataProj, portador: linha.portador ?? '', responsavel: linha.portador ?? '',
      parcela: parcelaStr, tipo: 'projecao', parcelamento_id: parcelamentoId,
      chave_dedup: chaveDedup, status: 'pendente',
    });
  }
  return projecoes;
}
