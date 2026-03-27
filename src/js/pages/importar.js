// ============================================================
// PAGE: Importar — RF-013 + RF-014 + NRF-002 + NRF-002.1 + NRF-008 + RF-020
// Importação de transações de cartão de crédito e extratos bancários.
//
// FORMATOS SUPORTADOS:
// • CSV do extrato bancário (separador ";")
//   Layout: Data;Estabelecimento;Portador;Valor;Parcela
// • Excel (.xlsx) com o mesmo layout (template disponível)
// • PDF de extrato bancário (via PDF.js — RF-020)
//
// RF-014 — Funcionalidades:
// • Deduplicação: chave única por transação, evita duplicatas
// • Projeção de parcelas: gera parcelas futuras (tipo='projecao')
// • Campo responsável: portador mapeado como responsável
//
// NRF-002 — Funcionalidades:
// • Fuzzy matching Levenshtein ≥ 85% para reconciliação
// • Coleção 'parcelamentos' — registro mestre por série
// • Status 'pago' em projeções reconciliadas (não deleta mais)
// • Counters no preview: novas / reconciliadas exatas / fuzzy
//
// NRF-002.1 — Fatura de cartão (CSV com Portador+Parcela):
// • Detecta arquivo de fatura automaticamente
// • Normaliza parcela "X de Y" → "XX/YY" para compatibilidade com projeções
// • Seletor de mês de vencimento — parceladas salvam com data do mês da fatura
// • Créditos/estornos (valor negativo) excluídos automaticamente em modo fatura
// • dataOriginal salvo no Firestore para rastreabilidade
//
// NRF-008 — Purga de duplicatas
//
// RF-020 — Classificação automática por sinal + importação PDF:
// • PDF de extrato bancário: extrai transações via PDF.js
// • Sinal do valor determina tipo: positivo=receita, negativo=despesa
// • Toggle para inverter sinais (bancos que usam convenção oposta)
// • Badge de confiança (alta/média/baixa) para linhas de PDF
// ============================================================
import { onAuthChange, logout } from '../services/auth.js';
import {
  buscarPerfil, ouvirCategorias, ouvirContas,
  criarDespesa as criarDespesaDB, excluirDespesa,
  buscarChavesDedup, buscarChavesDedupReceitas,   // NRF-006
  buscarMapaProjecoes, buscarMapaCategorias,
  buscarProjecoesDetalhadas, atualizarStatusParcela,
  criarParcelamento, reconciliarParcela,
  criarReceita,                                    // NRF-006: salvar receitas do extrato bancário
  purgarDuplicatasDespesas, purgarDuplicatasReceitas,
} from '../services/database.js';
import { modelDespesa } from '../models/Despesa.js';
import { modelReceita } from '../models/Receita.js';  // NRF-006
import { formatarMoeda, formatarData } from '../utils/formatters.js';
import { normalizarStr, similaridade } from '../utils/helpers.js';
import { extrairTransacoesPDF } from '../utils/pdfParser.js';            // RF-020
import { detectarOrigemArquivo } from '../utils/detectorOrigemArquivo.js'; // RF-021
import { categorizarTransacao }  from '../utils/categorizer.js';           // RF-022

// ── Estado ─────────────────────────────────────────────────────
let _usuario = null;
let _grupoId = null;
let _categorias = [];
let _contas = [];           // NRF-004: contas/bancos do grupo
let _contaMap = {};         // NRF-004: id → conta
let _unsubCats = null;
let _unsubContas = null;    // NRF-004
let _linhas = [];
let _chavesExistentes = new Set();
let _projecaoDocMap = new Map();
let _mapaCategoriasHist = {};
let _projecoesDetalhadas = [];  // NRF-002: dados completos para fuzzy matching
// NRF-006: tipo do extrato detectado/selecionado — 'cartao' | 'banco' | 'receita' | 'despesa'
let _tipoExtrato = 'despesa';
let _mesFatura = '';            // NRF-002.1: "YYYY-MM" selecionado pelo usuário
let _chavesExistentesRec = new Set(); // NRF-006: dedup receitas (modo banco)
// RF-020: estado específico de PDF
let _origemPDF = false;         // true quando o arquivo carregado é PDF
let _sinaisInvertidos = false;  // toggle: inverte a convenção de sinal do banco
// RF-021: origem detectada
let _origemBanco  = 'desconhecido'; // slug do banco ('itau', 'nubank', ...)
let _origemLabel  = '';             // nome de exibição ('Itaú', 'Nubank', ...)
let _origemEmoji  = '';             // emoji ('🏦', '💜', ...)

// ── Inicialização ───────────────────────────────────────────────
onAuthChange(async (user) => {
  if (!user) { window.location.href = '../login.html'; return; }
  _usuario = user;
  let perfil;
  try { perfil = await buscarPerfil(user.uid); } catch (_err) { window.location.href = '../login.html'; return; }
  if (!perfil?.grupoId) { window.location.href = '../grupo.html'; return; }
  _grupoId = perfil.grupoId;
  document.getElementById('usuario-nome').textContent = perfil.nome ?? user.email;
  _chavesExistentes   = await buscarChavesDedup(_grupoId);
  _projecaoDocMap     = await buscarMapaProjecoes(_grupoId);
  _mapaCategoriasHist = await buscarMapaCategorias(_grupoId);
  _unsubCats = ouvirCategorias(_grupoId, (cats) => {
    _categorias = cats.sort((a, b) => a.nome.localeCompare(b.nome));
    atualizarDropdownsCategoria();
    preencherSelCatLote();
  });
  // NRF-004: carrega contas/bancos disponíveis
  _unsubContas = ouvirContas(_grupoId, (contas) => {
    _contas   = contas.sort((a, b) => a.nome.localeCompare(b.nome));
    _contaMap = Object.fromEntries(_contas.map((c) => [c.id, c]));
    preencherSelectsContas();
  });
  configurarEventos();
});

// ── Eventos ────────────────────────────────────────────────────
function configurarEventos() {
  document.getElementById('btn-logout')?.addEventListener('click', () => logout());
  const fileInput = document.getElementById('file-input');
  const dropArea  = document.getElementById('drop-area');
  fileInput.addEventListener('change', (e) => { const file = e.target.files?.[0]; if (file) processarArquivo(file); });
  dropArea.addEventListener('dragover',  (e) => { e.preventDefault(); dropArea.classList.add('imp-drop-area--over'); });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('imp-drop-area--over'));
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault(); dropArea.classList.remove('imp-drop-area--over');
    const file = e.dataTransfer.files?.[0]; if (file) processarArquivo(file);
  });
  document.getElementById('btn-trocar-arquivo')?.addEventListener('click', resetarUpload);
  document.getElementById('chk-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = e.target.checked; });
    atualizarChipsPreview();
  });
  document.getElementById('btn-sel-todos')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = true; });
    document.getElementById('chk-all').checked = true;
    atualizarChipsPreview();
  });
  document.getElementById('btn-desel-todos')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-linha').forEach((cb) => { cb.checked = false; });
    document.getElementById('chk-all').checked = false;
    atualizarChipsPreview();
  });
  document.getElementById('sel-cat-lote')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    document.querySelectorAll('.sel-cat-linha').forEach((sel) => { sel.value = e.target.value; });
    atualizarChipsPreview();
  });
  // NRF-004: aplica conta a todas as linhas do preview
  document.getElementById('sel-conta-lote')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    document.querySelectorAll('.sel-conta-linha').forEach((sel) => {
      sel.value = e.target.value;
      _linhas[+sel.dataset.idx].contaId = e.target.value;
    });
  });
  // NRF-004 + RF-019: quando o usuário muda a conta global, aplica a todas as linhas do preview
  document.getElementById('sel-conta-global')?.addEventListener('change', (e) => {
    const contaId = e.target.value;
    document.querySelectorAll('.sel-conta-linha').forEach((sel) => {
      sel.value = contaId;
      _linhas[+sel.dataset.idx].contaId = contaId;
    });
    _atualizarBadgeConta();  // RF-019
  });
  document.getElementById('btn-importar')?.addEventListener('click', () => executarImportacao());
  document.getElementById('btn-nova-importacao')?.addEventListener('click', resetarTudo);
  document.getElementById('btn-baixar-template')?.addEventListener('click', gerarTemplateDespesas);        // NRF-004
  document.getElementById('btn-baixar-template-banco')?.addEventListener('click', gerarTemplateBanco);     // NRF-006
  document.getElementById('btn-baixar-template-receita')?.addEventListener('click', gerarTemplateReceitas); // NRF-006

  // NRF-006: seletor manual de tipo de extrato
  document.getElementById('sel-tipo-extrato')?.addEventListener('change', async (e) => {
    _aplicarTipo(e.target.value);
    _atualizarUITipo();
    await marcarDuplicatas();
    renderizarPreview();
  });

  // NRF-002.1: mês de vencimento da fatura
  document.getElementById('inp-mes-fatura')?.addEventListener('change', (e) => {
    _mesFatura = e.target.value;
    if (_tipoExtrato === 'cartao' && _mesFatura && _linhas.length) {
      aplicarMesFatura(_mesFatura);
      renderizarPreview();
    }
  });

  // RF-020: toggle inversão de sinais (PDF de extrato bancário)
  document.getElementById('chk-inverter-sinais')?.addEventListener('change', async (e) => {
    _sinaisInvertidos = e.target.checked;
    if (_tipoExtrato === 'banco' && _linhas.length) {
      _aplicarTipo('banco');
      await marcarDuplicatas();
      renderizarPreview();
    }
  });

  // NRF-008: Purga de duplicatas
  document.getElementById('btn-analisar-dup')?.addEventListener('click', analisarDuplicatas);
  document.getElementById('btn-purgar-dup')?.addEventListener('click', abrirModalPurga);
  document.getElementById('btn-purga-cancelar')?.addEventListener('click', fecharModalPurga);
  document.getElementById('btn-purga-confirmar')?.addEventListener('click', executarPurga);
}

