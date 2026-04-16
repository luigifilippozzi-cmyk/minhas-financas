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

## 4. Gaps Críticos de Produto

### Gap 1 — Saldo real por conta (o pré-requisito que falta)

**O que falta:** saldo atual de cada conta bancária exibido como KPI no Cockpit/dashboard, derivado de um saldo inicial manual + transações importadas.

**Por que é o gap mais crítico:** a pergunta H1 do controller — "quanto tenho no Itaú agora?" — não tem resposta no app. O dashboard mostra "receitas − despesas do mês", que é fluxo mensal, não saldo bancário. Sem saldo real, o forecast do RF-067 fica desancorado: mostra um delta mensal (+R$ 1.500), mas não projeta "em junho terei R$ 12.300 no Itaú e R$ 3.200 no Nubank". Para o controller, o segundo é o que dispara decisão.

**Decisão de design (aprovada em 2026-04-16):** modelo híbrido.
- Saldo inicial informado manualmente por conta (campo `saldoInicial` + `dataSaldoInicial` na coleção `contas`)
- Saldo atual = `saldoInicial` + soma de transações importadas após `dataSaldoInicial`
- Se saldo inicial não informado, exibir como "não configurado" (sem inventar número)
- Atualização: recalculado em tempo real via `onSnapshot` sobre transações da conta

**RF designado:** RF-068 — Saldo Real por Conta (ver seção 6)

---

### Gap 2 — Forecast projeta fluxo, não saldo (evolução necessária)

