# Bússola de Produto — Minhas Finanças

> Documento de referência estratégica para a revisão geral da solução.
> Criado em: 2026-04-15 | Sessão PO Cowork | Autor: Luigi (PO) + PO Assistant
> Revisado em: 2026-04-16 | Sessão PO Cowork | Revisão: sincronização com backlog real, pesquisa family office, novos RFs aprovados
> **Propósito:** Este documento serve como norte para todas as decisões de roadmap, redesenho de UX e priorização de RFs. Deve ser lido antes de qualquer sessão de redesenho de produto.

---

## 1. A Persona Central

**Luigi e Ana — Controller Financeiro Familiar**

Não são usuários casuais de app de finanças. São gestores ativos de uma unidade financeira familiar que precisam de **controle, previsibilidade e visão prospectiva** — não apenas registro de gastos.

A analogia correta não é "aplicativo de finanças pessoais". É um **escritório financeiro familiar simplificado (family office)** — com as mesmas necessidades de visibilidade, forecast e controle patrimonial de um CFO, porém em escala doméstica.

**O que um controller familiar precisa para tomar decisões:**
- Saber quanto tem disponível *agora*, em cada conta (liquidez)
- Saber se está executando o orçamento dentro do planejado *neste mês* — e se o ritmo indica estouro
- Saber como estará financeiramente nos *próximos 6–12 meses*
- Saber se o patrimônio líquido está crescendo ao longo do tempo

**Benchmark de mercado (family office software 2025-2026):** plataformas como Masttro, Addepar e Archway convergem em quatro pilares — liquidez em tempo real por conta, cash flow forecasting como visão primária de decisão, patrimônio líquido com evolução temporal (não snapshot estático) e alertas proativos que vão ao controller. O painel de execução orçamentária é tratado como visão secundária, não ponto de entrada.

---

## 2. Os Três Horizontes de Gestão

Todo o design do produto deve ser avaliado contra estes três horizontes. Cada tela, cada KPI, cada RF deve servir a um deles.

| Horizonte | Pergunta central | Urgência | Frequência de consulta |
|---|---|---|---|
| **H1 — Hoje / Semana** | Tenho caixa? Consigo pagar o que vence? | Alta | Diária |
| **H2 — Mês** | Estou dentro do orçamento? No ritmo atual, vou estourar? | Média | 2–3x por semana |
| **H3 — Futuro (6–12m)** | Como estarei em março? Meu patrimônio está crescendo? | Alta (planejamento) | Semanal |

### Diagnóstico atual por horizonte (atualizado em 2026-04-16)

| Horizonte | Cobertura atual | Avaliação |
|---|---|---|
| H1 — Liquidez imediata | Dados existem (contas.html), mas não são KPI no dashboard. Não há saldo real por conta. | **Não coberto como experiência** |
| H2 — Execução mensal | Dashboard + Orçamentos + Planejamento. Falta projeção de estouro intramês (burn rate). | **Bem coberto, incompleto na dimensão prospectiva** |
| H3 — Futuro e patrimônio | RF-067 (forecast 6 meses) em progresso + RF-065 (card Próxima Fatura) entregue. RF-066 (patrimônio) e RF-SALDO-CONTAS ainda pendentes. | **Em construção — forecast de fluxo avançando, saldo projetado por conta ausente** |

**Problema central:** o produto foi construído orientado ao passado e ao presente. A revisão em curso (milestone UX & Gestão Patrimonial) está corrigindo o eixo para o futuro, mas o processo ainda está incompleto — falta a âncora de liquidez (saldo real por conta) que transforma o forecast de "delta mensal" em "saldo projetado por conta".

---

## 3. Diagnóstico da Arquitetura Atual

### O problema de origem

O produto foi construído "de baixo para cima" — RF por RF, página por página, sem um modelo mental de uso que respondesse à pergunta central: **quem usa isso e que decisão precisa tomar agora?**

Resultado: 14 páginas semi-autônomas com navegação horizontal de botões, sem hierarquia de importância. Uma tela de conferência de compras (fatura.html) tem o mesmo peso visual de navegação que o cockpit gerencial (dashboard.html).

### As 14 páginas e seus papéis reais

