# Bússola de Produto — Minhas Finanças

> Documento de referência estratégica para a revisão geral da solução.
> Criado em: 2026-04-15 | Sessão PO Cowork | Autor: Luigi (PO) + PO Assistant
> **Propósito:** Este documento serve como norte para todas as decisões de roadmap, redesenho de UX e priorização de RFs. Deve ser lido antes de qualquer sessão de redesenho de produto.

---

## 1. A Persona Central

**Luigi e Ana — Controller Financeiro Familiar**

Não são usuários casuais de app de finanças. São gestores ativos de uma unidade financeira familiar que precisam de **controle, previsibilidade e visão prospectiva** — não apenas registro de gastos.

A analogia correta não é "aplicativo de finanças pessoais". É um **escritório financeiro familiar simplificado (family office)** — com as mesmas necessidades de visibilidade, forecast e controle patrimonial de um CFO, porém em escala doméstica.

**O que um controller familiar precisa tomar decisões:**
- Saber quanto tem disponível *agora* (liquidez)
- Saber se está executando o orçamento dentro do planejado *neste mês*
- Saber como estará financeiramente nos *próximos 6–12 meses*
- Saber se o patrimônio líquido está crescendo ao longo do tempo

---

## 2. Os Três Horizontes de Gestão

Todo o design do produto deve ser avaliado contra estes três horizontes. Cada tela, cada KPI, cada RF deve servir a um deles.

| Horizonte | Pergunta central | Urgência | Frequência de consulta |
|---|---|---|---|
| **H1 — Hoje / Semana** | Tenho caixa? Consigo pagar o que vence? | Alta | Diária |
| **H2 — Mês** | Estou dentro do orçamento? Vou estourar? | Média | 2–3x por semana |
| **H3 — Futuro (6–12m)** | Como estarei em março? Meu patrimônio está crescendo? | Alta (planejamento) | Semanal |

### Diagnóstico atual por horizonte

| Horizonte | Cobertura atual | Avaliação |
|---|---|---|
| H1 — Liquidez imediata | Dados existem (contas.html), mas não são KPI | ❌ Não coberto como experiência |
| H2 — Execução mensal | Dashboard + Orçamentos + Planejamento | ✅ Bem coberto |
| H3 — Futuro e patrimônio | Fluxo de Caixa (só passado) + aba Projeções (só parcelas) | ❌ Praticamente ausente |

**Problema central:** o produto tem o eixo invertido. Trata o passado e o presente como centro de gravidade. Para uma ferramenta de controller familiar, o eixo deveria ser o futuro.

---

## 3. Diagnóstico da Arquitetura Atual

### O problema de origem

O produto foi construído "de baixo para cima" — RF por RF, página por página, sem um modelo mental de uso que respondesse à pergunta central: **quem usa isso e que decisão precisa tomar agora?**

Resultado: 14 páginas semi-autônomas com navegação horizontal de botões, sem hierarquia de importância. Uma tela de conferência de compras (fatura.html) tem o mesmo peso visual de navegação que o cockpit gerencial (dashboard.html).

### As 14 páginas e seus papéis reais

| Página | Papel real | Horizonte | Frequência de uso |
|---|---|---|---|
| `dashboard.html` | Controle orçamentário mensal por categoria | H2 | Alta |
| `fatura.html` | Conferência de compras do cartão por ciclo | H1 / H2 | Alta |
| `fluxo-caixa.html` | Análise histórica anual | H2 (passado) | Baixa |
| `planejamento.html` | Previsto vs. realizado mensal | H2 | Média |
| `orcamentos.html` | Configuração de limites | Configuração | Baixa |
| `despesas.html` | Listagem e CRUD de despesas | Operacional | Média |
| `receitas.html` | Listagem e CRUD de receitas | Operacional | Baixa |
| `importar.html` | Pipeline de ingestão de extratos | Operacional | Alta (semanal) |
| `base-dados.html` | CRUD da base completa | Operacional | Baixa |
| `contas.html` | Gestão de contas e cartões | Configuração | Baixa |
| `categorias.html` | Gestão de categorias | Configuração | Baixa |
| `grupo.html` | Configuração do grupo familiar | Configuração | Muito baixa |
| `login.html` / `index.html` | Auth | — | — |

**Observação crítica:** das 14 páginas, apenas 4 são de consulta gerencial frequente (dashboard, fatura, planejamento, fluxo-caixa). As demais são operacionais ou de configuração. A navegação atual não reflete essa diferença de prioridade.

---

## 4. Gaps Críticos de Produto

### Gap 1 — Forecast de caixa (o mais importante)

**O que falta:** uma visão que mostre, mês a mês pelos próximos 6–12 meses, o saldo projetado considerando receitas esperadas, despesas recorrentes detectadas e parcelas comprometidas.

