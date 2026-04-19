# Minhas Finanças — Design System

**Versão:** 1.0
**Owner:** Luigi (PO)
**Lente conceitual:** MF Family Finance — clareza financeira para casais que gerenciam patrimônio em conjunto.

> **Formalizado em v3.34.0** a partir da identidade visual Warm Finance entregue em NRF-UI-WARM (v3.32.0).
> A assinatura visual já está em produção — este documento promove os tokens a DS v1.0 oficial.

---

## 1. Direção estética

**Tom:** *Quiet confidence.* Pensa num relatório privado de wealth management que você abre no sábado de manhã com café — não num app de banco genérico, nem num dashboard corporativo frio.

**Princípios:**
1. **Clareza sobre densidade.** Menos números na tela, mais significado por número.
2. **Calma deliberada.** Sem alertas gritando; sem gradientes roxos; sem glassmorphism. Respiração e tipografia carregam a hierarquia.
3. **Dados como narrativa.** Cada tela responde uma pergunta do "MF Family Finance": *onde estamos?*, *estamos no caminho?*, *o que muda esse mês?*
4. **Luxo contido.** Acabamento refinado em microdetalhes (espaçamento, entrelinha, tabular numerals) em vez de efeitos visuais.

**Referências mentais:** Monzo, Lunchmoney, relatórios Bridgewater, editorial do Financial Times.

**O que evitar:** roxo em gradiente, ícones infantis, animações bouncy, neumorfismo, cards com sombra pesada, emojis como elemento de UI.

---

## 2. Paleta

Variáveis CSS definidas em `src/css/variables.css` — essa é a fonte técnica canônica.
Tons derivados de uma base quente (off-white/papel) em vez de branco puro — transmite calma e legibilidade prolongada.

```css
:root {
  /* Superfícies */
  --color-bg:           #FAF9F5;  /* fundo geral, ivory quente */
  --color-surface:      #FFFFFF;  /* cards */
  --color-surface-alt:  #F0EEE6;  /* áreas rebaixadas (kraft), inputs */
  --color-border:       #E3E0D6;  /* bordas e divisores sutis */

  /* Texto */
  --color-text:           #1F1F1C;  /* texto principal, carbono quente */
  --color-text-secondary: #6B6A63;  /* secundário */
  --color-text-muted:     #8B8A82;  /* labels, timestamps — contraste 4.7:1 sobre ivory */
  --color-text-inverse:   #FFFFFF;  /* texto sobre fundos primários */

  /* Semântica financeira — dessaturada de propósito */
  --color-income:         #5B8C6B;  /* receita, verde-musgo */
  --color-income-bg:      #EBF5EF;  /* bg de tag/badge de receita */
  --color-expense:        #B55440;  /* despesa, vermelho-terroso */
  --color-expense-bg:     #FDECEA;  /* bg de tag/badge de despesa */
  --color-warning:        #D4A55A;  /* alerta de orçamento, âmbar-trigo */
  --color-warning-light:  #FDF4E0;  /* bg de tag/badge de alerta */

  /* Acento da marca (terracota) */
  --color-primary:        #CC785C;  /* cor primária da marca — usar com parcimônia */
  --color-primary-light:  #FDF0EA;  /* bg claro sobre primária */
}
```

**Regra de uso de cor:** no máximo duas cores semânticas por tela fora do cinza. Se tudo é destaque, nada é destaque.

---

## 3. Tipografia

Pareamento display + texto, com numeric tabular para números monetários.

### 3.1 Famílias

```css
:root {
  --font-display: 'Fraunces', Georgia, serif;           /* serifada editorial, KPIs e títulos */
  --font-ui:      'Inter', -apple-system, system-ui, sans-serif;  /* UI e corpo */
  --font-numeric: 'Inter', system-ui, sans-serif;       /* valores monetários + tabular-nums */
}
```

**Por que Fraunces:** dá peso editorial sem ser pretensiosa; suas variáveis ópticas funcionam bem em tamanhos grandes (KPI "R$ 12.480,00" vira statement).

**Por que Inter com tabular-nums em dinheiro:** alinhamento vertical em listas de transações sem dependência de fonte mono separada. Usar `font-variant-numeric: tabular-nums` nos elementos com `--font-numeric`.

> Fontes self-hosted em `src/assets/fonts/InterVariable.woff2` e `FrauncesVariable.woff2`.
> `@font-face` declarado em `src/css/variables.css`. Zero dependência de Google Fonts CDN.

### 3.2 Escala de tamanho (base 16px)

```css
:root {
  --text-xs:   0.75rem;    /* 12px — labels, meta */
  --text-sm:   0.875rem;   /* 14px — secundário, tags */
  --text-base: 1rem;       /* 16px — corpo */
  --text-md:   1.125rem;   /* 18px — lead, subtítulos */
  --text-lg:   1.5rem;     /* 24px — título de card */
  --text-xl:   2rem;       /* 32px — título de seção */
  --text-2xl:  2.75rem;    /* 44px — KPI principal */
  --text-3xl:  4rem;       /* 64px — hero KPI do dashboard */
}
```

### 3.3 Pesos

```css
:root {
  --weight-regular:  400;  /* corpo */
  --weight-medium:   500;  /* UI labels, deltas */
  --weight-semibold: 600;  /* números, títulos */
  --weight-bold:     700;  /* display em destaque — usar com parcimônia */
}
```

**Regra:** Fraunces em 500–600 para evitar peso exagerado. 700 só em headlines raras.

### 3.4 Entrelinha

```css
:root {
  --leading-tight:   1.0;   /* KPIs grandes */
  --leading-display: 1.15;  /* display, títulos */
  --leading-body:    1.5;   /* corpo */
}
```

