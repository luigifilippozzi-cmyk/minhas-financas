// NRF-NAV Fase 1 — Inicialização da navbar 5 seções (#154)
// Hamburger toggle (mobile) + active section detection por URL

(function initNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const navEl = document.getElementById('nav-sections');
  if (!hamburger || !navEl) return;

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const open = navEl.hasAttribute('data-open');
    navEl.toggleAttribute('data-open', !open);
    hamburger.setAttribute('aria-expanded', String(!open));
  });

  const fecharGrupos = () => navEl.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));

  // Fechar ao clicar fora da navbar
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navEl.contains(e.target)) {
      navEl.removeAttribute('data-open');
      hamburger.setAttribute('aria-expanded', 'false');
      fecharGrupos();
    }
  }, true);

  // Fechar ao pressionar Esc
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    navEl.removeAttribute('data-open');
    hamburger.setAttribute('aria-expanded', 'false');
    fecharGrupos();
  });

  // Accordion exclusivo — fechar outros ao abrir um grupo
  navEl.querySelectorAll('details').forEach((det) => {
    det.addEventListener('toggle', () => {
      if (!det.open) return;
      navEl.querySelectorAll('details').forEach((other) => {
        if (other !== det) other.removeAttribute('open');
      });
    });
  });

  // Detecção da seção ativa por pathname
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
  const params = new URLSearchParams(window.location.search);

  const sectionMap = {
    dashboard:    'cockpit',
    planejamento: 'cockpit',
    patrimonio:   'historico',
    importar:     'transacoes',
    fatura:       'transacoes',
    despesas:     'transacoes',
    receitas:     'transacoes',
    'base-dados': 'transacoes',
    orcamentos:   'config',
    categorias:   'config',
    contas:       'config',
    grupo:        'config',
    'fluxo-caixa': 'futuro',
  };

  let section = sectionMap[page] ?? null;
  // fatura?tab=projecoes → seção Futuro
  if (page === 'fatura' && params.get('tab') === 'projecoes') section = 'futuro';

  if (section) {
    const group = navEl.querySelector(`.nav-section-group[data-section="${section}"]`);
    if (group) {
      group.setAttribute('open', '');
      group.setAttribute('data-active', '');
    }
  }

  // Destacar o sub-item ativo
  const subItem = navEl.querySelector(`.nav-sub-item[data-page="${page}"]`);
  subItem?.setAttribute('data-active', '');
})();