**Por que é crítico:** é o principal instrumento de um controller. Sem forecast, o app só confirma o que já aconteceu.

**Ingredientes já existentes no código:**
- `recurringDetector.js` detecta despesas e receitas recorrentes com alta confiabilidade
- `tipo: 'projecao'` já existe no Firestore para parcelas futuras de cartão
- `planejamento.js` já une orçamentos + recorrentes + parcelas num único mês

**O que falta construir:** uma extensão do fluxo-caixa que projete os meses futuros usando esses ingredientes, resultando em: *"Em junho, você tem R$ 2.800 comprometidos em parcelas, R$ 4.200 em despesas recorrentes estimadas, e R$ 8.500 de receita esperada — saldo projetado: +R$ 1.500."*

**RF sugerido:** RF-FORECAST (ver seção 6)

---

### Gap 2 — Saldo atual das contas não é KPI

**O que falta:** o saldo das contas bancárias acessível como indicador na home.

**Por que é crítico:** a pergunta H1 mais básica de um controller é "quanto tenho no Itaú agora?". O app não responde isso. Mostra "saldo do mês" (receitas - despesas do mês), que é diferente de saldo bancário real.

**Limitação técnica subjacente:** o modelo de dados é baseado em transações (extrato), não em saldo de conta. A coleção `contas` não tem campo `saldo` atualizado automaticamente. Isso precisa ser resolvido como pré-requisito para o forecast ter sentido.

**RF sugerido:** RF-SALDO-CONTAS (pré-requisito para RF-FORECAST)

---

### Gap 3 — RF-066 foi especificado estreito demais

**O que está planejado:** página Ativos/Passivos + coleção `patrimônio` no Firestore — um balanço estático de net worth.

**O que um controller precisa além disso:**
- Variação patrimonial mês a mês (o patrimônio cresceu ou diminuiu em relação ao mês anterior?)
- Taxa de poupança efetiva (qual % da renda está sendo acumulada?)
- Projeção patrimonial simples ("se poupar R$ X/mês, em 24 meses patrimônio = Y")

**Avaliação:** o RF como especificado entrega um snapshot, não uma ferramenta de controle. Precisa de revisão de escopo.

---

### Gap 4 — Taxa de execução orçamentária projetada

**O que falta:** dado que estamos no dia 15 do mês e consumimos 70% do orçamento de alimentação, o app deveria indicar que o ritmo atual levará a um estouro de R$ 400 até o fim do mês.

**O que existe hoje:** "gastou X de um limite de Y" — estático, sem projeção intramês.

**Por que é controloria real:** um controller não age apenas quando o limite estoura — age quando o ritmo indica que vai estourar.

---

### Gap 5 — Projeções e Planejamento são visões duplicadas sem integração

**O problema:** `fatura.html` tem a aba Projeções (parcelas futuras de cartão). `planejamento.html` também mostra essas parcelas misturadas com recorrentes e orçamentos. São duas visões do mesmo dado sem narrativa unificada.

**O que o controller precisa:** uma única timeline de compromissos futuros consolidada — "nos próximos 90 dias, tenho X em parcelas + Y em recorrentes + Z de próxima fatura = W total comprometido". Isso substitui e supera ambas as visões atuais.

---

## 5. Crítica à NRF-NAV Proposta

### Estrutura atual planejada (5 seções)

```
Início | Fatura | Ano | Patrimônio | Transações | ⚙️ Configurações
```

### O problema desta estrutura

Ela eleva o **operacional** ao mesmo nível do **gerencial**.

"Fatura" como seção principal é conferência de compras — operacional. "Ano" (fluxo de caixa) é análise do passado. O controller não começa o dia na fatura nem no histórico anual. Começa no **cockpit**, que mostra o estado financeiro completo agora e o que está por vir.

### Estrutura alternativa sugerida — orientada ao controller

```
Cockpit | Futuro | Histórico | Transações | ⚙️ Configurações
```

| Seção | Conteúdo | Horizonte |
|---|---|---|
| **Cockpit** | Saldo das contas agora, execução orçamentária do mês, alertas críticos (fatura prestes a vencer, categoria estourando, saldo baixo) | H1 + H2 |
| **Futuro** | Saldo projetado próximos 6 meses, compromissos futuros (parcelas + recorrentes + próximas faturas), projeção patrimonial | H3 |
| **Histórico** | Fluxo anual, análise por categoria, evolução patrimonial mês a mês | H2 passado |
| **Transações** | Importar, base de dados, conferir fatura, corrigir, exportar | Operacional |
| **Configurações** | Categorias, contas, orçamentos, grupo | Configuração |

Nesta estrutura:
- Fatura passa a ser uma **visão dentro de Transações** (conferência) e dentro de **Futuro** (próximas faturas e parcelas)
- Planejamento e Projeções se fundem na seção **Futuro**
- O dashboard atual se transforma em **Cockpit**, com KPIs de liquidez (H1) integrados aos de execução (H2)

