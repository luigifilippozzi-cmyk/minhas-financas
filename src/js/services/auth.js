// ============================================================
// SERVIÇO DE AUTENTICAÇÃO — RF-001
// ============================================================

import { auth } from '../config/firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { criarPerfil, buscarPerfil } from './database.js';

/**
 * Cria uma nova conta com email e senha, e grava o perfil no Firestore.
 * @param {string} nome
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<UserCredential>}
 */
export async function cadastrar(nome, email, senha) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  // Aguarda o ID token estar disponível no SDK antes de escrever no Firestore.
  // Sem este await pode ocorrer race condition onde o token ainda não foi
  // propagado para o Firestore SDK, causando permission-denied.
  await credencial.user.getIdToken();
  // Cria o perfil do usuário no Firestore (sem grupoId ainda)
  await criarPerfil(credencial.user.uid, {
    nome: nome.trim(),
    email: email.trim(),
    grupoId: null,
  });
  return credencial;
}

/**
 * Faz login com email e senha.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<UserCredential>}
 */
export async function login(email, senha) {
  return signInWithEmailAndPassword(auth, email, senha);
}

/**
 * Faz logout do usuário atual.
 * @returns {Promise<void>}
 */
export async function logout() {
  return signOut(auth);
}

/**
 * Observa mudanças no estado de autenticação.
 * @param {function} callback — chamado com (user) ou (null)
 * @returns {function} unsubscribe
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Retorna o usuário atualmente logado, ou null.
 * @returns {User|null}
 */
export function getUsuarioAtual() {
  return auth.currentUser;
}

/**
 * Envia um e-mail de recuperação de senha para o endereço informado.
 * RF-015: Recuperação de Senha.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function recuperarSenha(email) {
  return sendPasswordResetEmail(auth, email);
}

// ── Controle de UI da página de Login ──────────────────────
// Este bloco só é executado se estamos na página login.html
if (document.getElementById('form-login')) {
  const formLogin      = document.getElementById('form-login');
  const formCadastro   = document.getElementById('form-cadastro');
  const tabs           = document.querySelectorAll('.tab-btn');
  const erroLogin      = document.getElementById('login-erro');
  const erroCadastro   = document.getElementById('cadastro-erro');

  // ── RF-015: Recuperação de senha ────────────────────────
  const secaoRecuperar  = document.getElementById('section-recuperar');
  const formRecuperar   = document.getElementById('form-recuperar');
  const erroRecuperar   = document.getElementById('recuperar-erro');
  const sucessoRecuperar = document.getElementById('recuperar-sucesso');
  const linkEsqueci     = document.getElementById('link-esqueci');
  const linkVoltarLogin = document.getElementById('link-voltar-login');
  const authTabs        = document.querySelector('.auth-tabs');

  /** Mostra a seção de recuperação e oculta o resto */
  function mostrarRecuperacao() {
    formLogin.classList.add('hidden');
    formCadastro.classList.add('hidden');
    authTabs.classList.add('hidden');
    secaoRecuperar.classList.remove('hidden');
    erroRecuperar.classList.add('hidden');
    sucessoRecuperar.classList.add('hidden');
    document.getElementById('recuperar-email').value = '';
  }

  /** Volta para o formulário de login */
  function voltarLogin() {
    secaoRecuperar.classList.add('hidden');
    authTabs.classList.remove('hidden');
    formLogin.classList.remove('hidden');
    formCadastro.classList.add('hidden');
    tabs.forEach((t) => t.classList.remove('tab-active'));
    tabs[0]?.classList.add('tab-active');
  }

  linkEsqueci?.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarRecuperacao();
  });

  linkVoltarLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    voltarLogin();
  });

  formRecuperar?.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroRecuperar.classList.add('hidden');
    sucessoRecuperar.classList.add('hidden');
    const email = document.getElementById('recuperar-email').value.trim();
    try {
      await recuperarSenha(email);
      // Resposta genérica: não revela se o e-mail existe (segurança)
      sucessoRecuperar.textContent =
        'Se este e-mail estiver cadastrado, você receberá um link em breve. Verifique também sua caixa de spam.';
      sucessoRecuperar.classList.remove('hidden');
      formRecuperar.reset();
    } catch (err) {
      erroRecuperar.textContent = traduzirErroFirebase(err.code);
      erroRecuperar.classList.remove('hidden');
    }
  });

  // Flag que bloqueia o redirecionamento automático do onAuthChange
  // enquanto o cadastro está em andamento (evita race condition).
  let _registrando = false;

  // Redireciona baseado no estado do grupo: com grupo → dashboard, sem grupo → setup
  onAuthChange(async (user) => {
    if (!user) return;
    if (_registrando) return; // Cadastro em andamento: aguarda o fluxo terminar
    const perfil = await buscarPerfil(user.uid);
    if (perfil?.grupoId) {
      window.location.href = 'index.html';
    } else {
      window.location.href = 'grupo.html';
    }
  });

  // Controle de abas
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
      const aba = tab.dataset.tab;
      formLogin.classList.toggle('hidden', aba !== 'login');
      formCadastro.classList.toggle('hidden', aba !== 'cadastro');
    });
  });

  // Submit de Login
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroLogin.classList.add('hidden');
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    try {
      await login(email, senha);
      // onAuthChange cuidará do redirecionamento
    } catch (err) {
      erroLogin.textContent = traduzirErroFirebase(err.code);
      erroLogin.classList.remove('hidden');
    }
  });

  // Submit de Cadastro — captura nome + email + senha
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroCadastro.classList.add('hidden');
    const nome  = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const senha = document.getElementById('cadastro-senha').value;

    _registrando = true; // Bloqueia o onAuthChange de redirecionar durante o cadastro
    try {
      await cadastrar(nome, email, senha);
      // Cadastro completo — redireciona manualmente para setup de grupo
      window.location.href = 'grupo.html';
    } catch (err) {
      // Se o Auth foi criado mas criarPerfil falhou, remove o usuário órfão do Auth
      // para evitar estado inconsistente (autenticado sem perfil no Firestore).
      if (auth.currentUser) {
        try { await auth.currentUser.delete(); } catch (_) { /* ignora */ }
        await signOut(auth).catch(() => {});
      }
      _registrando = false;
      erroCadastro.textContent = traduzirErroFirebase(err.code);
      erroCadastro.classList.remove('hidden');
    }
  });
}

/**
 * Traduz códigos de erro do Firebase para português.
 * @param {string} code
 * @returns {string}
 */
function traduzirErroFirebase(code) {
  const erros = {
    'auth/invalid-email':           'E-mail inválido.',
    'auth/user-not-found':          'Usuário não encontrado.',
    'auth/wrong-password':          'Senha incorreta.',
    'auth/email-already-in-use':    'Este e-mail já possui uma conta. Use a aba "Entrar" ou recupere sua senha.',
    'auth/weak-password':           'Senha muito fraca. Use no mínimo 6 caracteres.',
    'auth/too-many-requests':       'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed':  'Erro de conexão. Verifique sua internet.',
  };
  return erros[code] || `Erro inesperado: ${code}`;
}
