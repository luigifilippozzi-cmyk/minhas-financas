// ============================================================
// PAGE: orcamentos.js — RF-004
// Orçamentos mensais compartilhados com sync em tempo real.
//
// SYNC BIDIRECIONAL:
//   - ouvirOrcamentos  → onSnapshot na coleção 'orcamentos'
//   - ouvirDespesas    → onSnapshot na coleção 'despesas'
//   Qualquer alteração de um membro do grupo dispara o callback
//   nos dois usuários simultaneamente, mantendo a tela atualizada.
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import { buscarPerfil, ouvirCategorias, ouvirReceitas } from '../services/database.js';
import {
  iniciarListenerOrcamentos,
  iniciarListenerDespesasOrcamento,
  salvarOrcamento,
  copiarMesAnterior,
} from '../controllers/orcamentos.js';
import { formatarMoeda, nomeMes } from '../utils/formatters.js';
import { calcularStatusOrcamento } from '../models/Orcamento.js';

// ── Estado ────────────────────────────────────────────────────
let _grupoId    = null;
let _categorias = [];
let _orcamentos = {};   // { [categoriaId]: valorLimite }
let _despesas   = [];
let _receitas   = [];

let _mes = new Date().getMonth() + 1;
let _ano = new Date().getFullYear();

let _unsubCats = null;
let _unsubOrc  = null;
let _unsubDesp = null;
let _unsubRec  = null;

// Debounce timers por categoriaId para salvar enquanto o usuário digita
const _debounceTimers = {};

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

// ── Inicialização dos listeners ───────────────────────────────

function iniciarApp() {
  // Cancela listeners anteriores se trocar de mês
  if (_unsubCats)  _unsubCats();
  if (_unsubOrc)   _unsubOrc();
  if (_unsubDesp)  _unsubDesp();
  if (_unsubRec)   _unsubRec();

  atualizarTituloMes();

  // 1. Listener de categorias (estáticas, mas podem mudar)
  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    renderizarLista();
  });

  // 2. Listener de orçamentos — SYNC BIDIRECIONAL
  _unsubOrc = iniciarListenerOrcamentos(_grupoId, _mes, _ano, (orcs) => {
    _orcamentos = {};
    orcs.forEach((o) => { _orcamentos[o.categoriaId] = o.valorLimite; });
    renderizarLista();
  });

  // 3. Listener de despesas do mês — para mostrar gasto atual
  _unsubDesp = iniciarListenerDespesasOrcamento(_grupoId, _mes, _ano, (desp) => {
    _despesas = desp;
    renderizarLista();
  });

  // 4. Listener de receitas do mês — para mostrar recebido nas metas
  _unsubRec = ouvirReceitas(_grupoId, _mes, _ano, (recs) => {
    _receitas = recs;
    renderizarLista();
  });
}

// ── Renderização ──────────────────────────────────────────────

function atualizarTituloMes() {
  document.getElementById('orc-mes-titulo').textContent =
    `${nomeMes(_mes)} ${_ano}`;
}

