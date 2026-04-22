// ============================================================
// PAGE: Patrimônio — RF-066
// ============================================================

import { onAuthChange, logout } from '../services/auth.js';
import {
  buscarPerfil,
  ouvirContas,
  ouvirInvestimentos,
  ouvirPassivosExtrajudiciais,
  ouvirDespesas,
  ouvirReceitas,
  ouvirDespesasDesdeData,
  ouvirReceitasDesdeData,
  criarInvestimento,
  atualizarInvestimento,
  arquivarInvestimento,
  criarPassivoExtrajudicial,
  atualizarPassivoExtrajudicial,
  salvarSnapshotPatrimonial,
  buscarHistoricoPatrimonial,
} from '../services/database.js';
import { modelInvestimento } from '../models/Investimento.js';
import { modelPassivoExtrajudicial } from '../models/PassivoExtrajudicial.js';
import { formatarMoeda, formatarData, escHTML } from '../utils/formatters.js';
import { dataHoje, isMovimentacaoReal } from '../utils/helpers.js';
import { skeletonPatrimonioItems } from '../utils/skeletons.js';

// ── Estado da página ──────────────────────────────────────────
let _usuario       = null;
let _grupoId       = null;
let _contas        = [];
let _investimentos = [];
let _passivos      = [];
let _despesasTodas = [];
let _receitasTodas = [];
let _despesasMes   = [];
let _receitasMes   = [];

let _unsubContas    = null;
let _unsubInv       = null;
let _unsubPass      = null;
let _unsubDespTodas = null;
let _unsubRecTodas  = null;
let _unsubDespMes   = null;
let _unsubRecMes    = null;

let _chartEvolucao = null;
let _editandoInvId  = null;
let _editandoPassId = null;
let _confirmarCb    = null;

const HOJE   = new Date();
const MES    = HOJE.getMonth() + 1;
const ANO    = HOJE.getFullYear();
const HOJE_STR = dataHoje();

// ── Inicialização ─────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  _usuario = user;
  let perfil;
  try { perfil = await buscarPerfil(user.uid); } catch (_) { window.location.href = 'login.html'; return; }
  if (!perfil?.grupoId) { window.location.href = 'grupo.html'; return; }

  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;
  document.getElementById('btn-logout').addEventListener('click', () =>
    logout().then(() => { window.location.href = 'login.html'; })
  );

  configurarEventos();
  iniciarListeners();
  carregarHistorico();

  // Snapshot automático no 1º dia do mês
  if (HOJE.getDate() === 1) agendarSnapshotAutomatico();
});

// ── Listeners ────────────────────────────────────────────────

function iniciarListeners() {
  const listaInv  = document.getElementById('lista-investimentos');
  const listaPass = document.getElementById('lista-passivos');
  if (listaInv)  listaInv.innerHTML  = skeletonPatrimonioItems(3);
  if (listaPass) listaPass.innerHTML = skeletonPatrimonioItems(2);

  _unsubContas = ouvirContas(_grupoId, (contas) => {
    _contas = contas;
    reiniciarListenersTransacoes();
  });

  _unsubInv = ouvirInvestimentos(_grupoId, (inv) => {
    _investimentos = inv;
    renderizarTudo();
  });

  _unsubPass = ouvirPassivosExtrajudiciais(_grupoId, (pass) => {
    _passivos = pass;
    renderizarTudo();
  });

  // Mês atual para taxa de poupança
  _unsubDespMes = ouvirDespesas(_grupoId, MES, ANO, (desp) => {
    _despesasMes = desp;
    renderizarKPIs();
  });

  _unsubRecMes = ouvirReceitas(_grupoId, MES, ANO, (rec) => {
    _receitasMes = rec;
    renderizarKPIs();
  });
}

