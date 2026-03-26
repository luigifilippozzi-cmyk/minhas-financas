// ============================================================
// PAGE: Base de Dados — RF-018
// Gerenciamento de transações: filtros, paginação, exclusão em lote
// Limpeza total (admin/mestre only)
//
// Nota: a lógica das abas Importar e Duplicatas é tratada
// por importar.js (carregado em paralelo na mesma página).
// Este módulo gerencia: tab switching, Gerenciar e Limpeza.
// ============================================================
import { onAuthChange, logout } from '../services/auth.js';
import {
  buscarPerfil,
  buscarGrupo,
  buscarTodasTransacoes,
  excluirEmMassa,
  purgeGrupoCompleto,
} from '../services/database.js';
import { formatarMoeda, formatarData } from '../utils/formatters.js';

// ── Estado ─────────────────────────────────────────────────────
let _grupoId   = null;
let _usuario   = null;
let _isMestre  = false;

// Gerenciar
let _todasTransacoes = [];   // cache completo do Firestore
let _filtradas       = [];   // após aplicar filtros
let _paginaAtual     = 0;
const POR_PAGINA     = 50;
let _selecionados    = new Set(); // ids selecionados

// ── Inicialização ───────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = '../login.html'; return; }
  _usuario = user;

  let perfil;
  try { perfil = await buscarPerfil(user.uid); } catch (_) { window.location.href = '../login.html'; return; }
  if (!perfil?.grupoId) { window.location.href = '../grupo.html'; return; }

  _grupoId = perfil.grupoId;

  // Verificar isMestre via campo criadoPor do grupo
  try {
    const grupo = await buscarGrupo(_grupoId);
    _isMestre = grupo?.criadoPor === user.uid;
  } catch (_) { _isMestre = false; }

  if (_isMestre) {
    document.getElementById('btn-tab-limpeza')?.classList.remove('hidden');
  }

  configurarTabs();
  configurarGerenciar();
  configurarLimpeza();

  document.getElementById('btn-logout')?.addEventListener('click', () => logout());
});

// ── Tab switching ───────────────────────────────────────────────
function configurarTabs() {
  document.querySelectorAll('.base-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Ativar botão
      document.querySelectorAll('.base-tab-btn').forEach(b => b.classList.remove('base-tab-btn--ativo'));
      btn.classList.add('base-tab-btn--ativo');

      // Mostrar/ocultar conteúdo
      document.querySelectorAll('.base-tab-content').forEach(el => el.classList.add('hidden'));
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');

      // Carregar dados ao entrar na aba Gerenciar
      if (tab === 'gerenciar' && _todasTransacoes.length === 0) {
        carregarTransacoes();
      }
    });
  });
}

// ── Gerenciar: filtros + paginação + exclusão ───────────────────

function configurarGerenciar() {
  document.getElementById('ger-btn-carregar')?.addEventListener('click', () => carregarTransacoes());

  document.getElementById('ger-chk-todos')?.addEventListener('change', (e) => {
    const checks = document.querySelectorAll('.ger-row-chk');
    checks.forEach(chk => {
      chk.checked = e.target.checked;
      const id = chk.dataset.id;
      const col = chk.dataset.colecao;
      if (e.target.checked) _selecionados.add(`${col}::${id}`);
      else _selecionados.delete(`${col}::${id}`);
    });
    atualizarContagem();
  });

  document.getElementById('ger-btn-excluir')?.addEventListener('click', abrirModalExclusao);
  document.getElementById('modal-excluir-cancelar')?.addEventListener('click', fecharModalExclusao);
  document.getElementById('modal-excluir-confirmar')?.addEventListener('click', confirmarExclusao);

  document.getElementById('ger-btn-prev')?.addEventListener('click', () => { _paginaAtual--; renderizarPagina(); });
  document.getElementById('ger-btn-next')?.addEventListener('click', () => { _paginaAtual++; renderizarPagina(); });
}

async function carregarTransacoes() {
  if (!_grupoId) return;

  const loading = document.getElementById('ger-loading');
  const empty   = document.getElementById('ger-empty');
  const wrap    = document.getElementById('ger-tabela-wrap');
  const pagin   = document.getElementById('ger-paginacao');
  const lote    = document.getElementById('ger-acoes-lote');

  loading?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');
  pagin?.classList.add('hidden');
  lote?.classList.add('hidden');
  _selecionados.clear();
  atualizarContagem();

  try {
    _todasTransacoes = await buscarTodasTransacoes(_grupoId);
  } catch (e) {
    console.error('Erro ao buscar transações:', e);
    _todasTransacoes = [];
  }

  loading?.classList.add('hidden');

  // Preencher filtros dinâmicos
  preencherFiltrosAnos();
  preencherFiltrosMeses();
  preencherFiltrosCategorias();

  aplicarFiltros();
}

