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

---

### BUG-009 — `parcelamento_id` incorreto em despesas reconciliadas
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.0.2
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
`parc_id` era gerado com `crypto.randomUUID()` para qualquer linha com parcela, independentemente de ser uma reconciliação fuzzy. O operador `??` na linha 774 (`parc_id ?? l.parcelamento_id_proj`) nunca alcançava `l.parcelamento_id_proj` porque `parc_id` era sempre um UUID não-nulo. A despesa real reconciliada era vinculada a um `parcelamento_id` novo, desconectado do parcelamento mestre original.

**Código problemático:**
```javascript
const parc_id = info ? crypto.randomUUID() : null;
// ...
parcelamento_id: parc_id ?? l.parcelamento_id_proj ?? null,  // ?? nunca alcançado
```

**Impacto:**
Despesas reais importadas via reconciliação fuzzy ficavam "soltas", sem vínculo com o parcelamento mestre. Histórico de parcelas quebrado; `reconciliarParcela()` não encontrava as despesas correspondentes.

**Correção:**
```javascript
// Prioriza parcelamento existente (reconciliação) antes de gerar UUID novo
const parc_id = info ? (l.parcelamento_id_proj ?? crypto.randomUUID()) : null;
// ...
parcelamento_id: parc_id,
```

---

### BUG-010 — Chip de erros nunca oculto ao trocar de arquivo
**Severidade:** 🟡 Baixo/UX
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.0.2
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
`atualizarChipsPreview()` usava `classList.remove('hidden')` para exibir o chip de erros, mas não tinha o caminho contrário. Os chips de duplicatas e projeções usavam `classList.toggle('hidden', count === 0)` (correto), mas o chip de erros só removia a classe, nunca a adicionava de volta.

**Código problemático:**
```javascript
if (erros > 0) {
  document.getElementById('chip-erros').textContent = erros;
  document.getElementById('chip-erros-wrap').classList.remove('hidden');
}
// ← sem else: chip nunca volta ao estado 'hidden'
```

**Impacto:**
Ao trocar de arquivo (novo arquivo sem erros), o chip de erros permanecia visível com a contagem do arquivo anterior, confundindo o usuário.

**Correção:**
```javascript
const errosWrap = document.getElementById('chip-erros-wrap');
if (errosWrap) {
  document.getElementById('chip-erros').textContent = erros;
  errosWrap.classList.toggle('hidden', erros === 0);
}
```

---

### BUG-011 — Campo `isCredito` semanticamente invertido em contexto de extrato bancário
**Severidade:** 🟡 Cosmético/Manutenção
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.0.2
**Arquivo:** `src/js/pages/pipelineBanco.js`, `src/js/utils/normalizadorTransacoes.js`, `src/js/pages/pipelineCartao.js`

**Descrição:**
O campo `isCredito` era definido como `valor < 0` em ambos os parsers. Em contexto de fatura de cartão isso faz sentido (valor negativo = estorno/crédito). Em contexto de extrato bancário, valor negativo = débito, tornando o nome semanticamente invertido. O comentário em `pipelineBanco.js` inclusive anotava a contradição: `// negativo = débito = isCredito`.

**Código problemático:**
```javascript
// pipelineBanco.js
const isCredito = item.valor < 0;  // negativo = débito = isCredito ← contraditório
```

**Impacto:**
O código funcionava corretamente (a lógica de `classificarBanco` compensava a inversão), mas a nomenclatura dificultava manutenção e aumentava o risco de futuros bugs por engano.

**Correção:**
Renomear `isCredito` → `isNegativo` nos 3 arquivos envolvidos. O nome descreve o sinal do valor sem implicação semântica (correto em ambos os contextos).

---

### BUG-012 — CSV com separador errado tratado silenciosamente
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.0.2
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
Quando um arquivo CSV usava vírgula como separador em vez de ponto-e-vírgula, `parsearLinhasCSVXLSX` falhava em detectar o header (`headerIdx === -1`) e silenciosamente tentava processar as colunas posicionalmente. O resultado era uma lista de linhas com erros obscuros ("Data inválida", "Valor inválido") sem indicar a causa raiz.

