# Design System — Minhas Financas

> Referencia visual do projeto. Fonte de verdade: `src/css/variables.css`.
> Ultima atualizacao: v3.17.0 (2026-04-06)

---

## 1. Paleta de Cores

### Marca / Primaria
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#6366f1` (Indigo 500) | Botoes principais, links, badges ativos |
| `--color-primary-hover` | `#4f46e5` (Indigo 600) | Hover de botoes primarios |
| `--color-primary-light` | `#eef2ff` (Indigo 50) | Fundo de selecao ativa (radio, chip) |
| `--color-primary-ring` | `rgba(99,102,241, 0.22)` | Focus ring global |
| `--color-primary-shadow-25` | `rgba(99,102,241, 0.25)` | Sombra de botao primario |
| `--color-primary-shadow-32` | `rgba(99,102,241, 0.32)` | Sombra hover de botao primario |

### Superficie e Bordas
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#f8fafc` (Slate 50) | Fundo da pagina |
| `--color-surface` | `#ffffff` | Cards, modais, inputs |
| `--color-surface-alt` | `#f1f5f9` (Slate 100) | Fundo alternativo (thead, chips) |
| `--color-surface-hover` | `#f8fafc` | Hover de linhas |
| `--color-surface-glass` | `rgba(255,255,255, 0.92)` | Navbar com backdrop-filter |
| `--color-border` | `#e2e8f0` (Slate 200) | Bordas padrao |
| `--color-border-hover` | `#cbd5e1` (Slate 300) | Bordas em hover |

### Texto
| Token | Valor | Contraste | Uso |
|-------|-------|-----------|-----|
| `--color-text` | `#0f172a` (Slate 900) | 15.4:1 | Texto principal |
| `--color-text-secondary` | `#475569` (Slate 600) | 7.0:1 | Texto secundario |
| `--color-text-muted` | `#64748b` (Slate 500) | 5.6:1 (WCAG AA) | Labels, hints |
| `--color-text-inverse` | `#ffffff` | — | Texto em fundo escuro |
| `--color-text-inverse-muted` | `rgba(255,255,255, 0.85)` | — | Labels em cards coloridos |

### Status (Orcamentos)
| Token | Cor | Light | Texto | Faixa |
|-------|-----|-------|-------|-------|
| `--color-ok` | `#10b981` | `#d1fae5` | `#065f46` | < 70% |
| `--color-warning` | `#f59e0b` | `#fef3c7` | `#92400e` | 70-89% |
| `--color-danger` | `#ef4444` | `#fee2e2` | `#991b1b` | 90-100% |
| `--color-critical` | `#8b5cf6` | `#ede9fe` | `#5b21b6` | > 100% |

### Financas (Semantica)
| Token | Cor | Uso |
|-------|-----|-----|
| `--color-income` / `-bg` / `-dark` / `-border` | Verde (`#10b981`) | Receitas |
| `--color-expense` / `-bg` / `-dark` | Rose (`#f43f5e`) | Despesas |
| `--color-balance` / `-bg` / `-dark` / `-border` | Blue (`#3b82f6`) | Saldo |
| `--color-budget` / `-bg` / `-dark` | Violet (`#8b5cf6`) | Orcado |

### Funcional
| Token | Cor | Uso |
|-------|-----|-----|
| `--color-info` / `-light` / `-bg` / `-border` / `-text` | Blue 800 (`#1565c0`) | Fatura, parcelas |
| `--color-conjunta` / `-light` / `-border` / `-dark` | Purple (`#7b1fa2`) | Despesas compartilhadas |
| `--color-fuzzy-*` | Amber (`#fff8e1`) | Reconciliacao fuzzy |
| `--color-import-error-*` | Orange (`#fff8f0`) | Erros de importacao |
| `--color-import-hint-*` | Blue claro (`#f8faff`) | Hints na importacao |

