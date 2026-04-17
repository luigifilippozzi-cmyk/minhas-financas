# CLAUDE.md — Minhas Finanças

> Guia para o agente Claude Code. Leia este arquivo antes de qualquer tarefa.

## Identidade do Projeto

**Minhas Finanças** é um Progressive Web App de gestão financeira familiar, construído com **vanilla JavaScript + Firebase** (sem frameworks).

- **Usuários:** Luigi + Ana (casal)
- **Dev:** Luigi (solo developer)
- **Versão atual:** v3.23.8
- **Repo:** https://github.com/luigifilippozzi-cmyk/minhas-financas
- **Stack:** HTML5 · CSS3 · JS ES6+ · **Vite 5** (bundler MPA) · **Capacitor 8** (iOS) · Firebase Auth · Cloud Firestore (via npm) · Chart.js v4 · SheetJS (XLSX)

---

## Comandos Essenciais

```bash
npm run dev                 # Vite dev server (HMR, hot reload)
npm run build               # Vite build → dist/ (produção)
npm run preview             # Preview do build de produção
npm test                    # Vitest — roda suite de 509 testes unitários
npm run test:watch          # Vitest em modo watch
npm run test:coverage       # Coverage com V8
npm run test:integration    # Testes de integração (requer Firebase Emulator)
npm run test:all            # Unitários + integração
npm start                   # firebase serve (dev local, serve src/ sem build)
npm run emulate             # Firebase emulators (Auth + Firestore locais)
npm run deploy              # Build + firebase deploy --only hosting
```

**Sempre rodar `npm test` antes de commit.** Os testes cobrem parsers, deduplicador, ajusteDetector, normalizador e reconciliadorFatura.

---

## Fluxo de Dados

```
UI Event
  └── src/js/pages/[pagina].js       ← orquestração e DOM
        └── src/js/controllers/      ← lógica de negócio + chave_dedup
              └── src/js/services/database.js  ← Firestore CRUD
                    └── onSnapshot   ← re-renderiza em tempo real
```

**Módulos de importação (pipeline separado):**
```
Upload arquivo
  └── detectorOrigemArquivo.js   ← tipo (banco/cartão) + emissor
        └── normalizadorTransacoes.js   ← parse CSV/XLSX/PDF
              └── deduplicador.js       ← marcar linhas duplicadas
                    └── ajusteDetector.js   ← reconciliar parcelas marketplace
                          └── pipelineBanco.js / pipelineCartao.js   ← roteamento
```

---

## Estrutura de Arquivos (src/)

```
src/
├── [pagina].html              ← 1 HTML por página; sem SPA router
├── css/
│   ├── variables.css          ← sistema de design (tokens CSS)
│   ├── components.css         ← navbar, botões, modais, inputs
│   ├── main.css               ← layouts principais
│   ├── dashboard.css          ← cards KPI, gráficos
│   └── planejamento.css       ← planejamento mensal
└── js/
    ├── app.js                 ← boot: auth + seed de categorias/contas
    ├── config/firebase.js     ← inicialização Firebase
    ├── services/
    │   ├── database.js        ← TODAS as operações Firestore (ponto central)
    │   ├── auth.js            ← onAuthChange, logout
    │   └── grupos.js          ← criar/entrar em grupo, convite
    ├── models/                ← factories (criarDespesa, criarCategoria, etc.)
    ├── controllers/           ← lógica por entidade (despesas, categorias, etc.)
    ├── pages/                 ← orquestradores por página (DOM + listeners)
    └── utils/
        ├── formatters.js      ← formatarMoeda, formatarData, escHTML (XSS)
        ├── helpers.js         ← dataHoje, normalizarStr, Levenshtein
        ├── normalizadorTransacoes.js  ← parser CSV/XLSX
        ├── deduplicador.js    ← matching exato + fuzzy
        ├── ajusteDetector.js  ← ajustes parciais marketplace
        ├── pdfParser.js       ← PDF.js
        ├── bankFingerprintMap.js  ← 15 bancos/emissores
        └── categorizer.js     ← auto-categorização por origem
```

---

## Firestore — Estrutura de Dados

Coleções principais: `usuarios`, `grupos`, `categorias`, `despesas`, `receitas`, `orcamentos`, `contas`, `parcelamentos`, `planejamento_items`

