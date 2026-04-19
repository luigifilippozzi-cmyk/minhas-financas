# AGENTS.md — Guia para Agentes Claude Code

> Leitura obrigatória ao abrir uma sessão neste repositório.
> Mantenha este arquivo curto. Detalhes arquiteturais ficam em `CLAUDE.md`.

---

## ⚠️ Guard rail — tasks de UI

Para qualquer task que toque UI, componente, tela, estilo ou arquivo em `src/css/`, `src/js/pages/`, `src/js/controllers/`:
a leitura de `design-system/tokens.md` é **obrigatória** ANTES de escrever código. Sem isso, a entrega é inválida.

---

## 1. Estrutura de Governança do Squad

```
Luigi (Product Owner)
  ├── PM Agent          → Relatório diário, métricas, alertas (read-only)
  └── Dev Manager       → Executor de código, orquestrador de subagentes
        ├── test-runner              → Vitest (665 testes) + coverage
        ├── security-reviewer        → Firestore rules, escHTML/XSS, auth
        └── import-pipeline-reviewer → Pipeline de importação (parser, dedup, ajuste)
```

### Modelo de Reporte
| Agente | Reporta a | Frequência | Canal |
|--------|-----------|------------|-------|
| PM Agent | PO (Luigi) | Diário | Chat output + `.auto-memory/` |
| Dev Manager | PO (Luigi) | Por sessão | PR + chat output + `.auto-memory/` |
| Subagentes | Dev Manager | Por tarefa | Output no chat (consumido pelo DM) |

### Autonomia e Escalação
- **Dev Manager** tem autonomia para: criar branches, implementar, commitar, abrir PRs, acionar subagentes
- **PM Agent** é read-only: analisa, reporta, sugere — nunca modifica código
- **Escalar ao PO**: mudanças de escopo, priorização de milestones, decisões de UX, conflitos entre issues

---

## 2. Protocolo de Abertura (executar SEMPRE no início da sessão)

```bash
# 1. Sincronizar com main
git fetch origin
git pull origin main
git log --oneline -10               # últimos commits

# 2. Ler contexto do projeto
#    - CLAUDE.md                    → arquitetura, convenções, stack
#    - AGENTS.md                    → este arquivo
#    - .auto-memory/project_mf_status.md → status e prioridades (se existir)
#    - docs/                        → prompts e relatórios ativos

# 3. Identificar tarefa
#    Pergunte ao Luigi qual issue/tarefa, OU consulte a memória persistente
```

---

## 3. Fontes de Instrução (ordem de prioridade)

| # | Arquivo | Quando usar |
|---|---------|-------------|
| 1 | `CLAUDE.md` | Arquitetura, stack, convenções, anti-patterns, padrões críticos |
| 2 | `.auto-memory/project_mf_status.md` | Status atual, prioridades, issues abertas |
| 3 | `design-system/tokens.md` | Tokens visuais, paleta, tipografia — obrigatório antes de qualquer task de UI |
| 4 | `docs/PROMPT_CLAUDE_CODE_*.md` | Plano de execução do dia (se existir) |
| 5 | `docs/REQUISITOS_FUNCIONAIS.md` | Especificações detalhadas de cada RF |
| 6 | `docs/ARQUITETURA_TECNICA.md` | Firestore schema, índices, fluxo de dados |
| 7 | Mensagem do Luigi | Supraordena os acima em caso de conflito |

---

## 4. Regras Inegociáveis (resumo do CLAUDE.md)

1. **Sempre** rodar `npm test` antes de commit — 665+ testes devem passar
2. **Sempre** usar `escHTML()` antes de `innerHTML` com dados do usuário — XSS
3. **Nunca** alterar formato da `chave_dedup` — quebra deduplicação histórica
4. **Nunca** deletar documentos `parcelamentos` — só `status: 'quitado'`
5. **Sempre** incluir `grupoId` em queries Firestore — dados vazam entre grupos
6. **Sempre** propagar `mesFatura` em despesas de cartão — quebra tela de fatura
7. **Nunca** hardcodar cores no CSS — usar variáveis de `variables.css`
8. **Nunca** importar Firebase via CDN — usar pacotes npm
9. **Sempre** usar Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
10. **Nunca** usar `deleteDoc` em lote sem batch — viola regras Firestore

