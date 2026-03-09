// ============================================================
// CONFIGURAÇÃO FIREBASE — Minhas Finanças
//
// IMPORTANTE: Substitua os valores abaixo pelos do seu projeto.
// Encontre-os em: Firebase Console → Seu Projeto → Configurações → Apps Web
//
// ⚠️  NUNCA commite credenciais reais no GitHub!
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  initializeAuth,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            'AIzaSyCm0DBw1sFiUG59_iL8Ofht7QJrcvssMc4',
  authDomain:        'minhas-financas-285da.firebaseapp.com',
  projectId:         'minhas-financas-285da',
  storageBucket:     'minhas-financas-285da.firebasestorage.app',
  messagingSenderId: '849955751024',
  appId:             '1:849955751024:web:8ed2d800d267206aab60b5',
  measurementId:     'G-FZLNQW6WE9',
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Persistência de sessão: a autenticação é descartada ao fechar o navegador.
// Isso impede que dados financeiros fiquem acessíveis em dispositivos compartilhados.
// O usuário precisa fazer login novamente a cada nova sessão do navegador.
const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
});

const db = getFirestore(app);

export { app, auth, db };
