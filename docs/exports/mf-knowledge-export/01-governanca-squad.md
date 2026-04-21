# 01 — Governança e Modelo de Squad

> Como organizar o trabalho entre humano-PO e agentes Claude para evitar acoplamento, manter rastreabilidade e tomar decisões de produto sem que o PO precise escrever código.

---

## 🟢 Princípio fundamental

**Separação estrita de papéis entre quem decide produto e quem executa código.**

O humano-PO toma decisões. Agentes especializados orientam, executam e revisam. Nenhum agente toma decisão de produto sem aprovação explícita do humano. Nenhum subagente atua sem comando do Dev Manager.

A motivação é dupla: (1) evita que decisões de negócio sejam capturadas por preferências técnicas dos agentes; (2) cria pontos de governança claros — qualquer mudança passa por uma aprovação humana antes de chegar ao código.

---

## 🟢 Os 3 papéis principais

```
HUMANO-PO  (Luigi)
    │
    │ orienta produto
    ▼
PO ASSISTANT  (este agente — Cowork)
    │ ┌───────────────────────────────┐
    │ │ pergunta clarificação         │
    │ │ rascunha decisão              │
    │ │ gera artefatos PM/DM          │
    │ │ atualiza memória persistente  │
    │ └───────────────────────────────┘
    │
    │ entrega artefatos
    ▼
┌────────────────┐         ┌────────────────────┐
│   PM AGENT     │         │   DEV MANAGER      │
│   (read-only)  │         │   (executa código) │
│                │         │                    │
│ - relatórios   │         │ - branches         │
│ - métricas     │         │ - commits          │
│ - dashboard    │         │ - PRs              │
│ - alertas      │         │ - subagentes       │
└────────────────┘         └────────────────────┘
                                    │
                                    │ orquestra
                                    ▼
                       ┌─────────────────────────┐
                       │   SUBAGENTES            │
                       │  (sem autonomia)        │
                       │                         │
                       │ - test-runner           │
                       │ - security-reviewer     │
                       │ - import-pipeline-rev   │
                       │ - ux-reviewer (novo)    │
                       └─────────────────────────┘
```

### PO Assistant (Cowork)

**Onde roda:** Cowork mode (interface do Claude desktop)
**Quem aciona:** humano-PO, sob demanda
**Pode:** ler código, propor decisões, escrever em `.auto-memory/`, criar issues no GitHub via `gh`, gerar artefatos para PM/DM
**Não pode:** escrever código de produção, criar branches, fazer commits, alterar `CLAUDE.md`, `AGENTS.md`, `BUSSOLA_PRODUTO.md` — apenas sugere texto

### PM Agent

**Onde roda:** sessão diária autônoma (ou sob demanda)
**Quem aciona:** scheduler ou humano-PO
**Pode:** ler todo o repo, gerar relatórios, atualizar dashboard `docs/mf-squad-dashboard.html`, alertar saúde do projeto
**Não pode:** alterar código, criar/fechar issues, mexer em branches

### Dev Manager (DM)

**Onde roda:** Claude Code (terminal)
**Quem aciona:** humano-PO ou consume tarefas registradas em `.auto-memory/dm_tasks_pending.md`
**Pode:** tudo que envolve código — branches, commits, PRs, invocação de subagentes, deploy
**Deve:** sempre invocar `test-runner` antes de PR; invocar outros subagentes conforme escopo

### Subagentes

**Onde rodam:** dentro de uma sessão do DM
**Quem aciona:** apenas o DM
**Pode:** revisar diff/código, rodar testes, produzir relatório
**Não pode:** decidir, aprovar, escrever código sem comando do DM

---

## 🟢 Fluxo de uma feature de ponta a ponta

```
1. Humano descreve uma necessidade no Cowork
        ↓
2. PO Assistant faz mini-discovery (≤3 perguntas) e estrutura RF/ENH/BUG
        ↓
3. Humano aprova o conteúdo
        ↓
4. PO Assistant gera 2 artefatos:
   - Artefato 1 (PM Agent): registrar no backlog
   - Artefato 2 (Dev Manager): tarefa de execução
        ↓
5. PO cria issue no GitHub via `gh` com body estruturado
        ↓
6. Artefatos vão para `.auto-memory/pm_tasks_pending.md` e `dm_tasks_pending.md`
        ↓
7. Humano abre Claude Code → Dev Manager lê dm_tasks_pending → executa
        ↓
8. DM aciona subagentes (test-runner sempre; outros conforme escopo)
        ↓
9. DM abre PR; humano revisa e mergeia
        ↓
10. Humano abre Cowork → PO Assistant atualiza memória + fecha issue
```

> **Tempo médio observado no MF:** uma feature pequena (1 fase) leva 1–2 sessões PO + 1–2 sessões DM, com janela de 1–3 dias do início à conclusão.

---

## 🟢 Memória persistente como ponte entre sessões

Cowork e Claude Code são **sessões isoladas**. A memória persistente é o que permite continuidade.

### Estrutura mínima recomendada

```
.auto-memory/
├── project_<projeto>_status.md   ← estado do projeto (atualizado a cada sessão PO ou DM)
├── pm_tasks_pending.md           ← tarefas registradas pelo PO para o PM Agent processar
├── dm_tasks_pending.md           ← tarefas registradas pelo PO para o Dev Manager executar
└── proposals/                    ← rascunhos de patches, prompts, deltas (escritos pelo PO, aplicados pelo DM)
    ├── <feature>-patch.md
    └── deltas/
```