function reiniciarListenersTransacoes() {
  // Calcular data mínima de referência entre contas bancárias
  const bancos = _contas.filter((c) => c.tipo === 'banco' && c.ativa !== false && c.saldoInicial != null && c.dataReferenciaSaldo);
  const datas  = bancos.map((c) => new Date(c.dataReferenciaSaldo)).filter((d) => !isNaN(d));
  const minData = datas.length ? new Date(Math.min(...datas)) : (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d; })();

  if (_unsubDespTodas) { _unsubDespTodas(); _unsubDespTodas = null; }
  if (_unsubRecTodas)  { _unsubRecTodas();  _unsubRecTodas  = null; }

  _unsubDespTodas = ouvirDespesasDesdeData(_grupoId, minData, (desp) => {
    _despesasTodas = desp;
    renderizarKPIs();
  });

  _unsubRecTodas = ouvirReceitasDesdeData(_grupoId, minData, (rec) => {
    _receitasTodas = rec;
    renderizarKPIs();
  });
}

// ── Cálculos de Patrimônio ─────────────────────────────────────

function calcularSaldoContas() {
  const bancos = _contas.filter((c) => c.tipo === 'banco' && c.ativa !== false && c.saldoInicial != null && c.dataReferenciaSaldo);
  return bancos.reduce((total, conta) => {
    const ref = new Date(conta.dataReferenciaSaldo);
    const entradas = _receitasTodas
      .filter((r) => r.contaId === conta.id && isMovimentacaoReal(r) && _toDate(r.data) >= ref)
      .reduce((s, r) => s + (r.valor ?? 0), 0);
    const saidas = _despesasTodas
      .filter((d) => d.contaId === conta.id && isMovimentacaoReal(d) && _toDate(d.data) >= ref)
      .reduce((s, d) => s + (d.valor ?? 0), 0);
    return total + (conta.saldoInicial ?? 0) + entradas - saidas;
  }, 0);
}

function calcularTotalInvestimentos() {
  return _investimentos
    .filter((i) => i.ativo !== false)
    .reduce((s, i) => s + (i.valorAtual ?? 0), 0);
}

function calcularTotalPassivos() {
  return _passivos
    .filter((p) => p.status !== 'quitada')
    .reduce((s, p) => s + (p.valorAtualizado ?? p.valorOriginal ?? 0), 0);
}

function calcularTaxaPoupanca() {
  const receitasReais  = _receitasMes.filter(isMovimentacaoReal).reduce((s, r) => s + (r.valor ?? 0), 0);
  const despesasReais  = _despesasMes.filter(isMovimentacaoReal).reduce((s, d) => s + (d.valor ?? 0), 0);
  if (receitasReais <= 0) return null;
  return ((receitasReais - despesasReais) / receitasReais) * 100;
}

function _toDate(d) {
  return d?.toDate ? d.toDate() : new Date(d);
}

// ── Renderização ──────────────────────────────────────────────

function renderizarTudo() {
  renderizarKPIs();
  renderizarInvestimentos();
  renderizarPassivos();
}

function renderizarKPIs() {
  const saldoContas       = calcularSaldoContas();
  const totalInv          = calcularTotalInvestimentos();
  const totalAtivos       = saldoContas + totalInv;
  const totalPassivos     = calcularTotalPassivos();
  const patrimonioLiquido = totalAtivos - totalPassivos;
  const taxaPoupanca      = calcularTaxaPoupanca();

  const plColor = patrimonioLiquido >= 0 ? 'var(--color-income)' : 'var(--color-expense)';
  const taxaStr = taxaPoupanca != null
    ? `${taxaPoupanca >= 0 ? '+' : ''}${taxaPoupanca.toFixed(1)}%`
    : '—';
  const taxaColor = taxaPoupanca == null ? 'var(--color-text-muted)'
    : taxaPoupanca >= 0 ? 'var(--color-income)' : 'var(--color-expense)';

  document.getElementById('cards-pl').innerHTML = `
    <div class="resumo-card">
      <div class="card-label">Saldo Contas</div>
      <div class="card-value" style="color:var(--color-balance)">${escHTML(formatarMoeda(saldoContas))}</div>
      <div class="card-sub">${escHTML(String(_contas.filter((c) => c.tipo === 'banco' && c.ativa !== false && c.saldoInicial != null).length))} conta(s)</div>
    </div>
    <div class="resumo-card">
      <div class="card-label">Investimentos</div>
      <div class="card-value" style="color:var(--color-income)">${escHTML(formatarMoeda(totalInv))}</div>
      <div class="card-sub">${escHTML(String(_investimentos.filter((i) => i.ativo !== false).length))} ativo(s)</div>
    </div>
    <div class="resumo-card">
      <div class="card-label">Total Ativos</div>
      <div class="card-value" style="color:var(--color-income)">${escHTML(formatarMoeda(totalAtivos))}</div>
      <div class="card-sub">Contas + Investimentos</div>
    </div>
    <div class="resumo-card">
      <div class="card-label">Passivos Ativos</div>
      <div class="card-value" style="color:var(--color-expense)">${escHTML(formatarMoeda(totalPassivos))}</div>
      <div class="card-sub">${escHTML(String(_passivos.filter((p) => p.status !== 'quitada').length))} dívida(s)</div>
    </div>
    <div class="resumo-card">
      <div class="card-label">Patrimônio Líquido</div>
      <div class="card-value" style="color:${plColor}">${escHTML(formatarMoeda(patrimonioLiquido))}</div>
      <div class="card-sub">Ativos − Passivos</div>
    </div>
    <div class="resumo-card">
      <div class="card-label">Taxa de Poupança</div>
      <div class="card-value" style="color:${taxaColor}">${escHTML(taxaStr)}</div>
      <div class="card-sub">Mês atual</div>
    </div>
  `;
}