**Impacto:**
Usuário recebia erros genéricos sem entender que o problema era o separador do arquivo. Experiência confusa, especialmente para exportações do Excel com configuração de locale diferente.

**Correção:**
```javascript
if (headerIdx < 0 && rows.some(r => r.length === 1 && String(r[0] ?? '').includes(','))) {
  throw new Error('Arquivo parece usar vírgula como separador. Exporte o CSV usando ponto-e-vírgula (;).');
}
```

---

### BUG-013 — Exclusão indevida de estornos/créditos na importação de faturas
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.6.0
**Arquivo:** `src/js/pages/pipelineCartao.js`, `src/js/pages/importar.js`, `src/css/main.css`

**Descrição:**
A função `filtrarCreditos` marcava automaticamente qualquer transação com valor negativo (`isNegativo = true`) como erro bloqueante, impedindo sua importação. Isso bloqueava estornos legítimos de compras que aparecem na fatura do cartão.

**Código problemático:**
```javascript
export function filtrarCreditos(linhas) {
  linhas.forEach((l) => {
    if (l.isNegativo && !l.erro) l.erro = 'Crédito/estorno — não importado';
  });
}
```

**Impacto:**
Estornos e créditos legítimos eram ignorados durante a importação, resultando em um saldo de fatura incorreto na aplicação em comparação com a fatura real.

**Correção aplicada:**
- `pipelineCartao.js`: em vez de erro, seta `isEstorno=true` e `tipoLinha='receita'` — linha visível no preview para o usuário decidir
- `importar.js`: reset `isEstorno=false` em `_aplicarTipo`; checkbox desmarcado por padrão (`&& !l.isEstorno`) — **ver BUG-019 (v3.7.0)**: corrigido para marcado por padrão; badge `↩ Estorno` (amarelo) inserido ANTES do check `tipoLinha === 'receita'`
- `main.css`: estilo `.imp-badge--estorno` adicionado (fundo amarelo claro)

---

### BUG-014 — Erro de escala em valores com ponto decimal (multiplicação por 100)
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.6.0
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
A função `normalizarValorXP` removia todos os pontos da string de valor antes de converter para número. Se o arquivo de entrada usava ponto como separador decimal (ex: `208.17`), o valor era transformado em `20817`, resultando em escala 100x maior.

**Código problemático:**
```javascript
const s = String(val).trim().replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
return parseFloat(s);
```

**Impacto:**
Transações importadas de arquivos com formato decimal de ponto ficavam com valores irreais (ex: R$ 208,17 virava R$ 20.817,00).

**Correção aplicada:**
Detecta a convenção de separador decimal comparando a posição do último ponto vs última vírgula:
- `lastComma > lastDot` → convenção BR (ponto=milhar, vírgula=decimal)
- `lastDot > lastComma` → convenção US/XP (vírgula=milhar, ponto=decimal)
- Só vírgula, sem ponto → trata como decimal BR

---

### BUG-015 — Parsing de parcelas ignora a última parcela da série
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.6.0
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
A função `parsearParcela` retornava `null` quando a parcela atual era igual ao total (ex: "12/12"), bloqueando o parsing da última parcela de qualquer série.

**Código problemático:**
```javascript
if (atual >= total || total <= 0 || atual <= 0) return null;
```

**Impacto:**
A última parcela de compras parceladas não era reconhecida pelo sistema de parcelamentos, causando falha na reconciliação com projeções existentes.

**Correção aplicada:**
Condição alterada de `atual >= total` para `atual > total` — permite que a última parcela seja parseada corretamente.

---

### BUG-016 — Filtro de palavras-chave bloqueia transações legítimas de refinanciamento
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** v3.6.0
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
O parser ignorava silenciosamente qualquer linha contendo "credito de refinanciamento", impedindo a importação de despesas financeiras legítimas (juros de parcelamento rotativo, refinanciamento de fatura).

**Código problemático:**
```javascript
if (/...|credito de refinanciamento/i.test(estabLow)) continue;
```

**Impacto:**
Despesas financeiras legítimas eram omitidas da importação sem aviso ao usuário.

**Correção aplicada:**
Removido `|credito de refinanciamento` do regex de filtro. Apenas termos de controle de sistema (pagamento de fatura, inclusão de pagamento, parcela rotativa) permanecem filtrados.

