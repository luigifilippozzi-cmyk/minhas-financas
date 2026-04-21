# 04 — Design System: Warm Finance (exemplo MF)

> Implementação concreta dos princípios PV1–PV6 no MF. Serve como **referência de arquitetura de DS** para outros projetos — não como paleta a copiar. O nome "Warm Finance" reflete uma escolha específica do MF; outro projeto terá outra identidade.

---

## 🟢 O que um DS precisa ter (independente de projeto)

1. **Paleta em tokens** — com semântica, não só nomes de cor
2. **Tipografia em tokens** — famílias, escalas, pesos
3. **Espaçamento em tokens** — escala limitada (típico: 6–10 níveis)
4. **Sombras e raios em tokens** — 3–5 níveis cada
5. **Motion em tokens** — duração + easing
6. **Dark mode nativo** — tokens semânticos trocam automaticamente
7. **Componentes canônicos** — botão, input, card, modal com variantes controladas
8. **Anti-patterns documentados** — o que nunca fazer

Se faltar qualquer um dos 8 itens, o DS não está completo — está a caminho.

---

## 🔵 Exemplo MF — Warm Finance v1.0

### PV1 aplicado — Paleta

**Primária:**
- `--color-primary: #CC785C` (terracota) — CTAs principais, estado ativo de navbar, links importantes
- `--color-primary-hover: #B66A50` — hover state
- `--color-primary-subtle: #F7E3D9` — backgrounds sutis de estado "selecionado"

**Neutros:**
- `--color-ivory: #FAF9F5` — background claro
- `--color-carbon: #1F1F1C` — texto principal / hero surfaces dark
- `--color-carbon-60: #5C5C58`
- `--color-carbon-30: #B0B0AB`
- `--color-carbon-10: #E5E4DF`

**Semânticos:**
- `--color-success: #3F7D4F` — verde musgo (receitas, ganhos)
- `--color-warning: #D4A24C` — âmbar (orçamento 80%+, avisos)
- `--color-danger: #B04A3C` — terracota profunda (despesas críticas, estouro)
- `--color-info: #5C7A94` — azul grafite (projeções, info neutra)

> ⚠️ **Atenção:** no MF as cores de despesa/receita convivem sem conflito com a primária porque `--color-danger` e `--color-success` moram em contextos de **dado** (tabelas, KPIs) enquanto a primária mora em contextos de **ação**. Essa separação contexto-função é o que impede "soup of colors".

### PV2 aplicado — Tipografia

```css
--font-display: 'Fraunces', ui-serif, Georgia, serif;
--font-ui:      'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono:    'IBM Plex Mono', ui-monospace, Menlo, monospace;
```

**Escala tipográfica:**
```css
--fs-xs:   0.75rem;   /* 12px — captions, labels */
--fs-sm:   0.875rem;  /* 14px — secondary body */
--fs-base: 1rem;      /* 16px — body */
--fs-md:   1.125rem;  /* 18px — lead */
--fs-lg:   1.5rem;    /* 24px — h3 */
--fs-xl:   2rem;      /* 32px — h2 */
--fs-2xl:  2.5rem;    /* 40px — h1 */
--fs-hero: 3.5rem;    /* 56px — hero KPI */
```

**Números financeiros:**
```css
.mf-numeric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```
Toda célula de tabela que mostra dinheiro usa essa classe — garante alinhamento vertical.

### PV3 aplicado — Hero surfaces

```css
.mf-hero-card {
  background: var(--color-carbon);
  color: var(--color-ivory);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
}

.mf-hero-card__value {
  font-family: var(--font-display);
  font-size: var(--fs-hero);
  font-variant-numeric: tabular-nums;
}
```

Regra de ouro: **no máximo 1 hero card por tela**. Mais que isso = nenhum hero.

### PV4 aplicado — Tokens como única fonte

Arquivo canônico: `src/css/variables.css`