// ── Processar arquivo ───────────────────────────────────────────
async function processarArquivo(file) {
  document.getElementById('erro-leitura').classList.add('hidden');
  const isCSV  = /\.csv$/i.test(file.name);
  const isXLSX = /\.(xlsx|xls)$/i.test(file.name);
  const isPDF  = /\.pdf$/i.test(file.name);
  if (!isCSV && !isXLSX && !isPDF) {
    mostrarErroLeitura('Formato não suportado. Use extrato CSV, Excel (.xlsx) ou PDF bancário.');
    return;
  }
  // RF-020: pipeline PDF
  if (isPDF) {
    _origemPDF = true;
    _sinaisInvertidos = false;
    try {
      const raw = await extrairTransacoesPDF(file);
      if (!raw.length) { mostrarErroLeitura('Nenhuma transação encontrada no PDF. Verifique se é um extrato bancário com texto selecionável.'); return; }
      _linhas = parsearLinhasPDF(raw);
      if (!_linhas.length) { mostrarErroLeitura('Nenhuma linha válida extraída do PDF.'); return; }
      // RF-021: detecta banco pelo nome do arquivo + descrições extraídas
      const detPDF = detectarOrigemArquivo({ fileName: file.name, textLines: raw.map(r => r.desc) });
      _origemBanco = detPDF.origem;
      _origemLabel = detPDF.origemLabel;
      _origemEmoji = detPDF.origemEmoji;
      _recategorizarComOrigem();
      _aplicarTipo('banco');
      _atualizarUITipo();
      _atualizarUIInverterSinais(true);
      _atualizarBancoBadge();
      _autoSelecionarConta(_origemBanco);
      await marcarDuplicatas();
      mostrarArquivoSelecionado(file.name);
      renderizarPreview();
    } catch (err) {
      mostrarErroLeitura('Erro ao ler o PDF: ' + err.message);
    }
    return;
  }
  _origemPDF = false;
  _sinaisInvertidos = false;
  _origemBanco = 'desconhecido';
  _origemLabel = '';
  _origemEmoji = '';
  _atualizarUIInverterSinais(false);
  if (isCSV) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rows = parsearCSVTexto(e.target.result);
        _linhas = parsearLinhasExtrato(rows);
        if (!_linhas.length) { mostrarErroLeitura('Nenhuma transação encontrada. Verifique se o arquivo està no formato correto.'); return; }
        // RF-021: detecta tipo + banco
        const det1 = detectarOrigemArquivo({ fileName: file.name, rows });
        _origemBanco = det1.origem; _origemLabel = det1.origemLabel; _origemEmoji = det1.origemEmoji;
        _recategorizarComOrigem();
        const tipo1 = det1.confianca === 'baixa' ? await _mostrarModalConfirmacaoTipo(det1) : det1.tipo;
        _aplicarTipo(tipo1);
        _atualizarUITipo();
        _atualizarBancoBadge();
        _autoSelecionarConta(_origemBanco);
        await marcarDuplicatas();
        mostrarArquivoSelecionado(file.name);
        renderizarPreview();
      } catch (err) { mostrarErroLeitura('Erro ao ler o CSV: ' + err.message); }
    };
    reader.readAsText(file, 'UTF-8');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb   = XLSX.read(data, { type: 'array', cellDates: true });
      const name = wb.SheetNames.find(n => /transa/i.test(n)) ?? wb.SheetNames[0];
      const ws   = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'DD/MM/YYYY' });
      _linhas = parsearLinhasExtrato(rows);
      if (!_linhas.length) { mostrarErroLeitura('Nenhuma transação encontrada no arquivo.'); return; }
      // RF-021: detecta tipo + banco
      const det2 = detectarOrigemArquivo({ fileName: file.name, rows });
      _origemBanco = det2.origem; _origemLabel = det2.origemLabel; _origemEmoji = det2.origemEmoji;
      _recategorizarComOrigem();
      const tipo2 = det2.confianca === 'baixa' ? await _mostrarModalConfirmacaoTipo(det2) : det2.tipo;
      _aplicarTipo(tipo2);
      _atualizarUITipo();
      _atualizarBancoBadge();
      _autoSelecionarConta(_origemBanco);
      await marcarDuplicatas();
      mostrarArquivoSelecionado(file.name);
      renderizarPreview();
    } catch (err) { mostrarErroLeitura('Erro ao ler o Excel: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}


// ── RF-014 + NRF-002 + NRF-006: Marca duplicatas e reconciliações ─
async function marcarDuplicatas() {
  _chavesExistentes    = await buscarChavesDedup(_grupoId);
  // NRF-006: carrega chaves de receitas quando em modo banco (mixed credits/debits)
  _chavesExistentesRec = (_tipoExtrato === 'banco' || _tipoExtrato === 'receita')
    ? await buscarChavesDedupReceitas(_grupoId)
    : new Set();
  _projecaoDocMap      = await buscarMapaProjecoes(_grupoId);
  _mapaCategoriasHist  = await buscarMapaCategorias(_grupoId);
  // NRF-002: busca projeções apenas para tipos que geram parcelas
  if (_tipoExtrato === 'cartao' || _tipoExtrato === 'despesa') {
    _projecoesDetalhadas = await buscarProjecoesDetalhadas(_grupoId);
  }

  // Fase 1: matching exato por chave_dedup
  _linhas.forEach((l) => {
    if (!l.chave_dedup || l.erro) return;
    // NRF-006: usa coleção correta conforme tipo da linha
    const chavesRef = l.tipoLinha === 'receita' ? _chavesExistentesRec : _chavesExistentes;
    if (_projecaoDocMap.has(l.chave_dedup) && l.tipoLinha !== 'receita') {
      l.substitui_projecao = true;
      l.duplicado = false;
    } else if (chavesRef.has(l.chave_dedup)) {
      l.duplicado = true;
    }
  });

  // NRF-002 — Fase 2: fuzzy matching (apenas para cartão/despesas com parcelas)
  if (_tipoExtrato === 'banco' || _tipoExtrato === 'receita') return;
  _linhas.forEach((l) => {
    if (l.duplicado || l.substitui_projecao || l.erro) return;
    const info = parsearParcela(l.parcela);
    if (!info) return;  // só parceladas
    const estabL  = normalizarStr(l.descricao);
    const portL   = normalizarStr(l.portador ?? '');
    let melhorSim  = 0;
    let melhorProj = null;
    for (const proj of _projecoesDetalhadas) {
      if (proj.status === 'pago' || proj.tipo === 'projecao_paga') continue;
      const infoProj = parsearParcela(proj.parcela);
      if (!infoProj) continue;
      if (infoProj.atual !== info.atual || infoProj.total !== info.total) continue;
      // Portador: exige match parcial pelo primeiro nome
      if (l.portador && proj.portador) {
        const portP    = normalizarStr(proj.portador);
        const primeiroL = portL.split(' ')[0];
        const primeiroP = portP.split(' ')[0];
        if (primeiroL && primeiroP && primeiroL !== primeiroP) continue;
      }
      // Valor: ±1% ou ±R$ 0,50
      const diff    = Math.abs((proj.valor ?? 0) - l.valor);
      const pctDiff = l.valor > 0 ? diff / l.valor : 1;
      if (pctDiff > 0.01 && diff > 0.50) continue;
      // Estabelecimento: similaridade Levenshtein >= 0.85
      const sim = similaridade(estabL, normalizarStr(proj.descricao ?? ''));
      if (sim >= 0.85 && sim > melhorSim) { melhorSim = sim; melhorProj = proj; }
    }
    if (melhorProj) {
      l.substitui_projecao_fuzzy = true;
      l.projecao_id_fuzzy        = melhorProj.id;
      l.projecao_sim             = Math.round(melhorSim * 100);
      l.parcelamento_id_proj     = melhorProj.parcelamento_id ?? null;
    }
  });
}

// ── NRF-006: Modal de confirmação de tipo (baixa confiança) ──────
// Exibe modal com sugestão de tipo e permite alteração antes de prosseguir.
// Retorna Promise<string> com o tipo confirmado pelo usuário.
function _mostrarModalConfirmacaoTipo(deteccao) {
  return new Promise((resolve) => {
    const labels = {
      cartao: '💳 Fatura de Cartão', banco: '🏦 Extrato Bancário',
      receita: '📥 Receitas',        despesa: '💸 Despesas',
    };
    document.getElementById('modal-tipo-sugestao').innerHTML =
      'Detectamos um(a) <strong>' + (labels[deteccao.tipo] ?? deteccao.tipo) + '</strong> com base nas colunas encontradas.';
    document.getElementById('modal-tipo-colunas').textContent =
      deteccao.colunas.length ? deteccao.colunas.join(', ') : '(colunas não identificadas)';
    document.getElementById('modal-sel-tipo-confirm').value = deteccao.tipo;
    document.getElementById('modal-confirmacao-tipo').classList.remove('hidden');
    document.getElementById('modal-tipo-confirmar').onclick = () => {
      const tipo = document.getElementById('modal-sel-tipo-confirm').value;
      document.getElementById('modal-confirmacao-tipo').classList.add('hidden');
      resolve(tipo);
    };
  });
}

// ── NRF-006: Aplica lógica específica do tipo ao _linhas ────────
// Resets all type-specific state, then applies rules for the given type.
function _aplicarTipo(tipo) {
  _tipoExtrato = tipo;
  // Restaura estado original de cada linha antes de re-aplicar
  _linhas.forEach((l) => {
    l.erro       = l._erroOriginal ?? null;
    l.tipoLinha  = null;
    l.dataAjustada = false;
    if (l.dataOriginal) l.data = l.dataOriginal instanceof Date ? l.dataOriginal : new Date(l.dataOriginal);
  });
  if (tipo === 'cartao') {
    _linhas.forEach((l) => { if (l.isCredito && !l.erro) l.erro = 'Crédito/estorno — não importado'; });
    if (_mesFatura) aplicarMesFatura(_mesFatura);
  } else if (tipo === 'banco') {
    // RF-020: _sinaisInvertidos troca a convenção (alguns bancos: positivo=despesa)
    _linhas.forEach((l) => {
      if (!l.erro) {
        const isDebt = _sinaisInvertidos ? !l.isCredito : l.isCredito;
        l.tipoLinha = isDebt ? 'despesa' : 'receita';
      }
    });
  } else if (tipo === 'receita') {
    _linhas.forEach((l) => { if (!l.erro) l.tipoLinha = 'receita'; });
  }
  // 'despesa': comportamento padrão, sem tipoLinha
}

// ── NRF-006: Atualiza a UI de detecção de tipo ──────────────────
function _atualizarUITipo() {
  document.getElementById('tipo-extrato-wrap').classList.remove('hidden');
  const badges = {
    cartao:  '💳 Fatura de Cartão detectada',
    banco:   '🏦 Extrato Bancário detectado',
    receita: '📥 Receitas detectadas',
    despesa: '💸 Despesas detectadas',
  };
  document.getElementById('tipo-extrato-badge').textContent = badges[_tipoExtrato] ?? '📄 Arquivo detectado';
  document.getElementById('sel-tipo-extrato').value = _tipoExtrato;
  document.getElementById('fatura-mes-sub').classList.toggle('hidden', _tipoExtrato !== 'cartao');
  document.getElementById('banco-hint').classList.toggle('hidden', _tipoExtrato !== 'banco');
  // RF-020: toggle de inversão de sinais só aparece em modo banco (e só quando relevante para PDF)
  _atualizarUIInverterSinais(_tipoExtrato === 'banco' && _origemPDF);
  _atualizarBancoBadge(); // RF-021
  if (_tipoExtrato === 'cartao') {
    const inp = document.getElementById('inp-mes-fatura');
    if (!inp.value) {
      const hoje = new Date();
      inp.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    }
    _mesFatura = inp.value;
  }
}

// ── RF-020: Mostra/oculta toggle de inversão de sinais ──────────
function _atualizarUIInverterSinais(visivel) {
  const wrap = document.getElementById('inverter-sinais-wrap');
  if (!wrap) return;
  wrap.classList.toggle('hidden', !visivel);
  if (!visivel) {
    const chk = document.getElementById('chk-inverter-sinais');
    if (chk) chk.checked = false;
    _sinaisInvertidos = false;
  }
}

// ── RF-021: Badge de banco/emissor identificado ──────────────────
function _atualizarBancoBadge() {
  const badge = document.getElementById('banco-detectado-badge');
  if (!badge) return;
  if (!_origemBanco || _origemBanco === 'desconhecido' || !_origemLabel) {
    badge.classList.add('hidden');
    return;
  }
  badge.textContent = `${_origemEmoji} ${_origemLabel} identificado automaticamente`;
  badge.classList.remove('hidden');
}

// ── RF-021: Auto-seleciona conta quando banco é identificado ─────
function _autoSelecionarConta(origemId) {
  if (!origemId || origemId === 'desconhecido') return;
  const sel = document.getElementById('sel-conta-global');
  if (!sel || sel.value) return;   // usuário já selecionou — não sobrescrever
  // inferirContaDaDescricao já tem keywords para os principais bancos
  const contaId = inferirContaDaDescricao(origemId, _contas);
  if (contaId) {
    sel.value = contaId;
    sel.dispatchEvent(new Event('change'));
  }
}

// ── RF-022: Re-categoriza linhas com contexto de banco ───────────
// Chamado após detectar origem para atualizar categorias já atribuídas.
function _recategorizarComOrigem() {
  if (!_origemBanco || _origemBanco === 'desconhecido') return;
  _linhas.forEach((l) => {
    if (l.erro) return;
    const cat = categorizarTransacao(l.descricao, _origemBanco, _categorias, _mapaCategoriasHist);
    if (cat) l.categoriaId = cat;
  });
}

// ── RF-020: Converte resultado do pdfParser para _linhas ────────
// raw: [{dataStr, desc, valor, confianca}]
// valor negativo = débito (despesa), positivo = crédito (receita)
function parsearLinhasPDF(raw) {
  const contaGlobal = document.getElementById('sel-conta-global')?.value ?? '';
  return raw.map((item, idx) => {
    const data  = _normalizarDataPDF(item.dataStr);
    const valor = Math.abs(item.valor);
    const isCredito = item.valor < 0;  // negativo = débito = isCredito para compatibilidade com o pipeline
    const erros = [];
    if (!data)                         erros.push('Data inválida');
    if (!item.desc || item.desc.length < 2) erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0)    erros.push('Valor inválido');
    const chave = erros.length ? null : gerarChaveDedup(data, item.desc, valor, '', '-');
    return {
      _idx: idx,
      data, dataOriginal: data,
      descricao: item.desc, portador: '', parcela: '-', valor, isCredito,
      categoriaId: mapearCategoria(item.desc),
      contaId: contaGlobal || inferirContaDaDescricao(item.desc, _contas),
      erro: erros.length ? erros.join(', ') : null,
      _erroOriginal: erros.length ? erros.join(', ') : null,
      chave_dedup: chave, duplicado: false, tipoLinha: null,
      _confiancaPDF: item.confianca,   // 'alta' | 'media' | 'baixa'
    };
  });
}

// ── RF-020: Normaliza string de data do PDF para Date ───────────
// Suporta: DD/MM/YYYY, DD/MM/YY, DD/MM, DD-MM-YYYY, DD.MM.YYYY
function _normalizarDataPDF(dataStr) {
  if (!dataStr) return null;
  // Normaliza separadores para /
  let s = dataStr.replace(/[-\.]/g, '/');
  const parts = s.split('/');
  if (parts.length === 2) {
    // DD/MM → assume ano corrente
    s = parts[0].padStart(2,'0') + '/' + parts[1].padStart(2,'0') + '/' + new Date().getFullYear();
  } else if (parts.length === 3 && parts[2].length === 2) {
    // DD/MM/YY → DD/MM/20YY
    s = parts[0].padStart(2,'0') + '/' + parts[1].padStart(2,'0') + '/20' + parts[2];
  }
  return normalizarData(s);
}

// ── NRF-002.1: Ajusta datas de parceladas para o mês da fatura ──
// Para à vista: mantém a data original do CSV.
// Para parceladas: substitui por 01/mês-fatura.
function aplicarMesFatura(mesFatura) {
  if (!mesFatura || !_linhas.length) return;
  const [ano, mes] = mesFatura.split('-').map(Number);
  const dataFatura = new Date(ano, mes - 1, 1);
  _linhas.forEach((l) => {
    // Restaura data original antes de aplicar (permite trocar de mês)
    l.data = l.dataOriginal instanceof Date ? l.dataOriginal : new Date(l.dataOriginal);
    if (!l.erro && l.parcela && l.parcela !== '-') {
      l.data = new Date(dataFatura);
      l.dataAjustada = true;
    } else {
      l.dataAjustada = false;
    }
  });
}

// ── Parser CSV com separador ";" ────────────────────────────────
function parsearCSVTexto(content) {
  const texto = content.replace(/^\uFEFF/, '');
  return texto.split(/\r?\n/).filter(l => l.trim()).map(l => l.split(';').map(c => c.trim()));
}

// ── Parser de linhas — layout do extrato bancário ───────────────
function parsearLinhasExtrato(rows) {
  if (!rows.length) return [];
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(c => String(c ?? '').toLowerCase().trim());
    if (r.some(c => c === 'data') && r.some(c => c.includes('estabelecimento') || c.includes('descri')) && r.some(c => c.includes('valor'))) {
      headerIdx = i; break;
    }
  }
  let idxData = 0, idxEstab = 1, idxPortador = 2, idxValor = 3, idxParcela = 4, idxConta = -1;
  if (headerIdx >= 0) {
    const h = rows[headerIdx].map(c => String(c ?? '').toLowerCase().trim());
    idxData     = h.findIndex(c => c === 'data');
    idxEstab    = h.findIndex(c => c.includes('estabelecimento') || c.includes('descri'));
    idxPortador = h.findIndex(c => c.includes('portador') || c.includes('titular'));
    idxValor    = h.findIndex(c => c.includes('valor'));
    idxParcela  = h.findIndex(c => c.includes('parcela'));
    idxConta    = h.findIndex(c => c.includes('conta') || c.includes('banco'));  // NRF-004
    if (idxData < 0)     idxData = 0;
    if (idxEstab < 0)    idxEstab = 1;
    if (idxPortador < 0) idxPortador = 2;
    if (idxValor < 0)    idxValor = 3;
  }
  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);
  const resultado = [];
  for (const row of dataRows) {
    if (!row?.some(c => c)) continue;
    const dataRaw  = String(row[idxData]     ?? '').trim();
    const estab    = String(row[idxEstab]    ?? '').trim();
    const portador = String(row[idxPortador] ?? '').trim();
    const valorRaw = String(row[idxValor]    ?? '').trim();
    // NRF-002.1: normaliza "X de Y" → "XX/YY" para compatibilidade com projeções
    const parcela  = idxParcela >= 0 ? normalizarParcela(String(row[idxParcela] ?? '').trim()) : '-';
    // NRF-004: resolve conta/banco column → contaId
    const contaNome  = idxConta >= 0 ? String(row[idxConta] ?? '').trim() : '';
    const _norm      = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const contaNomeN = _norm(contaNome);
    const contaObj   = contaNome ? _contas.find(c => {
      const n = _norm(c.nome);
      return n.includes(contaNomeN) || contaNomeN.includes(n);
    }) : null;
    // Prioridade: coluna Conta → inferência pelo valor da coluna → inferência pela descrição
    const contaId = contaObj?.id
      || inferirContaDaDescricao(contaNome, _contas)
      || inferirContaDaDescricao(estab, _contas);
    if (!dataRaw && !estab && !valorRaw) continue;
    const estabLow = estab.toLowerCase();
    if (/pagamento de fatura|inclusao de pagamento|inclusão de pagamento|parcela de fatura rotativo|credito de refinanciamento/i.test(estabLow)) continue;
    // Aceita valores negativos (extrato bancário) e positivos (cartão de crédito)
    // Sempre armazena como positivo — a direção contábil é despesa pelo contexto da importação
    const valorBruto = normalizarValorXP(valorRaw);
    const valor = Math.abs(valorBruto);
    const isCredito = valorBruto < 0;  // NRF-002.1: crédito/estorno em fatura
    const dataFmt = normalizarData(dataRaw);
    const erros = [];
    if (!dataFmt) erros.push('Data inválida');
    if (!estab)   erros.push('Descrição vazia');
    if (isNaN(valor) || valor <= 0) erros.push('Valor inválido');
    const chave = (!erros.length) ? gerarChaveDedup(dataFmt, estab, valor, portador, parcela) : null;
    resultado.push({
      _idx: resultado.length,
      data: dataFmt, dataOriginal: dataFmt,  // NRF-002.1: dataOriginal preservada para ajuste de mês
      descricao: estab, portador, parcela, valor, isCredito,
      categoriaId: mapearCategoria(estab),
      contaId,  // NRF-004: conta detectada do arquivo (pode ser '' se coluna ausente)
      erro: erros.length ? erros.join(', ') : null,
      _erroOriginal: erros.length ? erros.join(', ') : null,  // NRF-006: imutável, usado para reset
      chave_dedup: chave, duplicado: false, tipoLinha: null,
    });
  }
  return resultado;
}

