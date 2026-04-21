# MF Knowledge Export — Melhores Práticas para Adoção em Outros Projetos

> Pacote de exportação de conhecimento do projeto **Minhas Finanças (MF)** — referência de maturidade da família de projetos. Destinado a ser **importado pelo PO Agent de outros projetos** (a primeira adoção será o **SSE**).

**Origem:** Minhas Finanças v3.39.0
**Data da exportação:** 2026-04-21
**Versão deste pacote:** 1.0.0
**Mantenedor:** Luigi (PO de MF e SSE)

---

## Para quem é este pacote

- **PO Agent do SSE** (e de outros projetos da família) — para importar princípios de governança, UX, design system, bússola de produto, regras invioláveis e workflow.
- **Dev Manager do SSE** — para entender o squad-modelo e os subagentes que pode criar.
- **Você (humano-PO)** — para ler antes de configurar o squad de um projeto novo e calibrar expectativas.

## O que NÃO é este pacote

- Não é uma cópia do `CLAUDE.md` do MF — é um **destilado de princípios** que viaja entre projetos.
- Não é uma especificação técnica do MF — referências ao código MF aparecem **rotuladas como exemplo**.
- Não é imutável — versão 1.0.0 reflete o estado em 2026-04-21; atualizações virão conforme MF evolui.

---

## Como usar este pacote

### Caminho recomendado de leitura

1. **README.md** (este arquivo) — entenda o pacote
2. **01-governanca-squad.md** — modelo de papéis PO → PM Agent → Dev Manager → subagentes
3. **02-subagente-ux-reviewer.md** — exemplo completo de subagente não-autônomo subordinado ao DM
4. **03-principios-ux-pv-pux.md** — 12 princípios (PV1–PV6 visual + PUX1–PUX6 experiência)
5. **04-design-system-warm-finance.md** — paleta, tipografia, tokens, anti-patterns
6. **05-bussola-produto-template.md** — estrutura da Bússola de Produto (template em branco)
7. **06-regras-invioláveis.md** — 14 regras do MF + framework para o SSE formular as próprias
8. **07-workflow-git-e-powershell.md** — Conventional Commits, branches, scripts padrão de PO
9. **08-licoes-aprendidas-feedback-memory.md** — 3 lições já aprendidas no MF
10. **09-checklist-adocao-sse.md** — passo a passo de importação no SSE

### Estilo de adoção

Cada arquivo segue um padrão visual:

- **Princípio universal** — copiar como está
- **Exemplo MF** (rotulado) — adaptar à stack do projeto adotante
- **Variação SSE / outras stacks** — orientação quando o exemplo MF não se aplica

---

## Stack do MF (referência para os exemplos)

- **Frontend:** Vanilla JavaScript ES6+, MPA com Vite 5 (13 páginas)
- **Backend:** Firebase Auth + Cloud Firestore (via npm, não CDN)
- **Charts:** Chart.js v4
- **Mobile:** Capacitor 8 (iOS — em ON HOLD aguardando Apple Developer Program)
- **Testes:** Vitest (733 unit + 26 integration com Firebase Emulator)

> **Importante:** se sua stack é diferente (React, Vue, backend tradicional, mobile-first), os princípios viajam, os exemplos não. Use os princípios como contrato e adapte a implementação.

---

## Como o pacote foi gerado

Este pacote foi produzido por uma sessão de PO Assistant em Cowork (2026-04-21) extraindo aprendizado de:

- `docs/BUSSOLA_PRODUTO.md` (estratégia)
- `docs/DESIGN_SYSTEM.md` (visual)
- `CLAUDE.md` (regras técnicas)
- `AGENTS.md` (squad)
- `.auto-memory/` (estado e propostas vigentes)
- 14 sessões PO realizadas em 2026 (decisões registradas)
- 3 feedback memories acumuladas (`memory/feedback_*.md`)

A sessão foi conduzida no padrão **passo-a-passo assistido** (ver arquivo 08).

---

## Versão e evolução

- **v1.0.0 (2026-04-21):** primeira exportação. Contém governança squad-de-3 (PO + PM + DM) com 4 subagentes (test-runner, security-reviewer, import-pipeline-reviewer, ux-reviewer).
- **Próximas versões:** atualizar quando:
  - Novos subagentes forem criados no MF
  - Novos princípios PUX/PV forem agregados
  - A Bússola ganhar nova seção estável
  - Uma regra inviolável for adicionada/removida

Para uma nova versão, executar a mesma sessão PO de exportação no MF e versionar o pacote em `docs/exports/mf-knowledge-export/`.

---

## Convenções de notação usadas neste pacote

| Símbolo | Significado |
|---|---|
| 🟢 | Princípio universal — adotar como está |
| 🟡 | Princípio universal com adaptação local — copiar e ajustar à stack |
| 🔵 | Exemplo MF — rotulado como referência, não copiar literalmente se sua stack for outra |
| ⚠️ | Anti-pattern observado no MF que o SSE deve evitar desde o início |
| 📌 | Decisão histórica do PO de MF — contexto que ajuda a entender o "por quê" |

---

## Início rápido para PO do SSE

Se você é o PO Agent do SSE e está importando este pacote pela primeira vez:

1. Leia este README inteiro
2. Pule direto para **09-checklist-adocao-sse.md**
3. Volte aos arquivos 01–08 conforme o checklist instruir

Boa adoção.