---

### BUG-017 — Despesas importadas com valor bruto mesmo quando há ajuste parcial (NRF-002.2)
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.1.0 (NRF-002.2)
**Versão corrigida:** v3.5.0
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
Ao importar despesas com ajuste parcial de marketplace/supermercado (ex: iFood com desconto), o campo `valorLiquido` era calculado corretamente no preview (valor bruto − crédito de ajuste), mas o `criarDespesaDB` persistia `l.valor` (bruto) em vez de `l.valorLiquido` (líquido). O usuário via o valor correto no preview, mas a despesa salva no Firestore tinha o valor antes do desconto.

**Código problemático:**
```javascript
const despesaRef = await criarDespesaDB(modelDespesa({
  descricao: l.descricao, valor: l.valor,  // ← bruto, ignora valorLiquido
  ...
}));
```

**Impacto:**
Despesas de marketplace ficavam com valor inflado no Firestore. O total da fatura no app era maior que o cobrado na fatura real para qualquer compra com cashback/desconto ajustado.

**Correção aplicada:**
```javascript
const valorBase = l.valorLiquido ?? l.valor;  // pós-ajuste parcial se disponível
```
Projeções de parcelas futuras continuam usando `l.valor` (bruto) — o desconto se aplica apenas à parcela real do mês.

---

### BUG-018 — `ajusteDetector.js` fazia match com estabelecimento errado (keyword ausente)
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.1.0 (NRF-002.2)
**Versão corrigida:** v3.5.0
**Arquivo:** `src/js/utils/ajusteDetector.js`

**Descrição:**
O detector de ajustes parciais identificava um crédito de ajuste (ex: `CASHBACK IFOOD`) e procurava uma despesa próxima no tempo, mas não exigia que a despesa contivesse a mesma keyword do crédito. Isso causava falso-positivo: um crédito de ajuste do iFood era associado a uma compra em supermercado diferente que aconteceu no mesmo dia.

**Código problemático:**
```javascript
// critério: proximidade temporal apenas — sem validação de keyword
const candidatos = linhas.filter(l => Math.abs(l.data - credito.data) < DELTA_MS);
```

**Impacto:**
Ajuste parcial aplicado na despesa errada. Despesa do estabelecimento incorreto ficava com `valorLiquido` reduzido indevidamente; a despesa-alvo do ajuste mantinha o valor bruto.

**Correção aplicada:**
Critério adicional: a despesa candidata deve conter a mesma keyword identificadora do crédito (ex: `'ifood'` em `CASHBACK IFOOD` deve estar presente na descrição da despesa). Elimina falsos-positivos em dias com múltiplas transações de estabelecimentos distintos.

---

### BUG-019 — Estornos auto-desmarcados no preview: créditos da fatura não importados por padrão
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.6.0 (BUG-013)
**Versão corrigida:** v3.7.0
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
O BUG-013 (v3.6.0) desbloqueou estornos/créditos da fatura (valores negativos), mas a UI mantinha esses itens **desmarcados por padrão** via `!l.isEstorno` na condição de `chk.checked`. Qualquer usuário que clicasse em "Importar" sem revisar manualmente cada linha ignorava sistematicamente todos os créditos.

**Código problemático:**
```javascript
// importar.js linha 613
chk.checked = !l.erro && !l.duplicado && !l.ajuste_parcial && !l.isEstorno;
//                                                             ^^^^^^^^^^^^ créditos nunca selecionados
```

**Impacto:**
Créditos/estornos da fatura (ex: reembolsos, cashbacks, crédito de refinanciamento) nunca eram importados. O saldo total da fatura no app ficava maior que o saldo oficial da operadora pela soma de todos os créditos não contabilizados.

**Exemplo real detectado (Fatura março 2026):**
| Estabelecimento | Valor |
|---|---|
| Credito de Refinanciamento Saldo Financiado | R$ -18.222,00 |
| MERCADOLIVRE*22PRODUTOS | R$ -24,99 |
| IFD*HNT COMERCIO HORTI | R$ -72,67 |
| **Total não contabilizado** | **R$ 18.319,66** |

