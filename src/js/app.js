// ============================================================
// ENTRY POINT — Minhas Finanças
// Ponto de entrada do dashboard (index.html)
// ============================================================

import { onAuthChange, logout } from './services/auth.js';
import { buscarPerfil, buscarGrupo, ouvirParcelamentosAbertos } from './services/database.js';
import { iniciarListenerCategorias } from './controllers/categorias.js';
import {
  iniciarListenerDespesas,
  salvarDespesa,
  deletarDespesa,
  renderizarListaDespesas,
} from './controllers/despesas.js';
import { iniciarListenerOrcamentos } from './controllers/orcamentos.js';
import { renderizarDashboard } from './controllers/dashboard.js';
import { mesAnoAtual, dataHoje, definirTexto } from './utils/helpers.js';
import { nomeMes } from './utils/formatters.js';

// ── Estado Global ─────────────────────────────────────────────
let estadoApp = {
  usuario:    null,
  perfil:     null,
  mes:        mesAnoAtual().mes,
  ano:        mesAnoAtual().ano,
  categorias: [],
  despesas:   [],
  orcamentos: [],
  grupo:      null,
};

// Referências para unsubscribe ao trocar período
let _unsubCats = null;
let _unsubDesp = null;
let _unsubOrc  = null;
let _unsubProj = null; // RF-014: parcelamentos em aberto

// ── Inicialização ─────────────────────────────────────────────

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  estadoApp.usuario = user;

  try {
    estadoApp.perfil = await buscarPerfil(user.uid);
  } catch (_err) {
    // Falha ao buscar perfil (ex: erro de rede) → redireciona para login por segurança
    window.location.href = 'login.html';
    return;
  }

  if (!estadoApp.perfil?.grupoId) {
    window.location.href = 'grupo.html';
    return;
  }

  definirTexto('usuario-nome', estadoApp.perfil.nome ?? user.email);
  estadoApp.grupo = await buscarGrupo(estadoApp.perfil.grupoId);
  atualizarTituloPeriodo();
  preencherSelectPeriodo();
  iniciarListeners();
  iniciarListenerParcelamentos(estadoApp.perfil.grupoId); // RF-014
  configurarEventos();
});

// ── Listeners em tempo real ────────────────────────────────────

function iniciarListeners() {
  const { grupoId } = estadoApp.perfil;
  const { mes, ano } = estadoApp;

  // Cancela listeners anteriores ao trocar de período
  if (_unsubCats) _unsubCats();
  if (_unsubDesp) _unsubDesp();
  if (_unsubOrc)  _unsubOrc();

  // Categorias — não filtram por mês
  _unsubCats = iniciarListenerCategorias(grupoId, (cats) => {
    estadoApp.categorias = cats;
    preencherSelectCategorias(cats);
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos);
    renderizarListaDespesas(estadoApp.despesas, estadoApp.categorias);
  });

  // Despesas do mês — sync bidirecional: qualquer escrita de qualquer membro
  // dispara este listener nos dois dispositivos simultaneamente
  _unsubDesp = iniciarListenerDespesas(grupoId, mes, ano, (desp) => {
    estadoApp.despesas = desp;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos);
    renderizarListaDespesas(estadoApp.despesas, estadoApp.categorias);
  });

  // Orçamentos do mês
  _unsubOrc = iniciarListenerOrcamentos(grupoId, mes, ano, (orc) => {
    estadoApp.orcamentos = orc;
    renderizarDashboard(estadoApp.categorias, estadoApp.despesas, estadoApp.orcamentos);
  });
}

// ── Categorias no select ───────────────────────────────────────

