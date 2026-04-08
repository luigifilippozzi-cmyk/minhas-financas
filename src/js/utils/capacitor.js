// ============================================================
// Capacitor — Inicialização de plugins nativos
// Só executa quando o app roda dentro do Capacitor (iOS/Android)
// ============================================================

import { Capacitor } from '@capacitor/core';

/**
 * Configura plugins nativos do Capacitor.
 * No navegador comum, não executa nada.
 */
export async function inicializarCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (e) {
    console.warn('[Capacitor] StatusBar não disponível:', e.message);
  }
}