**Correção aplicada:**
```javascript
// Removido !l.isEstorno — estornos marcados por padrão como qualquer despesa normal
chk.checked = !l.erro && !l.duplicado && !l.ajuste_parcial;
```
O badge `↩ Estorno` continua visível; tooltip atualizado para "desmarque para ignorar". Usuário pode desmarcar individualmente qualquer estorno que não queira importar.

---

### BUG-021 — Campo `mesFatura` não persistido; transações à vista e parceladas de ciclos anteriores ausentes da fatura
**Severidade:** 🔴 Crítico
**Versão introduzida:** v1.0 (design original)
**Versão corrigida:** v3.8.0
**Arquivos:** `src/js/pages/pipelineCartao.js`, `src/js/pages/importar.js`, `src/js/services/database.js`, `src/js/utils/deduplicador.js`

**Descrição:**
Durante o import de fatura de cartão, o campo `mesFatura: "YYYY-MM"` nunca era salvo no Firestore. Também, o deduplicador usava um `Set` puro sem expor o `docId` das duplicatas, impossibilitando atualizar o `mesFatura` de transações já salvas em ciclos anteriores.

**Impacto (Fatura março 2026):**
- **15 transações à vista (fev/26–28, R$ 1.622,42):** salvas com `data` em fevereiro → não aparecem na fatura de março.
- **26 parceladas de meses anteriores (R$ 6.402,17):** já existiam no Firestore com datas de meses anteriores → marcadas como `duplicado=true` → não reimportadas → não aparecem em março.
- Diferença total acumulada: **R$ 7.926,93** (excluindo estornos cobertos por BUG-019).

**Raiz técnica:**
```javascript
// pipelineCartao.js — mesFatura nunca propagado nas linhas
export function processarFaturaCartao({ ..., mesFatura }) {
  const linhas = parsearLinhasCSVXLSX(...);
  // ← faltava: linhas.forEach(l => { l.mesFatura = mesFatura; })
  ...
}

// database.js — buscarChavesDedup retornava Set (sem docId)
return new Set(snap.docs.map(d => d.data().chave_dedup).filter(Boolean));

// deduplicador.js — não expunha docId da duplicata
l.duplicado = true;  // ← faltava: l.duplicado_docId = Map.get(chave)
```

**Correção aplicada:**
1. `processarFaturaCartao` propaga `l.mesFatura = mesFatura` em todas as linhas.
2. `buscarChavesDedup` retorna `Map<chave_dedup, docId>` em vez de `Set`.
3. `deduplicador.js` expõe `l.duplicado_docId` via `chavesRef instanceof Map ? chavesRef.get(chave) : null`.
4. `importar.js` salva `mesFatura` no Firestore (despesas, receitas e projeções).
5. Após o loop de importação, itera `_linhas` e chama `atualizarDespesa(docId, { mesFatura })` para cada duplicata detectada em imports de cartão.

---

### BUG-022 — `fatura.js` filtra por mês calendário: transações de ciclos cross-month nunca aparecem
**Severidade:** 🔴 Crítico
**Versão introduzida:** v1.0 (design original)
**Versão corrigida:** v3.8.0
**Arquivos:** `src/js/pages/fatura.js`, `src/js/services/database.js`, `firestore.indexes.json`

**Descrição:**
`ouvirDespesas` filtra por `data >= início_do_mês && data <= fim_do_mês`. Transações com `data` fora do mês calendário mas pertencentes ao ciclo de faturamento (ex: à vista de fev/26–28 no ciclo de março) nunca eram retornadas pelo listener. Mesmo após BUG-021 adicionar `mesFatura` ao Firestore, sem este fix a fatura ainda não exibiria essas transações.

**Correção aplicada:**
1. Nova função `ouvirDespesasPorMesFatura(grupoId, mesFatura, callback)` em `database.js` — faz query por `where('mesFatura', '==', mesFatura)`.
2. `recarregarDespesas()` em `fatura.js` usa **dois listeners em paralelo**: o existente (mês calendário, backward compat) + o novo (campo `mesFatura`).
3. `_merge()` faz union das duas listas deduplificando por `id`, excluindo `tipo=projecao`/`projecao_paga` (BUG-023) e filtrando pelo `_cartaoId`.
4. Novo índice Firestore: `despesas / grupoId ASC + mesFatura DESC`.