function preencherSelectCategorias(categorias) {
  const sel = document.getElementById('despesa-categoria');
  if (!sel) return;
  const valorAtual = sel.value;
  sel.innerHTML = '<option value="">Selecione uma categoria</option>' +
    categorias
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((c) => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`)
      .join('');
  // Preserva seleção ao recarregar (ex: ao editar)
  if (valorAtual) sel.value = valorAtual;
}

// ── Eventos de UI ─────────────────────────────────────────────

let _eventosConfigurados = false;

function configurarEventos() {
  if (_eventosConfigurados) return;
  _eventosConfigurados = true;

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await logout();
  });

  // Abrir modal nova despesa
  document.getElementById('btn-nova-despesa')?.addEventListener('click', () => {
    abrirModalDespesa();
  });

  // Fechar modal
  document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModalDespesa);
  document.getElementById('btn-cancelar-despesa')?.addEventListener('click', fecharModalDespesa);
  document.querySelector('.modal-backdrop')?.addEventListener('click', fecharModalDespesa);

  // Submit do formulário
  document.getElementById('form-despesa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl  = document.getElementById('despesa-erro');
    const btnSave = e.target.querySelector('[type="submit"]');
    erroEl.classList.add('hidden');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando…';

    // Validação: responsável obrigatório
    const responsavel = document.getElementById('despesa-responsavel')?.value ?? '';
    if (!responsavel) {
      erroEl.textContent = 'Selecione o responsável pela despesa.';
      erroEl.classList.remove('hidden');
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
      document.getElementById('despesa-responsavel')?.focus();
      return;
    }

    // Validação: tipo de despesa obrigatório
    const tipoSelecionado = document.querySelector('[name="despesa-tipo"]:checked')?.value;
    if (!tipoSelecionado) {
      erroEl.textContent = 'Selecione o tipo da despesa: Individual ou Conjunta.';
      erroEl.classList.remove('hidden');
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
      document.getElementById('form-group-tipo-despesa')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const isConjunta = tipoSelecionado === 'conjunta';
    const valor = parseFloat(document.getElementById('despesa-valor').value);
    const dados = {
      descricao:    document.getElementById('despesa-descricao').value.trim(),
      valor,
      categoriaId:  document.getElementById('despesa-categoria').value,
      data:         new Date(document.getElementById('despesa-data').value + 'T12:00:00'),
      responsavel,
      isConjunta,
      valorAlocado: isConjunta ? Math.round(valor * 100 / 2) / 100 : undefined,
    };
    const despesaId = document.getElementById('despesa-id').value || null;

    try {
      await salvarDespesa(dados, estadoApp.perfil.grupoId, estadoApp.usuario.uid, despesaId);
      fecharModalDespesa();
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.classList.remove('hidden');
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    }
  });

  // RF-014: toggle painel parcelamentos (header interno)
  document.getElementById('parc-toggle-dash')?.addEventListener('click', () => {
    const body = document.getElementById('parc-body-dash');
    if (body) body.classList.toggle('parc-body--collapsed');
    const icon = document.querySelector('#parc-toggle-dash .parc-toggle-icon');
    if (icon) icon.textContent = body?.classList.contains('parc-body--collapsed') ? '▸' : '▾';
  });

  // CT-009.5: botão externo de visibilidade do painel de parcelamentos
  document.getElementById('btn-ver-parc-dash')?.addEventListener('click', () => {
    const widget = document.getElementById('parc-widget-dash');
    if (!widget) return;
    if (widget.classList.contains('hidden')) {
      widget.classList.remove('hidden');
      // Expande o body caso esteja colapsado
      const body = document.getElementById('parc-body-dash');
      if (body) body.classList.remove('parc-body--collapsed');
      const icon = document.querySelector('#parc-toggle-dash .parc-toggle-icon');
      if (icon) icon.textContent = '▾';
      // Mostra empty-state se não houver lista ainda
      const lista = document.getElementById('parc-lista-dash');
      if (lista && !lista.querySelector('.parc-resp-row')) {
        lista.innerHTML = '<p class="empty-state" style="font-size:.85rem;padding:.5rem 0;">Nenhum parcelamento em aberto no momento.</p>';
      }
    } else {
      widget.classList.add('hidden');
    }
    widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // NRF-001: auto-toggle conjunta ao mudar categoria
  document.getElementById('despesa-categoria')?.addEventListener('change', () => {
    const catId = document.getElementById('despesa-categoria').value;
    const cat   = estadoApp.categorias.find(c => c.id === catId);
    if (cat?.isConjuntaPadrao !== undefined) {
      const val = cat.isConjuntaPadrao ? 'conjunta' : 'individual';
      const r   = document.querySelector(`[name="despesa-tipo"][value="${val}"]`);
      if (r) r.checked = true;
    }
    atualizarPreviewConjuntaDash();
  });
  document.querySelectorAll('[name="despesa-tipo"]').forEach(r =>
    r.addEventListener('change', atualizarPreviewConjuntaDash)
  );
  document.getElementById('despesa-valor')?.addEventListener('input', atualizarPreviewConjuntaDash);

  // Filtro de período
  document.getElementById('select-mes')?.addEventListener('change', (e) => {
    estadoApp.mes = Number(e.target.value);
    atualizarTituloPeriodo();
    iniciarListeners();
  });
  document.getElementById('select-ano')?.addEventListener('change', (e) => {
    estadoApp.ano = Number(e.target.value);
    atualizarTituloPeriodo();
    iniciarListeners();
  });
}

// ── Modal de Despesa ─────────────────────────────────────────

function abrirModalDespesa(despesa = null) {
  preencherSelectCategorias(estadoApp.categorias);
  preencherDropdownResponsavel();

  document.getElementById('despesa-id').value        = despesa?.id ?? '';
  document.getElementById('despesa-descricao').value = despesa?.descricao ?? '';
  document.getElementById('despesa-valor').value     = despesa?.valor ?? '';
  document.getElementById('despesa-categoria').value = despesa?.categoriaId ?? '';
  document.getElementById('despesa-data').value      = despesa
    ? (despesa.data?.toDate?.() ?? new Date(despesa.data)).toISOString().slice(0, 10)
    : dataHoje();

  // Responsável: pré-seleciona usuário atual para nova despesa
  const selResp = document.getElementById('despesa-responsavel');
  if (selResp) {
    selResp.value = despesa
      ? (despesa.responsavel ?? '')
      : (estadoApp.grupo?.nomesMembros?.[estadoApp.usuario?.uid] ?? '');
  }

  // Tipo: pré-preenche ao editar; nenhum selecionado para nova despesa
  document.querySelectorAll('[name="despesa-tipo"]').forEach(r => r.checked = false);
  if (despesa) {
    const radioVal = despesa.isConjunta ? 'conjunta' : 'individual';
    const radioEl  = document.querySelector(`[name="despesa-tipo"][value="${radioVal}"]`);
    if (radioEl) radioEl.checked = true;
  }
  atualizarPreviewConjuntaDash();

  document.getElementById('modal-despesa-titulo').textContent =
    despesa ? 'Editar Despesa' : 'Nova Despesa';
  document.getElementById('despesa-erro').classList.add('hidden');
  document.getElementById('modal-despesa').classList.remove('hidden');
}

// ── Responsável dropdown ───────────────────────────────────────────────
function preencherDropdownResponsavel() {
  const sel = document.getElementById('despesa-responsavel');
  if (!sel || !estadoApp.grupo) return;
  const nomes = Object.values(estadoApp.grupo.nomesMembros ?? {});
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione o responsável</option>' +
    nomes.map(n => `<option value="${n}">${n}</option>`).join('');
  if (atual) sel.value = atual;
}

// ── Preview conjunta (dashboard) ────────────────────────────────────────
function atualizarPreviewConjuntaDash() {
  const isConj  = document.querySelector('[name="despesa-tipo"]:checked')?.value === 'conjunta';
  const preview = document.getElementById('conjunta-preview-text');
  if (!preview) return;
  if (!isConj) { preview.textContent = '50/50'; return; }
  const val = parseFloat(document.getElementById('despesa-valor')?.value ?? 0);
  if (val > 0) {
    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 2);
    preview.textContent = `→ Meu Bolso: ${fmt}`;
  } else {
    preview.textContent = 'Informe o valor para ver a divisão.';
  }
}

function fecharModalDespesa() {
  document.getElementById('modal-despesa').classList.add('hidden');
  document.getElementById('form-despesa').reset();
}

// Expõe funções para os botões inline na lista de despesas
window.editarDespesa = (id) => {
  const despesa = estadoApp.despesas.find((d) => d.id === id);
  if (despesa) abrirModalDespesa(despesa);
};

window.confirmarExcluirDespesa = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta despesa?')) {
    await deletarDespesa(id);
  }
};

// ── RF-014: Parcelamentos em Aberto ──────────────────────────

function iniciarListenerParcelamentos(grupoId) {
  if (_unsubProj) _unsubProj();
  _unsubProj = ouvirParcelamentosAbertos(grupoId, (projecoes) => {
    renderizarPainelParcelamentos(projecoes);
  });
}

function renderizarPainelParcelamentos(projecoes) {
  const widget = document.getElementById('parc-widget-dash');
  const lista  = document.getElementById('parc-lista-dash');
  const total  = document.getElementById('parc-total-dash');
  if (!widget || !lista || !total) return;

  const hoje    = new Date();
  const futuras = projecoes.filter(p => {
    const d = p.data?.toDate?.() ?? new Date(p.data);
    return d > hoje;
  });

  if (!futuras.length) {
    widget.classList.add('hidden');
    return;
  }
  widget.classList.remove('hidden');

  // Totais por responsável
  const porResp = {};
  let totalGeral = 0;
  futuras.forEach(p => {
    const resp = (p.responsavel || p.portador || '—').split(' ')[0];
    if (!porResp[resp]) porResp[resp] = { total: 0, compras: {} };
    porResp[resp].total += p.valor ?? 0;
    totalGeral          += p.valor ?? 0;
    const cid = p.parcelamento_id ?? p.descricao;
    if (!porResp[resp].compras[cid])
      porResp[resp].compras[cid] = { descricao: p.descricao, valor: p.valor, qtd: 0 };
    porResp[resp].compras[cid].qtd++;
  });

  total.textContent = formatarMoedaDash(totalGeral);
  lista.innerHTML = Object.entries(porResp).map(([resp, d]) => `
    <div class="parc-resp-row">
      <div class="parc-resp-header">
        <span class="parc-resp-nome">👤 ${resp}</span>
        <span class="parc-resp-total">${formatarMoedaDash(d.total)}</span>
      </div>
      <div class="parc-resp-items">
        ${Object.values(d.compras).map(c => `
          <div class="parc-compra-item">
            <span class="parc-compra-desc">${c.descricao}</span>
            <span class="parc-compra-info">${c.qtd} parcela${c.qtd > 1 ? 's' : ''} restante${c.qtd > 1 ? 's' : ''}</span>
            <span class="parc-compra-valor">${formatarMoedaDash(c.valor * c.qtd)}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function formatarMoedaDash(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}

// ── Período ──────────────────────────────────────────────────

function preencherSelectPeriodo() {
  const selMes = document.getElementById('select-mes');
  const selAno = document.getElementById('select-ano');
  if (!selMes || !selAno) return;

  const meses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];
  selMes.innerHTML = meses.map((m, i) =>
    `<option value="${i + 1}" ${i + 1 === estadoApp.mes ? 'selected' : ''}>${m}</option>`
  ).join('');

  const anoAtual = new Date().getFullYear();
  selAno.innerHTML = [anoAtual - 1, anoAtual, anoAtual + 1].map((a) =>
    `<option value="${a}" ${a === estadoApp.ano ? 'selected' : ''}>${a}</option>`
  ).join('');
}

function atualizarTituloPeriodo() {
  const el = document.getElementById('mes-ano-atual');
  if (el) el.textContent = `${nomeMes(estadoApp.mes)} ${estadoApp.ano}`;
}