const TIPO_LABEL = {
  renda_fixa: 'Renda Fixa',
  renda_variavel: 'Renda Variável',
  previdencia: 'Previdência',
  criptoativo: 'Criptoativo',
  outro: 'Outro',
};

const STATUS_LABEL = {
  em_acompanhamento: 'Em Acompanhamento',
  em_negociacao: 'Em Negociação',
  parcelada: 'Parcelada',
  quitada: 'Quitada',
};

function renderizarInvestimentos() {
  const container = document.getElementById('lista-investimentos');
  if (!_investimentos.length) {
    container.innerHTML = '<p style="color:var(--color-text-muted);padding:var(--space-4);">Nenhum investimento cadastrado.</p>';
    return;
  }

  const agora = new Date();
  const linhas = _investimentos.map((inv) => {
    const dataAtual = inv.dataAtualizacao?.toDate ? inv.dataAtualizacao.toDate() : new Date(inv.dataAtualizacao ?? 0);
    const diasSemAtualizar = Math.floor((agora - dataAtual) / (1000 * 60 * 60 * 24));
    const alertaDesatualizado = diasSemAtualizar > 30
      ? `<span class="badge badge-warning" title="${escHTML(String(diasSemAtualizar))} dias sem atualização">⚠ ${escHTML(String(diasSemAtualizar))}d</span>`
      : '';

    const rendimento = inv.valorAplicado > 0
      ? ((inv.valorAtual - inv.valorAplicado) / inv.valorAplicado * 100).toFixed(2)
      : '0.00';
    const rendColor = Number(rendimento) >= 0 ? 'var(--color-income)' : 'var(--color-expense)';

    return `
      <div class="transaction-item" data-id="${escHTML(inv.id)}">
        <div class="transaction-info">
          <span class="transaction-desc">${escHTML(inv.nome)}</span>
          <span class="transaction-meta">
            ${escHTML(TIPO_LABEL[inv.tipo] ?? inv.tipo)} · ${escHTML(inv.instituicao || '—')} ${alertaDesatualizado}
          </span>
        </div>
        <div class="transaction-values">
          <span class="transaction-value">${escHTML(formatarMoeda(inv.valorAtual ?? 0))}</span>
          <span style="font-size:.78rem;color:${rendColor};">${Number(rendimento) >= 0 ? '+' : ''}${escHTML(rendimento)}%</span>
        </div>
        <div class="transaction-actions">
          <button class="btn btn-outline btn-sm btn-editar-inv" data-id="${escHTML(inv.id)}">Editar</button>
          <button class="btn btn-outline btn-sm btn-arquivar-inv" data-id="${escHTML(inv.id)}" title="Arquivar">🗂</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = linhas;

  container.querySelectorAll('.btn-editar-inv').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalInvestimento(btn.dataset.id));
  });
  container.querySelectorAll('.btn-arquivar-inv').forEach((btn) => {
    btn.addEventListener('click', () => confirmarArquivarInvestimento(btn.dataset.id));
  });
}

function renderizarPassivos() {
  const container = document.getElementById('lista-passivos');
  if (!_passivos.length) {
    container.innerHTML = '<p style="color:var(--color-text-muted);padding:var(--space-4);">Nenhuma dívida extrajudicial cadastrada.</p>';
    return;
  }

  const linhas = _passivos.map((p) => {
    const statusColor = p.status === 'quitada' ? 'var(--color-ok)' : 'var(--color-expense)';
    return `
      <div class="transaction-item" data-id="${escHTML(p.id)}" style="${p.status === 'quitada' ? 'opacity:.6;' : ''}">
        <div class="transaction-info">
          <span class="transaction-desc">${escHTML(p.credor)}</span>
          <span class="transaction-meta">${escHTML(p.descricao || '—')}</span>
        </div>
        <div class="transaction-values">
          <span class="transaction-value" style="color:var(--color-expense)">${escHTML(formatarMoeda(p.valorAtualizado ?? p.valorOriginal ?? 0))}</span>
          <span style="font-size:.78rem;color:${statusColor};">${escHTML(STATUS_LABEL[p.status] ?? p.status)}</span>
        </div>
        <div class="transaction-actions">
          <button class="btn btn-outline btn-sm btn-editar-pass" data-id="${escHTML(p.id)}">Editar</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = linhas;

  container.querySelectorAll('.btn-editar-pass').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalPassivo(btn.dataset.id));
  });
}

