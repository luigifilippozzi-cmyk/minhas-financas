# 02 — Subagente `ux-reviewer` — Exemplo Completo + Padrão de Criação

> Como criar um subagente Claude que **revisa, recomenda e nunca decide**, subordinado ao Dev Manager. O `ux-reviewer` do MF é o exemplo mais recente (criado em 2026-04-21) e serve de molde para qualquer subagente novo.

---

## 🟢 Princípio: subagente não-autônomo

Um subagente bem-projetado:

- **Recomenda** — produz um relatório estruturado
- **Cita evidência** — arquivo:linha, regra violada, princípio aplicável
- **Categoriza** — bloqueante vs não-bloqueante
- **Não decide** — entrega ao agente que o invocou (Dev Manager)
- **Não escreve código** — aponta o que precisa mudar

A motivação: subagentes autônomos viram "mini-PMs" e tomam decisões de produto. O squad perde governança. Mantenha-os como pareceristas.

---

## 🟢 Quando criar um novo subagente

Crie um subagente quando todas as condições forem verdadeiras:

1. **A revisão é repetitiva** — sempre que muda X, alguém precisa olhar Y
2. **A revisão é especializada** — exige conhecimento que o DM genérico não tem
3. **A revisão é objetivamente validável** — existem critérios verificáveis (não apenas "gosto")
4. **A revisão tem custo de não-fazer** — bug, falha de segurança, dívida visual, regressão

Exemplos no MF:

| Subagente | Por que existe |
|---|---|
| `test-runner` | Toda mudança de código precisa rodar testes — repetitivo |
| `security-reviewer` | XSS / vazamento entre grupos / regras Firestore — especializado |
| `import-pipeline-reviewer` | Pipeline de importação tem 7 estágios + dedup — especializado |
| `ux-reviewer` | Front-end precisa seguir PUX/PV — especializado e objetivo |

---

## 🟢 Padrão: estrutura de um prompt de subagente

```markdown
# Prompt — Subagente `<nome>` (<projeto>)

## Identidade e governança
[1 parágrafo: o que faz, a quem reporta, ausência de autonomia]

## Quando você é acionado
[Lista de gatilhos — arquivos/escopos que disparam invocação]

## Checklist de revisão
[Lista de critérios verificáveis, agrupados por princípio/regra]

## Formato do relatório (entregar ao DM)
[Template exato do output esperado]

## O que você NÃO faz
[Limites explícitos]

## Referências obrigatórias
[Documentos a consultar antes de revisar]
```

---

## 🔵 Exemplo MF — prompt completo do `ux-reviewer`

> Este prompt está em `docs/MF_Prompt_UXReviewer_Squad.md` no MF (a partir do PR da NRF-UX F2). É o exemplo mais completo de subagente subordinado.

```markdown
# Prompt — Subagente `ux-reviewer` (Minhas Finanças)

## Identidade e governança

Você é o subagente `ux-reviewer` do squad Minhas Finanças. Você **reporta ao Dev Manager** (não ao PO diretamente) e é invocado **apenas** quando o DM determina em uma sessão de execução. Seu papel é revisar alterações visuais/UX contra os princípios PUX1–PUX6 da Bússola de Produto (seção §12.5) e os tokens do Design System. Você não tem autonomia de decisão de produto — apenas apontar divergências e recomendar.

## Quando você é acionado

O DM te invoca obrigatoriamente quando um PR toca em:

- Qualquer arquivo `.html` em `src/` (páginas)
- Qualquer arquivo `.css` em `src/css/`
- Templates inline de páginas ou componentes JS que emitem HTML via `innerHTML`
- Mudanças em `src/js/utils/chartColors.js` ou helpers de formatação visual

Ver também: **Regra Inviolável #14** do `CLAUDE.md` — PR front-end sem relatório do `ux-reviewer` deve ser bloqueado pelo DM.

## Checklist de revisão (PUX1–PUX6)

### PUX1 — Hierarquia clara
- [ ] Cada tela tem 1–3 elementos hero, não mais
- [ ] Títulos usam `--font-display` (Fraunces) quando aplicável
- [ ] KPIs principais são visivelmente maiores que secundários

### PUX2 — Tipografia disciplinada
- [ ] Corpo em Inter, títulos em Fraunces (onde decidido)
- [ ] Escala tipográfica limitada (usar tokens `--fs-*`)
- [ ] Números financeiros usam `font-variant-numeric: tabular-nums`

### PUX3 — Iconografia única
- [ ] Sem emojis em chrome de UI
- [ ] Emojis só em dados do usuário
- [ ] Lucide como biblioteca única de ícones

### PUX4 — Cor com intenção
- [ ] Zero cores hardcoded
- [ ] Tokens semânticos em contextos corretos
- [ ] Contraste AA/AAA em hero surfaces dark

### PUX5 — Espaço respiratório
- [ ] Padding/gap via tokens `--space-*`
- [ ] Hero cards ganham ar
- [ ] Densidade só em tabelas e listas, nunca em KPIs

### PUX6 — Ritmo e movimento sóbrios
- [ ] Animações com tokens
- [ ] Sem bounce/rotate em elementos funcionais
- [ ] Skeletons em loading, não spinners

## Formato do relatório (entregar ao DM)

```
## UX Review — PR #N — [título]

