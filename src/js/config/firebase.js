// ============================================================
// CONFIGURAÇÃO FIREBASE — Minhas Finanças
//
// IMPORTANTE: Substitua os valores abaixo pelos do seu projeto.
// Encontre-os em: Firebase Console → Seu Projeto → Configurações → Apps Web
//
// ⚠️  NUNCA commite credenciais reais no GitHub!
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// TODO: Substitua com as credenciais do seu projeto Firebase
const firebaseConfig = {
  apiKey:            'SUA_API_KEY',
  authDomain:        'SEU_PROJETO.firebaseapp.com',
  projectId:         'SEU_PROJETO_ID',
  storageBucket:     'SEU_PROJETO.appspot.com',
  messagingSenderId: 'SEU_SENDER_ID',
  appId:             'SEU_APP_ID',
};

// Inicializa o Firebase
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
