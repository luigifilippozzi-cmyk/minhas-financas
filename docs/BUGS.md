# 🐛 Registro de Bugs — Minhas Finanças

Histórico de bugs identificados, analisados e corrigidos no projeto.
Formato: descrição do problema → impacto → localização → correção aplicada → commit de fix.

---

## Bugs Corrigidos

---

### BUG-001 — ReferenceError `errors` em `atualizarChipsPreview()`
**Severidade:** 🔴 Crítico
**Versão introduzida:** desconhecida
**Versão corrigida:** v3.0.0 (commit `bf0c65a`)
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
A variável local era declarada como `erros` (português) mas referenciada como `errors` (inglês) ao atualizar o chip de erros no preview de importação.

**Código problemático:**
```javascript
const erros = _linhas.filter(l => l.erro).length;  // declarada aqui
// ...
document.getElementById('chip-erros').textContent = errors; // ← ReferenceError!
```

**Impacto:**
Sempre que qualquer linha do arquivo importado continha erro (data inválida, valor zero, etc.), a função lançava `ReferenceError: errors is not defined`, interrompendo a execução. O contador de erros nunca era exibido e a UI ficava em estado inconsistente.

**Correção:** Renomear `errors` → `erros`.

---

### BUG-002 — Filtro de categorias inoperante na aba Gerenciar
**Severidade:** 🔴 Crítico
**Versão introduzida:** v2.2.0 (RF-018)
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivo:** `src/js/pages/base-dados.js`

**Descrição:**
O dropdown de filtro de categorias era populado com `t.categoria` — campo inexistente no Firestore. O campo real é `categoriaId`. O resultado era um `Set` sempre vazio, então o dropdown mostrava apenas "Todas as categorias". Da mesma forma, o filtro comparava `t.categoria !== cat`, que era sempre `true` (undefined ≠ qualquer valor).

**Código problemático:**
```javascript
// preencherFiltrosCategorias() — linha 179
const cats = [...new Set(_todasTransacoes.map(t => t.categoria).filter(Boolean))].sort();
//                                                    ^^^^^^^^^^^
// t.categoria nunca existe → Set vazio → dropdown vazio

// aplicarFiltros() — linha 203
if (cat && t.categoria !== cat) return false;
// t.categoria é sempre undefined → filtro nunca funciona
```

**Impacto:**
Filtro de categorias completamente inoperante. O usuário não conseguia filtrar transações por categoria na aba Gerenciar. Além disso, a coluna "Categoria" na tabela exibia o ID do Firestore em vez do nome.

**Correção:**
- Adicionar `ouvirCategorias` ao módulo, mantendo `_categorias` atualizado em tempo real.
- `preencherFiltrosCategorias()` usa `_categorias` com `categoriaId` como value e nome como texto.
- `aplicarFiltros()` compara `t.categoriaId !== cat`.
- `renderizarPagina()` resolve o nome da categoria via `_categorias.find(c => c.id === t.categoriaId)`.

---

### BUG-003 — Cache de exclusão em lote não verificava coleção
**Severidade:** 🟠 Médio (baixa probabilidade, código incorreto)
**Versão introduzida:** v2.2.0 (RF-018)
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivo:** `src/js/pages/base-dados.js`

**Descrição:**
Após excluir transações em lote, o cache local (`_todasTransacoes`) era atualizado filtrando apenas pelo `id`, sem considerar a coleção (`despesas` ou `receitas`). Se por coincidência uma despesa e uma receita tivessem o mesmo ID de documento, a exclusão de uma removeria a outra do cache.

**Código problemático:**
```javascript
const deletedIds = new Set(items.map(i => i.id));
_todasTransacoes = _todasTransacoes.filter(t => !deletedIds.has(t.id));
// ↑ só valida id, ignora a coleção
```

**Impacto:**
Probabilidade muito baixa com IDs auto-gerados do Firestore (20 chars aleatórios), mas o código era conceitualmente incorreto e poderia causar remoção indevida do cache visual.

**Correção:**
Usar chave composta `colecao::id` tanto para a lista de excluídos quanto para o filtro do cache:
```javascript
const deletedKeys = new Set(items.map(i => `${i.colecao}::${i.id}`));
_todasTransacoes = _todasTransacoes.filter(t => {
  const col = t._tipo === 'receita' ? 'receitas' : 'despesas';
  return !deletedKeys.has(`${col}::${t.id}`);
});
```

---

### BUG-004 — XSS via `innerHTML` com campos do usuário
**Severidade:** 🟠 Médio (requer acesso malicioso ao grupo)
**Versão introduzida:** v0.4.0
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivos:** `src/js/controllers/despesas.js`, `src/js/pages/base-dados.js`

**Descrição:**
Campos controlados pelo usuário (`d.descricao`, `cat.nome`, `cat.emoji`, `t.responsavel`) eram inseridos diretamente em `innerHTML` sem escape. Um usuário com acesso ao grupo poderia criar uma despesa com `descricao = '<img src=x onerror=alert(1)>'` e executar JavaScript no browser de outros membros.