---

## 6. RFs Faltantes — Sugestão de Novos Requisitos

### RF-SALDO-CONTAS (pré-requisito)

Calcular e exibir saldo atual de cada conta bancária a partir do histórico de transações importadas. Exibir como KPI no Cockpit. Pré-requisito para RF-FORECAST ter sentido financeiro.

### RF-FORECAST — Projeção de Caixa 6 Meses

Visão prospectiva mês a mês, combinando:
- Receitas recorrentes detectadas (via `recurringDetector.js`)
- Despesas recorrentes detectadas (via `recurringDetector.js`)
- Parcelas de cartão comprometidas (via `tipo: 'projecao'` existente)
- Orçamentos como teto de gastos variáveis
- Resultado: saldo projetado mês a mês para os próximos 6–12 meses

Seria a extensão prospectiva de `fluxo-caixa.html`, usando ingredientes já existentes no código.

### RF-BURN-RATE — Execução Projetada do Mês Atual

No dashboard/cockpit, além de "gastou X de Y", mostrar: "no ritmo atual, você vai gastar Z até o fim do mês" — com alerta visual para categorias que projeta estouro.

### RF-066 Revisado — Patrimônio com Evolução e Projeção

Expandir além do balanço estático para incluir:
- Histórico de net worth mês a mês (gráfico de evolução)
- Taxa de poupança efetiva (% da renda que está acumulando)
- Projeção patrimonial simples com juros compostos

---

## 7. Avaliação do Roadmap Atual (UX & Gestão Patrimonial)

| Item | Status | Avaliação |
|---|---|---|
| NRF-NAV — reorganização de navegação | Planejado | ✅ Decisão correta, estrutura revisável conforme seção 5 |
| RF-066 — Patrimônio / Ativos / Passivos | Planejado | ⚠️ Escopo estreito — revisar conforme seção 4.3 |
| RF-065 — Card Próxima Fatura na home | Planejado | ⚠️ Incompleto sem saldo de conta (Gap 2) |
| ENH-004 — UX tela fatura | Planejado | ✅ Faz sentido, mas prioridade P2 adequada |
| ENH-002 — Bulk categorização | Planejado | ⚠️ Operacional puro — pode ceder espaço para gaps gerenciais |
| ENH-005 — Widget parcelamentos → Fatura | Planejado | ✅ Correto |
| **RF-FORECAST — Forecast 6 meses** | **Ausente** | ❌ Gap mais crítico — deve entrar no roadmap |
| **RF-SALDO-CONTAS** | **Ausente** | ❌ Pré-requisito para Cockpit e Forecast |
| **RF-BURN-RATE** | **Ausente** | ❌ Controloria do mês atual |

---

## 8. Princípios de Design para a Revisão Geral

Estes princípios devem guiar qualquer nova tela, RF ou redesenho:

**P1 — Futuro antes do passado.** O controller precisa mais de saber o que vai acontecer do que confirmar o que já aconteceu. Toda tela deve ter uma dimensão prospectiva.

**P2 — Contexto antes do detalhe.** O cockpit mostra o estado geral. O detalhe (lista de transações, análise por categoria) é drill-down, não ponto de entrada.

**P3 — Dados agregados antes de registros.** KPIs e indicadores têm mais valor imediato do que tabelas de transações. As tabelas existem para explicar os KPIs, não como conteúdo principal.

**P4 — Alertas proativos.** O app deve vir ao controller com informações relevantes ("sua fatura do XP vence em 5 dias e representa 40% do seu saldo disponível"), não esperar que o controller vá até o app procurar o problema.

**P5 — Uma única fonte da verdade por contexto.** Acabar com a duplicação de Projeções (fatura.html) e Planejamento (planejamento.html). Cada dado financeiro deve ter uma única tela canônica.

---

## 9. Ordem de Ataque Sugerida

Com base nos gaps identificados e nos princípios acima, a ordem de ataque recomendada para a revisão geral é:

1. **NRF-NAV revisada** (com a estrutura Cockpit/Futuro/Histórico/Transações/Config) — define onde tudo vai antes de construir
2. **RF-SALDO-CONTAS** — habilita o Cockpit a responder H1
3. **RF-066 Revisado** — balanço patrimonial + evolução + taxa de poupança
4. **RF-FORECAST** — o maior salto qualitativo do produto
5. **RF-BURN-RATE** — complemento do Cockpit para H2
6. **ENH restantes** (ENH-004, ENH-002) — polish depois da estrutura nova estabelecida

---

*Este documento deve ser atualizado a cada sessão PO em que decisões de produto de alto impacto forem tomadas. Não é um backlog — é uma bússola.*
