# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [3.39.7] - 2026-04-22

### Adicionado

- **NRF-UX F8 — Microcopy e vocabulário (#200):** guia de tom, padronização de mensagens e remoção de todos os `alert()` do app.
  - `docs/MF_Microcopy.md`: guia completo de tom de voz, padrões de botões, empty states, validação, erros, sucesso, placeholders, glossário de 10 termos e 20 exemplos antes × depois.
  - `src/receitas.html` / `src/js/pages/receitas.js`: validação de formulário migrada de `alert()` para elemento inline `#rec-modal-erro` via helper `_setErroModal()`; erro limpo ao fechar modal; empty state usa mês dinâmico (`Sem receitas em {mês}.`).
  - `src/contas.html` / `src/js/pages/contas.js`: erros de save (saldo e cartão) migrados de `alert()` para `#saldo-modal-erro` / `#cartao-modal-erro`.
  - `src/patrimonio.html` / `src/js/pages/patrimonio.js`: erros de save (investimento e passivo) → `#inv-modal-erro` / `#pass-modal-erro`; snapshot → `_feedbackSnapshot()` com feedback inline temporário (3s).
  - `src/js/pages/base-dados.js`: `alert()` em excluir em massa e purge → `mostrarToast()` existente; texto corrigido de `❌ Erro ao atualizar` → `Não consegui atualizar`.
  - `src/js/pages/fatura.js`, `importar.js`: guards de XLSX não carregado → `console.error` silencioso.
  - `src/js/pages/despesas.js`: empty state usa mês dinâmico; erros de transferência interna → silenciosos (já logados).
  - Empty states padronizados: `Sem receitas em {mês}.` / `Sem despesas em {mês}.` / `Nenhuma despesa para os filtros selecionados.` / `Nenhum cartão. Adicione o primeiro.`
  - Mensagens de erro padronizadas: `Não consegui salvar…` em vez de `Erro ao salvar…`; `Não consegui excluir…`; `Não consegui purgar…`

## [3.39.6] - 2026-04-22

### Adicionado

- **NRF-UX F7 — Chart.js tokens + tabular-nums (#199):** tipografia dos gráficos migrada para tokens CSS; `font-variant-numeric: tabular-nums` aplicado em todas as classes de valores monetários.
  - `src/css/variables.css`: token `--fw-chart: 500` adicionado à seção KPI/gráficos.
  - `src/js/utils/chartDefaults.js`: `aplicarDefaultsControllerCharts()` reescrita para ler `--font-size-chart-tick` (13px), `--font-size-chart-legend` (14px), `--font-size-chart-tooltip` (14px), `--font-family` e `--fw-chart` via `getComputedStyle` — elimina `font.size = 14` hardcoded; guarda `typeof getComputedStyle === 'undefined'` para compatibilidade com ambiente Node.js.
  - `src/css/main.css`: `tabular-nums` adicionado em `.orc-chip-valor`, `.desp-chip-valor`, `.desp-item-valor`/`.despesa-valor`, `.imp-chip-valor`, `.parc-total-valor`, `.parc-compra-valor`, `.rec-item-valor`, `.fat-card-valor`.
  - `src/css/dashboard.css`: `tabular-nums` adicionado em `.parc-total-valor` e `.parc-compra-valor`.
  - `src/css/planejamento.css`: `tabular-nums` adicionado em `.plan-kpi-valor`.
  - `tests/utils/chartDefaults.test.js`: testes atualizados para mockar `getComputedStyle` e testar comportamento token-driven; 3 novos TCs (total: 756).

### Corrigido

- **fix(design-system): tabular-nums em classes monetárias remanescentes** — 3 gaps pré-existentes identificados pelo ux-reviewer durante NRF-UX F7 (#199):
  - `src/css/main.css`: `.rec-cat-valor` — `tabular-nums` + migração de `0.875rem` hardcoded → `var(--font-size-sm)`; `.fat-footer-valor` — `tabular-nums`.
  - `src/css/planejamento.css`: `.plan-valor-previsto` e `.plan-valor-realizado` — `tabular-nums`.

## [3.39.5] - 2026-04-22

### Adicionado

- **NRF-UX F6 — Espaçamento e ritmo vertical (#198):** sistema de ritmo vertical via tokens CSS e conversão completa de valores rem hardcoded para tokens `--space-*`.
  - `src/css/variables.css`: tokens `--space-0-5: 2px`, `--space-0-75: 3px`, `--space-1-5: 6px`, `--space-12: 48px`; tokens de ritmo `--rhythm-sm: 12px`, `--rhythm-md: 24px`, `--rhythm-lg: 48px`; override mobile `--rhythm-lg → 32px` em `@media (max-width: 640px)`.
  - `src/css/dashboard.css`: `.main-content` gap migrado de `--space-8` (32px) para `--rhythm-lg` (48px/32px mobile); `.section-header` `margin-bottom` → `--rhythm-md` (24px); `.section-subtitle` margin → `--rhythm-lg`/`--rhythm-md`; micro valores 2px/3px convertidos para `--space-0-5`/`--space-0-75`.
  - `src/css/main.css`: todos os valores rem hardcoded em `.desp-*`, `.imp-*`, `.rec-*`, `.fc-*`, `.fat-*`, `.ger-*`, `.base-*` e demais seletores convertidos para tokens `--space-*`; page-headers de despesas, importação e base-dados usam `--rhythm-md`.
  - `src/css/components.css`: micro valores 2px/3px na navbar, badge e formulários convertidos; `.badge` padding usa `--space-0-5`/`--space-2`.
  - `src/css/planejamento.css`: micro valores convertidos para tokens.

## [3.39.4] - 2026-04-22

### Adicionado

- **NRF-UX F5 — Skeletons e estados de loading (#197):** cobertura completa de skeletons antes do primeiro `onSnapshot` em 6 páginas-alvo.
  - `src/css/variables.css`: tokens semânticos `--color-surface-muted` e `--color-surface-muted-strong` (light + dark) para uso exclusivo em skeleton shimmer.
  - `src/css/components.css`: skeleton shimmer migrado de cores hardcoded para os novos tokens; novas classes `.skeleton-chart` (placeholder de gráfico, 200px default), `.skeleton-kpi` (valor numérico inline, 1.75rem) e `.skeleton-patrimonio-item` (card flex de ativo/passivo).
  - `src/js/utils/skeletons.js`: 3 novos helpers — `skeletonKpiValue(width)`, `skeletonChart(height)`, `skeletonPatrimonioItems(count)`. Todos os helpers passam a incluir `aria-hidden="true"` para compatibilidade com leitores de tela (WCAG 2.1 SC 1.3.1).
  - `src/js/app.js` (dashboard): skeleton para containers dos gráficos Chart.js (`#dash-chart-categorias`, `#dash-chart-evolucao`) — canvas oculto + placeholder `.skeleton-chart` inserido antes do primeiro paint; `skeletonKpiValue()` substitui código inline nos 5 KPI values. Helper `_revelarCanvas(id)` remove placeholder e exibe canvas ao renderizar.
  - `src/js/pages/fatura.js`: spinner genérico `<p class="fat-loading">Carregando...</p>` na seção de Projeções substituído por `skeletonChart(120)`.
  - `src/js/pages/patrimonio.js`: `skeletonPatrimonioItems(3/2)` inserido em `iniciarListeners()` para `#lista-investimentos` e `#lista-passivos` antes do primeiro snapshot.
  - `src/js/pages/fluxo-caixa.js`: `skeletonTableRows(3, 2)` em `carregarCompromissos()` e `skeletonTableRows(6, 6)` em `carregarForecast()` — substituindo strings de texto genérico.
  - `tests/utils/skeletons.test.js`: 22 novos TCs para os 3 helpers adicionados + `aria-hidden` nos helpers existentes (total: 52 TCs no arquivo, +20 vs sessão anterior).

## [3.39.3] - 2026-04-22

### Adicionado

- **NRF-UX F4 — Unificar iconografia Lucide (#196):** auditoria completa e consolidação de iconografia para PUX3 (única biblioteca em chrome).
  - `src/css/variables.css`: tokens de ícone `--icon-xs` (13px), `--icon-sm` (16px), `--icon-md` (20px), `--icon-lg` (24px) adicionados ao sistema de design.
  - `src/css/components.css`: todas as classes de ícone migradas de px hardcoded para tokens — `.nav-icon`, `.nav-section-icon`, `.nav-sub-icon`, `.section-icon`, `.brand-icon`, `.nav-chevron`.
  - `src/css/main.css`: `.sucesso-icon` migrado de `font-size: 56px` (emoji) para `width/height: 56px` com suporte a SVG Lucide.
  - `src/grupo.html`: Lucide CDN (0.460.0) + `createIcons()` adicionados; emoji `✅` substituído por `<i data-lucide="check-circle">`.
  - `src/login.html`: Lucide CDN (0.460.0) + `createIcons()` adicionados (ícone `wallet` na logo da página).
  - `src/patrimonio.html`: `createIcons()` adicionado (CDN já presente mas chamada ausente — fix de ícones quebrados).

## [3.39.2] - 2026-04-22

### Adicionado

- **NRF-UX F3 — Remover emojis de chrome (#195):** substituição completa de todos os emojis de UI chrome por ícones Lucide em todas as 13 páginas HTML.
  - `src/css/components.css`: classes `.nav-sub-icon` (13×13px, `color-text-muted`) e `.section-icon` (20×20px) para ícones nos sub-menus e títulos de seção.
  - Navbar nav-sub-items: 15 emojis (🏠📋🔮💳📈🏛️⬆️📉🗃️🎯🏷️🏦👥) substituídos por `<i data-lucide="...">` em todas as páginas.
  - Section headers: `<h2>/<h3 class="section-title">` com emojis atualizados para ícones Lucide com `class="section-icon"`.
  - Buttons, labels, spans: todos os emojis de chrome removidos e substituídos por ícones ou texto simples (em `<option>` elements onde HTML não é suportado).
  - Acessibilidade: `aria-hidden="true"` adicionado a todos os 132 ícones Lucide pré-existentes que faltavam este atributo (fix PUX5).
  - JS pages: emojis de chrome em `textContent` (base-dados.js, grupo.js, orcamentos.js, fatura.js, despesas.js, receitas.js) substituídos por texto simples.
  - Emojis de dados do usuário preservados: `inp-cartao-emoji`, `preview-emoji`, `cat-emoji` (input/preview do emoji de categoria/conta).

## [3.39.1] - 2026-04-21

### Adicionado

- **NRF-UX F2 — Fraunces nos títulos + ux-reviewer + patches de governança (#194):**
  - `src/css/components.css`: `h1, h2 { font-family: var(--font-display); }` — Fraunces Variable ativa em todos os títulos de página (`.section-title` h2 e `.auth-title` h1). Fonte já self-hosted via `@font-face` com `font-display: swap`.
  - `docs/BUSSOLA_PRODUTO.md`: §12.5 PUX1–PUX6 (Princípios de Experiência) inserida; §9 Ordem de Ataque atualizada com fila NRF-UX F2–F8.
  - `docs/MF_Prompt_UXReviewer_Squad.md`: prompt completo do subagente `ux-reviewer` criado.
  - `AGENTS.md`: subagente `ux-reviewer` adicionado com trigger, entregável e protocolo.
  - `CLAUDE.md`: Regra Inviolável #14 — PR com HTML/CSS sem relatório `ux-reviewer` = BLOQUEANTE.

## [3.39.0] - 2026-04-21

### Adicionado

- **NRF-VISUAL Fase 1 — Hierarquia Visual Controller (#192):** implementação de hierarquia de contraste no Cockpit para destacar KPIs de decisão imediata.
  - Novos tokens em `variables.css` (light + dark): `--color-surface-hero` (#1F1F1C/dark #0F0F0E), `--color-surface-hero-alt`, `--color-text-on-hero` (#FAF9F5), `--color-text-on-hero-muted`, `--color-border-on-hero`, `--shadow-hero`, `--font-size-kpi` (28px), `--font-size-kpi-hero` (40px), `--font-size-chart-tick` (13px), `--font-size-chart-legend` (14px), `--font-size-chart-title` (13px), `--font-size-chart-tooltip` (14px).
  - Novos componentes em `components.css`: `.card-hero` (fundo carbono, texto ivory, shadow hero, KPI 40px, dark mode pareado), `.card-subtle` (fundo surface-alt). Regra PV4: máximo 3 heros simultâneos.
  - Novo módulo `src/js/utils/chartDefaults.js`: `aplicarDefaultsControllerCharts()` configura `Chart.defaults.font.size = 14`, tooltip bodyFont/titleFont = 14, legend labels font = 14.
  - 6 testes unitários em `tests/utils/chartDefaults.test.js`.

### Modificado

- **Cockpit — card Saldo Real (RF-068):** `card-saldo-real` recebe `.card-hero` permanente em `dashboard.html` e em `renderizarCardSaldoReal()` — sempre hero quando visível (PV2: âncora principal do Cockpit).
- **Cockpit — card Próxima Fatura (RF-065):** `renderizarCardProximaFatura()` em `app.js` recebe `proximoMesFatura` como parâmetro e aplica `.card-hero` condicionalmente quando `diasAte ≤ 7` (fatura vence em ≤ 7 dias).
- **Cockpit — Burn Rate (RF-069):** `renderizarBurnRate()` aplica `.card-hero` ao widget quando qualquer categoria projeta estouro > 10% do orçamento (`percentualProjetado > 110`).
- **Tipografia de gráficos — `app.js`:** ticks atualizados de 11/12px → 13px; legend de 12px → 14px (2 gráficos: categorias e evolução mensal).
- **Tipografia de gráficos — `fluxo-caixa.js`:** ticks/títulos de eixo atualizados de 11/12px → 13px (gráfico fluxo anual).
- `app.js`: importa e chama `aplicarDefaultsControllerCharts()` no boot, após `inicializarCapacitor()`.
- `docs/DESIGN_SYSTEM.md` §2, §8, §10: tokens de KPI/gráfico documentados; `.card-hero` e `.card-subtle` adicionados a §8 Cards; contraste hero (≥12:1) registrado em §10 Acessibilidade.
- `docs/BUSSOLA_PRODUTO.md` §8, §9, §11, §12: P6 adicionado aos princípios de design; §9 atualizado com NRF-VISUAL F1 como item 8; decisão de 2026-04-21 registrada em §11; nova seção §12 com PV1–PV6 (Princípios Visuais Controller).

## [3.38.0] - 2026-04-20

### Modificado

- **NRF-NAV Fase 3 Opção B — ENH-005 + Design System refinements (#189):** simplificação de `despesas.html` (ENH-005 absorvida de #158): removidos KPI carousel de portadores/responsáveis (`chips-responsavel`, `chips-compartilhadas`, `chip-meu-bolso`) e widget "Parcelamentos em Aberto" — o cabeçalho da página agora exibe apenas Total do Mês + Contagem de Registros, focando a tela em seu papel operacional de CRUD/listagem. Listener `ouvirParcelamentosAbertos` e funções `renderizarPainelParcelamentos`, `agruparParPorCompra`, `renderizarChipsResponsavel`, `renderizarChipsCompartilhadas` removidos de `despesas.js`; `_unsubProj` eliminado (zero memory leak). Parcelamentos acessíveis via seção Futuro → Projeções (PR #187).
- **Design System tokens — substituição de cores hardcoded (RF-070):** `fluxo-caixa.html` legend dots migrados de hex hardcoded (`#2e7d32`, `#c62828`, `#9e9e9e`, `#1565c0`) para tokens `var(--color-income)`, `var(--color-expense)`, `var(--color-text-muted)`, `var(--color-info)`. `components.css` — shadow do `.btn-danger:hover` migrado de `rgba(239,68,68,0.28)` (cor pré-rebrand) para novo token `--shadow-danger` alinhado ao Warm Finance. `despesas.js` — fallback de cor de categoria migrado de `#6c757d` para `getComputedStyle` + `--color-text-muted`.
- **Segurança (XSS hardening) — `despesas.js`:** `escHTML()` aplicado em: `onclick` com `d.id` (4 botões inline), `<option>` de responsáveis, responsáveis do filtro, categorias (nome+emoji+id) e contas (nome+emoji+id); `title` de badge de conta sanitizado.

### Removido

- `despesas.html`: KPI carousel (chips de portador/responsável + Meu Bolso), widget "Parcelamentos em Aberto", botão `btn-ver-parc-desp` (ENH-005 — issue #158 absorvida).

## [3.37.0] - 2026-04-20

### Adicionado

- **NRF-NAV Fase 2: consolidação Projeções×Futuro + Planejamento→Cockpit (#186):** extração de `carregarProjecoes()` + `renderizarProjecoes()` de `fatura.js` para novo módulo reutilizável `src/js/utils/projecoesCartao.js` com duas exports: `iniciar(grupoId, cartaoId, mes, ano, onUpdate)` → listener em tempo real por cartão (retorna array de unsubscribes; caller gerencia cleanup, zero leak) e `buscarProjecoesAgregadas(grupoId, mes, ano)` → one-shot fetch de todos os cartões agregados por `mesFatura`. Nova seção "📅 Compromissos Comprometidos — Próximos 6 Meses" adicionada a `fluxo-caixa.html` (âncora `#compromissos`) consumindo o módulo para agregar parcelas importadas de todos os cartões. Link sutil "ver todos os cartões consolidados em Futuro →" adicionado à aba Projeções de `fatura.html`. Navbar refatorada: `planejamento.html` migrado da seção Futuro para nova seção **Cockpit** (agora `<details>` com sub-itens Dashboard + Planejamento) em todos os 11 HTMLs; `nav.js` atualizado com `planejamento: 'cockpit'` no sectionMap (Q2=Cockpit, decisão PO 2026-04-20). 11 novos testes em `tests/utils/projecoesCartao.test.js`. 690 testes passando.

### Modificado

- `src/js/pages/fatura.js`: `carregarProjecoes()` refatorado para delegar ao módulo `projecoesCartao.js`; cleanup de `_unsubProjecoes[]` garantido ao recarregar; cálculo `porMembro` permanece em fatura.js (acesso a `_membrosDoGrupo()`).
- `src/js/pages/fluxo-caixa.js`: `carregarForecast()` e novo `carregarCompromissos()` rodando em paralelo via `Promise.all`.
- `src/js/nav.js`: `planejamento` mapeado para seção `cockpit` (antes `futuro`); branch especial de ativação do Cockpit removida (agora usa lógica genérica de `<details>`).

## [3.36.0] - 2026-04-19

### Adicionado

- **ENH-004: progressive disclosure — 1 badge visível por linha de despesa (#151):** a listagem de despesas exibia até 6 badges simultâneos (conta, portador, parcela, projeção, conjunta, transferência). Agora o estado compacto exibe no máximo 1 badge de acordo com a hierarquia de prioridade: `transferência > projeção > parcela X/Y > conjunta > portador`. Um toggle `▾` aparece quando há mais de 1 metadado disponível, abrindo um painel expansível (`<details>`/`<summary>` nativo — zero JS extra) com todos os badges. Sem regressão em editar/excluir/filtrar. 679 testes passando.

## [3.35.0] - 2026-04-19

### Adicionado

- **ENH-002: exibir origem e destino em transferências internas (#152):** linhas com `tipo=transferencia_interna` na Base de Dados agora exibem a rota da transferência como subtítulo na coluna Descrição (`portador → destino` para despesas; `origem → portador` para receitas), resolvida via `_nomesMembros` do grupo. Badge de tipo renomeado para "🔁 Transferência" com cor info (`ger-tipo-transf`). Novo filtro "🔁 Transferências Internas" no seletor de tipo da aba Gerenciar. Filtro de despesas atualizado para excluir transferências internas ao selecionar "💸 Despesas". Todos os valores inseridos via `escHTML()`. 665 testes passando.

## [3.34.0] - 2026-04-19

### Adicionado

- **RF-070: Design System v1.0 — formalização Warm Finance + governança (#182):** promoção da identidade visual NRF-UI-WARM (v3.32.0) a Design System v1.0 oficial do projeto. Nova pasta `design-system/` com `README.md` (guia de uso e contribuição), `tokens.md` (especificação humana de paleta, tipografia, spacing, motion e componentes canônicos) e `preview/kpi-card.html` (mini-Storybook self-hosted: três estados — conteúdo, loading, empty — sem CDN externa, fontes via `@font-face` apontando para `src/assets/fonts/`). Novo `.auto-memory/design-decisions.md` com ADR inicial documentando a decisão de não adotar a proposta ZIP v1.1 e de manter `variables.css` como fonte técnica canônica (sem `tokens.css` separado). Novo `.auto-memory/questions-to-po.md` como placeholder estruturado para perguntas de design. `AGENTS.md` acrescido de guard rail no topo (leitura de `tokens.md` obrigatória antes de task de UI), nova seção `## Design & Frontend` (ordem de leitura, hard constraints, three-state, mobile-first 375/414, regra do silêncio), fonte de instrução #3 atualizada e checklist de PR com 4 novos itens de UI. `CLAUDE.md` §Anti-patterns ganha entrada para `design-system/tokens.md`. 665 testes passando — PR #182.

## [3.33.0] - 2026-04-17

### Adicionado

- **NRF-NAV Fase 1: navbar 5 seções gerenciais + CA3 Google Fonts removido (#154):** substituição completa da navbar flat (10 botões) por estrutura hierárquica de 5 seções — Cockpit, Futuro, Histórico, Transações e Config — usando elementos nativos `<details>`/`<summary>` (expand/collapse sem JS obrigatório). Novo módulo `src/js/nav.js`: hamburger toggle (mobile, `data-open` no `<nav>`), fechamento ao clicar fora, detecção da seção ativa por URL pathname e abertura automática do grupo correto via `sectionMap`. Regra especial: `fatura.html?tab=projecoes` mapeia para seção Futuro. CSS completo em `components.css` (~185 linhas): `.nav-section-group`, `.nav-section-btn`, `.nav-sub-menu` (dropdown absoluto), `.nav-section-btn--cta` (CTA terracota para Transações), responsive breakpoint 1024px (hamburger + drawer mobile full-screen). CA3 completado: removidas 3 tags Google Fonts CDN (`<link rel="preconnect">` + `<link href="...googleapis.com...">`) de todos os 13 HTML — zero CDN externo. `planejamento.html` recebe `nav.js` (ausente na geração anterior). 15 arquivos alterados, 1022 inserções, 217 remoções. 665 testes passando — PR #180.

## [3.32.0] - 2026-04-17

### Adicionado

- **NRF-UI-WARM: identidade visual Warm Finance + glifo auto-calc + fontes self-hosted (#172):** redesign da camada de tokens em `src/css/variables.css` com a paleta Warm Finance — terracota `#CC785C` (primária), ivory `#FAF9F5` (background), kraft `#F0EEE6` (surface alt), bordas e textos calibrados para contraste WCAG AA (texto muted `#8B8A82` com 4.7:1 sobre ivory). Fontes Inter Variable (UI/numeric) e Fraunces Variable (display) self-hosted em `src/assets/fonts/` (sem CDN externa). Nova classe utilitária `.auto-calc-glifo` para o glifo `✲` (U+2732), aplicada em estados calculados automaticamente: header "Ritmo de Gasto" (RF-069) e "Forecast — Próximos 6 Meses" (RF-067), badge "Auto" da Liquidação (RF-064), badge "estimativa" do forecast, e badges de detecção automática de banco e conta no importador. Zero hex hardcoded fora de `variables.css`. Repaint puramente cosmético — sem mudanças de lógica JS além da inserção do glifo em templates literais já existentes (sem impacto em pipeline, dedup, Firestore). 665 testes passando — PR #TBD.
## [3.31.0] - 2026-04-17

### Adicionado

- **RF-066: Patrimônio Ativos/Passivos (#155):** nova página `patrimonio.html` com gestão completa de carteira de investimentos (atualização manual) e repositório de dívidas extrajudiciais, calculando Patrimônio Líquido em tempo real. Novos modelos: `Investimento.js` (tipos: renda_fixa, renda_variável, previdência, criptoativo, outro) e `PassivoExtrajudicial.js` (status: em_acompanhamento, em_negociação, parcelada, quitada). Novas coleções Firestore: `investimentos/{grupoId}/`, `passivos_extraju/{grupoId}/`, `patrimonio_historico/{grupoId}/{YYYY-MM}/snapshot`. Fórmula PL: saldoContas (derivado de transações via `isMovimentacaoReal()`) + totalInvestimentos − totalPassivosAtivos. KPIs: Saldo Contas, Investimentos, Total Ativos, Passivos Ativos, Patrimônio Líquido, Taxa de Poupança do mês. Gráfico Chart.js de evolução patrimonial histórica. Snapshot mensal salvo via botão manual; log automático no 1º dia do mês. Alerta visual ⚠ para investimentos sem atualização > 30 dias. Regra: investimentos NUNCA deletados — apenas arquivados (`ativo: false`). 54 novos testes unitários em `tests/models/Investimento.test.js`, `tests/models/PassivoExtrajudicial.test.js`, `tests/pages/patrimonio.test.js`. 665 testes passando — PR #178.

## [3.30.0] - 2026-04-16

### Adicionado

- **RF-069: Burn Rate por Categoria (#170):** card "🔥 Ritmo de Gasto" adicionado ao Cockpit do Dashboard, exibindo burn rate (velocidade de consumo) por categoria com orçamento ativo no mês corrente. Novo módulo `burnRateCalculator.js` (stateless/puro): recebe arrays de despesas do mês, orçamentos e categorias; retorna projeção mensal por categoria com classificação visual verde/amarelo/vermelho. Regras: burn rate diário = SUM(despesas reais últimos 7 dias) / 7; projeção = gasto atual + burn rate × dias restantes; classificação verde ≤90%, amarelo 90–100%, vermelho >100% do orçamento; categorias com <3 dias de dados marcadas como "amostra insuficiente" (sem projeção extra). Card visível apenas no mês corrente (burn rate sobre dados em tempo real), atualizado via `onSnapshot` a cada nova despesa ou mudança de orçamento. Usa `isMovimentacaoReal()` para filtrar projeções e transferências internas. 17 novos testes unitários em `tests/utils/burnRateCalculator.test.js` (91.4% branch coverage). 611 testes passando — PR #177.

## [3.29.0] - 2026-04-16

### Adicionado

- **RF-068: Saldo Real por Conta (#169):** card "🏦 Saldo Real" no Cockpit do Dashboard exibe saldo consolidado de todas as contas bancárias e dinheiro ativas, com lista expansível por conta e alerta vermelho em saldo negativo. Usuário configura `saldoInicial` (valor atual) e `dataReferenciaSaldo` (data de referência) via Configurações > Contas — botão "Saldo" adicionado a cada conta bancária. Saldo Real = `saldoInicial + SUM(receitas) − SUM(despesas reais + pagamentos_fatura)` desde `dataReferenciaSaldo`. Card visível apenas quando ≥ 1 conta tem saldo configurado; invisível para cartões. Novos módulos: `ouvirDespesasDesdeData` e `ouvirReceitasDesdeData` em `database.js` (listeners onSnapshot por grupoId desde uma data); `iniciarListenerSaldoReal` e `renderizarCardSaldoReal` em `app.js`. Guard de membership em `salvarSaldo`; validação `ISO_DATE_RE` em `dataReferenciaSaldo`. Usa índices Firestore existentes `(grupoId, data DESC)`. 594 testes passando — PR #174.

### Corrigido

- **XSS: `escHTML()` ausente em `renderizarPainelParcelamentos` (`app.js`):** `p.responsavel`, `p.portador` e `p.descricao` (dados do Firestore/import) eram inseridos via `innerHTML` sem sanitização — vetor potencial de XSS com dados maliciosos importados. Detectado pelo security-reviewer durante revisão do RF-068. 594 testes passando — PR #176.

## [3.28.1] - 2026-04-16

### Corrigido

- **BUILD-BROKEN-P0: `buscarDespesasMes` duplicado em `database.js` — restaurar build e deploy (#171):** RF-060 (planejamento) declarara `buscarDespesasMes(grupoId, mes, ano)` na linha 1092; RF-067 (forecastEngine) adicionou `buscarDespesasMes(grupoId, ano, mes)` na linha 665. Rollup falhava com `Identifier has already been declared` — build e deploy quebrados (5 runs CI consecutivos falhando desde 2026-04-16T02:52Z). Fix: removida declaração duplicada (linha 1092); 3 callers em `planejamento.js` atualizados para assinatura canônica `(grupoId, ano, mes)`. 594 testes passando — PR #171.

## [3.28.0] - 2026-04-17

### Adicionado

- **RF-067: Forecast de Caixa Prospectivo 6 Meses (#166):** seção "🔮 Forecast — Próximos 6 Meses" adicionada à página `fluxo-caixa.html` com decomposição visível por componente. Novo módulo `forecastEngine.js` (stateless/puro): recebe arrays de despesas N-1/N-2, receitas N-1/N-2, projeções Firestore e orçamentos; retorna projeção por mês com campos `receitasEsperadas` (receitas recorrentes alta+média), `recorrentes` (despesas fixas detectadas), `parcelas` (tipo:'projecao', certo), `variaveis` (teto de orçamentos) e `saldoProjetado`. Flag `estimativaLimitada` acende badge de aviso quando histórico tem < 3 transações em N-1 ou N-2. Cross-year suportado (projeções que cruzam virada de ano). 3 novas funções em `database.js`: `buscarDespesasMes`, `buscarReceitasMes`, `buscarProjecoesRange`. Forecast é SOMENTE LEITURA — não cria/altera documentos Firestore. 31 novos TCs em `tests/utils/forecastEngine.test.js`. 563 → 594 testes passando — PR #168.

## [3.27.0] - 2026-04-16

### Adicionado

- **RF-065: card "Próxima Fatura" no dashboard + deep link ?tab=projecoes (#153):** novo card na grade de KPIs do dashboard que exibe o total projetado para o próximo mês de faturamento (`mesFatura = mês corrente + 1`), com breakdown por membro (Luigi / Ana). Usa `ouvirDespesasPorMesFatura()` com filtro `tipo='projecao'` — leitura somente (sem alterações no Firestore). `isConjunta=true`: usa `valorAlocado` para evitar dupla contagem. Card oculto por padrão; exibido apenas quando há projeções para o próximo mês. Link "ver projeções →" abre `fatura.html?tab=projecoes`. Em `fatura.js`: URL param `?tab=` detectado em `configurarEventos()` com whitelist `['todas','projecoes','conjuntas','liquidacao']`; tab ativada na primeira renderização via flag `_tabInicial` (one-time). 563 testes passando — PR #167.

## [3.26.0] - 2026-04-16

### Adicionado

- **ENH-003: filtro "Não categorizada" + seletores segregados por tipo (#150):** (1) Em `base-dados.html`, adicionada opção "— Não categorizada" ao dropdown de filtro por categoria — exibe transações onde `categoriaId` é `null`, `''` ou aponta para uma categoria excluída. Sentinela `__nao_categorizada__` tratada em `aplicarFiltros()`. (2) Em `despesas.html`, modal e filtro de categoria agora exibem apenas categorias de tipo `'despesa'`; categorias de receita (Salário, Rendimentos) não aparecem mais. Categorias legacy sem campo `tipo` tratadas como despesa. `receitas.html` já estava correto — sem alteração. +15 TCs em `tests/pages/base-dados.filtro.test.js`. 563 testes passando — PR #165.

## [3.25.0] - 2026-04-15

### Adicionado

- **ENH-001: edição de duplicata no preview faz update, não insert (#149):** ao marcar manualmente uma linha de duplicata na tabela de preview e clicar em Importar, o sistema agora chama `atualizarDespesa`/`atualizarReceita` no documento Firestore já existente (`duplicado_docId`) em vez de criar um novo documento — evitando duplicação de registros. Campos atualizados: `categoriaId`, `contaId`, `responsavel`, `portador`, `isConjunta`, `valorAlocado`. Campos imutáveis preservados: `tipo`, `mesFatura`, `data`, `valor`, `chave_dedup`. +4 TCs em `deduplicador.test.js` (contrato `duplicado_docId` via Map). 548 testes passando — PR #164.

### Corrigido

- **BUG-032: `mesFatura` ausente dos `opcionais` em `modelDespesa` e `modelReceita` (#162) — aba Fatura vazia para novos imports:** `mesFatura` não estava listado em `opcionais` de `Despesa.js` e `Receita.js`. O campo era descartado silenciosamente ao passar pelos models antes de salvar no Firestore — apenas o path de duplicatas (`atualizarDespesa`/`atualizarReceita` direto) propagava o campo corretamente. Resultado: `ouvirDespesasPorMesFatura()` retornava zero resultados para toda transação nova → aba Fatura sempre vazia. Fix: adicionado `'mesFatura'` às listas `opcionais` em ambos os models. +2 TCs em `Despesa.test.js`, novo arquivo `Receita.test.js` (+5 TCs). 544 testes passando — PR #163.

## [3.24.0] - 2026-04-15

### Corrigido

- **BUG-029: categorias de receita exibidas no grid de orçamentos/despesas do dashboard:** `ouvirCategorias()` retorna todas as categorias ativas (despesa + receita), e `renderizarDashboard` renderizava todas em `categorias-grid` sem filtrar por tipo. Resultado: categorias como "Reembolso Médico" apareciam no breakdown de gastos, distorcendo os totais. Fix em `controllers/dashboard.js`: filtro `categorias.filter(c => !c.tipo || c.tipo === 'despesa')` antes do render; categorias legacy (sem campo tipo) tratadas como despesa. +6 TCs em `tests/controllers/dashboard.test.js` (novo arquivo). 525 testes passando — PR #160.

- **BUG-031: `categoriaId` salvo como string sentinela `'__tipo__pagamento_fatura'` / `'__tipo__transferencia_interna'` em vez de `null`:** blocos RF-063 e RF-064 em `executarImportacao()` sobrescreviam `tipo` mas não resetavam `categoriaId`. O valor lido do select DOM (`'__tipo__*'`) ficava no campo e era salvo no Firestore, exibindo texto inválido na coluna Categoria de `base-dados.html`. Fix em `importar.js`: `despDados.categoriaId = null` adicionado em ambos os blocos (`modelDespesa` converte `null → ''` via `??`). +12 TCs em `tests/models/Despesa.test.js` (novo arquivo). 531 testes passando — PR #161.

## [3.23.9] - 2026-04-15

### Corrigido

- **BUG-030: `responsavel` salvo como valor negativo em extrato bancário (bloqueia edição):** ao importar CSV de extrato bancário sem coluna `portador`/`titular` no header, o fallback `idxPortador = 2` apontava para a coluna Valor. Resultado: `portador = "-42.5"` era salvo como `responsavel` no Firestore, bloqueando edição (campo obrigatório aparecia com valor inválido). Fix em `normalizadorTransacoes.js`: removido o fallback `idxPortador = 2` dentro do bloco `headerIdx >= 0` — quando o header existe mas não tem coluna portador, `idxPortador = -1 → portador = ''`. Bonus: a condição `!l.portador` em `importar.js:_aplicarTipo('banco')` agora funciona corretamente (antes, string numérica truthy impedia a auto-atribuição do responsável ao usuário logado). 5 novos TCs de regressão. 519 testes passando — PR #159.

## [3.23.8] - 2026-04-14

### Adicionado

- **feat(importar): seletor de categoria no preview bancário exibe o tipo de transação (RF-063/RF-064):** ao selecionar uma categoria no preview de importação bancária, o tipo de transação (despesa/receita/transferência) é agora exibido contextualmente no seletor — commit `12c3d70`.

- **[Processo]** Issue retroativa #147 criada e fechada em 2026-04-15 — aceite consciente do PO: commit direto em main (Regra 11), risco baixo (UI de preview, 514 testes passando, sem impacto em pipeline/dedup/mesFatura).

### Corrigido

- **BUG-028b: Arrays sparse do SheetJS causavam crash "Cannot read properties of undefined (reading 'includes')":** SheetJS 0.18.5 retorna arrays sparse (holes `undefined` reais) ao ler XLS. `Array.prototype.map` pula holes, gerando arrays com `undefined` nas posições vazias. `findIndex` visitava esses `undefined` e chamava `undefined.includes()` → TypeError. Fix: substituído `rows[i].map(...)` por `Array.from(rows[i], c => ...)` em `normalizadorTransacoes.js` e `detectorOrigemArquivo.js` — `Array.from` converte holes em `undefined` explícito e o mapper transforma via `String(c ?? '')`.
- **BUG-028b: BTG XLS classificado incorretamente como "receita":** BTG extrato bancário tem coluna "Categoria" (para classificar lançamentos). `_detectarTipo` detectava `temCategoria && !temPortador && !temParcela` e retornava `'receita'`. Fix: adicionada condição `!temDataEHora` — extrato bancário usa "Data e hora", template de receitas usa "Data". 5 novos TCs (3 em normalizadorTransacoes, 3 em detectorOrigemArquivo).

## [3.23.7] - 2026-04-14

### Corrigido

- **BUG-028 (fix real): Loop de header detection limitado a 10 linhas:** o loop `for (i < Math.min(rows.length, 10))` verificava índices 0–9, mas o BTG XLS tem o header exatamente no índice 10 (após 10 linhas de metadata). Resultado: `headerIdx = -1` → todos os erros "Data inválida, Valor inválido" persistiam mesmo após o fix do PR #143. Fix: limite ampliado para 15 linhas em `normalizadorTransacoes.js` e `detectorOrigemArquivo.js`. 1 novo TC com estrutura real BTG (10 linhas de metadata + header no índice 10 + transação). 509 testes passando.

## [3.23.6] - 2026-04-14

### Corrigido

- **BUG-028 (complemento): Filtro "Saldo Diário" BTG XLS:** após correção do header detection, linhas de snapshot de saldo ("Saldo Diário" com data e valor válidos) eram importadas como transações reais. Adicionado filtro explícito `_normCell(estab) === 'saldo diario'` no loop de parsing. 1 novo TC com estrutura real do BTG (data em col 1, "Saldo Diário" em col 6, valor em col 10). 508 testes passando.

## [3.23.5] - 2026-04-14

### Corrigido

- **BUG-028: Extrato BTG XLS não parseável:** headers com "Data e hora" não eram detectados (exigiam match exato "data"). Causava 100% de linhas com erro "Data inválida, Valor inválido". Fixes: (1) detecção de header aceita `c === 'data' || c === 'data e hora'` — (2) mapeamento de coluna idem — (3) strip de horário BTG ("30/03/2026 18:43" → "30/03/2026") antes de parse. 6 novos TCs cobrindo layout BTG real com metadata, valores negativos (débitos) e linhas de saldo. Impacto: usuários do BTG conseguem importar extratos bancários normalmente.

---

## [3.23.4] - 2026-04-14

### Testes

- **Tech debt — skeletons.js:** 31 novos testes unitários para os 4 geradores de HTML do módulo `src/js/utils/skeletons.js`.
  - `skeletonCards` (10 TCs): count=0, count=1, count=5, count=10, ciclo de 5 larguras, skeleton-circle/amount por card.
  - `skeletonTableRows` (8 TCs): count=0, defaults, linhas e colunas corretas, skeleton-line por célula, margin:0.
  - `emptyStateHTML` (7 TCs): inclusão de ícone/título/hint, omissão de hint quando vazio/ausente, classes CSS.
  - `errorStateHTML` (6 TCs): título/hint, classe error-state, botão retry, classes CSS.
  - Suite total: **501 testes** (19 arquivos). Antes: 470 (18 arquivos).

---

## [3.23.3] - 2026-04-13

### Testes

- **Tech debt — pdfParser.js (#141):** 47 novos testes unitários para `extrairTransacoesPDF` (RF-020) via mock de `window.pdfjsLib` com `vi.stubGlobal`.
  - Cobre: guarda de erro (lib ausente, workerSrc), PDF vazio/items vazios, 5 formatos de data, 6 formatos de valor, flag D/C (débito/crédito), 11 padrões de linhas ignoradas (saldo/total/extrato/agência/banco/CPF/CNPJ/cabeçalho), extração de descrição e limite de 100 chars, 3 níveis de confiança, agrupamento de items por Y e ordenação por X, PDF multi-página.
  - **Tech debt de testes 100% concluído**: `pdfParser.js` era o único módulo em `src/js/utils/` sem cobertura.
  - Suite total: **470 testes** (18 arquivos). Antes: 423 (17 arquivos).

---

## [3.23.2] - 2026-04-13

### Testes

- **Tech debt — cobertura de módulos (#140):** 93 novos testes unitários para módulos sem cobertura prévia.
  - `bankFingerprintMap.test.js` (24 TCs): integridade estrutural do mapa de 15 bancos — IDs únicos, filePatterns como RegExp, keywords em lowercase.
  - `detectorOrigemArquivo.test.js` (39 TCs): detecção de tipo por colunas CSV/PDF, identificação de banco por fileName e keywords, scoring, pipeline routing.
  - `recurringDetector.test.js` (30 TCs): confiança alta/media/baixa, descrições genéricas, projeções ignoradas, ordenação, campos opcionais null/undefined.
  - Suite total: **423 testes** (antes: 330). Cobertura: bankFingerprintMap 100%, detectorOrigemArquivo ~97%, recurringDetector ~94%.

### Manutenção

- Limpeza de refs remotas órfãs: `git remote prune origin` — 3 branches mergeadas removidas do registro local.

---

## [3.23.1] - 2026-04-13

### Corrigido

- **Segurança (XSS) — fatura.js (#135):** Nomes de membros do grupo (Firestore) eram inseridos no `innerHTML` sem `escHTML()` em 6 locais — botões de aba, atributos `id` dinâmicos, badges `fat-resp-chip`, cabeçalhos de resumo e projeções. Detectado pelo security-reviewer após PR #134. Corrigido com `escHTML()` em todos os pontos.

---

## [3.23.0] - 2026-04-13

### Adicionado

- **RF-064: Reconciliacao de Pagamento de Fatura (#127):** novo tipo `'pagamento_fatura'` para debitos bancarios que representam pagamento de fatura de cartao — eliminando o double count (PAG FATURA R$ 3.500 + compras R$ 3.500 = R$ 7.000 exibido vs R$ 3.500 real).
- Novo modulo `reconciliadorFatura.js` com score 0–100: regex(40pts) + valor(40pts) + janela temporal(20pts).
- `isPagamentoFatura()`: deteccao por 10+ padroes de bancos brasileiros (PAG FATURA, PGTO FAT, DEB AUTO CARTAO, etc.).
- `detectarPagamentoFatura()`: integrado no pipeline de importacao bancaria apos `detectarTransferenciasInternas` (ordem correta).
- `recalcularScoreFatura()`: reavalia score apos carregar total real do ciclo de fatura.
- 5 novos campos opcionais em `modelDespesa`: `mesFaturaQuitado`, `contaCartaoId`, `statusReconciliacaoFatura`, `scoreFatura`, `valorFaturaTotal`.
- `isMovimentacaoReal()` atualizado para excluir `'pagamento_fatura'` dos agregados de gastos (dashboard, planejamento, fluxo de caixa).
- Badge visual "💳 Pag. Fatura" no preview de importacao bancaria com score de confianca.
- Nova aba "🔗 Liquidacao" em fatura.html: mostra status do ciclo (liquidado/em aberto/diferenca), tabela de pagamentos com score e status (auto/pendente/parcial).
- 46 novos testes unitarios (reconciliadorFatura + isMovimentacaoReal) — total: 330. Cobertura: 100% stmts, 92.3% branch.

## [3.22.1] - 2026-04-12

### Corrigido

- **Segurança (XSS) — importar.js (#133):** `membroNome` no badge de transferência interna detectada era inserido via `innerHTML` em atributo `title` sem `escHTML()`. Um nome de membro malicioso poderia injetar HTML/JS arbitrário. Corrigido com `escHTML(l._transferenciaInterna.membroNome)`.

---

## [3.22.0] - 2026-04-12

### Adicionado

- **RF-063: Transferencias Intra-Grupo (#126):** novo tipo `'transferencia_interna'` para movimentacoes PIX/TED entre membros do grupo (Luigi <-> Ana), excluido automaticamente de todos os agregados financeiros.
- Novo helper `isMovimentacaoReal()` em `helpers.js` — filtro centralizado substitui `d.tipo !== 'projecao'` em 14 locais.
- Novo modulo `detectorTransferenciaInterna.js` — detecta automaticamente PIX/TED entre membros no pipeline de importacao bancaria.
- Campos RF-063 nos modelos: `contrapartidaId`, `membroDestinoId`, `membroOrigemId`, `statusReconciliacao`, `mesFaturaRelacionado`.
- Badge visual "🔁 transferencia interna" no extrato de despesas e receitas.
- Acao manual "Marcar/Desmarcar como transferencia interna" nos botoes de despesas e receitas.
- Funcoes `buscarTransferenciasPendentes()` e `reconciliarTransferenciasPendentes()` em `database.js` para reconciliacao em lote.
- Badge no preview de importacao para transferencias detectadas.
- 32 novos testes unitarios (detectorTransferenciaInterna + isMovimentacaoReal) — total: 284.

## [3.21.1] - 2026-04-12

### Corrigido

- **Navbar responsiva (#130/#131):** com 10 links após RF-062, a navbar ficava cortada em telas menores. Ícones removidos (texto sempre visível), padding reduzido, media queries para ≤1280px (oculta nome do usuário) e ≤1024px (fonte menor, oculta nome da marca).

---

## [3.21.0] - 2026-04-12

### Adicionado

- **RF-062: Cartões de Crédito como Contas Individuais (#125):** cada cartão real da família agora é uma conta `tipo:'cartao'` distinta com campos `bandeira`, `emissor`, `ultimos4`, `diaFechamento`, `diaVencimento`, `contaPagadoraId`, `titularPadraoId`.
- Nova página **Contas e Cartões** (`contas.html`) com CRUD completo de cartões e listagem de contas bancárias.
- Link "Contas" adicionado à navbar de todas as páginas.
- Migração automática e idempotente `migrarCartaoGenerico()`: marca a conta genérica "Cartão de Crédito" como `_legado:true` em grupos existentes.
- Banner de migração em `contas.html` para grupos legados que ainda não criaram cartões reais.
- Import de fatura filtra dropdowns para mostrar apenas cartões reais (`tipo:'cartao'`, não-legado).
- Auto-detecção de cartão no import via campo `emissor` cruzado com `bankFingerprintMap` (Itaú, Nubank, Bradesco, BTG, Santander, Inter).
- Fatura: seletor de cartão mostra apenas contas `tipo:'cartao'`, com preferência por cartões reais e fallback para legado.
- Pipeline de projeções (`pipelineCartao.js`): propaga `contaId` e `mesFatura` para parcelas futuras.
- 21 novos testes: 16 para `modelConta` + `CONTAS_PADRAO` + `BANDEIRAS_CARTAO`, 5 para `gerarProjecoes`. Suite total: 252 testes.
- Export `BANDEIRAS_CARTAO` em `models/Conta.js`.

### Removido

- Conta genérica "Cartão de Crédito" removida de `CONTAS_PADRAO` (grupos novos não a criam mais).

### Alterado

- `modelConta()` aceita campos adicionais quando `tipo === 'cartao'`.
- `CONTAS_PADRAO` reduzido de 11 para 10 contas (sem cartão genérico).

---

## [3.20.0] - 2026-04-08

### Refatorado

- **Unificação da lógica de importação (#96):** criado módulo genérico `importacaoComum.js` com funções compartilhadas entre `importar.js` e `receitas.js` — leitura de CSV/XLSX, normalização de valores para receitas, resolução de contas/categorias por nome, parser de linhas de receitas e helpers de UI. Eliminadas ~200 linhas de código duplicado em `receitas.js` e ~70 linhas em `importar.js`.

### Adicionado

- Testes unitários para `importacaoComum.js` (34 testes) e `capacitor.js` (3 testes). Suite total: 231 testes.

**Milestone "Melhoria de Manutenibilidade e Arquitetura": CONCLUÍDO** (issue #96 fechada).

---

## [3.19.0] - 2026-04-07

### Adicionado — Fase 1: Capacitor + Safe Areas (Milestone iOS)

- **Capacitor instalado (#75):** `@capacitor/core`, `@capacitor/cli` e `@capacitor/ios` configurados. Projeto Xcode gerado em `ios/`. `capacitor.config.json` com `webDir: "dist"`. Novos scripts: `npm run cap:sync`, `npm run cap:open:ios`.
- **Safe areas para iPhone (#76):** `viewport-fit=cover` em todos os 13 HTMLs. CSS custom properties para `env(safe-area-inset-*)` em `variables.css`. Navbar e `.main-content` ajustados para respeitar notch/Dynamic Island. `@capacitor/status-bar` instalado com inicialização condicional (`capacitor.js`).
- **`.gitignore` atualizado** com entradas para artefatos iOS/Xcode.

**Fase 1 do Milestone iOS: CONCLUÍDA.** Issues #75 e #76 fechadas. Próximo: Fase 2 (Firebase nativo via plugins — issues #77–#80).

---

## [3.18.0] - 2026-04-07

### Adicionado — Fase 0: Vite + Firebase npm (Milestone iOS)

- **Vite como bundler MPA (#73):** configurado Vite 5 com 13 entry points HTML. Novos scripts: `npm run dev`, `npm run build`, `npm run preview`. Firebase Hosting agora serve de `dist/` em vez de `src/`. Deploy faz build automaticamente.
- **Firebase CDN → npm (#74):** todos os 7 imports via `gstatic.com` CDN substituídos por pacotes npm (`firebase/app`, `firebase/auth`, `firebase/firestore`). Script inline de `index.html` extraído para `js/pages/index.js`. Vite faz tree-shaking do Firebase SDK (~102 kB gzip).
- **Funções CRUD de planejamento:** implementadas 6 funções faltantes em `database.js` (`buscarDespesasMes`, `existePlanejamento`, `ouvirPlanejamento`, `salvarItemPlanejamento`, `salvarItensPlanejamentoBatch`, `excluirItemPlanejamento`) detectadas pelo Rollup durante build.

### Corrigido
- **CI do PR #108:** testes de integração excluídos do `vitest.config.js` padrão (requerem Firebase Emulator). Disponíveis via `npm run test:integration`.
- **7 bugs em importar.js (BUG-025 a BUG-031):** `_chavesExistentes` como Map, sanitização XSS em `chaveInfo`, pluralização em português, badge e seletor de conta.

**Fase 0 do Milestone iOS: CONCLUÍDA.** Issues #73 e #74 fechadas. Próximo: Fase 1 (Capacitor + iOS platform).

---

## [3.17.0] - 2026-04-06

### Alterado — Sprint 3: Polimento, Validacao e Fechamento do Milestone

- **MV-S3a — Tokens CSS (v3.16.1):** eliminadas todas as cores hardcoded restantes em `main.css` e `components.css` (~70 substituicoes). Adicionados 20 novos tokens em `variables.css` (overlays, fuzzy, import). Corrigidas 17+ referencias a variaveis legadas (`--primary`, `--text-muted`, `--border-color`, `--success`, `--surface-2`, `--danger`) para tokens canonicos. Focus ring unificado via `--color-primary-ring`. Classe `.modal-overlay` definida em `components.css`. Removidos ~30 fallbacks desnecessarios de `var()`.
- **MV-S3b — Documentacao:** criado `docs/DESIGN_SYSTEM.md` com paleta completa, tipografia, espacamento, sombras, breakpoints, componentes, estados e acessibilidade.
- **MV-S3b — Validacao:** navbar auditada em 9 paginas (consistencia de icones Lucide, labels e active state confirmada). Responsividade validada em 375px, 768px e 1280px. KPIs avaliados qualitativamente (todos atingidos).
- **MV-S3c — Milestone fechado:** Melhorias Visuais 26/26 (100%). Licoes aprendidas registradas.

**Milestone Melhorias Visuais: CONCLUIDO.** Projeto pronto para iOS App Fase 0.

---

## [3.16.0] - 2026-04-06

### Adicionado — Sprint 2: Estados, Responsividade e Microinterações
- **MV-S2b — Loading/Empty/Error States:** novo módulo `skeletons.js` com geradores de skeleton, empty-state e error-state. Skeleton shimmer exibido durante carregamento inicial em despesas, receitas, fatura, planejamento e dashboard. Empty-states com ícone e mensagem contextual. Error-states com botão "Tentar novamente" em caso de falha de conexão.
- **MV-S2b — CSS:** classes `.skeleton-item`, `.skeleton-circle`, `.skeleton-lines`, `.skeleton-amount` para cards skeleton; `.empty-state__icon`/`__title`/`__hint` para estados vazios enriquecidos; margin no botão retry do error-state.
- **MV-S2a — Fatura mobile:** filtros empilham verticalmente, tabs roláveis horizontalmente, tabela com font-size reduzido, estabelecimento truncado com ellipsis em <640px. Modal com `max-height: 100dvh - 32px` para evitar overflow em mobile.
- **MV-S2c — Hover/focus:** transição sutil de `border-color` e `box-shadow` em `.desp-item`, `.rec-item` e `.desp-chip` no hover. Focus-visible global para `a`, `select`, `input`, `textarea`, `[role="button"]` e `summary`. Todas as transições respeitam `prefers-reduced-motion`.
- **Segurança:** `escHTML()` aplicado em descrições renderizadas via `innerHTML` em despesas, receitas e fatura.
- **Fade-in:** animação de entrada aplicada nas listas de despesas, receitas, fatura, planejamento e grid de categorias do dashboard.

Milestone Melhorias Visuais: Sprint 2 concluído (23/26 tarefas — 88%).

---

## [3.15.0] - 2026-04-06

### Adicionado — Épico C: Fluidez e Responsividade
- **MV-C01 — Breakpoints padronizados:** tokens de referência (`--bp-mobile`, `--bp-tablet`) em `variables.css`; novo breakpoint tablet (1024px) em dashboard, main, planejamento e components.
- **MV-C02 — Layout 1 coluna em mobile:** KPIs colapsam para 1 coluna em <480px; filtros e headers de despesas/receitas empilhados em <640px; planejamento KPIs em coluna única.
- **MV-C03 — FAB (Floating Action Button):** botão flutuante fixo "+" em despesas e receitas, visível apenas em mobile (<640px), delegando ao CTA existente. Respeita `prefers-reduced-motion`.
- **MV-C04 — Filtros touch-friendly:** chips de resumo roláveis horizontalmente em mobile; área de toque mínima 44×44px para botões, selects e inputs (WCAG 2.5.5). Modal responsivo em telas pequenas.

Milestone Melhorias Visuais: Épico C concluído (20/26 tarefas — 77%).

---

## [3.14.0] - 2026-04-05

### Adicionado — Épico D: Feedback e Microinterações (PR #117)
- **Skeleton loader** com shimmer animado: `.skeleton`, `.skeleton-line` (variantes `--sm` / `--lg`), `.skeleton-card`.
- **Error state** (`.error-state`, `.error-state__title`, `.error-state__hint`) para exibir falhas de carregamento.
- **Fade-in** (`.fade-in`) para entrada suave de conteúdo, usando `--transition-slow`.
- Todas as animações respeitam `prefers-reduced-motion`.

Milestone Melhorias Visuais: Épico D concluído (semáforo de orçamento já existia em `Orcamento.js`).

---

## [3.13.1] - 2026-04-05

### Corrigido — Acessibilidade (PR #116)
- `--color-text-muted` ajustado de Slate 400 (#94a3b8) para Slate 500 (#64748b), passando de ~3.3:1 para ~5.6:1 de contraste sobre fundo claro (WCAG AA).

---

## [3.13.0] - 2026-04-05

### Adicionado — RF-025: Filtragem Server-Side em Gerenciar (PR #114)
- Queries Firestore server-side com filtros de período, tipo, categoria, portador e conta.
- Sincronização em tempo real via `onSnapshot` substituindo carregamento em memória.
- Novos helpers em `src/js/services/database.js`.

### Alterado — Épico B: Sistema Visual Unificado (PR #115)
- **Tokens:** novos tokens semânticos em `variables.css` (`--color-info`, `--color-conjunta`, `--color-income-dark`, `--color-balance-dark`, `--color-budget-dark`, entre outros) e tokens de `line-height`.
- **CSS:** substituição de 100+ cores hardcoded por tokens em `main.css`, `dashboard.css`, `components.css`, `planejamento.css`.
- **planejamento.css:** correção crítica — arquivo usava nomes de variáveis inexistentes (`--border`, `--text-muted`, `--success`) mascarados por fallbacks; todos renomeados para tokens corretos.
- **Tipografia e espaçamento:** font-sizes e valores `rem` hardcoded substituídos por tokens `--font-size-*` e `--space-*`.
- **Chart.js:** novo utilitário `src/js/utils/chartColors.js` lendo tokens via `getComputedStyle` — gráficos agora respeitam a paleta central.
- **Ícones:** emojis da navbar substituídos por [Lucide Icons](https://lucide.dev/) via CDN em todas as 9 páginas HTML (🏠→`layout-dashboard`, 📋→`clipboard-list`, 💸→`trending-down`, 📥→`wallet`, 💰→`piggy-bank`, 📈→`line-chart`, 🏷️→`tags`, 💳→`credit-card`, 📦→`database`).

---

## [3.12.0] - 2026-04-03

### Adicionado — RF-061: Categorias e Orçamentos — Separação Despesa vs Receita

Categorias agora possuem campo `tipo` (`despesa` | `receita`), permitindo gerenciamento e orçamentos separados por natureza.

#### `src/js/models/Categoria.js`
- Campo `tipo` (default `'despesa'`) no modelo `criarCategoria()` e em `CATEGORIAS_PADRAO`.

#### `src/js/services/database.js`
- `migrarCategoriasLegado(grupoId)` — migração idempotente para categorias sem campo `tipo`.

#### `src/js/controllers/categorias.js`
- `tipo` incluído no payload de `salvarCategoria()`.

#### `src/categorias.html`
- Seletor de tipo (Despesa / Receita) no modal de criação/edição.
- Lista separada em duas seções: "Categorias de Despesa" e "Categorias de Receita".

#### `src/js/pages/categorias.js`
- Renderização em 2 seções com `renderItemCategoria()`.
- Labels contextuais: Orçamento vs Meta, toggle conjunta oculto para receitas.
- Migração automática chamada no bootstrap.

#### `src/css/main.css`
- Estilos para `.cat-section-titulo`, `.orc-section-titulo`, `.cat-tipo-selector`, `.cat-tipo-btn`.
- Chips de resumo de receitas: `.orc-chip-meta`, `.orc-chip-recebido`, `.orc-chip-faltante`.

#### `src/orcamentos.html`
- Duas seções: "Orçamentos de Despesa" (chips Orçado/Gasto/Disponível) e "Metas de Receita" (chips Meta/Recebido/Faltante).

#### `src/js/pages/orcamentos.js`
- Filtragem de categorias por `tipo`, `renderOrcItem()` reutilizável.
- Listener de receitas (`ouvirReceitas`) para calcular "Recebido" nas metas.
- `atualizarChipsReceitas()` para totais de receita.

---

## [3.11.0] - 2026-04-02

### Adicionado — RF-060: Planejamento Mensal

Nova aba "📋 Planejamento" com visão unificada de despesas previstas para o mês, combinando despesas recorrentes, parcelas de cartão e orçamentos — com tracking de realizado vs. planejado em tempo real.

#### `src/planejamento.html` *(novo)*
- Página completa com KPIs (Previsto / Realizado / Diferença / Cobertura), checklist agrupada por categoria, análise de gaps e seção de despesas não planejadas.

#### `src/js/pages/planejamento.js` *(novo)*
- Entry point com autenticação, navegação de mês, listeners real-time (Firestore onSnapshot) para itens do plano, despesas e orçamentos.
- Auto-matching: ao registrar uma despesa em qualquer aba, o plano atualiza automaticamente via comparação de `categoriaId` + `descricao` fuzzy ou `parcelamento_id`.

#### `src/js/controllers/planejamento.js` *(novo)*
- `gerarPlanoPara(grupoId, mes, ano)` — gera plano combinando recorrentes + parcelas (`tipo='projecao'`) + orçamentos.
- `autoMatch(planItems, despesas)` — matching automático por parcelamentoId ou categoriaId+descrição.
- `analisarGaps(orcamentos, planItems, categorias)` — identifica categorias sem plano e planejado acima do orçamento.
- `despesasNaoPlanejadas(despesas, planItems)` — lista despesas realizadas fora do plano.

#### `src/js/utils/recurringDetector.js` *(novo)*
- `detectarRecorrentes(despN1, despN2)` — compara meses N-1 e N-2 para identificar despesas fixas.
- Três níveis de confiança: alta (variação ≤5%), média (≤15%), baixa (>15% ou descrição genérica).
- Exclusão automática de descrições genéricas: "PIX", "transferência", "pagamento", etc.

#### `src/css/planejamento.css` *(novo)*
- Estilos para KPIs, checklist, badges de tipo (Recorrente/Parcela/Orçamento/Manual), status icons, análise de gaps, formulário inline, layout responsivo.

#### `src/js/services/database.js`
- `buscarDespesasMes(grupoId, mes, ano)` — leitura única para detecção de recorrentes.
- `salvarItemPlanejamento(dados)` — upsert com ID composto (grupoId_ano_mes_hash).
- `salvarItensPlanejamentoBatch(items)` — batch write para geração inicial do plano.
- `ouvirPlanejamento(grupoId, mes, ano, cb)` — listener real-time.
- `excluirItemPlanejamento(itemId)` — exclusão de item manual.
- `existePlanejamento(grupoId, mes, ano)` — verifica se plano já existe.

#### `firestore.rules`
- Regras de segurança para `/planejamento_items/{itemId}` — acesso restrito a membros do grupo.

#### `firestore.indexes.json`
- Índice composto: `planejamento_items / grupoId ASC + mes ASC + ano ASC`.

#### Navegação (8 páginas)
- Link "📋 Planejamento" adicionado na navbar de todas as páginas, posicionado após Dashboard.

#### Nova coleção Firestore: `planejamento_items`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| grupoId | string | Grupo do usuário |
| ano | number | Ano do planejamento |
| mes | number | Mês (1-12) |
| categoriaId | string | Categoria da despesa |
| descricao | string | Descrição do item |
| valorPrevisto | number | Valor esperado |
| origem | string | 'recorrente' / 'parcela' / 'manual' / 'orcamento' |
| status | string | 'pendente' / 'realizado' / 'parcial' / 'cancelado' |
| despesaId | string? | Link para despesa realizada |
| valorRealizado | number? | Valor efetivo |
| parcelamentoId | string? | Link para parcelamento mestre |

---

## [3.10.0] - 2026-04-02

### Adicionado — RF-024: Importação de Extrato Bancário via Template XLSX

#### `src/js/utils/normalizadorTransacoes.js`
- **Descarte silencioso de linhas com valor zero:** adicionado `if (valorBruto === 0) continue` após cálculo do valor bruto — linhas de saldo/marcadores (ex: COD. LANC. 0) são ignoradas sem gerar erro no preview.

#### `src/js/utils/detectorOrigemArquivo.js`
- **Detecção de alta confiança para template de 3 colunas:** arquivo com exatamente 3 colunas (Data, Descrição, Valor) sem portador/parcela/categoria passa a retornar `tipo: 'banco'` com `confiança: 'alta'` (90%), eliminando o modal de confirmação de tipo nesses casos.

#### `src/js/pages/importar.js`
- **Reconhecimento da aba "Extrato":** seleção de aba no XLSX expandida de `/transa/i` para `/extrato|transa/i`, permitindo que o template oficial (aba "Extrato") seja lido diretamente sem fallback para a primeira aba.

#### `src/templates/template-importacao.xlsx` *(substituído)*
- Template recriado com aba nomeada **Extrato** e cabeçalho de 3 colunas: `Data | Descrição | Valor`.
- Inclui 3 linhas de exemplo: receita positiva (`476,00`), despesa negativa (`-250,00`) e marcador de saldo descartado (`0`).
- Valor com sinal determina classificação: positivo → receita, negativo → despesa.

#### Regras de classificação por sinal (RF-024)
| Condição | Classificação |
|----------|--------------|
| Valor > 0 | Receita (crédito) |
| Valor < 0 | Despesa (débito) |
| Valor = 0 ou vazio | Descartado silenciosamente |

---

## [3.9.4] - 2026-03-30

### Corrigido — BUG-027: botão "Importar" retornava cedo quando todos são duplicados — mesFatura nunca atualizado

#### `src/js/pages/importar.js`
- **Causa raiz:** `executarImportacao()` fazia `return` imediato quando `idxs.length === 0` (nenhum checkbox marcado), antes de executar o loop de atualização de `mesFatura` nos duplicados (linhas 940-951). Com 102 duplicados e 0 selecionados, o update nunca rodava.
- **Fix:** guarda agora verifica também `temDuplicatasCartao` antes de sair — se há duplicatas de cartão com `duplicado_docId`, o fluxo continua e atualiza `mesFatura` em todos eles.
- **UX:** tela de resultado exibe mensagem específica ("Fatura sincronizada! X transações vinculadas ao mês YYYY-MM") quando 0 novas importadas mas duplicatas foram atualizadas.

---

## [3.9.3] - 2026-03-30

### Corrigido — BUG-026: `mesFatura` nunca salvo no Firestore — transações de cartão invisíveis na fatura

#### `src/js/pages/pipelineCartao.js`
- **Causa raiz:** `aplicarMesFatura()` ajustava `l.data` para parceladas mas nunca atribuía `l.mesFatura` às linhas. O campo só era propagado por `processarFaturaCartao()`, que **não é chamado** pelo fluxo de importação (`importar.js` chama `parsearLinhasCSVXLSX` + `_aplicarTipo` diretamente).
- **Impacto:** guarda `...(l.mesFatura ? { mesFatura: l.mesFatura } : {})` em importar.js nunca disparava → zero transações salvas com `mesFatura` → `fatura.js` não encontrava nenhuma delas via `ouvirDespesasPorMesFatura`.
- **Fix:** adicionada linha `l.mesFatura = mesFatura` dentro do `forEach` de `aplicarMesFatura`, garantindo propagação para todos os callers (import page + `processarFaturaCartao`).

#### `tests/pages/pipelineCartao.test.js` *(novo)*
- 9 testes cobrindo `aplicarMesFatura` (BUG-026), `filtrarCreditos` e integração via `processarFaturaCartao`.

---

## [3.9.2] - 2026-03-30

### Corrigido — BUG-024 (follow-up): deduplicação de estornos em import de cartão

#### `src/js/pages/importar.js`
- **Problema residual:** mesmo após BUG-024 (v3.9.0), o fluxo `cartao` não carregava `buscarChavesDedupReceitas` durante `marcarDuplicatas()`.
- **Impacto:** estornos/créditos (`tipoLinha='receita'`) vindos de fatura de cartão podiam não ser marcados como duplicados, impedindo propagação de `mesFatura` em reimports de ciclos futuros.
- **Fix:** condição de carga das chaves de receita passou a incluir `_tipoExtrato === 'cartao'`.

---

## [3.9.1] - 2026-03-30

### Corrigido — BUG-025: Aba "Fatura do Cartão" não carrega após importação de dados de cartão

#### `src/js/pages/fatura.js` + `src/js/pages/importar.js`
- **Problema:** `garantirContasPadrao` era chamada exclusivamente em `app.js` (carregado apenas por `dashboard.html`). Usuários que acessavam `base-dados.html` para importar e depois navegavam para `fatura.html` sem visitar o dashboard nunca tinham as contas padrão criadas. A coleção `contas` ficava vazia → `ouvirContas` retornava `[]` → seletor de cartão só exibia "— selecione —" → nenhum auto-select → página presa no estado vazio indefinidamente.
- **Impacto secundário:** sem contas disponíveis durante o import, `contaId` ficava `undefined` em todas as transações importadas, tornando-as invisíveis na fatura mesmo após o problema principal ser corrigido.
- **Fix `fatura.js`:** importa `garantirContasPadrao` + `CONTAS_PADRAO`; chama `await garantirContasPadrao(_grupoId, CONTAS_PADRAO).catch(() => {})` antes de `ouvirContas` — garante que `💳 Cartão de Crédito` (`tipo:'cartao'`) exista para o auto-select funcionar.
- **Fix `importar.js`:** mesma chamada antes de montar o preview — garante que o seletor de conta esteja populado no momento do import, evitando `contaId: undefined` nas despesas importadas.

---

## [3.9.0] - 2026-03-27

### Corrigido — BUG-023: `projecao_paga` incluída no total da fatura — double-counting de parceladas reconciliadas

#### `src/js/pages/fatura.js`
- **Problema:** `_merge()` excluía `tipo === 'projecao'` mas não `tipo === 'projecao_paga'` — parceladas reconciliadas apareciam duas vezes (despesa real + projeção paga), dobrando o total.
- **Fix:** `if (d.tipo === 'projecao' || d.tipo === 'projecao_paga') return false;`

### Corrigido — BUG-024 (parcial): `buscarChavesDedupReceitas` retorna `Set` — mesFatura não propagado para estornos

#### `src/js/services/database.js` + `src/js/pages/importar.js`
- **Problema:** `buscarChavesDedupReceitas` retornava `Set` (sem `docId`), impedindo atualização de `mesFatura` em estornos duplicados. Post-loop chamava `atualizarDespesa` para todos os duplicados sem distinguir receitas.
- **Fix parcial:** `buscarChavesDedupReceitas` passa a retornar `Map<chave_dedup, docId>`; post-loop distingue `tipoLinha === 'receita'` e chama `atualizarReceita` ou `atualizarDespesa` conforme o tipo.
- **Fix completo em v3.9.2:** cobertura de `_tipoExtrato === 'cartao'` no carregamento de chaves de receita em `marcarDuplicatas`.

### Melhorado — Épico A: Hierarquia e composição do dashboard

#### `src/dashboard.html`
- **KPIs unificados no topo:** Total Orçado, Total Gasto, Total Receitas, Saldo e Disponível agora aparecem juntos em um único bloco visível sem scroll
- **Seção de Receitas eliminada como seção separada:** categorias de receitas passam a ser sub-bloco dentro da mesma seção, separado por `.section-subtitle`
- **Widget de parcelamentos realocado:** movido para após os grids de categorias
- **Ações centralizadas no header:** "+ Nova Receita" e "+ Nova Despesa" no cabeçalho junto aos seletores de período

#### `src/css/dashboard.css`
- **`.section-subtitle`:** novo estilo de sub-título para separar blocos sem criar seções HTML independentes
- **Cores semânticas por card KPI:** `.resumo-card--gasto` (rose), `.resumo-card--disponivel` (indigo suave)
- **`.resumo-cards`:** `minmax` reduzido de 175px → 160px para acomodar 5 KPIs em telas médias

---

## [3.8.0] - 2026-03-27

### Corrigido — BUG-021 + BUG-022: Ciclo de faturamento não modelado — 43 transações ausentes da fatura (R$ 7.926,93)

#### `src/js/pages/pipelineCartao.js` — BUG-021
- **Problema:** `processarFaturaCartao` nunca propagava `mesFatura` nas linhas; campo não chegava ao Firestore
- **Fix:** `linhas.forEach(l => { l.mesFatura = mesFatura; })` adicionado após `parsearLinhasCSVXLSX`

#### `src/js/utils/deduplicador.js` — BUG-021
- **Problema:** `chavesDesp` era um `Set` sem docId; impossível atualizar `mesFatura` em duplicatas já salvas
- **Fix:** `l.duplicado_docId = chavesRef instanceof Map ? chavesRef.get(chave) : null` — expõe docId para o chamador

#### `src/js/services/database.js` — BUG-021 + BUG-022
- **BUG-021:** `buscarChavesDedup` agora retorna `Map<chave_dedup, docId>` (era `Set`) — mantém compatibilidade via `.has()`
- **BUG-022:** Nova função `ouvirDespesasPorMesFatura(grupoId, mesFatura, cb)` — query Firestore por campo `mesFatura`

#### `src/js/pages/importar.js` — BUG-021
- **Fix:** `mesFatura` incluído no model de `criarDespesa` e `criarReceita` para imports de cartão
- **Fix:** Após o loop de importação, itera `_linhas` e chama `atualizarDespesa(docId, { mesFatura })` nas duplicatas de cartão — garante que parceladas de meses anteriores apareçam no ciclo correto
- **Fix:** `_chavesExistentes.add()` → `_chavesExistentes.set('', '')` — compatibilidade com Map

#### `src/js/pages/fatura.js` — BUG-022
- **Problema:** `ouvirDespesas` filtra por mês calendário (`data >= início && data <= fim`); transações com `data` fora do mês mas pertencentes ao ciclo nunca apareciam
- **Fix:** `recarregarDespesas()` usa **dois listeners em paralelo**: `ouvirDespesas` (mês calendário, backward compat) + `ouvirDespesasPorMesFatura` (campo `mesFatura`); `_merge()` faz union por `id`

#### `firestore.indexes.json` — BUG-022
- Novo índice composto: `despesas / grupoId ASC + mesFatura DESC`

---

## [3.7.0] - 2026-03-27

### Corrigido — BUG-019: Estornos da fatura desmarcados por padrão — créditos não contabilizados

#### `src/js/pages/importar.js` — BUG-019
- **Problema:** O BUG-013 (v3.6.0) desbloqueou estornos/créditos, mas mantinha o checkbox desmarcado por padrão (`&& !l.isEstorno`). Usuários que clicavam "Importar" diretamente nunca importavam créditos — saldo da fatura no app persistia maior que o oficial pela soma dos estornos não contabilizados
- **Fix:** Removido `!l.isEstorno` da condição de `chk.checked` → estornos agora selecionados por padrão, como qualquer outra transação. Badge `↩ Estorno` continua visível; tooltip atualizado para "desmarque para ignorar"
- **Impacto real:** Fatura março 2026 — R$ 18.319,66 em créditos ausentes (Credito Refinanciamento R$18.222 + reembolso MercadoLivre R$24,99 + reembolso iFood R$72,67)

---

## [3.6.0] - 2026-03-27

### Corrigido — BUG-013 a BUG-016 + TD-002 + TD-007: 4 bugs de parsing/importação + 2 débitos técnicos

#### `src/js/pages/pipelineCartao.js` — BUG-013
- **Problema:** `filtrarCreditos` marcava estornos/créditos de fatura como erro bloqueante — nunca eram importáveis
- **Fix:** em vez de erro, seta `isEstorno=true` + `tipoLinha='receita'`; linha fica visível no preview com badge "↩ Estorno" (amarelo) — usuário pode marcar a checkbox para importar como Receita

#### `src/js/pages/importar.js` — BUG-013 UI
- Reset `l.isEstorno = false` no loop de `_aplicarTipo` (limpa ao trocar tipo)
- Checkbox desmarcada por padrão para linhas com `isEstorno=true`
- Badge `↩ Estorno` inserido ANTES do check genérico `tipoLinha === 'receita'` na cadeia de status

#### `src/css/main.css` — BUG-013
- `.imp-badge--estorno` adicionado: fundo amarelo claro (`#fef9c3`), texto âmbar escuro

#### `src/js/utils/normalizadorTransacoes.js` — BUG-014
- **Problema:** `normalizarValorXP` removia todos os pontos → `208.17` virava `20817` (×100)
- **Fix:** detecta convenção de separador pela posição do último ponto vs última vírgula (convenção BR vs US/XP)

#### `src/js/utils/normalizadorTransacoes.js` — BUG-015
- **Problema:** `parsearParcela` retornava `null` para `atual === total` (ex: "12/12") — última parcela invisível
- **Fix:** condição alterada de `atual >= total` para `atual > total`

#### `src/js/utils/normalizadorTransacoes.js` — BUG-016
- **Problema:** `credito de refinanciamento` hardcoded no filtro de skip → despesas financeiras legítimas silenciosamente ignoradas
- **Fix:** removido do regex de filtro (apenas termos de controle de sistema permanecem)

#### `src/js/pages/importar.js` — TD-002
- Extraída `async _reprocessarLinhas()` que agrupa `await marcarDuplicatas() + renderizarPreview()`
- 5 ocorrências do par repetido substituídas por `await _reprocessarLinhas()`

#### `firestore.rules` — TD-007
- Adicionada função `isValidTransacao()`: `valor is number && valor > 0 && grupoId is string`
- Aplicada às regras `write` e `create` das coleções `despesas` e `receitas`

---

## [3.5.0] - 2026-03-27

### Corrigido — BUG-017 + BUG-018: NRF-002.2 Ajustes Parciais Marketplace completamente inoperante

Dois bugs críticos tornavam a funcionalidade de detecção de ajustes parciais (iFood, Mambo, etc.) inteiramente ineficaz: o detector nunca encontrava pares e, quando encontrado, o desconto era ignorado ao salvar.

#### `src/js/utils/ajusteDetector.js` — BUG-018
- **Problema:** Levenshtein full-string com threshold 0.72 nunca detectava pares reais de banco (ex: `"IFOOD *REST ABC"` vs `"IFOOD CREDITO"` → sim ≈ 0.30 → sempre pulava)
- **Fix:** Substituído por verificação de **keyword compartilhada** — extrai o padrão identificador (ex: `'IFOOD'`) do crédito e verifica se a despesa candidata contém o mesmo padrão. Levenshtein mantido apenas como critério de desempate entre múltiplas despesas candidatas, sem threshold gate
- Parâmetro `simMinima` removido da assinatura (não mais necessário como gate)

#### `src/js/pages/importar.js` — BUG-017
- **Problema:** Despesa com `valorLiquido` salva com `l.valor` (bruto) — desconto visível no preview mas nunca persistido no Firestore
- **Fix:** `valorBase = l.valorLiquido ?? l.valor` — despesa atual salva ao valor líquido pós-ajuste
- `valorAlocado` (conjunto) usa `valorBase` (correto para a despesa atual)
- Projeções de parcelas continuam usando `l.valor` com `valorAlocadoProj` separado (parcelas futuras não recebem o ajuste)

---

## [3.4.0] - 2026-03-27

### Adicionado — NRF-010: Portador "Conjunto" no Upload de Fatura de Cartão

Permite marcar transações importadas via fatura de cartão como despesas conjuntas diretamente no preview de importação, tanto por linha quanto em lote. A seleção "👥 Conjunto" aplica `isConjunta=true` e `valorAlocado=valor/2` automaticamente, com destaque visual verde nas linhas afetadas.

#### `src/js/pages/importar.js`
- `RESP_CONJUNTO = 'conjunto'` — constante controlada para portador/responsável conjunto (NRF-010)
- `preencherSelRespLote()` — opção "👥 Conjunto" adicionada ao final da lista de membros
- Bulk listener `sel-resp-lote` — ao selecionar "Conjunto", marca `isConjunta=true` em todas as linhas e chama `renderizarPreview()` para atualizar badges
- Per-line `sel-resp-linha` — opção "👥 Conjunto" adicionada; change listener propaga `isConjunta` para a linha
- Status badge `imp-badge--conjunto` — exibido na coluna Status quando `l.isConjunta && cartão`
- Save flow — `isConj = l.isConjunta ?? (catObj?.isConjuntaPadrao ?? false)` — seleção do usuário tem prioridade sobre padrão da categoria
- Parcelas projetadas herdam `isConjunta` e `valorAlocado` do registro pai (comportamento existente mantido)

#### `src/css/main.css`
- `.imp-row-conjunto` — background verde claro (`#f0fdf4`) para linhas marcadas como conjunto
- `.imp-badge--conjunto` — badge verde "👥 Conjunto" na coluna Status

---

## [3.3.0] - 2026-03-27

### Adicionado — RF-023: Edição em Massa de Transações — Responsável Dinâmico

Permite alterar o responsável de múltiplas transações em lote a partir da aba Gerenciar da Base de Dados. Membros do grupo carregados dinamicamente de `nomesMembros`; atualização em batch Firestore (≤ 500); feedback via toast; cache local atualizado sem reload.

#### `src/js/services/database.js`
- `atualizarResponsavelEmMassa(items, responsavel)` — batch update de `responsavel` + `portador` em chunks de 500

#### `src/base-dados.html`
- Filtro `ger-fil-resp` ("Todos os responsáveis") na barra de filtros da aba Gerenciar
- `ger-sel-resp` + `ger-btn-resp` ("👤 Aplicar") na barra de ações em lote

#### `src/js/pages/base-dados.js`
- `_nomesMembros` — estado carregado de `grupos/{grupoId}.nomesMembros`
- `preencherSelResp()` — popula dropdown de ação em lote com membros do grupo
- `preencherFiltrosResponsaveis()` — popula filtro com nomes únicos do cache
- `aplicarFiltros()` — filtro por responsável adicionado
- `atualizarContagem()` — habilita/desabilita `ger-btn-resp` conforme seleção + responsável
- `confirmarAtualizacaoResp()` — executa batch, atualiza cache local, exibe toast
- `mostrarToast(msg, isErro)` — toast fixo no canto inferior direito (3,5 s)

---

## [3.2.0] - 2026-03-27

### Adicionado — NRF-009: Responsável por Transação no Import

Extrato bancário auto-atribui responsável = usuário do upload (não editável no preview). Fatura de cartão passa a ter seletor editável por linha e em lote, populado com os membros do grupo.

#### `src/base-dados.html`
- `resp-lote-wrap` — wrapper com label + `sel-resp-lote` na barra de ações em lote (visível apenas em modo cartão)

#### `src/js/pages/importar.js`
- `buscarGrupo` importado de `database.js`
- `_nomesMembros` — novo estado: mapa `{ uid: nome }` dos membros do grupo
- `preencherSelRespLote()` — preenche seletor em lote com nomes dos membros (fallback para `displayName` em grupo solo)
- `_aplicarTipo('banco')` — auto-preenche `l.portador = displayName` para linhas sem portador explícito
- `_atualizarUITipo()` — mostra/oculta `resp-lote-wrap` conforme tipo (cartão apenas)
- `renderizarPreview()` — coluna Portador: `<select class="sel-resp-linha">` em modo cartão; texto estático nos demais
- `sel-resp-lote` listener — aplica nome selecionado a todos os `.sel-resp-linha` em lote
- `criarReceita` — passa `responsavel: l.portador` (receitas do extrato bancário)

---

## [3.1.0] - 2026-03-27

### Adicionado — NRF-002.2: Detecção de Ajustes Parciais (Marketplace-Aware)

Créditos de ajuste/desconto de marketplaces (iFood, Amazon, Shopee) e supermercados (Mambo, Carrefour, Pão de Açúcar) passam a ser reconhecidos como ajustes parciais, evitando falsos positivos de deduplicação e calculando o valor líquido correto.

#### `src/js/utils/ajusteDetector.js` (novo)
- `PADROES_ESTABELECIMENTO` — marketplaces, supermercados e delivery elegíveis
- `classificarEstabelecimento(descricao)` — identifica tipo do estabelecimento por keywords
- `detectarAjustesParciais(linhas, opts)` — detecta pares (despesa + crédito) por Levenshtein ≥ 72%, valor < despesa e janela de 7 dias; muta linhas in-place

#### `src/js/utils/deduplicador.js`
- Fase 3 (banco): chama `detectarAjustesParciais` antes de retornar

#### `src/js/pages/importar.js`
- Preview: `.imp-row-ajuste`, checkbox desmarcado, badge `↩ Ajuste`, valor tachado + líquido

#### `src/css/main.css`
- `.imp-row-ajuste` + `.imp-badge--ajuste` (tema laranja âmbar)

---

## [3.0.2] - 2026-03-27

### Corrigido — BUG-009 a BUG-012

#### `src/js/pages/importar.js`
- **BUG-009 (Crítico):** `parcelamento_id` incorreto em despesas reconciliadas — `parc_id` agora prioriza `l.parcelamento_id_proj` antes de gerar UUID novo; `?? l.parcelamento_id_proj` removido da linha de escrita do modelo
- **BUG-010 (UX):** Chip de erros nunca ocultado ao trocar de arquivo — substituído por `classList.toggle('hidden', erros === 0)` (padrão consistente com demais chips)

#### `src/js/pages/pipelineBanco.js` + `src/js/utils/normalizadorTransacoes.js` + `src/js/pages/pipelineCartao.js`
- **BUG-011 (Manutenção):** Campo `isCredito` renomeado para `isNegativo` — nome semanticamente neutro, correto em ambos os contextos (fatura e extrato bancário)

#### `src/js/utils/normalizadorTransacoes.js`
- **BUG-012 (Médio):** CSV com separador errado (vírgula) agora lança erro informativo em vez de falhar silenciosamente com erros genéricos

---

## [3.0.0] - 2026-03-26

### Adicionado — RF-013: Pipeline Unificado de Ingestão e Processamento

Refatoração arquitetural: `importar.js` passa a ser um orquestrador fino; lógica de parsing, classificação, projeções e deduplicação distribuída em módulos independentes e testáveis.

#### `src/js/utils/normalizadorTransacoes.js` (novo)
- `parsearCSVTexto(content)` — parser CSV com separador ";" e BOM stripping
- `parsearLinhasCSVXLSX(rows, {contas, categorias, mapaHist, origemBanco})` — versão parameterizada de `parsearLinhasExtrato` (sem closures de estado)
- `normalizarValorXP(val)` — normalização "R$ 1.290,00" → `1290.00`
- `normalizarData(val)` — parse de data multi-formato (DD/MM/YYYY, ISO, Date)
- `normalizarParcela(str)` — normalização "X de Y" → "XX/YY"
- `parsearParcela(str)` — parse de parcela para `{atual, total}`
- `gerarChaveDedup(data, estab, valor, portador, parcela)` — chave de deduplicação
- `inferirContaDaDescricao(descricao, contas)` — inferência de conta por keywords

#### `src/js/utils/deduplicador.js` (novo)
- `marcarLinhasDuplicatas(linhas, {chavesDesp, chavesRec, projecaoDocMap, projecoesDetalhadas, tipoExtrato})` — função pura de marcação (sem Firestore)
- Encapsula matching exato (Fase 1) e fuzzy Levenshtein ≥ 85% (Fase 2 — NRF-002)

#### `src/js/pages/pipelineBanco.js` (novo)
- `processarExtratoBancario({rows, contas, categorias, mapaHist, origemBanco})` → linhas
- `parsearLinhasPDF(raw, opts)` — converte saída do pdfParser para linhas (RF-020)
- `classificarBanco(linhas, sinaisInvertidos)` — classifica como despesa/receita pelo sinal

#### `src/js/pages/pipelineCartao.js` (novo)
- `processarFaturaCartao({rows, contas, categorias, mapaHist, origemBanco, mesFatura})` → linhas
- `filtrarCreditos(linhas)` — marca créditos/estornos como erro (NRF-002.1)
- `aplicarMesFatura(linhas, mesFatura)` — ajusta datas de parceladas (NRF-002.1)
- `gerarProjecoes(linha, parcelamentoId)` — gera projeções de parcelas futuras (RF-014)

#### `src/js/pages/importar.js` (refatorado)
- Importa e delega para os quatro módulos pipeline
- `_aplicarTipo('cartao')` → chama `filtrarCreditos` + `aplicarMesFatura` (pipelineCartao.js)
- `_aplicarTipo('banco')` → chama `classificarBanco` (pipelineBanco.js)
- `marcarDuplicatas()` → mantém fetch Firestore; delega marcação a `marcarLinhasDuplicatas`
- Funções removidas (migradas para módulos): `parsearLinhasExtrato`, `gerarChaveDedup`, `normalizarParcela`, `parsearParcela`, `gerarProjecoes`, `inferirContaDaDescricao`, `normalizarValorXP`, `normalizarData`, `_normalizarDataPDF`, `parsearLinhasPDF`, `aplicarMesFatura`, `parsearCSVTexto`

---

## [2.6.1] - 2026-03-26

### Adicionado — RF-022: Auto Categorização Inteligente Sensível à Origem

Categorização automática passa a considerar o banco/emissor como contexto, usando histórico segmentado por banco antes do histórico global.

#### `src/js/utils/categorizer.js` (novo)
- `categorizarTransacao(estab, origem, categorias, mapaHist)` — função pura, sem estado
- **Camada 1:** lookup `descricao|origemBanco` no mapa de histórico (origin-specific)
- **Camada 2:** lookup `descricao` no mapa global (compatibilidade retrógrada)
- **Camada 3:** regras por palavras-chave (fallback estático — mesmo conjunto anterior)

#### `src/js/services/database.js`
- `buscarMapaCategorias`: agora também indexa `descricao|origemBanco` quando `origemBanco` está presente e ≠ `'desconhecido'`

#### `src/js/pages/importar.js`
- `mapearCategoria(estab, origem)` → thin wrapper sobre `categorizarTransacao`; `origem` padrão = `_origemBanco`
- `_recategorizarComOrigem()` — re-processa categorias depois que a origem é identificada
- Regras REGRAS removidas do `importar.js` (agora em `categorizer.js`)
- Modelos recebem `origemBanco: _origemBanco` em importações

#### `src/js/models/Despesa.js` + `Receita.js`
- Campo `origemBanco` adicionado à lista de opcionais

---

## [2.6.0] - 2026-03-26

### Adicionado — RF-021: Motor de Detecção, Roteamento e Identificação de Banco

Identifica automaticamente o tipo do arquivo (banco/cartão) e o banco/emissor, pre-selecionando a conta correspondente.

#### `src/js/utils/bankFingerprintMap.js` (novo)
- 15 bancos/emissores brasileiros com fingerprints de identificação
- Por banco: `filePatterns` (regex sobre nome do arquivo), `keywords.high` (+40 pts), `keywords.medium` (+20 pts)
- Bancos: Itaú, Nubank, Bradesco, Santander, Banco Inter, Banco do Brasil, Caixa, XP, BTG, C6, Original, Neon, PicPay, Mercado Pago, Sicoob

#### `src/js/utils/detectorOrigemArquivo.js` (novo)
- `detectarOrigemArquivo({fileName, rows, textLines})` — substitui `detectarTipoExtrato()`
- **Tipo:** analisa colunas CSV/XLSX (mesma lógica anterior) + conteúdo textual (PDF)
- **Banco:** scoring por filename + keywords, max 100 pts
- **Saída:** `{tipo, confiancaTipo, confianca, colunas, origem, origemLabel, origemEmoji, confiancaOrigem, pipeline}`

#### `src/js/pages/importar.js`
- `detectarTipoExtrato()` removida — lógica movida para `detectorOrigemArquivo.js`
- CSV/XLSX/PDF: chamam `detectarOrigemArquivo()` após parse → setam `_origemBanco/Label/Emoji`
- `_atualizarBancoBadge()` — exibe badge `#banco-detectado-badge`
- `_autoSelecionarConta(origemId)` — auto-seleciona `sel-conta-global` via `inferirContaDaDescricao`
- `resetarUpload()` — limpa origem ao trocar arquivo

#### `src/base-dados.html`
- `<div id="banco-detectado-badge">` na seção `tipo-extrato-wrap`

#### `src/css/main.css`
- `.imp-banco-detectado-badge` — badge índigo/azul

---

## [2.4.0] - 2026-03-26

### Adicionado — RF-020: Classificação Automática por Sinal + Importação PDF

Suporte a extratos bancários em PDF e classificação automática de transações pelo sinal do valor.

#### `src/js/utils/pdfParser.js` (novo)
- Exporta `extrairTransacoesPDF(file)` via PDF.js (`window.pdfjsLib`, CDN UMD)
- Extrai texto de todas as páginas; agrupa itens por posição Y (tolerância 2,5pt); ordena por X
- Regex de detecção: `RE_DATA` (DD/MM/YY e variantes), `RE_VALOR_FINAL` (com flag D/C opcional), `RE_IGNORAR` (cabeçalhos/rodapés)
- Retorna `[{dataStr, desc, valor, confianca}]` — valor já com sinal (negativo=débito)
- Confiança: `'alta'` (≥80), `'media'` (≥50), `'baixa'` (<50) baseada em qualidade da descrição e valor

#### `src/js/pages/importar.js`
- **Import**: `import { extrairTransacoesPDF } from '../utils/pdfParser.js'`
- **Estado**: `let _origemPDF = false; let _sinaisInvertidos = false;`
- **`processarArquivo()`**: novo branch para `.pdf` — chama `extrairTransacoesPDF()` → `parsearLinhasPDF()` → pipeline `_aplicarTipo('banco')`
- **`parsearLinhasPDF(raw)`**: converte `[{dataStr, desc, valor, confianca}]` para `_linhas` (mesmo formato CSV/XLSX); popula `_confiancaPDF` em cada linha
- **`_normalizarDataPDF(str)`**: normaliza DD/MM/YY, DD/MM, DD-MM-YYYY etc. para Date
- **`_aplicarTipo('banco')`**: respeita `_sinaisInvertidos` — se true, inverte lógica receita/despesa
- **`_atualizarUIInverterSinais(visivel)`**: mostra/oculta `#inverter-sinais-wrap`; reseta checkbox
- **`renderizarPreview()`**: badge `imp-badge--conf-alta/media/baixa` na coluna Status para PDFs
- **`renderizarPreview()`**: mostra `#pdf-conf-legenda` quando `_origemPDF === true`
- **`resetarUpload()`**: reseta `_origemPDF = false; _sinaisInvertidos = false`
- **`configurarEventos()`**: handler `#chk-inverter-sinais` re-aplica tipo e re-renderiza preview

#### `src/base-dados.html`
- **PDF.js CDN**: `<script src=".../pdf.min.js">` carregado antes dos módulos
- **`file-input`**: `accept` expandido para `.xlsx,.xls,.csv,.pdf`
- **`#inverter-sinais-wrap`** (oculto por padrão): checkbox "Inverter sinais (positivo = despesa)" — aparece somente em PDFs no modo banco
- **`#pdf-conf-legenda`** (oculto por padrão): legenda de confiança alta/média/baixa no Passo 3

#### `src/css/main.css`
- `.imp-badge--conf-alta/media/baixa`: verde/amarelo/vermelho para confiança da extração
- `.imp-pdf-conf-legenda`: container da legenda (fundo azul-claro, borda índigo)
- `.imp-inverter-sinais-wrap`: container do toggle (fundo âmbar claro, borda laranja)

#### Comportamento
| Ação | Resultado |
|------|-----------|
| Sobe PDF bancário | Detectado como "Extrato Bancário"; transações extraídas |
| Valor negativo no PDF | `isCredito=true` → `tipoLinha='despesa'` (padrão) |
| Valor positivo no PDF | `isCredito=false` → `tipoLinha='receita'` (padrão) |
| Toggle "Inverter sinais" ativo | Positivo → despesa, negativo → receita |
| Confiança alta | Badge verde `✓ Alta` |
| Confiança média | Badge amarelo `~ Média` |
| Confiança baixa | Badge vermelho `⚠ Baixa` — revisão recomendada |

---

## [2.3.0] - 2026-03-26

### Corrigido — RF-019: Preenchimento Automático de Conta/Banco no Preview

Bug onde o seletor global "De qual banco é este extrato?" não era aplicado às linhas do preview ao carregar o arquivo.

#### Causa Raiz
`renderizarPreview()` usava o operador `??` para decidir entre `l.contaId` e `contaGlobal`. Como `inferirContaDaDescricao()` retorna `''` (string vazia) quando não encontra nenhuma conta, `'' ?? contaGlobal` retornava `''` — nunca aplicando o seletor global.

#### Correção (`src/js/pages/importar.js`)
- **Linha 795**: `l.contaId ?? contaGlobal` → `contaGlobal || l.contaId || ''` — o seletor global agora tem prioridade sobre a coluna do arquivo e sobre a inferência automática
- **Nova função `_atualizarBadgeConta()`**: exibe badge `✅ Conta aplicada automaticamente: [Nome]` no topo do preview quando o seletor global está preenchido
- **Handler `sel-conta-global`**: agora também chama `_atualizarBadgeConta()` ao trocar a conta — badge atualiza em tempo real
- **`renderizarPreview()`**: chama `_atualizarBadgeConta()` sempre que o preview é renderizado

#### HTML + CSS
- **`src/base-dados.html`**: `<div id="conta-auto-badge">` adicionado na seção de preview (Passo 3)
- **`src/css/main.css`**: `.imp-conta-auto-badge` — badge verde com borda, font 0.82rem

#### Comportamento após correção
| Cenário | Resultado |
|---------|-----------|
| Seletor global preenchido → arquivo carregado | Todas as linhas já chegam com a conta; badge aparece |
| Seletor global vazio → arquivo com coluna "Conta" | Conta inferida do arquivo (comportamento anterior preservado) |
| Altera seletor global após preview carregado | Todas as linhas atualizam em tempo real; badge atualiza |
| Override manual por linha | Funciona normalmente; não é sobrescrito pelo global |

---

## [2.2.0] - 2026-03-26

### Adicionado — RF-018: Centralização da Base de Dados

Importar, deduplicação e gerenciamento unificados em uma única tela `base-dados.html` com 4 abas. O antigo `importar.html` foi convertido em redirect.

#### `src/base-dados.html` (novo)
- **4 abas** via `.base-tab-nav`: 📥 Importar · 🔍 Duplicatas · 🗂️ Gerenciar · ⚠️ Limpeza
- **Aba Importar**: conteúdo idêntico ao antigo `importar.html` (DOM IDs preservados, compatível com `importar.js`)
- **Aba Duplicatas**: seção de manutenção/purga de duplicatas (compatível com `importar.js`)
- **Aba Gerenciar**: tabela paginada (50/pág) com filtros por tipo · mês · ano · categoria; seleção em massa + exclusão em lote (até 500/batch); modal de confirmação
- **Aba Limpeza** (admin only): "Purgar Base de Dados" com dupla confirmação — digitação "PURGAR" + checkbox; visível somente para o criador do grupo (`isMestre`)
- Carrega dois módulos ES independentes: `importar.js` + `base-dados.js`

#### `src/js/pages/base-dados.js` (novo)
- **Tab switching**: clique em `.base-tab-btn` troca aba ativa e revela `#tab-{nome}`
- **Auth + isMestre**: `onAuthChange` → busca `buscarGrupo` → compara `grupo.criadoPor === user.uid`; se mestre, remove `.hidden` de `#btn-tab-limpeza`
- **Gerenciar**: `carregarTransacoes()` chama `buscarTodasTransacoes`; filtros aplicados client-side; paginação com `_paginaAtual`; checkboxes individuais + "selecionar todos visíveis"; `excluirEmMassa()` em batch de 500
- **Limpeza**: validação em tempo real (texto="PURGAR" AND checkbox); `purgeGrupoCompleto()` com feedback de resultado (contagem por coleção)

#### `src/js/services/database.js`
- **`buscarTodasTransacoes(grupoId)`**: busca paralela despesas + receitas, merge e sort por data desc; injeta campo `_tipo` para diferenciação
- **`excluirEmMassa(items)`**: batch delete de `{ id, colecao }[]` em chunks de 500 via `Promise.all`
- **`purgeGrupoCompleto(grupoId)`**: apaga despesas, receitas e parcelamentos em batches; retorna `{ despesas, receitas, parcelamentos }` com contagem

#### `src/importar.html`
- Convertido em redirect: `<meta http-equiv="refresh">` + `window.location.replace('base-dados.html')` — backward compatibility para bookmarks/links externos

#### Navbar (8 páginas)
- `dashboard.html`, `despesas.html`, `receitas.html`, `orcamentos.html`, `fluxo-caixa.html`, `categorias.html`, `fatura.html`: link "📤 Importar" → "📦 Base de Dados" apontando para `base-dados.html`

#### `src/css/main.css`
- `.base-tab-nav` / `.base-tab-btn` / `.base-tab-btn--ativo` / `.base-tab-btn--admin`
- `.ger-filtros` / `.ger-fil-select` / `.ger-acoes-lote` / `.ger-contagem` / `.ger-btn-excluir`
- `.ger-tipo-badge` / `.ger-tipo-despesa` / `.ger-tipo-receita` / `.ger-tipo-projecao`
- `.ger-paginacao`
- `.purge-box` / `.purge-box-header` / `.purge-box-titulo` / `.purge-box-desc`
- `.purge-btn` / `.purge-confirm-label`
- Responsivo mobile: filtros em coluna, purge-box em coluna

---

## [2.1.0] - 2026-03-26

### Adicionado — RF-017: Dashboard como Tela Inicial com Gráficos

Transformação do Dashboard em visão estratégica de alto nível: lista de despesas removida, dois novos gráficos interativos adicionados com Chart.js e fluxo de autenticação corrigido.

#### `dashboard.html`
- **Lista detalhada de despesas removida**: seção `#section-despesas` eliminada — lista completa continua disponível apenas em `despesas.html`
- **Seção `#section-graficos`**: dois `<canvas>` lado a lado — `dash-chart-categorias` e `dash-chart-evolucao`
- **Filtros de período**: botões **Mês atual / Últimos 3 meses / Ano atual** atualizam o gráfico de categorias em tempo real
- **Chart.js v4.4.6** carregado via CDN (mesmo usado no Fluxo de Caixa)
- **"Ver projeções →"** link direto para `fatura.html` no widget de Parcelamentos em Aberto

#### `app.js`
- **`carregarDadosMeses()`**: busca os últimos 6 meses via `buscarDespesasPeriodo` / `buscarReceitasPeriodo`; executado no init e ao trocar período; invalida cache ao mudar mês/ano
- **`carregarDadosAno()`**: lazy, com cache por ano; disparado ao clicar "Ano atual"
- **`renderizarGraficoCategorias()`**: barras verdes (Receitas) e vermelhas (Despesas) lado a lado por categoria; tooltip com valor exato + % do total; responde a filtro de período
- **`renderizarGraficoEvolucao()`**: mixed chart — barras mensais de Receitas/Despesas + linha de Saldo Acumulado; meses futuros em tom claro; dados do mês atual sincronizados com `onSnapshot`
- Removidos: `renderizarListaDespesas`, `preencherSelectCategorias`, `window.editarDespesa`
- Handlers de `select-mes` / `select-ano` invalidam caches de gráficos ao trocar período

#### `database.js`
- **`buscarDespesasPeriodo(grupoId, inicio, fim)`**: query por intervalo de datas para despesas (suporta cross-year)
- **`buscarReceitasPeriodo(grupoId, inicio, fim)`**: query por intervalo de datas para receitas

#### `index.html`
- **Bug corrigido**: substituída lógica de `signOut` automático por redirect auth-aware
  - Autenticado + grupo → `dashboard.html`
  - Autenticado sem grupo → `grupo.html`
  - Não autenticado → `login.html`

#### `dashboard.css`
- `.dash-graficos-row`: grid 2 colunas → 1 coluna em mobile (≤640px)
- `.dash-grafico-container`: card flexível com altura mínima definida
- `.dash-chart-wrap`: wrapper com `height: 280px` para Chart.js
- `.dash-filtro-btn` / `.dash-filtro-btn--ativo`: estilo dos botões de período

#### Comportamento dos gráficos
| Gráfico | Dados | Filtros | Atualização |
|---------|-------|---------|-------------|
| Receitas × Despesas por Categoria | Agrega receitas e despesas por `categoriaId` | Mês atual / Últimos 3 meses / Ano atual | Tempo real (mês atual) ou on-demand |
| Evolução Mensal | Últimos 6 meses: barras + linha acumulado | Fixo (6 meses a partir do período selecionado) | Tempo real para mês atual |

---

## [2.0.0] - 2026-03-26

### Adicionado — NRF-006: Detecção Automática de Tipo de Extrato no Upload

Unificação da página de importação para suportar quatro tipos de arquivo — Fatura de Cartão, Extrato Bancário, Receitas e Despesas — com detecção automática pelo cabeçalho e roteamento correto para as coleções Firestore.

#### `importar.html`
- **Banner unificado `#tipo-extrato-wrap`**: substitui o antigo `#fatura-mes-wrap`; exibe badge com o tipo detectado e dropdown "Alterar tipo" para sobrescrita manual
- **Select `#sel-tipo-extrato`**: opções `💸 Despesas · 💳 Fatura de Cartão · 🏦 Extrato Bancário · 📥 Receitas`
- **Sub-painel `#fatura-mes-sub`**: seletor de mês de vencimento (NRF-002.1), visível apenas no tipo Cartão
- **`#banco-hint`**: dica "valor positivo → Receita · valor negativo → Despesa", visível apenas no tipo Banco
- **Chips `#chip-receitas-wrap` / `#chip-despesas-wrap`**: contagem separada de receitas e despesas no preview do modo banco
- **Botão "⬇️ Template Extrato Bancário"**: baixa template com colunas `Data | Descrição | Valor`

#### `importar.js`
- **`detectarTipoExtrato(rows)`**: analisa colunas do cabeçalho (case-insensitive, NFD) — `Portador+Parcela → cartao`, `Categoria (sem Portador) → receita`, `sem Portador e sem Parcela → banco`, demais `→ despesa`
- **`_aplicarTipo(tipo)`**: centraliza toda a lógica de tipo — reseta erros para `_erroOriginal`, aplica marcação de créditos (cartão), `tipoLinha` (banco/receita)
- **`_atualizarUITipo()`**: atualiza badge, dropdown, visibilidade do mês de fatura e hint do banco
- **`_erroOriginal`**: novo campo imutável nos objetos de linha — permite re-aplicar tipo sem re-parsear o arquivo
- **`tipoLinha: null | 'receita' | 'despesa'`**: campo novo em cada linha; alimenta roteamento no import e badges no preview
- **`marcarDuplicatas`**: carrega `_chavesExistentesRec` (coleção `receitas`) quando `tipo = banco | receita`; checa duplicatas na coleção correta por `tipoLinha`; fuzzy matching ignorado para banco/receita
- **`executarImportacao`**: linhas com `tipoLinha = 'receita'` são salvas via `criarReceita(modelReceita(...))` (coleção `receitas`); despesas do banco seguem fluxo normal sem projeções/parcelamentos
- **`atualizarChipsPreview`**: chips de Receitas e Despesas mostrados apenas no modo banco
- **`gerarTemplateBanco()`**: gera `.xlsx` com aba `Extrato` (Data | Descrição | Valor com exemplos positivos/negativos) e aba `Instruções`
- **`resetarUpload`**: reseta `_tipoExtrato = 'despesa'` e `_chavesExistentesRec`

#### `models/Receita.js`
- `modelReceita` agora aceita campos opcionais `origem`, `chave_dedup`, `importadoEm` — necessários para importações via extrato bancário

#### Comportamento por tipo detectado
| Tipo | Critério | Valores negativos | Dedup | Parcelas/Projeções |
|------|----------|-------------------|-------|--------------------|
| Fatura de Cartão | Portador+Parcela no header | Excluídos (crédito) | despesas | Sim |
| Extrato Bancário | Sem Portador, sem Parcela | → Despesa (abs) | despesas + receitas | Não |
| Receitas | Categoria no header | Math.abs | receitas | Não |
| Despesas | Fallback | Math.abs | despesas | Sim |

---

## [1.9.0] - 2026-03-26

### Adicionado — NRF-002.1: Importação de Fatura de Cartão (CSV nativo)

Suporte completo ao formato de extrato CSV exportado diretamente pelo cartão de crédito (colunas `Data;Estabelecimento;Portador;Valor;Parcela`), resolvendo incompatibilidades que impediam o fuzzy matching e a reconciliação de parcelas.

#### `importar.html`

- **Banner "📅 Fatura de cartão detectada"**: exibido automaticamente quando o arquivo tem colunas `Portador` e `Parcela`. Inclui seletor de mês de vencimento (`<input type="month">`) para o usuário informar o ciclo de cobrança

#### `importar.js`

- **`normalizarParcela(str)`** — converte `"X de Y"` (formato CSV do banco) para `"XX/YY"` (formato canônico das projeções geradas pelo app). Sem essa normalização, a chave de dedup das parcelas importadas nunca combinava com as chaves das projeções, tornando fuzzy matching e exact matching ineficazes
- **`parsearParcela(str)`** — corrigido para aceitar ambos os formatos (`"X/Y"` e `"X de Y"`), garantindo que a contagem de parcelas futuras e o fuzzy matching funcionem com arquivos CSV nativos do banco
- **`detectarFatura(rows)`** — detecta automaticamente se o arquivo é uma fatura de cartão verificando a presença das colunas `portador` e `parcela` no cabeçalho
- **`aplicarMesFatura(mesFatura)`** — para cada linha parcelada: substitui `data` pelo 1º dia do mês de vencimento selecionado, preservando `dataOriginal` (data da compra original). Linhas à vista mantêm a data do CSV
- **`_aplicarDeteccaoFatura(rows)`** — orquestrador pós-parse: detecta fatura, exibe banner, define mês padrão (mês atual), marca créditos/estornos como não importáveis, aplica ajuste de datas
- **Créditos/estornos excluídos automaticamente**: em modo fatura, linhas com `valor < 0` recebem `erro: "Crédito/estorno — não importado"` e ficam desmarcadas no preview
- **Indicador visual `📅`** na coluna Data do preview: mostra a data do mês da fatura com tooltip exibindo a data original da compra
- Mês de vencimento sincronizado com `renderizarPreview` — trocar o seletor de mês re-renderiza o preview imediatamente

#### `models/Despesa.js`

- Campo `dataOriginal` adicionado à lista de opcionais do `modelDespesa` — salvo no Firestore quando a despesa é parcelada com data ajustada para o mês da fatura

### Bug corrigido

- Extrato CSV com parcelas no formato `"6 de 12"` nunca gerava projeções nem era reconciliado com parcelas existentes (o parser `parsearParcela` só aceitava `"06/12"` com barra). Corrigido por `normalizarParcela` que unifica os dois formatos antes do processamento
- Créditos de refinanciamento (`Credito de Refinanciamento...`) não eram filtrados pelo regex de linhas ignoradas. Adicionado ao filtro

---

## [1.8.0] - 2026-03-26

### Adicionado — NRF-008: Deduplicação de Transações

Ferramenta completa para eliminar duplicatas da base e impedir que novos uploads gerem lançamentos repetidos.

#### `database.js`

- **`buscarChavesDedupReceitas(grupoId)`** — nova função que busca chaves de dedup na coleção `receitas` (a função anterior `buscarChavesDedup` consultava apenas `despesas`, tornando a proteção de receitas ineficaz)
- **`purgarDuplicatasDespesas(grupoId, dryRun?)`** — varre toda a coleção `despesas` do grupo, agrupa por chave `data + descrição + valor`, mantém o documento mais antigo e deleta os demais. Suporta modo `dryRun=true` para análise sem deleção
- **`purgarDuplicatasReceitas(grupoId, dryRun?)`** — mesma lógica para a coleção `receitas`

#### `controllers/despesas.js`

- Entradas manuais agora recebem `chave_dedup` gerada automaticamente (`manual||data||desc||valor`) antes de serem salvas no Firestore. Isso garante que um lançamento manual seja detectado como duplicata em imports futuros do mesmo extrato

#### `pages/receitas.js`

- **Bug corrigido:** `_chavesRec` era carregada via `buscarChavesDedup` (coleção `despesas`), portanto a deduplicação de receitas nunca funcionava. Corrigido para usar `buscarChavesDedupReceitas`

#### `importar.html` + `importar.js`

- Nova seção **"🧹 Manutenção da Base"** no final da página de importação:
  - **Botão "🔍 Analisar Duplicatas"**: varre todo o grupo em modo dry-run e exibe contadores (Total na base / Duplicatas encontradas) para despesas e receitas, sem deletar nada
  - **Botão "🗑️ Remover Duplicatas"** (aparece apenas se houver duplicatas): abre modal de confirmação descrevendo quantas serão removidas
  - **Modal de confirmação** com aviso de irreversibilidade antes de executar a purga
  - Após a purga, recarrega `_chavesExistentes` para que o próximo import use a base limpa

---

## [1.7.1] - 2026-03-25

### Corrigido

#### 🐛 Parcelas em Aberto — widget nunca exibia dados
**Arquivo:** `src/js/services/database.js` → `ouvirParcelamentosAbertos()`

**Causa raiz (3 camadas):**
1. A query `where('tipo','==','projecao') + orderBy('data','asc')` exigia o índice composto `(grupoId, tipo, data ASC)` no Firestore
2. O índice existia no `firestore.indexes.json` local mas **nunca havia sido deploiado** — portanto nunca foi construído na instância de produção do Firestore
3. A falha era silenciosa: `onSnapshot` capturava o erro "FAILED_PRECONDITION: The query requires an index" apenas com `console.error`, mantendo o widget oculto indefinidamente

**Fix:** Query reescrita para usar o índice `(grupoId, data DESC)` — já existente e construído desde o início do projeto. O filtro `tipo === 'projecao'` passou a ser aplicado client-side após receber os resultados:
```js
// Antes — dependia de índice nunca construído
where('grupoId','==', grupoId), where('tipo','==','projecao'), orderBy('data','asc')

// Depois — usa índice (grupoId, data DESC) já existente
where('grupoId','==', grupoId), where('data','>=', hoje), orderBy('data','desc')
// + .filter(d => d.tipo === 'projecao') client-side
```

#### 🐛 Coleções `contas` e `receitas` sem acesso no Firestore
**Arquivos:** `firestore.rules`, `firestore.indexes.json`

**Causa raiz:**
- As coleções `contas` (NRF-004) e `receitas` (RF-016) foram implementadas no código mas as regras de segurança do Firestore **nunca foram atualizadas** para permitir acesso a elas
- Firestore nega todas as operações por padrão quando não há regra definida
- O erro era silencioso: `garantirContasPadrao` usava `.catch(() => {})` e `ouvirContas` apenas logava no console
- Resultado: seletores de banco/conta vazios em todas as páginas (Fatura, Importar, Despesas)

**Fix:**
- `firestore.rules`: adicionadas regras `allow read/write/create` para `/contas/{id}` e `/receitas/{id}` com `isMemberOfGroup` igual às demais coleções
- `firestore.indexes.json`: adicionados índices compostos `contas(grupoId, ativa)` e `receitas(grupoId, data)`

---

## [1.7.0] - 2026-03-25

### Adicionado — NRF-005: Fatura do Cartão de Crédito

Nova página que substitui a planilha manual de fechamento mensal do cartão.

#### Página `fatura.html` + `fatura.js`
- Filtro por mês (navegação ‹ › ) e seletor de conta/cartão
- Cards de resumo: Total da fatura, total a pagar por membro (individual + 50% das conjuntas)
- Tabs: **Todas**, por membro (dinamicamente gerado a partir de `nomesMembros`), **Conjuntas**, **Projeções**
- Tabela completa: Data, Estabelecimento, Responsável, Tipo (P/V), Parcela, Categoria, Valor, Meu Bolso
- Despesas conjuntas com destaque visual amarelo e coluna "Por Pessoa" (= `valorAlocado ?? valor/2`)
- Seção "Projeções" com parcelas futuras dos próximos 6 meses agrupadas por mês/pessoa
- Resumo detalhado por pessoa: individuais à vista, individuais parceladas, conjuntas (50%), **Total a pagar**
- **Exportação Excel** (SheetJS) com 3 abas: Transações, Resumo, Conjuntas — substitui planilha manual
- Link `💳 Fatura` adicionado ao navbar de todas as 8 páginas da aplicação

### Corrigido — NRF-004: Detecção automática de banco no import CSV

- **`CONTAS_PADRAO` expandido**: adicionados Banco Bradesco, Nubank, Banco Inter, Caixa Econômica e Banco do Brasil — agora 11 contas padrão contra as 6 anteriores
- **`garantirContasPadrao` agora é upsert**: antes só criava contas se a lista estava vazia; agora adiciona contas faltantes ao grupo em cada inicialização, garantindo que usuários existentes recebam novos bancos automaticamente
- **Matching com normalização de acentos** (`NFD`): "Itau" (sem acento) agora corresponde corretamente a "Banco Itaú"
- **`contaNome` da coluna passa pela inferência**: quando o arquivo traz "Bradesco" na coluna Conta e não há match direto por nome, o valor da coluna agora passa pela função `inferirContaDaDescricao` (que reconhece a keyword "bradesco" → "Banco Bradesco") antes do fallback para o seletor global
- Correção replicada em `importar.js` (despesas) e `receitas.js` (receitas)

---

## [1.6.3] - 2026-03-25

### Adicionado
- **Inferência automática de banco pela descrição** (`inferirContaDaDescricao`): ao importar despesas ou receitas, o sistema detecta o banco/conta em 3 níveis — (1) coluna "Conta / Banco" do arquivo, (2) palavras-chave da descrição da transação contra os nomes das contas do grupo e mapa estático de ~16 bancos brasileiros (Itaú, Bradesco, Santander, BTG, XP, Nubank, Inter, C6, Caixa, BB, Sicoob, etc.), (3) seletor global da tela

### Corrigido
- **Import de extratos bancários com valores negativos**: `parsearLinhasExtrato` agora aplica `Math.abs()` ao valor — transações de débito em conta-corrente (ex: `-R$ 180,00`) eram descartadas; agora são importadas corretamente como despesas
- **Cache de HTML no browser**: `firebase.json` configurado com `Cache-Control: no-cache, no-store` para arquivos `.html`, evitando que o browser sirva versões desatualizadas das páginas

---

## [1.6.0] - 2026-03-25

### Adicionado — NRF-004: Identificação de Conta/Banco por Transação

Permite distinguir em qual banco ou cartão cada transação foi realizada, tanto nas despesas manuais quanto na importação em massa de extratos.

#### Coleção `contas` no Firestore
- Nova coleção normalizada (mesmo padrão das `categorias`) com escopo por grupo
- Seed automático das contas padrão ao entrar no app pela primeira vez:
  - 💳 Cartão de Crédito, 🟠 Banco Itaú, 📊 Banco XP, 🔴 Banco Santander, 💼 Banco BTG, 💵 Dinheiro
- CRUD completo: `ouvirContas`, `criarConta`, `excluirConta`, `garantirContasPadrao` em `database.js`
- Novo arquivo: `src/js/models/Conta.js` com model e `CONTAS_PADRAO`

#### Despesas — formulário e lista
- Select "Conta / Banco" no modal de Nova/Editar Despesa (campo opcional)
- Badge colorido com emoji e cor do banco em cada item da lista de despesas
- Filtro "Todas as contas" na barra de filtros da página de Despesas
- `contaId` adicionado como campo opcional nos models `Despesa.js` e `Receita.js`

#### Importação em massa de despesas (importar.html)
- **Seletor global** "🏦 De qual banco/conta é este extrato?" (Passo 2, antes do upload)
  — aplicado automaticamente a todas as transações ao carregar o arquivo
- **Override por linha** na tabela de preview (select por linha, igual às categorias)
- **Ação em lote** "Conta:" na barra de ações do preview para trocar todas de uma vez
- Mudança do seletor global após preview aberto atualiza todas as linhas em tempo real
- `contaId` propagado para as projeções de parcelas futuras
- **Parser NRF-004**: `parsearLinhasExtrato` detecta coluna "Conta / Banco" no cabeçalho do arquivo CSV/XLSX e resolve automaticamente para `contaId` via busca por nome
- **Template dinâmico**: botão "Baixar Template" agora gera o `.xlsx` via SheetJS com coluna "Conta / Banco" e aba "Instruções" listando os bancos cadastrados do grupo (substituiu link estático)

#### Importação de receitas (receitas.html)
- Seção de importação colapsável integrada à página de receitas
- Parser `_parsearLinhasRec` detecta coluna "Conta / Banco" e resolve para `contaId`
- Template dinâmico com SheetJS incluindo coluna "Conta / Banco"
- Seletor global, override por linha e ação em lote de conta, igual às despesas

### Alterado
- `app.js`: importa `garantirContasPadrao` e `CONTAS_PADRAO`; seed disparado no boot do app
- `controllers/despesas.js`: `contaId` incluído no payload de create/update
- `pages/despesas.js`: listener `ouvirContas`, populate selects, badge, filtro ativo
- `pages/importar.js`: parser atualizado com `idxConta`; template gerado dinamicamente; listener `ouvirContas` iniciado junto com categorias
- `pages/receitas.js`: lógica de importação completa com suporte NRF-004

---

## [1.5.0] - 2026-03-25

### Alterado — Redesign Visual Completo (UI/UX)

Revisão do sistema de design inspirada em bibliotecas open-source:
- **[Inter](https://github.com/rsms/inter)** (SIL Open Font License) — tipografia adotada em toda a aplicação
- **[shadcn/ui](https://github.com/shadcn-ui/ui)** (MIT) — paleta neutra slate, botões, modais, focus ring
- **[Tremor](https://github.com/tremorlabs/tremor)** (Apache 2.0) — KPI cards com linha colorida + hover lift
- **[Radix UI Colors](https://github.com/radix-ui/colors)** (MIT) — sistema semântico de cores

#### `variables.css` — novo sistema de design
- **Fonte:** Inter via Google Fonts com `preconnect` otimizado em todos os HTMLs
- **Paleta semântica:** `--color-income` (verde), `--color-expense` (rose), `--color-balance` (blue), `--color-budget` (violet)
- **Sombras refinadas:** 5 níveis com base `rgba(15,23,42)` mais suaves e realistas
- **Border radius:** aumentado (6 / 10 / 14 / 20px) para visual mais moderno
- **Transições:** `cubic-bezier(0.4,0,0.2,1)` em lugar de `ease` genérico
- Novos tokens: `--color-surface-alt`, `--color-border-hover`, `--color-primary-ring`, `--color-*-light/text`

#### `components.css` — componentes polidos
- **Navbar:** `backdrop-filter: blur(12px)` com fundo translúcido; links de navegação sem borda, separador visual entre nome do usuário e links; botão Sair vermelho no hover; responsivo (oculta nome e brand em mobile)
- **Botões:** sombra de cor no hover (`.btn-primary`), focus ring de acessibilidade (3px), variante `.btn-ghost`, `.btn-lg` e `.btn-icon`
- **Cards:** hover lift com `translateY(-2px)` e `shadow-card-hover`
- **Modal:** backdrop com `blur(4px)`, animação `slideUp` com spring, cabeçalho e rodapé com divisor
- **Inputs:** ring de foco de 3px com cor primária translúcida, hover muda cor da borda
- **Scrollbar customizada:** 6px, arredondada, transparente no track
- **Feedback forms:** ícone alinhado, borda lateral colorida

#### `dashboard.css` — layout e cards
- **Cards de resumo:** linha colorida no topo (3px) por tipo de card; hover lift; valor com `font-weight: 800` e `letter-spacing: -0.03em`
- **Category cards:** hover lift + `shadow-md`
- **Expense items:** transição suave de borda + background ao hover
- **Parcelamentos widget:** gradiente sutil no cabeçalho (`#f0f0ff → #f5f3ff`)
- **Responsivo mobile:** grid 2 colunas, brand oculto, nome do usuário oculto, padding reduzido

---

## [1.4.0] - 2026-03-25

### Adicionado
- **Fluxo de Caixa** (nova página `fluxo-caixa.html`): visão orçamentária anual mês a mês
  - Gráfico combinado (Chart.js v4, open-source): barras de Receitas/Despesas/Orçado + linha de Saldo Acumulado no eixo direito
  - Cards de resumo: Total Receitas, Total Despesas, Saldo do Ano, Total Orçado
  - Tabela detalhada mês a mês com: Receitas | Despesas | Orçado | Saldo Mês | Saldo Acumulado | Situação
  - Badge por situação: Positivo, Negativo, Acima do Orçado, Previsto (meses futuros), Sem dados
  - Mês atual destacado; meses futuros com estilo diferenciado (itálico, badge "Previsto")
  - Seletor de ano com recarga automática dos dados
  - Projeções (tipo='projecao') contabilizadas separadamente para transparência
- **database.js**: funções `buscarDespesasAno`, `buscarReceitasAno` e `buscarOrcamentosAno` para consultas anuais no Firestore
- Link "📈 Fluxo de Caixa" adicionado à navbar em todas as páginas

### Tecnologia
- **Chart.js v4.4.6** integrado via CDN jsDelivr (github.com/chartjs/Chart.js) — licença MIT

---

## [1.3.0] - 2026-03-23

### Adicionado
- **Módulo de Receitas** (RF-016): gestão completa de receitas do grupo
  - Página dedicada `receitas.html` com CRUD (criar, editar, excluir)
  - Navegação por mês (‹ / ›) com chips de total e contagem
  - Modal de nova/edição com campos: descrição, valor, categoria, data
  - Categorias de receita padrão criadas automaticamente: Salário 💼, Rendimentos 📈, Freelance 💻, Aluguel Recebido 🏠, Outros 🎁
  - `garantirCategoriasReceita` auto-cria categorias para grupos já existentes
- **Dashboard — Seção Receitas**: exibe Total Receitas, Saldo (Receitas − Despesas) e grid por categoria com barra de progresso verde
- Link "📥 Receitas" adicionado à navbar em todas as páginas

### Alterado
- `app.js`: novos listeners `ouvirReceitas` e `ouvirCategoriasReceita`; saldo re-calculado ao mudar despesas

---

## [1.2.0] - 2026-03-22

### Adicionado
- **NRF-001: Contas Compartilhadas** — chips de total por usuário para despesas do tipo "Conjunta" na página de Despesas

### Corrigido
- **Bug #90**: despesas do tipo "Conjunta" eram salvas como individuais (`isConjunta: false`) devido a cache do CDN no `Despesa.js`; `isConjunta`/`valorAlocado` movidos para o objeto base do model
- Chips de responsável não distribuíam despesas conjuntas para todos os membros do grupo

---

## [1.1.0] - 2026-03-10

### Adicionado
- RF-015: Recuperação de senha via Firebase Auth (`sendPasswordResetEmail`)
- NRF-002: Reconciliação fuzzy de parcelas projetadas no import de extratos

---

## [1.0.0] - Em produção

### Implementado
- RF-001: Autenticação (Firebase Auth — email/senha)
- RF-002: Grupos familiares com código de convite
- RF-003: Categorias personalizáveis (nome, emoji, cor)
- RF-004: Orçamento mensal por categoria com navegação de período
- RF-005–RF-011: CRUD de Despesas com sync em tempo real (Firestore onSnapshot)
- RF-012: Exportação CSV
- RF-013: Importação via Excel (SheetJS) com deduplicação e projeção de parcelas
- RF-014: Gestão multi-usuário de cartão de crédito (responsável, chips, parcelamentos)

---

<!-- Template para novas versões:

## [X.Y.Z] - YYYY-MM-DD
### Adicionado
- Nova funcionalidade X

### Alterado
- Comportamento de Y foi atualizado

### Corrigido
- Bug em Z foi corrigido

### Removido
- Funcionalidade W foi removida

-->