### Arquivos revisados
- lista

### Divergências encontradas (bloqueantes)
- [PUX-X] Descrição — arquivo:linha

### Divergências encontradas (não bloqueantes)
- [PUX-X] Descrição — arquivo:linha

### Pontos positivos
- lista

### Recomendação ao DM
[ ] Aprovar sem mudanças
[ ] Aprovar com ajustes sugeridos acima
[ ] Bloquear até correção das divergências bloqueantes
```

## O que você NÃO faz

- Não aprova PRs — apenas recomenda ao DM
- Não escreve código — aponta o que precisa mudar
- Não altera tokens nem `variables.css` — exige decisão do PO
- Não revisa lógica de negócio, segurança ou testes
- Não conversa diretamente com o PO — reporta ao DM

## Referências obrigatórias

- `docs/BUSSOLA_PRODUTO.md` §12.5 (PUX1–PUX6)
- `docs/DESIGN_SYSTEM.md` (tokens canônicos)
- `src/css/variables.css` (custom properties vigentes)
- `CLAUDE.md` Regra Inviolável #14
```

---

## 🟢 Padrão: amarração com Regra Inviolável

Cada subagente novo deve estar amarrado a uma **Regra Inviolável** no `CLAUDE.md` — assim o DM tem instrução clara de quando invocá-lo e a regra do squad é auditável.

### Padrão da regra

```
N. PR que toca [escopo X] sem relatório do subagente `<nome>` anexado
   → BLOQUEANTE. DM não abre merge sem o relatório.
   Referência: `docs/MF_Prompt_<Nome>_Squad.md`.
```

### Exemplo MF (Regra Inviolável #14, criada com o ux-reviewer)

```
14. PR que toca src/**/*.html, src/css/**/*.css ou templates inline
    (src/js/pages/*.js com innerHTML) sem relatório do subagente
    `ux-reviewer` anexado → BLOQUEANTE. DM não abre merge sem o relatório.
    Referência: docs/MF_Prompt_UXReviewer_Squad.md.
```

> **Lição aprendida:** sem amarração formal, o DM "esquece" de invocar o subagente em PRs sob pressão de prazo. A regra inviolável é a salvaguarda.

---

## 🟢 Padrão: como o DM invoca um subagente

No Claude Code, o DM aciona o subagente assim:

```
[DM]: Acionando ux-reviewer no PR #N que toca dashboard.html e cards.css.
      Aguardo relatório.

[ux-reviewer]: [executa checklist] [produz relatório no formato padrão]

[DM]: Relatório recebido. 2 divergências bloqueantes detectadas.
      Aplicando correções antes de abrir merge.
```

O DM nunca "discute" com o subagente — recebe relatório e age.

---

## 🟢 Outros 3 subagentes do MF (referência rápida)

### `test-runner`

- **Aciona:** SEMPRE antes de qualquer PR
- **Faz:** roda `npm test` (Vitest), reporta passing/failing/coverage
- **Bloqueante se:** algum teste falhar
- **Regra Inviolável associada:** todos os PRs (implícita)

### `security-reviewer`