### Overlays
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-backdrop` | `rgba(15,23,42, 0.45)` | Fundo de modais |
| `--color-info-row` | `rgba(21,101,192, 0.05)` | Destaque de linha atual (fluxo de caixa) |

---

## 2. Tipografia

**Familia:** Inter (Google Fonts) com fallbacks sistema.

| Token | Tamanho | Uso |
|-------|---------|-----|
| `--font-size-xs` | 11px | Badges, labels pequenos |
| `--font-size-sm` | 13px | Texto auxiliar, chips |
| `--font-size-base` | 15px | Corpo principal |
| `--font-size-lg` | 17px | Subtitulos |
| `--font-size-xl` | 22px | Titulos de secao |
| `--font-size-2xl` | 28px | Titulo principal (dashboard) |

### Pesos
| Peso | Uso |
|------|-----|
| 400 (Regular) | Corpo de texto |
| 500 (Medium) | Labels, nomes de campos |
| 600 (SemiBold) | Titulos de cards, nomes de categorias |
| 700 (Bold) | Valores monetarios, totais |
| 800 (ExtraBold) | KPIs do dashboard |

### Line Heights
| Token | Valor | Uso |
|-------|-------|-----|
| `--line-height-tight` | 1.2 | Titulos, badges |
| `--line-height-normal` | 1.5 | Corpo de texto |
| `--line-height-relaxed` | 1.65 | Texto com mais respiro |

---

## 3. Espacamento

**Unidade base:** 4px (grid de 8px para layouts).

| Token | Valor | Uso tipico |
|-------|-------|------------|
| `--space-1` | 4px | Gap minimo, padding de badges |
| `--space-2` | 8px | Gap entre elementos inline |
| `--space-3` | 12px | Padding de chips, gap de listas |
| `--space-4` | 16px | Padding padrao de cards/modais |
| `--space-5` | 20px | Padding generoso |
| `--space-6` | 24px | Margem de secoes |
| `--space-8` | 32px | Separacao de blocos |
| `--space-10` | 40px | Espacamento hero |

---

## 4. Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 6px | Badges, tags |
| `--radius-md` | 10px | Cards, inputs |
| `--radius-lg` | 14px | Modais, cards maiores |
| `--radius-xl` | 20px | Containers hero |
| `--radius-full` | 9999px | Pills, avatares |

---

## 5. Sombras

| Token | Uso |
|-------|-----|
| `--shadow-xs` | Navbar, bordas sutis |
| `--shadow-sm` | Cards em repouso |
| `--shadow-md` | Cards elevados |
| `--shadow-lg` | Dropdowns, popovers |
| `--shadow-xl` | Modais |
| `--shadow-card-hover` | Hover de cards (toque indigo) |

---

## 6. Layout

| Token | Valor |
|-------|-------|
| `--navbar-height` | 58px |
| `--max-width` | 1140px |

### Breakpoints

| Nome | Largura | Comportamento |
|------|---------|---------------|
| Mobile | < 640px | 1 coluna, FAB visivel, chips scrollaveis |
| Tablet | 640-1024px | 2-3 colunas, layout intermediario |
| Desktop | > 1024px | Layout completo, sidebar-style |

---

## 7. Transicoes e Animacao

| Token | Valor | Uso |
|-------|-------|-----|
| `--transition` | `0.16s cubic-bezier(0.4, 0, 0.2, 1)` | Hover, focus, toggles |
| `--transition-slow` | `0.28s cubic-bezier(0.4, 0, 0.2, 1)` | Fade-in, collapse/expand |

### Animacoes CSS
- `.fade-in` — entrada suave de conteudo
- `.skeleton` — shimmer de carregamento

### prefers-reduced-motion
**Obrigatorio:** todas as animacoes e transicoes devem ser desativadas quando o usuario prefere movimento reduzido. Implementado em `components.css` (linhas 584-709).

---

## 8. Componentes

### Navbar
- Sticky, `backdrop-filter: blur(12px)`, fundo `--color-surface-glass`
- Altura: `--navbar-height` (58px)
- Links com icones Lucide (16x16) + labels de texto
- Estado ativo: `.btn-primary.btn-sm`
- Variante com back arrow (`.navbar-back`) para subpaginas

### Botoes
| Classe | Uso |
|--------|-----|
| `.btn-primary` | Acao principal |
| `.btn-outline` | Acao secundaria |
| `.btn-ghost` | Acao terciaria (sem borda) |
| `.btn-danger` | Acao destrutiva |
| `.btn-sm` | Tamanho compacto |
| `.btn-lg` | Tamanho grande |

### Cards
- Fundo `--color-surface`, borda `--color-border`, raio `--radius-md`
- Sombra `--shadow-sm` (repouso) / `--shadow-card-hover` (hover)
- Variantes: `.resumo-card`, `.fat-card`, `.imp-card`

### Modais
**Padrao A (preferido):** `.modal` + `.modal-backdrop` + `.modal-card`
**Padrao B (legado):** `.modal-overlay` (backdrop integrado)

### Inputs
- Borda `--color-border`, raio `--radius-md`
- Focus: `border-color: --color-primary` + `box-shadow: --color-primary-ring`
- Min-height 44px no mobile (WCAG 2.5.5)

### Chips
- Fundo `--color-surface-alt`, borda `--color-border`
- Variantes semanticas: `--verde`, `--azul`, `--aviso`, `--dup`, `--proj`, `--fuzzy`

### FAB (Floating Action Button)
- Visivel apenas em mobile (< 640px)
- Posicao fixa, bottom-right
- Icone "+" para nova despesa

---

## 9. Estados

| Estado | Implementacao |
|--------|---------------|
| **Hover** | Transicao suave, sombra elevada ou fundo `--color-surface-hover` |
| **Focus** | Ring `0 0 0 3px var(--color-primary-ring)` via `:focus-visible` |
| **Active** | Fundo `--color-primary`, texto `--color-text-inverse` |
| **Disabled** | `opacity: 0.45`, `cursor: not-allowed` |
| **Loading** | Skeleton shimmer (`.skeleton`, `.skeleton-line`, `.skeleton-card`) |
| **Vazio** | `.empty-state` com icone, titulo e hint |
| **Erro** | `.error-state` com titulo, hint e botao de retry |

---

## 10. Acessibilidade

- **Contraste WCAG AA:** texto muted >= 5.6:1, texto principal >= 15:1
- **Touch targets:** minimo 44x44px em mobile (aplicado via media query)
- **Focus visible:** ring de 3px em todos os elementos interativos
- **prefers-reduced-motion:** animacoes desativadas quando solicitado
- **Semantica HTML:** uso de `<nav>`, `<main>`, `<section>`, `<button>`

---

## 11. Icones

**Biblioteca:** Lucide Icons v0.460.0 (CDN UMD)

| Pagina | Icone | data-lucide |
|--------|-------|-------------|
| Dashboard | layout-dashboard | `layout-dashboard` |
| Planejamento | clipboard-list | `clipboard-list` |
| Despesas | trending-down | `trending-down` |
| Receitas | wallet | `wallet` |
| Orcamentos | piggy-bank | `piggy-bank` |
| Fluxo de Caixa | line-chart | `line-chart` |
| Categorias | tags | `tags` |
| Fatura | credit-card | `credit-card` |
| Base de Dados | database | `database` |

Inicializacao: `lucide.createIcons()` no `DOMContentLoaded` de cada pagina.