---

## 5. Fluxo de Trabalho (Git Workflow Híbrido)

### Features e Bug Fixes → Feature Branch + PR
```
1. git pull origin main
2. git checkout -b feat/MF-{issue}-{descricao-kebab}   # ou fix/MF-{issue}-...
3. Implementar (seguir padrões do CLAUDE.md)
4. Escrever/atualizar testes
5. npm test                                              # OBRIGATÓRIO
6. git commit -m "feat(escopo): descrição (vX.Y.Z)"     # Conventional Commits
7. git push -u origin feat/MF-{issue}-{descricao}
8. gh pr create com descrição detalhada
9. Aguardar CI verde → merge → delete branch
```

### Docs, Chore, Style → Commit direto na main
```
1. git pull origin main
2. Fazer alteração
3. git commit -m "docs: atualizar CHANGELOG"
4. git push origin main
```

> **Regra**: Qualquer alteração em `src/js/` ou `src/css/` DEVE usar feature branch.
> Alterações em `docs/`, `CHANGELOG.md`, `README.md`, `.auto-memory/` podem ir direto na main.

---

## 6. Subagentes — Quando Acionar

| Subagente | Trigger (acionar SE...) | Foco |
|-----------|------------------------|------|
| **test-runner** | SEMPRE antes de criar PR | `npm test`, coverage, testes faltantes |
| **security-reviewer** | Tocou em: `auth.js`, `database.js`, `firestore.rules`, `innerHTML`, formatters | Firestore rules (grupoId), escHTML, XSS, auth patterns |
| **import-pipeline-reviewer** | Tocou em: normalizador, deduplicador, ajusteDetector, pdfParser, bankFingerprintMap, pipelineBanco/Cartao | chave_dedup, mesFatura, parsers CSV/XLSX/PDF, dedup fuzzy |

### Protocolo pós-subagente
1. Ler report do subagente
2. **Critical/High**: corrigir ANTES de prosseguir
3. **Medium**: corrigir se rápido, senão registrar como P1
4. **Low**: registrar para próxima sessão

---

## 7. Coordenação entre Sessões

- **PM roda primeiro** → atualiza `.auto-memory/project_mf_status.md`
- **Dev Manager lê memória** → usa como fonte de prioridades
- **Nunca** sobrescrever trabalho de outra sessão sem verificar
- `git pull origin main` antes de QUALQUER trabalho

---

## 8. Checklist Final de PR

- [ ] Branch criada a partir de `main` atualizada
- [ ] Commits em formato Conventional Commits
- [ ] `npm test` passando (665+ testes)
- [ ] Sem credenciais Firebase no diff
- [ ] Se novo módulo: testes criados
- [ ] Se alterou pipeline de importação: testar com dados reais de cada banco
- [ ] Se alterou CSS: verificar variáveis de `variables.css` (sem hex literal fora dali)
- [ ] `CHANGELOG.md` atualizado (se feature ou fix)
- [ ] Descrição do PR explica "o quê" + "por quê" + como testar
- [ ] **Se task de UI:** `design-system/tokens.md` lido antes de escrever código
- [ ] **Se task de UI:** três estados implementados (conteúdo, vazio, loading)
- [ ] **Se task de UI:** testado em viewport 375px e 414px
- [ ] **Se task de UI:** `escHTML()` em todo `innerHTML` com dados do usuário

---

## Design & Frontend

### 1. Ordem de leitura antes de qualquer task de UI (não pule)