---

### BUG-023 — `projecao_paga` incluída no total da fatura — double-counting de parceladas reconciliadas
**Severidade:** 🔴 Crítico
**Versão introduzida:** v1.8.0 (NRF-005 — fatura.js)
**Versão corrigida:** v3.9.0
**Arquivo:** `src/js/pages/fatura.js`

**Descrição:**
O filtro `_merge()` em `fatura.js` excluía apenas `tipo === 'projecao'` (projeções pendentes), mas não `tipo === 'projecao_paga'` (projeções reconciliadas). Quando o usuário importa uma fatura com parceladas que já tinham projeções existentes, a reconciliação:
1. Cria uma despesa real (`tipo: 'despesa'`, `data = 01/mesFatura`)
2. Atualiza a projeção para `tipo: 'projecao_paga'` (mesma `data`, mesmo `contaId`)

Ambos os documentos passavam pelo `_merge()` com a mesma data e contaId, aparecendo duplicados na view e dobrando o total calculado.

**Código problemático:**
```javascript
_despesas = [..._calendarSet, ..._mesFaturaSet].filter(d => {
  if (d.tipo === 'projecao') return false;  // ← projecao_paga não filtrada
  if (d.contaId !== _cartaoId) return false;
  ...
});
```

**Impacto:**
Para cada parcelada reconciliada no mês, a despesa aparece duas vezes na fatura. Com 26 parceladas de ciclos anteriores (como na fatura de março/2026), o total exibido e exportado ficava ~R$ 6.400 acima do valor real.

**Correção aplicada:**
```javascript
if (d.tipo === 'projecao' || d.tipo === 'projecao_paga') return false;  // BUG-023
```

---

### BUG-024 — `buscarChavesDedupReceitas` retorna `Set` — mesFatura não propagado para estornos duplicados
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.8.0 (BUG-021)
**Versão corrigida:** v3.9.0
**Arquivos:** `src/js/services/database.js`, `src/js/pages/importar.js`

**Descrição:**
O BUG-021 (v3.8.0) converteu `buscarChavesDedup` de `Set` para `Map<chave, docId>` para permitir atualizar `mesFatura` em duplicatas. Porém `buscarChavesDedupReceitas` (usado para estornos/créditos da fatura) ainda retornava `Set`. Com isso:
1. `deduplicador.js` nunca conseguia o `docId` dos estornos duplicados (`chavesRef instanceof Map` → false)
2. `l.duplicado_docId` ficava sempre `null` para estornos
3. Além disso, o post-loop de `importar.js` chamava `atualizarDespesa` para todos os duplicados, sem distinguir receitas — uma chamada errada para docIds da coleção `receitas`

**Impacto:**
Se um estorno/crédito da fatura já havia sido importado em ciclo anterior, o campo `mesFatura` na coleção `receitas` não era atualizado para o novo ciclo. O estorno ficava invisível para qualquer query futura que filtrasse por `mesFatura`.

**Correção aplicada:**
1. `database.js`: `buscarChavesDedupReceitas` agora retorna `Map<chave_dedup, docId>` (mesmo padrão de `buscarChavesDedup`)
2. `importar.js`: adicionado `atualizarReceita` ao import; post-loop distingue `tipoLinha === 'receita'` e chama `atualizarReceita` ou `atualizarDespesa` conforme o tipo do duplicado

---

### BUG-025 — `garantirContasPadrao` ausente em `fatura.js` e `importar.js` — aba fatura não carrega após import
**Severidade:** 🔴 Crítico
**Versão introduzida:** v1.8.0 (NRF-004 — adicionou coleção `contas`)
**Versão corrigida:** v3.9.1
**Arquivos:** `src/js/pages/fatura.js`, `src/js/pages/importar.js`

**Descrição:**
`garantirContasPadrao` (que cria as contas padrão do grupo, incluindo `💳 Cartão de Crédito` com `tipo:'cartao'`) era chamada **apenas** em `app.js`, carregado exclusivamente por `dashboard.html`. Usuários que acessavam `base-dados.html` para importar dados e depois navegavam para `fatura.html` sem nunca ter visitado o dashboard nunca tinham as contas criadas.

