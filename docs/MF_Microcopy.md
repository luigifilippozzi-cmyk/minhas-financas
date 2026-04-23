# MF Microcopy — Guia de Tom e Vocabulário

> NRF-UX F8 (#200) · v3.39.7 · 2026-04-22

---

## Tom de voz

**Direto, curto, sem jargão bancário.** O app fala como um amigo organizado falaria com Luigi e Ana — não como um extrato de banco.

| ✅ Preferir | ❌ Evitar |
|---|---|
| `Salvo` | `Operação realizada com sucesso` |
| `Não consegui salvar` | `Erro inesperado ao processar sua solicitação` |
| `Verifique sua conexão` | `Falha na comunicação com o servidor` |
| `Sem despesas este mês` | `Nenhum registro encontrado para o período selecionado` |
| `Adicione a primeira` | `Não há itens cadastrados` |

**Conjugação:** imperativo em CTAs (`Salvar`, `Criar`, `Importar`). Segunda pessoa direta nos textos explicativos.

**Comprimento:** mensagens de erro ≤ 2 linhas. CTAs ≤ 3 palavras.

---

## Botões — Padrão

### Criar (ação primária)
| Contexto | Label |
|---|---|
| Nova despesa | `+ Nova Despesa` |
| Nova receita | `+ Nova Receita` |
| Novo cartão | `+ Novo Cartão` |
| Nova categoria | `+ Nova Categoria` |
| Novo investimento | `+ Novo Investimento` |
| Nova dívida | `+ Nova Dívida` |
| Novo item de planejamento | `+ Adicionar Item` |

### Salvar / Confirmar
| Contexto | Label |
|---|---|
| Formulário geral | `Salvar` |
| Saldo de conta | `Salvar Saldo` |
| Ação destrutiva (confirmação) | `Excluir` ou `Confirmar` |

### Navegação de período
Usar `‹` e `›` como ícones isolados (sem texto). Adicionar `title="Mês anterior"` / `title="Próximo mês"` para acessibilidade.

### Estados de carregamento
Adicionar `…` ao label do botão: `Salvando…`, `Criando…`, `Excluindo…`, `Importando…`.

---

## Empty States — Padrão

### Sem dados (verdadeiro)
Estrutura: **mensagem curta** + **ação sugerida** (quando aplicável).

| Tela | Mensagem | CTA sugerida |
|---|---|---|
| Despesas — lista vazia | `Sem despesas em {mês}. Adicione a primeira.` | `+ Nova Despesa` |
| Receitas — lista vazia | `Sem receitas em {mês}.` | `+ Nova Receita` |
| Categorias — lista vazia | `Nenhuma categoria ainda. Crie a primeira!` | `+ Nova Categoria` |
| Fatura — sem transações | `Nenhuma transação neste período.` | — |
| Base de dados — sem resultados de filtro | `Nenhuma transação para os filtros selecionados.` | — |
| Orçamentos — sem categorias | `Adicione categorias para criar orçamentos.` | — |
| Investimentos — lista vazia | `Nenhum investimento cadastrado.` | `+ Novo Investimento` |
| Passivos — lista vazia | `Nenhuma dívida cadastrada.` | `+ Nova Dívida` |

### Carregando (transitório)
Usar skeletons (ver F5 — já implementado). Texto de fallback: `Carregando…`

---

## Validação de Formulários — Padrão

**Regra:** nunca usar `alert()`. Exibir erro inline, próximo ao campo com problema.

| Campo | Mensagem de erro |
|---|---|
| Descrição vazia | `Informe uma descrição.` |
| Valor inválido / vazio | `Informe um valor válido.` |
| Data ausente | `Informe a data.` |
| Categoria não selecionada | `Selecione uma categoria.` |
| Responsável não selecionado | `Selecione o responsável.` |

**Formato:** frase curta, sem ponto de exclamação, com ponto final.

---

## Mensagens de Erro — Padrão

### Operações de rede (salvar, excluir, carregar)
Preferir mensagem específica ao contexto. Se não souber a causa: mencionar conexão.

| Operação | Mensagem |
|---|---|
| Salvar despesa falhou | `Não consegui salvar a despesa. Verifique sua conexão.` |
| Salvar receita falhou | `Não consegui salvar a receita. Verifique sua conexão.` |
| Salvar cartão falhou | `Não consegui salvar o cartão. Tente novamente.` |
| Excluir falhou | `Não consegui excluir. Tente novamente.` |
| Carregar falhou | `Não consegui carregar os dados. Verifique sua conexão.` |
| Operação genérica falhou | `Algo deu errado. Tente novamente.` |

### Erros de importação
| Situação | Mensagem |
|---|---|
| Arquivo não reconhecido | `Não reconheci este arquivo. Use CSV ou XLSX do banco.` |
| Nenhuma transação encontrada | `Nenhuma transação encontrada no arquivo.` |
| Algumas linhas com erro | `{n} linha{s} não puderam ser importadas.` |

---

## Mensagens de Sucesso — Padrão

### Salvar / Criar
Usar toast curto: sem ponto de exclamação, com ✅.

| Operação | Toast |
|---|---|
| Despesa salva | `✅ Despesa salva` |
| Receita salva | `✅ Receita salva` |
| Categoria criada | `✅ Categoria criada` |
| Cartão salvo | `✅ Cartão salvo` |
| Saldo salvo | `✅ Saldo atualizado` |

### Importação
Manter o padrão atual de importar.js (detalhado é útil aqui — o usuário quer saber quantas linhas foram processadas).

---

## Placeholders — Padrão

Sempre usar `Ex:` como prefixo quando o campo aceita formato livre.
Campos numéricos: mostrar exemplo real (`Ex: 3.500,00`), não `0,00`.
Campos de busca: `Buscar por descrição…` (com reticências).

---

## Glossário de Termos

| Termo a usar | Sinônimos a evitar |
|---|---|
| Despesa | Gasto, Lançamento, Débito |
| Receita | Entrada, Crédito |
| Cartão | Cartão de crédito (exceto quando necessário diferenciar) |
| Fatura | Extrato, Fechamento |
| Parcelamento | Compra parcelada (só usar quando o contexto é novo parcelamento) |
| Projeção | Parcela futura, Previsão |
| Importar | Upload, Carregar arquivo |
| Categoria | Tag, Label |
| Grupo | Família (só usar para clareza contextual) |
| Planejamento | Orçamento mensal (Planejamento = mês inteiro; Orçamento = por categoria) |

---

## 20 Exemplos de Antes × Depois

| # | Antes | Depois | Tipo |
|---|---|---|---|
| 1 | `Operação realizada com sucesso` | `✅ Salvo` | Sucesso genérico |
| 2 | `Nenhuma transação encontrada para os filtros selecionados.` | `Nenhuma transação para os filtros selecionados.` | Empty state filtro |
| 3 | `Erro ao salvar saldo. Tente novamente.` | `Não consegui salvar o saldo. Tente novamente.` | Erro de rede |
| 4 | `Nenhuma receita registrada neste mês.` | `Sem receitas em {mês}.` | Empty state |
| 5 | `Nenhum cartão cadastrado. Clique em "+ Novo Cartão" para adicionar.` | `Nenhum cartão. Adicione o primeiro.` | Empty state |
| 6 | `Erro ao carregar fatura. Verifique sua conexão e tente novamente.` | `Não consegui carregar a fatura. Verifique sua conexão.` | Erro de carregamento |
| 7 | `Informe uma descrição.` (alert) | Erro inline abaixo do campo | Validação |
| 8 | `Você está prestes a excluir {n} transação permanentemente.` | `Excluir {n} transação{ões} permanentemente?` | Confirmação destrutiva |
| 9 | `Nenhuma categoria de despesa. Crie a primeira!` | `Nenhuma categoria ainda. Crie a primeira!` | Empty state |
| 10 | `Confirmar tipo` | `Confirmar` | Botão (curtar) |
| 11 | `Selecione um cartão para ver os dados de liquidação.` | `Selecione um cartão.` | Instrução de seleção |
| 12 | `Erro ao excluir receita.` | `Não consegui excluir a receita.` | Erro de operação |
| 13 | `SheetJS não carregado.` | `Não consegui gerar o template. Recarregue a página.` | Erro técnico traduzido |
| 14 | `Selecione uma categoria` (sem ponto) | `Selecione uma categoria.` | Validação (consistência) |
| 15 | `Sem meta definida` | `Sem meta` | Label curto |
| 16 | `Sem limite definido` | `Sem limite` | Label curto |
| 17 | `— selecione —` | `— selecione —` | Manter (padrão OK) |
| 18 | `Buscar descrição...` | `Buscar por descrição…` | Placeholder (consistência, reticências tipográficas) |
| 19 | `❌ Erro ao atualizar. Tente novamente.` | `Não consegui atualizar. Tente novamente.` | Erro toast (remover ❌) |
| 20 | `Criando…` (botão loading) | `Criando…` | Manter (padrão OK) |