**Código problemático:**
```javascript
// despesas.js
lista.innerHTML = despesas.map((d) => `
  <span>${catLabel}</span>       // ← cat.nome sem escape
  <span>${d.descricao}</span>    // ← campo do usuário sem escape
`).join('');

// base-dados.js
tr.innerHTML = `
  <td title="${desc}">${desc}</td>   // ← descricao sem escape
  <td>${cat}</td>                    // ← categoria sem escape
  <td>${resp}</td>                   // ← responsavel sem escape
`;
```

**Impacto:**
XSS stored — um membro malicioso do grupo poderia executar código arbitrário no browser dos demais membros ao visualizar a lista de despesas ou a aba Gerenciar.

**Correção:**
- Adicionada função `escHTML(str)` em `formatters.js` (escapa `&`, `<`, `>`, `"`, `'`).
- Aplicada em todos os campos de texto dinâmico nos templates `innerHTML`.

---

### BUG-005 — `purgarDuplicatas*()` usava `deleteDoc` sequencial
**Severidade:** 🟡 Performance
**Versão introduzida:** v1.5.0 (NRF-002)
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivo:** `src/js/services/database.js`

**Descrição:**
As funções `purgarDuplicatasDespesas()` e `purgarDuplicatasReceitas()` executavam um `await deleteDoc()` por documento, individualmente e sequencialmente. Com centenas de duplicatas, isso resultava em dezenas de roundtrips ao Firestore — lento e custoso em leituras/escritas.

**Código problemático:**
```javascript
for (let i = 1; i < docs.length; i++) {
  await deleteDoc(docs[i].ref);   // ← 1 roundtrip por documento
  deletadas++;
}
```

**Impacto:**
Purga muito lenta com volume alto de duplicatas. O padrão `writeBatch` já estava implementado em `excluirEmMassa()` e `purgeGrupoCompleto()`, mas não era usado aqui.

**Correção:**
Coletar todos os refs a deletar e executar em `writeBatch` de 500 (limite do Firestore), igual ao padrão já adotado no projeto.

---

### BUG-006 — Chip `#chip-fuzzy-wrap` ausente no HTML
**Severidade:** 🟡 Funcional (silencioso)
**Versão introduzida:** v1.5.0 (NRF-002)
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivo:** `src/base-dados.html`

**Descrição:**
O código em `importar.js` referenciava e atualizava `#chip-fuzzy-wrap` para exibir o contador de reconciliações fuzzy (NRF-002). O elemento existia no JavaScript mas nunca havia sido adicionado ao HTML. O código tinha um guard `if (fuzzyWrap)` que evitava o crash, mas o contador era silenciosamente suprimido.

**Impacto:**
O usuário nunca via quantas parcelas foram reconciliadas por similaridade fuzzy (Levenshtein ≥ 85%) durante uma importação — feature do NRF-002 invisível na UI.

**Correção:**
Adicionado `#chip-fuzzy-wrap` ao bloco de chips em `base-dados.html`, com estilo ciano `imp-chip--fuzzy` adicionado ao `main.css`.

---

### BUG-007 — Aba Gerenciar não recarregava após nova importação
**Severidade:** 🟡 UX
**Versão introduzida:** v2.2.0 (RF-018)
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivo:** `src/js/pages/base-dados.js`

**Descrição:**
A aba Gerenciar só carregava dados se `_todasTransacoes.length === 0`. Após uma primeira visita, o cache ficava populado. Se o usuário fizesse uma nova importação e voltasse para Gerenciar, os dados novos não apareciam — era necessário clicar manualmente em "🔍 Carregar".

**Código problemático:**
```javascript
if (tab === 'gerenciar' && _todasTransacoes.length === 0) {
  carregarTransacoes();  // só executa na primeira visita
}
```

**Impacto:**
UX confusa — dados desatualizados na aba Gerenciar após importações, sem indicação visual ao usuário.

**Correção:**
Remover a condição `length === 0` — `carregarTransacoes()` sempre executa ao entrar na aba Gerenciar.

---

### BUG-008 — Variável `db_` em `buscarTodasTransacoes()` (cosmético)
**Severidade:** 🟡 Cosmético
**Versão introduzida:** v2.2.0 (RF-018)
**Versão corrigida:** v3.0.1 (commit `7302140`)
**Arquivo:** `src/js/services/database.js`

**Descrição:**
No comparador de sort de `buscarTodasTransacoes()`, a variável local era nomeada `db_` — sufixo underscore para evitar colisão com o `db` importado do Firebase. Funcionava corretamente, mas causava confusão visual para leitores do código.

**Correção:** Renomear `db_` → `dateB` (semântico: data do item B no sort).

---

## Legenda de Severidade

| Ícone | Nível | Critério |
|-------|-------|----------|
| 🔴 | Crítico | Quebra funcionalidade principal; crash ou dado incorreto visível |
| 🟠 | Médio | Impacto real mas requer condição específica ou tem baixa probabilidade |
| 🟡 | Baixo/Cosmético | Performance, UX degradada ou legibilidade de código |
