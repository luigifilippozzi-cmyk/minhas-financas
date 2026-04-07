// ============================================================
// PORTÃO DE ENTRADA — RF-017
// Redireciona para Dashboard se autenticado, ou Login se não.
// ============================================================

import { auth } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { buscarPerfil } from '../services/database.js';

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }
  try {
    const perfil = await buscarPerfil(user.uid);
    if (perfil?.grupoId) {
      window.location.replace('dashboard.html');
    } else {
      window.location.replace('grupo.html');
    }
  } catch (_) {
    window.location.replace('login.html');
  }
});
