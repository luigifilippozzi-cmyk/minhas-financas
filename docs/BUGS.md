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
**Versão corrigida:** pendente
**Arquivo:** `src/js/pages/pipelineCartao.js`

**Descrição:**
A função `filtrarCreditos` marca automaticamente qualquer transação com valor negativo (`isNegativo = true`) como erro, impedindo sua importação. Isso bloqueia estornos legítimos de compras que aparecem na fatura do cartão.

**Código problemático:**
```javascript
export function filtrarCreditos(linhas) {
  linhas.forEach((l) => {
    if (l.isNegativo && !l.erro) l.erro = 'Crédito/estorno — não importado';
  });
}
```

**Impacto:**
Estornos e créditos legítimos são ignorados durante a importação, resultando em um saldo de fatura incorreto na aplicação em comparação com a fatura real.

**Correção sugerida:**
Permitir a importação de estornos, possivelmente adicionando um toggle na UI para "Ignorar Créditos/Estornos" ou permitindo que o usuário categorize esses valores manualmente.

---

### BUG-014 — Erro de escala em valores com ponto decimal (multiplicação por 100)
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** pendente
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
A função `normalizarValorXP` remove todos os pontos da string de valor antes de converter para número. Se o arquivo de entrada usar o ponto como separador decimal (ex: `208.17`), o valor é transformado em `20817`, resultando em uma escala 100x maior.

**Código problemático:**
```javascript
const s = String(val).trim().replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
return parseFloat(s);
```

**Impacto:**
Transações importadas de arquivos com formato decimal de ponto (comum em exportações internacionais ou CSVs específicos) ficam com valores irreais (ex: R$ 208,17 vira R$ 20.817,00).

**Correção sugerida:**
Implementar uma lógica que detecte se o ponto é separador de milhar ou decimal com base na posição e presença de outros separadores.

---

### BUG-015 — Parsing de parcelas ignora a última parcela da série
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** pendente
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
A função `parsearParcela` retorna `null` quando a parcela atual é igual ao total (ex: "12/12"). Isso impede que a última parcela seja reconhecida como parte de um parcelamento para fins de reconciliação ou metadados.

**Código problemático:**
```javascript
if (atual >= total || total <= 0 || atual <= 0) return null;
```

**Impacto:**
A última parcela de compras parceladas não é tratada corretamente pelo sistema de parcelamentos, podendo causar duplicidade ou falha na reconciliação com projeções existentes.

**Correção sugerida:**
Alterar a condição para `atual > total`.

---

### BUG-016 — Filtro de palavras-chave bloqueia transações legítimas de refinanciamento
**Severidade:** 🟠 Médio
**Versão introduzida:** v3.0.0 (RF-013)
**Versão corrigida:** pendente
**Arquivo:** `src/js/utils/normalizadorTransacoes.js`

**Descrição:**
O parser ignora silenciosamente qualquer linha que contenha "credito de refinanciamento". Isso impede a importação de juros de parcelamento de fatura ou refinanciamentos que o usuário pode desejar trackear como despesa financeira.

**Código problemático:**
```javascript
if (/...|credito de refinanciamento/i.test(estabLow)) continue;
```

**Impacto:**
Despesas financeiras legítimas são omitidas da importação sem aviso ao usuário.

**Correção sugerida:**
Remover o termo do filtro automático ou permitir que o usuário revise essas linhas no preview.

---

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

### TD-002 — Trio `_aplicarTipo + marcarDuplicatas + renderizarPreview` repetido
**Tipo:** DRY / Manutenibilidade
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
O mesmo trio de chamadas é invocado em 3 contextos diferentes (mudança de tipo, mudança de mês de fatura, toggle de sinais). Qualquer nova etapa de processamento precisa ser adicionada em 3 lugares.

**Sugestão:**
Extrair em uma função `_reprocessarLinhas()` que encapsula o trio. Reduz de ~30 linhas repetidas para 1 chamada por contexto.

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

### TD-007 — Ausência de validação de esquema nas regras do Firestore
**Tipo:** Segurança / Integridade
**Arquivo:** `firestore.rules`

