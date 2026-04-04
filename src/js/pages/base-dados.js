// ============================================================
// PAGE: Base de Dados — RF-018 + RF-023
// Gerenciamento de transações: filtros, paginação, exclusão em lote
// RF-023: edição em massa de responsável (batch Firestore ≤ 500)
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
  atualizarResponsavelEmMassa,   // RF-023
  purgeGrupoCompleto,
  ouvirCategorias,
} from '../services/database.js';
import { formatarMoeda, formatarData, escHTML } from '../utils/formatters.js';

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
let _categorias      = [];   // Bug 2: categorias do grupo para filtro e exibição
let _unsubCats       = null;
let _nomesMembros    = {};   // RF-023: { uid: nome } — membros do grupo

// ── Inicialização ───────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = '../login.html'; return; }
  _usuario = user;

  let perfil;
  try { perfil = await buscarPerfil(user.uid); } catch (_) { window.location.href = '../login.html'; return; }
  if (!perfil?.grupoId) { window.location.href = '../grupo.html'; return; }

  _grupoId = perfil.grupoId;

  // Verificar isMestre + carregar membros (RF-023)
  try {
    const grupo = await buscarGrupo(_grupoId);
    _isMestre = grupo?.criadoPor === user.uid;
    _nomesMembros = grupo?.nomesMembros ?? {};
  } catch (_) { _isMestre = false; }

  if (_isMestre) {
    document.getElementById('btn-tab-limpeza')?.classList.remove('hidden');
  }
  preencherSelResp();

  // Bug 2: escuta categorias para filtro e exibição na aba Gerenciar
  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome));
    preencherFiltrosCategorias();
  });

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

      // Issue 7: sempre recarrega ao entrar em Gerenciar para refletir novas importações
      if (tab === 'gerenciar') {
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

  // RF-023: responsável em massa
  document.getElementById('ger-sel-resp')?.addEventListener('change', () => atualizarContagem());
  document.getElementById('ger-btn-resp')?.addEventListener('click', confirmarAtualizacaoResp);

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
  preencherFiltrosResponsaveis();  // RF-023

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
  // Bug 2: usa categorias do grupo (categoriaId como value, nome para exibição)
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as categorias</option>';
  _categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.emoji ?? ''} ${cat.nome}`.trim();
    sel.appendChild(opt);
  });
  if (atual) sel.value = atual;
}

// RF-023: preenche filtro por responsável com nomes únicos do cache
function preencherFiltrosResponsaveis() {
  const sel = document.getElementById('ger-fil-resp');
  if (!sel) return;
  const atual = sel.value;
  const nomes = [...new Set(
    _todasTransacoes
      .map(t => t.responsavel ?? t.portador ?? '')
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
  sel.innerHTML = '<option value="">Todos os responsáveis</option>' +
    nomes.map(n => `<option value="${escHTML(n)}">${escHTML(n)}</option>`).join('');
  if (atual) sel.value = atual;
}

// RF-023: preenche seletor de ação em lote com membros do grupo
function preencherSelResp() {
  const sel = document.getElementById('ger-sel-resp');
  if (!sel) return;
  const nomes = Object.values(_nomesMembros);
  sel.innerHTML = '<option value="">— selecione —</option>' +
    nomes.map(n => `<option value="${n}">${n}</option>`).join('');
}

function aplicarFiltros() {
  const tipo = document.getElementById('ger-fil-tipo')?.value ?? 'todos';
  const mes  = document.getElementById('ger-fil-mes')?.value  ?? '';
  const ano  = document.getElementById('ger-fil-ano')?.value  ?? '';
  const cat  = document.getElementById('ger-fil-cat')?.value  ?? '';
  const resp = document.getElementById('ger-fil-resp')?.value ?? '';  // RF-023

  _filtradas = _todasTransacoes.filter(t => {
    if (tipo !== 'todos') {
      if (tipo === 'projecao' && t.tipo !== 'projecao') return false;
      else if (tipo === 'receita' && t._tipo !== 'receita') return false;
      else if (tipo === 'despesa' && (t._tipo !== 'despesa' || t.tipo === 'projecao')) return false;
    }
    if (cat && t.categoriaId !== cat) return false;  // Bug 2: comparar por categoriaId
    if (resp && (t.responsavel ?? t.portador ?? '') !== resp) return false;  // RF-023
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
      const desc    = t.descricao ?? t.estabelecimento ?? '—';
      // Bug 2: exibe nome da categoria em vez do ID
      const catObj  = _categorias.find(c => c.id === t.categoriaId);
      const catNome = catObj ? `${catObj.emoji ?? ''} ${catObj.nome}`.trim() : (t.categoriaId ?? '—');
      const resp    = t.responsavel ?? t.portador ?? '—';

      tr.innerHTML = `
        <td><input type="checkbox" class="ger-row-chk" data-id="${t.id}" data-colecao="${colecao}" ${checked} /></td>
        <td style="white-space:nowrap;">${dataStr}</td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHTML(desc)}">${escHTML(desc)}</td>
        <td style="text-align:right;font-weight:600;">${valorStr}</td>
        <td><span class="ger-tipo-badge ${tipoClass}">${tipoLabel}</span></td>
        <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHTML(catNome)}</td>
        <td style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHTML(resp)}</td>
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
  // RF-023: habilita botão Aplicar apenas quando há seleção E responsável escolhido
  const btnResp = document.getElementById('ger-btn-resp');
  const selResp = document.getElementById('ger-sel-resp');
  if (btnResp) btnResp.disabled = n === 0 || !selResp?.value;
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
    // Bug 3: usa chave coleção::id para evitar remoção incorreta por ID coincidente
    const deletedKeys = new Set(items.map(i => `${i.colecao}::${i.id}`));
    _selecionados.clear();
    _todasTransacoes = _todasTransacoes.filter(t => {
      const col = t._tipo === 'receita' ? 'receitas' : 'despesas';
      return !deletedKeys.has(`${col}::${t.id}`);
    });
    aplicarFiltros();
  } catch (e) {
    console.error('Erro ao excluir em massa:', e);
    alert('Erro ao excluir transações. Tente novamente.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Excluir permanentemente'; }
  }
}