function renderizarLista() {
  const listaDespesas  = document.getElementById('orc-lista');
  const listaReceitas  = document.getElementById('orc-lista-receitas');

  // Separa categorias por tipo
  const catsDespesa = _categorias.filter((c) => (c.tipo ?? 'despesa') === 'despesa');
  const catsReceita = _categorias.filter((c) => c.tipo === 'receita');

  // === DESPESAS ===
  const gastoMap = {};
  _despesas.forEach((d) => {
    gastoMap[d.categoriaId] = (gastoMap[d.categoriaId] ?? 0) + d.valor;
  });

  // Totais despesa (apenas categorias de despesa)
  let totalOrcado = 0, totalGasto = 0;
  catsDespesa.forEach((cat) => {
    totalOrcado += _orcamentos[cat.id] ?? 0;
    totalGasto  += gastoMap[cat.id] ?? 0;
  });
  atualizarChips(totalOrcado, totalGasto);

  if (!catsDespesa.length) {
    listaDespesas.innerHTML = '<p class="empty-state">Nenhuma categoria de despesa. <a href="categorias.html">Criar categorias →</a></p>';
  } else {
    listaDespesas.innerHTML = catsDespesa.map((cat) => {
      const limite = _orcamentos[cat.id] ?? 0;
      const gasto  = gastoMap[cat.id] ?? 0;
      return renderOrcItem(cat, limite, gasto, 'Gasto', 'utilizado', 'Excedeu');
    }).join('');
  }

  // === RECEITAS ===
  const recebidoMap = {};
  _receitas.forEach((r) => {
    recebidoMap[r.categoriaId] = (recebidoMap[r.categoriaId] ?? 0) + r.valor;
  });

  let totalMeta = 0, totalRecebido = 0;
  catsReceita.forEach((cat) => {
    totalMeta     += _orcamentos[cat.id] ?? 0;
    totalRecebido += recebidoMap[cat.id] ?? 0;
  });
  atualizarChipsReceitas(totalMeta, totalRecebido);

  if (!catsReceita.length) {
    listaReceitas.innerHTML = '<p class="empty-state">Nenhuma categoria de receita. <a href="categorias.html">Criar categorias →</a></p>';
  } else {
    listaReceitas.innerHTML = catsReceita.map((cat) => {
      const meta     = _orcamentos[cat.id] ?? 0;
      const recebido = recebidoMap[cat.id] ?? 0;
      return renderOrcItem(cat, meta, recebido, 'Recebido', 'recebido', 'Acima da meta');
    }).join('');
  }

  // Reconecta os listeners de input APÓS renderizar
  [...catsDespesa, ...catsReceita].forEach((cat) => {
    const input = document.getElementById(`input-orc-${cat.id}`);
    if (!input) return;

    input.addEventListener('input', () => agendarSalvamento(cat.id, input.value));
    input.addEventListener('blur', () => {
      clearTimeout(_debounceTimers[cat.id]);
      executarSalvamento(cat.id, input.value);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(_debounceTimers[cat.id]);
        executarSalvamento(cat.id, input.value);
        input.blur();
      }
    });
  });
}

/** Renderiza um item de orçamento (reutilizado para despesa e receita) */
function renderOrcItem(cat, limite, valor, labelValor, labelPct, labelExcedeu) {
  const { percentual, classe } = calcularStatusOrcamento(valor, limite);
  const largura = Math.min(percentual, 100);
  const inputId = `input-orc-${cat.id}`;
  const isReceita = cat.tipo === 'receita';
  const titleInput = isReceita
    ? `Digite a meta mensal para ${cat.nome}`
    : `Digite o limite mensal para ${cat.nome}`;

  return `
    <div class="orc-item" data-cat-id="${cat.id}">
      <div class="orc-item-top">
        <div class="orc-item-cat">
          <span class="orc-emoji">${cat.emoji}</span>
          <div class="orc-item-info">
            <span class="orc-item-nome">${cat.nome}</span>
            <span class="orc-item-gasto">
              ${labelValor}: <strong>${formatarMoeda(valor)}</strong>
              ${limite ? ` de ${formatarMoeda(limite)}` : ''}
            </span>
          </div>
        </div>
        <div class="orc-input-wrap">
          <span class="orc-input-prefix">R$</span>
          <input
            type="number"
            id="${inputId}"
            class="orc-input"
            value="${limite > 0 ? limite : ''}"
            placeholder="0"
            min="0"
            step="0.01"
            data-cat-id="${cat.id}"
            title="${titleInput}"
          />
        </div>
      </div>
      <div class="orc-progress-track ${!limite ? 'orc-sem-limite' : ''}">
        <div
          class="orc-progress-fill ${classe ? `orc-fill-${classe}` : ''}"
          style="width: ${largura}%"
        ></div>
      </div>
      <div class="orc-item-legenda">
        ${limite
          ? `<span class="${getClasseTexto(classe)}">${percentual}% ${labelPct}</span>`
          : `<span class="orc-sem-limite-texto">${isReceita ? 'Sem meta definida' : 'Sem limite definido'}</span>`}
        ${valor > limite && limite > 0
          ? `<span class="orc-excedeu">⚠️ ${labelExcedeu} ${formatarMoeda(valor - limite)}</span>`
          : ''}
      </div>
    </div>
  `;
}

