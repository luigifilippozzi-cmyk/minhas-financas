# 📋 Requisitos Funcionais — Minhas Finanças

| # | Requisito | Prioridade | Status |
|---|-----------|-----------|--------|
| RF-001 | Autenticação de Usuários | Alta | ✅ Implementado |
| RF-002 | Gerenciamento de Grupos Familiares | Alta | ✅ Implementado |
| RF-003 | Gerenciamento de Categorias | Alta | ✅ Implementado |
| RF-004 | Orçamento Mensal por Categoria | Alta | ✅ Implementado |
| RF-005 | Registro de Despesas | Alta | ✅ Implementado |
| RF-006 | Visualização de Despesas | Alta | ✅ Implementado |
| RF-007 | Edição de Despesas | Média | ✅ Implementado |
| RF-008 | Exclusão de Despesas | Média | ✅ Implementado |
| RF-009 | Dashboard de Orçamentos | Alta | ✅ Implementado |
| RF-010 | Filtros e Período | Média | ✅ Implementado |
| RF-011 | Sincronização em Tempo Real | Alta | ✅ Implementado |
| RF-012 | Exportação de Dados | Baixa | ✅ Implementado |
| RF-013 | Pipeline Unificado de Ingestão (v3.0.0) | Alta | ✅ Implementado |
| RF-014 | Gestão Multi-Usuário de Cartão de Crédito | Alta | ✅ Implementado |
| RF-015 | Recuperação de Senha | Média | ✅ Implementado |
| RF-016 | Gestão de Receitas | Alta | ✅ Implementado |
| RF-017 | Dashboard como Tela Inicial — Gráficos e Indicadores | Alta | ✅ Implementado |
| RF-018 | Centralização da Base de Dados — Importação, Deduplicação e Purge | Alta | ✅ Implementado |
| NRF-001 | Contas Compartilhadas (divisão conjunta) | Alta | ✅ Implementado |
| NRF-002 | Reconciliação Fuzzy de Parcelas + CSV Nativo de Cartão | Média | ✅ Implementado |
| NRF-002.2 | Ajustes Parciais Marketplace/Supermercado (iFood, Mambo…) | Média | ✅ Implementado |
| NRF-003 | Fluxo de Caixa — Visão Orçamentária Anual | Alta | ✅ Implementado |
| NRF-004 | Identificação de Conta/Banco por Transação | Alta | ✅ Implementado |
| NRF-005 | Fatura do Cartão de Crédito | Alta | ✅ Implementado |
| NRF-006 | Detecção Automática de Tipo de Extrato | Alta | ✅ Implementado |
| NRF-007 | _(Reservado — não definido)_ | — | 🔲 N/A |
| NRF-008 | Deduplicação de Transações | Alta | ✅ Implementado |
| NRF-009 | Responsável por Transação no Import | Média | ✅ Implementado |
| RF-019 | Correção: Preenchimento Automático de Conta/Banco no Preview | Alta | ✅ Implementado |
| RF-020 | Classificação Automática por Sinal + Importação PDF | Alta | ✅ Implementado |
| RF-021 | Motor de Detecção, Roteamento e Identificação de Banco | Alta | ✅ Implementado |
| RF-022 | Auto Categorização Inteligente Sensível à Origem | Alta | ✅ Implementado |
| RF-023 | Edição em Massa de Transações — Responsável Dinâmico | Alta | ✅ Implementado |
| NRF-010 | Portador "Conjunto" no Upload de Fatura de Cartão | Alta | ✅ Implementado |
| RF-024 | Importação de Extrato Bancário via Template XLSX | Alta | ✅ Implementado |
| RF-060 | Planejamento Mensal — Visão Unificada de Despesas Previstas | Alta | ✅ Implementado |
| RF-061 | Categorias e Orçamentos — Separação Despesa vs Receita | Alta | ✅ Implementado |
| RF-062 | Cartões de Crédito como Contas Individuais | Alta | ✅ Implementado (v3.21.0, PR #128) |
| RF-063 | Transferências Intra-Grupo (Settlement entre Membros) | Alta | ✅ Implementado (v3.22.0, PR #132) |
| RF-064 | Reconciliação de Pagamento de Fatura de Cartão | Alta | ✅ Implementado (v3.23.0, PR #134) |
| RF-065 | Card "Próxima Fatura" no Dashboard + deep link `?tab=projecoes` | Média | ✅ Implementado (v3.27.0, PR #167) |
| RF-066 | Patrimônio Ativos/Passivos com Evolução e Taxa de Poupança | Alta | ✅ Implementado (v3.31.0, PR #178) |
| RF-067 | Forecast de Caixa Prospectivo 6 Meses | Alta | ✅ Implementado (v3.28.0, PR #168) |
| RF-068 | Saldo Real por Conta no Cockpit do Dashboard | Alta | ✅ Implementado (v3.29.0, PR #174) |
| RF-069 | Burn Rate por Categoria (Ritmo de Gasto) | Média | ✅ Implementado (v3.30.0, commit `0ee3e18`) |

---

## RF-001: Autenticação de Usuários
**Prioridade:** Alta | **Versão:** v0.1.0 | **Status:** ✅ Implementado

- Usuário pode criar conta com email e senha
- Usuário pode fazer login com email e senha
- Usuário pode fazer logout
- Senha com mínimo de 6 caracteres
- Validação de formato de email

## RF-002: Gerenciamento de Grupos Familiares
**Prioridade:** Alta | **Versão:** v0.2.0 | **Status:** ✅ Implementado

- Usuário pode criar novo grupo familiar
- Sistema gera código de convite de 6 caracteres
- Outro usuário pode entrar no grupo usando o código
- Máximo de 2 usuários por grupo (fase inicial)

## RF-003: Gerenciamento de Categorias
**Prioridade:** Alta | **Versão:** v0.3.0 | **Status:** ✅ Implementado

- 6 categorias padrão são criadas ao criar um grupo
- CRUD completo: criar, editar (nome, emoji, cor, orçamento) e desativar (soft-delete)
- Ambos os membros do grupo podem editar categorias em tempo real (onSnapshot)
- Campos: nome, emoji, cor (hex), orçamento mensal (opcional)
- Desativação preserva histórico de despesas vinculadas

## RF-004: Orçamento Mensal por Categoria
**Prioridade:** Alta | **Versão:** v0.4.0 | **Status:** ✅ Implementado

- Definir limite de orçamento por categoria para cada mês
- Edição inline com salvamento automático (debounce 800ms + blur/Enter)
- Sync bidirecional em tempo real: ajuste de um usuário atualiza imediatamente para o outro
- Navegação entre meses (‹ Março 2026 ›)
- Botão "Copiar orçamentos do mês anterior" (não sobrescreve valores já definidos)
- Chips de resumo: Total Orçado / Gasto / Disponível com atualização em tempo real
- ID composto no Firestore (grupoId_categoriaId_ano_mes) garante upsert sem conflito

## RF-005 / RF-006 / RF-007 / RF-008 / RF-010 / RF-011: Registro e Gestão de Despesas
**Prioridade:** Alta | **Versão:** v0.5.0 | **Status:** ✅ Implementado

- Página dedicada `despesas.html` com CRUD completo
- **Criar** despesa: descrição, valor, categoria (com emoji/cor), data
- **Editar** despesa: modal pré-preenchido com todos os campos
- **Excluir** despesa: modal de confirmação antes da remoção definitiva
- Sincronização bidirecional em tempo real via Firestore `onSnapshot`:
  - Qualquer criação, edição ou exclusão feita por um usuário é refletida
    imediatamente na tela do outro membro do grupo, sem reload
- Navegação entre meses (‹ / ›)
- Filtro por categoria e busca por descrição (filtros locais, sem re-query)
- Chips de resumo: Total do mês e quantidade de registros
- Badge de categoria colorida em cada item da lista
- Sync banner visual com indicador pulsante de conexão em tempo real
- Integração no dashboard (index.html): lista de despesas do período com categorias
- Categorias populadas dinamicamente no select do formulário

## RF-009: Dashboard de Orçamentos
**Prioridade:** Alta | **Versão:** v0.5.0 | **Status:** ✅ Implementado

- Página principal (index.html) mostra todas as categorias com orçamento, gasto e percentual
- Seletor de período (mês/ano) atualiza listeners em tempo real
- Cards de categoria com barra de progresso colorida:
  - 🟢 Verde: 0–70% do orçamento
  - 🟡 Amarelo: 70–90% do orçamento
  - 🔴 Vermelho: 90–100% do orçamento
  - ⚠️ Crítico: >100% do orçamento
- Cards de totais: Total Orçado / Total Gasto / Disponível

## RF-012: Exportação de Dados
**Prioridade:** Baixa | **Versão:** v0.6.0 | **Status:** ✅ Implementado

- Botão "📥 Exportar CSV" na página de Despesas
- Gera arquivo `despesas-{mês}-{ano}.csv` com as despesas do período visualizado
- Colunas: Data, Descrição, Categoria, Emoji, Valor (R$)
- Separador ";" e BOM UTF-8 para compatibilidade com Excel (pt-BR)
- Despesas ordenadas por data no arquivo exportado
- Alerta informativo se não houver despesas no período

## RF-013: Pipeline Unificado de Ingestão e Processamento
**Prioridade:** Alta | **Versão:** v3.0.0 | **Status:** ✅ Implementado

`importar.js` refatorado como orquestrador fino. Toda lógica de parsing, classificação, projeções e deduplicação distribuída em módulos independentes e testáveis.

### Módulos criados

| Módulo | Localização | Responsabilidade |
|--------|-------------|-----------------|
| `normalizadorTransacoes.js` | `utils/` | Parsing puro CSV/XLSX; normalização de data/valor/parcela; geração de chave dedup; inferência de conta |
| `deduplicador.js` | `utils/` | Marcação de duplicatas (matching exato + fuzzy Levenshtein ≥ 85%) sem acesso ao Firestore |
| `pipelineBanco.js` | `pages/` | Parse de extrato bancário + PDF; classificação por sinal (RF-020) |
| `pipelineCartao.js` | `pages/` | Parse de fatura de cartão; filtro de créditos; ajuste de mês; geração de projeções (RF-014) |

### Arquitetura do orquestrador

```
processarArquivo(file)
  │
  ├─ CSV/XLSX → parsearLinhasCSVXLSX()      [normalizadorTransacoes.js]
  ├─ PDF      → parsearLinhasPDF()          [pipelineBanco.js]
  │
  ├─ detectarOrigemArquivo()               [detectorOrigemArquivo.js — RF-021]
  ├─ _recategorizarComOrigem()             [categorizer.js — RF-022]
  │
  ├─ _aplicarTipo('cartao')
  │     → filtrarCreditos()               [pipelineCartao.js]
  │     → aplicarMesFatura()              [pipelineCartao.js]
  │
  ├─ _aplicarTipo('banco')
  │     → classificarBanco()              [pipelineBanco.js]
  │
  └─ marcarDuplicatas()
        → fetch Firestore (inline)
        → marcarLinhasDuplicatas()        [deduplicador.js]
```

### Funções migradas do importar.js

`parsearLinhasExtrato`, `gerarChaveDedup`, `normalizarParcela`, `parsearParcela`, `gerarProjecoes`, `inferirContaDaDescricao`, `normalizarValorXP`, `normalizarData`, `_normalizarDataPDF`, `parsearLinhasPDF`, `aplicarMesFatura`, `parsearCSVTexto`

### Invariantes mantidas

- Comportamento externo 100% idêntico (nenhuma mudança na UI ou no Firestore)
- `parsearLinhasCSVXLSX` parametrizado com `{contas, categorias, mapaHist, origemBanco}` substituindo closures sobre estado global
- `deduplicador.js` é função pura: Firestore fetching permanece em `importar.js`

## RF-014: Gestão Multi-Usuário de Cartão de Crédito
**Prioridade:** Alta | **Versão:** v0.8.0 | **Status:** ✅ Implementado

### Deduplicação de Imports
- Chave única por transação: `{estab}||{valor}||{portador}||{parcela}` (parceladas) ou `{data}||{estab}||{valor}||{portador}` (únicas)
- Ao fazer upload, verifica Firestore em tempo real e marca duplicatas no preview
- Duplicatas ficam desmarcadas por padrão; usuário pode forçar re-importação
- Qualquer usuário do grupo pode importar extratos sem risco de duplicação

### Projeção de Parcelas Futuras
- Ao importar parcela "N/M", gera automaticamente as parcelas N+1..M para os meses seguintes
- Cada parcela futura é salva com `tipo: 'projecao'` e `parcelamento_id` compartilhado
- Projeções aparecem na lista de Despesas dos meses futuros com estilo diferenciado (bordas roxas)
- Quando o extrato real chegar no mês seguinte, a parcela real é marcada como "duplicada da projeção"

### Visibilidade de Parcelamentos em Aberto
- Painel "💳 Parcelamentos em Aberto" no Dashboard (index) e em Despesas
- Mostra total pendente por responsável e por compra
- Agrupamento por `parcelamento_id` para exibir 1 linha por compra (com qtd de parcelas restantes)
- Painel ocultável via toggle ▾/▸

### Campo Responsável
- Campo "Responsável" no formulário de Nova/Editar Despesa (dropdown com membros do grupo)
- Para despesas importadas: responsável = portador (nome do titular do cartão no extrato)
- Chips de total por responsável no resumo mensal da página de Despesas
- Filtro de lista por responsável (dropdown "Todos os responsáveis")
- CSV exportado inclui coluna "Responsável"

## RF-015: Recuperação de Senha
**Prioridade:** Média | **Versão:** v1.1.0 | **Status:** ✅ Implementado

- Usuário pode solicitar link de recuperação de senha diretamente na tela de login
- Link "Esqueceu sua senha?" visível abaixo do botão "Entrar" no formulário de login
- Ao clicar, exibe seção de recuperação com campo de e-mail e botão "Enviar link de recuperação"
- Firebase envia e-mail com link de redefinição para endereços cadastrados
- Resposta genérica de sucesso: "Se este e-mail estiver cadastrado, você receberá um link em breve" (não revela se o e-mail existe — boa prática de segurança)
- Erros de e-mail inválido são mostrados ao usuário em português
- Botão "Voltar ao login" retorna à tela de login sem precisar recarregar a página
- Ao tentar cadastrar e-mail já em uso, a mensagem de erro inclui sugestão de recuperar a senha
- Implementado com `sendPasswordResetEmail` do Firebase Auth v10

## RF-016: Gestão de Receitas
**Prioridade:** Alta | **Versão:** v1.3.0 | **Status:** ✅ Implementado

- Página dedicada `receitas.html` com CRUD completo de receitas
- **Criar** receita: descrição, valor, categoria, data
- **Editar** receita: modal pré-preenchido com todos os campos
- **Excluir** receita: modal de confirmação antes da remoção
- Navegação entre meses (‹ / ›) com chips de total e contagem de registros
- Categorias de receita separadas das categorias de despesa (campo `tipo: 'receita'`)
- Categorias padrão criadas automaticamente para grupos novos e existentes:
  - 💼 Salário, 📈 Rendimentos, 💻 Freelance, 🏠 Aluguel Recebido, 🎁 Outros
- Sincronização bidirecional em tempo real via Firestore `onSnapshot`
- Link "📥 Receitas" na navbar em todas as páginas

### Dashboard — Seção Receitas
- Seção dedicada entre o Dashboard de Orçamentos e os gráficos
- Card **Total Receitas** (verde) e card **Saldo** (Receitas − Despesas, verde/vermelho)
- Grid de categorias com barra de progresso verde e percentual por categoria

## RF-017: Dashboard como Tela Inicial — Gráficos e Indicadores
**Prioridade:** Alta | **Versão:** v2.1.0 | **Status:** ✅ Implementado

### Redirecionamento Automático Após Login
- `index.html` convertido de "logout gate" para redirect auth-aware
  - Autenticado + grupo familiar → `dashboard.html`
  - Autenticado sem grupo → `grupo.html`
  - Não autenticado → `login.html`
- Login sempre redireciona para `dashboard.html` (comportamento existente mantido)

### Dashboard — Nova Estrutura
| Seção | Status |
|-------|--------|
| Cards de Resumo (Total Orçado, Total Gasto, Disponível, Meu Bolso, Família) | Mantido |
| Parcelamentos em Aberto (widget colapsável + link "Ver projeções →") | Mantido + aprimorado |
| Grid de Orçamentos por Categoria | Mantido |
| Seção de Receitas (Total + Saldo + grid por categoria) | Mantido |
| **Gráfico Receitas × Despesas por Categoria** | **Novo** |
| **Gráfico Evolução Mensal — últimos 6 meses** | **Novo** |
| Lista detalhada de despesas | **Removida** (disponível em `despesas.html`) |

### Gráfico 1 — Receitas × Despesas por Categoria
- Barras verdes (Receitas) e vermelhas (Despesas) lado a lado por categoria
- Agrupa categorias de despesa **e** categorias de receita na mesma visualização
- Tooltip interativo com valor exato e % do total por conjunto
- Filtro de período com 3 opções:
  - **Mês atual**: usa dados do `onSnapshot` (tempo real, sem query adicional)
  - **Últimos 3 meses**: usa cache dos últimos 6 meses (sem query adicional)
  - **Ano atual**: lazy load de `buscarDespesasAno` / `buscarReceitasAno`, com cache
- Ordenação por volume decrescente (categorias com mais movimentação no topo)

### Gráfico 2 — Evolução Mensal
- Mixed chart: barras de Receitas (verde) + Despesas (vermelho) + linha Saldo Acumulado (azul)
- Sempre exibe os últimos 6 meses a partir do período selecionado (suporta cross-year)
- Meses futuros exibidos em tom mais claro (opacidade reduzida)
- Saldo acumulado com ponto azul (positivo) ou vermelho (negativo)
- Dados do mês atual sincronizados com `onSnapshot` (tempo real)
- Eixo Y secundário para o saldo acumulado

### Performance
- `carregarDadosMeses()`: 2 queries por init (6 meses) — substitui N queries mensais
- Cache por ano (`_dadosAno`) para filtro "Ano atual" — evita re-fetch ao alternar filtros
- Sem queries desnecessárias: "Mês atual" e "Últimos 3 meses" usam cache já carregado
- Dashboard mais leve: sem carregamento da lista completa de despesas

### Arquivos alterados
| Arquivo | Alteração |
|---------|-----------|
| `dashboard.html` | Remove `#section-despesas`; adiciona `#section-graficos` com dois `<canvas>`; Chart.js v4.4.6; link "Ver projeções →" |
| `src/js/app.js` | Adiciona `carregarDadosMeses`, `carregarDadosAno`, `renderizarGraficoCategorias`, `renderizarGraficoEvolucao`; remove `renderizarListaDespesas` |
| `src/js/services/database.js` | Adiciona `buscarDespesasPeriodo` e `buscarReceitasPeriodo` |
| `index.html` | Substitui logout automático por redirect auth-aware |
| `src/css/dashboard.css` | Classes `.dash-graficos-row`, `.dash-chart-wrap`, `.dash-filtro-btn` |

## NRF-001: Contas Compartilhadas (Divisão Conjunta)
**Prioridade:** Alta | **Versão:** v1.2.0 | **Status:** ✅ Implementado

- Despesas do tipo "Conjunta" são divididas entre todos os membros do grupo
- Campo `isConjunta: true` e `valorAlocado` (50% do valor por padrão) no Firestore
- Chips de "Contas Compartilhadas por usuário" na página de Despesas
- Cards "Meu Bolso" e "Família" no Dashboard para visualização da divisão
- Campo visual de seleção Tipo (Individual / Conjunta) com preview do impacto no bolso

## NRF-002: Reconciliação Fuzzy de Parcelas + CSV Nativo de Cartão
**Prioridade:** Média | **Versão:** v1.1.0 → v1.9.0 | **Status:** ✅ Implementado

### Funcionalidades originais (v1.1.0)
- Ao importar extrato, verifica se existe projeção futura para a transação usando fuzzy matching
- Critérios de match: estabelecimento similar (distância Levenshtein ≥ 85%), valor próximo (±1% ou ±R$0,50) e mesmo número de parcela (atual/total)
- Match confirmado: despesa real substitui a projeção (status `projecao_paga`)
- Badge âmbar "🔍 XX%" nas linhas de preview com percentual de similaridade
- `parcelamentos` coleção mestre para rastrear qtd de parcelas pagas vs. total

### NRF-002.1 — Importação de Fatura CSV Nativa (v1.9.0)
**Problema:** extratos CSV exportados diretamente pelo cartão de crédito usam o formato `"X de Y"` para parcelas (ex: `"6 de 12"`), enquanto o app sempre gerou projeções no formato `"06/12"`. Essa incompatibilidade impedia que o exact matching e o fuzzy matching funcionassem para esses arquivos.

#### Funcionalidades adicionadas

| Funcionalidade | Descrição |
|---|---|
| **Detecção automática de fatura** | Arquivo com colunas `Portador` e `Parcela` é identificado como fatura de cartão |
| **Banner de mês de vencimento** | Exibe seletor `<input type="month">` para o usuário informar o ciclo de cobrança |
| **Normalização de parcela** | `"X de Y"` convertido para `"XX/YY"` no momento do parse — dedup e fuzzy matching funcionam com ambos os formatos |
| **Ajuste de data por mês de fatura** | Parceladas têm `data` substituída pelo 1º dia do mês de vencimento; à vista mantêm data original |
| **`dataOriginal` preservada** | Data original da compra salva no Firestore; preview mostra badge `📅` com tooltip |
| **Importação de créditos/estornos** | Linhas com valor negativo recebem `isEstorno=true`, badge `↩ Estorno` (amarelo) e ficam **marcadas por padrão** — importadas como Receita; usuário pode desmarcar individualmente (BUG-013 + BUG-019) |
| **Re-renderização ao trocar mês** | Alterar o seletor de mês re-renderiza o preview imediatamente com novas datas |

#### Arquivos modificados (v1.9.0)
| Arquivo | Alteração |
|---|---|
| `src/importar.html` | Banner `#fatura-mes-wrap` + `#inp-mes-fatura` |
| `src/js/pages/importar.js` | `normalizarParcela`, `detectarFatura`, `aplicarMesFatura`, `_aplicarDeteccaoFatura`; `parsearParcela` com suporte a `"X de Y"`; state `_isFatura`, `_mesFatura`; `dataOriginal` + `dataAjustada` no payload |
| `src/js/models/Despesa.js` | `dataOriginal` adicionado à lista de campos opcionais |

### Critérios de Aceitação
- [x] Fuzzy matching funciona para arquivos com parcela `"X de Y"` (formato CSV do banco)
- [x] Exact matching por `chave_dedup` funciona para parcelas normalizadas
- [x] Fatura detectada automaticamente — banner exibido sem intervenção manual
- [x] Parceladas salvas no mês de vencimento selecionado
- [x] À vista mantêm data original do extrato
- [x] Créditos/estornos visíveis no preview com badge `↩ Estorno` e marcados por padrão — importados como Receita
- [x] `dataOriginal` salvo no Firestore e visível no preview
- [x] Trocar mês de vencimento atualiza o preview em tempo real

### NRF-002.2 — Detecção de Ajustes Parciais (Marketplace-Aware) — v3.1.0
**Problema:** Créditos de ajuste/desconto de marketplaces (iFood, Mercado Livre) e supermercados (Mambo, Carrefour) apareciam no extrato com descrição muito similar à compra original, fazendo o sistema classific á-los como possíveis duplicatas. O valor correto da transação deveria ser o valor original subtraído do ajuste.

#### Funcionalidades adicionadas

| Funcionalidade | Descrição |
|---|---|
| **Detecção de ajuste parcial** | Par (despesa + crédito) com descrição similar (≥ 72% Levenshtein), valor do crédito < despesa e janela de 7 dias |
| **Estabelecimentos elegíveis** | `PADROES_ESTABELECIMENTO`: marketplace (iFood, Amazon, Shopee…), supermercado (Mambo, Carrefour, Pão de Açúcar…), delivery (Rappi, Uber Eats…) |
| **Valor líquido na despesa** | `valorLiquido = valorOriginal − valorAjuste`; exibido com valor original tachado no preview |
| **Badge `↩ Ajuste`** | Linha de crédito recebe badge laranja com valor do ajuste; fica desmarcada por padrão |
| **Fundo laranja suave** | Linha de ajuste com classe `.imp-row-ajuste` (fundo `#fff3e0`) para distinção visual |
| **Sem interferência em fatura** | Lógica exclusiva do pipeline bancário — fatura de cartão não é afetada |

#### Arquivos modificados (v3.1.0)
| Arquivo | Alteração |
|---|---|
| `src/js/utils/ajusteDetector.js` | Novo módulo: `PADROES_ESTABELECIMENTO`, `classificarEstabelecimento()`, `detectarAjustesParciais()` |
| `src/js/utils/deduplicador.js` | Import de `ajusteDetector`; Fase 3 para `tipoExtrato === 'banco'` |
| `src/js/pages/importar.js` | Preview: classe `imp-row-ajuste`, badge `↩ Ajuste`, célula de valor com `valorLiquido` tachado, checkbox desmarcado |
| `src/css/main.css` | `.imp-row-ajuste`, `.imp-badge--ajuste` |

#### Critérios de Aceitação
- [x] Crédito de iFood/Mercado Livre não é marcado como duplicata
- [x] Crédito de Mambo/Carrefour não é marcado como duplicata
- [x] `valorLiquido` exibido corretamente com valor original tachado
- [x] Linha de ajuste desmarcada por padrão no preview
- [x] Badge `↩ Ajuste` exibe o valor do crédito
- [x] Nenhuma regressão no fluxo de fatura de cartão
- [x] Créditos sem match em `PADROES_ESTABELECIMENTO` não são afetados

---

## NRF-003: Fluxo de Caixa — Visão Orçamentária Anual
**Prioridade:** Alta | **Versão:** v1.4.0 | **Status:** ✅ Implementado

### Descrição
Página dedicada (`fluxo-caixa.html`) que oferece visão consolidada do fluxo financeiro anual do grupo, combinando receitas realizadas, despesas realizadas, projeções de parcelas e limites orçamentários mês a mês. Projetada para apoiar decisões de planejamento financeiro dos meses futuros.

### Funcionalidades

#### Gráfico de Evolução Mensal
- Gráfico combinado (Chart.js v4 — open source, github.com/chartjs/Chart.js, licença MIT) com dois eixos Y:
  - **Eixo esquerdo (R$/mês):** barras agrupadas por mês — Receitas (verde), Despesas (vermelho), Orçado (cinza)
  - **Eixo direito (Acumulado):** linha azul do Saldo Acumulado com pontos coloridos (azul = positivo, vermelho = negativo)
- Tooltip interativo ao passar o cursor: exibe todos os valores do mês selecionado
- Meses futuros com despesas em tom mais claro para distinguir realizadas de projetadas

#### Cards de Resumo Anual
| Card | Conteúdo |
|------|---------|
| 📥 Total Receitas | Soma de todas as receitas realizadas no ano |
| 💸 Total Despesas | Soma de despesas realizadas (exclui projeções) |
| ⚖️ Saldo do Ano | Receitas − Despesas; cor verde (positivo) ou vermelho (negativo) |
| 🎯 Total Orçado | Soma de todos os limites orçamentários definidos no ano |

#### Tabela Mensal Detalhada
Colunas exibidas para cada um dos 12 meses:
- **Receitas** — valor total de receitas do mês
- **Despesas** — valor total de despesas realizadas
- **Orçado** — limite orçamentário total do mês (exibe "—" se não definido)
- **Saldo Mês** — Receitas − Despesas do mês (verde/vermelho)
- **Saldo Acumulado** — saldo corrido desde janeiro (azul/vermelho)
- **Situação** — badge de classificação automática

#### Badges de Situação
| Badge | Condição |
|-------|---------|
| ✅ Positivo | Saldo do mês ≥ 0 |
| ❌ Negativo | Saldo do mês < 0 |
| ⚠️ Acima orç. | Despesas > Orçado definido |
| 🔵 Previsto | Meses futuros ao mês atual |
| — Sem dados | Nenhuma receita nem despesa registrada |

#### Navegação e UX
- Seletor de ano (ano anterior, atual, próximo) com recarga automática dos dados
- Mês atual destacado com borda azul e ícone ▶
- Meses futuros em itálico suave, badge azul "Previsto"
- Botão "🔄 Atualizar" para recarregar dados manualmente
- Link "📈 Fluxo de Caixa" na navbar de todas as páginas da aplicação
- Tabela com scroll horizontal em telas pequenas

### Arquitetura Técnica

#### Novos arquivos
| Arquivo | Descrição |
|---------|---------|
| `src/fluxo-caixa.html` | Página principal com estrutura HTML + integração Chart.js |
| `src/js/pages/fluxo-caixa.js` | Lógica da página: auth, carregamento, agregação, renderização |

#### Funções adicionadas em `database.js`
| Função | Descrição |
|--------|---------|
| `buscarDespesasAno(grupoId, ano)` | Busca todas as despesas do grupo no ano (getDocs, range de data) |
| `buscarReceitasAno(grupoId, ano)` | Busca todas as receitas do grupo no ano |
| `buscarOrcamentosAno(grupoId, ano)` | Busca todos os orçamentos do grupo no ano (query por `ano`) |

#### Tratamento de projeções
- Despesas com `tipo: 'projecao'` (parcelas futuras do RF-014) são agregadas separadamente
- No gráfico, são somadas às despesas reais para mostrar o comprometimento total do mês
- Na tabela, somente despesas realizadas entram na coluna "Despesas" (projeções não inflacionam o realizado)

#### Biblioteca externa
- **Chart.js v4.4.6** — licença MIT, importado via CDN `cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js`
- Não requer instalação de pacote; carregado no `<head>` da página

### Critérios de Aceitação
- [x] Gráfico renderiza corretamente para um ano com dados reais
- [x] Meses sem dados exibem valores zerados sem erros
- [x] Saldo acumulado reflete corretamente a evolução mês a mês
- [x] Badge "Previsto" aparece apenas em meses futuros ao mês atual
- [x] Trocar de ano recarrega todos os dados e atualiza gráfico + tabela
- [x] Página redireciona para `login.html` se usuário não estiver autenticado
- [x] Redirecionamento para `grupo.html` se usuário não tiver grupo associado

---

## NRF-004: Identificação de Conta/Banco por Transação
**Prioridade:** Alta | **Versão:** v1.6.0 | **Status:** ✅ Implementado

### Descrição
Permite identificar em qual conta financeira (banco ou cartão de crédito) cada despesa ou receita foi realizada. A identificação é feita por uma coleção normalizada `contas` no Firestore, com seed automático dos bancos mais utilizados. A feature está integrada ao formulário manual de despesas, à lista com badge visual, e ao fluxo de importação de extratos em massa.

### Funcionalidades

#### Coleção `contas` (Firestore)
- Coleção independente, com escopo por `grupoId` — mesmo padrão das `categorias`
- Campos por documento: `nome`, `emoji`, `cor` (hex), `tipo` (`banco` | `cartao` | `dinheiro`), `ativa`, `grupoId`
- Seed automático via `garantirContasPadrao` (upsert — adiciona contas faltantes sem remover existentes):
  - 💳 Cartão de Crédito (`#7B1FA2`, tipo: cartao)
  - 🟠 Banco Itaú (`#EC6600`, tipo: banco)
  - 🔴 Banco Bradesco (`#D32F2F`, tipo: banco)
  - 📊 Banco XP (`#1565C0`, tipo: banco)
  - 🔴 Banco Santander (`#CC0000`, tipo: banco)
  - 💼 Banco BTG (`#B8860B`, tipo: banco)
  - 💜 Nubank (`#820AD1`, tipo: banco)
  - 🟡 Banco Inter (`#FF6B00`, tipo: banco)
  - 🏛️ Caixa Econômica (`#003399`, tipo: banco)
  - 💛 Banco do Brasil (`#FFCC00`, tipo: banco)
  - 💵 Dinheiro (`#2E7D32`, tipo: dinheiro)

#### Despesas — formulário e lista
- Select "Conta / Banco" no modal de Nova/Editar Despesa (campo opcional; não bloqueia envio)
- Badge colorido por banco exibido em cada item da lista (`desp-conta-badge`): background e texto com a cor do banco, emoji do banco
- Filtro "Todas as contas" na barra de filtros da página de Despesas
- Ao editar despesa, a conta original é pré-selecionada no dropdown
- Campo `contaId` (id da conta) salvo opcionalmente no documento Firestore da despesa

#### Importação em massa de despesas (`importar.html` / `importar.js`)
| Elemento | Comportamento |
|---|---|
| **Seletor global** (Passo 2) | Aparece antes do upload: "🏦 De qual banco é este extrato?" — seleção aplica a todas as linhas ao carregar o arquivo |
| **Override por linha** | Coluna "Conta / Banco" na tabela de preview com select por linha — editável individualmente |
| **Ação em lote** | Select "Conta:" na barra de ações do preview — atualiza todas as linhas de uma vez |
| **Mudança global pós-preview** | Alterar o seletor global após o preview aberto atualiza todas as linhas em tempo real |
| **Projeções de parcelas** | `contaId` propagado automaticamente para todas as parcelas futuras geradas |
| **Leitura automática do arquivo** | Parser detecta coluna "Conta / Banco" no cabeçalho CSV/XLSX; resolve nome do banco para `contaId` via busca parcial case-insensitive |
| **Template dinâmico** | Botão "Baixar Template" gera `.xlsx` via SheetJS com coluna "Conta / Banco" + aba "Instruções" com contas do grupo |

#### Importação de receitas (`receitas.html` / `pages/receitas.js`)
| Elemento | Comportamento |
|---|---|
| **Seção colapsável** | Importação integrada à página de receitas, ocultável pelo botão "📤 Importar" |
| **Seletor global de conta** | Mesmo padrão das despesas — aplicado a todas as receitas do arquivo |
| **Override por linha** | Coluna "Conta / Banco" na tabela de preview, editável por linha |
| **Ação em lote** | Select "Conta:" na barra de ações do preview |
| **Leitura automática do arquivo** | Parser `_parsearLinhasRec` detecta coluna "Conta / Banco" e resolve para `contaId` |
| **Template dinâmico** | `_gerarTemplateRec()` via SheetJS; colunas: Data · Descrição · Valor · Categoria · Conta / Banco |

### Arquitetura Técnica

#### Novos arquivos
| Arquivo | Descrição |
|---|---|
| `src/js/models/Conta.js` | Model `modelConta()` + constante `CONTAS_PADRAO` (6 contas padrão) |

#### Funções adicionadas em `database.js`
| Função | Descrição |
|---|---|
| `ouvirContas(grupoId, cb)` | Listener em tempo real de contas ativas do grupo |
| `criarConta(dados)` | Cria nova conta no Firestore |
| `atualizarConta(id, dados)` | Atualiza campos de uma conta |
| `excluirConta(id)` | Soft-delete: seta `ativa: false` |
| `garantirContasPadrao(grupoId, padrao)` | Upsert: adiciona contas padrão faltantes (por nome, case-insensitive com NFD) sem sobrescrever existentes |

#### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `models/Despesa.js` | `contaId` adicionado à lista de campos opcionais |
| `models/Receita.js` | `contaId` adicionado como opcional |
| `controllers/despesas.js` | `contaId` incluído no payload de create e update |
| `pages/despesas.js` | Listener `ouvirContas`, populate selects, badge, filtro |
| `pages/importar.js` | Listener `ouvirContas`, seletor global, override por linha, ação em lote, propagação para projeções; parser com `idxConta`; template dinâmico `gerarTemplateDespesas()` |
| `pages/receitas.js` | Importação completa com seletor global, preview, parser `_parsearLinhasRec` com `idxConta`, template dinâmico `_gerarTemplateRec()` |
| `app.js` | Import de `garantirContasPadrao` + `CONTAS_PADRAO`; seed no boot |
| `css/main.css` | `.desp-conta-badge`, `.imp-conta-selector`, `.imp-conta-label`, `.imp-conta-select`, `.imp-conta-hint` |

### Critérios de Aceitação
- [x] Contas padrão criadas automaticamente para grupos novos e existentes
- [x] Select de conta disponível no formulário de despesa (modal)
- [x] Badge do banco aparece corretamente na lista de despesas com cor do banco
- [x] Filtro por conta filtra a lista de despesas
- [x] Ao editar despesa, conta original pré-selecionada
- [x] Seletor global no import aplica conta a todas as linhas
- [x] Override por linha funciona independentemente do seletor global
- [x] Ação em lote "Conta:" atualiza todas as linhas
- [x] `contaId` salvo no Firestore ao criar/editar despesa
- [x] `contaId` propagado para projeções de parcelas na importação
- [x] Parser de despesas detecta coluna "Conta / Banco" no CSV/XLSX e resolve para `contaId`
- [x] Parser de receitas detecta coluna "Conta / Banco" no CSV/XLSX e resolve para `contaId`
- [x] Template de despesas gerado dinamicamente com coluna "Conta / Banco" e aba "Instruções"
- [x] Template de receitas gerado dinamicamente com coluna "Conta / Banco" e aba "Instruções"
- [x] Inferência automática de banco pela descrição da transação (3 níveis: coluna do arquivo → palavras-chave na descrição → seletor global)
- [x] Valores negativos de extrato bancário aceitos e convertidos para positivo via `Math.abs` ao importar despesas
- [x] Receitas importadas com `Math.abs` — sempre positivas, efeito contábil correto nos relatórios

---

## NRF-005: Fatura do Cartão de Crédito
**Prioridade:** Alta | **Versão:** v1.7.0 | **Status:** ✅ Implementado

### Descrição
Página dedicada ao fechamento mensal do cartão de crédito compartilhado entre dois usuários. Substitui a planilha manual de fechamento, aproveitando os dados já importados via NRF-004 (contaId = Cartão de Crédito).

### Motivação
O processo mensal exigia uma planilha Excel com ~109 transações por mês, classificação manual por responsável (Ana / Lu / ANA&LU), separação P/V (parcelado/à vista), cálculo de projeções de parcelas futuras e totalização por pessoa. O app agora faz isso automaticamente.

### Funcionalidades

#### Filtros
- Seleção de mês com navegação ‹ ›
- Seletor de conta (cartão) — auto-seleciona o primeiro tipo `cartao` cadastrado

#### Cards de Resumo
- Total da fatura (todas as transações do mês)
- Total a pagar por membro: individual + 50% das conjuntas

#### Tabs de navegação
| Tab | Conteúdo |
|-----|----------|
| Todas | Todas as transações do mês para o cartão selecionado |
| [Nome do membro] | Despesas individuais daquele membro (geradas dinamicamente de `nomesMembros`) |
| Conjuntas | Despesas com `isConjunta = true`; coluna "Por Pessoa" = `valorAlocado ?? valor/2` |
| Projeções | Parcelas futuras nos próximos 6 meses, agrupadas por mês e pessoa |

#### Tabela de transações
Colunas: Data | Estabelecimento | Responsável | Tipo (P/V) | Parcela | Categoria | Valor | Meu Bolso

- **Tipo P/V**: P = parcelado (campo `parcela` != '-'), V = à vista
- **Meu Bolso**: para conjuntas = `valorAlocado ?? valor/2`; para individuais = `valor`
- Busca por descrição em tempo real
- Linhas conjuntas destacadas em amarelo claro

#### Resumo por pessoa
Para cada membro do grupo:
- Individuais à vista
- Individuais parceladas
- Conjuntas (50%)
- **Total a pagar** = soma dos três itens acima

#### Exportação Excel
Arquivo gerado com SheetJS contendo 3 abas:
1. **Transações**: todas as linhas do mês com todas as colunas
2. **Resumo**: individual + conjunta + total por pessoa
3. **Conjuntas**: somente as despesas conjuntas com split 50/50

### Arquitetura

#### Mapeamento planilha → app
| Campo da planilha manual | Campo no Firestore | Lógica no app |
|---|---|---|
| `CRITÉRIO 1` (Ana/Lu) | `responsavel` | Match por `nomesMembros[uid].split(' ')[0]` |
| `ANA&LU` | `isConjunta: true` | Tab "Conjuntas" + coluna "Por Pessoa" |
| `P` / `V` | `parcela` (= "X de Y" ou '-') | Badge P/V; separação nas tabs |
| Coluna K (valor÷2) | `valorAlocado` | `valorAlocado ?? valor/2` |
| Projeção futura | `tipo: 'projecao'` | Tab "Projeções" com listener por mês |
| `contaId` | `contaId` (NRF-004) | Filtro central da página |

#### Arquivos adicionados/alterados
| Arquivo | Alteração |
|---|---|
| `src/fatura.html` | Nova página com estrutura de filtros, cards, tabs, tabelas |
| `src/js/pages/fatura.js` | Lógica completa: listeners, cálculos, render, exportação |
| `src/css/main.css` | Classes `fat-*` para layout responsivo da fatura |
| `src/dashboard.html` | Link `💳 Fatura` adicionado ao navbar |
| `src/despesas.html` | Link `💳 Fatura` adicionado ao navbar |
| `src/receitas.html` | Link `💳 Fatura` adicionado ao navbar |
| `src/fluxo-caixa.html` | Link `💳 Fatura` adicionado ao navbar |
| `src/orcamentos.html` | Link `💳 Fatura` adicionado ao navbar |
| `src/categorias.html` | Link `💳 Fatura` adicionado ao navbar |
| `src/importar.html` | Link `💳 Fatura` adicionado ao navbar |

### Critérios de Aceitação
- [x] Seletor de mês e conta filtram os dados em tempo real
- [x] Cards mostram total da fatura e total por pessoa corretamente
- [x] Tab "Todas" lista todas as transações do cartão no mês
- [x] Tabs por membro listam apenas despesas individuais daquele membro
- [x] Tab "Conjuntas" lista despesas com `isConjunta = true` e calcula split 50/50
- [x] Tab "Projeções" mostra parcelas futuras dos próximos 6 meses
- [x] Resumo "Total a pagar" = individuais + 50% conjuntas por pessoa
- [x] Exportação Excel gera arquivo com 3 abas (Transações, Resumo, Conjuntas)
- [x] Link no navbar visível em todas as páginas da aplicação
- [x] Auto-seleciona o primeiro cartão de crédito cadastrado ao entrar na página
- [x] Transações à vista de fim de mês (ex: fev/26–28 no ciclo de março) aparecem na fatura correta via campo `mesFatura` (BUG-021/022 — v3.8.0)
- [x] Parceladas de meses anteriores aparecem no ciclo de faturamento correto após import via `mesFatura` (BUG-021 — v3.8.0)

#### Atualização v3.8.0 — Campo `mesFatura` e Ciclo de Faturamento (BUG-021/022)
O campo `mesFatura: "YYYY-MM"` foi adicionado a todas as transações importadas de fatura de cartão. A página `fatura.js` utiliza dois listeners em paralelo (`ouvirDespesas` para mês calendário + `ouvirDespesasPorMesFatura` para campo `mesFatura`) com merge por `id`, garantindo que transações com `data` em meses adjacentes mas pertencentes ao ciclo correto apareçam na fatura.

---

## NRF-008: Deduplicação de Transações
**Prioridade:** Alta | **Versão:** v1.8.0 | **Status:** ✅ Implementado

### Descrição
Ferramenta completa para eliminar duplicatas existentes na base e impedir que uploads repetidos do mesmo extrato gerem lançamentos duplicados. Detecta transações idênticas pelo critério: mesma data + mesmo estabelecimento + mesmo valor.

### Problema resolvido
Uploads repetidos do mesmo extrato bancário (ou importações feitas antes da implementação do dedup) podiam gerar transações duplicadas na base. Além disso, a proteção de deduplicação de receitas nunca funcionava porque o código consultava a coleção errada (`despesas` em vez de `receitas`).

### Funcionalidades

#### Ferramenta de Purga — `importar.html`
- Seção "🧹 Manutenção da Base" no final da página de Importação (sempre visível)
- **"🔍 Analisar Duplicatas"**: varre o grupo inteiro em modo dry-run (sem deletar), exibe:
  - Total de despesas na base / duplicatas de despesas encontradas
  - Total de receitas na base / duplicatas de receitas encontradas
- **"🗑️ Remover Duplicatas"**: aparece somente se houver duplicatas; abre modal de confirmação antes de agir
- **Modal de confirmação**: descreve quantas serão removidas e avisa sobre irreversibilidade
- Após a purga: recarrega `_chavesExistentes` para que o próximo import use a base limpa

#### Critério de detecção de duplicatas
```
chave = data (YYYY-MM-DD) + descrição (lowercase, trim, max 60 chars) + valor (2 casas decimais)
```
Portador e número de parcela **não** fazem parte da chave — dois registros com a mesma compra em datas/valores idênticos são considerados duplicatas independentemente do responsável.

#### Proteção por `chave_dedup` em entradas manuais
- Formulário de nova despesa agora gera `chave_dedup` automático antes de salvar (`manual||data||desc||valor`)
- Garante que despesas lançadas manualmente sejam reconhecidas como existentes em imports futuros do mesmo extrato, evitando lançamentos duplos

#### Correção do bug de dedup em receitas
- `receitas.js` chamava `buscarChavesDedup()` que consulta a coleção `despesas` — portanto o dedup de receitas nunca funcionou
- Corrigido: nova função `buscarChavesDedupReceitas(grupoId)` consulta a coleção `receitas`

### Arquitetura Técnica

#### Funções adicionadas em `database.js`
| Função | Descrição |
|---|---|
| `buscarChavesDedupReceitas(grupoId)` | Retorna `Set<chave_dedup>` da coleção `receitas` |
| `purgarDuplicatasDespesas(grupoId, dryRun?)` | Varre despesas, agrupa por chave simplificada, mantém o mais antigo, deleta os demais. `dryRun=true` só conta |
| `purgarDuplicatasReceitas(grupoId, dryRun?)` | Mesma lógica para receitas |

#### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/js/services/database.js` | +`buscarChavesDedupReceitas`, +`purgarDuplicatasDespesas`, +`purgarDuplicatasReceitas`, +`_chaveSimplificada` |
| `src/js/pages/importar.js` | Import das funções de purga; listeners dos botões; funções `analisarDuplicatas`, `abrirModalPurga`, `fecharModalPurga`, `executarPurga` |
| `src/js/pages/receitas.js` | `buscarChavesDedup` → `buscarChavesDedupReceitas` (correção de bug) |
| `src/js/controllers/despesas.js` | Geração automática de `chave_dedup` para entradas manuais |
| `src/importar.html` | Seção "Manutenção da Base" + modal de confirmação de purga |

### Critérios de Aceitação
- [x] "Analisar Duplicatas" exibe contadores corretos sem deletar nada
- [x] "Remover Duplicatas" aparece somente quando há duplicatas
- [x] Modal exige confirmação explícita antes de deletar
- [x] Após a purga, a base não contém mais transações com mesma data+desc+valor
- [x] Upload repetido do mesmo extrato não gera novas despesas (chave_dedup já existe)
- [x] Entradas manuais recebem chave_dedup e são detectadas em imports futuros
- [x] Deduplicação de receitas agora funciona corretamente (coleção correta)
- [x] Contadores da seção são atualizados após a purga

---

## RF-018: Centralização da Base de Dados — Importação, Deduplicação e Purge
**Prioridade:** Alta | **Versão:** v2.2.0 | **Status:** ✅ Implementado

### Objetivo
Unificar em uma única tela (`base-dados.html`) toda a gestão da base de dados do grupo: importação de arquivos, análise de duplicatas, gerenciamento paginado de transações e limpeza total (admin only).

### Estrutura de Abas

| Aba | Ícone | Acesso | Responsável (JS) |
|-----|-------|--------|-----------------|
| Importar | 📥 | Todos os membros | `importar.js` |
| Duplicatas | 🔍 | Todos os membros | `importar.js` |
| Gerenciar | 🗂️ | Todos os membros | `base-dados.js` |
| Limpeza | ⚠️ | Mestre do grupo apenas | `base-dados.js` |

### RF-018.1 — Aba Gerenciar

- Botão "🔍 Carregar" dispara `buscarTodasTransacoes(grupoId)` e preenche a tabela
- Filtros client-side: **tipo** (despesa / receita / projeção / todos), **mês**, **ano**, **categoria**
- Filtros de anos e categorias preenchidos dinamicamente a partir dos dados carregados
- Tabela paginada: **50 registros por página**, controles Anterior/Próxima com indicador "Página X de Y (N registros)"
- Seleção em massa: checkbox individual por linha + "Selecionar todos visíveis"
- Exclusão em lote: até 500 itens por batch; modal de confirmação antes de deletar
- Após exclusão: cache local atualizado sem nova consulta ao Firestore

### RF-018.2 — Aba Limpeza (admin only)

- **Visibilidade**: aba oculta por padrão (classe `.hidden`); exibida somente se `grupo.criadoPor === currentUser.uid`
- **Dupla confirmação**: digitação da palavra `PURGAR` + checkbox de ciência
- Botão "Purgar agora" habilitado apenas quando ambas as condições são satisfeitas
- Executa `purgeGrupoCompleto(grupoId)`: apaga despesas, receitas e parcelamentos em batches de 500
- Exibe resumo pós-purge: contagem por coleção + total
- Categorias, orçamentos, contas e usuários **não são afetados**

### Arquivos Alterados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/base-dados.html` | Novo | Página principal com 4 abas |
| `src/importar.html` | Modificado | Convertido em redirect para `base-dados.html` |
| `src/js/pages/base-dados.js` | Novo | Tab switching + Gerenciar + Limpeza |
| `src/js/services/database.js` | Modificado | `buscarTodasTransacoes`, `excluirEmMassa`, `purgeGrupoCompleto` |
| `src/css/main.css` | Modificado | Estilos das abas, tabela gerenciar, purge box |
| `src/dashboard.html` + 6 outras | Modificado | Navbar: "📤 Importar" → "📦 Base de Dados" |

### Critérios de Aceitação
- [x] Aba Importar funciona identicamente ao antigo `importar.html`
- [x] Aba Duplicatas funciona identicamente à seção de manutenção do antigo `importar.html`
- [x] Gerenciar carrega todas as transações e aplica filtros client-side corretamente
- [x] Paginação exibe 50 registros por página
- [x] Seleção em massa + exclusão em lote funciona com confirmação
- [x] Aba Limpeza oculta para membros não-mestre
- [x] Purge exige "PURGAR" + checkbox antes de habilitar o botão
- [x] `importar.html` redireciona automaticamente para `base-dados.html`
- [x] Todos os links da navbar apontam para `base-dados.html`

---

## RF-019: Correção — Preenchimento Automático de Conta/Banco no Preview
**Prioridade:** Alta | **Versão:** v2.3.0 | **Status:** ✅ Implementado

### Motivação (Bug Report)
Ao selecionar o seletor global "🏦 De qual banco é este extrato?" **antes** de carregar o arquivo, as linhas do preview não recebiam o `contaId` escolhido. O campo ficava vazio.

### Causa Raiz
`renderizarPreview()` usava `l.contaId ?? contaGlobal`. O operador `??` só trata `null`/`undefined` — como `inferirContaDaDescricao()` retorna `''` (string vazia) quando falha, `'' ?? contaGlobal` = `''`, nunca aplicando o global.

### Correção

**Prioridade após fix:** seletor global › coluna do arquivo › inferência da descrição › vazio

| Arquivo | Alteração |
|---------|-----------|
| `src/js/pages/importar.js` | `l.contaId ?? contaGlobal` → `contaGlobal \|\| l.contaId \|\| ''` |
| `src/js/pages/importar.js` | Nova função `_atualizarBadgeConta()` |
| `src/js/pages/importar.js` | Handler `sel-conta-global` chama `_atualizarBadgeConta()` |
| `src/base-dados.html` | `<div id="conta-auto-badge">` no Passo 3 (preview) |
| `src/css/main.css` | `.imp-conta-auto-badge` — badge verde |

### Critérios de Aceitação
- [x] Seletor global preenchido → arquivo carregado → todas as linhas já mostram a conta correta
- [x] Badge "✅ Conta aplicada automaticamente: [Nome]" visível no preview
- [x] Altera seletor global após preview → todas as linhas atualizam em tempo real
- [x] Badge atualiza em tempo real ao trocar o seletor global
- [x] Arquivo com coluna "Conta / Banco": seletor global tem prioridade
- [x] Override manual por linha continua funcionando
- [x] Funciona para fatura de cartão, extrato bancário, despesas e receitas

---

## RF-020: Classificação Automática por Sinal + Importação PDF
**Prioridade:** Alta | **Versão:** v2.4.0 | **Status:** ✅ Implementado

### Motivação
Usuários com extratos bancários em PDF não conseguiam importar diretamente. Além disso, a classificação receita/despesa para extratos com sinal precisava ser automática e reversível.

### Funcionalidades

#### Importação de PDF bancário
- Arrastar/selecionar arquivo `.pdf` na tela Base de Dados → Importar
- PDF.js (CDN v3.11.174 UMD) extrai texto de todas as páginas
- Agrupa itens por linha (posição Y com tolerância 2,5pt), ordena por X
- Detecta automaticamente como "🏦 Extrato Bancário"

#### Classificação por sinal
- Valor negativo → `tipoLinha = 'despesa'`
- Valor positivo → `tipoLinha = 'receita'`
- Toggle "Inverter sinais": aparece somente em PDFs, permite trocar a convenção
- Re-classifica todas as linhas em tempo real ao ativar/desativar

#### Badge de confiança
- Cada linha de PDF recebe badge: `✓ Alta`, `~ Média` ou `⚠ Baixa`
- Legenda visível no topo do preview (somente em PDFs)
- Confiança baseada em: qualidade da descrição, valor plausível, comprimento da linha

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/js/utils/pdfParser.js` | **Novo** — `extrairTransacoesPDF(file)` |
| `src/js/pages/importar.js` | Pipeline PDF, `parsearLinhasPDF()`, toggle, badges |
| `src/base-dados.html` | PDF.js CDN, accept=".pdf", toggle UI, legenda |
| `src/css/main.css` | `.imp-badge--conf-alta/media/baixa`, `.imp-pdf-conf-legenda`, `.imp-inverter-sinais-wrap` |

### Critérios de Aceitação
- [x] Arquivo PDF é aceito no input de arquivo (accept inclui `.pdf`)
- [x] PDF com texto selecionável extrai transações corretamente
- [x] Valores negativos no PDF → despesa; positivos → receita
- [x] Toggle "Inverter sinais" inverte a classificação em tempo real
- [x] Badge de confiança (alta/média/baixa) exibido por linha no preview
- [x] Legenda de confiança visível somente quando arquivo é PDF
- [x] Toggle de inversão visível somente em PDFs no modo banco
- [x] PDF sem texto selecionável exibe mensagem de erro amigável
- [x] Reset (trocar arquivo) limpa `_origemPDF` e `_sinaisInvertidos`
- [x] Pipeline de deduplicação, categorização e importação funciona igual ao CSV/XLSX

---

## RF-021: Motor de Detecção, Roteamento e Identificação de Banco
**Prioridade:** Alta | **Versão:** v2.6.0 | **Status:** ✅ Implementado

### Motivação
O sistema detectava apenas o tipo do arquivo (banco/cartão) mas não sabia qual banco/emissor era o arquivo. Isso impedia a auto-seleção de conta e a categorização contextual.

### Funcionalidades

#### Identificação de banco/emissor
- Scoring por nome do arquivo (+40 pts), keywords de alta confiança (+40 pts), keywords de média confiança (+20 pts)
- 15 bancos/emissores: Itaú, Nubank, Bradesco, Santander, Banco Inter, Banco do Brasil, Caixa Econômica, XP, BTG, C6 Bank, Banco Original, Neon, PicPay, Mercado Pago, Sicoob
- Score < 20 → `'desconhecido'`

#### Auto-seleção de conta (integração NRF-004)
- Banco identificado com conta cadastrada → `sel-conta-global` pré-selecionado automaticamente
- Não sobrescreve se usuário já selecionou manualmente

#### Badge visual
- `#banco-detectado-badge`: "🏦 Itaú identificado automaticamente"
- Visível somente quando banco é reconhecido (score ≥ 20)

#### Substituição de `detectarTipoExtrato`
- `detectorOrigemArquivo.js` agora é o único módulo de detecção
- Mantém compatibilidade total com modal de confirmação de tipo (campo `confianca: 'alta'|'baixa'`, campo `colunas`)

### Arquivos

| Arquivo | Papel |
|---------|-------|
| `src/js/utils/bankFingerprintMap.js` | **Novo** — dados de fingerprint dos bancos |
| `src/js/utils/detectorOrigemArquivo.js` | **Novo** — motor de detecção RF-021 |
| `src/js/pages/importar.js` | Integração: `_origemBanco`, `_atualizarBancoBadge()`, `_autoSelecionarConta()` |
| `src/base-dados.html` | `#banco-detectado-badge` |
| `src/css/main.css` | `.imp-banco-detectado-badge` |

### Critérios de Aceitação
- [x] Arquivo com "itau" no nome → banco Itaú identificado
- [x] PDF com texto "Nubank S.A." → banco Nubank identificado
- [x] Banco identificado + conta cadastrada → conta auto-selecionada
- [x] Banco identificado → badge exibido no tipo-extrato-wrap
- [x] Banco não identificado → badge oculto, sem auto-seleção
- [x] Trocar arquivo → banco resetado, badge oculto, conta não forçada
- [x] Modal de confirmação de tipo continua funcionando (campos `confianca` e `colunas` presentes)
- [x] PDF identificado como Nubank → `origemBanco: 'nubank'` salvo nas despesas/receitas

---

## RF-022: Auto Categorização Inteligente Sensível à Origem
**Prioridade:** Alta | **Versão:** v2.6.1 | **Status:** ✅ Implementado

### Motivação
A categorização automática usava apenas o histórico global (descrição → categoria). Com a origem do banco disponível via RF-021, é possível melhorar a precisão usando histórico segmentado por banco.

### Funcionamento

**Chave de histórico com contexto:** `descricao_normalizada + '|' + origemBanco`

**Prioridade de lookup:**
1. `mapaHist["pix recebido|itau"]` → específico do banco (RF-022)
2. `mapaHist["pix recebido"]` → global (comportamento anterior)
3. Regras por palavras-chave (fallback estático)

**Aprendizado cross-session:**
- `origemBanco` salvo em cada despesa/receita importada
- `buscarMapaCategorias` indexa `descricao|origemBanco` quando presente
- Próximas importações do mesmo banco se beneficiam do histórico

### Arquivos

| Arquivo | Papel |
|---------|-------|
| `src/js/utils/categorizer.js` | **Novo** — `categorizarTransacao(estab, origem, categorias, mapaHist)` |
| `src/js/services/database.js` | `buscarMapaCategorias` indexa `|origemBanco` |
| `src/js/pages/importar.js` | `mapearCategoria` → wrapper; `_recategorizarComOrigem()` |
| `src/js/models/Despesa.js` | Campo opcional `origemBanco` |
| `src/js/models/Receita.js` | Campo opcional `origemBanco` |

### Critérios de Aceitação
- [x] `categorizarTransacao` tenta lookup origin-specific antes do global
- [x] Histórico origin-specific tem prioridade sobre global
- [x] Fallback para regras por palavras-chave quando sem histórico
- [x] `origemBanco` salvo em despesas/receitas importadas
- [x] Re-importação do mesmo banco usa histórico acumulado
- [x] `_recategorizarComOrigem()` atualiza categorias após detecção de banco
- [x] Funciona em modo banco (CSV, XLSX, PDF) e modo cartão
- [x] Sem regressão: importações sem `origemBanco` funcionam normalmente

---

## NRF-009: Responsável por Transação no Import
**Prioridade:** Média | **Versão:** v3.2.0 | **Status:** ✅ Implementado

### Motivação
No modelo de grupo familiar (2 membros), saber quem é o responsável por cada transação importada é fundamental para reconciliação de gastos, fluxo de caixa por pessoa e rastreabilidade.

### Comportamento por Tipo de Pipeline

| Pipeline | Atribuição | Editável no preview |
|----------|-----------|---------------------|
| 🏦 Extrato Bancário | Automático: `responsavel = displayName` do usuário que faz o upload | ❌ Não (texto estático) |
| 💳 Fatura de Cartão | Manual: seletor por linha + seletor em lote | ✅ Sim |
| 📥 Receitas | Herdado do pipeline bancário (automático) | ❌ Não |
| 💸 Despesas CSV | Herdado da coluna Portador (se existir) | ❌ Estático |

### Funcionalidades

- **Banco:** `_aplicarTipo('banco')` auto-preenche `l.portador = _usuario.displayName` para todas as linhas sem portador explícito
- **Cartão:** coluna Portador no preview renderiza `<select class="sel-resp-linha">` com membros do grupo; seletor em lote `sel-resp-lote` aplica a todas as linhas de uma vez
- **Membros:** carregados de `grupos/{grupoId}.nomesMembros` na inicialização; fallback para `displayName` do usuário atual se grupo sem outros membros
- **Persistência:** `portador` e `responsavel` já existem no modelo `Despesa`/`Receita` — sem migração de schema necessária

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/js/pages/importar.js` | `buscarGrupo` importado; `_nomesMembros` state; `preencherSelRespLote()`; auto-assign em `_aplicarTipo('banco')`; portador editável em cartão; `_atualizarUITipo` show/hide `resp-lote-wrap`; `sel-resp-lote` listener; `responsavel` em `criarReceita` |
| `src/base-dados.html` | `resp-lote-wrap` div com label + `sel-resp-lote` na barra de ações em lote |

### Critérios de Aceitação
- [x] Upload de extrato bancário → portador de todas as linhas = nome do usuário logado
- [x] Preview bancário mostra nome do portador como texto (não editável)
- [x] Preview de fatura de cartão mostra seletor dropdown com membros do grupo por linha
- [x] Seletor em lote `Responsável:` visível apenas em modo cartão
- [x] Seletor em lote aplica nome a todos os `.sel-resp-linha` de uma vez
- [x] `criarReceita` recebe `responsavel: l.portador` (receitas do extrato bancário)
- [x] `criarDespesa` já recebia `responsavel: l.portador` — sem alteração necessária
- [x] Sem regressão em modos receita/despesa (portador exibido como texto)

---

## RF-023: Edição em Massa de Transações — Responsável Dinâmico
**Prioridade:** Alta | **Versão:** v3.3.0 | **Status:** ✅ Implementado

### Descrição
Permite a edição em massa do campo Responsável na aba Gerenciar da página Base de Dados, com atualização sincronizada de `responsavel` + `portador` em batch Firestore (≤ 500 por operação).

### Funcionalidades

| Funcionalidade | Detalhe |
|----------------|---------|
| Filtro por Responsável | Novo filtro `ger-fil-resp` na barra de filtros da aba Gerenciar — lista nomes únicos presentes no cache |
| Seletor de responsável em lote | `ger-sel-resp` populado com `nomesMembros` do grupo (fonte: `grupos/{grupoId}.nomesMembros`) |
| Botão Aplicar | `ger-btn-resp` habilitado apenas quando há seleção + responsável escolhido |
| Batch update | `atualizarResponsavelEmMassa(items, responsavel)` em `database.js` — chunks de 500 (límite Firestore) |
| Atualização local imediata | Cache `_todasTransacoes` e `_filtradas` atualizados sem recarregar do Firestore |
| Toast de feedback | Aparece por 3,5 s no canto inferior direito: "X transações atualizadas — responsável: Nome" |
| Integridade | `responsavel` e `portador` atualizados em sincronia (mesma operação de batch) |

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/js/services/database.js` | `atualizarResponsavelEmMassa(items, responsavel)` — nova função de batch update |
| `src/base-dados.html` | Filtro `ger-fil-resp` na barra de filtros; `ger-sel-resp` + `ger-btn-resp` na barra de ações em lote |
| `src/js/pages/base-dados.js` | `_nomesMembros` state; `preencherSelResp()`; `preencherFiltrosResponsaveis()`; `aplicarFiltros` com filtro por resp; `atualizarContagem` controla `ger-btn-resp`; `confirmarAtualizacaoResp()`; `mostrarToast()` |

### Critérios de Aceitação
- [x] Filtro "Todos os responsáveis" filtra corretamente a tabela por nome
- [x] Dropdown `ger-sel-resp` lista membros do grupo (fonte: `nomesMembros`)
- [x] Botão "Aplicar" desabilitado quando sem seleção ou sem responsável escolhido
- [x] Batch update persiste `responsavel` e `portador` no Firestore
- [x] Cache local atualizado imediatamente — tabela reflete a mudança sem reload
- [x] Toast confirma quantidade de registros atualizados
- [x] Limite de 500 registros por batch respeitado
- [x] Funciona para despesas e receitas (coleções distintas na mesma operação)
- [x] Sem regressão: exclusão em massa e demais filtros funcionam normalmente

---

## NRF-010: Portador "Conjunto" no Upload de Fatura de Cartão
**Prioridade:** Alta | **Versão:** v3.4.0 | **Status:** ✅ Implementado

### Descrição
Permite que o usuário marque transações importadas via fatura de cartão de crédito como despesas conjuntas diretamente no preview de importação — por linha individual ou em lote — utilizando a opção "👥 Conjunto" nos seletores de responsável.

### Funcionalidades

| Funcionalidade | Detalhe |
|----------------|---------|
| Opção "👥 Conjunto" | Disponível em `sel-resp-lote` (lote) e `sel-resp-linha` (por linha) — adicionada ao final da lista de membros |
| Constante controlada | `RESP_CONJUNTO = 'conjunto'` — valor canônico, sem input livre |
| Auto-marcação | Seleção de "Conjunto" aplica `portador='conjunto'` + `isConjunta=true` na linha |
| Split automático | `valorAlocado = valor / 2` — derivado em `modelDespesa()` quando `isConjunta=true` |
| Badge visual | `👥 Conjunto` (verde) na coluna Status; fundo verde claro (`#f0fdf4`) na linha |
| Prioridade de seleção | Seleção do usuário prevalece sobre padrão da categoria (`isConjuntaPadrao`) |
| Propagação a parcelas | Parcelas projetadas herdam `isConjunta=true` e `valorAlocado` do registro pai |
| Re-render automático | Seletor em lote chama `renderizarPreview()` para atualizar badges de todas as linhas |

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/js/pages/importar.js` | `RESP_CONJUNTO` constante; `preencherSelRespLote()` com opção Conjunto; bulk listener com `isConjunta`; per-line change listener; badge `imp-badge--conjunto`; save override `l.isConjunta ??` |
| `src/css/main.css` | `.imp-row-conjunto` + `.imp-badge--conjunto` — estilos visuais |

### Critérios de Aceitação
- [x] Opção "👥 Conjunto" aparece em ambos os seletores (linha e lote)
- [x] Seleção individual por linha marca apenas aquela linha como conjunto
- [x] Seletor em lote marca todas as linhas do preview como conjunto + atualiza badges
- [x] Badge "👥 Conjunto" aparece na coluna Status; linha fica com fundo verde
- [x] Despesa salva com `isConjunta=true`, `portador='conjunto'`, `responsavel='conjunto'`
- [x] `valorAlocado = valor / 2` calculado e salvo
- [x] Parcelas projetadas herdam `isConjunta=true`
- [x] Padrão da categoria é sobreposto pela seleção do usuário
- [x] Sem regressão: seletores de membros individuais continuam funcionando

---

## RF-060: Planejamento Mensal — Visão Unificada de Despesas Previstas
**Prioridade:** Alta | **Versão:** v3.11.0 | **Status:** ✅ Implementado

Nova aba "📋 Planejamento" com visão prospectiva do mês: o usuário vê todas as saídas esperadas e acompanha a evolução realizado vs. previsto ao longo do período.

### Fontes de dados
| Fonte | O que fornece |
|-------|---------------|
| Despesas dos meses N-1 e N-2 | Detecção de recorrentes (aluguel, assinaturas, contas fixas) |
| Despesas com `tipo='projecao'` do mês | Parcelas de cartão de crédito já projetadas |
| Orçamentos do mês | Limites por categoria como referência |
| Despesas realizadas do mês (listener) | Auto-matching em tempo real |

### Funcionalidades
- **Geração automática do plano:** ao clicar "Gerar Plano", o sistema combina recorrentes + parcelas + orçamentos em itens de planejamento
- **Detecção de recorrentes:** algoritmo compara meses N-1 e N-2, com 3 níveis de confiança (alta ≤5%, média ≤15%, baixa >15%)
- **Auto-matching em tempo real:** quando uma despesa é registrada (em qualquer aba), o plano atualiza automaticamente via `onSnapshot`
- **Checklist agrupada por categoria:** com subtotais, badges de tipo (Recorrente/Parcela/Orçamento/Manual) e status (pendente/realizado/acima)
- **KPIs:** Total Previsto, Total Realizado, Diferença, Cobertura %
- **Análise de gaps:** categorias com orçamento sem itens planejados; planejado acima do orçamento
- **Despesas não planejadas:** lista de despesas realizadas que não estão no plano
- **Adição manual de itens:** formulário inline para despesas avulsas
- **Marcação manual:** para itens que não foram auto-matched

### Coleção Firestore: `planejamento_items`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| grupoId | string | ID do grupo |
| ano | number | Ano |
| mes | number | Mês (1-12) |
| categoriaId | string | Categoria |
| descricao | string | Descrição do item |
| valorPrevisto | number | Valor esperado |
| origem | string | 'recorrente' / 'parcela' / 'manual' / 'orcamento' |
| status | string | 'pendente' / 'realizado' / 'parcial' / 'cancelado' |
| despesaId | string? | Link para despesa realizada |
| valorRealizado | number? | Valor efetivo |
| parcelamentoId | string? | Link para parcelamento mestre |

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/planejamento.html` | *(novo)* Página HTML com navbar, KPIs, checklist, gaps |
| `src/js/pages/planejamento.js` | *(novo)* Entry point: auth, listeners, render, auto-match |
| `src/js/controllers/planejamento.js` | *(novo)* Geração do plano, matching, análise de gaps |
| `src/js/utils/recurringDetector.js` | *(novo)* Detecção de despesas recorrentes |
| `src/css/planejamento.css` | *(novo)* Estilos específicos |
| `src/js/services/database.js` | CRUD `planejamento_items` + `buscarDespesasMes` |
| `firestore.rules` | Regras para `planejamento_items` |
| `firestore.indexes.json` | Índice composto grupoId+mes+ano |
| 8 páginas HTML | Link "📋 Planejamento" na navbar |

### Critérios de Aceitação
- [ ] Página acessível via navbar em todas as páginas
- [ ] Geração do plano combina recorrentes + parcelas + orçamentos
- [ ] Auto-matching atualiza status quando despesa é registrada
- [ ] KPIs calculam corretamente previsto/realizado/diferença/cobertura
- [ ] Análise de gaps identifica categorias sem plano e excesso
- [ ] Despesas não planejadas são listadas
- [ ] Navegação entre meses funciona (planos independentes)
- [ ] Primeiro mês (sem histórico) mostra apenas parcelas + orçamentos

## RF-061: Categorias e Orçamentos — Separação Despesa vs Receita
**Prioridade:** Alta | **Versão:** v3.12.0 | **Status:** ✅ Implementado

Categorias agora possuem um campo `tipo` (`'despesa'` ou `'receita'`), permitindo separar visualmente e funcionalmente categorias de despesa e categorias de receita em todas as telas relevantes.

### Funcionalidades
- Campo `tipo` no modelo `Categoria` (default: `'despesa'`)
- Seletor de tipo (Despesa / Receita) no modal de criação/edição de categoria
- Página de Categorias renderiza duas seções: "Categorias de Despesa" e "Categorias de Receita"
- Labels contextuais: "Orçamento Mensal" para despesas, "Meta Mensal" para receitas
- Toggle "Despesa conjunta padrão" oculto para categorias de receita
- Página de Orçamentos dividida em duas seções: "Orçamentos de Despesa" e "Metas de Receita"
- Chips de resumo separados: Orçado/Gasto/Disponível (despesas) e Meta/Recebido/Faltante (receitas)
- Migração automática: categorias legado sem `tipo` recebem `tipo='despesa'` no primeiro acesso

### Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/js/models/Categoria.js` | Campo `tipo` no modelo e em `CATEGORIAS_PADRAO` |
| `src/js/services/database.js` | `migrarCategoriasLegado()` — migração idempotente |
| `src/js/controllers/categorias.js` | `tipo` incluído no payload de `salvarCategoria()` |
| `src/categorias.html` | Seletor de tipo no modal + duas seções na lista |
| `src/js/pages/categorias.js` | Renderização em 2 seções, wiring do seletor, labels contextuais |
| `src/css/main.css` | Estilos para seções, seletor de tipo, chips de receita |
| `src/orcamentos.html` | Duas seções com chips distintos |
| `src/js/pages/orcamentos.js` | Filtragem por tipo, listener de receitas, chips separados |

### Critérios de Aceitação
- [ ] Categorias existentes sem `tipo` são migradas automaticamente para `tipo='despesa'`
- [ ] Nova categoria pode ser criada como Despesa ou Receita
- [ ] Página de Categorias exibe duas listas separadas
- [ ] Modal alterna label Orçamento/Meta conforme o tipo selecionado
- [ ] Toggle conjunta oculto para receitas
- [ ] Página de Orçamentos exibe seções separadas com semântica distinta
- [ ] Chips de receita mostram Meta/Recebido/Faltante corretamente
- [ ] Testes existentes continuam passando (194/194)

---

## Contexto: Cadeia Real de Pagamento de Fatura (aplicável a RF-062, RF-063, RF-064)

O pagamento da fatura do cartão na família Luigi/Ana acontece em **três etapas**, não em uma:

```
Etapa 1  [Luigi bank]  --PIX/TED--> [Ana bank]         (transferência intra-grupo)
Etapa 2  [Ana bank]    --PAG FAT--> [Cartão X]         (pagamento de fatura)
Etapa 3  [Cartão X]    ciclo mesFatura=YYYY-MM liquidado (N compras fechadas)
```

Sem modelar a cadeia, o total de gastos do mês conta o mesmo dinheiro **três vezes**: as compras individuais da fatura (ex.: R$ 3.500), o PAG FATURA no extrato da Ana (R$ 3.500) e o PIX Luigi→Ana no extrato do Luigi (R$ 1.750). Valor somado: R$ 8.750. Valor real: R$ 3.500. Erro de 150%.

**Pontos de verdade:** a fonte de gastos reais são as compras individuais da fatura (já tratadas por NRF-005/NRF-010). As etapas 1 e 2 são movimentações de liquidação e não devem compor totais de gasto familiar. Cada uma tem semântica distinta, por isso são tratadas em RFs separados:

- RF-062 — pré-requisito de modelagem (cartões como contas individuais)
- RF-063 — etapa 1 (transferência Luigi ↔ Ana)
- RF-064 — etapa 2 (pagamento da fatura no extrato da Ana)

## RF-062: Cartões de Crédito como Contas Individuais
**Prioridade:** Alta | **Versão:** v3.21.0 | **Status:** ✅ Implementado (PR #128)
**Bloqueia:** RF-064

Transforma a conta única genérica `'Cartão de Crédito'` em N contas individuais do tipo `'cartao'`, cada uma representando um cartão real da família (ex.: "Itaú Visa Luigi", "Nubank Ana", "BTG Black"). Modelagem pré-requisito para RF-064 (Reconciliação de Pagamento de Fatura), que precisa saber **qual cartão** está sendo pago pelo débito no extrato bancário.

### Motivação

Hoje, `CONTAS_PADRAO` em `models/Conta.js` cria uma única conta `tipo:'cartao'` chamada "Cartão de Crédito" para todo grupo novo. O campo `portador` é usado como identificador de pessoa/titular no upload da fatura (NRF-010), não como identificador de cartão. Com múltiplos cartões reais, o app hoje não distingue qual cartão gerou qual despesa, o que impede dashboards por cartão, limite de gasto por cartão, reconciliação do pagamento da fatura (RF-064) e visão agrupada "quanto devo no cartão X".

### Funcionalidades

- **Cartão como conta de primeira classe** — cada cartão real é uma conta `tipo:'cartao'` distinta
- **Novos campos na conta do tipo cartão:**
  - `bandeira` — `'visa'` | `'mastercard'` | `'elo'` | `'amex'` | `'hiper'` | `'outros'`
  - `emissor` — slug do banco emissor (`'itau'`, `'nubank'`, `'btg'`, `'bradesco'`, etc.) reaproveitando `bankFingerprintMap.js`
  - `ultimos4` — 4 últimos dígitos (opcional)
  - `diaFechamento` — dia do mês em que o ciclo fecha (1–31, opcional)
  - `diaVencimento` — dia do mês em que a fatura vence (1–31, opcional)
  - `contaPagadoraId` — conta `tipo:'banco'` de débito padrão (opcional, usado como hint em RF-064)
  - `titularPadraoId` — ref ao usuário que normalmente paga esse cartão (hint para RF-063 e RF-064)
- **CRUD de cartões** em `contas.html` com seção dedicada "Cartões de Crédito"
- **Ajuste no import de fatura:** dropdown "Cartão" listando só contas `tipo:'cartao'`; auto-detecção via `emissor` cruzado com `bankFingerprintMap`; prompt para criar cartão se não houver compatível
- **Remoção da conta genérica no seed:** `CONTAS_PADRAO` não cria mais "Cartão de Crédito" para grupos novos
- **Migração de dados existentes:** script idempotente `migrarCartaoGenerico` em `app.js`; marca conta legada como `_legado:true`; exibe banner persistente pedindo criação de cartões reais; despesas antigas continuam funcionando (backward compat)

### Schema Firestore — coleção `contas`

Campos novos aplicáveis apenas quando `tipo === 'cartao'`:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `bandeira` | string | Não | `'visa'`, `'mastercard'`, `'elo'`, `'amex'`, `'hiper'`, `'outros'` |
| `emissor` | string | Não | Slug do banco emissor |
| `ultimos4` | string | Não | 4 últimos dígitos |
| `diaFechamento` | number | Não | 1–31 |
| `diaVencimento` | number | Não | 1–31 |
| `contaPagadoraId` | string | Não | Ref a conta `tipo:'banco'` |
| `titularPadraoId` | string | Não | Ref ao usuário pagador default |
| `_legado` | boolean | Não | Marca a conta genérica durante migração |

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/js/models/Conta.js` | Novos campos no `modelConta()`; remover "Cartão de Crédito" de `CONTAS_PADRAO` |
| `src/js/services/database.js` | `migrarCartaoGenerico()`; helper `buscarCartoes(grupoId)` |
| `src/js/app.js` | Chamar `migrarCartaoGenerico` no boot após auth |
| `src/js/controllers/contas.js` | CRUD com novos campos |
| `src/contas.html` | Seção "Cartões de Crédito" + modal estendido |
| `src/js/pages/importar.js` | Dropdown "Cartão"; auto-detect via `emissor` |
| `src/importar.html` | Campo "Cartão" no banner de fatura |
| `tests/services/database.test.js` | Cobertura de `migrarCartaoGenerico` |
| `tests/models/Conta.test.js` | Novos campos no `modelConta` |

### Critérios de Aceitação

- [ ] `CONTAS_PADRAO` não contém mais a conta genérica "Cartão de Crédito"
- [ ] Grupo novo faz onboarding sem cartão genérico pré-criado
- [ ] Grupo existente com conta genérica + despesas antigas continua funcionando (backward compat)
- [ ] Banner de migração aparece para grupos legados e desaparece após criar ao menos um cartão real
- [ ] Modal de Contas tem seção dedicada a Cartões com todos os novos campos
- [ ] Import de fatura exige seleção de cartão (não mais contaId genérico)
- [ ] Auto-detecção por emissor funciona para Itaú, Nubank, Bradesco, BTG, Santander, Inter
- [x] Testes existentes continuam verdes (284 unitários, 26 integração)

### Riscos

- **BUG-021/022/026** — qualquer mexida no fluxo de fatura pode regredir `mesFatura`. `import-pipeline-reviewer` obrigatório no PR.
- **Despesas históricas órfãs** — decisão: não migrar automaticamente, deixar a critério do usuário.
- **NRF-010 (Portador "Conjunto")** — o campo `portador` continua significando titular/pessoa. Garantir que fatura conjunta (50/50) não quebra.

## RF-063: Transferências Intra-Grupo (Settlement entre Membros)
**Prioridade:** Alta | **Versão:** v3.22.0 | **Status:** ✅ Implementado (PR #132)
**Bloqueia:** RF-064

Introduz o tipo `'transferencia_interna'` para representar movimentações financeiras **entre membros do mesmo grupo familiar** (Luigi ↔ Ana), como a transferência PIX/TED que Luigi faz para a Ana cobrir sua parte da fatura. Essas movimentações aparecem como despesa no extrato do remetente e como receita no extrato do destinatário, mas do ponto de vista familiar são **líquido zero** e não devem compor totais de gasto nem receita.

### Motivação

O workflow real da família é: Luigi transfere sua parte (~R$ 1.750) para a Ana, que então paga a fatura inteira (~R$ 3.500) do cartão. Hoje a saída do PIX no extrato do Luigi conta como `despesa` e a entrada na Ana como `receita`, inflando agregados brutos do dashboard, consumindo orçamentos indevidamente e mostrando picos artificiais no fluxo de caixa anual.

### Funcionalidades

**1. Novo tipo `'transferencia_interna'`**

Aplicável tanto a `despesas` (remetente) quanto a `receitas` (destinatário). Seguindo o padrão do `'projecao'`:

- Persistidas no Firestore mas **filtradas fora** de todos os agregados via novo helper `isMovimentacaoReal`
- Aparecem no extrato da conta com badge visual diferenciado ("🔁 Transferência interna")
- Nunca são `isConjunta` (rateio 50/50 não se aplica)
- Não consomem `categoriaId`
- **Emparelhamento:** cada despesa `'transferencia_interna'` tem uma receita par com `contrapartidaId` cruzado

**2. Detecção automática no import**

Novo módulo `utils/detectorTransferenciaInterna.js`:

- **Regex no descritivo:** `/pix\s*(enviad|transfer|trans)|ted\s*enviad|transf\s*(para|enviad)/i`
- **Regex no destinatário:** nome de outro membro do grupo
- **Match com contraparte:** valor exato + janela temporal ±2 dias úteis + descritivo reverso no extrato da outra pessoa
- **Contas envolvidas:** conta origem ≠ destino, ambas no mesmo `grupoId`

Fluxo:
1. Durante import, identifica candidatos por regex + nome de membro
2. Busca contraparte já importada em `despesas`/`receitas` do grupo
3. Com par: cria ambos como `'transferencia_interna'`, preenche `contrapartidaId` cruzado, marca `statusReconciliacao: 'auto'`
4. Sem par: cria só um lado com `'pendente_contraparte'`
5. Batch `reconciliarTransferenciasPendentes` completa pares retroativamente quando o segundo extrato chega

**3. Registro manual**

Botão "🔁 Marcar como transferência interna" em `despesas.html` e `receitas.html` que abre modal perguntando a pessoa destinatária/remetente e oferece criar a contraparte.

**4. Hint opcional de fatura**

Campos opcionais `mesFaturaRelacionado` + `contaCartaoIdRelacionado` como etiqueta visual (ex.: "Luigi → Ana — relativo à fatura Nubank 04/2026"). **Não é a reconciliação oficial da fatura** — isso acontece em RF-064.

### Schema Firestore — coleções `despesas` e `receitas`

Novos campos aplicáveis quando `tipo === 'transferencia_interna'`:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | string | Sim | `'transferencia_interna'` |
| `contrapartidaId` | string | Sim quando emparelhado | ID da contraparte (despesa ↔ receita) |
| `membroDestinoId` | string | Sim (na despesa) | Usuário que recebeu |
| `membroOrigemId` | string | Sim (na receita) | Usuário que enviou |
| `statusReconciliacao` | string | Sim | `'auto'` \| `'manual'` \| `'pendente_contraparte'` |
| `mesFaturaRelacionado` | string | Não | `"YYYY-MM"` (hint visual) |
| `contaCartaoIdRelacionado` | string | Não | Ref a cartão (hint visual) |

### Comportamento em agregados

Novo helper em `utils/helpers.js`:

```js
export function isMovimentacaoReal(d) {
  return d.tipo !== 'projecao'
      && d.tipo !== 'transferencia_interna'
      && d.tipo !== 'pagamento_fatura';  // introduzido em RF-064
}
```

Todos os filtros existentes `tipo !== 'projecao'` devem migrar para este helper (dashboard, despesas, receitas, orçamentos, planejamento, fluxo de caixa).

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/js/models/Despesa.js` | Aceitar `'transferencia_interna'` + novos campos |
| `src/js/models/Receita.js` | Mesmo |
| `src/js/utils/helpers.js` | Novo helper `isMovimentacaoReal(d)` |
| `src/js/utils/detectorTransferenciaInterna.js` | *(novo)* Heurísticas de detecção e match |
| `src/js/pages/importar.js` | Chamar detector após `classificarBanco` no pipeline bancário |
| `src/js/services/database.js` | `reconciliarTransferenciasPendentes(grupoId)`; `listarMembrosGrupo(grupoId)` |
| `src/js/controllers/dashboard.js` | Usar `isMovimentacaoReal` |
| `src/js/pages/despesas.js` | Mesmo; ação "Marcar como transferência interna"; badge visual |
| `src/js/pages/receitas.js` | Mesmo |
| `src/js/controllers/orcamentos.js` | Mesmo |
| `src/js/controllers/planejamento.js` | Mesmo |
| `src/js/pages/fluxo-caixa.js` | Mesmo |
| `tests/utils/detectorTransferenciaInterna.test.js` | *(novo)* |
| `tests/integration/transferenciasInternas.test.js` | *(novo)* |

### Critérios de Aceitação

- [x] Novo tipo `'transferencia_interna'` é aceito por Despesa e Receita
- [x] Helper `isMovimentacaoReal` é usado em todos os agregados
- [x] Dashboard não soma transferências internas em "gastos" nem "receita" do mês
- [x] Detector identifica PIX Luigi → Ana automaticamente pelo descritivo + nome do membro
- [x] Match com contraparte cria `contrapartidaId` cruzado quando ambos os extratos estão no banco
- [x] Transferência sem par fica como `'pendente_contraparte'`
- [x] Batch `reconciliarTransferenciasPendentes` completa pares retroativamente
- [x] Ação manual permite marcar despesa/receita existente como transferência interna
- [x] Badge visual "🔁 Transferência interna" no extrato da conta
- [ ] Hint `mesFaturaRelacionado` aparece como etiqueta visual quando preenchido (etiqueta de dados salva; UI de exibição fica para RF-064)
- [x] Testes existentes continuam verdes (284 unitários passando)

### Riscos

- **Falsos positivos** — um PIX real para terceiros pode ter nome "Ana". Mitigação: match só com membros cadastrados + valor ≥ R$ 100 + contas já mapeadas.
- **NRF-010** — transferências internas nunca são `isConjunta`. Cobrir com teste.
- **Histórico** — transferências antigas continuam como despesa/receita até reconciliação manual. Botão em massa na aba Gerenciar fica para release futura.

## RF-064: Reconciliação de Pagamento de Fatura de Cartão
**Prioridade:** Alta | **Versão:** TBD | **Status:** ⚪ Pendente
**Depende de:** RF-062 e RF-063

Introduz o tipo `'pagamento_fatura'` ligando a linha de débito no extrato bancário (PAG FATURA na conta pagadora) à fatura de cartão que ela liquida. Junto com RF-063, completa a modelagem da cadeia real de pagamento Luigi → Ana → Cartão.

### Posição na cadeia

```
[Luigi bank] --PIX Ana--> [Ana bank]    ← RF-063 trata aqui (transferencia_interna)
[Ana bank]   --PAG FAT--> [Cartão X]    ← RF-064 trata aqui (pagamento_fatura)
[Cartão X]   ciclo mesFatura=YYYY-MM liquidado (compras do ciclo)
```

RF-064 **não** tenta rastrear quem financiou cada centavo do pagamento. A linha PAG FATURA no extrato é um evento único ligado a um ciclo único. Se o pagador usou dinheiro próprio + transferências recebidas, isso é tratado na etapa 1 (RF-063) e não afeta a reconciliação cartão↔extrato.

### Motivação

Hoje o app trata os dois lados do pagamento de fatura de forma inconsistente:

- **Lado fatura** — `normalizadorTransacoes.js` linha 106 descarta silenciosamente linhas com `pagamento de fatura|inclusao de pagamento|parcela de fatura rotativo`
- **Lado extrato** — `pipelineBanco.classificarBanco()` classifica toda linha negativa como `despesa`, sem regra especial para PAG FATURA

Resultado: uma fatura de R$ 3.500 com 40 compras detalhadas + o pagamento de R$ 3.500 no extrato são contados como R$ 7.000 de gastos no mês.

### Funcionalidades

**1. Novo tipo `'pagamento_fatura'`**

Adicionado ao enum de `tipo` existente. Linhas com `'pagamento_fatura'`:

- Persistidas no Firestore normalmente
- Filtradas fora dos agregados via `isMovimentacaoReal` (helper de RF-063)
- Aparecem na página de Fatura como "liquidação do ciclo"
- Aparecem no extrato da conta pagadora com badge visual diferenciado
- Nunca são `isConjunta`
- Não consomem `categoriaId`

**2. Detecção automática no pipeline bancário**

Novo módulo `utils/reconciliadorFatura.js`. Em `pipelineBanco.js`, após `classificarBanco()` e após o detector de transferências internas (RF-063), novo passo `detectarPagamentoFatura()` varre linhas `tipoLinha: 'despesa'` restantes:

- **Regex:** `/pag(amento|to)?\s*(da\s*)?fatura|pag\s*cart[aã]o|pagto\s*cart|fatura\s*(itau|nubank|bradesco|btg|visa|mastercard)/i`
- **Match de valor:** valor == total líquido da fatura de algum cartão (`soma(despesas where mesFatura=X and contaCartaoId=Y and tipo='despesa') - soma(estornos)`)
- **Janela temporal:** ±5 dias úteis do `diaVencimento` do cartão candidato
- **Conta de destino:** bate com `contaPagadoraId` do cartão (quando preenchido)

Score 0–100 + candidatos:
- **≥ 90 e candidato único** → auto-reconciliação silenciosa
- **60–89 ou múltiplos candidatos** → `statusReconciliacao: 'pendente'`, aparece na UI
- **< 60** → mantém como `'despesa'` normal

**3. UI de Reconciliação**

Nova aba "🔗 Reconciliação" em `fatura.html`, com quatro seções:

- **Ciclos abertos** — faturas com `mesFatura` atual/futuro sem pagamento
- **Ciclos fechados não pagos** — faturas passadas sem `pagamento_fatura` linkado (alerta)
- **Ciclos pagos** — com pagamento linkado, mostrando data/valor/conta origem
- **Pagamentos pendentes** — `'pagamento_fatura'` com `statusReconciliacao: 'pendente'`

Ações:
- **Linkar** — dropdown de ciclos candidatos; atualiza `mesFaturaPago` + `contaCartaoId` + `'manual'`
- **Ignorar** — volta `tipo` para `'despesa'`
- **Desvincular** — limpa os campos de reconciliação
- **Registrar pagamento manual** — modal para criar `'pagamento_fatura'` manualmente

**4. Tratamento de casos especiais**

- **Pagamento parcial** — valor < total. Marca `'parcial'`, UI mostra "pagamento parcial de R$ X de R$ Y"
- **Pagamento antecipado** — débito antes do fechamento. Auto-detecção encontra ciclo aberto mais próximo
- **Refinanciamento/rotativo** — "parcela de fatura rotativo" continua descartada no pipelineCartao
- **Fatura zerada por estornos** — ciclo com total líquido = 0 não gera candidato
- **Importação em ordem errada** — extrato antes da fatura. Batch `reconciliarPagamentosPendentes` reavalia candidatos dos últimos 90 dias quando a fatura chega
- **Cadeia Luigi → Ana → Cartão** — a transferência Luigi → Ana já foi tratada por RF-063 e não aparece como candidata (já marcada como `'transferencia_interna'`)

### Schema Firestore — coleção `despesas`

Novos campos aplicáveis quando `tipo === 'pagamento_fatura'`:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | string | Sim | `'pagamento_fatura'` |
| `mesFaturaPago` | string | Sim quando reconciliado | `"YYYY-MM"` do ciclo quitado |
| `contaCartaoId` | string | Sim quando reconciliado | Ref a conta `tipo:'cartao'` |
| `statusReconciliacao` | string | Sim | `'auto'` \| `'manual'` \| `'pendente'` \| `'parcial'` \| `'ignorado'` |
| `reconciliadoEm` | timestamp | Não | Quando o link foi criado |
| `contaId` | string | Sim | Conta bancária que debitou (NRF-004) |

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/js/models/Despesa.js` | Aceitar `'pagamento_fatura'` + novos campos |
| `src/js/utils/helpers.js` | Atualizar `isMovimentacaoReal` para excluir `'pagamento_fatura'` |
| `src/js/utils/reconciliadorFatura.js` | *(novo)* Heurísticas de match |
| `src/js/pages/pipelineBanco.js` | Novo passo `detectarPagamentoFatura` após detector de transferências |
| `src/js/pages/importar.js` | Integração no preview; badge visual |
| `src/js/services/database.js` | `buscarFaturaLiquida()`; `listarPagamentosPendentes()`; `reconciliarPagamentosPendentes()` |
| `src/js/pages/fatura.js` | Nova aba "Reconciliação" com 4 seções |
| `src/fatura.html` | Markup da nova aba |
| `src/css/main.css` | Classes `rec-*` |
| `firestore.indexes.json` | Índice composto `grupoId + tipo + statusReconciliacao` |
| `tests/utils/reconciliadorFatura.test.js` | *(novo)* |
| `tests/pages/pipelineBanco.test.js` | Cobertura de `detectarPagamentoFatura` |
| `tests/integration/reconciliacaoFatura.test.js` | *(novo)* End-to-end |

### Critérios de Aceitação

- [ ] Novo tipo `'pagamento_fatura'` aceito pelo modelo Despesa
- [ ] Dashboard não soma `'pagamento_fatura'` em "gastos do mês"
- [ ] Orçamento por categoria não é afetado
- [ ] Pipeline detecta candidato por regex + valor + janela temporal + conta destino
- [ ] Auto-reconciliação silenciosa quando score ≥ 90 e candidato único
- [ ] Múltiplos candidatos → `'pendente'` para decisão manual
- [ ] Pagamento parcial detectado e marcado como `'parcial'`
- [ ] UI lista ciclos abertos/fechados/pagos/pendentes corretamente
- [ ] Ações Linkar/Ignorar/Desvincular/Registrar Manual funcionam
- [ ] Batch `reconciliarPagamentosPendentes` reavalia pendentes após import retroativo
- [ ] Linhas `'pagamento_fatura'` aparecem no extrato com badge visual
- [ ] Fatura mostra "ciclo liquidado em DD/MM/AAAA pelo débito X no Banco Y"
- [ ] **Cadeia Luigi → Ana → Cartão funciona end-to-end nos testes de integração:**
  - Import do extrato do Luigi → PIX para Ana vira `'transferencia_interna'`
  - Import do extrato da Ana → PIX recebido emparelha; PAG FATURA vira `'pagamento_fatura'` linkado ao ciclo
  - Dashboard mostra R$ 3.500 de gastos (valor real), não R$ 8.750
- [ ] Testes existentes continuam verdes
- [ ] Cobertura ≥ 85% em `reconciliadorFatura.js`
- [ ] `import-pipeline-reviewer` aprova PR sem regressão em BUG-021/022/026
- [ ] `security-reviewer` aprova uso de `escHTML` na nova UI

### Riscos

- **Double count histórico** — despesas antigas importadas como "pag fatura" continuam como `'despesa'`. Batch retroativo cobre 90 dias; casos mais antigos via Gerenciar (RF-018).
- **BUG-021/022/026** — lógica nova vive em `reconciliadorFatura.js` sem tocar em `pipelineCartao.js` nem em `normalizadorTransacoes.js:106`
- **Ordem de detecção** — RF-063 (transferência) deve rodar **antes** de RF-064 (pagamento) no pipeline bancário
- **NRF-010** — pagamentos de fatura nunca são `isConjunta`
- **Performance** — cachear fatura líquida em memória durante o import para evitar queries linha a linha