| Página | Papel real | Horizonte | Frequência de uso |
|---|---|---|---|
| `dashboard.html` | Controle orçamentário mensal por categoria + card Próxima Fatura (RF-065) | H2 (+H3 parcial) | Alta |
| `fatura.html` | Conferência de compras do cartão por ciclo + aba Liquidação (RF-064) + aba Projeções | H1 / H2 | Alta |
| `fluxo-caixa.html` | Análise histórica anual + forecast 6 meses (RF-067, em progresso) | H2 (passado) + H3 | Baixa → Média |
| `planejamento.html` | Previsto vs. realizado mensal | H2 | Média |
| `orcamentos.html` | Configuração de limites | Configuração | Baixa |
| `despesas.html` | Listagem e CRUD de despesas | Operacional | Média |
| `receitas.html` | Listagem e CRUD de receitas | Operacional | Baixa |
| `importar.html` | Pipeline de ingestão de extratos | Operacional | Alta (semanal) |
| `base-dados.html` | CRUD da base completa + filtro não-categorizada (ENH-003) | Operacional | Baixa |
| `contas.html` | Gestão de contas e cartões | Configuração | Baixa |
| `categorias.html` | Gestão de categorias | Configuração | Baixa |
| `grupo.html` | Configuração do grupo familiar | Configuração | Muito baixa |
| `login.html` / `index.html` | Auth | — | — |

**Observação crítica:** das 14 páginas, apenas 4 são de consulta gerencial frequente (dashboard, fatura, planejamento, fluxo-caixa). As demais são operacionais ou de configuração. A navegação atual não reflete essa diferença de prioridade.

---

## 4. Gaps Críticos — Resolvidos

Os 5 gaps estruturais identificados nas sessões PO de 2026-04-15/16 foram todos fechados até v3.39.8. O diagnóstico original e a resposta do roadmap estão preservados em [`docs/HISTORICO_DE_GAPS.md`](HISTORICO_DE_GAPS.md).

Novos gaps estruturais identificados em sessões PO futuras devem ser registrados primeiro nesta seção (como §4.N) e migrados ao histórico apenas quando fechados.

---

## 5. Arquitetura de Navegação Aprovada

> **Decisão definitiva (sessão PO 2026-04-16):** a estrutura abaixo é a aprovada. A proposta anterior (Início / Fatura / Ano / Patrimônio / Transações / Config) foi descartada.

### Estrutura: 5 seções orientadas ao controller

```
Cockpit | Futuro | Histórico | Transações | Configurações
```

| Seção | Conteúdo | Horizonte | Páginas absorvidas |
|---|---|---|---|
| **Cockpit** | Saldo real das contas (RF-068), execução orçamentária do mês com burn rate (RF-069), card Próxima Fatura (RF-065), alertas críticos (fatura vencendo, categoria estourando, saldo baixo) | H1 + H2 | `dashboard.html` (evoluído) |
| **Futuro** | Forecast 6 meses (RF-067), compromissos futuros consolidados (parcelas + recorrentes + próximas faturas), patrimônio e projeção patrimonial (RF-066) | H3 | `fluxo-caixa.html` (evoluído) + merge de `planejamento.html` + aba Projeções de `fatura.html` |
| **Histórico** | Fluxo anual realizado, análise por categoria, evolução patrimonial mês a mês | H2 passado | Parte histórica de `fluxo-caixa.html` |
| **Transações** | Importar (CTA principal destacado), conferir fatura, base de dados, despesas, receitas, exportar | Operacional | `importar.html`, `fatura.html` (conferência), `base-dados.html`, `despesas.html`, `receitas.html` |
| **Configurações** | Categorias, contas, orçamentos, grupo | Configuração | `categorias.html`, `contas.html`, `orcamentos.html`, `grupo.html` |

### Regras de implementação

- **Fase 1 (v3.32.0):** só navbar — não toca em lógica de nenhuma página existente. Cockpit = dashboard.html como item ativo padrão. Transações > Importar com destaque visual (CTA principal).
- **Fase 2 (v3.33.0):** consolidação de páginas. Requer RF-067, RF-068 e RF-066 já no ar. Antes de iniciar, Dev Manager apresenta proposta de merge de Projeções × Planejamento ao PO (Gap 5).
- **Listeners onSnapshot:** verificar vazamento de memória ao consolidar páginas na Fase 2.

