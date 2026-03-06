// ============================================================
// CONTROLLER: Despesas — RF-005, RF-006, RF-007, RF-008
// ============================================================

import { criarDespesa as criarDespesaDB, atualizarDespesa, excluirDespesa, ouvirDespesas } from '../services/database.js';
import { criarDespesa as modelDespesa } from '../models/Despesa.js';
import { formatarMoeda, formatarData } from '../utils/formatters.js';
import { dataHoje } from '../utils/helpers.js';

let _unsubscribeDespesas = null;

/**
 * Inicia o listener de despesas em tempo real.
 * @param {string} grupoId
 * @param {number} mes
 * @param {number} ano
 */
export function iniciarListenerDespesas(grupoId, mes, ano) {
  if (_unsubscribeDespesas) _unsubscribeDespesas();

  _unsubscribeDespesas = ouvirDespesas(grupoId, mes, ano, (despesas) => {
    renderizarDespesas(despesas);
  });
}

/**
 * Renderiza a lista de despesas na UI.
 * @param {Array} despesas
 */
function renderizarDespesas(despesas) {
  const lista = document.getElementById('despesas-lista');
  if (!lista) return;

  if (!despesas.length) {
    lista.innerHTML = '<p class="empty-state">Nenhuma despesa registrada neste período.</p>';
    return;
  }

  lista.innerHTML = despesas.map((d) => `
    <div class="despesa-item card">
      <div class="despesa-info">
        <span class="despesa-descricao">${d.descricao}</span>
        <span class="despesa-meta">${formatarData(d.data)}</span>
      </div>
      <span class="despesa-categoria-badge">${d.categoriaNome ?? ''}</span>
      <span class="despesa-valor">${formatarMoeda(d.valor)}</span>
      <div class="despesa-acoes">
        <button class="btn btn-sm btn-outline" onclick="editarDespesa('${d.id}')">✏️</button>
        <button class="btn btn-sm btn-danger"  onclick="confirmarExcluirDespesa('${d.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

/**
 * Salva uma despesa (criar ou atualizar).
 * @param {object} dados
 * @param {string} grupoId
 * @param {string} usuarioId
 * @param {string|null} despesaId
 */
export async function salvarDespesa(dados, grupoId, usuarioId, despesaId = null) {
  const despesa = modelDespesa({ ...dados, grupoId, usuarioId });
  if (despesaId) {
    await atualizarDespesa(despesaId, despesa);
  } else {
    await criarDespesaDB(despesa);
  }
}

/**
 * Exclui uma despesa após confirmação.
 * @param {string} despesaId
 */
export async function deletarDespesa(despesaId) {
  await excluirDespesa(despesaId);
}