// ── RF-014: Gera chave de deduplicação ─────────────────────────
function gerarChaveDedup(data, estab, valor, portador, parcela) {
  if (!data || isNaN(valor)) return null;
  const estabNorm = String(estab    ?? '').toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 50);
  const portNorm  = String(portador ?? '').toLowerCase().trim().substring(0, 30);
  const parc = parcela && String(parcela).trim() !== '-' ? String(parcela).trim() : null;
  if (parc) return estabNorm + '||' + Number(valor).toFixed(2) + '||' + portNorm + '||' + parc;
  const dataISO = (data instanceof Date ? data : new Date(data)).toISOString().slice(0, 10);
  return dataISO + '||' + estabNorm + '||' + Number(valor).toFixed(2) + '||' + portNorm;
}

// ── NRF-002.1: Normaliza parcela para formato canônico "XX/YY" ──
// Aceita "X/Y", "X de Y" (CSV fatura) ou "-"
function normalizarParcela(str) {
  if (!str || String(str).trim() === '-') return '-';
  const s = String(str).trim();
  const m = s.match(/^(\d+)\s+de\s+(\d+)$/i) || s.match(/^(\d+)\/(\d+)$/);
  if (!m) return '-';
  const a = parseInt(m[1], 10), t = parseInt(m[2], 10);
  if (a <= 0 || t <= 0 || a > t) return '-';
  return String(a).padStart(2, '0') + '/' + String(t).padStart(2, '0');
}

