import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

import { Capacitor } from '@capacitor/core';

describe('inicializarCapacitor', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('não executa nada quando não está em plataforma nativa', async () => {
    Capacitor.isNativePlatform.mockReturnValue(false);
    const { inicializarCapacitor } = await import('../../src/js/utils/capacitor.js');
    await inicializarCapacitor();
    // Se não é nativo, não deve tentar importar StatusBar
    expect(Capacitor.isNativePlatform).toHaveBeenCalled();
  });

  it('configura StatusBar quando em plataforma nativa', async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    const mockSetStyle = vi.fn().mockResolvedValue(undefined);
    const mockSetOverlays = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@capacitor/status-bar', () => ({
      StatusBar: {
        setStyle: mockSetStyle,
        setOverlaysWebView: mockSetOverlays,
      },
      Style: { Light: 'LIGHT' },
    }));
    const { inicializarCapacitor } = await import('../../src/js/utils/capacitor.js');
    await inicializarCapacitor();
    expect(mockSetStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
    expect(mockSetOverlays).toHaveBeenCalledWith({ overlay: true });
  });

  it('loga warning quando StatusBar não está disponível', async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    vi.doMock('@capacitor/status-bar', () => {
      throw new Error('Plugin not installed');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { inicializarCapacitor } = await import('../../src/js/utils/capacitor.js');
    await inicializarCapacitor();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Capacitor]'),
      expect.any(String)
    );
    warnSpy.mockRestore();
  });
});