### Campos críticos em `despesas` e `receitas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `grupoId` | string | **Obrigatório.** Todas as queries usam este campo |
| `chave_dedup` | string\|null | Chave de deduplicação — nunca alterar o formato |
| `mesFatura` | string\|null | Ciclo de faturamento `"YYYY-MM"` — crítico para fatura do cartão |
| `tipo` | string | `"despesa"` \| `"projecao"` \| `"projecao_paga"` \| `"transferencia_interna"` \| `"pagamento_fatura"` |
| `isConjunta` | boolean | Despesa 50/50 — usa `valorAlocado` por pessoa |
| `parcelamento_id` | string\|null | Ref para `parcelamentos/{id}` |
| `origemBanco` | string\|null | Banco detectado automaticamente |

### Chave de deduplicação (não alterar o formato)
```js
// Import
chave_dedup = `${data_YYYY-MM-DD}||${descricao.toLowerCase().trim().slice(0,50)}||${valor.toFixed(2)}||${portador.toLowerCase().slice(0,30)}||${parcela}`

// Manual
chave_dedup = `manual||${data}||${descricao}||${valor}`
```

### Regras de segurança
- Leitura/escrita de dados de grupo exige `isMemberOfGroup(grupoId)`
- `parcelamentos`: **nunca deletar** — só alterar `status: 'quitado'`
- Validação mínima: `valor > 0 && grupoId is string`
- Ao criar despesas/receitas via código, sempre incluir `grupoId`

---

## Contas Padrão (seed automático)

`garantirContasPadrao()` em `app.js` faz upsert das 10 contas ao iniciar (cartão genérico removido em v3.21.0). Ao testar, mockar esta função ou usar emuladores. **Nunca deletar contas** — só `ativa: false`.

---

## Convenções de Código

### Commits (Conventional Commits)
```
feat(escopo): descrição curta (vX.Y.Z)   ← nova funcionalidade
fix(escopo): descrição curta             ← correção de bug
docs: descrição                          ← documentação
refactor(escopo): descrição              ← sem mudança de comportamento
test(escopo): descrição                  ← testes
chore: descrição                         ← manutenção
style(css): descrição                    ← apenas CSS/formatação
```

**Escopos frequentes:** `auth`, `dashboard`, `despesas`, `receitas`, `categorias`, `orcamentos`, `importar`, `base-dados`, `fatura`, `planejamento`, `pipelineCartao`, `pipelineBanco`, `database`, `hosting`, `ios`

### Versionamento (SemVer)
- `PATCH` → bug fix
- `MINOR` → nova funcionalidade
- `MAJOR` → breaking change

### Padrão de nomeação (JS)
- Funções: `camelCase` em português — ex: `salvarDespesa`, `buscarCategorias`
- Constantes: `UPPER_SNAKE_CASE` — ex: `CATEGORIAS_PADRAO`, `CONTAS_PADRAO`
- Eventos Firestore: prefixo `ouvir` — ex: `ouvirDespesas`, `ouvirReceitas`
- IDs de elemento HTML: prefixo por tipo — ex: `btn-salvar`, `modal-despesa`, `chip-total`

### Segurança obrigatória
- **Sempre** usar `escHTML()` antes de inserir strings do usuário via `innerHTML`
- Nunca usar `eval()` ou `innerHTML` direto com dados do Firestore
- Sanitização está em `utils/formatters.js`

---

## Padrões Críticos (aprendidos na prática)

### mesFatura (BUG-021/022/026)
`mesFatura` é o ciclo de faturamento `"YYYY-MM"` da **fatura do cartão**, distinto do campo `data` da transação. Ao criar despesas de cartão via import, **sempre propagar `mesFatura`** para todas as linhas do mesmo lote. Queries de fatura usam `mesFatura`, não `data`.

### Projeções de parcelas
- `tipo: 'projecao'` = despesa futura projetada (ainda não importada)
- `tipo: 'projecao_paga'` = projeção que foi reconciliada com import real
- `despesaRealId` aponta para a despesa importada correspondente
- `parcelamento_id` aponta para o documento `parcelamentos/{id}`

### Deduplicação em imports
Ao importar, sempre chamar `buscarChavesDedup(grupoId)` antes de escrever. O retorno é um `Map<chave_dedup, docId>` — use o `docId` para atualizar `mesFatura` em duplicatas de cartão em vez de pular.

### onSnapshot e tempo real
Pages usam `onSnapshot` para sincronização em tempo real. Ao adicionar novas queries, usar o padrão: guardar o `unsubscribe` retornado e chamar no cleanup para evitar leaks de memória.