### 3.5 Letter-spacing

```css
:root {
  --tracking-tight:  -0.02em;  /* KPIs grandes, display */
  --tracking-snug:   -0.01em;  /* títulos de seção */
  --tracking-normal:  0em;     /* corpo */
  --tracking-wide:    0.1em;   /* labels caixa-alta */
  --tracking-wider:   0.12em;  /* eyebrow, meta em caixa-alta */
}
```

---

## 4. Spacing

Escala em múltiplos de 4px, com nomes que ajudam os agentes a escolherem sem pensar.

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;
  --space-9:  96px;
}
```

**Regra do "ar":** em dashboards, prefira `--space-6` (32px) entre seções. Densidade mata a sensação de calma.

> **Nota:** `variables.css` usa `--spacing-*` em alguns contextos. Checar o arquivo canônico para valores exatos.

---

## 5. Raio, bordas, sombras

```css
:root {
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(31, 31, 28, 0.04);
  --shadow-md: 0 4px 16px rgba(31, 31, 28, 0.06);
}
```

Cards usam `border` + `shadow-sm`, nunca só sombra. Isso dá a sensação de "papel" em vez de "flutuante".

---

## 6. Motion

Contido. Transições curtas, easing suave. Sem spring bouncy.

```css
:root {
  --ease:      cubic-bezier(0.22, 0.61, 0.36, 1);
  --dur-fast:  120ms;
  --dur-base:  200ms;
  --dur-slow:  400ms;
}
```

**Animações permitidas:**
- Fade + translate pequeno (4–8px) em entrada de card
- Stagger em listas (50ms entre itens, máx 6 itens animados)
- Número contando em KPI principal na primeira carga (usar `requestAnimationFrame`, duração 600ms)

**Proibido:** bounce, rotação decorativa, parallax, hover com scale > 1.02.

---

## 7. Formatação de dados

Padrão pt-BR, sempre.

```js
// Moeda
new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: 2
}).format(valor);
// → "R$ 1.234,56"

// Data curta
new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'short'
}).format(data);
// → "18 abr"

// Percentual
new Intl.NumberFormat('pt-BR', {
  style: 'percent', minimumFractionDigits: 1
}).format(0.127);
// → "12,7%"
```

**Regras:**
- Valores monetários sempre em `var(--font-numeric)` com `font-variant-numeric: tabular-nums`.
- Sinal de negativo via cor (`--color-expense`) + prefixo `−` (minus real, U+2212), nunca hífen.
- Valores grandes (> R$ 10.000) no dashboard podem ser abreviados: "R$ 12,5 mil", "R$ 1,2 mi".
- Usar helper `formatarMoeda()` de `src/js/utils/formatters.js` — nunca formatar manualmente.

---

## 8. Componentes canônicos

Todo agente dev deve usar estes como building blocks. Se precisar de algo fora, abre ADR em `.auto-memory/design-decisions.md`.

### 8.1 `KpiCard`
Card que responde uma pergunta do MF Family Finance.
- Label pequena em `--color-text-muted`, `--text-xs`, caixa-alta, `--tracking-wide`
- Valor em display, `--text-2xl` (padrão) ou `--text-3xl` (hero)
- Delta opcional em pill: seta + valor + período (ex: "↑ R$ 340 vs. mês anterior")

### 8.2 `TransactionRow`
Linha de transação em lista.
- Grid: [ícone categoria 32px] [descrição + categoria] [data] [valor mono, alinhado à direita]
- Hover: `background: var(--color-surface-alt)`
- Valor negativo em `--color-expense`, positivo em `--color-income`

### 8.3 `BudgetBar`
Barra de progresso de orçamento.
- Altura 8px, `border-radius: var(--radius-pill)`
- Trilha em `--color-surface-alt`, preenchimento muda de cor conforme % usado:
  - 0–70%: `--color-income`
  - 70–95%: `--color-warning`
  - 95%+: `--color-expense`
- Labels: categoria à esquerda, "R$ 480 de R$ 800" à direita

### 8.4 `SectionHeader`
Cabeçalho de seção do dashboard.
- Título em display, `--text-xl`
- Subtítulo opcional em `--color-text-secondary`, `--text-sm`
- Ação opcional à direita ("Ver tudo →")

### 8.5 `EmptyState`
Para listas vazias.
- Ícone line (não filled), 24px, `--color-text-muted`
- Mensagem em 1 frase, display, `--text-md`
- CTA secundário, nunca primário (evita pressão)

---

## 9. Acessibilidade

- Contraste mínimo AA (4.5:1) para corpo, AAA (7:1) para valores críticos.
- `font-variant-numeric: tabular-nums` em todos os elementos numéricos.
- Toque mínimo 44×44px (PWA + iOS via Capacitor).
- Reduzir motion quando `prefers-reduced-motion: reduce`.

---

## 10. Checklist antes de fechar uma tela

Antes do Dev Agent declarar "pronto":

- [ ] Usa apenas tokens deste arquivo (nenhum hex solto, nenhum px arbitrário, nenhum rem literal fora da escala de `--text-*`)
- [ ] Tem estado vazio desenhado
- [ ] Tem estado de loading (skeleton em `--color-surface-alt`)
- [ ] Valores monetários com `formatarMoeda()` + `font-variant-numeric: tabular-nums`
- [ ] Testado em 375px (iPhone SE) e 414px (iPhone Pro)
- [ ] Respeita `prefers-reduced-motion`
- [ ] Nenhum emoji na UI (apenas ícones line de biblioteca consistente)
- [ ] `escHTML()` em todo `innerHTML` com dados do usuário