// ── RF-014: Interpreta campo Parcela "02/06" ou "2 de 6" ────────
function parsearParcela(str) {
  if (!str || String(str).trim() === '-' || !String(str).trim()) return null;
  const s = String(str).trim();
  const m = s.match(/^(\d+)\/(\d+)$/) || s.match(/^(\d+)\s+de\s+(\d+)$/i);
  if (!m) return null;
  const atual = parseInt(m[1], 10);
  const total = parseInt(m[2], 10);
  if (atual >= total || total <= 0 || atual <= 0) return null;
  return { atual, total };
}

// ── RF-014: Gera projeções para parcelas futuras ────────────────
function gerarProjecoes(linha, parcelamentoId) {
  const info = parsearParcela(linha.parcela);
  if (!info) return [];
  const projecoes = [];
  for (let n = info.atual + 1; n <= info.total; n++) {
    const dataBase   = linha.data instanceof Date ? linha.data : new Date(linha.data);
    const dataProj   = new Date(dataBase);
    dataProj.setMonth(dataProj.getMonth() + (n - info.atual));
    const parcelaStr = String(n).padStart(2, '0') + '/' + String(info.total).padStart(2, '0');
    const chaveDedup = gerarChaveDedup(dataProj, linha.descricao, linha.valor, linha.portador, parcelaStr);
    projecoes.push({
      descricao: linha.descricao, valor: linha.valor, categoriaId: linha.categoriaId ?? '',
      data: dataProj, portador: linha.portador ?? '', responsavel: linha.portador ?? '',
      parcela: parcelaStr, tipo: 'projecao', parcelamento_id: parcelamentoId,
      chave_dedup: chaveDedup, status: 'pendente',
    });
  }
  return projecoes;
}