```css
:root {
  /* Paleta (ver PV1) */

  /* Espaço */
  --space-2xs: 0.125rem;
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;

  /* Raios */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm:    0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.08);
  --shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.10);
  --shadow-card:  0 2px 8px -2px rgb(0 0 0 / 0.08);

  /* Motion */
  --motion-duration-fast:   120ms;
  --motion-duration-medium: 240ms;
  --motion-duration-slow:   400ms;
  --motion-ease-standard:   cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-emphasis:   cubic-bezier(0.2, 0, 0, 1);
}
```

### PV5 aplicado — Dark mode

```css
[data-theme="dark"] {
  --color-surface:        var(--color-carbon);
  --color-surface-elevated: #2A2A27;
  --color-text:           var(--color-ivory);
  --color-text-muted:     var(--color-carbon-30);
  --color-border:         #3A3A36;
  /* Primária mantém o mesmo hex — terracota funciona em light e dark */
}
```

**Princípio MF:** apenas **tokens semânticos** (`--color-surface`, `--color-text`) trocam. Tokens primitivos (`--color-carbon`, `--color-ivory`) permanecem idênticos.

### PV6 aplicado — Densidade

- Tabelas: `padding: var(--space-xs) var(--space-sm)` nas `td`
- Cards de KPI: `padding: var(--space-xl)` + `gap: var(--space-lg)` internamente
- Navbar: `padding: var(--space-sm) var(--space-md)` por item
- Modal body: `padding: var(--space-xl)`

---

## 🟢 Componentes canônicos (estrutura)

Todo DS precisa de, no mínimo:

| Componente | Variantes típicas |
|---|---|
| Botão | primary, secondary, ghost, danger, icon-only |
| Input | text, number, date, currency, select, textarea |
| Card | default, elevated, hero, compact |
| Modal | default, full-screen (mobile) |
| Chip/Badge | neutral, success, warning, danger, info |
| Skeleton | text-line, card, chart, table-row |
| Toast | success, info, error |

Cada variante é **composição de tokens**, não CSS ad-hoc.

### Exemplo MF — botão primário

```css
.mf-btn {
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  font-weight: 500;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: background var(--motion-duration-fast) var(--motion-ease-standard);
  cursor: pointer;
}

.mf-btn--primary {
  background: var(--color-primary);
  color: var(--color-ivory);
}
.mf-btn--primary:hover { background: var(--color-primary-hover); }
```

Sem tokens, esse botão teria `background: #CC785C; color: #FAF9F5;` espalhado em 30 arquivos. **Inviabiliza refactor de paleta.**

---

## 🟢 Iconografia — regra do MF

- Biblioteca única: **Lucide** (SVG inline ou via lib React/vanilla)
- Tamanhos via tokens: `--size-icon-sm: 16px`, `--size-icon-md: 20px`, `--size-icon-lg: 24px`
- Cor sempre via `currentColor` (herda do texto) ou token semântico
- **Zero emojis em chrome** (ver PUX3)

---

## 🟡 Anti-patterns observados no MF e como foram corrigidos

### Anti-pattern 1 — Cor hardcoded em componente JS

**Sintoma:** arquivos `.js` com `style="color: #CC785C"` em templates inline.
**Correção:** refactor para `className="mf-text-primary"` + classe que usa token.
**Regra:** `CLAUDE.md` Regra Inviolável #4 — "cores hardcoded → bloqueante".

### Anti-pattern 2 — Emoji em navbar

