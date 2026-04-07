# CLAUDE.md — Minhas Finanças

> Guia para o agente Claude Code. Leia este arquivo antes de qualquer tarefa.

## Identidade do Projeto

**Minhas Finanças** é um Progressive Web App de gestão financeira familiar, construído com **vanilla JavaScript + Firebase** (sem frameworks).

- **Usuários:** Luigi + Ana (casal)
- **Dev:** Luigi (solo developer)
- **Versão atual:** v3.17.0
- **Repo:** https://github.com/luigifilippozzi-cmyk/minhas-financas
- **Stack:** HTML5 · CSS3 · JS ES6+ (módulos nativos) · Firebase Auth · Cloud Firestore · Chart.js v4 · SheetJS (XLSX)

---

## Comandos Essenciais

```bash
npm test                    # Vitest — roda suite de 181+ testes unitários
npm run test:watch          # Vitest em modo watch
npm run test:coverage       # Coverage com V8
npm start                   # firebase serve (dev local)
npm run emulate             # Firebase emulators (Auth + Firestore locais)
firebase deploy             # Deploy completo (hosting + regras)
firebase deploy --only hosting   # Só frontend
node serve-local.js         # Servidor local alternativo (ESM)
```

**Sempre rodar `npm test` antes de commit.** Os testes cobrem parsers, deduplicador, ajusteDetector e normalizador.

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
| `tipo` | string | `"despesa"` \| `"projecao"` \| `"projecao_paga"` |
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

`garantirContasPadrao()` em `app.js` faz upsert das 11 contas ao iniciar. Ao testar, mockar esta função ou usar emuladores. **Nunca deletar contas** — só `ativa: false`.

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

**Escopos frequentes:** `auth`, `dashboard`, `despesas`, `receitas`, `categorias`, `orcamentos`, `importar`, `base-dados`, `fatura`, `planejamento`, `pipelineCartao`, `pipelineBanco`, `database`, `hosting`

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
- 181+ testes unitários cobrindo: parsers, dedup, ajusteDetector, normalizador
- **Rodar antes de qualquer commit:** `npm test`
- Mocks de Firestore em `tests/` — não dependem de emulador

---

## Estado Atual do Projeto (2026-04-06)

### Milestones
| Milestone | Progresso | Status |
|-----------|-----------|--------|
| Requisitos Funcionais | 35/35 (100%) | ✅ Concluído |
| Melhorias Visuais | 26/26 (100%) | ✅ Concluído |
| iOS App (Fases 0–5) | 0/17 issues | ⚪ Não iniciado |
| Tech Debt | 1/2 (50%) | ⚪ Backlog |

### Próximas prioridades
1. **iOS App Fase 0** — migrar para Vite bundler + Firebase via npm (issues #73, #74)
2. **Tech Debt** — unificação de pipeline (#96)
3. **iOS App Fase 1** — Capacitor + iOS setup (issues #75, #76)

### Documentação de referência
| Arquivo | Conteúdo |
|---------|----------|
| `docs/ARQUITETURA_TECNICA.md` | Firestore schema completo, índices, fluxo de dados |
| `docs/DESIGN_SYSTEM.md` | Paleta, tipografia, espaçamento, componentes, acessibilidade |
| `docs/REQUISITOS_FUNCIONAIS.md` | 35 RF + NRF implementados com descrição detalhada |
| `docs/MILESTONE_MELHORIAS_VISUAIS.md` | Checklist de épicos A–D e sprints (concluído) |
| `docs/MILESTONE_iOS_App.md` | Fases 0–5 do app iOS com Capacitor |
| `docs/BUGS.md` | Registro de 27 bugs com root cause e fix |
| `docs/GUIA_VERSIONAMENTO.md` | Conventional commits + SemVer + workflow git |
| `docs/GUIA_DE_TESTES.md` | Como escrever e organizar testes |
| `CHANGELOG.md` | Histórico completo de versões |

---

## Workflow de Desenvolvimento (solo dev)

```bash
# 1. Desenvolver
# 2. Testar
npm test

# 3. Commit (Conventional Commits)
git add <arquivos específicos>
git commit -m "feat(escopo): descrição (vX.Y.Z)"

# 4. Push
git push origin main

# 5. Deploy (quando pronto para release)
firebase deploy --only hosting

# 6. Atualizar CHANGELOG.md e fechar issues GitHub
```

> **Nota:** projeto pessoal — commits direto na `main`, sem PRs obrigatórios. PRs opcionais para features maiores.

---

## Anti-patterns — O que NÃO fazer

- ❌ Deletar documentos `parcelamentos` — só `status: 'quitado'`
- ❌ Hardcodar cores no CSS — usar variáveis de `variables.css`
- ❌ `innerHTML` com dados do usuário sem `escHTML()` — XSS
- ❌ Queries Firestore sem filtro `grupoId` — dados vazam entre grupos
- ❌ Modificar `chave_dedup` após salvar — quebra deduplicação histórica
- ❌ Omitir `mesFatura` em despesas de cartão — quebra a tela de fatura
- ❌ Usar `deleteDoc` em lote sem batch — viola regras Firestore
- ❌ `import` de Firebase via CDN em módulos novos — usar SDK modular (`firebase/firestore`)