**Descrição:**
As regras de segurança validam apenas a permissão de acesso ao grupo, mas não o formato ou valores dos dados enviados (ex: permitir valor negativo ou data inválida).

**Sugestão:**
Adicionar validações de tipo e valor (ex: `valor is number && valor > 0`) diretamente nas `firestore.rules`.

---

### BUG-017 — NRF-002.2: Despesa com ajuste parcial salva pelo valor bruto
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.1.0
**Versão corrigida:** v3.5.0
**Arquivo:** `src/js/pages/importar.js`

**Descrição:**
Quando `detectarAjustesParciais` marcava uma despesa com `valorLiquido` (valor após desconto), o preview exibia o valor correto (tachado + líquido), mas o save usava `l.valor` (bruto original) para criar a despesa no Firestore. O ajuste era visível na UI mas completamente ignorado na persistência.

**Código problemático:**
```javascript
const despesaRef = await criarDespesaDB(modelDespesa({
  descricao: l.descricao, valor: l.valor, ...  // ← sempre bruto
}));
```

**Impacto:**
Despesa salva no Firestore com valor original (ex: R$100), ignorando o desconto de R$10 — o valor líquido correto (R$90) nunca era persistido. Saldo e totais ficavam incorretos.

**Correção aplicada:**
```javascript
const valorBase = l.valorLiquido ?? l.valor;  // usa líquido se disponível
const despesaRef = await criarDespesaDB(modelDespesa({
  descricao: l.descricao, valor: valorBase, ...
}));
// valorAlocado (conjunto) usa valorBase; projeções usam l.valor (sem ajuste)
```

---

### BUG-018 — NRF-002.2: Detector de ajustes usa Levenshtein full-string — nenhum par detectado
**Severidade:** 🔴 Crítico
**Versão introduzida:** v3.1.0
**Versão corrigida:** v3.5.0
**Arquivo:** `src/js/utils/ajusteDetector.js`

**Descrição:**
O detector comparava as descrições completas de crédito e despesa com Levenshtein (threshold 0.72). Em extratos bancários reais, a descrição do crédito/cashback raramente se parece com a descrição da despesa original:
- Despesa: `"IFOOD *RESTAURANTE ABC 01/11"`
- Crédito: `"IFOOD CREDITO"` ou `"PIX RECEBIDO IFOOD"`

Similaridade calculada: ~0.25–0.35 → sempre abaixo do threshold → **nenhum par era detectado**, tornando a funcionalidade inteira inoperante.

**Código problemático:**
```javascript
const sim = similaridade(normCred, normalizarStr(desp.descricao));
if (sim < simMinima) continue;  // simMinima = 0.72 — nunca passava
```

**Impacto:**
NRF-002.2 completamente inoperante. Nenhuma linha de crédito era marcada como `ajuste_parcial`, nenhuma despesa recebia `valorLiquido`.

**Correção aplicada:**
Substituído Levenshtein por verificação de **keyword compartilhada**: extrai o padrão que identificou o estabelecimento no crédito (ex: `'IFOOD'`) e verifica se a despesa candidata contém o mesmo padrão. Levenshtein mantido apenas como critério de desempate entre múltiplas despesas candidatas.

```javascript
// Extrai keyword que identificou o crédito
const keyword = PADROES_ESTABELECIMENTO[tipoEst].find(p => normCredUpper.includes(p));
// Despesa deve conter a mesma keyword
if (!normDespUpper.includes(keyword)) continue;
// Levenshtein apenas para desempate (sem threshold gate)
const sim = similaridade(normCred, normalizarStr(desp.descricao));
if (sim > melhorSim) { melhorSim = sim; melhorDesp = desp; }
```

---

## Legenda de Severidade

| Ícone | Nível | Critério |
|-------|-------|----------|
| 🔴 | Crítico | Quebra funcionalidade principal; crash ou dado incorreto visível |
| 🟠 | Médio | Impacto real mas requer condição específica ou tem baixa probabilidade |
| 🟡 | Baixo/Cosmético | Performance, UX degradada ou legibilidade de código |