**Código problemático (antes):**
```javascript
// app.js (carregado APENAS por dashboard.html)
garantirContasPadrao(estadoApp.perfil.grupoId, CONTAS_PADRAO).catch(() => {});

// fatura.js e importar.js — garantirContasPadrao NUNCA chamada
_unsubContas = ouvirContas(_grupoId, (contas) => {
  // contas = [] se usuário não visitou o dashboard
  preencherSeletorCartao();  // dropdown fica só com "— selecione —"
});
```

**Cadeia de impacto:**
1. Usuário registra conta → vai para `base-dados.html` sem passar pelo dashboard
2. `garantirContasPadrao` nunca chamada → coleção `contas` vazia para o grupo
3. Durante o import: `ouvirContas` retorna `[]` → seletor de conta vazio → `contaId: undefined` em todas as transações importadas
4. Em `fatura.html`: `ouvirContas` retorna `[]` → `preencherSeletorCartao` não encontra conta com `tipo:'cartao'` → nenhum auto-select → `_cartaoId` nunca definido → `recarregarDespesas()` nunca chamado → página presa no estado vazio indefinidamente

**Correção aplicada:**
- `fatura.js`: importa `garantirContasPadrao` e `CONTAS_PADRAO`; chama `await garantirContasPadrao(_grupoId, CONTAS_PADRAO).catch(() => {})` antes de `ouvirContas` — garante que `💳 Cartão de Crédito` exista para o auto-select funcionar
- `importar.js`: mesma chamada antes de carregar o preview — garante que o seletor de conta esteja populado no momento do import, evitando `contaId: undefined` nas despesas

```javascript
// fatura.js e importar.js — DEPOIS do fix
await garantirContasPadrao(_grupoId, CONTAS_PADRAO).catch(() => {});
_unsubContas = ouvirContas(_grupoId, (contas) => {
  // contas agora sempre inclui as contas padrão
  preencherSeletorCartao();  // auto-seleciona "Cartão de Crédito"
});
```

---

## Dívida Técnica / Melhorias Pendentes

Itens identificados em revisão de código que não são bugs (não quebram funcionalidade), mas representam oportunidades de melhoria de performance, manutenibilidade ou UX.

---

### TD-001 — `buscarTodasTransacoes` sem paginação server-side
**Tipo:** Performance
**Arquivo:** `src/js/services/database.js`

**Descrição:**
A função carrega todas as transações do grupo em uma única query Firestore. Para grupos com +1.000 transações, isso pode causar latência perceptível na aba Gerenciar.

**Sugestão:**
Implementar paginação com cursor (`startAfter`) e carregamento sob demanda (scroll infinito ou botão "Carregar mais") na aba Gerenciar de `base-dados.js`.

---

### TD-002 — Trio `_aplicarTipo + marcarDuplicatas + renderizarPreview` repetido ✅ Resolvido v3.6.0
**Tipo:** DRY / Manutenibilidade
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
O mesmo trio de chamadas era invocado em 5 contextos diferentes (mudança de tipo, toggle de sinais, PDF, CSV, XLSX). Qualquer nova etapa de processamento precisava ser adicionada em 5 lugares.

**Correção aplicada:**
Extraída função `async _reprocessarLinhas() { await marcarDuplicatas(); renderizarPreview(); }` que agrupa o par `marcarDuplicatas + renderizarPreview`. As 5 ocorrências foram substituídas por `await _reprocessarLinhas()`.

---

### TD-003 — Templates de export em `importar.js` (1032 linhas)
**Tipo:** Separação de responsabilidades
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
O bloco com `gerarTemplateDespesas`, `gerarTemplateBanco` e `gerarTemplateReceitas` (~100 linhas) não depende de estado global do módulo e poderia ser isolado. O arquivo atual tem ~1032 linhas, tornando navegação e revisão mais lentas.

**Sugestão:**
Extrair para `src/js/utils/templateExport.js` como funções puras que recebem `contas` e `categorias` como parâmetros.

---

### TD-004 — Inline styles em `renderizarPreview`
**Tipo:** Manutenibilidade / CSS
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
Estilização de células da tabela de preview usa `element.style.color`, `element.style.textAlign`, etc. diretamente no JS. Dificulta ajustes visuais e temas futuros.

