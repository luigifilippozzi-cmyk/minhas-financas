# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

---

## [1.7.1] - 2026-03-25

### Corrigido

#### 🐛 Parcelas em Aberto — widget nunca exibia dados
**Arquivo:** `src/js/services/database.js` → `ouvirParcelamentosAbertos()`

**Causa raiz (3 camadas):**
1. A query `where('tipo','==','projecao') + orderBy('data','asc')` exigia o índice composto `(grupoId, tipo, data ASC)` no Firestore
2. O índice existia no `firestore.indexes.json` local mas **nunca havia sido deploiado** — portanto nunca foi construído na instância de produção do Firestore
3. A falha era silenciosa: `onSnapshot` capturava o erro "FAILED_PRECONDITION: The query requires an index" apenas com `console.error`, mantendo o widget oculto indefinidamente

**Fix:** Query reescrita para usar o índice `(grupoId, data DESC)` — já existente e construído desde o início do projeto. O filtro `tipo === 'projecao'` passou a ser aplicado client-side após receber os resultados:
```js
// Antes — dependia de índice nunca construído
where('grupoId','==', grupoId), where('tipo','==','projecao'), orderBy('data','asc')

// Depois — usa índice (grupoId, data DESC) já existente
where('grupoId','==', grupoId), where('data','>=', hoje), orderBy('data','desc')
// + .filter(d => d.tipo === 'projecao') client-side
```

#### 🐛 Coleções `contas` e `receitas` sem acesso no Firestore
**Arquivos:** `firestore.rules`, `firestore.indexes.json`

**Causa raiz:**
- As coleções `contas` (NRF-004) e `receitas` (RF-016) foram implementadas no código mas as regras de segurança do Firestore **nunca foram atualizadas** para permitir acesso a elas
- Firestore nega todas as operações por padrão quando não há regra definida
- O erro era silencioso: `garantirContasPadrao` usava `.catch(() => {})` e `ouvirContas` apenas logava no console
- Resultado: seletores de banco/conta vazios em todas as páginas (Fatura, Importar, Despesas)

**Fix:**
- `firestore.rules`: adicionadas regras `allow read/write/create` para `/contas/{id}` e `/receitas/{id}` com `isMemberOfGroup` igual às demais coleções
- `firestore.indexes.json`: adicionados índices compostos `contas(grupoId, ativa)` e `receitas(grupoId, data)`

---

## [1.7.0] - 2026-03-25

### Adicionado — NRF-005: Fatura do Cartão de Crédito

Nova página que substitui a planilha manual de fechamento mensal do cartão.

#### Página `fatura.html` + `fatura.js`
- Filtro por mês (navegação ‹ › ) e seletor de conta/cartão
- Cards de resumo: Total da fatura, total a pagar por membro (individual + 50% das conjuntas)
- Tabs: **Todas**, por membro (dinamicamente gerado a partir de `nomesMembros`), **Conjuntas**, **Projeções**
- Tabela completa: Data, Estabelecimento, Responsável, Tipo (P/V), Parcela, Categoria, Valor, Meu Bolso
- Despesas conjuntas com destaque visual amarelo e coluna "Por Pessoa" (= `valorAlocado ?? valor/2`)
- Seção "Projeções" com parcelas futuras dos próximos 6 meses agrupadas por mês/pessoa
- Resumo detalhado por pessoa: individuais à vista, individuais parceladas, conjuntas (50%), **Total a pagar**
- **Exportação Excel** (SheetJS) com 3 abas: Transações, Resumo, Conjuntas — substitui planilha manual
- Link `💳 Fatura` adicionado ao navbar de todas as 8 páginas da aplicação

### Corrigido — NRF-004: Detecção automática de banco no import CSV

- **`CONTAS_PADRAO` expandido**: adicionados Banco Bradesco, Nubank, Banco Inter, Caixa Econômica e Banco do Brasil — agora 11 contas padrão contra as 6 anteriores
- **`garantirContasPadrao` agora é upsert**: antes só criava contas se a lista estava vazia; agora adiciona contas faltantes ao grupo em cada inicialização, garantindo que usuários existentes recebam novos bancos automaticamente
- **Matching com normalização de acentos** (`NFD`): "Itau" (sem acento) agora corresponde corretamente a "Banco Itaú"
- **`contaNome` da coluna passa pela inferência**: quando o arquivo traz "Bradesco" na coluna Conta e não há match direto por nome, o valor da coluna agora passa pela função `inferirContaDaDescricao` (que reconhece a keyword "bradesco" → "Banco Bradesco") antes do fallback para o seletor global
- Correção replicada em `importar.js` (despesas) e `receitas.js` (receitas)

---

## [1.6.3] - 2026-03-25

### Adicionado
- **Inferência automática de banco pela descrição** (`inferirContaDaDescricao`): ao importar despesas ou receitas, o sistema detecta o banco/conta em 3 níveis — (1) coluna "Conta / Banco" do arquivo, (2) palavras-chave da descrição da transação contra os nomes das contas do grupo e mapa estático de ~16 bancos brasileiros (Itaú, Bradesco, Santander, BTG, XP, Nubank, Inter, C6, Caixa, BB, Sicoob, etc.), (3) seletor global da tela

### Corrigido
- **Import de extratos bancários com valores negativos**: `parsearLinhasExtrato` agora aplica `Math.abs()` ao valor — transações de débito em conta-corrente (ex: `-R$ 180,00`) eram descartadas; agora são importadas corretamente como despesas
- **Cache de HTML no browser**: `firebase.json` configurado com `Cache-Control: no-cache, no-store` para arquivos `.html`, evitando que o browser sirva versões desatualizadas das páginas

---

## [1.6.0] - 2026-03-25

### Adicionado — NRF-004: Identificação de Conta/Banco por Transação

