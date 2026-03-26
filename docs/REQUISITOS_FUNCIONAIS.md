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
| RF-013 | Importação de Transações via Excel | Média | ✅ Implementado |
| RF-014 | Gestão Multi-Usuário de Cartão de Crédito | Alta | ✅ Implementado |
| RF-015 | Recuperação de Senha | Média | ✅ Implementado |
| RF-016 | Gestão de Receitas | Alta | ✅ Implementado |
| NRF-001 | Contas Compartilhadas (divisão conjunta) | Alta | ✅ Implementado |
| NRF-002 | Reconciliação Fuzzy de Parcelas + CSV Nativo de Cartão | Média | ✅ Implementado |
| NRF-003 | Fluxo de Caixa — Visão Orçamentária Anual | Alta | ✅ Implementado |
| NRF-004 | Identificação de Conta/Banco por Transação | Alta | ✅ Implementado |
| NRF-005 | Fatura do Cartão de Crédito | Alta | ✅ Implementado |
| NRF-008 | Deduplicação de Transações | Alta | ✅ Implementado |

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

## RF-013: Importação de Transações via Excel
**Prioridade:** Média | **Versão:** v0.7.0 | **Status:** ✅ Implementado

- Template Excel disponível para download com colunas: Data, Descrição, Valor (R$), Categoria
- Sheet "Instruções" no template explica como preencher
- Página dedicada `importar.html` com área de upload (drag & drop ou clique)
- Parse do arquivo Excel via SheetJS (client-side, sem servidor)
- Tabela de preview com todas as transações lidas do arquivo
- Dropdown por linha para mapear/confirmar a categoria de cada transação
- Checkbox por linha para incluir/excluir transações individuais
- Importação em lote para o Firestore (mesma estrutura das despesas manuais)
- Flag `origem: 'importacao'` nas despesas importadas para rastreabilidade
- Ambos os membros do grupo veem as despesas importadas em tempo real (onSnapshot)

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
- Seção dedicada entre o Dashboard de Orçamentos e a lista de Despesas
- Card **Total Receitas** (verde) e card **Saldo** (Receitas − Despesas, verde/vermelho)
- Grid de categorias com barra de progresso verde e percentual por categoria

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
| **Exclusão automática de créditos** | Linhas com valor negativo (créditos/estornos) recebem `erro` e ficam desmarcadas no preview |
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
- [x] Créditos/estornos excluídos automaticamente no modo fatura
- [x] `dataOriginal` salvo no Firestore e visível no preview
- [x] Trocar mês de vencimento atualiza o preview em tempo real

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
