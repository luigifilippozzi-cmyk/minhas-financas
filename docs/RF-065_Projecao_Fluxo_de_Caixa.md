# RF-065: Projeção de Fluxo de Caixa — Visão Prospectiva de 3 Meses

**Prioridade:** Alta | **Versão:** TBD | **Status:** ⚪ Pendente

---

## Motivação

Hoje o app oferece visão retrospectiva (NRF-003 — Fluxo de Caixa anual) e planejamento do mês corrente (RF-060 — Planejamento Mensal), mas **não responde à pergunta mais importante da gestão financeira familiar: "como estaremos daqui a 3 meses?"**.

As peças já existem isoladamente — orçamentos por categoria, parcelas projetadas (`tipo='projecao'`), detecção de recorrentes, receitas registradas — mas não há uma visão consolidada que combine essas fontes em uma projeção de fluxo de caixa futuro com grau de confiança.

### Problema real

Luigi e Ana definem orçamentos para o mês atual, mas não conseguem ver automaticamente o impacto acumulado nos meses seguintes. Se há uma parcela de R$ 500 em 6x, parcelas projetadas aparecem em despesas, mas não há cruzamento com receitas esperadas nem com o orçamento projetado — tornando impossível saber se o mês 3 terá saldo positivo ou negativo.

### Princípios de gestão financeira aplicados

- **Projeção contínua (rolling forecast):** orçamento do mês atual serve de base para os próximos, evitando retrabalho mensal
- **Classificação por certeza:** despesas confirmadas (parcelas) vs. prováveis (recorrentes) vs. estimadas (orçamento) recebem tratamento visual distinto
- **Visão líquida:** receitas projetadas menos despesas projetadas = saldo líquido esperado, o indicador mais útil para decisão

---

## Descrição Funcional

### 1. Propagação Automática de Orçamento (Budget Carry-Forward)

O orçamento definido para o mês atual é automaticamente replicado para os 3 meses seguintes como referência de projeção, **sem criar novos documentos `orcamentos` no Firestore** — a propagação é calculada em tempo de exibição.

**Regras de propagação:**
- Se o mês M tem orçamento definido para categoria X → meses M+1, M+2, M+3 herdam esse valor como "orçamento projetado"
- Se o mês M+1 já tem orçamento próprio definido pelo usuário → o valor próprio prevalece (override explícito)
- Se o mês M tem orçamento = 0 (desativado) → não propaga
- A propagação parte sempre do **último mês com orçamento explícito** para cada categoria

**Justificativa:** Na prática, a maioria das famílias mantém orçamentos estáveis mês a mês. Propagar automaticamente elimina o trabalho manual de redefinir limites todo mês e permite que a visão de fluxo de caixa tenha dados de referência imediatos.

### 2. Projeção de Receitas e Recebíveis

Receitas recorrentes são projetadas para os próximos 3 meses usando a mesma lógica de detecção que o RF-060 usa para despesas, adaptada para a coleção `receitas`.

**Fontes de projeção de receitas:**

| Fonte | Confiança | Exemplo |
|-------|-----------|---------|
| Receita presente nos meses N-1 e N-2 com variação ≤ 5% | **Alta** | Salário CLT |
| Receita presente nos meses N-1 e N-2 com variação 5–15% | **Média** | Freelance recorrente |
| Meta de receita definida em orçamento (RF-061: `tipo='receita'`) | **Referência** | Meta de vendas |

**Regras:**
- `recurringDetector.js` já compara N-1 e N-2 para despesas; a mesma função será parametrizada para aceitar receitas
- Receitas com confiança alta/média são projetadas como "receita esperada" nos meses M+1, M+2, M+3
- Metas de receita (orçamento de categoria receita) seguem a mesma regra de carry-forward da seção 1

### 3. Consolidação das Fontes de Projeção

O motor de projeção combina 5 fontes em uma visão unificada por mês:

| # | Fonte | Tipo | Confiança | Cor sugerida |
|---|-------|------|-----------|-------------|
| 1 | Parcelas futuras (`tipo='projecao'`) | Despesa | **Confirmada** | Vermelho sólido |
| 2 | Despesas recorrentes detectadas | Despesa | **Alta/Média** | Vermelho tracejado |
| 3 | Orçamento propagado (carry-forward) | Despesa (teto) | **Referência** | Cinza |
| 4 | Receitas recorrentes detectadas | Receita | **Alta/Média** | Verde tracejado |
| 5 | Metas de receita propagadas | Receita (piso) | **Referência** | Verde claro |

**Cálculo do saldo projetado por mês:**

```
Receitas Projetadas = receitas recorrentes (alta+média) + metas propagadas (como fallback)
Despesas Projetadas = parcelas confirmadas + recorrentes (alta+média) + orçamento propagado (como teto)
Saldo Projetado = Receitas Projetadas - Despesas Projetadas
```

**Abordagem intermediária de confiança (nem cenário único, nem cenários múltiplos):**
- O valor exibido é a **estimativa base** (média das fontes disponíveis)
- Uma **banda de variação** é calculada: ±desvio padrão dos últimos 3 meses da categoria
- Visualmente: barra sólida = estimativa base, área sombreada = banda de variação
- Isso dá ao usuário noção de "o quanto pode variar" sem a complexidade de cenários otimista/pessimista

### 4. Interface — Nova Aba no Fluxo de Caixa

A tela existente `fluxo-caixa.html` (NRF-003) ganha uma **nova aba "Projeção 3M"** ao lado da visão anual existente.

#### Layout da aba "Projeção 3M"

**Cards de resumo (topo):**

| Card | Conteúdo |
|------|----------|
| Saldo Atual | Receitas - Despesas do mês corrente (realizado) |
| Saldo Projetado M+1 | Receita projetada - Despesa projetada do próximo mês |
| Saldo Projetado M+2 | Idem para 2 meses à frente |
| Saldo Projetado M+3 | Idem para 3 meses à frente |

Cada card usa código de cores: verde (saldo ≥ 0), vermelho (saldo < 0), e exibe a banda de variação como texto secundário (ex: "R$ 1.200 ± R$ 180").

**Gráfico de projeção (Chart.js):**
- Eixo X: mês atual + 3 meses seguintes (4 pontos)
- Barras empilhadas: receitas (verde) vs despesas por tipo (confirmada/provável/referência)
- Linha: saldo acumulado projetado
- Área sombreada: banda de variação do saldo
- Tooltip detalhado: breakdown de fontes ao hover

**Tabela de detalhamento:**

| Coluna | Descrição |
|--------|-----------|
| Mês | M (atual), M+1, M+2, M+3 |
| Receitas Confirmadas | Receitas já registradas (mês atual) |
| Receitas Projetadas | Recorrentes detectadas + metas |
| Parcelas | Soma de `tipo='projecao'` do mês |
| Recorrentes | Despesas recorrentes projetadas |
| Orçamento Ref. | Orçamento propagado (carry-forward) |
| Saldo Projetado | Receitas - Despesas |
| Variação | ± desvio padrão |
| Situação | Badge: Confortável / Apertado / Déficit |

**Badges de situação projetada:**

| Badge | Condição |
|-------|----------|
| ✅ Confortável | Saldo projetado > 20% das receitas |
| ⚠️ Apertado | Saldo projetado entre 0% e 20% das receitas |
| 🔴 Déficit | Saldo projetado < 0 |

#### Drill-down por mês
Clicar em uma linha da tabela expande para mostrar o breakdown por categoria:
- Categorias ordenadas por valor projetado (maior para menor)
- Cada categoria mostra: fonte da projeção, valor estimado, confiança
- Link rápido para o orçamento da categoria (para ajustar se necessário)

### 5. Alertas Proativos

Quando a projeção detectar situações de risco, exibir alertas visuais na aba Projeção e opcionalmente no Dashboard:

| Alerta | Condição | Ação sugerida |
|--------|----------|---------------|
| Déficit projetado | Saldo < 0 em qualquer mês futuro | "Revise orçamentos ou adie compras não essenciais" |
| Parcelas concentradas | Parcelas > 50% da receita projetada em algum mês | "Mês X tem alta concentração de parcelas" |
| Sem receita projetada | Nenhuma receita recorrente detectada | "Registre suas receitas fixas para projeção mais precisa" |

