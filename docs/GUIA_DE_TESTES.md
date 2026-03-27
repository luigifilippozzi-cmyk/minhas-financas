# 🧪 Guia de Testes — Minhas Finanças v3.0

> **Como usar este guia:** Siga cada seção na ordem indicada. Para cada caso de teste, execute a ação descrita, compare com o resultado esperado, e marque ✅ se passou ou 🐛 se encontrou um bug. Reporte bugs criando uma issue no GitHub com a label `bug` e `blocker` (se impedir o fluxo principal).

---

## 📋 Visão Geral

| Item | Detalhe |
|------|---------|
| **URL da aplicação** | https://minhas-financas-285da.web.app |
| **Repositório** | https://github.com/luigifilippozzi-cmyk/minhas-financas |
| **Milestone de testes** | [v1.0 — QA & Testes de Aceitação](https://github.com/luigifilippozzi-cmyk/minhas-financas/milestone/7) |
| **Total de RFs** | 22+ (RF-001 a RF-022 + NRFs) |
| **Casos de teste** | 9 suítes (TC-001 a TC-009) |

---

## 🛠️ Preparação do Ambiente

### O que você vai precisar

- **Dois navegadores** (ou dois perfis do Chrome) — um para cada usuário
  - Usuário A: seu perfil principal
  - Usuário B: janela anônima ou outro navegador
- **Um arquivo de extrato** no formato XP (CSV ou XLSX) para testar a importação
- **O template** disponível para download em `/base-dados.html` (aba Importar)

### Antes de começar

1. Crie duas contas de teste (emails distintos, ex: `teste.a@gmail.com` e `teste.b@gmail.com`)
2. Abra a aplicação nos dois navegadores simultaneamente
3. Tenha o GitHub aberto para registrar bugs encontrados

---

## 📌 Como Registrar um Bug no GitHub

Quando encontrar um comportamento inesperado:

1. Acesse https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/new
2. **Título:** `[BUG] Descrição curta do problema`
3. **Labels:** adicione `bug` + label da RF afetada (ex: `rf-005`) + `blocker` se impedir uso
4. **Milestone:** selecione `v1.0 — QA & Testes de Aceitação`
5. **Corpo:** inclua:
   - Passos para reproduzir
   - Resultado esperado vs. resultado obtido
   - Screenshot ou vídeo (se possível)

### Como marcar um teste concluído no GitHub

Cada suíte de testes está em uma issue (#29 a #35). Para marcar itens:
1. Abra a issue correspondente
2. Os checkboxes `- [ ]` são clicáveis diretamente na interface do GitHub
3. Clique em cada checkbox à medida que conclui o teste

---

## 🔐 TC-001 — Autenticação e Grupos Familiares

**Issue:** [#29 no GitHub](https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/29)
**RFs cobertas:** RF-001, RF-002

### Passo a passo

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acesse a URL → tela de login | Formulário com campos email/senha |
| 2 | Crie conta com email válido + senha ≥ 6 chars | Redirecionado para `/grupo.html` |
| 3 | Tente criar conta com senha de 5 chars | Erro de validação; formulário não submete |
| 4 | Faça logout (botão no menu) | Redirecionado para `/login.html` |
| 5 | Faça login com email/senha corretos | Redirecionado para `/index.html` |
| 6 | Tente login com senha errada | Mensagem de erro exibida |
| 7 | Em `/grupo.html`, crie um grupo com nome | Código de convite de 6 caracteres aparece |
| 8 | No Usuário B: insira o código de 6 chars | Usuário B entra no grupo |
| 9 | Usuário B tenta código "ZZZZZZ" | Mensagem de erro; sem ingresso |

---

## 📂 TC-002 — Categorias e Orçamentos

**Issue:** [#35 no GitHub](https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/35)
**RFs cobertas:** RF-003, RF-004

### Categorias (`/categorias.html`)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acesse `/categorias.html` | 6 categorias padrão listadas |
| 2 | Clique "+ Nova Categoria" → preencha nome, emoji, cor → salve | Categoria aparece na lista |
| 3 | Clique editar em uma categoria → altere nome → salve | Nome atualizado; Usuário B vê a mudança sem reload |
| 4 | Clique desativar em uma categoria → confirme | Categoria some da lista; histórico de despesas preservado |

### Orçamentos (`/orcamentos.html`)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 5 | Clique no valor de uma categoria → digite novo valor → Enter | Valor salvo (debounce 800ms); chips Total/Gasto/Disponível atualizados |
| 6 | Clique ‹ / › para navegar meses | Orçamentos do mês correto carregados |
| 7 | Em mês sem orçamentos → clique "Copiar mês anterior" | Valores do mês anterior copiados |
| 8 | Usuário A edita orçamento → Usuário B observa | Atualização em tempo real sem reload |

---

## 💸 TC-003 — Despesas, Filtros e Sincronização

**Issue:** [#36 no GitHub](https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/36)
**RFs cobertas:** RF-005, RF-006, RF-007, RF-008, RF-010, RF-011

### CRUD de Despesas (`/despesas.html`)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clique "+ Nova Despesa" → preencha todos os campos → salve | Despesa na lista com badge colorido da categoria |
| 2 | Verifique o campo "Responsável" no formulário | Dropdown com membros do grupo |
| 3 | Tente salvar sem preencher descrição | Campo destacado como inválido; sem submit |
| 4 | Clique editar numa despesa → altere o valor → salve | Modal pré-preenchido; valor atualizado na lista |
| 5 | Clique excluir → confirme no modal | Despesa removida; chips de total atualizados |
| 6 | Clique excluir → clique "Cancelar" | Despesa preservada |

### Filtros

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 7 | Selecione categoria no filtro | Apenas despesas da categoria exibidas |
| 8 | Digite texto na busca | Lista filtrada em tempo real |
| 9 | Selecione responsável no filtro | Apenas despesas do responsável selecionado |
| 10 | Clique ‹ / › para trocar mês | Despesas do mês correto carregadas |

### Sincronização em Tempo Real

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 11 | Usuário A cria despesa → Usuário B observa (sem reload) | Despesa aparece para B em < 3 segundos |
| 12 | Verifique o indicador de conexão na página | Indicador pulsante verde visível |

---

## 📊 TC-004 — Dashboard

**Issue:** [#37 no GitHub](https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/37)
**RFs cobertas:** RF-009

### Dashboard (`/index.html`)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acesse o dashboard com despesas registradas | Cada categoria mostra Orçado/Gasto/% com barra colorida |
| 2 | Verifique categoria com 0–70% gasto | Barra 🟢 Verde |
| 3 | Verifique categoria com 70–90% gasto | Barra 🟡 Amarela |
| 4 | Verifique categoria com > 90% gasto | Barra 🔴 Vermelha / ⚠️ Crítico |
| 5 | Verifique cards "Total Orçado", "Total Gasto", "Disponível" | Somatório correto de todas as categorias |
| 6 | Troque o período no seletor de mês/ano | Todos os cards atualizam para o período |
| 7 | Verifique widget "💳 Parcelamentos em Aberto" | Total por responsável, toggle ▾ funciona |
| 8 | Usuário A registra despesa → Usuário B observa dashboard | Barra de progresso atualiza automaticamente |

---

## 📤 TC-005 — Exportação e Importação

**Issue:** [#38 no GitHub](https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/38)
**RFs cobertas:** RF-012, RF-013

### Exportação CSV

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Em Despesas → clique "📥 Exportar CSV" | Download de `despesas-{mês}-{ano}.csv` |
| 2 | Abra o CSV no Excel | Colunas: Data, Descrição, Categoria, Emoji, Valor, Responsável, Parcela; sem caracteres estranhos |
| 3 | Exporte de mês sem despesas | Alerta informativo; sem download vazio |

### Importação Excel (`/base-dados.html` — aba Importar)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 4 | Clique "Baixar Template" | Download de `template-importacao.xlsx` com sheet "Instruções" |
| 5 | Arraste um extrato XP para a área de upload | Preview com todas as transações lidas |
| 6 | Altere a categoria de uma linha no preview | Categoria atualizada; outras linhas não afetadas |
| 7 | Use "Aplicar categoria a todas" → selecione uma categoria | Todas as linhas recebem a categoria |
| 8 | Desmarque o checkbox de uma linha | Linha excluída do preview |
| 9 | Clique "Importar X transações" | Despesas salvas; resultado mostra contagem |
| 10 | Usuário B faz o mesmo upload | Importação funciona; ambos veem as despesas |

---

## 💳 TC-006 — Cartão de Crédito Multi-Usuário

**Issue:** [#39 no GitHub](https://github.com/luigifilippozzi-cmyk/minhas-financas/issues/39)
**RF coberta:** RF-014

### Deduplicação

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Importe um extrato → importe o mesmo arquivo novamente | 2ª vez: linhas duplicadas marcadas com 🔄 amarelo e desmarcadas por padrão |
| 2 | Usuário A importa extrato → Usuário B importa o mesmo | B vê todas as linhas como duplicadas |
| 3 | Marque manualmente uma duplicata → importe | Transação criada novamente (forçado pelo usuário) |

### Projeção de Parcelas

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 4 | Importe extrato com item parcelado "02/06" | Parcela 02/06 importada; parcelas 03/06 a 06/06 geradas como projeções |
| 5 | Em Despesas, navegue para o mês seguinte | Parcelas projetadas visíveis com borda roxa/lavanda |
| 6 | Verifique chip "Projeções" no preview | Quantidade de parcelas futuras geradas exibida |
| 7 | Importe extrato do mês seguinte com a parcela 03/06 | Parcela marcada como duplicada da projeção |

### Painel de Parcelamentos em Aberto

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 8 | Acesse Dashboard com projeções salvas | Widget "💳 Parcelamentos em Aberto" com total por responsável |
| 9 | Acesse Despesas → verifique painel lateral | Agrupado por compra com qtd. de parcelas restantes |
| 10 | Clique no ▾ do painel | Painel colapsa e expande corretamente |

### Campo Responsável

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 11 | Nova Despesa → verifique dropdown "Responsável" | Nomes dos membros do grupo listados |
| 12 | Verifique chips de total por responsável em Despesas | Total separado por responsável exibido no cabeçalho |
| 13 | Use filtro por responsável em Despesas | Apenas despesas do responsável selecionado exibidas |
| 14 | Exporte CSV com despesas de responsáveis diferentes | Coluna "Responsável" presente e preenchida |

---

## 📦 TC-007 — Base de Dados (Gerenciar + Limpeza)

**RFs cobertas:** RF-018

### Aba Gerenciar (`/base-dados.html` → aba 🗂️ Gerenciar)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acesse `/base-dados.html` → clique aba "🗂️ Gerenciar" → "🔍 Carregar" | Tabela carrega todas as transações; indicador "Página 1 de N" visível |
| 2 | Filtre por tipo "💸 Despesas" | Apenas despesas listadas; projeções e receitas ocultas |
| 3 | Filtre por mês e ano | Tabela mostra apenas transações do período |
| 4 | Filtre por categoria | Apenas transações da categoria selecionada |
| 5 | Combine filtros (tipo + mês + categoria) | Filtros aplicados simultaneamente |
| 6 | Com > 50 registros: clique "Próxima ›" | Página 2 carrega; botão "‹ Anterior" habilitado |
| 7 | Selecione 3 linhas individualmente | Contagem "3 selecionados" aparece; botão Excluir habilitado |
| 8 | Marque "Selecionar todos visíveis" | Todos os checkboxes da página marcados |
| 9 | Clique "🗑️ Excluir selecionados" → modal aparece → "Cancelar" | Nenhuma transação excluída |
| 10 | Selecione linhas → Excluir → confirme "Excluir permanentemente" | Transações removidas; tabela atualizada sem reload |

### Aba Limpeza (`/base-dados.html` → aba ⚠️ Limpeza)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 11 | Faça login como **membro não-mestre** do grupo | Aba "⚠️ Limpeza" **não aparece** na navegação |
| 12 | Faça login como **mestre do grupo** (quem criou) | Aba "⚠️ Limpeza" aparece com cor vermelha |
| 13 | Clique "⚠️ Purgar Base de Dados" | Modal abre; botão "Purgar agora" **desabilitado** |
| 14 | Marque o checkbox sem digitar "PURGAR" | Botão permanece desabilitado |
| 15 | Digite "purgar" (minúsculo) + marque checkbox | Botão permanece desabilitado (texto deve ser exato) |
| 16 | Digite "PURGAR" + marque checkbox | Botão "Purgar agora" habilitado |
| 17 | Clique "Cancelar" | Modal fecha; nada é excluído |
| 18 | Digite "PURGAR" + checkbox + "Purgar agora" | Alerta de confirmação com contagem por coleção; aba Gerenciar fica vazia |

### Redirect de backward compat

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 19 | Acesse `/importar.html` diretamente | Redirecionado automaticamente para `/base-dados.html` |

---

## 🚦 Critérios de Aprovação

A versão v1.0 está pronta para uso quando:

- [ ] **Todos os casos de TC-001 a TC-004** passam sem erros (fluxo básico)
- [ ] **TC-005 (importação)** funciona para o formato de extrato XP utilizado
- [ ] **TC-006 (RF-014)** deduplicação e projeções funcionam corretamente
- [ ] **TC-007 (RF-018)** Gerenciar carrega, filtra e exclui em lote; Limpeza visível só para o mestre
- [ ] **TC-008 (RF-019 a RF-022)** Detecção automática de banco, categorização por origem e importação PDF
- [ ] **TC-009 (RF-013 v3.0)** Pipeline: parcelamento_id correto em reconciliações; chip de erros oculta ao trocar arquivo
- [ ] **Nenhum `blocker`** em aberto no GitHub
- [ ] **Sync em tempo real** funciona em todos os fluxos testados

---

## 📊 Acompanhamento no GitHub

- **Milestone:** https://github.com/luigifilippozzi-cmyk/minhas-financas/milestone/7
- **Todas as issues de teste:** https://github.com/luigifilippozzi-cmyk/minhas-financas/issues?milestone=7

O progresso do milestone é atualizado automaticamente conforme os checklists das issues são marcados.

---

---

## 🔍 TC-008 — Detecção de Banco, Categorização e Importação PDF

**RFs cobertas:** RF-019, RF-020, RF-021, RF-022

### Detecção automática de banco (RF-021)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Faça upload de extrato com nome "extrato-itau.csv" | Banner mostra "🟠 Banco Itaú" com alta confiança |
| 2 | Faça upload de extrato Nubank (keywords "nubank" no conteúdo) | Detecta Nubank automaticamente |
| 3 | Faça upload de arquivo sem fingerprint conhecido | Mostra "Banco desconhecido" sem travar |
| 4 | Selecione a conta manualmente no seletor global após detecção | Override funciona; conta aplicada a todas as linhas |

### Categorização sensível à origem (RF-022)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 5 | Importe extrato do Itaú com transações já importadas antes | Categorias do histórico do Itaú aplicadas automaticamente |
| 6 | Importe o mesmo estabelecimento de um banco diferente | Histórico do banco específico tem prioridade sobre o global |
| 7 | Estabelecimento novo sem histórico | Fallback para regras por palavras-chave |

### Importação PDF + classificação por sinal (RF-020)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 8 | Faça upload de extrato bancário em PDF | Parser converte linhas para preview com data/descrição/valor |
| 9 | Verifique linhas com valor negativo | Classificadas como `despesa` (tipoLinha = 'despesa') |
| 10 | Verifique linhas com valor positivo | Classificadas como `receita` (tipoLinha = 'receita') |
| 11 | Ative "Sinais Invertidos" antes de importar | Classificação inverte: positivo = despesa, negativo = receita |
| 12 | PDF com confiança 'baixa' em alguma linha | Linha com badge de aviso ou erro visível no preview |

### Preenchimento automático de conta no preview (RF-019)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 13 | CSV com coluna "Conta / Banco" preenchida | Conta resolvida por nome na coluna; exibida no select da linha |
| 14 | Coluna ausente, mas descrição contém "Itaú" | `inferirContaDaDescricao` detecta e preenche automaticamente |
| 15 | Sem coluna e sem keywords de banco na descrição | Seletor global de conta aplicado como fallback |

---

## 🏗️ TC-009 — Pipeline Unificado (RF-013 v3.0) e Bug Fixes

**RFs cobertas:** RF-013 | **Bugs:** BUG-009, BUG-010, BUG-011, BUG-012

### parcelamento_id em reconciliações (BUG-009)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Importe extrato com parcela que já tem projeção fuzzy na base | Despesa real salva com o mesmo `parcelamento_id` da projeção original |
| 2 | Verifique na aba Fatura → Projeções após reconciliação fuzzy | Parcelas reconciliadas aparecem agrupadas no parcelamento correto |

### Chip de erros (BUG-010)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 3 | Faça upload de arquivo com linhas de erro (data inválida) | Chip de erros aparece com a contagem correta |
| 4 | Troque para um arquivo sem erros | Chip de erros **desaparece** (hidden) — não herda contagem anterior |

### Detecção de separador errado (BUG-012)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 5 | Faça upload de CSV exportado com vírgula como separador | Mensagem de erro clara: "Arquivo parece usar vírgula como separador. Use ponto-e-vírgula (;)." |
| 6 | Faça upload do mesmo arquivo com ponto-e-vírgula | Import funciona normalmente |

---

*Guia gerado em 2026-03-08 | atualizado 2026-03-27 (RF-019 a RF-022 + RF-013 v3.0 + BUG-009 a BUG-012) | versão v3.0.2*