function preencherFiltrosAnos() {
  const sel = document.getElementById('ger-fil-ano');
  if (!sel) return;
  const anos = [...new Set(_todasTransacoes.map(t => {
    const d = t.data?.toDate ? t.data.toDate() : new Date(t.data);
    return isNaN(d) ? null : d.getFullYear();
  }).filter(Boolean))].sort((a, b) => b - a);

  // Manter seleção atual
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todos os anos</option>';
  anos.forEach(ano => {
    const opt = document.createElement('option');
    opt.value = ano;
    opt.textContent = ano;
    sel.appendChild(opt);
  });
  if (atual) sel.value = atual;
}

function preencherFiltrosMeses() {
  const sel = document.getElementById('ger-fil-mes');
  if (!sel) return;
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todos os meses</option>';
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = MESES[m - 1];
    sel.appendChild(opt);
  }
  if (atual) sel.value = atual;
}

function preencherFiltrosCategorias() {
  const sel = document.getElementById('ger-fil-cat');
  if (!sel) return;
  const cats = [...new Set(_todasTransacoes.map(t => t.categoria).filter(Boolean))].sort();
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as categorias</option>';
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
  if (atual) sel.value = atual;
}

function aplicarFiltros() {
  const tipo = document.getElementById('ger-fil-tipo')?.value ?? 'todos';
  const mes  = document.getElementById('ger-fil-mes')?.value  ?? '';
  const ano  = document.getElementById('ger-fil-ano')?.value  ?? '';
  const cat  = document.getElementById('ger-fil-cat')?.value  ?? '';

  _filtradas = _todasTransacoes.filter(t => {
    if (tipo !== 'todos') {
      if (tipo === 'projecao' && t.tipo !== 'projecao') return false;
      else if (tipo === 'receita' && t._tipo !== 'receita') return false;
      else if (tipo === 'despesa' && (t._tipo !== 'despesa' || t.tipo === 'projecao')) return false;
    }
    if (cat && t.categoria !== cat) return false;
    if (mes || ano) {
      const d = t.data?.toDate ? t.data.toDate() : new Date(t.data);
      if (isNaN(d)) return false;
      if (mes && (d.getMonth() + 1) !== Number(mes)) return false;
      if (ano && d.getFullYear() !== Number(ano)) return false;
    }
    return true;
  });

  _paginaAtual = 0;
  _selecionados.clear();
  renderizarPagina();
}

function renderizarPagina() {
  const empty = document.getElementById('ger-empty');
  const wrap  = document.getElementById('ger-tabela-wrap');
  const pagin = document.getElementById('ger-paginacao');
  const lote  = document.getElementById('ger-acoes-lote');
  const tbody = document.getElementById('ger-tbody');

  if (_filtradas.length === 0) {
    empty?.classList.remove('hidden');
    wrap?.classList.add('hidden');
    pagin?.classList.add('hidden');
    lote?.classList.add('hidden');
    return;
  }

  empty?.classList.add('hidden');
  wrap?.classList.remove('hidden');
  pagin?.classList.remove('hidden');
  lote?.classList.remove('hidden');

  const totalPags = Math.ceil(_filtradas.length / POR_PAGINA);
  _paginaAtual = Math.max(0, Math.min(_paginaAtual, totalPags - 1));

  const inicio = _paginaAtual * POR_PAGINA;
  const pagina = _filtradas.slice(inicio, inicio + POR_PAGINA);

  if (tbody) {
    tbody.innerHTML = '';
    pagina.forEach(t => {
      const tr = document.createElement('tr');
      const colecao = t._tipo === 'receita' ? 'receitas' : 'despesas';
      const chave   = `${colecao}::${t.id}`;
      const checked = _selecionados.has(chave) ? 'checked' : '';

      const d = t.data?.toDate ? t.data.toDate() : new Date(t.data);
      const dataStr = isNaN(d) ? '—' : formatarData(d);
      const valorStr = formatarMoeda(t.valor ?? 0);
      const tipoLabel = _tipoLabel(t);
      const tipoClass = _tipoClass(t);
      const desc = t.descricao ?? t.estabelecimento ?? '—';
      const cat  = t.categoria ?? '—';
      const resp = t.responsavel ?? t.portador ?? '—';

      tr.innerHTML = `
        <td><input type="checkbox" class="ger-row-chk" data-id="${t.id}" data-colecao="${colecao}" ${checked} /></td>
        <td style="white-space:nowrap;">${dataStr}</td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${desc}">${desc}</td>
        <td style="text-align:right;font-weight:600;">${valorStr}</td>
        <td><span class="ger-tipo-badge ${tipoClass}">${tipoLabel}</span></td>
        <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${cat}</td>
        <td style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${resp}</td>
      `;

      tr.querySelector('.ger-row-chk')?.addEventListener('change', (e) => {
        if (e.target.checked) _selecionados.add(chave);
        else _selecionados.delete(chave);
        atualizarContagem();
        // Atualizar "selecionar todos"
        const chkTodos = document.getElementById('ger-chk-todos');
        if (chkTodos) {
          const todos = document.querySelectorAll('.ger-row-chk');
          chkTodos.checked = [...todos].every(c => c.checked);
        }
      });

      tbody.appendChild(tr);
    });
  }

  // Atualizar paginação
  const info = document.getElementById('ger-pagina-info');
  if (info) info.textContent = `Página ${_paginaAtual + 1} de ${totalPags} (${_filtradas.length} registros)`;

  const btnPrev = document.getElementById('ger-btn-prev');
  const btnNext = document.getElementById('ger-btn-next');
  if (btnPrev) btnPrev.disabled = _paginaAtual === 0;
  if (btnNext) btnNext.disabled = _paginaAtual >= totalPags - 1;

  // Reset "selecionar todos"
  const chkTodos = document.getElementById('ger-chk-todos');
  if (chkTodos) chkTodos.checked = false;

  atualizarContagem();
}

