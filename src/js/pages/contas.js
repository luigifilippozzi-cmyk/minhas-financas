// ============================================================
// PAGE: Contas e Cartões — RF-062
// CRUD de contas bancárias e cartões de crédito individuais.
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import {
  buscarPerfil,
  buscarGrupo,
  ouvirContas,
  criarConta,
  atualizarConta,
  excluirConta,
  temCartaoLegado,
  temCartaoReal,
  garantirContasPadrao,
} from '../services/database.js';
import { modelConta, CONTAS_PADRAO, BANDEIRAS_CARTAO } from '../models/Conta.js';
import { BANK_FINGERPRINTS } from '../utils/bankFingerprintMap.js';
import { escHTML } from '../utils/formatters.js';

// ── Estado ────────────────────────────────────────────────────
let _grupoId       = null;
let _grupo         = null;
let _contas        = [];
let _unsubContas   = null;
let _editandoId    = null;    // null = novo, string = editando
let _nomesMembros  = {};      // { uid: nome }

// ── Inicialização ─────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  let perfil;
  try { perfil = await buscarPerfil(user.uid); } catch (_) { window.location.href = 'login.html'; return; }
  if (!perfil?.grupoId) { window.location.href = 'grupo.html'; return; }

  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;
  document.getElementById('btn-logout').addEventListener('click', () => logout().then(() => { window.location.href = 'login.html'; }));

  _grupo = await buscarGrupo(_grupoId);
  _nomesMembros = _grupo?.nomesMembros ?? {};

  await garantirContasPadrao(_grupoId, CONTAS_PADRAO).catch(() => {});

  // Preencher select de emissores a partir do bankFingerprintMap
  preencherEmissores();

  configurarEventos();

  _unsubContas = ouvirContas(_grupoId, (contas) => {
    _contas = contas;
    renderizarListas();
    verificarBannerMigracao();
  });
});

// ── Preencher selects ─────────────────────────────────────────

function preencherEmissores() {
  const sel = document.getElementById('sel-cartao-emissor');
  sel.innerHTML = '<option value="">— selecione —</option>' +
    BANK_FINGERPRINTS.map(b => `<option value="${b.id}">${b.emoji} ${escHTML(b.label)}</option>`).join('');
}

function preencherContasPagadoras() {
  const sel = document.getElementById('sel-cartao-pagadora');
  const bancos = _contas.filter(c => c.tipo === 'banco');
  sel.innerHTML = '<option value="">— nenhuma —</option>' +
    bancos.map(c => `<option value="${c.id}">${c.emoji} ${escHTML(c.nome)}</option>`).join('');
}

function preencherTitulares() {
  const sel = document.getElementById('sel-cartao-titular');
  sel.innerHTML = '<option value="">— nenhum —</option>' +
    Object.entries(_nomesMembros).map(([uid, nome]) =>
      `<option value="${uid}">${escHTML(nome)}</option>`
    ).join('');
}

// ── Banner de migração ────────────────────────────────────────

async function verificarBannerMigracao() {
  const banner = document.getElementById('banner-migracao');
  if (!banner) return;
  try {
    const legado = await temCartaoLegado(_grupoId);
    const real   = await temCartaoReal(_grupoId);
    banner.classList.toggle('hidden', !legado || real);
  } catch (_) {
    banner.classList.add('hidden');
  }
}

// ── Renderização ──────────────────────────────────────────────

function renderizarListas() {
  const cartoes = _contas.filter(c => c.tipo === 'cartao' && !c._legado);
  const bancos  = _contas.filter(c => c.tipo !== 'cartao' || c._legado);

  const cartoesEl = document.getElementById('cartoes-lista');
  const bancosEl  = document.getElementById('bancos-lista');

  if (!cartoes.length) {
    cartoesEl.innerHTML = '<p class="empty-state">Nenhum cartão cadastrado. Clique em "+ Novo Cartão" para adicionar.</p>';
  } else {
    cartoesEl.innerHTML = cartoes.map(c => renderCartao(c)).join('');
  }

  if (!bancos.length) {
    bancosEl.innerHTML = '<p class="empty-state">Nenhuma conta bancária.</p>';
  } else {
    bancosEl.innerHTML = bancos.map(c => renderBanco(c)).join('');
  }

  // Bind eventos dos botões
  cartoesEl.querySelectorAll('.btn-editar-cartao').forEach(btn => {
    btn.addEventListener('click', () => abrirModalCartao(btn.dataset.id));
  });
  cartoesEl.querySelectorAll('.btn-desativar-cartao').forEach(btn => {
    btn.addEventListener('click', () => desativarConta(btn.dataset.id));
  });
  bancosEl.querySelectorAll('.btn-editar-saldo').forEach(btn => {
    btn.addEventListener('click', () => abrirModalSaldo(btn.dataset.id));
  });
}