### Nota: ENH-005 absorvido pela NRF-NAV Fase 2

ENH-005 (#158 — migrar widget de parcelamentos de despesas.html para seção Fatura) será absorvido pela NRF-NAV Fase 2, que reorganiza integralmente o conteúdo das seções. Implementar ENH-005 isoladamente antes da Fase 2 gera risco de retrabalho. **Decisão: postergar ENH-005 — será implementado como parte da Fase 2.**

---

## 6. RFs do Roadmap — Novos e Revisados

### RF-067 — Forecast de Caixa Prospectivo 6 Meses (EM PROGRESSO)

**Issue:** #166 | **Versão:** v3.28.0 | **Prioridade:** P2 | **Branch:** `feat/MF-166-forecast-caixa-6meses`

Visão prospectiva mês a mês em `fluxo-caixa.html`, combinando:
- Receitas recorrentes detectadas (via `recurringDetector.js`, confiança alta + média)
- Despesas recorrentes detectadas (via `recurringDetector.js`)
- Parcelas de cartão comprometidas (via `tipo: 'projecao'` existente)
- Orçamentos como teto de gastos variáveis
- Flag `estimativaLimitada` quando histórico tem < 3 transações

Módulo `forecastEngine.js` implementado (121 linhas, stateless/puro). Testes pendentes antes do PR.

**Evolução futura (pós RF-068):** quando saldo real por conta estiver disponível, o forecast pode evoluir de "fluxo projetado" para "saldo projetado por conta" — versão incrementada sem reescrita.

---

### RF-068 — Saldo Real por Conta (NOVO — PRIORIDADE P1)

**Issue:** a criar | **Versão:** v3.29.0 | **Prioridade:** P1

**Descrição:** calcular e exibir o saldo atual de cada conta bancária/cartão, derivado de saldo inicial manual + transações importadas.

**Regras de negócio:**
- Novo campo `saldoInicial` (number, default null) e `dataSaldoInicial` (string YYYY-MM-DD, default null) na coleção `contas`
- Saldo atual = `saldoInicial` + soma algébrica de transações onde `contaId == conta.id` e `data >= dataSaldoInicial`
- Receitas somam positivo, despesas somam negativo, transferências internas somam conforme direção
- Transações com `tipo: 'pagamento_fatura'` e `tipo: 'transferencia_interna'` incluídas no cálculo de saldo (são movimentação real de caixa entre contas)
- Se `saldoInicial == null`, exibir "Saldo não configurado" (nunca exibir R$ 0,00 como se fosse real)
- KPI de saldo por conta exibido no Cockpit (dashboard.html) — card com nome da conta, saldo, e cor (verde se > 0, vermelho se < 0)
- Saldo total = soma de todos os saldos de contas ativas

**Módulos impactados:** `contas.html` (tela de edição do saldo inicial), `database.js` (nova query), `dashboard.js` (novo card KPI)

**Critérios de aceite:**
- [ ] Editar saldo inicial e data de referência em contas.html
- [ ] Saldo calculado corretamente a partir do saldo inicial + transações
- [ ] Card de saldo por conta visível no dashboard quando saldo configurado
- [ ] Conta sem saldo inicial mostra "não configurado", não R$ 0,00
- [ ] Testes unitários para cálculo de saldo (mínimo 10 TCs)

**Subagentes obrigatórios:** test-runner + security-reviewer (toca em database.js)

---

### RF-069 — Burn Rate por Categoria (NOVO — PRIORIDADE P2)

**Issue:** a criar | **Versão:** v3.31.0 | **Prioridade:** P2

**Descrição:** no Cockpit, para cada categoria com orçamento definido, exibir projeção de gasto até o fim do mês baseada no ritmo atual, com alerta visual para categorias que projetam estouro.

**Regras de negócio:**
- Cálculo base: `(gasto_acumulado / dia_do_mês) × total_dias_no_mês`
- Refinamento: usar média móvel dos últimos 7 dias para suavizar gastos pontuais (outliers)
- Alerta de estouro projetado: se projeção > orçamento, exibir badge "Projeta estouro: +R$ X"
- Só exibir para categorias com orçamento definido e com pelo menos 3 transações no mês
- Cálculo client-side (sem novas queries) — usa dados já carregados pelo dashboard

**Módulos impactados:** `controllers/dashboard.js` (lógica), `dashboard.html` (UI)

**Critérios de aceite:**
- [ ] Projeção de gasto exibida por categoria no dashboard
- [ ] Badge de estouro visível quando projeção > orçamento
- [ ] Média móvel 7 dias usada em vez de pro rata simples
- [ ] Categorias sem orçamento ou com < 3 transações não exibem projeção
- [ ] Testes unitários para cálculo de burn rate (mínimo 8 TCs)

---

### RF-066 Revisado — Patrimônio com Evolução e Projeção

**Issue:** #155 | **Versão:** v3.30.0 | **Prioridade:** P2 | **Branch:** `feat/MF-155-patrimonio-investimentos-dividas`
> Nota: versão ajustada para v3.30.0 considerando RF-068 em v3.29.0. Sequência completa na seção 9.

**Escopo expandido (aprovado em 2026-04-15):**
- Nova coleção `patrimonio` no Firestore (não campos em despesas)
- Carteira de investimentos: cadastro manual (nome, valor atual, tipo, rendimento estimado %)
- Repositório de dívidas ativas extrajudiciais: saldo devedor, parcela mensal, prazo restante
- PL calculado: total ativos − total passivos
- Snapshot mensal automático (coleção `patrimonio_historico`) para gráfico de evolução
- Taxa de poupança efetiva: (receitas − despesas reais) / receitas × 100
- Projeção patrimonial simples: se poupar R$ X/mês com rendimento Y%, em N meses patrimônio = Z

**Subagentes obrigatórios:** test-runner + security-reviewer (nova coleção + CRUD + innerHTML)

---

### RF-065 — Card Próxima Fatura no Dashboard (CONCLUÍDO)

**Issue:** #153 | **Versão:** v3.27.0 | **PR:** #167 | **Status:** Mergeado

Card na grade de KPIs do dashboard exibindo total projetado para o próximo mês de faturamento, com breakdown por membro. Deep link para `fatura.html?tab=projecoes`. Primeiro indicador prospectivo na home.

---

## 7. Avaliação do Roadmap (atualizado em 2026-04-16)

| Item | Status real | Alinhado com Controller? | Veredicto |
|---|---|---|---|
| **RF-065** — Card Próxima Fatura | **Concluído** (v3.27.0, PR #167) | Sim — primeiro indicador prospectivo na home | Correto |
| **RF-067** — Forecast 6 meses | **Em progresso** (forecastEngine.js pronto, PR pendente) | Sim, mas incompleto sem saldo de referência | Prosseguir, evoluir pós RF-068 |
| **RF-068** — Saldo Real por Conta | **Novo — a criar** | Sim — pré-requisito para Cockpit responder H1 | **Prioridade P1** |
| **RF-066** — Patrimônio expandido | Planejado (v3.30.0) | Sim — escopo correto após revisão | Correto |
| **RF-069** — Burn Rate por Categoria | **Novo — a criar** | Sim — transforma dashboard de retrospectivo em prospectivo | P2, baixa complexidade |
| **NRF-NAV** — Reestruturação navegação | Planejado (Fase 1 v3.31.0, Fase 2 v3.32.0) | Sim na teoria, precisa de RF-068 para Cockpit ter sentido | Adiar até RF-068 no ar |
| **ENH-001** — Update duplicata no preview | **Concluído** (v3.25.0, PR #164) | Indireto — melhora qualidade dos dados | Correto |
| **ENH-003** — Filtro + seletores segregados | **Concluído** (v3.26.0, PR #165) | Indireto — reduz ruído operacional | Correto |
| **ENH-004** — UX tela fatura | Planejado (P2) | Operacional, não gerencial | Cede espaço para RFs estratégicos |
| **ENH-002** — Bulk categorização | Planejado (P2) | Operacional, não gerencial | Cede espaço para RFs estratégicos |
| **ENH-005** — Widget parcelamentos → Fatura | Planejado (P2) | Será absorvido pela NRF-NAV Fase 2 | **Postergado — evitar retrabalho** |

### Hierarquia de valor para a persona

A regra geral: **capacidade de decisão > produtividade operacional**. RFs que permitem ao controller tomar decisões que hoje não consegue (RF-068, RF-067, RF-066, RF-069) têm prioridade sobre ENHs que tornam mais rápido o trabalho que já consegue fazer (ENH-002, ENH-004). Os ENHs entram após a estrutura gerencial estar estabelecida.

---

## 8. Princípios de Design para a Revisão Geral

Estes princípios devem guiar qualquer nova tela, RF ou redesenho:

**P1 — Futuro antes do passado.** O controller precisa mais de saber o que vai acontecer do que confirmar o que já aconteceu. Toda tela deve ter uma dimensão prospectiva.

**P2 — Contexto antes do detalhe.** O cockpit mostra o estado geral. O detalhe (lista de transações, análise por categoria) é drill-down, não ponto de entrada.

**P3 — Dados agregados antes de registros.** KPIs e indicadores têm mais valor imediato do que tabelas de transações. As tabelas existem para explicar os KPIs, não como conteúdo principal.

**P4 — Alertas proativos.** O app deve vir ao controller com informações relevantes ("sua fatura do XP vence em 5 dias e representa 40% do seu saldo disponível"), não esperar que o controller vá até o app procurar o problema. **Nota técnica:** alertas dentro do app (banners, badges, cards na home) são viáveis já. Alertas proativos reais (push notification) dependem de iOS Fase 5 (#87, #88) — tratar como evolução futura, não bloqueante.

**P5 — Uma única fonte da verdade por contexto.** Acabar com a duplicação de Projeções (fatura.html) e Planejamento (planejamento.html). Cada dado financeiro deve ter uma única tela canônica. Consolidação planejada na NRF-NAV Fase 2.

**P6 — Hierarquia visual reflete hierarquia de decisão.** Cards que demandam ação imediata do controller (saldo real, fatura próxima, estouro de orçamento) devem se destacar visualmente dos cards informativos. "Tudo igual" é ruim — o olho precisa de âncoras. Ver §12 para os princípios visuais PV1–PV6.

---

## 9. Ordem de Ataque

A sequência operacional de entrega com status atualizado está em [`docs/ORDEM_DE_ATAQUE.md`](ORDEM_DE_ATAQUE.md).

Motivação da extração: Ordem de Ataque muda a cada sessão PO; Bússola é reflexão estratégica estável. Separar reduz ruído de commits na Bússola e facilita leitura rápida por Dev Manager e PM Agent.

---

## 11. Registro de Decisões

| Data | Decisão | Sessão |
|---|---|---|
| 2026-04-15 | Persona "Controller Familiar" definida | PO Cowork |
| 2026-04-15 | Três horizontes de gestão (H1/H2/H3) como framework | PO Cowork |
| 2026-04-15 | RF-066 escopo expandido (patrimônio + evolução + taxa poupança) | PO Cowork |
| 2026-04-15 | RF-067 criado (forecast 6 meses, issue #166) | PO Cowork |
| 2026-04-15 | NRF-NAV aprovada: Cockpit/Futuro/Histórico/Transações/Config | PO Cowork |
| 2026-04-16 | Bússola revisada: sincronização com backlog real | PO Cowork |
| 2026-04-16 | RF-068 (Saldo Real por Conta) criado — P1 | PO Cowork |
| 2026-04-16 | RF-069 (Burn Rate por Categoria) criado — P2 | PO Cowork |
| 2026-04-16 | ENH-005 postergado — será absorvido pela NRF-NAV Fase 2 | PO Cowork |
| 2026-04-16 | ENH-004 e ENH-002 rebaixados para P3 — após estrutura gerencial | PO Cowork |
| 2026-04-16 | Sequência aprovada: RF-067→RF-068→RF-066→RF-069→NRF-NAV F1→F2→ENHs | PO Cowork |
| 2026-04-16 | mobile.html deve incluir saldo, forecast resumido e burn rate | PO Cowork |
| 2026-04-16 | **RF-069 antecipado para v3.30.0** (entregue commit `0ee3e18` fora de sessão PO formal). **RF-066 realocado para v3.31.0.** Processo: commit direto em `main` violou Regra Inviolável #11 — trabalho íntegro (611 testes, CHANGELOG OK), alerta registrado em `.auto-memory/project_mf_status.md` para o PM Agent reportar no próximo diário. Bússola §9 revisada nesta sessão. | PO Cowork |
| 2026-04-20 | **NRF-NAV F2 entregue (PR #187). F3 (#189) aprovada = Opção B** — ENH-005 + DS refinements (v3.38.0). Opção C (merge receitas/despesas) rejeitada. #158 ENH-005 fechada como absorvida por #189. | PO Cowork |
| 2026-04-21 | **NRF-VISUAL Fase 1 aprovada (#192) = Opção B** — 1–3 cards hero por tela (PV4). Tokens hero, `.card-hero`/`.card-subtle`, `chartDefaults.js`, migração Cockpit. Bússola §12 criada com PV1–PV6. | PO Cowork |
| 2026-04-22 | Proposta C — Higiene Estratégica ativa. BUSSOLA refatorada: §4 (Gaps resolvidos) extraída para `docs/HISTORICO_DE_GAPS.md`, §9 (Ordem de Ataque) extraída para `docs/ORDEM_DE_ATAQUE.md`, §10 (mobile.html) removida (nunca implementada, iOS ON HOLD). CLAUDE.md + memória sincronizadas em v3.39.8 (commit cb6717a). Próximas: C2→C4→C3. | PO Cowork |

---

## 12. Princípios Visuais — Hierarquia Controller (NRF-VISUAL)

> Criados em 2026-04-21. Guiam todas as decisões de hierarquia visual do Cockpit e futuras telas.

**PV1 — Contraste serve à decisão.** Elementos que pedem ação imediata do controller (saldo crítico, fatura, estouro) têm contraste máximo. Elementos informativos têm contraste standard.

**PV2 — Uma âncora visual por tela.** Cada tela tem exatamente um elemento que "ancora" o olhar: o KPI mais relevante para o controller naquele contexto. No Cockpit, é o Saldo Real.

**PV3 — Tamanho de fonte sinaliza importância.** KPI hero = 40px, KPI padrão = 28px, valor de card = 22px, detalhe = 13px. Nunca usar 40px para dados secundários.

**PV4 — Máximo 3 heros simultâneos por tela.** Acima de 3, o impacto do hero dilui. No Cockpit: Saldo Real (permanente) + Próxima Fatura (≤7 dias) + Burn Rate (estouro >10%).

**PV5 — Tokens ou nada.** Nenhuma cor hardcoded em CSS. Cada decisão de cor passa por `variables.css`. Isso garante dark mode coerente e facilita futuras revisões de paleta.

**PV6 — Legibilidade de gráfico = legibilidade de decisão.** Ticks ≥ 13px, legend/tooltip ≥ 14px. Gráfico ilegível é gráfico inútil para o controller familiar.

---

## 12.5 — Princípios de Experiência (PUX)

> Criados em 2026-04-21 (NRF-UX F2). Estendem §12 para além de cor/tipografia e cobrem fluxo, navegação e micro-interações. São critérios de revisão do subagente `ux-reviewer`.

**PUX1 — Hierarquia clara**
Cada tela tem 1 a 3 elementos hero (KPI principal, gráfico âncora, ação principal).
Secundários ficam visivelmente menores. Sem "mar de cards iguais".

**PUX2 — Tipografia disciplinada**
Títulos em Fraunces (display), corpo em Inter. Escala limitada (tokens `--fs-*`).
Números financeiros grandes usam `font-variant-numeric: tabular-nums`.

**PUX3 — Iconografia única**
Lucide como biblioteca única em chrome de UI. Emojis aceitáveis apenas em
dados do usuário (nomes de categoria). Nunca em navbar, cards, headers.

**PUX4 — Cor com intenção**
Cores sempre via tokens. Tokens semânticos (`--color-income`, `--color-danger`)
em contextos corretos. Contraste AA/AAA em textos sobre hero surfaces dark.

**PUX5 — Espaço respiratório**
Padding e gaps via tokens. Hero cards ganham ar. Densidade em tabelas e listas,
nunca em KPIs.

**PUX6 — Ritmo e movimento sóbrios**
Animações com durações/eases dos tokens. Skeletons para loading. Sem bounce,
rotate ou wobble em elementos funcionais.

---

*Este documento deve ser atualizado a cada sessão PO em que decisões de produto de alto impacto forem tomadas. Não é um backlog — é uma bússola.*