function getClasseTexto(classe) {
  const mapa = { ok: 'orc-pct-ok', warning: 'orc-pct-warning', danger: 'orc-pct-danger', critical: 'orc-pct-critical' };
  return mapa[classe] ?? 'orc-pct-ok';
}

function atualizarChips(totalOrcado, totalGasto) {
  const disponivel = totalOrcado - totalGasto;
  document.getElementById('chip-total-orcado').textContent     = formatarMoeda(totalOrcado);
  document.getElementById('chip-total-gasto').textContent      = formatarMoeda(totalGasto);
  document.getElementById('chip-total-disponivel').textContent = formatarMoeda(disponivel);

  // Cor do disponível fica vermelha se negativo
  const chipDisp = document.getElementById('chip-total-disponivel');
  chipDisp.closest('.orc-chip')?.classList.toggle('orc-chip-negativo', disponivel < 0);
}

function atualizarChipsReceitas(totalMeta, totalRecebido) {
  const faltante = totalMeta - totalRecebido;
  const elMeta     = document.getElementById('chip-total-meta');
  const elRecebido = document.getElementById('chip-total-recebido');
  const elFaltante = document.getElementById('chip-total-faltante');
  if (elMeta)     elMeta.textContent     = formatarMoeda(totalMeta);
  if (elRecebido) elRecebido.textContent = formatarMoeda(totalRecebido);
  if (elFaltante) elFaltante.textContent = formatarMoeda(Math.max(0, faltante));
}

// ── Salvamento com debounce ───────────────────────────────────

function agendarSalvamento(catId, valor) {
  clearTimeout(_debounceTimers[catId]);
  _debounceTimers[catId] = setTimeout(() => executarSalvamento(catId, valor), 800);
}

async function executarSalvamento(catId, valor) {
  try {
    await salvarOrcamento(_grupoId, catId, _mes, _ano, valor);
    mostrarFeedback('✅ Salvo com sucesso');
  } catch (err) {
    mostrarFeedback('❌ Erro ao salvar: ' + err.message, true);
  }
}

function mostrarFeedback(msg, erro = false) {
  const el = document.getElementById('orc-feedback');
  el.textContent = msg;
  el.className = `orc-feedback ${erro ? 'orc-feedback-erro' : 'orc-feedback-ok'}`;
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── Navegação de mês ──────────────────────────────────────────

function irParaMes(deltaM) {
  _mes += deltaM;
  if (_mes > 12) { _mes = 1;  _ano++; }
  if (_mes < 1)  { _mes = 12; _ano--; }
  iniciarApp();
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  document.getElementById('btn-logout')
    ?.addEventListener('click', () => logout());

  document.getElementById('btn-mes-anterior')
    .addEventListener('click', () => irParaMes(-1));

  document.getElementById('btn-mes-proximo')
    .addEventListener('click', () => irParaMes(+1));

  document.getElementById('btn-copiar-mes-ant')
    .addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⏳ Copiando...';
      try {
        const qtd = await copiarMesAnterior(_grupoId, _mes, _ano);
        mostrarFeedback(
          qtd > 0
            ? `✅ ${qtd} orçamento(s) copiado(s) do mês anterior`
            : '⚠️ Mês anterior não tem orçamentos ou todos já foram definidos'
        );
      } catch (err) {
        mostrarFeedback('❌ Erro ao copiar: ' + err.message, true);
      } finally {
        btn.disabled = false;
        btn.textContent = '📋 Copiar orçamentos do mês anterior';
      }
    });
}