**Status atualizado (2026-04-16):** RF-067 (#166) está em progresso (v3.28.0). O `forecastEngine.js` está implementado — stateless, puro, combina receitas recorrentes + despesas recorrentes + parcelas comprometidas + orçamentos como teto. PR pendente (testes obrigatórios antes do merge).

**O que o RF-067 entrega:** projeção de fluxo líquido mês a mês (receitas esperadas − despesas estimadas − parcelas comprometidas). Gráfico prospectivo em `fluxo-caixa.html`.

**O que ainda falta:** a evolução de "forecast de fluxo" para "forecast de saldo por conta" depende do RF-068 (saldo real por conta). Com o RF-068 implementado, o forecast pode partir do saldo real atual e projetar o saldo futuro, conta a conta — que é o que o controller realmente usa para decidir.

**Não é bloqueante para o RF-067 atual** — o forecast de fluxo já tem valor próprio. A evolução será incremental.

---

### Gap 3 — RF-066 revisado (escopo expandido, aprovado)

**Status atualizado:** o escopo de RF-066 (#155) foi expandido na sessão PO de 2026-04-15. Não é mais apenas um balanço estático.

**Escopo aprovado (v3.29.0):**
- Carteira de investimentos (cadastro manual: nome, valor, tipo, rendimento estimado)
- Repositório de dívidas ativas extrajudiciais (saldo devedor, parcela mensal, prazo)
- PL calculado: total ativos − total passivos
- Snapshot mensal automático (histórico de net worth para gráfico de evolução)
- Taxa de poupança efetiva: % da renda acumulada no mês
- Projeção patrimonial simples com juros compostos

**Avaliação:** escopo agora está alinhado com a persona. Prioridade P2 adequada — depende do RF-067 estar no ar primeiro.

---

### Gap 4 — Taxa de execução orçamentária projetada (burn rate)

**O que falta:** dado que estamos no dia 15 do mês e consumimos 70% do orçamento de alimentação, o app deveria indicar que o ritmo atual levará a um estouro de R$ 400 até o fim do mês.

**O que existe hoje:** "gastou X de um limite de Y" — estático, sem projeção intramês.

**Por que é controloria real:** um controller não age apenas quando o limite estoura — age quando o ritmo indica que vai estourar. Plataformas de family office tratam isso como alerta proativo básico.

**Cálculo base:** `(gasto_até_hoje / dia_do_mês) × dias_no_mês`. Refinamento recomendado: média móvel dos últimos 7 dias para suavizar gastos pontuais (uma compra de R$ 2.000 no dia 5 não deve projetar R$ 12.000/mês).

**RF designado:** RF-069 — Burn Rate por Categoria (ver seção 6)

---

### Gap 5 — Projeções e Planejamento são visões duplicadas sem integração

**O problema:** `fatura.html` tem a aba Projeções (parcelas futuras de cartão). `planejamento.html` também mostra essas parcelas misturadas com recorrentes e orçamentos. São duas visões do mesmo dado sem narrativa unificada.

**O que o controller precisa:** uma única timeline de compromissos futuros consolidada — "nos próximos 90 dias, tenho X em parcelas + Y em recorrentes + Z de próxima fatura = W total comprometido". Isso substitui e supera ambas as visões atuais.

**Resolução planejada:** a NRF-NAV Fase 2 (v3.31.0) deve consolidar essas visões na seção "Futuro". **Requisito para o Dev Manager:** antes de iniciar a Fase 2, apresentar proposta de merge de dados ao PO — quais componentes de planejamento.html e quais de fatura.html/aba Projeções migram para Futuro, e o que é descontinuado. Esta é decisão de arquitetura de informação, não de implementação.

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

---

## 9. Ordem de Ataque Aprovada

Sequência de implementação aprovada pelo PO em 2026-04-16, incorporando todos os novos RFs:

| # | Item | Versão | Prioridade | Justificativa |
|---|---|---|---|---|
| 1 | **RF-067** — Forecast 6 meses | v3.28.0 | P2 | Em progresso. Maior salto qualitativo — habilita H3 |
| 2 | **RF-068** — Saldo Real por Conta | v3.29.0 | P1 | Âncora de liquidez. Habilita H1 no Cockpit. Pré-requisito para forecast evoluir para saldo projetado |
| 3 | **RF-066** — Patrimônio expandido | v3.30.0 | P2 | Completa H3 (net worth + evolução + taxa poupança) |
| 4 | **RF-069** — Burn Rate por Categoria | v3.31.0 | P2 | Completa H2 (projeção intramês). Baixa complexidade — pode ser paralelo |
| 5 | **NRF-NAV Fase 1** — Navbar 5 seções | v3.32.0 | P2 | Define onde tudo vai. Só navbar, sem lógica. Cockpit já tem saldo (RF-068) + forecast (RF-067) + burn rate (RF-069) |
| 6 | **NRF-NAV Fase 2** — Consolidação de páginas | v3.33.0 | P2 | Merge de Projeções + Planejamento na seção Futuro. Absorve ENH-005. |
| 7 | **ENH-004** — UX tela fatura | v3.34.0+ | P3 | Polish operacional, após estrutura gerencial estabelecida |
| 8 | **ENH-002** — Bulk categorização | v3.34.0+ | P3 | Polish operacional, após estrutura gerencial estabelecida |

**Nota sobre o iOS:** iOS Fase 2 (#77–#80) permanece bloqueado (requer Mac/Xcode). Quando desbloqueado, é P0 e entra em paralelo sem afetar a sequência acima.

---

## 10. iOS e Experiência Mobile

### Decisão estratégica

A NRF-NAV prevê `mobile.html` como entry point leve para iOS. A decisão original de excluir import, forecast e patrimônio da versão mobile deve ser revisitada:

**O controller consulta o saldo projetado no celular enquanto está na fila do supermercado, não no computador de casa.** Se a persona é um controller familiar, tirar o forecast da versão mobile é tirar a ferramenta principal de decisão.

### Requisitos mínimos para mobile.html

| Funcionalidade | Incluir? | Justificativa |
|---|---|---|
| Saldo real por conta (RF-068) | **Sim** | Pergunta H1 — a mais frequente e mobile |
| Resumo de forecast (próximos 3 meses) | **Sim** | KPI compacto, sem gráfico completo |
| Burn rate / alertas de estouro | **Sim** | Alertas cabem em qualquer tela |
| Card Próxima Fatura (RF-065) | **Sim** | Já existe e é leve |
| Registro rápido de despesa/receita | **Sim** | Operação mais frequente em mobile |
| Import de extratos | **Não** | Fluxo complexo, melhor no desktop |
| Patrimônio completo | **Não** | Consulta semanal, melhor no desktop |
| Gráfico de forecast detalhado | **Não** | Gráfico completo em tela pequena perde valor |

### Impacto no roadmap iOS

A definição de `mobile.html` é parte da NRF-NAV Fase 2 (v3.33.0). As issues de iOS Fases 3–5 (#81–#89) devem ser revisadas após NRF-NAV Fase 1 estar no ar — o redesenho de navegação muda os requisitos de UX mobile.

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

---

*Este documento deve ser atualizado a cada sessão PO em que decisões de produto de alto impacto forem tomadas. Não é um backlog — é uma bússola.*