1. `design-system/tokens.md` — design system do MF (paleta, tipografia, componentes canônicos).
2. `.auto-memory/design-decisions.md` — decisões visuais já tomadas que ainda não foram para tokens.
3. `.auto-memory/questions-to-po.md` — perguntas abertas com respostas do PO.

Se `tokens.md` não for lido, a entrega é inválida. O Dev Manager deve rejeitar o PR.

### 2. Regras duras (hard constraints)

**O agente NÃO PODE:**
- Usar valores hex, rgb, hsl, px ou rem que não estejam em `tokens.md` / `variables.css`. Se precisar de valor novo, abrir ADR em `.auto-memory/design-decisions.md` e escalar ao PO.
- Instalar bibliotecas de UI pesadas (MUI, Ant Design, Chakra) — o MF é vanilla JS + CSS puro intencionalmente.
- Usar emojis como ícones de interface.
- Introduzir fontes novas sem atualizar `tokens.md` e `variables.css`.
- Usar gradientes roxos, glassmorphism, neumorfismo, sombras pesadas ou animações bouncy.
- Colocar valor monetário sem `formatarMoeda()` de `utils/formatters.js` e sem `font-variant-numeric: tabular-nums`.

**O agente DEVE:**
- Consumir variáveis CSS (`var(--color-*)`, `var(--font-*)`, etc.) em vez de valores literais.
- Desenhar os três estados de toda tela com dados: **conteúdo, vazio, carregando**. Erro também quando aplicável.
- Testar layout em 375px e 414px (PWA + iOS/Capacitor — mobile-first não é opcional).
- Respeitar `prefers-reduced-motion: reduce`.

### 3. Quando o agente está em dúvida (regra do silêncio)

Se faltar informação visual ou semântica, o agente **não inventa**. Registra em `.auto-memory/questions-to-po.md`:

```
### [TASK-ID] [Área]
**Pergunta:** ...
**Opções que considerei:** A) ... B) ...
**Recomendação:** ...
**Bloqueia entrega?** Sim/Não
```

O PO (Luigi) responde em lote. Melhor pausar do que produzir UI genérica.

### 4. Referência rápida do "sabor" do MF

- **É:** relatório privado de wealth management num sábado de manhã; tipografia serifada Fraunces com peso editorial; ivory quente `#FAF9F5`; números com tabular-nums; respiração generosa; verde-musgo e vermelho-terroso dessaturados.
- **Não é:** app de banco digital colorido, fintech com gradiente roxo, dashboard corporativo denso, tracker de gastos com gamificação.

Em caso de conflito entre "bonito" e "calmo", sempre escolha calmo.

---

## 9. Quando Escalar ao PO (Luigi)

- Dúvida sobre regra de negócio financeira (consultar `REQUISITOS_FUNCIONAIS.md` primeiro)
- Conflito de prioridade entre issues
- Trade-off que impacta UX (ex: mudar layout do dashboard)
- Decisão sobre novo banco/emissor no `bankFingerprintMap`
- Necessidade de alterar escopo de milestone

---

## 10. Histórico do Time Técnico

### Antes (até Abril 2026)
Luigi como solo developer — commits diretos em `main`, sem agentes, sem memória persistente.

### Transição (Abril 2026)
Migração para modelo de squad com agentes Claude Code, inspirado na estrutura do projeto SSE (Storm Shield Enterprise). Motivação:
- **Qualidade**: subagentes especializados detectam regressões antes do merge
- **Visibilidade**: PM Agent produz relatórios diários padronizados
- **Consistência**: Dev Manager segue protocolo estruturado, não pula etapas
- **Memória**: `.auto-memory/` preserva contexto entre sessões

### Riscos Mitigados pela Nova Estrutura
- Pipeline de importação é o módulo mais complexo e propenso a bugs (27 bugs históricos em `BUGS.md`)
- Subagente `import-pipeline-reviewer` específico para esse domínio
- Testes obrigatórios antes de PR previnem regressões no deduplicador e normalizador