// ── NRF-004: Geração dinâmica do template Excel ─────────────────
function gerarTemplateDespesas() {
  if (typeof XLSX === 'undefined') {
    alert('SheetJS não carregado. Tente recarregar a página.');
    return;
  }
  const wb = XLSX.utils.book_new();

  // Aba principal — dados
  const header = ['Data', 'Estabelecimento', 'Portador', 'Valor', 'Parcela', 'Conta / Banco'];
  const contasLista = _contas.map(c => c.nome);
  const exemplos = [
    ['15/03/2026', 'Supermercado Pão de Açúcar', 'Luigi',  '250,00', '-',     contasLista[0] ?? 'Banco Itaú'],
    ['20/03/2026', 'Netflix',                    'Luigi',   '55,90', '-',     contasLista[1] ?? 'Cartão de Crédito'],
    ['22/03/2026', 'Posto Shell',                'Ana',   '-180,00', '02/03', contasLista[0] ?? 'Banco Itaú'],
    ['25/03/2026', 'Farmácia',                   'Ana',    '-42,50', '-',     contasLista[0] ?? 'Banco Itaú'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...exemplos]);
  ws['!cols'] = [
    { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Despesas');

  // Aba instruções
  const instrucoes = [
    ['Campo',        'Formato / Valores aceitos',                       'Obrigatório?'],
    ['Data',         'DD/MM/AAAA  ou  AAAA-MM-DD',                      'Sim'],
    ['Estabelecimento','Texto livre (máx. 100 car.)',                    'Sim'],
    ['Portador',     'Nome do titular do cartão',                        'Não'],
    ['Valor',        'Positivo (cartão) ou negativo (extrato bancário). O sistema usa sempre o valor absoluto.', 'Sim'],
    ['Parcela',      '"02/06" = parcela 2 de 6. Use "-" se à vista.',    'Não'],
    ['Conta / Banco', contasLista.length
      ? 'Valores aceitos: ' + contasLista.join(' | ')
      : 'Nome da conta (ex: Banco Itaú, Cartão de Crédito)',             'Não'],
    [],
    ['Dica:', 'Se a coluna "Conta / Banco" estiver vazia, use o seletor global na tela.'],
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instrucoes);
  wsI['!cols'] = [{ wch: 18 }, { wch: 55 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsI, 'Instruções');

  XLSX.writeFile(wb, 'template-despesas.xlsx');
}

// ── NRF-006: Template Extrato Bancário ──────────────────────────
function gerarTemplateBanco() {
  if (typeof XLSX === 'undefined') { alert('SheetJS não carregado. Tente recarregar a página.'); return; }
  const wb = XLSX.utils.book_new();
  const header  = ['Data', 'Descrição', 'Valor'];
  const exemplos = [
    ['15/03/2026', 'Salário',                 '5000,00'],
    ['20/03/2026', 'Supermercado',            '-250,00'],
    ['25/03/2026', 'Aluguel Recebido',        '2500,00'],
    ['28/03/2026', 'Conta de Energia ENEL',   '-120,50'],
    ['30/03/2026', 'Freelance — Projeto Web', '800,00'],
    ['31/03/2026', 'Spotify',                 '-40,90'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...exemplos]);
  ws['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Extrato');
  const instrucoes = [
    ['Campo',    'Formato / Valores aceitos',                                          'Obrigatório?'],
    ['Data',     'DD/MM/AAAA',                                                         'Sim'],
    ['Descrição','Texto livre (máx. 100 car.)',                                         'Sim'],
    ['Valor',    'Positivo → Receita  ·  Negativo (use sinal -) → Despesa',            'Sim'],
    ['',         'Exemplos:  5000,00  (receita)   /   -250,00  (despesa)',             ''],
    ['',         'Não inclua o símbolo R$ — o sistema reconhece automaticamente.',     ''],
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instrucoes);
  wsI['!cols'] = [{ wch: 12 }, { wch: 55 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsI, 'Instruções');
  XLSX.writeFile(wb, 'template-extrato-bancario.xlsx');
}

// ── NRF-006: Template Receitas ───────────────────────────────────
function gerarTemplateReceitas() {
  if (typeof XLSX === 'undefined') { alert('SheetJS não carregado. Tente recarregar a página.'); return; }
  const wb = XLSX.utils.book_new();
  const catsReceita = _categorias.filter(c => c.tipo === 'receita').map(c => c.nome);
  const header = ['Data', 'Descrição', 'Categoria', 'Valor'];
  const exemplos = [
    ['15/03/2026', 'Salário',              catsReceita[0] ?? 'Salário',   '5000,00'],
    ['20/03/2026', 'Freelance Projeto Web', catsReceita[1] ?? 'Freelance', '1200,00'],
    ['25/03/2026', 'Rendimento Fundo CDB', catsReceita[2] ?? 'Rendimentos', '350,00'],
    ['28/03/2026', 'Aluguel Recebido',     catsReceita[3] ?? 'Aluguel Recebido', '2500,00'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...exemplos]);
  ws['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 22 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Receitas');
  const instrucoes = [
    ['Campo',      'Formato / Valores aceitos',                                       'Obrigatório?'],
    ['Data',       'DD/MM/AAAA',                                                      'Sim'],
    ['Descrição',  'Texto livre (máx. 100 car.)',                                     'Sim'],
    ['Categoria',  catsReceita.length ? 'Valores aceitos: ' + catsReceita.join(' | ') : 'Nome da categoria de receita', 'Não'],
    ['Valor',      'Valor positivo sem símbolo R$ (ex: 5000,00)',                     'Sim'],
    [],
    ['Dica:', 'O sistema detecta automaticamente este arquivo como "Receitas" pela presença da coluna Categoria.'],
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instrucoes);
  wsI['!cols'] = [{ wch: 12 }, { wch: 60 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsI, 'Instruções');
  XLSX.writeFile(wb, 'template-receitas.xlsx');
}

// ── NRF-004: Infere conta/banco a partir de palavras-chave na descrição ─────
// Prioridade: match direto contra nome das contas do grupo → então mapa de
// palavras-chave de bancos brasileiros mais comuns.
function inferirContaDaDescricao(descricao, contas) {
  if (!descricao || !contas.length) return '';
  const d = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Tenta match direto: alguma palavra significativa do nome da conta está na descrição
  for (const c of contas) {
    const palavras = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
    if (palavras.some(p => p.length > 3 && d.includes(p))) return c.id;
  }

  // 2. Mapa de palavras-chave → trecho do nome da conta
  const BANCO_KEYWORDS = [
    { keys: ['itau', 'itaú'],                              conta: 'itaú'       },
    { keys: ['bradesco'],                                  conta: 'bradesco'   },
    { keys: ['santander'],                                 conta: 'santander'  },
    { keys: ['btg'],                                       conta: 'btg'        },
    { keys: ['xp invest', 'xpinvest', 'xp corret', 'xp pagamento'], conta: 'xp' },
    { keys: ['nubank', 'nu pagamento', 'nu financ'],       conta: 'nubank'     },
    { keys: ['banco inter', 'inter pagamento'],            conta: 'inter'      },
    { keys: ['c6 bank', 'c6bank', 'c6 pagamento'],         conta: 'c6'         },
    { keys: ['caixa eco', 'cef ', 'cx eco'],               conta: 'caixa'      },
    { keys: ['banco do brasil', 'bb seg', 'bb pag'],       conta: 'brasil'     },
    { keys: ['sicoob', 'sicredi'],                         conta: 'sicoob'     },
    { keys: ['original'],                                  conta: 'original'   },
    { keys: ['next bank', 'next pag'],                     conta: 'next'       },
    { keys: ['neon'],                                      conta: 'neon'       },
    { keys: ['picpay'],                                    conta: 'picpay'     },
    { keys: ['mercado pago', 'mercadopago'],               conta: 'mercado'    },
    { keys: ['facilcred'],                                 conta: 'facilcred'  },
  ];

  for (const regra of BANCO_KEYWORDS) {
    if (regra.keys.some(k => d.includes(k))) {
      const match = contas.find(c =>
        c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(regra.conta)
      );
      if (match) return match.id;
    }
  }

  return '';
}

// ── Normalização de valor XP: "R$ 1.290,00" → 1290.00 ─────────
function normalizarValorXP(val) {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  const s = String(val).trim().replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(s);
}

// ── Normalização de data ─────────────────────────────────────────
function normalizarData(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s  = String(val).trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(m1[3] + '-' + m1[2].padStart(2,'0') + '-' + m1[1].padStart(2,'0') + 'T12:00:00');
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(s + 'T12:00:00');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ── Auto-mapeamento de categorias (RF-022: delegado a categorizer.js) ──────
// origem padrão: _origemBanco (detectado pelo RF-021)
function mapearCategoria(estab, origem = _origemBanco) {
  return categorizarTransacao(estab, origem, _categorias, _mapaCategoriasHist);
}

// ── Renderização da tabela de preview ───────────────────────────
function renderizarPreview() {
  const tbody = document.getElementById('tbody-preview');
  tbody.innerHTML = '';
  _linhas.forEach((l) => {
    const tr = document.createElement('tr');
    if (l.erro)                    tr.classList.add('imp-row-erro');
    if (l.duplicado)               tr.classList.add('imp-row-dup');
    if (l.substitui_projecao)      tr.classList.add('imp-row-subst');
    if (l.substitui_projecao_fuzzy) tr.classList.add('imp-row-fuzzy');  // NRF-002
    const tdChk = document.createElement('td');
    const chk   = document.createElement('input');
    chk.type = 'checkbox'; chk.className = 'chk-linha'; chk.dataset.idx = l._idx;
    chk.checked = !l.erro && !l.duplicado;
    chk.addEventListener('change', () => atualizarChipsPreview());
    tdChk.appendChild(chk);
    // NRF-002.1: mostra data ajustada (mês da fatura) com indicador visual para parceladas
    const tdData = document.createElement('td');
    if (l.dataAjustada && l.dataOriginal) {
      const origStr = formatarData(l.dataOriginal instanceof Date ? l.dataOriginal : new Date(l.dataOriginal));
      tdData.innerHTML = `<span title="Data original: ${origStr} · ajustada para mês da fatura">${l.data ? formatarData(l.data) : '—'} <span style="color:#7c3aed;font-size:.7rem;font-weight:700;">📅</span></span>`;
    } else {
      tdData.textContent = l.data ? formatarData(l.data) : '—';
    }
    const tdEstab    = criarTd(l.descricao || '—');
    const portCurto  = l.portador ? l.portador.split(' ').slice(0, 2).join(' ') : '—';
    const tdPortador = criarTd(portCurto, '.82rem', 'var(--text-muted)');
    const parcelaInfo = parsearParcela(l.parcela);
    const tdParcela   = criarTd(l.parcela || '-', '.82rem', parcelaInfo ? '#1565c0' : 'var(--text-muted)');
    tdParcela.style.textAlign = 'center';
    if (parcelaInfo) tdParcela.style.fontWeight = '600';
    if (parcelaInfo) {
      const qtdProj = parcelaInfo.total - parcelaInfo.atual;
      const tip     = document.createElement('span');
      tip.className = 'imp-badge-proj';
      tip.textContent = '+' + qtdProj + ' parcela' + (qtdProj > 1 ? 's' : '');
      tip.title = 'Gerará ' + qtdProj + ' parcela(s) futura(s) projetada(s)';
      tdParcela.appendChild(tip);
    }
    const tdVal = criarTd(isNaN(l.valor) ? '—' : formatarMoeda(l.valor));
    tdVal.style.textAlign = 'right'; tdVal.style.fontWeight = '600';
    // NRF-006: receitas do extrato bancário em verde, despesas em vermelho
    if (!isNaN(l.valor)) tdVal.style.color = (l.tipoLinha === 'receita') ? 'var(--success, #166534)' : 'var(--danger)';
    const tdCat  = document.createElement('td');
    const selCat = document.createElement('select');
    selCat.className = 'sel-cat-linha select-input';
    selCat.style.cssText = 'font-size:.85rem;padding:.2rem .4rem;';
    selCat.dataset.idx = l._idx;
    selCat.innerHTML = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>').join('');
    selCat.value = l.categoriaId ?? '';
    selCat.addEventListener('change', (e) => { _linhas[l._idx].categoriaId = e.target.value; });
    tdCat.appendChild(selCat);

    // NRF-004: coluna Conta/Banco por linha
    const tdConta  = document.createElement('td');
    const selConta = document.createElement('select');
    selConta.className = 'sel-conta-linha select-input';
    selConta.style.cssText = 'font-size:.85rem;padding:.2rem .4rem;';
    selConta.dataset.idx = l._idx;
    selConta.innerHTML = '<option value="">— sem conta —</option>' +
      _contas.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>').join('');
    // RF-019: global tem prioridade → arquivo → inferência → vazio
    const contaGlobal = document.getElementById('sel-conta-global')?.value ?? '';
    selConta.value = contaGlobal || l.contaId || '';
    if (selConta.value) _linhas[l._idx].contaId = selConta.value;
    selConta.addEventListener('change', (e) => { _linhas[l._idx].contaId = e.target.value; });
    tdConta.appendChild(selConta);

    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    const chaveInfo = l.chave_dedup ? '\nchave: ' + l.chave_dedup : '';
    if (l.substitui_projecao_fuzzy) {
      // NRF-002: badge de reconciliação fuzzy com % de similaridade
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--fuzzy" title="Reconciliação fuzzy — similaridade ' + l.projecao_sim + '% com parcela projetada' + chaveInfo + '">🔍 ' + l.projecao_sim + '%</span>';
    } else if (l.substitui_projecao) {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--subst" title="Substitui parcela projetada — será marcada como paga' + chaveInfo + '">🔄 Real</span>';
    } else if (l.duplicado) {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--dup" title="Já importado anteriormente' + chaveInfo + '">🔄</span>';
    } else if (l.erro) {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--erro" title="' + l.erro + chaveInfo + '">⚠️</span>';
    } else if (l.tipoLinha === 'receita') {
      // NRF-006: modo banco — badge de receita
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--ok" style="background:#dcfce7;color:#166534;" title="Será salva como Receita' + chaveInfo + '">📥 Receita</span>';
    } else if (l.tipoLinha === 'despesa' && _tipoExtrato === 'banco') {
      // NRF-006: modo banco — badge de despesa
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--ok" style="background:#fee2e2;color:#991b1b;" title="Será salva como Despesa' + chaveInfo + '">💸 Despesa</span>';
    } else if (_origemPDF && l._confiancaPDF) {
      // RF-020: badge de confiança da extração PDF
      const confLabel = { alta: '✓ Alta', media: '~ Média', baixa: '⚠ Baixa' }[l._confiancaPDF] ?? '✓';
      const confTitle = { alta: 'Extração de alta confiança', media: 'Extração de confiança média — revise', baixa: 'Extração de baixa confiança — verifique dados' }[l._confiancaPDF] ?? '';
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--conf-' + l._confiancaPDF + '" title="' + confTitle + chaveInfo + '">' + confLabel + '</span>';
    } else {
      tdStatus.innerHTML = '<span class="imp-badge imp-badge--ok" title="Pronto para importar' + chaveInfo + '">✓</span>';
    }
    tr.append(tdChk, tdData, tdEstab, tdPortador, tdParcela, tdVal, tdCat, tdConta, tdStatus);
    tbody.appendChild(tr);
  });
  document.getElementById('sec-preview').classList.remove('hidden');
  // RF-020: mostra/oculta legenda de confiança PDF
  document.getElementById('pdf-conf-legenda')?.classList.toggle('hidden', !_origemPDF);
  _atualizarBadgeConta();  // RF-019
  atualizarChipsPreview();
}

// RF-019: mostra badge informativo quando conta global está aplicada ao preview
function _atualizarBadgeConta() {
  const badge = document.getElementById('conta-auto-badge');
  if (!badge) return;
  const contaId = document.getElementById('sel-conta-global')?.value ?? '';
  if (!contaId || !_linhas.length) {
    badge.classList.add('hidden');
    return;
  }
  const conta = _contaMap[contaId];
  const nome = conta ? `${conta.emoji ?? ''} ${conta.nome}`.trim() : contaId;
  badge.textContent = `✅ Conta aplicada automaticamente: ${nome}`;
  badge.classList.remove('hidden');
}

function criarTd(texto, fontSize, color) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (fontSize) td.style.fontSize = fontSize;
  if (color)    td.style.color    = color;
  return td;
}

// ── Chips de preview ─────────────────────────────────────────────
function atualizarChipsPreview() {
  const sel       = [...document.querySelectorAll('.chk-linha:checked')];
  const total     = sel.reduce((s, cb) => s + (_linhas[+cb.dataset.idx]?.valor || 0), 0);
  const erros     = _linhas.filter(l => l.erro).length;
  const dups      = _linhas.filter(l => l.duplicado).length;
  const fuzzy     = _linhas.filter(l => l.substitui_projecao_fuzzy).length;  // NRF-002
  const projTotal = sel.reduce((acc, cb) => {
    const info = parsearParcela(_linhas[+cb.dataset.idx]?.parcela);
    return acc + (info ? info.total - info.atual : 0);
  }, 0);
  document.getElementById('chip-lidas').textContent        = _linhas.length;
  document.getElementById('chip-selecionadas').textContent = sel.length;
  document.getElementById('chip-total-imp').textContent    = formatarMoeda(total);
  document.getElementById('btn-imp-count').textContent     = sel.length;
  if (erros > 0) {
    document.getElementById('chip-erros').textContent = errors;
    document.getElementById('chip-erros-wrap').classList.remove('hidden');
  }
  const dupWrap = document.getElementById('chip-dup-wrap');
  if (dupWrap) {
    document.getElementById('chip-dup').textContent = dups;
    dupWrap.classList.toggle('hidden', dups === 0);
  }
  const projWrap = document.getElementById('chip-proj-wrap');
  if (projWrap) {
    document.getElementById('chip-proj').textContent = projTotal;
    projWrap.classList.toggle('hidden', projTotal === 0);
  }
  // NRF-002: chip de reconciliações por fuzzy matching
  const fuzzyWrap = document.getElementById('chip-fuzzy-wrap');
  if (fuzzyWrap) {
    document.getElementById('chip-fuzzy').textContent = fuzzy;
    fuzzyWrap.classList.toggle('hidden', fuzzy === 0);
  }
  // NRF-006: chips de receitas/despesas para modo banco
  const recWrap  = document.getElementById('chip-receitas-wrap');
  const despWrap = document.getElementById('chip-despesas-wrap');
  if (recWrap && despWrap) {
    const isBanco = _tipoExtrato === 'banco';
    recWrap.classList.toggle('hidden', !isBanco);
    despWrap.classList.toggle('hidden', !isBanco);
    if (isBanco) {
      document.getElementById('chip-receitas').textContent = sel.filter(cb => _linhas[+cb.dataset.idx]?.tipoLinha === 'receita').length;
      document.getElementById('chip-despesas').textContent = sel.filter(cb => _linhas[+cb.dataset.idx]?.tipoLinha === 'despesa').length;
    }
  }
}

// ── NRF-002 + RF-014: Importação em lote ────────────────────────
async function executarImportacao() {
  const idxs = [...document.querySelectorAll('.chk-linha:checked')].map(cb => +cb.dataset.idx);
  if (!idxs.length) { document.getElementById('imp-aviso-zero').classList.remove('hidden'); return; }
  document.getElementById('imp-aviso-zero').classList.add('hidden');
  const btn = document.getElementById('btn-importar');
  btn.disabled = true; btn.textContent = 'Importando…';
  let sucesso = 0, falha = 0, projGeradas = 0, reconciliacoes = 0, reconciliacoesFuzzy = 0;
  for (const idx of idxs) {
    const l       = _linhas[idx];
    const cat     = document.querySelector('.sel-cat-linha[data-idx="' + idx + '"]')?.value ?? l.categoriaId ?? '';
    const contaId = document.querySelector('.sel-conta-linha[data-idx="' + idx + '"]')?.value || l.contaId || undefined; // NRF-004
    const info    = parsearParcela(l.parcela);
    const parc_id = info ? crypto.randomUUID() : null;
    // NRF-001: auto-mark isConjunta/valorAlocado from category's isConjuntaPadrao
    const catObj       = _categorias.find(c => c.id === cat);
    const isConj       = catObj?.isConjuntaPadrao ?? false;
    const valorAlocado = isConj ? Math.round(l.valor * 100 / 2) / 100 : null;
    try {
      // NRF-006: modo banco — linhas de receita vão para coleção 'receitas'
      if (l.tipoLinha === 'receita') {
        await criarReceita(modelReceita({
          grupoId: _grupoId, usuarioId: _usuario.uid,
          descricao: l.descricao, valor: l.valor,
          data: l.data instanceof Date ? l.data : new Date(l.data),
          categoriaId: cat, contaId,
          origem: 'importacao', chave_dedup: l.chave_dedup, importadoEm: new Date(),
          origemBanco: _origemBanco,  // RF-021/RF-022
        }));
        sucesso++;
        continue;
      }
      // NRF-002: cria a despesa real primeiro (para obter despesaRef.id para reconciliação)
      const despesaRef = await criarDespesaDB(modelDespesa({
        descricao: l.descricao, valor: l.valor, categoriaId: cat,
        data: l.data instanceof Date ? l.data : new Date(l.data),
        grupoId: _grupoId, usuarioId: _usuario.uid,
        origem: 'importacao', portador: l.portador ?? '', responsavel: l.portador ?? '',
        parcela: l.parcela ?? '-', tipo: 'despesa',
        chave_dedup: l.chave_dedup,
        parcelamento_id: parc_id ?? l.parcelamento_id_proj ?? null,
        importadoEm: new Date(),
        isConjunta: isConj, valorAlocado,
        contaId,  // NRF-004
        status: 'pago',
        origemBanco: _origemBanco,  // RF-021/RF-022
        // NRF-002.1: salva data original quando parcelada teve data ajustada para mês da fatura
        ...(l.dataAjustada && l.dataOriginal ? {
          dataOriginal: l.dataOriginal instanceof Date ? l.dataOriginal : new Date(l.dataOriginal),
        } : {}),
      }));
      // NRF-002: reconciliação por matching exato
      if (l.substitui_projecao && l.chave_dedup && _projecaoDocMap.has(l.chave_dedup)) {
        const projecaoId = _projecaoDocMap.get(l.chave_dedup);
        await atualizarStatusParcela(projecaoId, despesaRef.id);
        _projecaoDocMap.delete(l.chave_dedup);
        reconciliacoes++;
      }
      // NRF-002: reconciliação por fuzzy matching
      else if (l.substitui_projecao_fuzzy && l.projecao_id_fuzzy) {
        await atualizarStatusParcela(l.projecao_id_fuzzy, despesaRef.id);
        if (l.parcelamento_id_proj) {
          try { await reconciliarParcela(l.parcelamento_id_proj, info?.total ?? 1); } catch {}
        }
        reconciliacoesFuzzy++;
      }
      // Projeções novas (sem match) — cria mestre e projeções futuras
      else if (info && parc_id) {
        // Cria parcelamento mestre apenas na 1ª parcela
        if (info.atual === 1) {
          try {
            await criarParcelamento({
              grupoId: _grupoId,
              estabelecimento: l.descricao,
              valorTotal: Math.round(l.valor * info.total * 100) / 100,
              totalParcelas: info.total,
              portador: l.portador ?? '',
              usuarioId: _usuario.uid,
              dataOriginal: l.data instanceof Date ? l.data : new Date(l.data),
              parcelamento_id: parc_id,
              isConjunta: isConj,
            });
          } catch {}
        }
        // Projeções futuras
        const projecoes = gerarProjecoes({ ...l, categoriaId: cat }, parc_id);
        for (const p of projecoes) {
          if (p.chave_dedup && _chavesExistentes.has(p.chave_dedup)) continue;
          await criarDespesaDB(modelDespesa({
            ...p, grupoId: _grupoId, usuarioId: _usuario.uid,
            origem: 'projecao', importadoEm: new Date(),
            isConjunta: isConj, valorAlocado,
            contaId,  // NRF-004: propaga conta para as projeções de parcelas
            status: 'pendente',
          }));
          _chavesExistentes.add(p.chave_dedup);
          projGeradas++;
        }
      }
      sucesso++;
    } catch { falha++; }
  }
  mostrarResultado(sucesso, falha, projGeradas, reconciliacoes, reconciliacoesFuzzy);
}

// ── Resultado ─────────────────────────────────────────────────────
function mostrarResultado(sucesso, falha, projGeradas, reconciliacoes, reconciliacoesFuzzy) {
  if (projGeradas === undefined)         projGeradas = 0;
  if (reconciliacoes === undefined)      reconciliacoes = 0;
  if (reconciliacoesFuzzy === undefined) reconciliacoesFuzzy = 0;
  document.getElementById('sec-preview').classList.add('hidden');
  document.getElementById('sec-upload').classList.add('hidden');
  const icon   = document.getElementById('resultado-icon');
  const titulo = document.getElementById('resultado-titulo');
  const msg    = document.getElementById('resultado-msg');
  const projEl = document.getElementById('resultado-proj');
  if (falha === 0) {
    icon.textContent   = '⛅';
    titulo.textContent = 'Importação concluída com sucesso!';
    msg.textContent    = sucesso + ' despesa' + (sucesso !== 1 ? 's' : '') + ' importada' + (sucesso !== 1 ? 's' : '') + ' e sincronizadas com o grupo.';
  } else {
    icon.textContent   = '⚠️';
    titulo.textContent = 'Importação concluída com avisos';
    msg.textContent    = sucesso + ' importada' + (sucesso !== 1 ? 's' : '') + ' com sucesso. ' + falha + ' falha' + (falha !== 1 ? 's' : '') + '.';
  }
  if (projEl) {
    let projMsg = '';
    if (projGeradas > 0)
      projMsg += '💳 ' + projGeradas + ' parcela' + (projGeradas !== 1 ? 's' : '') + ' futura' + (projGeradas !== 1 ? 's' : '') + ' projetada' + (projGeradas !== 1 ? 's' : '') + '. ';
    if (reconciliacoes > 0)
      projMsg += '🔄 ' + reconciliacoes + ' parcela' + (reconciliacoes !== 1 ? 's' : '') + ' reconciliada' + (reconciliacoes !== 1 ? 's' : '') + ' (match exato). ';
    if (reconciliacoesFuzzy > 0)
      projMsg += '🔍 ' + reconciliacoesFuzzy + ' reconciliada' + (reconciliacoesFuzzy !== 1 ? 's' : '') + ' por similaridade fuzzy (\u226585%).';
    projEl.textContent = projMsg.trim();
    projEl.classList.toggle('hidden', !projMsg.trim());
  }
  document.getElementById('sec-resultado').classList.remove('hidden');
}

// ── Helpers de UI ;
function mostrarArquivoSelecionado(nome) {
  document.getElementById('drop-area').classList.add('hidden');
  document.getElementById('arquivo-info').classList.remove('hidden');
  document.getElementById('arquivo-nome').textContent = nome;
}
function mostrarErroLeitura(msg) {
  const el = document.getElementById('erro-leitura');
  el.textContent = msg; el.classList.remove('hidden');
}
function preencherSelCatLote() {
  const sel = document.getElementById('sel-cat-lote');
  if (!sel) return;
  sel.innerHTML = '<option value="">— manter individual ┐</option>' +
    _categorias.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>').join('');
}
function atualizarDropdownsCategoria() {
  document.querySelectorAll('.sel-cat-linha').forEach((sel) => {
    const idx = +sel.dataset.idx, atual = sel.value;
    sel.innerHTML = '<option value="">— sem categoria —</option>' +
      _categorias.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>').join('');
    sel.value = atual || mapearCategoria(_linhas[idx]?.descricao ?? '');
  });
  preencherSelCatLote();
}

// NRF-004: preenche todos os selects de conta (global, lote e por linha)
function preencherSelectsContas() {
  const optStr = '<option value="">— sem conta —</option>' +
    _contas.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>').join('');
  const optStrNeutro = '<option value="">— manter individual —</option>' +
    _contas.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>').join('');
  const selGlobal = document.getElementById('sel-conta-global');
  if (selGlobal) { const v = selGlobal.value; selGlobal.innerHTML = optStr; selGlobal.value = v; }
  const selLote = document.getElementById('sel-conta-lote');
  if (selLote)   { const v = selLote.value;   selLote.innerHTML = optStrNeutro; selLote.value = v; }
  // Por linha (no preview)
  document.querySelectorAll('.sel-conta-linha').forEach((sel) => {
    const idx = +sel.dataset.idx, atual = sel.value;
    sel.innerHTML = optStr;
    sel.value = atual || _linhas[idx]?.contaId || '';
  });
}
function resetarUpload() {
  document.getElementById('file-input').value = '';
  document.getElementById('drop-area').classList.remove('hidden');
  document.getElementById('arquivo-info').classList.add('hidden');
  document.getElementById('erro-leitura').classList.add('hidden');
  document.getElementById('sec-preview').classList.add('hidden');
  document.getElementById('tipo-extrato-wrap')?.classList.add('hidden'); // NRF-006
  _linhas = [];
  _tipoExtrato = 'despesa';         // NRF-006
  _mesFatura   = '';                // NRF-002.1
  _chavesExistentesRec = new Set(); // NRF-006
  _origemPDF        = false;        // RF-020
  _sinaisInvertidos = false;        // RF-020
  _atualizarUIInverterSinais(false);
  _origemBanco = 'desconhecido';    // RF-021
  _origemLabel = '';
  _origemEmoji = '';
  _atualizarBancoBadge();
}
function resetarTudo() {
  resetarUpload();
  document.getElementById('sec-upload').classList.remove('hidden');
  document.getElementById('sec-resultado').classList.add('hidden');
  document.getElementById('tbody-preview').innerHTML = '';
}

// ── NRF-008: Purga de Duplicatas ──────────────────────────────

let _analiseDuplicatas = null; // guarda resultado da análise para a confirmação

async function analisarDuplicatas() {
  const btn = document.getElementById('btn-analisar-dup');
  const statsEl = document.getElementById('purga-stats');
  const resultEl = document.getElementById('purga-resultado');
  btn.disabled = true; btn.textContent = 'Analisando…';
  resultEl.classList.add('hidden');

  try {
    const [resDes, resRec] = await Promise.all([
      purgarDuplicatasDespesas(_grupoId, true),   // dry-run
      purgarDuplicatasReceitas(_grupoId, true),   // dry-run
    ]);
    _analiseDuplicatas = { desp: resDes, rec: resRec };

    document.getElementById('purga-total-desp').textContent = resDes.total;
    document.getElementById('purga-dup-desp').textContent   = resDes.encontradas;
    document.getElementById('purga-total-rec').textContent  = resRec.total;
    document.getElementById('purga-dup-rec').textContent    = resRec.encontradas;
    statsEl.style.display = 'flex';
    statsEl.classList.remove('hidden');

    const btnPurgar = document.getElementById('btn-purgar-dup');
    if (resDes.encontradas + resRec.encontradas > 0) {
      btnPurgar.classList.remove('hidden');
    } else {
      btnPurgar.classList.add('hidden');
      resultEl.textContent = '✅ Nenhuma duplicata encontrada. A base está limpa!';
      resultEl.style.background = '#f0fdf4'; resultEl.style.borderColor = '#86efac'; resultEl.style.color = '#166534';
      resultEl.classList.remove('hidden');
    }
  } catch (err) {
    console.error('[analisarDuplicatas]', err);
    resultEl.textContent = '❌ Erro ao analisar: ' + err.message;
    resultEl.style.background = '#fef2f2'; resultEl.style.borderColor = '#fca5a5'; resultEl.style.color = '#991b1b';
    resultEl.classList.remove('hidden');
  }
  btn.disabled = false; btn.textContent = '🔍 Analisar Duplicatas';
}

function abrirModalPurga() {
  if (!_analiseDuplicatas) return;
  const { desp, rec } = _analiseDuplicatas;
  const total = desp.encontradas + rec.encontradas;
  document.getElementById('modal-purga-msg').textContent =
    `Serão removidas ${total} transação(ões) duplicada(s): ${desp.encontradas} despesa(s) e ${rec.encontradas} receita(s). Deseja continuar?`;
  document.getElementById('modal-purga').classList.remove('hidden');
}

function fecharModalPurga() {
  document.getElementById('modal-purga').classList.add('hidden');
}

async function executarPurga() {
  fecharModalPurga();
  const btnAnalisar = document.getElementById('btn-analisar-dup');
  const btnPurgar   = document.getElementById('btn-purgar-dup');
  const resultEl    = document.getElementById('purga-resultado');
  btnAnalisar.disabled = true; btnPurgar.disabled = true;
  resultEl.textContent = '⏳ Removendo duplicatas…';
  resultEl.style.background = '#fffbeb'; resultEl.style.borderColor = '#fcd34d'; resultEl.style.color = '#92400e';
  resultEl.classList.remove('hidden');

  try {
    const [resDes, resRec] = await Promise.all([
      purgarDuplicatasDespesas(_grupoId),
      purgarDuplicatasReceitas(_grupoId),
    ]);
    const totalRem = resDes.deletadas + resRec.deletadas;
    resultEl.textContent =
      `✅ Purga concluída! ${totalRem} duplicata(s) removida(s): ${resDes.deletadas} despesa(s) e ${resRec.deletadas} receita(s).`;
    resultEl.style.background = '#f0fdf4'; resultEl.style.borderColor = '#86efac'; resultEl.style.color = '#166534';
    // Atualiza stats
    document.getElementById('purga-total-desp').textContent = resDes.total - resDes.deletadas;
    document.getElementById('purga-dup-desp').textContent   = 0;
    document.getElementById('purga-total-rec').textContent  = resRec.total - resRec.deletadas;
    document.getElementById('purga-dup-rec').textContent    = 0;
    btnPurgar.classList.add('hidden');
    // Recarrega chaves de dedup para o próximo import
    _chavesExistentes = await buscarChavesDedup(_grupoId);
  } catch (err) {
    console.error('[executarPurga]', err);
    resultEl.textContent = '❌ Erro durante a purga: ' + err.message;
    resultEl.style.background = '#fef2f2'; resultEl.style.borderColor = '#fca5a5'; resultEl.style.color = '#991b1b';
  }
  btnAnalisar.disabled = false; btnPurgar.disabled = false;
}