### Padrão de entrada em arquivo de status

```markdown
## Sessão YYYY-MM-DD — [Agente]

### Estado na sessão
- Versão: vX.Y.Z
- Milestone ativo: ...
- Saúde: 🟢/🟡/🔴

### Decisões tomadas
1. ...

### Issues criadas
- #N — título

### Próxima sessão — foco sugerido
- ...
```

> **Lição aprendida:** entradas em ordem cronológica + `---` como separador é o que melhor preserva legibilidade ao longo de meses.

---

## 🟡 Cowork vs Claude Code — quando usar cada um

| Tarefa | Onde |
|---|---|
| Decidir produto, priorizar, criar issue, revisar PR | Cowork (PO Assistant) |
| Escrever código, abrir branch, commit, PR | Claude Code (Dev Manager) |
| Relatório diário, dashboard, métricas | Claude Code ou agendado (PM Agent) |
| Conversa rápida, dúvida, brainstorm | Cowork |

> **Anti-pattern observado:** rodar PO e DM no mesmo repo simultaneamente causa colisões de WIP. Solução adotada no MF: 1 agente ativo por vez, ou usar `git worktree` para isolar sessões paralelas.

---

## 🟢 Princípios de design da governança

### P1 — Aprovação explícita antes de execução

PO Assistant sempre apresenta proposta + pede aprovação antes de:
- Criar issue no GitHub
- Escrever em `.auto-memory/`
- Atualizar memória persistente
- Modificar artefatos de squad

### P2 — Subagentes nunca decidem

Subagentes recomendam — DM decide. DM sugere — humano-PO decide produto.

### P3 — Rastreabilidade > velocidade

Toda decisão fica em texto, em arquivo, com data. "Eu lembro de ter aprovado" não é rastreabilidade.

### P4 — Reversibilidade

Branches feature, PRs, deltas em arquivos separados, memória versionada — tudo desfazível com `git revert` ou edição de arquivo.

### P5 — Protocolo de abertura de sessão

Toda sessão PO começa com a mesma sequência:
1. Ler `.auto-memory/project_*_status.md`
2. Ler bússola (seção de prioridades)
3. Diagnóstico rápido (versão, testes, PRs abertos, issues abertas)
4. Apresentar resumo em ≤10 linhas antes de qualquer outra coisa

> Padronizar abertura **economiza muito tempo** em sessões longas — o humano-PO sabe exatamente o que vai ver primeiro.

---

## 🔵 Exemplo MF — Configuração atual do squad

- **PO Assistant:** prompt em projeto Cowork "Minhas Finanças PO AGENT 2"
- **PM Agent:** prompt em `docs/MF_Prompt_PMAgent_Squad.md`
- **Dev Manager:** prompt em `docs/MF_Prompt_DevManager_Squad.md`
- **4 subagentes:** prompts em `.claude/agents/` (no repo Claude Code)
- **Memória:** `.auto-memory/` no repo do projeto

---

## 🟡 Adaptação para o SSE

1. Decida quem é o humano-PO (provavelmente Luigi também)
2. Crie 3 prompts de agente: PO Assistant, PM Agent, Dev Manager — espelhando MF
3. Adapte o nome do projeto, milestones, prioridades
4. Crie a estrutura `.auto-memory/` no repo SSE
5. Comece com 1 ou 2 subagentes (test-runner é o mínimo)
6. Adicione subagentes conforme dores aparecerem (ver arquivo 02 para o padrão)

---

## ⚠️ Anti-patterns observados no MF

- **PO escrevendo código direto** — quando isso aconteceu (sessões iniciais), perdemos rastreabilidade e o squad ficou confuso. Hoje: PO nunca toca código.
- **Agentes "auto-promovendo" decisões** — um subagente sugerindo "vou aplicar esta mudança" sem voltar ao DM. Solução: prompt explícito "você apenas recomenda, nunca aplica".
- **Memória persistente como "log de tudo"** — vira ilegível. Solução: cada sessão entra como bloco datado e separado por `---`.
- **Abrir múltiplas sessões DM simultâneas** — branches viram bagunça. Solução: 1 agente ativo por vez.

---

## 📌 Histórico no MF — evolução da governança

- **Início:** 1 agente faz tudo (PO + DM no Claude Code). Resultado: confusão de papéis.
- **Marco 1:** separação Cowork (PO) + Claude Code (DM). Imediatamente melhorou.
- **Marco 2:** PM Agent introduzido para relatórios e métricas. Liberou PO de housekeeping.
- **Marco 3:** Subagentes especializados (test-runner, security-reviewer, import-pipeline-reviewer). DM ganhou velocidade sem perder rigor.
- **Marco 4 (2026-04-21):** ux-reviewer adicionado. Modelo squad-de-3 com 4 subagentes consolidado.

---

## Referências cruzadas

- **02-subagente-ux-reviewer.md** — exemplo detalhado de criação de subagente
- **06-regras-invioláveis.md** — Regras Invioláveis funcionam como contrato entre PO e DM
- **08-licoes-aprendidas-feedback-memory.md** — passo-a-passo assistido (relevante a sessões PO)
