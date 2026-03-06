// ============================================================
// CONTROLLER: Categorias — RF-003
// ============================================================

import { criarCategoria as criarCategoriaDB, ouvirCategorias, atualizarCategoria } from '../services/database.js';
import { criarCategoria as modelCategoria, CATEGORIAS_PADRAO } from '../models/Categoria.js';

let _categorias = [];

/** Retorna as categorias em cache */
export function getCategorias() { return _categorias; }

/**
 * Cria as categorias padrão para um novo grupo.
 * @param {string} grupoId
 */
export async function criarCategoriasPadrao(grupoId) {
  const promises = CATEGORIAS_PADRAO.map((cat) =>
    criarCategoriaDB(modelCategoria({ ...cat, grupoId }))
  );
  await Promise.all(promises);
}

/**
 * Inicia listener de categorias e popula o select de despesas.
 * @param {string} grupoId
 * @param {function} onChange
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
