// ============================================================
// CONTROLLER: Categorias — RF-003
// Gerenciamento de Categorias (CRUD completo)
// Ambos os membros do grupo podem criar, editar e desativar
// categorias; as mudanças são sincronizadas em tempo real.
// ============================================================

import {
  criarCategoria as criarCategoriaDB,
  ouvirCategorias,
  atualizarCategoria,
  excluirCategoria,
  excluirOrcamentosDaCategoria,
} from '../services/database.js';
import { criarCategoria as modelCategoria, CATEGORIAS_PADRAO } from '../models/Categoria.js';

let _categorias = [];

/** Retorna as categorias em cache (array em memória). */
export function getCategorias() { return _categorias; }

// ── Listeners ─────────────────────────────────────────────────

/**
 * Inicia listener em tempo real de categorias.
 * Popula o <select> de despesas automaticamente.
 * Qualquer alteração feita pelo parceiro é refletida aqui.
 *
 * @param {string}   grupoId
 * @param {function} onChange  - callback com array de categorias
 * @returns {function} unsubscribe
 */
export function iniciarListenerCategorias(grupoId, onChange) {
  return ouvirCategorias(grupoId, (cats) => {
    _categorias = cats;
    preencherSelectCategorias(cats);
    onChange(cats);
  });
}

/**
 * Preenche o <select> de categorias no formulário de despesas.
 * @param {Array} categorias
 */
function preencherSelectCategorias(categorias) {
  const select = document.getElementById('despesa-categoria');
  if (!select) return;
  const valorAtual = select.value;
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  categorias.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.emoji} ${cat.nome}`;
    select.appendChild(opt);
  });
  if (valorAtual) select.value = valorAtual;
}

// ── CRUD ──────────────────────────────────────────────────────

/**
 * Cria as categorias padrão para um novo grupo.
 * Chamado apenas ao criar o grupo (grupos.js / RF-002).
 * @param {string} grupoId
 */
export async function criarCategoriasPadrao(grupoId) {
  const promises = CATEGORIAS_PADRAO.map((cat) =>
    criarCategoriaDB(modelCategoria({ ...cat, grupoId }))
  );
  await Promise.all(promises);
}

/**
 * Cria ou atualiza uma categoria.
 * Operação compartilhada: qualquer membro do grupo pode salvar.
 *
 * @param {object}      dados        - { nome, emoji, cor, orcamentoMensal }
 * @param {string}      grupoId      - ID do grupo (necessário ao criar)
 * @param {string|null} categoriaId  - null = nova categoria, string = edição
 * @returns {Promise<string>}        - ID da categoria
 */
export async function salvarCategoria(dados, grupoId, categoriaId = null) {
  const { nome, emoji, cor, orcamentoMensal, isConjuntaPadrao } = dados;

  if (!nome?.trim()) throw new Error('O nome da categoria é obrigatório.');
  if (!emoji?.trim()) throw new Error('Escolha um emoji para a categoria.');

  const payload = {
    nome: nome.trim(),
    emoji: emoji.trim(),
    cor: cor || '#95A5A6',
    orcamentoMensal: Number(orcamentoMensal) || 0,
    // NRF-001: marca se despesas desta cat são sempre conjuntas
    isConjuntaPadrao: Boolean(isConjuntaPadrao),
  };

  if (categoriaId) {
    // Edição — atualiza apenas os campos enviados
    await atualizarCategoria(categoriaId, payload);
    return categoriaId;
  } else {
    // Criação — precisa do grupoId e do campo ativa
    const novaCat = modelCategoria({ ...payload, grupoId });
    const ref = await criarCategoriaDB(novaCat);
    return ref.id;
  }
}

/**
 * Desativa (soft-delete) uma categoria e remove todos os seus orçamentos.
 * A categoria some das listas mas os registros históricos de despesas são preservados.
 *
 * @param {string} categoriaId
 * @param {string} grupoId
 */
export async function desativarCategoria(categoriaId, grupoId) {
  await excluirCategoria(categoriaId);                            // sets ativa: false
  await excluirOrcamentosDaCategoria(grupoId, categoriaId);       // limpa orçamentos órfãos
}