### CSS: sistema de design
Todas as cores, sombras e fontes estão em `variables.css` como CSS custom properties (`--color-primary`, `--shadow-md`, etc.). Nunca hardcodar valores de cor em componentes.

---

## Testes

- Framework: **Vitest** com `@vitest/coverage-v8`
- Localização: `tests/` (espelho de `src/js/utils/` e `src/js/services/`)
- **611 testes unitários** cobrindo: parsers, dedup, ajusteDetector, normalizador, pipelineCartao, importarDedup, detectorTransferenciaInterna, reconciliadorFatura, bankFingerprintMap, detectorOrigemArquivo, recurringDetector, pdfParser, skeletons, forecastEngine, saldoRealPorConta, burnRateCalculator
- **26 testes de integração** (Firebase Emulator): regras Firestore, CRUD despesas, purge em lote
- **Rodar antes de qualquer commit:** `npm test`
- Testes de integração: `npm run test:integration` (requer emulador na porta 8080)
- Mocks de Firestore em `tests/` — não dependem de emulador

---

## Estado Atual do Projeto (2026-04-16) — v3.30.0

### Milestones
| Milestone | Progresso | Status |
|-----------|-----------|--------|
| Requisitos Funcionais (backlog anterior) | 42/42 (100%) | ✅ Concluído |
| Reconciliação Fatura ↔ Extrato (RF-062/063/064) | 3/3 (100%) | ✅ Concluído |
| Melhorias Visuais | 26/26 (100%) | ✅ Concluído |
| Manutenibilidade e Arquitetura | Completo | ✅ Concluído (v3.20.0) |
| iOS App Fase 0 (Vite + Firebase npm) | 2/2 (100%) | ✅ Concluído |
| iOS App Fase 1 (Capacitor + safe areas) | 2/2 (100%) | ✅ Concluído |
| iOS App Fase 2 (Firebase nativo) | 0/4 issues | ⏸️ ON HOLD (decisão PO 2026-04-16) |
| iOS App Fases 3–5 (UX mobile + TestFlight + Push) | 0/9 issues | ⚪ Aguardando Fase 2 |
| UX & Gestão Patrimonial | 7/13 (54%) | 🟢 Ativo — RF-065/067/068/069 entregues |
| Tech Debt | 2/2 (100%) — testes | ✅ Concluído |

### Estrutura de Desenvolvimento (Squad IA)
```
Luigi (Product Owner)
  ├── PM Agent          → Relatório diário, métricas, alertas (read-only)
  └── Dev Manager       → Executor de código, orquestrador de subagentes
        ├── test-runner              → Vitest (611 testes) + coverage
        ├── security-reviewer        → Firestore rules, escHTML/XSS, auth
        └── import-pipeline-reviewer → Pipeline de importação (parser, dedup, ajuste)
```
Detalhes completos em `AGENTS.md`. Bússola estratégica em `docs/BUSSOLA_PRODUTO.md`. Memória persistente em `.auto-memory/project_mf_status.md`.