function _tipoLabel(t) {
  if (t.tipo === 'projecao') return '📆 Projeção';
  if (t._tipo === 'receita')  return '📥 Receita';
  return '💸 Despesa';
}

function _tipoClass(t) {
  if (t.tipo === 'projecao') return 'ger-tipo-projecao';
  if (t._tipo === 'receita')  return 'ger-tipo-receita';
  return 'ger-tipo-despesa';
}

function atualizarContagem() {
  const n = _selecionados.size;
  const span = document.getElementById('ger-contagem');
  if (span) span.textContent = `${n} selecionado${n !== 1 ? 's' : ''}`;
  const btn = document.getElementById('ger-btn-excluir');
  if (btn) btn.disabled = n === 0;
}

function abrirModalExclusao() {
  const n = _selecionados.size;
  if (n === 0) return;
  const msg = document.getElementById('modal-excluir-msg');
  if (msg) msg.textContent = `Você está prestes a excluir ${n} transação${n !== 1 ? 'ões' : ''} permanentemente.`;
  document.getElementById('modal-excluir-massa')?.classList.remove('hidden');
}

function fecharModalExclusao() {
  document.getElementById('modal-excluir-massa')?.classList.add('hidden');
}

async function confirmarExclusao() {
  const btn = document.getElementById('modal-excluir-confirmar');
  if (btn) { btn.disabled = true; btn.textContent = 'Excluindo…'; }

  const items = [..._selecionados].map(chave => {
    const [colecao, id] = chave.split('::');
    return { id, colecao };
  });

  try {
    await excluirEmMassa(items);
    fecharModalExclusao();
    _selecionados.clear();
    // Remover do cache local
    const deletedIds = new Set(items.map(i => i.id));
    _todasTransacoes = _todasTransacoes.filter(t => !deletedIds.has(t.id));
    aplicarFiltros();
  } catch (e) {
    console.error('Erro ao excluir em massa:', e);
    alert('Erro ao excluir transações. Tente novamente.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Excluir permanentemente'; }
  }
}

// ── Limpeza (admin) ─────────────────────────────────────────────

function configurarLimpeza() {
  const btnAbrir = document.getElementById('btn-abrir-purge-total');
  const modal    = document.getElementById('modal-purge-total');
  const txtInput = document.getElementById('purge-confirm-text');
  const chk      = document.getElementById('purge-confirm-chk');
  const btnConf  = document.getElementById('purge-total-confirmar');
  const btnCanc  = document.getElementById('purge-total-cancelar');

  btnAbrir?.addEventListener('click', () => {
    if (!_isMestre) return;
    if (txtInput) txtInput.value = '';
    if (chk)      chk.checked = false;
    if (btnConf)  btnConf.disabled = true;
    modal?.classList.remove('hidden');
  });

  btnCanc?.addEventListener('click', () => modal?.classList.add('hidden'));

  function validarPurge() {
    if (!btnConf) return;
    btnConf.disabled = !(txtInput?.value === 'PURGAR' && chk?.checked);
  }

  txtInput?.addEventListener('input', validarPurge);
  chk?.addEventListener('change', validarPurge);

  btnConf?.addEventListener('click', async () => {
    if (!_isMestre || !_grupoId) return;
    if (txtInput?.value !== 'PURGAR' || !chk?.checked) return;

    btnConf.disabled = true;
    btnConf.textContent = '⏳ Purgando…';

    try {
      const resultado = await purgeGrupoCompleto(_grupoId);
      modal?.classList.add('hidden');
      const total = resultado.despesas + resultado.receitas + resultado.parcelamentos;
      alert(
        `✅ Purge concluído!\n\n` +
        `Despesas removidas: ${resultado.despesas}\n` +
        `Receitas removidas: ${resultado.receitas}\n` +
        `Parcelamentos removidos: ${resultado.parcelamentos}\n` +
        `Total: ${total} registros`
      );
      // Limpar cache local
      _todasTransacoes = [];
      _filtradas = [];
      _selecionados.clear();
      renderizarPagina();
    } catch (e) {
      console.error('Erro no purge:', e);
      alert('Erro ao purgar a base de dados. Tente novamente.');
    } finally {
      btnConf.disabled = false;
      btnConf.textContent = '🗑️ Purgar agora';
    }
  });
}
