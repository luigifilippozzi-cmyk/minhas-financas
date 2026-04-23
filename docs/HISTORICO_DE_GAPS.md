# Histórico de Gaps Críticos — Minhas Finanças

> Arquivo extraído da BUSSOLA_PRODUTO.md §4 em 2026-04-22.
> Propósito: preservar o diagnóstico original dos 5 gaps estruturais identificados em 2026-04-15/16 e a resposta do roadmap a cada um.
> Status consolidado (v3.39.8): todos os 5 gaps fechados. Este arquivo é histórico, não backlog.

---

## Tabela-resumo — status atual por gap

| Gap | Resposta do roadmap | Versão entregue | Status |
|---|---|---|---|
| 1 — Saldo real por conta ausente | RF-068 | v3.29.0 (PR #174) | Fechado |
| 2 — Forecast projeta fluxo, não saldo | RF-067 + evolução pós-RF-068 | v3.28.0 (PR #168) | Fechado (base) |
| 3 — RF-066 escopo estreito | RF-066 expandido | v3.31.0 (PR #178) | Fechado |
| 4 — Burn rate ausente | RF-069 | v3.30.0 (commit 0ee3e18) | Fechado |
| 5 — Projeções e Planejamento duplicados | NRF-NAV F2 (projecoesCartao unificado) | v3.37.0 (PR #187) | Fechado |

---

## Detalhamento Original dos 5 Gaps (conservado)

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

*Quando novos gaps estruturais forem identificados pelo PO, registrar primeiro na BUSSOLA (§ a criar) e migrar para este arquivo após serem resolvidos.*
