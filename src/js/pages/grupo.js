// ============================================================
// PÁGINA: Configuração de Grupo — RF-002
// grupo.html
// ============================================================

import { onAuthChange } from '../services/auth.js';
import { buscarPerfil } from '../services/database.js';
import { criarNovoGrupo, entrarNoGrupo } from '../services/grupos.js';

// ── Guarda de autenticação ────────────────────────────────────
// Se o usuário não está logado, manda para o login.
// Se o usuário já tem grupo, manda direto pro dashboard.
onAuthChange(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  let perfil;
  try {
    perfil = await buscarPerfil(user.uid);
  } catch (_err) {
    window.location.href = 'login.html';
    return;
  }

  if (perfil?.grupoId) {
    // Já tem grupo → não precisa estar nesta tela
    window.location.href = 'dashboard.html';
    return;
  }

  // Usuário logado e sem grupo → inicializa a página
  inicializarPagina(user, perfil);
});

// ── Inicialização ─────────────────────────────────────────────

function inicializarPagina(user, perfil) {
  const nomeUsuario = perfil?.nome || user.email;

  // Elementos
  const formCriar   = document.getElementById('form-criar');
  const formEntrar  = document.getElementById('form-entrar');
  const tabs        = document.querySelectorAll('.tab-btn');
  const telaSucesso = document.getElementById('tela-sucesso');
  const btnCopiar   = document.getElementById('btn-copiar');
  const btnDashboard = document.getElementById('btn-ir-dashboard');

  // ── Controle de abas ──────────────────────────────────────
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
      const aba = tab.dataset.tab;
      formCriar.classList.toggle('hidden', aba !== 'criar');
      formEntrar.classList.toggle('hidden', aba !== 'entrar');
    });
  });

  // ── Submit: Criar Grupo ───────────────────────────────────
  formCriar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById('criar-erro');
    erroEl.classList.add('hidden');

    const nome   = document.getElementById('criar-nome').value.trim();
    const btnEl  = document.getElementById('btn-criar');

    if (!nome) {
      erroEl.textContent = 'Por favor, informe o nome do grupo.';
      erroEl.classList.remove('hidden');
      return;
    }

    btnEl.disabled    = true;
    btnEl.textContent = 'Criando…';

    try {
      await criarNovoGrupo(nome, user.uid, nomeUsuario);

      // Busca o grupo recém-criado para pegar o código
      const perfilAtualizado = await buscarPerfil(user.uid);
      const grupoId = perfilAtualizado?.grupoId;

      // Busca o código do grupo para exibir
      const { buscarGrupo } = await import('../services/grupos.js');
      const grupo = await buscarGrupo(grupoId);

      exibirSucesso(
        `Grupo "${nome}" criado com sucesso! Compartilhe o código abaixo com sua família.`,
        grupo?.codigoConvite,
      );
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.classList.remove('hidden');
      btnEl.disabled    = false;
      btnEl.textContent = 'Criar grupo';
    }
  });

  // ── Submit: Entrar no Grupo ───────────────────────────────
  formEntrar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById('entrar-erro');
    erroEl.classList.add('hidden');

    const codigo = document.getElementById('entrar-codigo').value.trim().toUpperCase();
    const btnEl  = document.getElementById('btn-entrar');

    if (codigo.length !== 6) {
      erroEl.textContent = 'O código deve ter 6 caracteres.';
      erroEl.classList.remove('hidden');
      return;
    }

    btnEl.disabled    = true;
    btnEl.textContent = 'Entrando…';

    try {
      await entrarNoGrupo(codigo, user.uid, nomeUsuario);
      exibirSucesso('Você entrou no grupo com sucesso!', null);
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.classList.remove('hidden');
      btnEl.disabled    = false;
      btnEl.textContent = 'Entrar no grupo';
    }
  });

  // ── Copiar código ─────────────────────────────────────────
  btnCopiar?.addEventListener('click', () => {
    const codigo = document.getElementById('codigo-gerado').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
      btnCopiar.textContent = '✅ Copiado!';
      setTimeout(() => { btnCopiar.textContent = 'Copiar código'; }, 2000);
    });
  });

  // ── Botão ir para o dashboard ─────────────────────────────
  btnDashboard?.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
}

// ── Exibir tela de sucesso ────────────────────────────────────

function exibirSucesso(mensagem, codigoConvite) {
  // Esconde os formulários e abas
  document.querySelectorAll('.auth-tabs, #form-criar, #form-entrar').forEach((el) => {
    el.classList.add('hidden');
  });

  // Exibe a tela de sucesso
  const telaSucesso = document.getElementById('tela-sucesso');
  telaSucesso.classList.remove('hidden');

  document.getElementById('sucesso-msg').textContent = mensagem;

  // Exibe o código de convite se houver (só quando criar grupo)
  if (codigoConvite) {
    document.getElementById('bloco-codigo').classList.remove('hidden');
    document.getElementById('codigo-gerado').textContent = codigoConvite;
  }
}