// ── Gráfico de Evolução ───────────────────────────────────────

async function carregarHistorico() {
  try {
    const historico = await buscarHistoricoPatrimonial(_grupoId);
    renderizarGrafico(historico);
  } catch (err) {
    console.error('[patrimonio] Erro ao carregar histórico:', err);
  }
}

function renderizarGrafico(historico) {
  const ctx = document.getElementById('chart-evolucao').getContext('2d');
  if (_chartEvolucao) { _chartEvolucao.destroy(); _chartEvolucao = null; }

  if (!historico.length) {
    ctx.canvas.parentElement.innerHTML = '<p style="color:var(--color-text-muted);padding:var(--space-4);text-align:center;">Nenhum histórico patrimonial. Salve um snapshot para iniciar.</p>';
    return;
  }

  _chartEvolucao = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historico.map((h) => h.mesAno),
      datasets: [
        {
          label: 'Patrimônio Líquido',
          data: historico.map((h) => h.patrimonioLiquido ?? 0),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Total Ativos',
          data: historico.map((h) => h.totalAtivos ?? 0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Total Passivos',
          data: historico.map((h) => h.totalPassivos ?? 0),
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244,63,94,0.08)',
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: {
          ticks: {
            callback: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v),
          },
        },
      },
    },
  });
}

// ── Snapshot ──────────────────────────────────────────────────