Permite distinguir em qual banco ou cartão cada transação foi realizada, tanto nas despesas manuais quanto na importação em massa de extratos.

#### Coleção `contas` no Firestore
- Nova coleção normalizada (mesmo padrão das `categorias`) com escopo por grupo
- Seed automático das contas padrão ao entrar no app pela primeira vez:
  - 💳 Cartão de Crédito, 🟠 Banco Itaú, 📊 Banco XP, 🔴 Banco Santander, 💼 Banco BTG, 💵 Dinheiro
- CRUD completo: `ouvirContas`, `criarConta`, `excluirConta`, `garantirContasPadrao` em `database.js`
- Novo arquivo: `src/js/models/Conta.js` com model e `CONTAS_PADRAO`

#### Despesas — formulário e lista
- Select "Conta / Banco" no modal de Nova/Editar Despesa (campo opcional)
- Badge colorido com emoji e cor do banco em cada item da lista de despesas
- Filtro "Todas as contas" na barra de filtros da página de Despesas
- `contaId` adicionado como campo opcional nos models `Despesa.js` e `Receita.js`

#### Importação em massa de despesas (importar.html)
- **Seletor global** "🏦 De qual banco/conta é este extrato?" (Passo 2, antes do upload)
  — aplicado automaticamente a todas as transações ao carregar o arquivo
- **Override por linha** na tabela de preview (select por linha, igual às categorias)
- **Ação em lote** "Conta:" na barra de ações do preview para trocar todas de uma vez
- Mudança do seletor global após preview aberto atualiza todas as linhas em tempo real
- `contaId` propagado para as projeções de parcelas futuras
- **Parser NRF-004**: `parsearLinhasExtrato` detecta coluna "Conta / Banco" no cabeçalho do arquivo CSV/XLSX e resolve automaticamente para `contaId` via busca por nome
- **Template dinâmico**: botão "Baixar Template" agora gera o `.xlsx` via SheetJS com coluna "Conta / Banco" e aba "Instruções" listando os bancos cadastrados do grupo (substituiu link estático)

#### Importação de receitas (receitas.html)
- Seção de importação colapsável integrada à página de receitas
- Parser `_parsearLinhasRec` detecta coluna "Conta / Banco" e resolve para `contaId`
- Template dinâmico com SheetJS incluindo coluna "Conta / Banco"
- Seletor global, override por linha e ação em lote de conta, igual às despesas

### Alterado
- `app.js`: importa `garantirContasPadrao` e `CONTAS_PADRAO`; seed disparado no boot do app
- `controllers/despesas.js`: `contaId` incluído no payload de create/update
- `pages/despesas.js`: listener `ouvirContas`, populate selects, badge, filtro ativo
- `pages/importar.js`: parser atualizado com `idxConta`; template gerado dinamicamente; listener `ouvirContas` iniciado junto com categorias
- `pages/receitas.js`: lógica de importação completa com suporte NRF-004

---

## [1.5.0] - 2026-03-25

### Alterado — Redesign Visual Completo (UI/UX)

Revisão do sistema de design inspirada em bibliotecas open-source:
- **[Inter](https://github.com/rsms/inter)** (SIL Open Font License) — tipografia adotada em toda a aplicação
- **[shadcn/ui](https://github.com/shadcn-ui/ui)** (MIT) — paleta neutra slate, botões, modais, focus ring
- **[Tremor](https://github.com/tremorlabs/tremor)** (Apache 2.0) — KPI cards com linha colorida + hover lift
- **[Radix UI Colors](https://github.com/radix-ui/colors)** (MIT) — sistema semântico de cores

#### `variables.css` — novo sistema de design
- **Fonte:** Inter via Google Fonts com `preconnect` otimizado em todos os HTMLs
- **Paleta semântica:** `--color-income` (verde), `--color-expense` (rose), `--color-balance` (blue), `--color-budget` (violet)
- **Sombras refinadas:** 5 níveis com base `rgba(15,23,42)` mais suaves e realistas
- **Border radius:** aumentado (6 / 10 / 14 / 20px) para visual mais moderno
- **Transições:** `cubic-bezier(0.4,0,0.2,1)` em lugar de `ease` genérico
- Novos tokens: `--color-surface-alt`, `--color-border-hover`, `--color-primary-ring`, `--color-*-light/text`

#### `components.css` — componentes polidos
- **Navbar:** `backdrop-filter: blur(12px)` com fundo translúcido; links de navegação sem borda, separador visual entre nome do usuário e links; botão Sair vermelho no hover; responsivo (oculta nome e brand em mobile)
- **Botões:** sombra de cor no hover (`.btn-primary`), focus ring de acessibilidade (3px), variante `.btn-ghost`, `.btn-lg` e `.btn-icon`
- **Cards:** hover lift com `translateY(-2px)` e `shadow-card-hover`
- **Modal:** backdrop com `blur(4px)`, animação `slideUp` com spring, cabeçalho e rodapé com divisor
- **Inputs:** ring de foco de 3px com cor primária translúcida, hover muda cor da borda
- **Scrollbar customizada:** 6px, arredondada, transparente no track
- **Feedback forms:** ícone alinhado, borda lateral colorida

#### `dashboard.css` — layout e cards
- **Cards de resumo:** linha colorida no topo (3px) por tipo de card; hover lift; valor com `font-weight: 800` e `letter-spacing: -0.03em`
- **Category cards:** hover lift + `shadow-md`
- **Expense items:** transição suave de borda + background ao hover
- **Parcelamentos widget:** gradiente sutil no cabeçalho (`#f0f0ff → #f5f3ff`)
- **Responsivo mobile:** grid 2 colunas, brand oculto, nome do usuário oculto, padding reduzido

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
