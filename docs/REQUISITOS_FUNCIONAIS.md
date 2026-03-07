# 📋 Requisitos Funcionais — Minhas Finanças

| # | Requisito | Prioridade | Status |
|---|-----------|-----------|--------|
| RF-001 | Autenticação de Usuários | Alta | ✅ Implementado |
| RF-002 | Gerenciamento de Grupos Familiares | Alta | 🔵 Em Desenvolvimento |
| RF-003 | Gerenciamento de Categorias | Alta | ⬜ Não Implementado |
| RF-004 | Orçamento Mensal por Categoria | Alta | ⬜ Não Implementado |
| RF-005 | Registro de Despesas | Alta | 🟡 Parcial (frontend estático) |
| RF-006 | Visualização de Despesas | Alta | 🟡 Parcial (frontend estático) |
| RF-007 | Edição de Despesas | Média | ⬜ Não Implementado |
| RF-008 | Exclusão de Despesas | Média | ⬜ Não Implementado |
| RF-009 | Dashboard de Orçamentos | Alta | ⬜ Não Implementado |
| RF-010 | Filtros e Período | Média | ⬜ Não Implementado |
| RF-011 | Sincronização em Tempo Real | Alta | ⬜ Não Implementado |
| RF-012 | Exportação de Dados | Baixa | ⬜ Não Implementado |

---

## RF-001: Autenticação de Usuários
**Prioridade:** Alta | **Versão:** v0.1.0 | **Status:** ✅ Implementado

- Usuário pode criar conta com email e senha
- Usuário pode fazer login com email e senha
- Usuário pode fazer logout
- Senha com mínimo de 6 caracteres
- Validação de formato de email

## RF-002: Gerenciamento de Grupos Familiares
**Prioridade:** Alta | **Versão:** v0.2.0 | **Status:** 🔵 Em Desenvolvimento

- Usuário pode criar novo grupo familiar
- Sistema gera código de convite de 6 caracteres
- Outro usuário pode entrar no grupo usando o código
- Máximo de 2 usuários por grupo (fase inicial)

## RF-003: Gerenciamento de Categorias
**Prioridade:** Alta | **Versão:** v0.3.0

- 6 categorias padrão são criadas ao criar um grupo
- CRUD completo de categorias (criar, ler, atualizar, excluir)
- Campos: nome, emoji, cor (hex)
- Categorias são sincronizadas entre os membros do grupo

## RF-004: Orçamento Mensal por Categoria
**Prioridade:** Alta | **Versão:** v0.5.0

- Definir valor de orçamento por categoria
- Orçamento é mensal (renova todo mês automaticamente)
- Orçamento é compartilhado entre membros do grupo

## RF-005: Registro de Despesas
**Prioridade:** Alta | **Versão:** v0.4.0

- Campos: descrição, valor, categoria, data
- Sistema registra automaticamente o usuário criador
- Sincronização instantânea para todos os membros

## RF-006: Visualização de Despesas
**Prioridade:** Alta | **Versão:** v0.4.0

- Lista todas as despesas do grupo
- Identifica visualmente quem lançou cada despesa
- Ordenação por data (mais recente primeiro)

## RF-007: Edição de Despesas
**Prioridade:** Média | **Versão:** v1.0.0

- Qualquer membro pode editar despesas
- Histórico de edições registrado

## RF-008: Exclusão de Despesas
**Prioridade:** Média | **Versão:** v1.0.0

- Confirmação antes de excluir
- Totais recalculados automaticamente

## RF-009: Dashboard de Orçamentos
**Prioridade:** Alta | **Versão:** v0.5.0

- Mostra todas as categorias com orçamento, gasto e percentual
- Indicadores visuais:
  - 🟢 Verde: 0–70% do orçamento
  - 🟡 Amarelo: 70–90% do orçamento
  - 🔴 Vermelho: 90–100% do orçamento
  - ⚠️ Crítico: >100% do orçamento

## RF-010: Filtros e Período
**Prioridade:** Média | **Versão:** v1.0.0

- Filtrar despesas por mês/ano
- Filtrar despesas por categoria

## RF-011: Sincronização em Tempo Real
**Prioridade:** Alta | **Versão:** v0.4.0

- Usar listeners do Firestore (onSnapshot)
- UI é atualizada automaticamente sem necessidade de refresh

## RF-012: Exportação de Dados
**Prioridade:** Baixa | **Versão:** pós v1.0.0

- Exportar despesas do período para CSV
- Incluir todas as colunas relevantes
