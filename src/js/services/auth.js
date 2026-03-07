// ============================================================
// SERVIÇO DE AUTENTICAÇÃO — RF-001
// ============================================================

import { auth } from '../config/firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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

// ── Controle de UI da página de Login ──────────────────────
// Este bloco só é executado se estamos na página login.html
if (document.getElementById('form-login')) {
  const formLogin    = document.getElementById('form-login');
  const formCadastro = document.getElementById('form-cadastro');
  const tabs         = document.querySelectorAll('.tab-btn');
  const erroLogin    = document.getElementById('login-erro');
  const erroCadastro = document.getElementById('cadastro-erro');

  // Redireciona baseado no estado do grupo: com grupo → dashboard, sem grupo → setup
  onAuthChange(async (user) => {
    if (!user) return;
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
    try {
      await cadastrar(nome, email, senha);
      // onAuthChange cuidará do redirecionamento para grupo.html
    } catch (err) {
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
    'auth/email-already-in-use':    'Este e-mail já está em uso.',
    'auth/weak-password':           'Senha muito fraca. Use no mínimo 6 caracteres.',
    'auth/too-many-requests':       'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed':  'Erro de conexão. Verifique sua internet.',
  };
  return erros[code] || `Erro inesperado: ${code}`;
}
