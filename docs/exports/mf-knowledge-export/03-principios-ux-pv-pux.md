# 03 — Princípios de UX e Visual (PV1–PV6 + PUX1–PUX6)

> 12 princípios destilados da experiência do MF. **PV1–PV6** governam **identidade visual** (o que se vê); **PUX1–PUX6** governam **experiência** (como se sente). Juntos formam o contrato que o subagente `ux-reviewer` revisa em todo PR front-end.

---

## 🟢 Por que separar PV e PUX?

- **PV (Princípios Visuais)** — decisões de identidade: paleta, fontes, hero surfaces, marca. Mudança rara, decisão estratégica do PO.
- **PUX (Princípios de Experiência)** — decisões de comportamento: hierarquia, espaço, ritmo, iconografia, microcopy. Aplicação contínua em cada feature.

A separação evita que toda discussão visual vire "vamos repensar a paleta". PV é estável; PUX é vivo.

---

## 🟢 PV1–PV6 — Princípios Visuais (identidade)

### PV1 — Paleta com intenção
**Definição:** uma paleta primária estreita (3–5 cores semânticas) + neutros disciplinados. Cada cor tem papel definido (ação primária, aviso, sucesso, neutro, surface).

**Por quê:** paletas largas levam a decisões ad-hoc e dívida visual. Paleta estreita força reuso e cria identidade reconhecível.

**Exemplo MF (Warm Finance):** terracota `#CC785C` (primária) + ivory `#FAF9F5` (background) + carbon `#1F1F1C` (texto/dark surfaces) + verde sucesso + âmbar aviso + vermelho perigo. Sem paleta secundária livre.

### PV2 — Tipografia dual
**Definição:** uma fonte para títulos/marca + uma fonte para UI/corpo. Nunca mais que duas famílias ativas.

**Por quê:** dualidade tipo-marca + tipo-leitura é o suficiente para criar hierarquia sem virar circo tipográfico. Mais de duas famílias degrada performance e identidade.

**Exemplo MF:** Fraunces (display, serifa contemporânea) + Inter (UI, sans-serif geométrico).

### PV3 — Hero surfaces
**Definição:** cada tela principal tem **uma única superfície hero** que carrega o KPI ou ação central. É escura, com contraste alto, geralmente em carbon ou na cor primária.

**Por quê:** força o desenho a escolher o que importa. Sem hero, todas as áreas competem por atenção.

**Exemplo MF:** dashboard tem 1 hero (Saldo Real); fatura tem 1 hero (Total da Fatura); patrimônio tem 1 hero (Valor Líquido).

### PV4 — Tokens são a única fonte
**Definição:** cores, espaçamentos, sombras, raios e fontes só vivem em CSS custom properties (`variables.css`). **Zero hardcoded** em componentes.

**Por quê:** dark mode, refactor de paleta e auditoria visual ficam impossíveis com valores espalhados.

**Exemplo MF:** `--color-primary`, `--color-surface`, `--space-md`, `--radius-lg`, `--shadow-card`.

### PV5 — Modo escuro como cidadão de primeira
**Definição:** dark mode não é "tema secundário" — é uma das duas faces do produto. Tokens semânticos (`--color-surface`, `--color-text`) trocam automaticamente; componentes nunca têm `if (dark)`.

**Por quê:** dark mode patchwork (atalhos como `color: white !important`) gera bugs intermináveis e quebra acessibilidade.

**Exemplo MF:** `variables.css` tem `[data-theme="dark"]` que reescreve só os tokens semânticos. Todos os componentes herdam.

### PV6 — Densidade controlada
**Definição:** densidade alta só em tabelas e listas longas. KPIs, hero cards e CTAs sempre ganham ar.

**Por quê:** "tudo denso" parece dashboard de SQL Server, não produto consumer.

**Exemplo MF:** tabela de despesas usa `--space-xs` entre linhas; cards do dashboard usam `--space-xl`.

---

## 🟢 PUX1–PUX6 — Princípios de Experiência (comportamento)

> Estes 6 são o checklist do `ux-reviewer`. Cada PR front-end é avaliado contra eles.

### PUX1 — Hierarquia clara
**Definição:** cada tela tem **1–3 elementos hero**, não mais. Tudo o resto se subordina visualmente.

**Verificação:**
- [ ] É possível identificar o KPI/ação principal em <2 segundos?
- [ ] Títulos usam fonte display quando aplicável?
- [ ] KPIs principais são visivelmente maiores que secundários (escala ≥1.5×)?

**Anti-pattern:** 6 cards do mesmo tamanho competindo por atenção.

### PUX2 — Tipografia disciplinada
**Definição:** corpo em fonte UI; títulos em display (onde decidido). Escala tipográfica limitada via tokens. Números financeiros em `tabular-nums`.

**Verificação:**
- [ ] Apenas tokens `--fs-*` (sem `font-size: 14px` ad-hoc)?
- [ ] Números em colunas alinham verticalmente (`font-variant-numeric: tabular-nums`)?
- [ ] Títulos `h1`/`h2` em display; corpo em UI?

**Anti-pattern:** `<span style="font-size: 13.5px">` para "ajustar visualmente".

### PUX3 — Iconografia única
**Definição:** uma única biblioteca de ícones (no MF: Lucide). **Zero emojis em chrome de UI**. Emojis aceitos só em **dados do usuário** (nome de categoria, observação).

**Verificação:**
- [ ] Nenhum 📊 ou 🏠 em botões, navbar ou cards?
- [ ] Todos os ícones SVG vêm da mesma biblioteca?
- [ ] Tamanho de ícone usa token (`--size-icon-*`)?

**Anti-pattern:** `<button>📊 Dashboard</button>` (chrome com emoji).

