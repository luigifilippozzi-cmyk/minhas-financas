# Resumo do Projeto & Instruções do PO — Minhas Finanças

> Documento de referência para sessões futuras nesta área de trabalho.
> Atualizado em: 2026-04-17

---

## 1. Visão Geral do Projeto

**Minhas Finanças** é um Progressive Web App (PWA) de gestão financeira familiar, usado por Luigi e Ana (casal). O app permite importar extratos bancários e faturas de cartão, controlar despesas e receitas, gerenciar orçamentos por categoria, acompanhar parcelas e visualizar a saúde financeira via dashboard com gráficos.

**Stack tecnológico:** vanilla JavaScript (sem frameworks), Vite 5 (bundler MPA com 13 páginas HTML), Firebase Auth + Cloud Firestore, Capacitor 8 (iOS), Chart.js v4, SheetJS (XLSX).

**Versão atual:** v3.31.0 (abril 2026) com 665 testes unitários e 26 testes de integração.

**Bússola estratégica:** `docs/BUSSOLA_PRODUTO.md` §9 — Ordem de Ataque Aprovada — é a fonte da verdade para priorização de RFs.

---

## 2. Estado Atual dos Milestones

| Milestone | Progresso | Status |
|-----------|-----------|--------|
| Requisitos Funcionais (backlog anterior) | 42/42 | Concluído |
| Melhorias Visuais (tokens, responsividade, acessibilidade) | 26/26 | Concluído |
| Reconciliação Fatura ↔ Extrato (RF-062/063/064) | 3/3 | Concluído (v3.23.0) |
| Tech Debt — testes (cobertura total utils/) | 5/5 | Concluído (v3.23.4) |
| Manutenibilidade e Arquitetura (unificação import #96) | Completo | Concluído (v3.20.0) |
| iOS App — Fase 0 (Vite + Firebase npm) | 2/2 | Concluído (v3.18.0) |
| iOS App — Fase 1 (Capacitor + safe areas) | 2/2 | Concluído (v3.19.0) |
| UX & Gestão Patrimonial (RF-065/066/067/068/069 + ENHs + NRFs) | 8/13 (62%) | 🟢 Ativo |
| iOS App — Fase 2 (Firebase nativo: auth, FCM, biometria) | 0/4 | ⏸️ ON HOLD (decisão PO 2026-04-16) |
| iOS App — Fase 3 (UX mobile: icons, splash, dark mode) | 0/3 | ⚪ Aguardando Fase 2 |
| iOS App — Fase 4 (TestFlight: assinatura, provisioning) | 0/3 | ⚪ Aguardando Fase 2 |
| iOS App — Fase 5 (Backlog: Face ID, push, camera) | 0/3 | ⚪ Backlog |

---

## 3. Próximas Prioridades (fonte: `docs/BUSSOLA_PRODUTO.md` §9)

1. **NRF-NAV Fase 1** (#154) v3.32.0 — Navbar 5 seções gerenciais (Cockpit / Futuro / Histórico / Transações / Config). **Casado com NRF-UI-WARM** (#172, paleta warm finance) — decisão PO pendente: 1 PR conjunto ou 2 sequenciais.
2. **NRF-NAV Fase 2** (#154) v3.33.0 — Consolidação de páginas (merge Projeções + Planejamento na seção Futuro). Absorve ENH-005.
3. **ENH-004** (#151) — Melhorias UX tela fatura (P3, após estrutura gerencial)
4. **ENH-002** (#152) — Bulk categorização (P3, após estrutura gerencial)
5. **iOS Fase 2** (#77–#80) — ⏸️ ON HOLD indefinido até Apple Developer Program ativado

**QA RF-062 concluído** em 2026-04-17 — issue #129 fechada com 30 PASS / 3 N/A / 0 FAIL em 33 TCs cobertos.

---

## 4. Estrutura do Squad IA

```
Luigi (Product Owner)
  ├── PM Agent          → Relatórios diários, métricas, alertas (somente leitura)
  └── Dev Manager       → Executor de código, orquestrador de subagentes
        ├── test-runner              → Vitest (501 testes) + coverage
        ├── security-reviewer        → Firestore rules, escHTML/XSS, auth
        └── import-pipeline-reviewer → Pipeline de importação (parser, dedup, ajuste)
```

---

## 5. Papel e Responsabilidades do PO (Luigi)

### 5.1 Decisões que cabem ao PO

O PO é o único com autoridade para:

- **Priorizar issues e milestones** — definir a ordem de execução (P0 > P1 > P2)
- **Aprovar mudanças de escopo** — qualquer alteração que expanda ou reduza o que foi planejado
- **Decisões de UX/produto** — layout, fluxos de navegação, nomenclaturas no app
- **Resolver conflitos entre issues** — quando duas issues se contradizem ou competem por recursos
- **Definir critérios de aceite** — o que constitui "done" para cada issue
- **Autorizar deploys manuais** — o CI faz deploy automático após merge, mas deploys manuais requerem aprovação

### 5.2 O que o PO delega

- **PM Agent**: produz relatórios de status, calcula métricas, identifica riscos — nunca modifica código
- **Dev Manager**: implementa features, cria branches, abre PRs, aciona subagentes — escala decisões de produto ao PO

### 5.3 Rituais do PO

| Ritual | Frequência | Ação |
|--------|-----------|------|
| Revisar relatório do PM Agent | Diária | Ler `.auto-memory/project_mf_status.md` e dashboard |
| Priorizar backlog de issues | Semanal | Reordenar issues no GitHub por prioridade |
| Validar PRs do Dev Manager | Por PR | Revisar escopo, testes, aderência ao CLAUDE.md |
| Atualizar CLAUDE.md | Por milestone | Refletir novo estado do projeto |
| Atualizar CHANGELOG.md | Por release | Registrar versão, features e fixes |

### 5.4 Fluxo de trabalho típico do PO

```
1. Abrir sessão → Ler relatório do PM Agent (status, alertas, bloqueios)
2. Decidir prioridade do dia → Selecionar issue(s) para o Dev Manager
3. Fornecer contexto → Descrever o que fazer, critérios de aceite
4. Aguardar implementação → Dev Manager cria branch, implementa, testa, abre PR
5. Revisar PR → Verificar escopo, testes passando, sem regressões
6. Aprovar merge → CI faz deploy automático
7. Fechar issues → Atualizar CHANGELOG.md e versão
```

---

## 6. Regras Invioláveis do Projeto

Estas regras foram aprendidas com bugs reais e devem ser respeitadas em qualquer sessão:

1. **Sempre rodar `npm test` antes de commit** — 501 testes devem passar
2. **Sempre usar `escHTML()`** antes de `innerHTML` com dados do usuário (XSS)
3. **Nunca alterar o formato de `chave_dedup`** — quebra deduplicação histórica
4. **Nunca deletar documentos `parcelamentos`** — só marcar `status: 'quitado'`
5. **Sempre incluir `grupoId`** em queries Firestore — dados vazam entre grupos
6. **Sempre propagar `mesFatura`** em despesas de cartão — quebra tela de fatura
7. **Nunca hardcodar cores no CSS** — usar tokens de `variables.css`
8. **Nunca importar Firebase via CDN** — usar pacotes npm
9. **Sempre usar Conventional Commits** com escopo (feat, fix, refactor, test, docs, chore)
10. **Alterações em `src/js/` ou `src/css/`** devem usar feature branch + PR

---

## 7. Documentação de Referência

| Arquivo | O que contém |
|---------|-------------|
| `CLAUDE.md` | Guia mestre: arquitetura, convenções, regras, estado atual |
| `AGENTS.md` | Governança do squad IA, subagentes, protocolos |
| `CHANGELOG.md` | Histórico completo de versões (v1.0.0 → v3.23.4) |
| `docs/REQUISITOS_FUNCIONAIS.md` | 42 requisitos funcionais com status |
| `docs/ARQUITETURA_TECNICA.md` | Schema Firestore, índices, fluxo de dados |
| `docs/DESIGN_SYSTEM.md` | Paleta, tipografia, espaçamento, tokens CSS |
| `docs/BUGS.md` | 27+ bugs históricos com root cause e fix |
| `docs/MILESTONE_iOS_App.md` | Roadmap iOS: 5 fases com estimativas |
| `docs/GUIA_DE_TESTES.md` | Como escrever e organizar testes |
| `docs/GUIA_VERSIONAMENTO.md` | Conventional Commits + SemVer |
| `docs/MF_Prompts_Squad_IA.md` | 10 prompts operacionais para agentes |
| `docs/MF_Prompt_PMAgent_Squad.md` | Prompt autônomo do PM Agent |
| `docs/MF_Prompt_DevManager_Squad.md` | Prompt autônomo do Dev Manager |
| `docs/MF_Templates_Sessao_Agentes.md` | 6 templates copy-paste para sessões |
| `.auto-memory/project_mf_status.md` | Estado persistente entre sessões |

---

## 8. Contexto Histórico

O projeto começou como desenvolvimento solo por Luigi até abril de 2026, quando migrou para uma estrutura de squad IA com agentes especializados. A motivação foi ganhar qualidade (subagentes detectam regressões), visibilidade (relatórios diários), consistência (protocolos estruturados) e memória entre sessões.

O pipeline de importação é o módulo mais complexo e sensível, com 27 bugs documentados ao longo da história. Por isso, tem um subagente dedicado (import-pipeline-reviewer) e regras rígidas sobre `chave_dedup` e `mesFatura`.

A transição para iOS via Capacitor foi escolhida por reaproveitar ~90% do código web existente, manter JavaScript como linguagem única e viabilizar publicação na App Store em 3–4 semanas estimadas até TestFlight.

---

## 9. Instruções para Sessões Futuras

Ao iniciar qualquer sessão nesta área de trabalho:

1. **Ler este documento** para contexto rápido do projeto e prioridades
2. **Consultar `CLAUDE.md`** para regras técnicas detalhadas e padrões de código
3. **Verificar `.auto-memory/project_mf_status.md`** para o estado mais recente
4. **Rodar `npm test`** para confirmar que a suite está verde antes de qualquer alteração
5. **Seguir o workflow git** definido no CLAUDE.md (feature branch para código, direto na main para docs)
6. **Respeitar as 10 regras invioláveis** listadas na seção 6 acima
7. **Acionar subagentes** conforme os triggers definidos no AGENTS.md