**Sintoma:** `<a href="/dashboard">📊 Dashboard</a>`.
**Correção (em andamento):** NRF-UX F3 (#195) — substituir por ícone Lucide.
**Regra:** PUX3 — iconografia única.

### Anti-pattern 3 — Gráfico Chart.js com fontes padrão minúsculas

**Sintoma:** labels de eixo em 10px, ilegível.
**Correção (planejada):** NRF-UX F7 (#199) — Chart.js global defaults usando tokens `--fs-sm`, `--font-ui`, `tabular-nums`.
**Regra:** PUX2 — tipografia disciplinada.

### Anti-pattern 4 — Dark mode patchwork

**Sintoma:** componente com `background: white;` + override `@media (prefers-color-scheme: dark) { background: #1F1F1C; }` espalhado.
**Correção:** migrar para token semântico `--color-surface` — componente não sabe se é light ou dark.
**Regra:** PV5 — dark mode cidadão de primeira.

---

## 🟢 Processo de evolução do DS

**Regra MF:** mudar um token é **decisão do PO**, não do DM.

Sequência padrão para alterar um token:
1. PO identifica necessidade (em sessão Cowork)
2. PO avalia impacto — quantos componentes dependem?
3. PO escreve patch do `variables.css` em `.auto-memory/proposals/`
4. DM aplica o patch em PR com changelog visual
5. `ux-reviewer` revisa consistência
6. `test-runner` roda visual regression (se houver)
7. Merge — DS evolui uma versão minor

Adicionar um **novo componente canônico** segue o mesmo fluxo, com documentação em `docs/DESIGN_SYSTEM.md`.

---

## 🟡 Como começar um DS em outro projeto (caminho recomendado)

### Semana 1 — Fundamentos
- Escolher paleta primária + neutros + semânticos (PV1)
- Escolher 2 famílias tipográficas (PV2)
- Criar `variables.css` com tokens de cor, espaço, tipo, raio, sombra, motion
- Implementar dark mode via tokens semânticos (PV5)

### Semana 2 — Componentes canônicos (MVP)
- Botão (3 variantes), Input (3 tipos), Card (2 variantes), Modal, Chip
- Documentar em `docs/DESIGN_SYSTEM.md` com exemplos e código

### Semana 3 — Governança
- Criar subagente `ux-reviewer` (ver arquivo 02)
- Adicionar Regra Inviolável no `CLAUDE.md`
- Escrever PV1–PV6 e PUX1–PUX6 na Bússola (ver arquivo 05)

### Semana 4+
- Expandir componentes conforme features pedem
- Revisar identidade a cada 3 meses (PV) / semana (PUX)

---

## ⚠️ Sinais de que o DS está saudável

- ✅ `git grep "#[0-9a-fA-F]{6}"` em `src/js/` retorna vazio
- ✅ `git grep "font-size:" src/css/` só aparece em `variables.css`
- ✅ Novo componente reusa tokens, não cria tokens novos sem PR explícito
- ✅ Dark mode não tem `if (theme === 'dark')` em lógica JS
- ✅ PR front-end sempre tem relatório do `ux-reviewer` anexo
- ✅ `docs/DESIGN_SYSTEM.md` está a ≤30 dias do estado real do CSS

## ⚠️ Sinais de que o DS está degradando

- ❌ Novos hex codes aparecendo em componentes
- ❌ Componentes duplicados (`.card`, `.card-v2`, `.card-new`)
- ❌ Tokens com nomes duvidosos (`--color-azul-do-luigi`)
- ❌ Documentação mais de 2 meses atrás do código
- ❌ Dark mode com patches em JS

---

## 📌 Histórico do Warm Finance no MF

| Versão | Marco | PR |
|---|---|---|
| v0 | Paleta ad-hoc pré-DS | — |
| v0.5 | `variables.css` criado (tokens básicos) | v3.20.0 |
| v1.0-alpha | Paleta Warm definida, tipografia Inter | NRF-UI-WARM (#179) |
| v1.0 | DS formalizado com documentação completa | RF-070 (#183) |
| v1.1 (plan) | Fraunces + Chart.js tokens + microcopy | NRF-UX F2 (#194) em diante |

---

## Referências cruzadas

- **03-principios-ux-pv-pux.md** — os princípios que este DS materializa
- **02-subagente-ux-reviewer.md** — quem garante que o DS não degrada
- **06-regras-invioláveis.md** — regras #4 (cores hardcoded) e #13 (consultar DS antes de UI)
- **05-bussola-produto-template.md** — onde a Identidade Visual fica inscrita (§12 do MF)