function renderCartao(c) {
  const emissorLabel = BANK_FINGERPRINTS.find(b => b.id === c.emissor)?.label ?? '';
  const bandeiraLabel = c.bandeira ? c.bandeira.charAt(0).toUpperCase() + c.bandeira.slice(1) : '';
  const ultimos = c.ultimos4 ? `****${escHTML(c.ultimos4)}` : '';
  const detalhes = [emissorLabel, bandeiraLabel, ultimos].filter(Boolean).join(' · ');
  const fechVenc = [
    c.diaFechamento ? `Fecha: dia ${c.diaFechamento}` : '',
    c.diaVencimento ? `Vence: dia ${c.diaVencimento}` : '',
  ].filter(Boolean).join(' | ');

  return `<div class="cat-item" style="border-left:4px solid ${escHTML(c.cor ?? '#7B1FA2')};">
    <div class="cat-item-main">
      <span class="cat-emoji">${escHTML(c.emoji)}</span>
      <div class="cat-info">
        <span class="cat-nome">${escHTML(c.nome)}</span>
        ${detalhes ? `<span class="cat-desc" style="font-size:.82rem;color:var(--text-muted);">${escHTML(detalhes)}</span>` : ''}
        ${fechVenc ? `<span class="cat-desc" style="font-size:.78rem;color:var(--text-muted);">${escHTML(fechVenc)}</span>` : ''}
      </div>
    </div>
    <div class="cat-actions">
      <button class="btn btn-outline btn-sm btn-editar-cartao" data-id="${c.id}">Editar</button>
      <button class="btn btn-outline btn-sm btn-desativar-cartao" data-id="${c.id}" style="color:var(--danger);">Desativar</button>
    </div>
  </div>`;
}

function renderBanco(c) {
  const legadoTag = c._legado ? ' <span style="font-size:.75rem;background:var(--warning-bg,#fff3cd);padding:2px 6px;border-radius:4px;">legado</span>' : '';
  const saldoTag  = c.saldoInicial != null && c.dataReferenciaSaldo
    ? `<span class="cat-desc" style="font-size:.78rem;color:var(--text-muted);">Saldo ref: R$ ${escHTML(Number(c.saldoInicial).toFixed(2).replace('.', ','))} em ${escHTML(c.dataReferenciaSaldo)}</span>`
    : '';
  return `<div class="cat-item" style="border-left:4px solid ${escHTML(c.cor ?? '#546E7A')};opacity:${c._legado ? '.6' : '1'};">
    <div class="cat-item-main">
      <span class="cat-emoji">${escHTML(c.emoji)}</span>
      <div class="cat-info">
        <span class="cat-nome">${escHTML(c.nome)}${legadoTag}</span>
        <span class="cat-desc" style="font-size:.82rem;color:var(--text-muted);">${escHTML(c.tipo === 'dinheiro' ? 'Dinheiro' : 'Conta bancária')}</span>
        ${saldoTag}
      </div>
    </div>
    <div class="cat-actions">
      <button class="btn btn-outline btn-sm btn-editar-saldo" data-id="${escHTML(c.id)}">Saldo</button>
    </div>
  </div>`;
}

// ── Modal ─────────────────────────────────────────────────────

// ── Modal de Saldo (RF-068) ───────────────────────────────────

let _editandoSaldoId = null;

function abrirModalSaldo(contaId) {
  _editandoSaldoId = contaId;
  const c = _contas.find(x => x.id === contaId);
  if (!c) return;

  document.getElementById('modal-saldo-titulo').textContent = `Saldo — ${c.nome}`;
  document.getElementById('inp-saldo-inicial').value   = c.saldoInicial != null ? Number(c.saldoInicial) : '';
  document.getElementById('inp-data-referencia').value = c.dataReferenciaSaldo ?? '';
  document.getElementById('modal-saldo-banco').classList.remove('hidden');
}

function fecharModalSaldo() {
  document.getElementById('modal-saldo-banco').classList.add('hidden');
  _editandoSaldoId = null;
}