**Sugestão:**
Substituir por classes CSS (ex: `.imp-td-valor`, `.imp-td-erro`, `.imp-td-credito`) definidas em `main.css`. O JS apenas adiciona/remove classes conforme o estado da linha.

---

### TD-005 — Falta de paginação server-side na aba Gerenciar
**Tipo:** Performance / Escalabilidade
**Arquivo:** `src/js/services/database.js`, `src/js/pages/base-dados.js`

**Descrição:**
A função `buscarTodasTransacoes` carrega todas as despesas e receitas de um grupo de uma só vez. Para grupos com histórico longo (+1.000 transações), isso causa latência e alto consumo de memória.

**Sugestão:**
Implementar paginação server-side utilizando `startAfter` do Firestore e um botão "Carregar Mais" na UI.

---

### TD-006 — Duplicação de lógica de importação entre Despesas e Receitas
**Tipo:** Manutenibilidade / DRY
**Arquivo:** `src/js/pages/importar.js`, `src/js/pages/receitas.js`

**Descrição:**
Existem dois sistemas de importação independentes com lógicas de preview, parsing e dedup muito similares, mas mantidos separadamente.

**Sugestão:**
Unificar em um componente de importação genérico que aceite configurações de tipo de dado.

---

### TD-007 — Ausência de validação de esquema nas regras do Firestore ✅ Resolvido v3.6.0
**Tipo:** Segurança / Integridade
**Arquivo:** `firestore.rules`

**Descrição:**
As regras de segurança validavam apenas a permissão de acesso ao grupo, mas não o formato ou valores dos dados enviados.

**Correção aplicada:**
Adicionada função `isValidTransacao()` que verifica `valor is number && valor > 0 && grupoId is string`. Aplicada às regras `write` e `create` das coleções `despesas` e `receitas`.

---

### BUG-020 —`purgeGrupoCompleto` bloqueado pelas regras do Firestore (`allow write` + `isValidTransacao`)
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.6.0 (TD-007 — adicionou `isValidTransacao()` à regra `write`)
**Versão corrigida:** v3.8.0
**Arquivo:** `firestore.rules`

**Descrição:**
As regras de `despesas` e `receitas` usavam `allow write` com a validação `isValidTransacao()`. O `write` abrange `create`, `update` **e `delete`**. Durante uma exclusão, `request.resource` é `null` — a função `isValidTransacao()` acessava `request.resource.data`, causando falha na avaliação da regra e bloqueando toda operação de delete.

**Código problemático:**
```javascript
// firestore.rules
function isValidTransacao() {
  let d = request.resource.data;   // ← null durante delete → erro/DENIED
  return d.valor is number && d.valor > 0 && d.grupoId is string;
}

match /despesas/{despesaId} {
  allow write: if isSignedIn() && isMemberOfGroup(resource.data.grupoId) && isValidTransacao();
  // ↑ delete também passa por isValidTransacao() → sempre negado
}
```

**Impacto:**
- `purgeGrupoCompleto` lançava erro silencioso ("Erro ao purgar a base de dados")
- `excluirEmMassa` também bloqueado para despesas e receitas
- `excluirDespesa` e `excluirReceita` idem

**Correção:**
Separar `write` em `create` + `update` + `delete` nas coleções `despesas` e `receitas`. `isValidTransacao()` aplicado apenas em `create` e `update`; `delete` requer apenas membresia do grupo.

```javascript
match /despesas/{despesaId} {
  allow read:   if isSignedIn() && isMemberOfGroup(resource.data.grupoId);
  allow create: if isSignedIn() && isMemberOfGroup(request.resource.data.grupoId) && isValidTransacao();
  allow update: if isSignedIn() && isMemberOfGroup(resource.data.grupoId) && isValidTransacao();
  allow delete: if isSignedIn() && isMemberOfGroup(resource.data.grupoId);
}
```

---

## Legenda de Severidade

| Ícone | Nível | Critério |
|-------|-------|----------|
| 🔴 | Crítico | Quebra funcionalidade principal; crash ou dado incorreto visível |
| 🟠 | Médio | Impacto real mas requer condição específica ou tem baixa probabilidade |
| 🟡 | Baixo/Cosmético | Performance, UX degradada ou legibilidade de código |