**Exemplo MF:** `dashboard.html` tinha 19 emojis em chrome — disparou o NRF-UX F3 (#195).

### PUX4 — Cor com intenção
**Definição:** cores semânticas em contextos corretos. Sucesso = verde; aviso = âmbar; perigo = vermelho. Primária só em CTAs principais.

**Verificação:**
- [ ] Zero cores hardcoded?
- [ ] Cor de sucesso não aparece como decoração aleatória?
- [ ] Contraste AA/AAA em hero surfaces dark?

**Anti-pattern:** badge azul "Novo" + badge verde "Beta" + badge roxo "Premium" sem critério semântico.

### PUX5 — Espaço respiratório
**Definição:** padding e gap via tokens. Hero cards ganham `--space-xl`. Densidade só onde a função pede.

**Verificação:**
- [ ] Apenas tokens `--space-*` (sem `padding: 12px` ad-hoc)?
- [ ] Hero cards têm gap visualmente folgado?
- [ ] Listas longas usam densidade controlada (`--space-xs`)?

**Anti-pattern:** `<div style="padding: 8px 14px 12px 6px">` montagem manual de espaço.

### PUX6 — Ritmo e movimento sóbrios
**Definição:** animações curtas, com easing controlado, via tokens. **Zero bounce/rotate** em elementos funcionais. Skeletons em loading; nunca spinners infinitos.

**Verificação:**
- [ ] Durações via tokens (`--motion-duration-fast/medium/slow`)?
- [ ] Easing via tokens (`--motion-ease-standard`)?
- [ ] Loadings usam skeletons (placeholders cinzas) e não spinners?
- [ ] Nenhum `animation: bounce 1s infinite` em botão primário?

**Anti-pattern:** modal abre com `transform: rotate(360deg) scale(0.5)` em 800ms.

---

## 🟢 Como aplicar PV + PUX em uma feature nova

```
1. PO desenha a feature (RF/ENH)
2. PO checa: que princípios PV/PUX estão em jogo?
3. PO referencia explicitamente na issue: "atende PUX1, PUX4"
4. DM implementa usando tokens existentes
5. ux-reviewer roda checklist completo no PR
6. DM corrige divergências bloqueantes
7. Merge — feature entra com identidade preservada
```

---

## 🔵 Exemplo MF — Como PUX1 corrigiu o dashboard

**Antes:** dashboard tinha 6 cards do mesmo tamanho (Saldo, Receitas, Despesas, Forecast, Burn Rate, Patrimônio) — usuário não sabia onde olhar primeiro.

**Aplicação PUX1:**
- Saldo Real virou hero card 2x maior, ocupando largura total da primeira fileira
- Receitas/Despesas passaram a ser cards médios na segunda fileira
- Forecast/Burn Rate/Patrimônio viraram cards menores com link "ver mais"

**Resultado:** ENH-004 (PR #185) — progressive disclosure + hierarquia clara.

---

## 🟡 Como adaptar PV + PUX para outro projeto

### Adaptações típicas por contexto

| Contexto | Ajuste sugerido |
|---|---|
| App B2B com muita densidade | PV6 (densidade) ganha mais peso; PUX5 (espaço) reduz `--space-*` em data-rooms |
| Produto consumer com forte marca | PV1–PV3 são onde gastar tempo; PUX são default do squad |
| Dashboard analítico | PV3 (hero surfaces) substituído por "1 KPI + grade de gráficos"; PUX2 (números tabulares) é crítico |
| App mobile-first | Adicionar PUX7 — touch targets ≥44px; PUX5 ajusta para gestos |

### Checklist de adoção

1. Decidir paleta primária e neutros (PV1) — gastar 1 sessão
2. Decidir as 2 famílias tipográficas (PV2) — gastar 1 sessão
3. Definir o "hero surface" da tela principal (PV3)
4. Estabelecer tokens em `variables.css` ou equivalente (PV4)
5. Implementar dark mode desde o dia 1 (PV5) — é mais barato que retrofit
6. Escrever os 6 PUX com exemplos do próprio projeto
7. Criar o subagente que revisa esses princípios (ver arquivo 02)

---

## ⚠️ Anti-patterns universais

- **Princípios sem checklist** — viram poesia, ninguém aplica. Sempre acompanhe cada princípio de critérios verificáveis.
- **Princípios negociáveis** — "atende PUX4 mas com cor hardcoded só dessa vez" → cria precedente. Princípio que admite exceção deixa de ser princípio.
- **Princípios sem dono** — sem subagente revisor + Regra Inviolável, princípio é decoração de documentação.
- **Princípios mudando a cada sprint** — PV deve ser estável por trimestres; PUX por meses. Mudança constante destrói coerência.

---

## 📌 Histórico no MF

| Data | Marco |
|---|---|
| Início | Sem princípios formais — visual ad-hoc |
| 2026-03 | Warm Finance v1 estabelecido (PV1 + PV2) |
| 2026-04-15 | NRF-UI-WARM (PR #179) — paleta consolidada |
| 2026-04-19 | Design System v1.0 formalizado (RF-070, PR #183) |
| 2026-04-20 | NRF-NAV F1 — hero pattern aplicado em navbar (PR #180) |
| 2026-04-21 | PUX1–PUX6 redigidos (Bússola §12.5) + ux-reviewer criado |

---

## Referências cruzadas

- **02-subagente-ux-reviewer.md** — quem revisa estes princípios
- **04-design-system-warm-finance.md** — implementação concreta dos PV no MF
- **05-bussola-produto-template.md** — onde estes princípios são inscritos (§12.5)
- **06-regras-invioláveis.md** — Regra #14 amarra PUX à governança