### Próximas prioridades (fonte: `docs/BUSSOLA_PRODUTO.md` §9 — Ordem de Ataque Aprovada)
1. ~~**RF-067** — Forecast 6 meses — v3.28.0~~ ✅ Concluído (PR #168)
2. ~~**RF-068** — Saldo Real por Conta — v3.29.0~~ ✅ Concluído (PR #174)
3. ~~**RF-069** — Burn Rate por Categoria — v3.30.0~~ ✅ Concluído (commit `0ee3e18`; ordem invertida com RF-066 por decisão do PO em 2026-04-16 — ver §11 da bússola)
4. **RF-066** — Patrimônio Ativos/Passivos expandido — issue `#155` — v3.31.0 (P2) ← próximo
5. **NRF-NAV Fase 1** — Navbar 5 seções — issue `#154` — v3.32.0 (P2) — casada com NRF-UI-WARM (#172)
6. **NRF-NAV Fase 2** — Consolidação de páginas — v3.33.0 (P2) — absorve ENH-005
7. **iOS App Fase 2** — Firebase nativo — issues #77–#80 — **ON HOLD** até Apple Developer Program ativado

**QA pendente:** issue #129 — execução manual RF-062 (Bloco 1 PASS 13/14; Blocos 2–3 pendentes).

### Documentação de referência
| Arquivo | Conteúdo |
|---------|----------|
| `docs/ARQUITETURA_TECNICA.md` | Firestore schema completo, índices, fluxo de dados |
| `docs/DESIGN_SYSTEM.md` | Paleta, tipografia, espaçamento, componentes, acessibilidade |
| `docs/REQUISITOS_FUNCIONAIS.md` | 42 RF + NRF implementados + RF-062/063/064 concluídos (cadeia Luigi → Ana → Cartão) |
| `docs/MILESTONE_MELHORIAS_VISUAIS.md` | Checklist de épicos A–D e sprints (concluído) |
| `docs/MILESTONE_iOS_App.md` | Fases 0–5 do app iOS com Capacitor |
| `docs/BUGS.md` | Registro de 27 bugs com root cause e fix |
| `docs/GUIA_VERSIONAMENTO.md` | Conventional commits + SemVer + workflow git |
| `docs/GUIA_DE_TESTES.md` | Como escrever e organizar testes |
| `AGENTS.md` | Guia do squad IA — governança, subagentes, workflow git, checklist de PR |
| `docs/MF_Prompts_Squad_IA.md` | 10 prompts operacionais para PM Agent e Dev Manager |
| `docs/MF_Prompt_PMAgent_Squad.md` | Prompt autônomo do PM Agent (sessão diária) |
| `docs/MF_Prompt_DevManager_Squad.md` | Prompt autônomo do Dev Manager (sessão de execução) |
| `docs/MF_Templates_Sessao_Agentes.md` | 6 templates copy-paste para sessões de agentes |
| `docs/mf-squad-dashboard.html` | Dashboard visual do squad (atualizado pelo PM Agent) |
| `CHANGELOG.md` | Histórico completo de versões |

---

## Workflow de Desenvolvimento (Squad IA — Híbrido)

> Detalhes completos em `AGENTS.md`. Prompts operacionais em `docs/MF_Prompts_Squad_IA.md`.

### Features e Bug Fixes → Feature Branch + PR
```bash
# 1. Sincronizar
git pull origin main

# 2. Criar branch
git checkout -b feat/MF-{issue}-{descricao-kebab}   # ou fix/MF-{issue}-...

# 3. Implementar (seguir padrões deste CLAUDE.md)

# 4. Testar — OBRIGATÓRIO antes de commit
npm test                    # 509 testes devem passar

# 5. Acionar subagentes (ver AGENTS.md §6)
#    - test-runner: SEMPRE antes de PR
#    - security-reviewer: se tocou em auth/database/firestore.rules/innerHTML
#    - import-pipeline-reviewer: se tocou em pipeline de importação

# 6. Commit (Conventional Commits)
git add <arquivos específicos>   # NUNCA git add -A sem revisar
git commit -m "feat(escopo): descrição (vX.Y.Z)"

# 7. Push + PR
git push -u origin feat/MF-{issue}-{descricao}
gh pr create --title "feat(escopo): descrição (#issue)" --body "..."

# 8. CI verde → Merge → Delete branch
gh pr checks {numero} --watch
gh pr merge {numero} --merge --delete-branch
git checkout main && git pull origin main

# 9. Deploy (automático via CI após merge em main)
# 10. Atualizar CHANGELOG.md e fechar issues
```

### Docs, Chore, Style → Commit direto na main
```bash
# 1. Sincronizar
git pull origin main

# 2. Fazer alteração

# 3. Commit + Push
git add <arquivos específicos>
git commit -m "docs: descrição"
git push origin main
```

> **Regra**: Qualquer alteração em `src/js/` ou `src/css/` **DEVE** usar feature branch + PR.
> Alterações em `docs/`, `CHANGELOG.md`, `README.md`, `.auto-memory/` podem ir direto na main.

---

## Anti-patterns — O que NÃO fazer

- ❌ Deletar documentos `parcelamentos` — só `status: 'quitado'`
- ❌ Hardcodar cores no CSS — usar variáveis de `variables.css`
- ❌ `innerHTML` com dados do usuário sem `escHTML()` — XSS
- ❌ Queries Firestore sem filtro `grupoId` — dados vazam entre grupos
- ❌ Modificar `chave_dedup` após salvar — quebra deduplicação histórica
- ❌ Omitir `mesFatura` em despesas de cartão — quebra a tela de fatura
- ❌ Usar `deleteDoc` em lote sem batch — viola regras Firestore
- ❌ `import` de Firebase via CDN (`gstatic.com`) — usar pacotes npm (`firebase/app`, `firebase/auth`, `firebase/firestore`)