---

## Arquitetura Técnica

### Novos arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/js/utils/forecastEngine.js` | Motor de projeção: combina fontes, calcula bandas, classifica situação |
| `src/js/controllers/projecao.js` | Orquestrador: busca dados, invoca engine, formata para UI |
| `src/css/projecao.css` | Estilos da aba de projeção (tokens de `variables.css`) |

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/fluxo-caixa.html` | Nova aba "Projeção 3M" com tabs (Anual / Projeção) |
| `src/js/pages/fluxo-caixa.js` | Wiring da nova aba, instanciação do controller |
| `src/js/utils/recurringDetector.js` | Parametrizar para aceitar coleção (`despesas` ou `receitas`) |
| `src/js/services/database.js` | Nova função `buscarReceitasMes(grupoId, mes, ano)` (se não existir) |

### Modelo de dados — Sem novos documentos Firestore

A projeção é **calculada em tempo de exibição**, não persistida. Isso evita complexidade de sincronização e mantém o Firestore enxuto.

**Estrutura em memória (retorno do `forecastEngine`):**

```javascript
{
  meses: [
    {
      ano: 2026,
      mes: 5,                          // M+1
      receitas: {
        confirmadas: 0,                 // já registradas (só mês atual)
        projetadas: 8500,               // recorrentes detectadas
        meta: 9000,                     // orçamento/meta propagada
        confianca: 'alta',
        fontes: [
          { descricao: 'Salário Luigi', valor: 5000, origem: 'recorrente', confianca: 'alta' },
          { descricao: 'Salário Ana', valor: 3500, origem: 'recorrente', confianca: 'alta' }
        ]
      },
      despesas: {
        parcelas: 1200,                 // tipo='projecao' confirmadas
        recorrentes: 3800,              // detectadas alta/média
        orcamentoRef: 6000,             // carry-forward
        fontes: [
          { descricao: 'Parcela Geladeira 3/10', valor: 350, origem: 'parcela', confianca: 'confirmada' },
          { descricao: 'Aluguel', valor: 2200, origem: 'recorrente', confianca: 'alta' },
          // ...
        ]
      },
      saldoProjetado: 3500,             // receitas.projetadas - (parcelas + recorrentes)
      bandaVariacao: 420,               // ± desvio padrão
      situacao: 'confortavel'           // | 'apertado' | 'deficit'
    },
    // M+2, M+3...
  ],
  alertas: [
    { tipo: 'parcelas_concentradas', mes: 7, mensagem: 'Julho tem 55% da receita comprometida com parcelas' }
  ],
  metadata: {
    geradoEm: timestamp,
    mesesHistoricoUsados: 3,
    fontesPrincipais: ['parcelas', 'recorrentes', 'orcamento']
  }
}
```

### Lógica do `forecastEngine.js`

```
PARA cada mês M+1, M+2, M+3:

  1. PARCELAS CONFIRMADAS
     → Query: despesas WHERE tipo='projecao' AND data no mês alvo
     → Confiança: confirmada (100%)

  2. DESPESAS RECORRENTES
     → Invocar recurringDetector(despesasMesN1, despesasMesN2)
     → Filtrar confiança >= 'media'
     → Projetar valor médio dos 2 meses

  3. ORÇAMENTO PROPAGADO
     → Para cada categoria: buscar último mês com orcamento explícito ≤ mês alvo
     → Se encontrado e valor > 0 → usar como referência (teto)
     → Se mês alvo tem orcamento próprio → usar o próprio

  4. RECEITAS RECORRENTES
     → Invocar recurringDetector(receitasMesN1, receitasMesN2)
     → Projetar valor médio

  5. METAS DE RECEITA
     → Mesma lógica carry-forward do orçamento, para categorias tipo='receita'

  6. BANDA DE VARIAÇÃO
     → Para cada categoria: desvio padrão dos últimos 3 meses
     → Banda do mês = raiz quadrada da soma dos quadrados das bandas por categoria

  7. CLASSIFICAÇÃO
     → saldo / receitaTotal > 0.20 → 'confortavel'
     → saldo / receitaTotal > 0.00 → 'apertado'
     → saldo < 0 → 'deficit'

  8. ALERTAS
     → Verificar condições da tabela de alertas