- **Aciona:** PR que toca `auth.js`, `database.js`, `firestore.rules`, ou `innerHTML`
- **Faz:** procura XSS (`innerHTML` sem `escHTML`), vazamento entre grupos (queries sem `grupoId`), Firestore rules permissivas
- **Bloqueante se:** XSS detectado, query sem isolamento de grupo, regra Firestore aberta demais
- **Regra Inviolável associada:** #6 (grupoId), #7 (escHTML), #8 (parcelamentos não deletar)

### `import-pipeline-reviewer`

- **Aciona:** PR que toca `normalizadorTransacoes.js`, `deduplicador.js`, `pipelineCartao.js`, `pipelineBanco.js`, `mesFatura`, `chave_dedup`
- **Faz:** verifica formato de `chave_dedup`, propagação de `mesFatura`, integridade do pipeline de 7 estágios
- **Bloqueante se:** alteração em formato de `chave_dedup`, omissão de `mesFatura` em despesas de cartão
- **Regra Inviolável associada:** #1 (chave_dedup), #2 (mesFatura)

---

## 🟡 Como criar um subagente novo (passo a passo)

1. **Identifique a dor recorrente** — algo que você (PO) ou o DM revisa toda vez manualmente
2. **Liste os critérios objetivos** — pode virar checklist?
3. **Defina o gatilho** — quais arquivos/escopos disparam invocação?
4. **Escreva o prompt** seguindo o template padrão
5. **Crie a Regra Inviolável** correspondente no `CLAUDE.md`
6. **Atualize `AGENTS.md`** com o novo subagente
7. **Salve o prompt em `docs/MF_Prompt_<Nome>_Squad.md`**
8. **Commit como** `docs(squad): adicionar subagente <nome>`
9. **Notifique o DM** na próxima sessão para começar a invocar

---

## 🔵 Exemplo MF — caminho de criação do `ux-reviewer`

Sequência real (sessão PO 2026-04-21):

1. PO observou que dashboard.html tinha 19 emojis em chrome — divergência visual repetida em outras páginas
2. PO formulou os princípios PUX1–PUX6 (Bússola §12.5)
3. PO desenhou prompt do `ux-reviewer` com checklist baseado em PUX
4. PO redigiu Regra Inviolável #14
5. PO gerou patches para BUSSOLA + AGENTS + CLAUDE em `.auto-memory/proposals/`
6. PO criou 7 issues no GitHub (uma por fase do umbrella NRF-UX)
7. DM aplicará tudo no PR da NRF-UX F2 — `ux-reviewer` estreia neste PR

> Tempo total da decisão à entrega: 1 sessão PO (~2h).

---

## ⚠️ Anti-patterns na criação de subagentes

- **Subagente "guarda-tudo"** — um único subagente que "revisa qualidade" sem critérios objetivos. Resultado: relatórios genéricos, ignorados.
- **Subagente sem Regra Inviolável** — DM esquece de invocar; subagente vira artefato morto.
- **Subagente que decide** — ex: "se o teste falhar, eu reverto o commit". Quebra governança. Sempre delegue ao DM.
- **Subagente sem formato fixo de relatório** — saídas inconsistentes; DM não sabe o que esperar.
- **Subagente com checklist longo demais** — > 30 itens vira ritual sem execução. Refine para os 10–15 mais críticos.

---

## 📌 Histórico de subagentes no MF

| Versão squad | Subagentes | Marco |
|---|---|---|
| 1.0 | nenhum | DM fazia tudo |
| 2.0 | test-runner | Após bug de regressão por falta de testes |
| 2.5 | + security-reviewer | Após PR com `innerHTML` cru aprovado por engano (BUG-018) |
| 3.0 | + import-pipeline-reviewer | Após série BUG-021/022/026 (mesFatura) |
| 4.0 | + ux-reviewer | Sessão PO 2026-04-21 (umbrella NRF-UX) |

---

## Referências cruzadas

- **06-regras-invioláveis.md** — todas as 14 regras do MF, incluindo as ligadas a subagentes
- **05-bussola-produto-template.md** — onde inscrever os princípios que o subagente revisará (§12.5 no MF)
- **07-workflow-git-e-powershell.md** — como o DM invoca subagentes na prática
