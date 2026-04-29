import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lucide to avoid DOM dependency in unit tests
vi.mock('lucide', () => {
  const icon = () => ({ toSvg: () => '<svg></svg>' });
  return {
    createIcons: vi.fn(),
    BarChart2: icon(),
    BarChart3: icon(),
    Building2: icon(),
    Calendar: icon(),
    Camera: icon(),
    CheckCircle: icon(),
    ChevronDown: icon(),
    ClipboardList: icon(),
    Coins: icon(),
    Copy: icon(),
    CreditCard: icon(),
    Database: icon(),
    Download: icon(),
    File: icon(),
    Flame: icon(),
    FolderOpen: icon(),
    Home: icon(),
    Inbox: icon(),
    Landmark: icon(),
    Layers: icon(),
    LayoutDashboard: icon(),
    LayoutList: icon(),
    Link: icon(),
    Menu: icon(),
    RefreshCw: icon(),
    ScanLine: icon(),
    Search: icon(),
    Settings: icon(),
    Smile: icon(),
    Sparkles: icon(),
    Tag: icon(),
    Target: icon(),
    Trash2: icon(),
    TrendingDown: icon(),
    TrendingUp: icon(),
    Upload: icon(),
    User: icon(),
    Users: icon(),
    UsersRound: icon(),
    Wallet: icon(),
  };
});

import { createIcons } from 'lucide';

describe('icons.js — RF-072', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exporta initIcons como função', async () => {
    const { initIcons } = await import('../../src/js/utils/icons.js');
    expect(typeof initIcons).toBe('function');
  });

  it('initIcons() chama createIcons com o mapa de ícones', async () => {
    const { initIcons } = await import('../../src/js/utils/icons.js');
    initIcons();
    expect(createIcons).toHaveBeenCalledOnce();
    const [arg] = createIcons.mock.calls[0];
    expect(arg).toHaveProperty('icons');
    expect(typeof arg.icons).toBe('object');
  });

  it('mapa de ícones contém todos os 40 ícones esperados', async () => {
    const { initIcons } = await import('../../src/js/utils/icons.js');
    initIcons();
    const { icons } = createIcons.mock.calls[0][0];
    const expectedIcons = [
      'BarChart2','BarChart3','Building2','Calendar','Camera',
      'CheckCircle','ChevronDown','ClipboardList','Coins','Copy',
      'CreditCard','Database','Download','File','Flame',
      'FolderOpen','Home','Inbox','Landmark','Layers',
      'LayoutDashboard','LayoutList','Link','Menu','RefreshCw',
      'ScanLine','Search','Settings','Smile','Sparkles',
      'Tag','Target','Trash2','TrendingDown','TrendingUp',
      'Upload','User','Users','UsersRound','Wallet',
    ];
    expectedIcons.forEach(name => {
      expect(icons).toHaveProperty(name);
    });
    expect(Object.keys(icons)).toHaveLength(40);
  });

  it('initIcons() não lança exceção', async () => {
    const { initIcons } = await import('../../src/js/utils/icons.js');
    expect(() => initIcons()).not.toThrow();
  });
});
