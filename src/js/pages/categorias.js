// ============================================================
// PAGE: categorias.js — RF-003
// Gerenciamento de Categorias com sync em tempo real.
// Ambos os membros do grupo podem criar, editar e desativar.
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil, ouvirCategorias, migrarCategoriasLegado } from '../services/database.js';
import { salvarCategoria, desativarCategoria } from '../controllers/categorias.js';

// ── Estado ────────────────────────────────────────────────────
let _grupoId     = null;
let _categorias  = [];
let _unsubscribe = null;
let _emojiManual = false;   // true quando o usuário escolheu o emoji manualmente

// ── Bootstrap ─────────────────────────────────────────────────

onAuthChange(async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  let perfil;
  try {
    perfil = await buscarPerfil(user.uid);
  } catch (_err) {
    window.location.href = 'login.html';
    return;
  }
  if (!perfil?.grupoId) { window.location.href = 'grupo.html'; return; }

  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;

  iniciarApp();
  configurarEventos();
});

// ── App ───────────────────────────────────────────────────────

function iniciarApp() {
  // Cancela listener anterior (caso reiniciado)
  if (_unsubscribe) _unsubscribe();

  // Migração: seta tipo='despesa' em categorias legado sem o campo
  migrarCategoriasLegado(_grupoId).catch((err) =>
    console.warn('[migrarCategoriasLegado]', err)
  );

  // Listener em tempo real — atualiza para AMBOS os membros do grupo
  _unsubscribe = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats;
    renderizarLista(cats);
  });
}

// ── Renderização ──────────────────────────────────────────────

function renderizarLista(cats) {
  const listaDespesa = document.getElementById('categorias-lista-despesa');
  const listaReceita = document.getElementById('categorias-lista-receita');

  const despesas = cats.filter((c) => (c.tipo ?? 'despesa') === 'despesa')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const receitas = cats.filter((c) => c.tipo === 'receita')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  listaDespesa.innerHTML = despesas.length
    ? despesas.map(renderItemCategoria).join('')
    : '<p class="empty-state">Nenhuma categoria de despesa. Crie a primeira!</p>';

  listaReceita.innerHTML = receitas.length
    ? receitas.map(renderItemCategoria).join('')
    : '<p class="empty-state">Nenhuma categoria de receita. Crie a primeira!</p>';
}

