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
| NRF-002 | Reconciliação Fuzzy de Parcelas | Média | ✅ Implementado |
| NRF-003 | Fluxo de Caixa — Visão Orçamentária Anual | Alta | ✅ Implementado |

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

## NRF-002: Reconciliação Fuzzy de Parcelas
**Prioridade:** Média | **Versão:** v1.1.0 | **Status:** ✅ Implementado

- Ao importar extrato, verifica se existe projeção futura para a transação usando fuzzy matching
- Critérios de match: estabelecimento similar (distância Levenshtein), valor próximo e mês seguinte
- Match confirmado: despesa real substitui a projeção (status `projecao_paga`)
- Badge âmbar "~Reconciliada" nas linhas de preview do import
- `parcelamentos` coleção mestre para rastrear qtd de parcelas pagas vs. total

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
