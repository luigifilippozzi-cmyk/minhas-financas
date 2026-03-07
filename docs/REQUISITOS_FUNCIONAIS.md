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
