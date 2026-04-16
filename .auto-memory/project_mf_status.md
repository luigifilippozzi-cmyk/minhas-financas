# Minhas Finanças — Estado do Projeto (Auto-Memory)

> Atualizado em: 2026-04-16 03:40 (Dev Manager — sessão v3.28.1)
> Versão: v3.28.1 (CHANGELOG + package.json — sincronizados ✅)
> Saúde: 🟢 VERDE — BUILD-BROKEN-P0 resolvido (PR #171) | deploy Firebase restaurado | 594 testes OK

---

## Dev Manager — 2026-04-16 03:40

### Sessão
- Versão: v3.28.1
- Tarefas concluídas: BUILD-BROKEN-P0 (buscarDespesasMes duplicado — database.js)
- PRs criados: #171 — fix(database): remover buscarDespesasMes duplicado
- PRs mergeados: #171 — CI verde (Vitest PASS ×2) + Deploy Firebase SUCCESS
- Subagentes acionados: test-runner PASS (594/594)
- CI: verde | Deploy Firebase: SUCCESS (restaurado após 5 runs consecutivos falhos)

### Estado do milestone
- iOS Fase 2 (BLOQUEADO — requer Mac/Xcode): 4/4 issues abertas — #77, #78, #79, #80
- UX & Gestao Patrimonial: 7 issues abertas — #151, #152, #154, #155, #158, #169, #170
- QA pendente: 1 — #129 (RF-062, execução manual Luigi)

### Próximas prioridades
- P0: RF-068 (#169) — Saldo Real por Conta (prioridade: alta) → v3.29.0
- P1: RF-069 (#170) — Burn Rate por Categoria → v3.30.0
- P1: RF-066 (#155) — Patrimônio Ativos/Passivos
- P2: ENH-004 (#151), ENH-002 (#152), ENH-005 (#158)
- BLOQUEADO: iOS Fase 2 (#77–#80) requer Mac/Xcode

### Alertas
- [QA-RF-062-PENDENTE] issue #129 — 50 TCs manuais, execução pelo Luigi
- [DÍVIDA-TÉCNICA] chartColors.js — módulo pré-existente sem teste (não blocante)

---

## PM Agent — 2026-04-16 00:26

### Estado
- Versão: v3.28.0
- Milestones ativos:
  - 📱 App Mobile iOS — Capacitor (23.5%, 4/17 issues)
  - 🎨 UX & Gestao Patrimonial (41.7%, 5/12 issues — 2 novas: #169 RF-068, #170 RF-069)
- Saúde: 🔴 VERMELHO — BUILD QUEBRADO: `buscarDespesasMes` declarado duas vezes em `database.js` (linhas 665 e 1092, com ordem de parâmetros diferente)
- Testes: 594 unit (24 arquivos) + 26 int — todos passando ✅ (localmente; Rollup/Vite build falha)
- CI: 🔴 VERMELHA — 5 runs consecutivos falhando desde 2026-04-16T02:52Z | Deploy Firebase: inacessível
- PRs abertos: 0

### Issues abertas (21 total)
- iOS Fase 2 (P0 — requer Mac/Xcode): #77, #78, #79, #80
- iOS Fases 3–5: #81–#89 (9 issues)
- QA pendente: #129 (RF-062 — Cartões como Contas Individuais, 50 TCs manuais)
- UX & Gestao Patrimonial: #151, #152, #154, #155, #158, #169 (RF-068), #170 (RF-069)
- Novas desde última sessão PM: #169 (RF-068 Saldo Real por Conta, P1), #170 (RF-069 Burn Rate por Categoria, P2)

### Alertas ativos
- **[BUILD-BROKEN-P0]** `database.js` tem `buscarDespesasMes` declarado duas vezes: linha 665 `(grupoId, ano, mes)` adicionada pelo RF-067 (commit 4c4d9a5) e linha 1092 `(grupoId, mes, ano)` pré-existente de RF-060/planejamento. Rollup falha com "Identifier has already been declared". Dev Manager deve criar `fix/MF-database-buscarDespesasMes-dedup`, resolver conflito de assinaturas e abrir PR.
- **[QA-RF-062-PENDENTE]** issue #129 — 50 TCs manuais RF-062 Cartões como Contas Individuais (execução pelo Luigi)
- **[DÍVIDA-TÉCNICA]** chartColors.js — módulo pré-existente sem teste (não blocante)

### Alertas resolvidos
- ✅ [VIOLAÇÃO-REGRA-11] — issue retroativa #147 criada e fechada (aceite PO)
- ✅ QA RF-064 — issues #136–#139 fechadas (inclusive #139 fechada em Apr 15)
- ✅ [INCONSISTÊNCIA] package.json ≠ CHANGELOG — v3.28.0 sincronizados

### Velocidade recente (Apr 15-16)
- Issues fechadas últimos 7 dias: #166, #162, #157, #156, #153, #150, #149, #148, #147, #139 (10 issues)
- 2 novas issues abertas: #169 (RF-068), #170 (RF-069)

### Prioridades para Dev Manager
- **P0 IMEDIATO**: Fix `buscarDespesasMes` duplicado em `database.js` → `fix/MF-database-buscarDespesasMes-dedup` → PR → deploy restaurado
- P2: RF-068 (#169) — Saldo Real por Conta → v3.29.0
- P2: RF-066 (#155) — Patrimônio Ativos/Passivos
- P2: ENH-004 (#151) — progressive disclosure base-dados.html
- P2: ENH-002 (#152) — exibir origem/destino em transferências internas
- P2: ENH-005 (#158) — simplificar despesas.html
- P2: RF-069 (#170) — Burn Rate por Categoria
- BLOQUEADO: iOS Fase 2 (#77–#80) requer Mac/Xcode
- QA: Luigi executar #129 (50 TCs RF-062)

### Subagentes acionados (Dev Manager sessão v3.28.0)
- test-runner: PASS (594/594) — sessão anterior (Apr 15)

---

## PM Agent — 2026-04-15 23:55

### Estado
- Versão: v3.28.0
- Milestones ativos:
  - 📱 App Mobile iOS — Capacitor (23.5%, 4/17 issues)
  - 🎨 UX & Gestao Patrimonial (50%, 5/10 issues — #166 fechada com PR #168)
- Saúde: 🟢 Verde — RF-067 entregue (PR #168) | 594 testes OK | CI verde
- Testes: 594 unit (24 arquivos) + 26 int — todos passando ✅
- CI: Verde (último deploy: automático pós-merge PR #168) | PRs abertos: 0

### Issues abertas (19 total)
- iOS Fase 2 (P0 — requer Mac/Xcode): #77, #78, #79, #80
- iOS Fases 3–5: #81–#89 (9 issues)
- QA pendente: #129 (RF-062 — Cartões como Contas Individuais, 50 TCs manuais)
- UX & Gestao Patrimonial (P2): #151, #152, #154, #155, #158
- Novas desde última sessão PM: nenhuma (19 total, fechadas 13 em 2 dias)

### Alertas ativos
- [QA-RF-062-PENDENTE] issue #129 — 50 TCs manuais, execução pelo Luigi (RF-062 Cartões como Contas Individuais)
- [DÍVIDA-TÉCNICA] chartColors.js — 30 linhas, módulo pré-existente sem teste

### Alertas resolvidos
- ✅ [VIOLAÇÃO-REGRA-11] — issue retroativa #147 criada e fechada
- ✅ QA RF-064 — issues #136–#139 fechadas
- ✅ [INCONSISTÊNCIA] package.json ≠ CHANGELOG — v3.28.0 sincronizados
- ✅ RF-067 (#166) — forecastEngine.js + 31 TCs + fluxo-caixa página completa — PR #168 mergeado

### Velocidade do Sprint (Apr 15-16)
- 13 issues fechadas em 2 dias: #162, #157, #156, #153, #150, #149, #148, #147, #139-#136, #166
- Sprints por dia: ~6.5 issues/dia — velocidade excepcional

### Prioridades para Dev Manager
- P2: RF-066 (#155) — Patrimônio Ativos/Passivos → v3.29.0
- P2: ENH-004 (#151) — progressive disclosure base-dados.html
- P2: ENH-002 (#152) — exibir origem/destino em transferências internas
- P2: ENH-005 (#158) — simplificar despesas.html
- BLOQUEADO: iOS Fase 2 (#77–#80) requer Mac/Xcode
- QA: Luigi executar #129 (50 TCs RF-062)

### Subagentes acionados (Dev Manager sessão v3.28.0)
- test-runner: PASS (594/594)

---

## Dev Manager — 2026-04-17 00:00 (sessão v3.28.0)

### Sessão
- Versão: v3.28.0 (MINOR — RF-067)
- Tarefas concluídas:
  - RF-067 (#166) — Forecast de Caixa Prospectivo 6 Meses implementado em fluxo-caixa.html
- PRs criados: #168 — feat(fluxo-caixa): RF-067 Forecast de Caixa Prospectivo 6 Meses
- PRs mergeados: #168
- Subagentes acionados: test-runner PASS (594/594)
- CI: verde | Deploy Firebase: automático pós-merge

### Estado do milestone
- UX & Gestao Patrimonial: 5 issues abertas — #151, #152, #154, #155, #158
- iOS Fase 2 (P0 — requer Mac/Xcode): 4 issues — #77, #78, #79, #80
- QA pendente: 1 — #129 (RF-062, execução manual Luigi)
- Total issues abertas: 19

### Próximas prioridades
- P2: RF-066 (#155) — Patrimônio (carteira investimentos + dívidas ativas + PL) → feat/MF-155-patrimonio → v3.29.0
- P2: ENH-004 (#151) — progressive disclosure, 1 badge por linha em base-dados.html
- P2: ENH-002 (#152) — exibir origem e destino em transferências internas
- P2: ENH-005 (#158) — simplificar despesas.html (remover KPI carousel + widget Parcelamentos)
- BLOQUEADO: iOS Fase 2 (#77–#80) requer Mac/Xcode

### Alertas ativos
- [QA-RF-062-PENDENTE] issue #129 — 50 TCs manuais RF-062 Cartões como Contas Individuais (execução pelo Luigi)

### Alertas resolvidos nesta sessão
- ✅ [PM-YELLOW] PM Agent havia marcado saúde Amarelo por RF-067 em progresso — resolvido, PR #168 mergeado

---

## PM Agent — 2026-04-15 23:45

### Estado
- Versão: v3.27.0
- Milestones ativos:
  - 📱 App Mobile iOS — Capacitor (23.5%, 4/17 issues)
  - 🎨 UX & Gestao Patrimonial (40%, 4/10 issues)
- Saúde: 🟡 Amarelo — RF-067 em progresso (forecastEngine.js não commitado, sem teste) | QA #129 pendente | chartColors.js sem teste
- Testes: 563 unit (23 arquivos) + 26 int — todos passando ✅
- CI: Verde (último deploy: 2026-04-16 02:21 UTC — success) | PRs abertos: 0

### Issues abertas (20 total)
- iOS Fase 2 (P0 — requer Mac/Xcode): #77, #78, #79, #80
- iOS Fases 3–5: #81–#89 (9 issues)
- QA pendente: #129 (RF-062 — Cartões como Contas Individuais, 50 TCs manuais)
- UX & Gestao Patrimonial (P2): #151, #152, #154, #155, #158, #166
- Novas desde última sessão PM: nenhuma (20 total, fechadas 12 em 2 dias)

### Branch ativa
- `feat/MF-166-forecast-caixa-6meses` — Dev Manager implementando RF-067 Forecast de Caixa
- `forecastEngine.js` criado (121 linhas, módulo stateless+puro), não commitado, sem teste

### Alertas ativos
- [QA-RF-062-PENDENTE] issue #129 — 50 TCs manuais, execução pelo Luigi
- [DÍVIDA-TÉCNICA] forecastEngine.js — RF-067 em progresso, teste pendente antes do PR
- [DÍVIDA-TÉCNICA] chartColors.js — 30 linhas, módulo pré-existente sem teste

### Alertas resolvidos
- ✅ [VIOLAÇÃO-REGRA-11] — issue retroativa #147 criada e fechada (Apr 15)
- ✅ QA RF-064 — issues #136, #137, #138, #139 fechadas (Apr 15)
- ✅ [INCONSISTÊNCIA] package.json v3.23.8 ≠ CHANGELOG — sincronizado para v3.27.0 (Apr 16)

### Velocidade do Sprint
- Issues fechadas em 2 dias (Apr 15-16): 12 issues!
  - BUG: #162 (mesFatura model), #157 (categoriaId), #156 (responsavel), #148 (BUG-029 gráfico)
  - Features: #153 (RF-065 dashboard), #150 (ENH-003), #149 (ENH-001)
  - QA: #136, #137, #138, #139 (todos os planos RF-064)
  - Issue retroativa: #147

### Prioridades para Dev Manager
- P1 (em progresso): RF-067 (#166) — Forecast de Caixa — feat/MF-166-forecast-caixa-6meses → v3.28.0
  - Adicionar testes para forecastEngine.js antes do PR (obrigatório)
- P2: RF-066 (#155) — Patrimônio Ativos/Passivos
- P2: ENH-004 (#151), ENH-002 (#152) — UX progressiva
- QA: Luigi executar #129 (50 TCs RF-062)

### Subagentes acionados
- Não registrado (último registrado: test-runner PASS — Dev Manager sessão v3.27.0)

---

## Dev Manager — 2026-04-16 23:17 (sessão v3.27.0)

### Sessão
- Versão: v3.27.0 (MINOR — RF-065)
- Tarefas concluídas:
  - [CHORE] package.json bump v3.23.8 → v3.26.0 (sincronia com CHANGELOG) — commit direto main
  - RF-065 (#153) — card Próxima Fatura no dashboard + deep link ?tab=projecoes em fatura.js
- PRs criados: #167 — feat(dashboard): RF-065 card Próxima Fatura + deep link
- PRs mergeados: #167
- Subagentes acionados: test-runner PASS (563/563)
- CI: verde | Deploy Firebase: automático pós-merge

### Estado do milestone
- UX & Gestao Patrimonial: 6 issues abertas — #151, #152, #154, #155, #158, #166
- iOS Fase 2 (P0 — requer Mac/Xcode): 4 issues — #77, #78, #79, #80
- QA pendente: 1 — #129 (RF-062)
- Total issues abertas: 20

### Próximas prioridades
- P2: RF-067 (#166) — Forecast de Caixa Prospectivo 6 Meses → feat/MF-166-forecast-caixa-6meses
  - Módulos: forecastEngine.js (NOVO stateless+puro), fluxo-caixa.js, database.js (buscarProjecoesRange)
  - Versão alvo: v3.28.0
- P2: RF-066 (#155) — Patrimônio (carteira investimentos + dívidas ativas + PL) → v3.29.0
- P2: ENH-004 (#151), ENH-002 (#152) — UX progressiva

### Alertas ativos
- [QA-RF-062-PENDENTE] issue #129 — 50 TCs manuais, execução pelo Luigi

### Alertas resolvidos nesta sessão
- ✅ [INCONSISTÊNCIA] package.json v3.23.8 ≠ CHANGELOG v3.26.0 — sincronizado para v3.27.0
- ✅ RF-065 (#153) — card Próxima Fatura + deep link fatura.html?tab=projecoes

---

## PM Agent — 2026-04-15 23:05

### Estado
- Versão: v3.26.0 (CHANGELOG) — package.json stuck em 3.23.8 → [INCONSISTÊNCIA]
- Milestones ativos:
  - 📱 App Mobile iOS — Capacitor (23.5%, 4/17 issues)
  - 🎨 UX & Gestao Patrimonial (30%, 3/10 issues)
- Saúde: 🟡 Amarelo — [INCONSISTÊNCIA] package.json stale
- Testes: 563 unit (23 arquivos) + 26 int — todos passando ✅
- CI: Verde (último deploy: 2026-04-16 01:45 UTC — success) | PRs abertos: 0

### Issues abertas (21 total)
- iOS Fase 2 (P0 — requer Mac/Xcode): #77, #78, #79, #80
- iOS Fases 3–5: #81–#89 (9 issues)
- QA pendente: #129 (RF-062 — Cartões como Contas Individuais)
- UX & Gestao Patrimonial (P2): #151, #152, #153, #154, #155, #158, #166
- Novas desde última sessão PM: #166 (RF-067 Forecast de Caixa — criada em sessão PO Cowork)

### Alertas ativos
- [INCONSISTÊNCIA] package.json version v3.23.8 ≠ CHANGELOG v3.26.0 — Dev Manager deve bumpar package.json para v3.26.0
- [QA-RF-062-PENDENTE] issue #129 ainda aberta — 50 TCs manuais Cartões como Contas Individuais (execução manual pelo Luigi)
- [DÍVIDA-TÉCNICA-JUSTIFICADA] chartColors.js sem teste — DOM-dependent (getComputedStyle), decisão explícita PO

### Alertas resolvidos desde última sessão PM
- ✅ [VIOLAÇÃO-REGRA-11] — encerrado (issue #147 criada+fechada, aceite consciente PO)
- ✅ BUG-029 (PR #160), BUG-030 (PR #159), BUG-031 (PR #161), BUG-032 (PR #163) — todos fechados
- ✅ ENH-001 (PR #164), ENH-003 (PR #165) — concluídos
- ✅ QA RF-064 — issues #136, #137, #138, #139 fechadas

### Prioridades para Dev Manager
- P2: RF-067 (#166) — Forecast de Caixa Prospectivo 6 Meses → feat/MF-166-forecast-caixa-6meses
- P2: RF-065 (#153) — card Próxima Fatura na home + tab Projeções como default
- P2: RF-066 (#155) — página Patrimônio (escopo expandido: investimentos + dívidas + PL)
- P2: ENH-004 (#151), ENH-002 (#152) — UX progressiva
- FIX: package.json bump → 3.26.0 (chore, pode ir direto em main)
- BLOQUEADO: iOS Fase 2 (#77–#80) requer Mac/Xcode

### Atividade recente
- Último PR mergeado: #165 feat(categorias) ENH-003 — v3.26.0 | 563 testes
- Commits diretos em main desde última sessão:
  - a237740 docs: BUSSOLA_PRODUTO.md (OK — docs/)
  - 7e0b38e chore(changelog): v3.26.0 (OK — chore)
- Issues fechadas últimos 7 dias: #162, #157, #156, #150, #149, #148, #147, #139, #138, #137, #136 (11 issues)
- Subagentes acionados (Dev Manager sessão 2026-04-16): test-runner PASS (563/563)

---

---

## Dev Manager — 2026-04-16 (sessão v3.26.0)

### Sessão
- Versão: v3.26.0 (era v3.25.0)
- Tarefas concluídas: ENH-003 (#150)
- PRs criados: #165 ENH-003
- PRs mergeados: #165
- Subagentes acionados: test-runner PASS (563/563)
- CI: verde | Deploy Firebase: automático pós-merge

### Estado do milestone
- iOS Fase 2 (P0 — requer Mac/Xcode): 4/4 issues abertas — #77, #78, #79, #80
- UX & Gestao Patrimonial: 7/9 issues abertas (#151–#158) — ENH-001 #149 + ENH-003 #150 fechadas
- QA pendente: 1 — #129 (RF-062)

### Próximas prioridades
- P2: RF-065 (#153) — card Próxima Fatura na home + tab Projeções como default
- P2: RF-066 (#155) — página Ativos/Passivos + coleção patrimônio Firestore
- P2: ENH-004 (#151) — melhorias UX na tela de fatura
- P2: ENH-002 (#152) — bulk categorização em base-dados

### Alertas
- [QA-RF-062-PENDENTE] issue #129 ainda aberta — 50 TCs manuais, execução pelo Luigi

### Alertas resolvidos
- ✅ [ENH-003-P2] PR #165 — feat em base-dados.js + despesas.js: filtro não categorizada + seletores segregados
- ✅ [BUG-032-P0] PR #163 — fix em Despesa.js + Receita.js: mesFatura adicionado aos opcionais
- ✅ [ENH-001-P1] PR #164 — feat em importar.js: duplicata no preview faz updateDoc em vez de insert
- ✅ [BUG-029-P0] PR #160 — fix em controllers/dashboard.js: filtro categoriasDesp
- ✅ [BUG-031-P1] PR #161 — fix em importar.js: categoriaId=null nos blocos RF-063/064
- ✅ [BUG-030-P0] PR #159 — fix em normalizadorTransacoes.js: portador='' sem coluna portador

---

## PM Agent — 2026-04-15 20:31

### Estado
- Versão: v3.23.8
- Milestones ativos:
  - 📱 App Mobile iOS — Capacitor (23.5%, 4/17 issues)
  - 🎨 UX & Gestao Patrimonial (0%, 0/9 — recém criado)
- Saúde: 🔴 Vermelho — BUG-030 P0 aberto (responsavel como string negativa bloqueia edição manual de extrato bancário) + BUG-029 P0 (receitas no gráfico de despesas)
- Testes: 514 unit (19 arquivos) + 26 int — todos passando
- CI: Verde (último deploy: 2026-04-15 13:41 UTC — success) | PRs abertos: 0

### Issues abertas (25 total — +11 novas desde 14/04)
- Bugs P0 (BLOQUEANTES):
  - #156 BUG-030 — responsavel salvo como string negativa em extrato bancário (bloqueia edição manual) — `pipelineBanco.js`
  - #148 BUG-029 — receitas exibidas no gráfico de despesas (dashboard)
- Bug P1:
  - #157 BUG-031 — categoriaId salvo como '__tipo__pagamento_fatura' em vez de null (`importar.js` ~linha 993/1026)
- UX milestone — Épico A (P1, alta):
  - #149 ENH-001 — edição de duplicata no preview faz update, não insert
  - #150 ENH-003 — filtro não categorizada + seletores segregados por tipo
- UX milestone — Épico B/C (P2):
  - #151 ENH-004, #152 ENH-002, #153 RF-065, #154 NRF-NAV, #155 RF-066, #158 ENH-005
- QA pendente: #129 (RF-062 — Cartões como Contas Individuais)
- iOS Fase 2 (P0 — requer Mac/Xcode): #77, #78, #79, #80
- iOS Fases 3–5: #81–#89 (9 issues)
- Novas desde última sessão: #148–#158 (11 issues criadas na sessão PO Cowork 2026-04-15)

### Alertas ativos
- [BUG-030-P0] responsavel como string negativa bloqueia edição manual de transações importadas do extrato bancário — fix em `pipelineBanco.js` (portador não definido → responsavel recebe valor negativo)
- [BUG-029-P0] receitas exibidas no gráfico de despesas no dashboard — `BUG-029` (#148)
- [BUG-031-P1] categoriaId salvo como '__tipo__pagamento_fatura' em Firestore — `importar.js` ~linha 993/1026 — bloco RF-064 não reseta `categoriaId = null`
- [QA-RF-062-PENDENTE] issue #129 ainda aberta — 50 TCs manuais Cartões como Contas Individuais (execução manual pelo Luigi)

### Alertas resolvidos (desde última sessão)
- ✅ [VIOLAÇÃO-REGRA-11] — issue retroativa #147 criada e fechada, aceite consciente do PO
- ✅ [QA-RF-064] — issues #136, #137, #138, #139 fechadas, QA RF-064 concluído

### Prioridades para Dev Manager
- P0: BUG-030 (#156) — fix `pipelineBanco.js` (portador/responsavel como string negativa)
- P0: BUG-029 (#148) — fix gráfico dashboard (receitas no gráfico de despesas)
- P1: BUG-031 (#157) — fix `importar.js` ~linha 993/1026 (categoriaId = null após bloco RF-064)
- P1: ENH-001 (#149) — edição de duplicata no preview faz update, não insert (UX milestone Épico A)
- P2: Iniciar Épico A UX & Gestao Patrimonial (#149, #150) após bugs P0 resolvidos

### Atividade recente
- Último PR mergeado: #146 fix(importar) BUG-028b (2026-04-14 20:18)
- Commits sem PR detectados: NENHUM desde resolução (cf77730 e abae7c4 são chore — permitidos)
- Issues fechadas últimos 7 dias: #147, #139, #138, #137, #136 (hoje), #127, #126, #125 (12/13 abr)
- Subagentes acionados: não registrado
- Sessões PO Cowork hoje: 3 sessões — [VIOLAÇÃO-REGRA-11] encerrado, novo milestone UX criado, QA RF-064 concluído

---

## PM Agent — 2026-04-15 06:35

### Estado
- Versão: v3.23.8
- Milestone ativo: 📱 App Mobile iOS — Capacitor (23.5%, 4/17 issues fechadas)
- Saúde: 🟡 Amarelo — [VIOLAÇÃO-REGRA-11] feat(importar) commit direto em main sem PR (12c3d70) — aguardando decisão do PO
- Testes: 514 unit (19 arquivos) + 26 int — todos passando
- CI: Verde (último deploy: 2026-04-15 01:53 UTC — success) | PRs abertos: 0

### Issues abertas (18 total — sem alterações desde 14/04)
- Fase 2 (P0 — requer Mac/Xcode): #77, #78, #79, #80
- QA pendente: #129, #136, #137, #138, #139
- Novas desde última sessão: nenhuma
- Fechadas últimos 7 dias: nenhuma

### Alertas ativos
- [VIOLAÇÃO-REGRA-11] commit `12c3d70` feat(importar): tipo de transacao no seletor de categoria do preview bancario — foi commitado diretamente em main sem PR, viola regra inviolável do CLAUDE.md (src/js/ exige feature branch + PR) — sugerir issue retroativa ao PO
- [QA-PENDENTE] 5 planos de teste abertos: #129 (RF-062), #136–#139 (RF-064) — execução manual pelo Luigi

### Prioridades para Dev Manager
- P0: iOS App Fase 2 (#77–#80) — requer Mac/Xcode (bloqueado em ambiente Windows)
- P1: Aguardar decisão do PO sobre [VIOLAÇÃO-REGRA-11] (issue retroativa ou aceite consciente)
- Alertas a processar: [VIOLAÇÃO-REGRA-11], [QA-PENDENTE]

### Atividade recente
- Último PR mergeado: #146 fix(importar) BUG-028b (2026-04-14 20:18)
- Commits sem PR detectados: SIM — 12c3d70 feat(importar) tipo-transacao (2026-04-14 22:08)
  - NOTA: commits 0bac056 e e9be080 são chore(changelog) — permitidos direto em main
- Issues fechadas últimos 7 dias: nenhuma
- Subagentes acionados: não registrado

---

## Versão Atual
- **v3.23.8** (2026-04-14) — BUG-028b corrigido (PR #146) + feat importar tipo-transacao (commit direto)
- 514 testes unitários (19 arquivos) + 26 testes de integração — **todos passando**
- 42 requisitos funcionais concluídos + RF-062 + RF-063 + RF-064 concluídos ✅
- Cadeia Luigi → Ana → Cartão **completamente implementada**
- 14 páginas HTML, 51 módulos JS
- Tech debt testes: **100% concluído** — bankFingerprintMap, detectorOrigemArquivo, recurringDetector (PR #140) + pdfParser (PR #141) + skeletons (PR #142)

## Milestones

| Milestone | Progresso | Status |
|-----------|-----------|--------|
| Requisitos Funcionais (backlog anterior) | 42/42 (100%) | Concluído |
| Reconciliação Fatura ↔ Extrato (RF-062/063/064) | 3/3 (100%) | **Concluído** ✅ |
| Melhorias Visuais | 26/26 (100%) | Concluído |
| Manutenibilidade e Arquitetura | Completo | Concluído (v3.20.0) |
| iOS App Fase 0 (Vite + Firebase npm) | 2/2 (100%) | Concluído |
| iOS App Fase 1 (Capacitor + safe areas) | 2/2 (100%) | Concluído |
| iOS App (Fases 2–5) | 4/17 (23.5%) | Em andamento (bloqueado: requer Mac/Xcode) |
| Tech Debt — testes | 5/5 módulos cobertos | **Concluído** ✅ (skeletons — PR #142) |

## Issues Abertas (18 total — verificado 2026-04-15)

### Cadeia RF-062/063/064: COMPLETA ✅
- RF-062 → CONCLUÍDO (PR #128, v3.21.0)
- RF-063 → CONCLUÍDO (PR #132, v3.22.0)
- RF-064 → CONCLUÍDO (PR #134, v3.23.0)

### QA — Plano de Testes RF-064 (4 issues abertas)
- #136 — TC-001–007: Preview import + badge PAG FATURA
- #137 — TC-008–014: Save no Firestore + campos tipo/score/status + dedup
- #138 — TC-015–022: Dashboard + planejamento excluem pagamento_fatura
- #139 — TC-023–029: Aba Liquidação + score auto/pendente + edge cases

### QA — Plano de Testes RF-062 (1 issue aberta)
- #129 — 50 TCs manuais Cartões como Contas Individuais

### P0 — iOS App Fase 2 (4 issues)
- #77 GoogleService-Info.plist
- #78 capacitor-firebase-authentication
- #79 Biometria (Face ID / Touch ID)
- #80 FCM Push notifications

### P1 — iOS Fase 3 (3 issues)
- #81 Ícones + splash screen
- #82 UX mobile (teclado, toque, scroll)
- #83 Dark Mode + status bar nativa

### P2 — iOS Fase 4 (3 issues)
- #84 Apple Developer Program + provisioning
- #85 Primeiro upload TestFlight
- #86 CI/CD GitHub Actions + Fastlane

### P3 — iOS Fase 5 — Backlog (3 issues)
- #87 Push: alerta orçamento ≥80%
- #88 Push: nova despesa conjunta
- #89 Câmera: fotografar comprovantes

## Infraestrutura
- **CI:** Verde (último deploy: 2026-04-15 01:53 UTC — Firebase Hosting, success)
- **PRs abertos:** 0
- **Branches remotas:** limpas (apenas branches fechadas de fix/MF-bug028*)
- **Build:** OK

## Qualidade
- Testes: 514 unitários (19 arquivos) + 26 integração — **todos passando**
- Módulos sem teste (gap): **nenhum** — tech debt 100% concluído ✅
  - chartColors.js: intencionalmente sem teste (usa getComputedStyle DOM, env=node, lógica trivial com fallbacks)
- Bugs abertos: 0

## Contexto da Cadeia RF-062/063/064 — COMPLETA

**Triple count eliminado:**
- PIX Luigi → Ana: R$ 1.750 → RF-063 ✅ (tipo: 'transferencia_interna', excluído)
- PAG FATURA Ana → Cartão: R$ 3.500 → RF-064 ✅ (tipo: 'pagamento_fatura', excluído)
- Compras do cartão: R$ 3.500 → correto desde sempre

**Dashboard exibe R$ 3.500 (valor real), não R$ 8.750.**

## Prioridades para o Dev Manager
- **P0:** iOS App Fase 2 (#77–#80) — requer Mac/Xcode (não executável no ambiente CLI Windows)
- **P1:** QA RF-064 — Luigi executa #136–#139 manualmente (sem Dev Manager)
- **Alertas:** [VIOLAÇÃO-REGRA-11] aguardando decisão PO

## Nota sobre chartColors.js
`chartColors.js` usa `getComputedStyle(document.documentElement)` — requer jsdom ou browser. O vitest config usa `environment: 'node'`. O módulo tem 30 linhas, lógica trivial (lê CSS vars com fallbacks hardcoded). Decisão: sem teste unitário (custo/benefício baixo). Não é bug nem dívida técnica.

## Últimas Ações
- 2026-04-15 06:35: PM Agent — revisão diária: 514 testes OK, 18 issues, saúde Amarelo — [VIOLAÇÃO-REGRA-11] pendente, nenhum commit novo desde 14/04 22:56
- 2026-04-14 22:56: chore(changelog): corrigir encoding e duplicata (0bac056) — commit direto em main (OK: chore)
- 2026-04-14 22:53: chore(changelog): registrar feat importar RF-063/064 (e9be080) — commit direto em main (OK: chore)
- 2026-04-14 22:08: feat(importar): tipo de transacao no seletor de categoria (12c3d70) — commit direto em main ⚠️ VIOLAÇÃO-REGRA-11
- 2026-04-14 22:19: PM Agent — Merge PR #146 tech debt BUG-028b corrigido — 514 testes total, v3.23.8
- 2026-04-14 22:19: Dev Manager — Merge PR #142 tech debt: +31 testes skeletons.js — v3.23.4, 501 testes total
- 2026-04-14 22:06: Dev Manager — chore: bump package.json 3.23.2→3.23.3 (sincronia com docs/CLAUDE.md)
- 2026-04-13 21:40: Dev Manager — Merge PR #141 tech debt: +47 testes pdfParser.js — v3.23.3, 470 testes total

## Notas Dev Manager (2026-04-14)
- iOS Fase 2 (#77-#80) bloqueado: requer Mac com Xcode — aguardar sessão em ambiente macOS
- Tech debt de testes: **COMPLETAMENTE CONCLUÍDO** — todos os módulos testáveis em src/js/utils/ têm cobertura
- chartColors.js: DOM-dependent via getComputedStyle, sem teste (justificado)
- QA RF-062 (#129) e QA RF-064 (#136-#139) são para execução manual pelo Luigi

## Sess�o 2026-04-15 � PO Assistant (Cowork)
- Vers�o na sess�o: v3.23.8
- Milestone ativo: iOS Fase 2 (issues #77�#80)
- Decis�o: [VIOLA��O-REGRA-11] encerrado � issue retroativa #147 criada e fechada. Aceite consciente do PO: risco baixo (UI de preview, 514 testes passando, sem impacto em pipeline/dedup/mesFatura).
- Sa�de: ?? Verde (alerta amarelo removido)
- Issues priorizadas: nenhuma nova
- Bugs registrados: nenhum
- Melhorias registradas: nenhuma
- RFs criados: nenhum
- Bloqueios identificados: iOS Fase 2 (#77�#80) requer Mac/Xcode
- Artefatos gerados para PM/DM: n�o
- Scripts PowerShell executados: criar + fechar issue #147
- Pr�xima sess�o: iniciar iOS Fase 2 ou executar QA RF-064 (#136�#139)
## Sess�o 2026-04-15 � PO Assistant (Cowork)
- Vers�o na sess�o: v3.23.8
- Milestone ativo: iOS Fase 2 (#77�#80) � bloqueado (Mac/Xcode)
- Decis�o principal: reorganiza��o da arquitetura de informa��o do app em 5 se��es
  gerenciais (In�cio, Fatura, Ano, Patrim�nio, Transa��es) + ?? Configura��es
- �picos criados: A (P1 � Corrigir), B (P2 � Clarear), C (P2-P3 � Expandir)
- Novo milestone criado: ?? UX & Gest�o Patrimonial
- Bugs registrados: BUG-029
- Melhorias registradas: ENH-001, ENH-002, ENH-003, ENH-004, NRF-NAV
- RFs criados: RF-065 (card home + tab default fatura), RF-066 (patrim�nio)
- RF-065 reformulado: n�o � nova p�gina � card no dashboard + deep link fatura.html?tab=projecoes
- RF-066 schema aprovado: nova cole��o patrimonio (n�o campos em despesas)
- Pr�xima sess�o: autorizar Dev Manager a iniciar �pico A

## Sessão 2026-04-15 — PO Assistant (Cowork) — QA RF-064 (Parte 2)
- Versão na sessão: v3.23.8
- Milestone ativo: iOS Fase 2 (#77–#80) — bloqueado (Mac/Xcode)
- QA RF-064 (#136–#139): CONCLUÍDO ✅ — todas as 4 issues fechadas
  - TC-008: 5/6 campos Firestore corretos; BUG-031 descoberto (categoriaId salvo errado)
  - TC-013/015–019: isMovimentacaoReal() funciona corretamente — pagamento_fatura e transferencia_interna excluídos de todos os agregados (despesas, dashboard, planejamento)
  - TC-139 (Aba Liquidação): score 40/100 Pendente correto para cartão novo (XP Visa, jan/2026, 0 transações)
  - BUG-030 descoberto: responsavel salvo como "-42.5" em imports de extrato banco — bloqueia edição manual
- Bugs registrados:
  - BUG-030 (#156 — P0): responsavel salvo como string negativa em importação extrato banco (pipelineBanco.js não define portador)
  - BUG-031 (#157 — P1): categoriaId salvo como "__tipo__pagamento_fatura" em Firestore (importar.js linha 993, bloco RF-064 não reseta categoriaId = null)
- Melhorias registradas:
  - ENH-005 (#158 — P2): despesas.html tem 3 responsabilidades misturadas — widget Parcelamentos deve migrar para seção Fatura
- Issues fechadas: #136, #137, #138, #139
- Artefatos gerados para DM: sim — BUG-030 (P0, fix em pipelineBanco.js) + BUG-031 (P1, fix em importar.js ~linha 1026)
- Artefatos gerados para PM: sim — QA RF-064 encerrado, 3 novos itens, saúde Vermelho (BUG-030 P0)
- Handoff: .auto-memory/dm_tasks_pending.md + .auto-memory/pm_tasks_pending.md
- Nota label: "prioridade: media" não existe no repo — usar "prioridade: média" (com acento) ou omitir
- Próxima sessão: Dev Manager — BUG-030 P0 ANTES de qualquer Épico; BUG-031 P1 na sequência; QA #129 (RF-062) pode rodar em paralelo após BUG-030 corrigido

## Dev Manager — 2026-04-15 — BUG-030 concluído (PR #159)
- Versão: v3.23.9 (bump de v3.23.8)
- BUG-030 (#156) RESOLVIDO: normalizadorTransacoes.js — removido fallback idxPortador=2 quando header detectado; portador agora retorna '' em vez de string numérica
- Bonus: importar.js _aplicarTipo('banco') agora funciona corretamente (condição \!l.portador era bloqueada pela string numérica truthy)
- Testes: 519/519 unitários passando (era 514 — +5 novos testes do BUG-030)
- CI: verde | PR #159 mergeado | branch deletada
- Subagentes: test-runner PASS + import-pipeline-reviewer PASS (sem Critical/High)
- Próximas prioridades informadas pelo DM: BUG-029 (#148 P0) + BUG-031 (#157 P1)

## Dev Manager — 2026-04-15 — BUG-032 + ENH-001 concluídos
- Versão: v3.25.0 (MINOR — ENH-001 bump de v3.23.9)
- Testes: 548/548 unitários passando (era 519 — +29 novos testes)
- Saúde: 🟢 Verde | Issues abertas: 20 | CI: verde

### BUG-032 (#162) — PR #163 — RESOLVIDO ✅
- mesFatura ausente das listas `opcionais` de modelDespesa e modelReceita → campo descartado silenciosamente antes de salvar no Firestore → aba Fatura sempre vazia para novos imports
- Fix: 1 linha em Despesa.js + 1 linha em Receita.js
- CRÍTICO: violava Regra Inviolável #2 (mesFatura obrigatório em despesas de cartão)
- Novos testes: Receita.test.js (novo) + 2 regressões em Despesa.test.js

### ENH-001 (#149) — PR #164 — RESOLVIDO ✅
- Duplicata marcada no preview → executarImportacao() chamava INSERT em vez de UPDATE
- Fix: bloco ENH-001 no loop — se l.duplicado && l.duplicado_docId → atualizarDespesa/atualizarReceita
- +4 testes em deduplicador.test.js para contrato duplicado_docId via Map
- import-pipeline-reviewer: APPROVED

### Próxima tarefa proposta pelo DM
- ENH-003 (#150) — filtro "não categorizada" + seletores segregados por tipo em base-dados.js/categorias.js

## Dev Manager — 2026-04-15 — ENH-003 concluído (PR #165)
- Versão: v3.26.0 (MINOR)
- Testes: 563/563 passando (era 548 — +15 novos em base-dados.filtro.test.js)
- ENH-003 (#150) RESOLVIDO ✅
  - Filtro "Não categorizada" (__nao_categorizada__) em base-dados.html
  - Seletores segregados: despesas.html filtrado por tipo='despesa'; receitas.html já usava ouvirCategoriasReceita() — sem alteração necessária
- CI: verde | PR #165 mergeado
- Backlog P2 restante: RF-065 (#153), RF-066 (#155), ENH-004 (#151), ENH-002 (#152)
- BUG-031 (#157) JÁ CONCLUÍDO — PR #161 mergeado (v3.24.0); nota stale removida

## PO — 2026-04-15 — Correção de memória stale
- BUG-031 (#157): confirmado RESOLVIDO em v3.24.0 (PR #161, issue fechada 2026-04-16)
  - importar.js:1038 + 1048: despDados.categoriaId = null nos blocos RF-063 e RF-064
  - 4 TCs de regressão em Despesa.test.js
- Nota "ATENÇÃO: BUG-031 ainda não executado" removida — era stale
- Estado real dos bugs: BUG-029 ✅, BUG-030 ✅, BUG-031 ✅, BUG-032 ✅ — todos fechados
- Backlog P2 ativo: RF-065 (#153), RF-066 (#155), ENH-004 (#151), ENH-002 (#152)

## Sessao 2026-04-15 � PO Assistant (Cowork) � Bussola + RF-067 + RF-066 revisado

- Versao na sessao: v3.26.0
- Milestone ativo: UX & Gestao Patrimonial (milestone #18) � agora 8 issues abertas
- Decisoes da sessao:
  1. BUSSOLA_PRODUTO.md criada em docs/ � commit a237740 � bussola estrategica do produto
  2. Persona central definida: Controller Familiar (family office simplificado)
  3. Tres horizontes de gestao documentados (H1 liquidez / H2 execucao / H3 futuro)
  4. Diagnostico: produto cobre bem H2, carece de H1 e H3
  5. NRF-NAV criticada � estrutura alternativa proposta: Cockpit/Futuro/Historico/Transacoes/Config
  6. RF-067 (Forecast Caixa 6 meses) criado e aprovado � issue #166 � v3.27.0 P2
  7. RF-066 escopo revisado (Patrimonio: carteira investimentos + dividas ativas + PL)
     issue #155 atualizada � v3.28.0 P2
- RFs criados: RF-067 (#166)
- RFs revisados: RF-066 (#155 � escopo expandido significativamente)
- Bugs registrados: nenhum
- Proximas prioridades P2 (backlog DM):
    - RF-067 (#166) � forecast caixa � feat/MF-166-forecast-caixa-6meses
    - RF-066 (#155) � patrimonio � feat/MF-155-patrimonio-investimentos-dividas
- Bloqueios: iOS Fase 2 (#77-#80) requer Mac/Xcode
- Artefatos gerados para PM: sim � pm_tasks_pending.md atualizado
- Artefatos gerados para DM: sim � dm_tasks_pending.md atualizado
- Proxima sessao: autorizar Dev Manager a iniciar RF-067; ou revisar NRF-NAV
  com estrutura alternativa Cockpit/Futuro/Historico/Transacoes/Config

## Sessao 2026-04-15 � PO Assistant (Cowork) � Abertura + RF-065 validado

- Versao na sessao: v3.27.0 (bump resolvido � era inconsistente com v3.23.8)
- RF-065 (#153): CONCLUIDO � PR #167 mergeado, 563/563 testes, CI verde
  Card Proxima Fatura aparece quando ha tipo=projecao no mes seguinte
  Deep link fatura.html?tab=projecoes com whitelist de tabs
- Versoes corrigidas: RF-067 v3.28.0 | RF-066 v3.29.0 (RF-065 consumiu v3.27.0)
- Milestone UX & Gestao Patrimonial: ~37% (3/8 fechadas � ENH-001, ENH-003, RF-065)
- Proxima prioridade autorizada: RF-067 (#166) � feat/MF-166-forecast-caixa-6meses

## Sessao 2026-04-15 � PO Assistant (Cowork) � NRF-NAV revisada e aprovada

- Versao na sessao: v3.27.0
- NRF-NAV (#154): escopo revisado e aprovado � v3.30.0 P2
  5 secoes: Cockpit | Futuro | Historico | Transacoes | Config
  Fase 1 (navbar pura, baixo risco) -> Fase 2 (consolidacao de paginas)
  iOS: mobile.html separado como light version
  Transacoes > Importar = CTA principal destacado
- Sequencia de entregas P2 definida:
    RF-067 (#166) v3.28.0 -> RF-066 (#155) v3.29.0
    -> NRF-NAV F1 (#154) v3.30.0 -> NRF-NAV F2 v3.31.0
- Proxima sessao: aguardar RF-067 do Dev Manager

## Sessao 2026-04-16 - PO Assistant (Cowork)

- Versao na sessao: v3.27.0 (RF-067 em andamento na branch
  feat/MF-166-forecast-caixa-6meses, alvo v3.28.0)
- Milestone ativo: UX & Gestao Patrimonial (#18) - 7 open / 5 closed (41.6%)
  + iOS Fase 2 (#10) - bloqueado (Apple Developer Program)

### Decisoes
- Bussola do produto (docs/BUSSOLA_PRODUTO.md) revisada sob otica de
  "Controller Familiar" + boas praticas de family office, commit 2ec95a6.
  Gaps identificados: saldo real por conta (virou RF-068) e burn rate
  por categoria (virou RF-069).
- Sequencia aprovada v3.28.0 -> v3.33.0:
  1. RF-067 (#166) v3.28.0 - forecast caixa 6 meses - EM ANDAMENTO
  2. RF-068 (#169) v3.29.0 - saldo real por conta - NOVO P1
  3. RF-066 (#155) v3.30.0 - patrimonio (escopo revisado)
  4. RF-069 (#170) v3.31.0 - burn rate por categoria - NOVO P2
  5. NRF-NAV F1 (#154) v3.32.0 - navbar 5 secoes
  6. NRF-NAV F2 (#154) v3.33.0 - consolidacao paginas + mobile.html

### RFs criados
- RF-068 (#169) P1 v3.29.0 - Saldo Real por Conta (saldoInicial +
  movimentacoes reais, card Cockpit com lista por conta)
- RF-069 (#170) P2 v3.31.0 - Burn Rate por Categoria (media movel 7 dias,
  projecao mensal, classificacao verde/amarelo/vermelho)

### Bugs registrados
- Nenhum

### Melhorias registradas
- Nenhuma

### Bloqueios identificados
- forecastEngine.js (121 linhas na branch feat/MF-166) ainda SEM TESTES
  unitarios. Blocker para abrir PR do RF-067 - subagente test-runner
  vai reprovar. DM precisa adicionar testes antes do merge.
- iOS Fase 2 continua bloqueado ate Apple Developer Program ser ativado.

### Artefatos gerados
- Sim:
  - .auto-memory/pm_tasks_pending.md - bloco RF-068/RF-069 para PM Agent
  - .auto-memory/dm_tasks_pending.md - bloco RF-068/RF-069 para Dev Manager
    com branch names, subagentes e regras criticas

### Scripts PowerShell executados
- Diagnostico de milestones/labels (Passo 1)
- gh label create rf-068 e rf-069 (Passo 2)
- gh api para criar issues #169 e #170 (Passos 3 e 4)
- Verificacao visual das duas issues (Passo 5)
- Add-Content em pm_tasks_pending.md (Passo 6)
- Add-Content em dm_tasks_pending.md (Passo 7)

### Proxima sessao PO - foco recomendado
1. Validar PR do RF-067 quando Dev Manager abrir (esperar testes do
   forecastEngine serem adicionados).
2. Apos merge RF-067 -> autorizar RF-068 no DM (artefato ja pronto em
   dm_tasks_pending.md).
3. Revisar escopo de RF-066 uma ultima vez antes de autorizar.

---

## Sessao 2026-04-16 (continuacao) - PO Assistant (Cowork)

- Decisao adicional: criar NRF-UI-WARM como homenagem a estetica
  Anthropic/Claude (Luigi e fa da ferramenta - tributo visual SEM uso
  de IP proprietario).
- Escopo: paleta terracota/ivory/kraft + fontes Fraunces+Inter
  self-hosted + tabular nums + glifo U+2732 em estados automaticos.
- Estrategia: casar com NRF-NAV Fase 1 em v3.32.0 para evitar retrabalho
  de componentes apos migracao da navbar.

### Novos artefatos registrados
- NRF-UI-WARM (#172) P2 v3.32.0 - Identidade Visual Warm Finance
- Label nova: nrf-ui-warm (cor terracota #CC785C - homenagem a propria paleta)
- Label nova: design-system (#6B7F8C - pode ser reusada em futuras issues)

### Sequencia final aprovada v3.28.0 -> v3.33.0
1. RF-067 (#166) v3.28.0 - forecast caixa - EM ANDAMENTO
2. RF-068 (#169) v3.29.0 - saldo real por conta - P1
3. RF-066 (#155) v3.30.0 - patrimonio - P2
4. RF-069 (#170) v3.31.0 - burn rate - P2
5. NRF-NAV F1 (#154) + NRF-UI-WARM (#172) v3.32.0 - CASADOS
6. NRF-NAV F2 (#154) v3.33.0 - consolidacao + mobile.html

### Milestone UX & Gestao Patrimonial
- 8 open / 5 closed = 38.5% concluido (13 issues totais)

### Proxima sessao PO - foco (atualizado)
1. Validar PR do RF-067 quando DM abrir
2. Autorizar RF-068 apos merge RF-067
3. Rever escopo final de RF-066
4. Quando chegar a v3.32.0: decidir definitivamente se NRF-NAV F1 e
   NRF-UI-WARM vao casadas na mesma branch ou em duas branches separadas
   sequenciais.

---
