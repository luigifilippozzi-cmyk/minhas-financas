# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

---

## [1.4.0] - 2026-03-25

### Adicionado
- **Fluxo de Caixa** (nova página `fluxo-caixa.html`): visão orçamentária anual mês a mês
  - Gráfico combinado (Chart.js v4, open-source): barras de Receitas/Despesas/Orçado + linha de Saldo Acumulado no eixo direito
  - Cards de resumo: Total Receitas, Total Despesas, Saldo do Ano, Total Orçado
  - Tabela detalhada mês a mês com: Receitas | Despesas | Orçado | Saldo Mês | Saldo Acumulado | Situação
  - Badge por situação: Positivo, Negativo, Acima do Orçado, Previsto (meses futuros), Sem dados
  - Mês atual destacado; meses futuros com estilo diferenciado (itálico, badge "Previsto")
  - Seletor de ano com recarga automática dos dados
  - Projeções (tipo='projecao') contabilizadas separadamente para transparência
- **database.js**: funções `buscarDespesasAno`, `buscarReceitasAno` e `buscarOrcamentosAno` para consultas anuais no Firestore
- Link "📈 Fluxo de Caixa" adicionado à navbar em todas as páginas

### Tecnologia
- **Chart.js v4.4.6** integrado via CDN jsDelivr (github.com/chartjs/Chart.js) — licença MIT

---

## [1.3.0] - 2026-03-23

### Adicionado
- **Módulo de Receitas** (RF-016): gestão completa de receitas do grupo
  - Página dedicada `receitas.html` com CRUD (criar, editar, excluir)
  - Navegação por mês (‹ / ›) com chips de total e contagem
  - Modal de nova/edição com campos: descrição, valor, categoria, data
  - Categorias de receita padrão criadas automaticamente: Salário 💼, Rendimentos 📈, Freelance 💻, Aluguel Recebido 🏠, Outros 🎁
  - `garantirCategoriasReceita` auto-cria categorias para grupos já existentes
- **Dashboard — Seção Receitas**: exibe Total Receitas, Saldo (Receitas − Despesas) e grid por categoria com barra de progresso verde
- Link "📥 Receitas" adicionado à navbar em todas as páginas

### Alterado
- `app.js`: novos listeners `ouvirReceitas` e `ouvirCategoriasReceita`; saldo re-calculado ao mudar despesas

---

## [1.2.0] - 2026-03-22

### Adicionado
- **NRF-001: Contas Compartilhadas** — chips de total por usuário para despesas do tipo "Conjunta" na página de Despesas

### Corrigido
- **Bug #90**: despesas do tipo "Conjunta" eram salvas como individuais (`isConjunta: false`) devido a cache do CDN no `Despesa.js`; `isConjunta`/`valorAlocado` movidos para o objeto base do model
- Chips de responsável não distribuíam despesas conjuntas para todos os membros do grupo

---

## [1.1.0] - 2026-03-10

### Adicionado
- RF-015: Recuperação de senha via Firebase Auth (`sendPasswordResetEmail`)
- NRF-002: Reconciliação fuzzy de parcelas projetadas no import de extratos

---

## [1.0.0] - Em produção

### Implementado
- RF-001: Autenticação (Firebase Auth — email/senha)
- RF-002: Grupos familiares com código de convite
- RF-003: Categorias personalizáveis (nome, emoji, cor)
- RF-004: Orçamento mensal por categoria com navegação de período
- RF-005–RF-011: CRUD de Despesas com sync em tempo real (Firestore onSnapshot)
- RF-012: Exportação CSV
- RF-013: Importação via Excel (SheetJS) com deduplicação e projeção de parcelas
- RF-014: Gestão multi-usuário de cartão de crédito (responsável, chips, parcelamentos)

---

<!-- Template para novas versões:

## [X.Y.Z] - YYYY-MM-DD
### Adicionado
- Nova funcionalidade X

### Alterado
- Comportamento de Y foi atualizado

### Corrigido
- Bug em Z foi corrigido

### Removido
- Funcionalidade W foi removida

-->