function _feedbackSnapshot(msg, isErro = false) {
  const el = document.getElementById('snapshot-feedback');
  if (!el) return;
  el.textContent = msg;
  el.className = `plan-feedback ${isErro ? 'plan-feedback-erro' : 'plan-feedback-ok'}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

async function salvarSnapshot() {
  const saldoContas       = calcularSaldoContas();
  const totalInv          = calcularTotalInvestimentos();
  const totalAtivos       = saldoContas + totalInv;
  const totalPassivos     = calcularTotalPassivos();
  const patrimonioLiquido = totalAtivos - totalPassivos;
  const taxaPoupanca      = calcularTaxaPoupanca();

  const mesAno = `${ANO}-${String(MES).padStart(2, '0')}`;
  try {
    await salvarSnapshotPatrimonial(_grupoId, mesAno, {
      totalAtivos,
      totalPassivos,
      patrimonioLiquido,
      taxaPoupanca: taxaPoupanca ?? 0,
      saldoContas,
      totalInvestimentos: totalInv,
    });
    _feedbackSnapshot(`✅ Snapshot ${mesAno} salvo`);
    carregarHistorico();
  } catch (err) {
    console.error('[patrimonio] Erro ao salvar snapshot:', err);
    _feedbackSnapshot('Não consegui salvar o snapshot. Tente novamente.', true);
  }
}

function agendarSnapshotAutomatico() {
  const mesAno = `${ANO}-${String(MES).padStart(2, '0')}`;
  // Apenas um aviso no console — snapshot automático só acontece via botão para evitar sobrescritas indesejadas
  console.info(`[patrimonio] 1º dia do mês — snapshot ${mesAno} disponível via botão.`);
}

// ── Modais: Investimento ──────────────────────────────────────

function abrirModalInvestimento(id = null) {
  _editandoInvId = id;
  const modal  = document.getElementById('modal-investimento');
  const titulo = document.getElementById('modal-inv-titulo');
  const form   = document.getElementById('form-investimento');
  form.reset();

  if (id) {
    const inv = _investimentos.find((i) => i.id === id);
    if (!inv) return;
    titulo.textContent = 'Editar Investimento';
    document.getElementById('inv-nome').value          = inv.nome ?? '';
    document.getElementById('inv-tipo').value          = inv.tipo ?? 'outro';
    document.getElementById('inv-instituicao').value   = inv.instituicao ?? '';
    document.getElementById('inv-valor-aplicado').value = inv.valorAplicado ?? '';
    document.getElementById('inv-valor-atual').value   = inv.valorAtual ?? '';
    document.getElementById('inv-liquidez').value      = inv.liquidez ?? '';
    document.getElementById('inv-observacoes').value   = inv.observacoes ?? '';
  } else {
    titulo.textContent = 'Novo Investimento';
  }

  modal.style.display = 'flex';
}

function fecharModalInvestimento() {
  document.getElementById('modal-investimento').style.display = 'none';
  _editandoInvId = null;
}

async function salvarInvestimentoForm(e) {
  e.preventDefault();
  const dados = modelInvestimento({
    grupoId:      _grupoId,
    nome:         document.getElementById('inv-nome').value,
    tipo:         document.getElementById('inv-tipo').value,
    instituicao:  document.getElementById('inv-instituicao').value,
    valorAplicado: parseFloat(document.getElementById('inv-valor-aplicado').value),
    valorAtual:   parseFloat(document.getElementById('inv-valor-atual').value),
    liquidez:     document.getElementById('inv-liquidez').value || undefined,
    observacoes:  document.getElementById('inv-observacoes').value || undefined,
    dataAtualizacao: new Date(),
  });

  try {
    if (_editandoInvId) {
      await atualizarInvestimento(_editandoInvId, { ...dados, dataAtualizacao: new Date() });
    } else {
      await criarInvestimento(dados);
    }
    fecharModalInvestimento();
  } catch (err) {
    console.error('[patrimonio] Erro ao salvar investimento:', err);
    const el = document.getElementById('inv-modal-erro');
    if (el) { el.textContent = 'Não consegui salvar. Tente novamente.'; el.classList.remove('hidden'); }
  }
}

function confirmarArquivarInvestimento(id) {
  const inv = _investimentos.find((i) => i.id === id);
  if (!inv) return;
  document.getElementById('modal-conf-texto').textContent = `Arquivar "${inv.nome}"? O investimento não será excluído.`;
  _confirmarCb = async () => {
    await arquivarInvestimento(id);
    fecharModalConfirmar();
  };
  document.getElementById('modal-confirmar').style.display = 'flex';
}

// ── Modais: Passivo ───────────────────────────────────────────

function abrirModalPassivo(id = null) {
  _editandoPassId = id;
  const modal  = document.getElementById('modal-passivo');
  const titulo = document.getElementById('modal-pass-titulo');
  const form   = document.getElementById('form-passivo');
  form.reset();

  if (id) {
    const p = _passivos.find((x) => x.id === id);
    if (!p) return;
    titulo.textContent = 'Editar Dívida';
    document.getElementById('pass-credor').value           = p.credor ?? '';
    document.getElementById('pass-descricao').value        = p.descricao ?? '';
    document.getElementById('pass-valor-original').value   = p.valorOriginal ?? '';
    document.getElementById('pass-valor-atualizado').value = p.valorAtualizado ?? '';
    const dataOrigem = p.dataOrigem?.toDate ? p.dataOrigem.toDate() : (p.dataOrigem ? new Date(p.dataOrigem) : null);
    document.getElementById('pass-data-origem').value      = dataOrigem ? dataOrigem.toISOString().slice(0, 10) : '';
    document.getElementById('pass-status').value           = p.status ?? 'em_acompanhamento';
    document.getElementById('pass-observacoes').value      = p.observacoes ?? '';
  } else {
    titulo.textContent = 'Nova Dívida Extrajudicial';
    document.getElementById('pass-data-origem').value      = HOJE_STR;
  }

  modal.style.display = 'flex';
}

function fecharModalPassivo() {
  document.getElementById('modal-passivo').style.display = 'none';
  _editandoPassId = null;
}

async function salvarPassivoForm(e) {
  e.preventDefault();
  const valorOrig  = parseFloat(document.getElementById('pass-valor-original').value);
  const valorAtual = parseFloat(document.getElementById('pass-valor-atualizado').value);
  const dados = modelPassivoExtrajudicial({
    grupoId:        _grupoId,
    credor:         document.getElementById('pass-credor').value,
    descricao:      document.getElementById('pass-descricao').value,
    valorOriginal:  valorOrig,
    valorAtualizado: isNaN(valorAtual) ? valorOrig : valorAtual,
    dataOrigem:     document.getElementById('pass-data-origem').value
      ? new Date(document.getElementById('pass-data-origem').value)
      : new Date(),
    status:         document.getElementById('pass-status').value,
    observacoes:    document.getElementById('pass-observacoes').value || undefined,
  });

  try {
    if (_editandoPassId) {
      await atualizarPassivoExtrajudicial(_editandoPassId, dados);
    } else {
      await criarPassivoExtrajudicial(dados);
    }
    fecharModalPassivo();
  } catch (err) {
    console.error('[patrimonio] Erro ao salvar passivo:', err);
    const el = document.getElementById('pass-modal-erro');
    if (el) { el.textContent = 'Não consegui salvar. Tente novamente.'; el.classList.remove('hidden'); }
  }
}

// ── Modal: Confirmar ──────────────────────────────────────────

function fecharModalConfirmar() {
  document.getElementById('modal-confirmar').style.display = 'none';
  _confirmarCb = null;
}

// ── Eventos ───────────────────────────────────────────────────

function configurarEventos() {
  // Snapshot
  document.getElementById('btn-snapshot').addEventListener('click', salvarSnapshot);

  // Modal Investimento
  document.getElementById('btn-novo-investimento').addEventListener('click', () => abrirModalInvestimento());
  document.getElementById('btn-fechar-inv').addEventListener('click', fecharModalInvestimento);
  document.getElementById('btn-cancelar-inv').addEventListener('click', fecharModalInvestimento);
  document.getElementById('modal-inv-overlay').addEventListener('click', fecharModalInvestimento);
  document.getElementById('form-investimento').addEventListener('submit', salvarInvestimentoForm);

  // Modal Passivo
  document.getElementById('btn-novo-passivo').addEventListener('click', () => abrirModalPassivo());
  document.getElementById('btn-fechar-pass').addEventListener('click', fecharModalPassivo);
  document.getElementById('btn-cancelar-pass').addEventListener('click', fecharModalPassivo);
  document.getElementById('modal-pass-overlay').addEventListener('click', fecharModalPassivo);
  document.getElementById('form-passivo').addEventListener('submit', salvarPassivoForm);

  // Modal Confirmar
  document.getElementById('btn-fechar-conf').addEventListener('click', fecharModalConfirmar);
  document.getElementById('btn-cancelar-conf').addEventListener('click', fecharModalConfirmar);
  document.getElementById('modal-conf-overlay').addEventListener('click', fecharModalConfirmar);
  document.getElementById('btn-confirmar-conf').addEventListener('click', () => { if (_confirmarCb) _confirmarCb(); });
}
