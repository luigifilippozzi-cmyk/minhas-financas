// ============================================================
// CONTROLLER: Despesas — RF-005
// Registro de despesas compartilhado entre membros do grupo.
// Qualquer alteração (criar/editar/excluir) feita por um usuário
// é sincronizada em tempo real para o outro via onSnapshot.
// ============================================================

import {
  criarDespesa as criarDespesaDB,
  atualizarDespesa,
  excluirDespesa,
  ouvirDespesas,
} from '../services/database.js';
import { criarDespesa as modelDespesa } from '../models/Despesa.js';
import { formatarMoeda, formatarData, escHTML } from '../utils/formatters.js';

let _unsubscribeDespesas = null;

// ── Listener ─────────────────────────────────────────────────

/**
 * Inicia (ou reinicia) o listener em tempo real de despesas.
 * Ambos os membros do grupo recebem atualizações imediatamente
 * porque ambos têm o mesmo grupoId e ouvem a mesma coleção.
 *
 * @param {string}   grupoId
 * @param {number}   mes
 * @param {number}   ano
 * @param {function} onChange  — callback(despesas[])
 * @returns {function} unsubscribe
 */
export function iniciarListenerDespesas(grupoId, mes, ano, onChange) {
  if (_unsubscribeDespesas) _unsubscribeDespesas();
  _unsubscribeDespesas = ouvirDespesas(grupoId, mes, ano, onChange);
  return _unsubscribeDespesas;
}

// ── Escrita ───────────────────────────────────────────────────

/**
 * Cria ou atualiza uma despesa.
 * A escrita dispara onSnapshot em todos os listeners ativos do grupo,
 * garantindo sincronização bidirecional em tempo real.
 *
 * @param {object}      dados       — { descricao, valor, categoriaId, data }
 * @param {string}      grupoId
 * @param {string}      usuarioId   — UID de quem está registrando
 * @param {string|null} despesaId   — null = criar, string = atualizar
 */
export async function salvarDespesa(dados, grupoId, usuarioId, despesaId = null) {
  // NRF-001: garante valorAlocado = valor/2 quando isConjunta=true
  const dadosNormalizados = { ...dados };
  if (dadosNormalizados.isConjunta) {
    dadosNormalizados.valorAlocado =
      Math.round((dadosNormalizados.valor ?? 0) * 100 / 2) / 100;
  } else {
    // Remove campos conjunta se desmarcado
    dadosNormalizados.isConjunta   = false;
    dadosNormalizados.valorAlocado = null;
  }

  const despesa = modelDespesa({ ...dadosNormalizados, grupoId, usuarioId });

  if (despesaId) {
    // Atualiza mantendo metadados originais (quem criou, etc.)
    // Fix #49: incluído responsavel no update (estava ausente)
    // NRF-001 fix: usa dadosNormalizados diretamente para isConjunta/valorAlocado
    // pois modelDespesa trata esses campos como opcionais e pode retornar undefined
    const updatePayload = {
      descricao:    despesa.descricao,
      valor:        despesa.valor,
      categoriaId:  despesa.categoriaId,
      data:         despesa.data,
      responsavel:  dados.responsavel ?? '',
      isConjunta:   dadosNormalizados.isConjunta ?? false,
      valorAlocado: dadosNormalizados.valorAlocado ?? null,
    };
    // NRF-004: inclui contaId se informado; remove se limpo
    if (dadosNormalizados.contaId) updatePayload.contaId = dadosNormalizados.contaId;
    await atualizarDespesa(despesaId, updatePayload);
  } else {
    // Fix #49: responsavel incluído no documento criado
    const createPayload = {
      ...despesa,
      responsavel:  dados.responsavel ?? '',
      isConjunta:   dadosNormalizados.isConjunta ?? false,
      valorAlocado: dadosNormalizados.valorAlocado ?? null,
    };
    // NRF-004: inclui contaId se informado
    if (dadosNormalizados.contaId) createPayload.contaId = dadosNormalizados.contaId;
    // NRF-008: gera chave de deduplicação para entradas manuais (data+descrição+valor)
    if (!createPayload.chave_dedup) {
      const dt   = (despesa.data instanceof Date ? despesa.data : new Date(despesa.data)).toISOString().split('T')[0];
      const desc = String(despesa.descricao ?? '').toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 60);
      const val  = parseFloat(despesa.valor ?? 0).toFixed(2);
      createPayload.chave_dedup = `manual||${dt}||${desc}||${val}`;
    }
    await criarDespesaDB(createPayload);
  }
}

/**
 * Exclui uma despesa permanentemente.
 * A exclusão dispara onSnapshot → removida da UI de todos os membros.
 *
 * @param {string} despesaId
 */
export async function deletarDespesa(despesaId) {
  await excluirDespesa(despesaId);
}

// ── Renderização (usada no index.html / dashboard) ────────────

/**
 * Renderiza a lista de despesas em um elemento do DOM.
 *
 * @param {Array}  despesas
 * @param {Array}  categorias       — lista de categorias para enriquecimento
 * @param {string} containerId      — id do elemento de destino
 * @param {string} onEditar         — nome da função global para editar
 * @param {string} onExcluir        — nome da função global para excluir
 */
export function renderizarListaDespesas(
  despesas,
  categorias = [],
  containerId = 'despesas-lista',
  onEditar = 'editarDespesa',
  onExcluir = 'confirmarExcluirDespesa',
) {
  const lista = document.getElementById(containerId);
  if (!lista) return;

  if (!despesas.length) {
    lista.innerHTML = '<p class="empty-state">Nenhuma despesa registrada neste período.</p>';
    return;
  }

  // Mapa rápido de categorias para lookup por ID
  const catMap = Object.fromEntries(categorias.map((c) => [c.id, c]));

  lista.innerHTML = despesas.map((d) => {
    const cat = catMap[d.categoriaId];
    const catLabel = cat ? `${escHTML(cat.emoji ?? '')} ${escHTML(cat.nome)}`.trim() : escHTML(d.categoriaId ?? '—');
    const catCor   = cat?.cor ?? '#6c757d';

    return `
    <div class="despesa-item card">
      <div class="despesa-left">
        <span class="despesa-cat-badge" style="background:${catCor}22; color:${catCor};">${catLabel}</span>
        <span class="despesa-descricao">${escHTML(d.descricao)}</span>
        <span class="despesa-data">${formatarData(d.data)}</span>
      </div>
      <div class="despesa-right">
        <span class="despesa-valor">${formatarMoeda(d.valor)}</span>
        <div class="despesa-acoes">
          <button class="btn btn-sm btn-outline" onclick="${onEditar}('${d.id}')" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger"  onclick="${onExcluir}('${d.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