async function salvarSaldo(e) {
  e.preventDefault();
  if (!_editandoSaldoId) return;
  // Verificar se a conta realmente pertence ao grupo atual (defense-in-depth)
  if (!_contas.find(x => x.id === _editandoSaldoId)) return;

  const saldoInicial        = parseFloat(document.getElementById('inp-saldo-inicial').value);
  const dataReferenciaSaldo = document.getElementById('inp-data-referencia').value;

  if (isNaN(saldoInicial) || !dataReferenciaSaldo) return;

  try {
    await atualizarConta(_editandoSaldoId, { saldoInicial, dataReferenciaSaldo });
    fecharModalSaldo();
  } catch (err) {
    console.error('[contas] Erro ao salvar saldo:', err);
    alert('Erro ao salvar saldo. Tente novamente.');
  }
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  document.getElementById('btn-novo-cartao').addEventListener('click', () => abrirModalCartao(null));
  document.getElementById('btn-fechar-modal-cartao').addEventListener('click', fecharModalCartao);
  document.getElementById('btn-cancelar-cartao').addEventListener('click', fecharModalCartao);
  document.getElementById('form-cartao').addEventListener('submit', salvarCartao);

  // Fechar modal ao clicar fora
  document.getElementById('modal-cartao').addEventListener('click', (e) => {
    if (e.target.id === 'modal-cartao') fecharModalCartao();
  });

  // RF-068: modal de saldo inicial
  document.getElementById('btn-fechar-modal-saldo').addEventListener('click', fecharModalSaldo);
  document.getElementById('btn-cancelar-saldo').addEventListener('click', fecharModalSaldo);
  document.getElementById('form-saldo-banco').addEventListener('submit', salvarSaldo);
  document.getElementById('modal-saldo-banco').addEventListener('click', (e) => {
    if (e.target.id === 'modal-saldo-banco') fecharModalSaldo();
  });
}

function abrirModalCartao(contaId) {
  _editandoId = contaId;
  preencherContasPagadoras();
  preencherTitulares();

  const titulo = document.getElementById('modal-cartao-titulo');
  const form   = document.getElementById('form-cartao');
  form.reset();

  if (contaId) {
    titulo.textContent = 'Editar Cartão';
    const c = _contas.find(x => x.id === contaId);
    if (c) {
      document.getElementById('inp-cartao-nome').value       = c.nome ?? '';
      document.getElementById('sel-cartao-emissor').value     = c.emissor ?? '';
      document.getElementById('sel-cartao-bandeira').value    = c.bandeira ?? '';
      document.getElementById('inp-cartao-ultimos4').value    = c.ultimos4 ?? '';
      document.getElementById('inp-cartao-fechamento').value  = c.diaFechamento ?? '';
      document.getElementById('inp-cartao-vencimento').value  = c.diaVencimento ?? '';
      document.getElementById('sel-cartao-pagadora').value    = c.contaPagadoraId ?? '';
      document.getElementById('sel-cartao-titular').value     = c.titularPadraoId ?? '';
      document.getElementById('inp-cartao-emoji').value       = c.emoji ?? '💳';
      document.getElementById('inp-cartao-cor').value         = c.cor ?? '#7B1FA2';
    }
  } else {
    titulo.textContent = 'Novo Cartão';
    document.getElementById('inp-cartao-emoji').value = '💳';
    document.getElementById('inp-cartao-cor').value   = '#7B1FA2';
  }

  document.getElementById('modal-cartao').classList.remove('hidden');
}

function fecharModalCartao() {
  document.getElementById('modal-cartao').classList.add('hidden');
  _editandoId = null;
}

async function salvarCartao(e) {
  e.preventDefault();

  const dados = modelConta({
    grupoId:        _grupoId,
    nome:           document.getElementById('inp-cartao-nome').value,
    tipo:           'cartao',
    emoji:          document.getElementById('inp-cartao-emoji').value || '💳',
    cor:            document.getElementById('inp-cartao-cor').value || '#7B1FA2',
    emissor:        document.getElementById('sel-cartao-emissor').value || undefined,
    bandeira:       document.getElementById('sel-cartao-bandeira').value || undefined,
    ultimos4:       document.getElementById('inp-cartao-ultimos4').value || undefined,
    diaFechamento:  document.getElementById('inp-cartao-fechamento').value || undefined,
    diaVencimento:  document.getElementById('inp-cartao-vencimento').value || undefined,
    contaPagadoraId: document.getElementById('sel-cartao-pagadora').value || undefined,
    titularPadraoId: document.getElementById('sel-cartao-titular').value || undefined,
  });

  try {
    if (_editandoId) {
      await atualizarConta(_editandoId, dados);
    } else {
      await criarConta(dados);
    }
    fecharModalCartao();
  } catch (err) {
    console.error('[contas] Erro ao salvar cartão:', err);
    alert('Erro ao salvar cartão. Tente novamente.');
  }
}

async function desativarConta(contaId) {
  if (!confirm('Desativar este cartão? Despesas vinculadas não serão afetadas.')) return;
  try {
    await excluirConta(contaId);
  } catch (err) {
    console.error('[contas] Erro ao desativar:', err);
  }
}
