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
import { buscarPerfil } from '../services/database.js';
import { ouvirCategorias } from '../services/database.js';
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

let _mes = new Date().getMonth() + 1;
let _ano = new Date().getFullYear();

let _unsubCats = null;
let _unsubOrc  = null;
let _unsubDesp = null;

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

  atualizarTituloMes();

  // 1. Listener de categorias (estáticas, mas podem mudar)
  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    renderizarLista();
  });

  // 2. Listener de orçamentos — SYNC BIDIRECIONAL
  //    Quando o parceiro altera um orçamento, este callback é chamado
  //    e a tela é atualizada automaticamente.
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
}

// ── Renderização ──────────────────────────────────────────────

function atualizarTituloMes() {
  document.getElementById('orc-mes-titulo').textContent =
    `${nomeMes(_mes)} ${_ano}`;
}

function renderizarLista() {
  const lista = document.getElementById('orc-lista');
  if (!_categorias.length) {
    lista.innerHTML = '<p class="empty-state">Nenhuma categoria cadastrada. <a href="categorias.html">Criar categorias →</a></p>';
    atualizarChips(0, 0);
    return;
  }

  // Soma gasto por categoria
  const gastoMap = {};
  _despesas.forEach((d) => {
    gastoMap[d.categoriaId] = (gastoMap[d.categoriaId] ?? 0) + d.valor;
  });

  // Totais
  const totalOrcado    = Object.values(_orcamentos).reduce((a, b) => a + b, 0);
  const totalGasto     = Object.values(gastoMap).reduce((a, b) => a + b, 0);
  atualizarChips(totalOrcado, totalGasto);

  lista.innerHTML = _categorias.map((cat) => {
    const limite = _orcamentos[cat.id] ?? 0;
    const gasto  = gastoMap[cat.id] ?? 0;
    const { percentual, classe } = calcularStatusOrcamento(gasto, limite);
    const largura = Math.min(percentual, 100);
    const inputId = `input-orc-${cat.id}`;

    return `
      <div class="orc-item" data-cat-id="${cat.id}">

        <!-- Identidade da categoria -->
        <div class="orc-item-top">
          <div class="orc-item-cat">
            <span class="orc-emoji">${cat.emoji}</span>
            <div class="orc-item-info">
              <span class="orc-item-nome">${cat.nome}</span>
              <span class="orc-item-gasto">
                Gasto: <strong>${formatarMoeda(gasto)}</strong>
                ${limite ? ` de ${formatarMoeda(limite)}` : ''}
              </span>
            </div>
          </div>

          <!-- Campo de edição do orçamento -->
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
              title="Digite o limite mensal para ${cat.nome}"
            />
          </div>
        </div>

        <!-- Barra de progresso -->
        <div class="orc-progress-track ${!limite ? 'orc-sem-limite' : ''}">
          <div
            class="orc-progress-fill ${classe ? `orc-fill-${classe}` : ''}"
            style="width: ${largura}%"
          ></div>
        </div>

        <!-- Legenda da barra -->
        <div class="orc-item-legenda">
          ${limite
            ? `<span class="${getClasseTexto(classe)}">${percentual}% utilizado</span>`
            : '<span class="orc-sem-limite-texto">Sem limite definido</span>'}
          ${gasto > limite && limite > 0
            ? `<span class="orc-excedeu">⚠️ Excedeu ${formatarMoeda(gasto - limite)}</span>`
            : ''}
        </div>

      </div>
    `;
  }).join('');

  // Reconecta os listeners de input APÓS renderizar
  _categorias.forEach((cat) => {
    const input = document.getElementById(`input-orc-${cat.id}`);
    if (!input) return;

    // Salva com debounce de 800ms após o usuário parar de digitar
    input.addEventListener('input', () => agendarSalvamento(cat.id, input.value));

    // Salva imediatamente ao perder o foco
    input.addEventListener('blur', () => {
      clearTimeout(_debounceTimers[cat.id]);
      executarSalvamento(cat.id, input.value);
    });

    // Salva ao pressionar Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(_debounceTimers[cat.id]);
        executarSalvamento(cat.id, input.value);
        input.blur();
      }
    });
  });
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