```

---

## Dependências

| Dependência | Tipo | Status |
|-------------|------|--------|
| NRF-003 (Fluxo de Caixa) | Pré-requisito: página base | ✅ Implementado |
| RF-060 (Planejamento Mensal) | Pré-requisito: `recurringDetector.js` | ✅ Implementado |
| RF-061 (Categorias Despesa/Receita) | Pré-requisito: separação de tipos | ✅ Implementado |
| RF-014 (Gestão Multi-Usuário Cartão) | Pré-requisito: `tipo='projecao'` | ✅ Implementado |
| RF-062/063/064 (Cadeia reconciliação) | Independente: pode ser feito em paralelo | ⚪ Pendente |

> **Nota:** Este RF é independente da cadeia RF-062/063/064. Pode ser desenvolvido em paralelo pois usa os dados existentes no Firestore sem conflito de schema.

---

## Critérios de Aceitação

- [ ] Aba "Projeção 3M" acessível em `fluxo-caixa.html` com toggle Anual/Projeção
- [ ] Cards de saldo projetado para M+1, M+2, M+3 com código de cores e banda de variação
- [ ] Gráfico Chart.js renderiza barras de receita/despesa + linha de saldo + área de variação
- [ ] Tabela detalhada com drill-down por categoria ao clicar no mês
- [ ] Orçamento do mês corrente é propagado automaticamente para meses sem orçamento explícito
- [ ] Receitas recorrentes são detectadas e projetadas usando `recurringDetector` parametrizado
- [ ] Parcelas confirmadas (`tipo='projecao'`) aparecem como despesa confirmada na projeção
- [ ] Badges de situação (Confortável/Apertado/Déficit) calculados corretamente
- [ ] Alertas exibidos quando há déficit projetado ou concentração de parcelas
- [ ] Alerta "sem receita projetada" quando não há receitas recorrentes detectadas
- [ ] Projeção recalcula em tempo real via `onSnapshot` (sem persistência no Firestore)
- [ ] Nenhum novo documento criado no Firestore (tudo calculado em memória)
- [ ] Funciona corretamente no primeiro mês de uso (sem histórico: mostra apenas parcelas + orçamento)
- [ ] Testes unitários para `forecastEngine.js`: cenários com/sem histórico, bandas de variação, alertas
- [ ] Cores seguem tokens de `variables.css` (sem hardcode)
- [ ] Responsivo: tabela com scroll horizontal em mobile

---

## Estimativa de Esforço

| Componente | Complexidade | Estimativa |
|------------|-------------|------------|
| `forecastEngine.js` (motor de projeção) | Alta | 2-3 sessões Dev Manager |
| Parametrização `recurringDetector.js` | Baixa | 1 sessão |
| UI aba Projeção 3M (HTML + CSS + Chart.js) | Média | 2 sessões |
| Controller + wiring `fluxo-caixa.js` | Média | 1 sessão |
| Testes unitários `forecastEngine` | Média | 1-2 sessões |
| Testes integração + revisão | Baixa | 1 sessão |
| **Total estimado** | | **7-10 sessões** |

---

## Evolução Futura (fora de escopo deste RF)

Itens que podem ser considerados em RFs futuros, mas não fazem parte deste:

- **Horizonte 6/12 meses:** extensão do horizonte com decaimento de confiança
- **Cenários otimista/pessimista:** sliders para ajustar premissas
- **Projeção de parcelas novas:** simular "se eu comprar X em 12x, como fica?"
- **Sazonalidade avançada:** detectar padrões como 13º salário, IPTU, IPVA
- **Notificações push:** alerta de déficit projetado via FCM (depende iOS Fase 2)
- **Exportação:** relatório PDF/XLSX da projeção para planejamento offline