function renderItemCategoria(cat) {
  const isReceita = cat.tipo === 'receita';
  const labelOrc = isReceita ? 'Meta' : 'Limite';
  return `
    <div class="cat-item" data-id="${cat.id}">
      <div class="cat-item-left">
        <span class="cat-item-emoji">${cat.emoji}</span>
        <div class="cat-item-info">
          <span class="cat-item-nome">${cat.nome}</span>
          <span class="cat-item-orcamento">
            ${cat.orcamentoMensal > 0
              ? `${labelOrc}: R$ ${Number(cat.orcamentoMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : isReceita ? 'Sem meta definida' : 'Sem limite definido'}
          </span>
          ${!isReceita && cat.isConjuntaPadrao
            ? '<span class="cat-conjunta-badge" title="Despesas desta categoria são divididas 50/50">👫 conjunta</span>'
            : ''}
        </div>
      </div>
      <div class="cat-item-right">
        <span class="cat-cor-badge" style="background:${cat.cor}"></span>
        <button
          class="btn btn-outline btn-sm"
          onclick="window.abrirEditar('${cat.id}')"
        >✏️ Editar</button>
        <button
          class="btn btn-sm cat-btn-desativar"
          onclick="window.confirmarDesativar('${cat.id}', '${cat.nome}')"
        >🗑️</button>
      </div>
    </div>
  `;
}

// ── Emoji: sugestão automática e picker ──────────────────────

const EMOJI_SUGESTOES = [
  { regex: /aliment|comida|restaurante|lanche|jantar|almoço|refeição/i, emoji: '🍽️' },
  { regex: /supermercado|mercado|feira|hortifruti/i,                     emoji: '🛒' },
  { regex: /padaria|pão|café da manhã|panificadora/i,                    emoji: '🥐' },
  { regex: /transporte|ônibus|metrô|trem|passagem/i,                     emoji: '🚌' },
  { regex: /uber|táxi|carro|combustível|gasolina|estacion/i,             emoji: '🚗' },
  { regex: /saúde|médico|hospital|clínica|consulta/i,                    emoji: '🏥' },
  { regex: /farmácia|remédio|medicamento|drogaria/i,                     emoji: '💊' },
  { regex: /academia|ginástica|esporte|gym|personal|fit/i,               emoji: '🏋️' },
  { regex: /educação|escola|faculdade|curso|aula/i,                      emoji: '📚' },
  { regex: /aluguel|moradia|condomínio|iptu|aparta/i,                    emoji: '🏠' },
  { regex: /luz|energia elétrica/i,                                      emoji: '💡' },
  { regex: /água|saneamento/i,                                           emoji: '💧' },
  { regex: /internet|streaming|netflix|spotify|assinatura/i,             emoji: '🌐' },
  { regex: /telefone|celular|plano|chip/i,                               emoji: '📱' },
  { regex: /lazer|diversão|entretenimento/i,                             emoji: '🎮' },
  { regex: /cinema|teatro|show|evento/i,                                 emoji: '🎬' },
  { regex: /viagem|voo|hotel|hospedagem/i,                               emoji: '✈️' },
  { regex: /roupa|vestuário|moda|tênis|calçado/i,                        emoji: '👕' },
  { regex: /beleza|salão|cabelo|estética|manicure/i,                     emoji: '💅' },
  { regex: /pet|cachorro|gato|veterinário|ração/i,                       emoji: '🐾' },
  { regex: /presente|gift|doação/i,                                      emoji: '🎁' },
  { regex: /imposto|taxa|tributo/i,                                      emoji: '📋' },
  { regex: /banco|juros|parcela|empréstimo/i,                            emoji: '🏦' },
  { regex: /investimento|poupança|tesouro|fundo/i,                       emoji: '💰' },
  { regex: /trabalho|salário|freelance/i,                                emoji: '💼' },
  { regex: /festa|aniversário|celebração/i,                              emoji: '🎉' },
];

const EMOJI_PICKER_LISTA = [
  '🍽️','🛒','🥐','🚗','🚌','✈️','🏠','💡','💧','🏥','💊','🏋️',
  '📚','🎓','🌐','📱','💻','🎮','🎬','🎵','👕','💅','🐾','🎁',
  '📋','🏦','💰','💼','🎉','📂','🔧','🌱','🍕','☕','🎂','🎯',
  '💸','⚡','🎨','🏡','💎','🛠️','🍺','🏖️','🏃','🌍','📦','🔑',
];

function sugerirEmoji(nome) {
  for (const { regex, emoji } of EMOJI_SUGESTOES) {
    if (regex.test(nome)) return emoji;
  }
  return null;
}

function buildEmojiPicker() {
  const grid = document.getElementById('emoji-picker-grid');
  grid.innerHTML = EMOJI_PICKER_LISTA.map((e) =>
    `<button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>`,
  ).join('');
  grid.querySelectorAll('.emoji-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('cat-emoji').value = btn.dataset.emoji;
      _emojiManual = true;
      atualizarPrevia();
      grid.classList.add('hidden');
    });
  });
}

// ── Modal Criar / Editar ──────────────────────────────────────

const CORES_RAPIDAS = [
  '#FF6B6B','#FF9F43','#F9CA24','#6AB04C','#4ECDC4',
  '#45B7D1','#4F46E5','#A29BFE','#FD79A8','#95A5A6',
];

function abrirModal(cat = null) {
  // Título
  document.getElementById('modal-cat-titulo').textContent =
    cat ? 'Editar Categoria' : 'Nova Categoria';

  // Ao editar, o emoji já existe → considera como manual para não sobrescrever
  // Ao criar novo, emoji começa vazio → auto-sugestão entra em ação ao digitar o nome
  _emojiManual = cat !== null;

  // Fecha picker caso esteja aberto
  document.getElementById('emoji-picker-grid').classList.add('hidden');

  // Preenche campos
  document.getElementById('cat-id').value         = cat?.id ?? '';
  document.getElementById('cat-emoji').value      = cat?.emoji ?? '';
  document.getElementById('cat-nome').value       = cat?.nome ?? '';
  document.getElementById('cat-cor').value        = cat?.cor ?? '#95A5A6';
  document.getElementById('cat-orcamento').value  = cat?.orcamentoMensal ?? '';
  // NRF-001: toggle isConjuntaPadrao
  const toggleConj = document.getElementById('cat-conjunta-padrao');
  if (toggleConj) toggleConj.checked = cat?.isConjuntaPadrao ?? false;
  document.getElementById('cat-erro').classList.add('hidden');

  // Seletor de tipo
  const tipo = cat?.tipo ?? 'despesa';
  document.getElementById('cat-tipo').value = tipo;
  atualizarSeletorTipo(tipo);

  // Atualiza prévia
  atualizarPrevia();

  // Cores rápidas
  const swatches = document.getElementById('color-swatches');
  swatches.innerHTML = CORES_RAPIDAS.map((c) =>
    `<button type="button" class="color-swatch" style="background:${c}" data-cor="${c}" title="${c}"></button>`
  ).join('');

  swatches.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('cat-cor').value = btn.dataset.cor;
      atualizarPrevia();
    });
  });

  document.getElementById('modal-categoria').classList.remove('hidden');
  document.getElementById('cat-emoji').focus();
}

/** Atualiza UI do seletor de tipo e campos dependentes */
function atualizarSeletorTipo(tipo) {
  document.querySelectorAll('.cat-tipo-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tipo === tipo);
  });
  document.getElementById('cat-tipo').value = tipo;

  const isReceita = tipo === 'receita';

  // Label contextual: Orçamento vs Meta
  const labelOrc = document.getElementById('label-orcamento');
  if (labelOrc) labelOrc.textContent = isReceita ? 'Meta Mensal (R$)' : 'Orçamento Mensal (R$)';

  // Toggle conjunta só aparece para despesas
  const fgConjunta = document.getElementById('form-group-conjunta');
  if (fgConjunta) fgConjunta.style.display = isReceita ? 'none' : '';
}

function fecharModal() {
  _emojiManual = false;
  document.getElementById('emoji-picker-grid').classList.add('hidden');
  document.getElementById('modal-categoria').classList.add('hidden');
  document.getElementById('form-categoria').reset();
}

function atualizarPrevia() {
  const emojiRaw = document.getElementById('cat-emoji').value;
  const nome     = document.getElementById('cat-nome').value  || 'Nova Categoria';
  const cor      = document.getElementById('cat-cor').value   || '#95A5A6';
  // Mostra emoji sugerido na prévia mesmo antes de confirmar no campo
  const emoji    = emojiRaw || sugerirEmoji(nome) || '📦';

  document.getElementById('preview-emoji').textContent    = emoji;
  document.getElementById('preview-nome').textContent     = nome;
  document.getElementById('preview-cor').style.background = cor;
}

// ── Modal Confirmar Desativação ───────────────────────────────

let _pendingDesativarId = null;

function abrirConfirmar(id, nome) {
  _pendingDesativarId = id;
  document.getElementById('confirmar-mensagem').textContent =
    `Deseja desativar a categoria "${nome}"? As despesas existentes não serão apagadas.`;
  document.getElementById('modal-confirmar').classList.remove('hidden');
}

function fecharConfirmar() {
  _pendingDesativarId = null;
  document.getElementById('modal-confirmar').classList.add('hidden');
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  // Logout
  document.getElementById('btn-logout')
    ?.addEventListener('click', () => logout());

  // Abrir modal nova categoria
  document.getElementById('btn-nova-categoria')
    .addEventListener('click', () => abrirModal());

  // Fechar modal categoria
  document.getElementById('btn-fechar-modal-cat')
    .addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar-cat')
    .addEventListener('click', fecharModal);
  document.getElementById('backdrop-categoria')
    .addEventListener('click', fecharModal);

  // Atualiza prévia ao digitar — emoji manual bloqueia auto-sugestão
  document.getElementById('cat-emoji').addEventListener('input', () => {
    _emojiManual = document.getElementById('cat-emoji').value.trim() !== '';
    atualizarPrevia();
  });

  document.getElementById('cat-nome').addEventListener('input', () => {
    if (!_emojiManual) {
      const sugestao = sugerirEmoji(document.getElementById('cat-nome').value);
      // Preenche o campo com a sugestão (ou limpa se não houver)
      document.getElementById('cat-emoji').value = sugestao ?? '';
    }
    atualizarPrevia();
  });

  document.getElementById('cat-cor').addEventListener('input', atualizarPrevia);

  // Picker de emoji
  document.getElementById('btn-emoji-picker').addEventListener('click', (e) => {
    e.stopPropagation();
    const grid = document.getElementById('emoji-picker-grid');
    if (grid.classList.contains('hidden')) {
      buildEmojiPicker();
      grid.classList.remove('hidden');
    } else {
      grid.classList.add('hidden');
    }
  });

  // Fecha picker ao clicar fora
  document.addEventListener('click', (e) => {
    const grid = document.getElementById('emoji-picker-grid');
    if (!grid.classList.contains('hidden') &&
        !e.target.closest('#emoji-picker-grid') &&
        e.target.id !== 'btn-emoji-picker') {
      grid.classList.add('hidden');
    }
  });

  // Seletor de tipo (Despesa / Receita)
  document.querySelectorAll('.cat-tipo-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      atualizarSeletorTipo(btn.dataset.tipo);
    });
  });

  // Submit do formulário
  document.getElementById('form-categoria')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const erroEl  = document.getElementById('cat-erro');
      const btnSalvar = document.getElementById('btn-salvar-cat');
      erroEl.classList.add('hidden');
      btnSalvar.disabled = true;
      btnSalvar.textContent = 'Salvando…';

      const catId     = document.getElementById('cat-id').value || null;
      const nomeVal   = document.getElementById('cat-nome').value;
      const emojiRaw  = document.getElementById('cat-emoji').value.trim();
      // Se o campo emoji ainda estiver vazio, usa a sugestão; fallback para 📦
      const emojiFinal = emojiRaw || sugerirEmoji(nomeVal) || '📦';
      const tipoVal = document.getElementById('cat-tipo').value || 'despesa';
      const dados = {
        emoji:             emojiFinal,
        nome:              nomeVal,
        cor:               document.getElementById('cat-cor').value,
        orcamentoMensal:   document.getElementById('cat-orcamento').value,
        // NRF-001: toggle conjunta padrão (só para despesas)
        isConjuntaPadrao:  tipoVal === 'despesa'
          ? (document.getElementById('cat-conjunta-padrao')?.checked ?? false)
          : false,
        tipo:              tipoVal,
      };

      try {
        await salvarCategoria(dados, _grupoId, catId);
        fecharModal();
      } catch (err) {
        erroEl.textContent = err.message;
        erroEl.classList.remove('hidden');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar';
      }
    });

  // Fechar modal confirmar desativação
  document.getElementById('btn-fechar-confirmar')
    .addEventListener('click', fecharConfirmar);
  document.getElementById('btn-cancelar-confirmar')
    .addEventListener('click', fecharConfirmar);
  document.getElementById('backdrop-confirmar')
    .addEventListener('click', fecharConfirmar);

  // Confirmar desativação
  document.getElementById('btn-confirmar-acao')
    .addEventListener('click', async () => {
      if (!_pendingDesativarId) return;
      await desativarCategoria(_pendingDesativarId, _grupoId);
      fecharConfirmar();
    });
}

// ── Funções expostas para botões inline ──────────────────────

window.abrirEditar = (id) => {
  const cat = _categorias.find((c) => c.id === id);
  if (cat) abrirModal(cat);
};

window.confirmarDesativar = (id, nome) => abrirConfirmar(id, nome);