// ── RF-023: Edição em massa de responsável ──────────────────────

async function confirmarAtualizacaoResp() {
  const responsavel = document.getElementById('ger-sel-resp')?.value;
  if (!responsavel || _selecionados.size === 0) return;

  const btnResp = document.getElementById('ger-btn-resp');
  if (btnResp) { btnResp.disabled = true; btnResp.textContent = '⏳'; }

  const items = [..._selecionados].map(chave => {
    const [colecao, id] = chave.split('::');
    return { id, colecao };
  });

  try {
    await atualizarResponsavelEmMassa(items, responsavel);
    // Atualiza cache local sem recarregar do Firestore
    const updatedKeys = new Set(items.map(i => `${i.colecao}::${i.id}`));
    const atualizar = t => {
      const col = t._tipo === 'receita' ? 'receitas' : 'despesas';
      return updatedKeys.has(`${col}::${t.id}`) ? { ...t, responsavel, portador: responsavel } : t;
    };
    _todasTransacoes = _todasTransacoes.map(atualizar);
    _filtradas       = _filtradas.map(atualizar);
    renderizarPagina();
    const n = items.length;
    mostrarToast(`✅ ${n} transaç${n !== 1 ? 'ões' : 'ão'} atualizada${n !== 1 ? 's' : ''} — responsável: ${responsavel}`);
  } catch (e) {
    console.error('Erro ao atualizar responsável em massa:', e);
    mostrarToast('❌ Erro ao atualizar. Tente novamente.', true);
  } finally {
    if (btnResp) { btnResp.disabled = false; btnResp.textContent = '👤 Aplicar'; }
  }
}

// Toast de feedback (aparece por 3,5 s no canto inferior direito)
function mostrarToast(mensagem, isErro = false) {
  let toast = document.getElementById('ger-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ger-toast';
    toast.style.cssText = [
      'position:fixed', 'bottom:1.5rem', 'right:1.5rem', 'z-index:9999',
      'padding:.75rem 1.25rem', 'border-radius:8px', 'font-size:.9rem',
      'font-weight:600', 'box-shadow:0 4px 12px rgba(0,0,0,.15)',
      'transition:opacity .3s', 'max-width:360px',
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.style.background = isErro ? 'var(--color-danger-light)'  : 'var(--color-income-bg)';
  toast.style.color      = isErro ? 'var(--color-danger)'       : 'var(--color-income-dark)';
  toast.style.border     = isErro ? '1px solid var(--color-danger)' : '1px solid var(--color-income-border)';
  toast.style.opacity    = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
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
      mostrarToast(`✅ Purge concluído — ${total} registros removidos (${resultado.despesas} despesas, ${resultado.receitas} receitas, ${resultado.parcelamentos} parcelamentos)`);
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
