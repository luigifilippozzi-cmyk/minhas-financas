# 🏗️ Arquitetura Técnica — Minhas Finanças

## Stack Tecnológico

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend | HTML5 + CSS3 + JS ES6+ (módulos nativos) | Sem frameworks — foco no aprendizado base |
| Autenticação | Firebase Authentication | Solução robusta, sem backend próprio |
| Banco de Dados | Cloud Firestore | NoSQL em tempo real, escalável |
| Hospedagem | Firebase Hosting | CDN global, HTTPS automático |
| Planilhas | SheetJS (XLSX) | Import/export Excel sem backend |
| Gráficos | Chart.js v4 | Gráficos de fluxo de caixa, licença MIT |

---

## Estrutura do Firestore

```
firestore/
├── usuarios/{userId}
│   ├── email: string
│   ├── nome: string
│   ├── grupoId: string
│   └── dataCriacao: timestamp
│
├── grupos/{grupoId}
│   ├── nome: string
│   ├── membros: [userId1, userId2]
│   ├── nomesMembros: { uid: nome }        ← mapa uid → nome
│   ├── codigoConvite: string (6 chars)
│   ├── maxMembros: number (2)
│   ├── criadoPor: string (userId)         ← RF-018: identifica o mestre do grupo (admin)
│   └── dataCriacao: timestamp
│
├── categorias/{categoriaId}
│   ├── grupoId: string
│   ├── nome: string
│   ├── emoji: string
│   ├── cor: string (hex)
│   ├── tipo: 'despesa' | 'receita'
│   └── ativa: boolean
│
├── despesas/{despesaId}
│   ├── grupoId: string
│   ├── categoriaId: string
│   ├── usuarioId: string
│   ├── descricao: string
│   ├── valor: number
│   ├── data: timestamp
│   ├── dataCriacao: timestamp
│   ├── responsavel: string              ← portador (nome do membro)
│   ├── portador: string                 ← mesmo que responsavel
│   ├── parcela: string                  ← "X/Y" ou "-"
│   ├── tipo: 'despesa' | 'projecao' | 'projecao_paga'
│   ├── status: 'pago' | 'pendente'
│   ├── origem: 'importacao' | 'manual' | 'projecao'
│   ├── isConjunta: boolean              ← despesa compartilhada 50/50
│   ├── valorAlocado: number | null      ← valor por pessoa (conjuntas)
│   ├── contaId: string | null           ← ref para contas/{id} (NRF-004)
│   ├── chave_dedup: string | null       ← dedup key (RF-014 / NRF-008)
│   ├── parcelamento_id: string | null   ← ref para parcelamentos/{id}
│   ├── despesaRealId: string | null     ← id da despesa real (projecao_paga)
│   ├── origemBanco: string | null       ← banco/emissor detectado (RF-021/RF-022)
│   └── importadoEm: timestamp | null
│
├── receitas/{receitaId}
│   ├── grupoId: string
│   ├── categoriaId: string
│   ├── usuarioId: string
│   ├── descricao: string
│   ├── valor: number
│   ├── data: timestamp
│   ├── dataCriacao: timestamp
│   ├── origem: 'importacao' | 'manual'
│   ├── responsavel: string | null       ← NRF-009: nome do responsável (auto-atribuído no import bancário)
│   ├── contaId: string | null           ← NRF-004
│   ├── chave_dedup: string | null       ← NRF-008
│   ├── origemBanco: string | null       ← RF-021/RF-022
│   └── importadoEm: timestamp | null
│
├── orcamentos/{grupoId_categoriaId_ano_mes}
│   ├── grupoId: string
│   ├── categoriaId: string
│   ├── mes: number (1–12)
│   ├── ano: number
│   └── valorLimite: number
│
├── contas/{contaId}                     ← NRF-004
│   ├── grupoId: string
│   ├── nome: string
│   ├── emoji: string
│   ├── cor: string (hex)
│   ├── tipo: 'banco' | 'cartao' | 'dinheiro'
│   └── ativa: boolean
│
└── parcelamentos/{parcId}               ← NRF-002
    ├── grupoId: string
    ├── estabelecimento: string
    ├── valorTotal: number
    ├── totalParcelas: number
    ├── parcelasPagas: number
    ├── portador: string
    ├── usuarioId: string
    ├── dataOriginal: timestamp
    ├── status: 'ativo' | 'quitado'
    ├── criadoEm: timestamp
    └── atualizadoEm: timestamp
```

---

## Índices Compostos do Firestore

Definidos em `firestore.indexes.json`:

| Coleção | Campos | Uso |
|---------|--------|-----|
| `despesas` | `(grupoId ASC, data DESC)` | Listagem mensal de despesas |
| `despesas` | `(grupoId ASC, tipo ASC, data ASC)` | Query de projeções (histórico) |
| `despesas` | `(grupoId ASC, data ASC)` | RF-017/RF-018: busca por intervalo de datas |
| `orcamentos` | `(grupoId ASC, mes ASC, ano ASC)` | Orçamentos por período |
| `categorias` | `(grupoId ASC, ativa ASC)` | Categorias ativas do grupo |
| `parcelamentos` | `(grupoId ASC, status ASC, criadoEm ASC)` | Widget de parcelas em aberto |
| `contas` | `(grupoId ASC, ativa ASC)` | Contas ativas do grupo |
| `receitas` | `(grupoId ASC, data DESC)` | Listagem mensal de receitas |
| `receitas` | `(grupoId ASC, data ASC)` | RF-017/RF-018: busca por intervalo de datas |

---

## Estratégia de Deduplicação (NRF-008)

### Chave de dedup para imports
```
chave_dedup = data(YYYY-MM-DD) || descricao(lower,trim,50chars) || valor(2dec) || portador(lower,30chars) || parcela
```

### Chave simplificada para purga
```
chave_simples = data(YYYY-MM-DD) || descricao(lower,trim,60chars) || valor(2dec)
```

### Fluxo de proteção
1. **Import**: `buscarChavesDedup(grupoId)` → `Set<chave_dedup>` → skipa linhas já existentes
2. **Manual (despesas)**: `criarDespesa` recebe `chave_dedup = manual||data||desc||valor`
3. **Purga**: `purgarDuplicatasDespesas / purgarDuplicatasReceitas` com `dryRun` para análise prévia

---

## Estrutura de Arquivos

```
src/
├── index.html                  ← Redirect auth-aware: dashboard.html / grupo.html / login.html
├── dashboard.html              ← RF-017: gráficos + KPI cards + parcelamentos
├── despesas.html
├── receitas.html
├── orcamentos.html
├── categorias.html
├── fluxo-caixa.html
├── fatura.html                 ← NRF-005
├── base-dados.html             ← RF-018: 4 abas — Importar · Duplicatas · Gerenciar · Limpeza
├── importar.html               ← Redirect para base-dados.html (backward compat)
├── login.html
├── grupo.html
│
├── css/
│   ├── variables.css           ← Sistema de design: cores, sombras, tipografia
│   ├── components.css          ← Navbar, botões, modais, inputs, scrollbar
│   ├── main.css                ← Dashboard, imports, fatura, base-dados, layouts de página
│   └── dashboard.css           ← RF-017: cards KPI, gráficos, filtros de período
│
└── js/
    ├── app.js                  ← Boot: auth, seed de categorias e contas; RF-017 gráficos
    ├── config/
    │   └── firebase.js         ← Inicialização Firebase (Auth + Firestore)
    ├── services/
    │   ├── auth.js             ← onAuthChange, logout
    │   ├── database.js         ← Todas as operações Firestore (CRUD + listeners + batch ops); RF-023: atualizarResponsavelEmMassa()
    │   ├── grupos.js           ← RF-002: criarGrupo, entrarGrupo, gerenciamento de membros
    │   └── storage.js          ← Placeholder Firebase Storage (upload de imagens — futuro)
    ├── models/
    │   ├── Despesa.js          ← modelDespesa() — factory com defaults
    │   ├── Receita.js          ← modelReceita() + CATEGORIAS_RECEITA_PADRAO
    │   ├── Conta.js            ← modelConta() + CONTAS_PADRAO (11 contas)
    │   ├── Categoria.js        ← modelCategoria() + CATEGORIAS_PADRAO (seed automático)
    │   ├── Grupo.js            ← modelGrupo() — factory para criação de grupo
    │   ├── Orcamento.js        ← modelOrcamento() — orçamento mensal por categoria
    │   └── Usuario.js          ← modelUsuario() — perfil de usuário
    ├── controllers/
    │   ├── despesas.js         ← salvarDespesa, deletarDespesa, renderizarListaDespesas
    │   ├── categorias.js       ← RF-003: CRUD de categorias; sync em tempo real
    │   ├── orcamentos.js       ← RF-004: CRUD de orçamentos mensais; copiar mês anterior
    │   ├── dashboard.js        ← RF-009/RF-017: cálculo de KPIs e renderização de cards
    │   └── receitas-dashboard.js ← RF-017: renderização da seção de receitas no dashboard
    ├── pages/
    │   ├── despesas.js         ← RF-005–RF-011: CRUD + filtros + contas
    │   ├── receitas.js         ← RF-016: CRUD + import + dedup
    │   ├── orcamentos.js       ← RF-004
    │   ├── categorias.js       ← RF-003
    │   ├── fluxo-caixa.js      ← NRF-003: gráfico anual Chart.js
    │   ├── fatura.js           ← NRF-005: fechamento do cartão
    │   ├── grupo.js            ← RF-002: criação/entrada de grupo; convite
    │   ├── importar.js         ← Orquestrador fino — RF-013/RF-014/NRF-002/NRF-006/NRF-008/NRF-009/NRF-010
    │   ├── base-dados.js       ← RF-018 + RF-023: tab switching + Gerenciar + edição em massa + Limpeza (purge)
    │   ├── pipelineBanco.js    ← RF-013/RF-020: parse extrato bancário CSV/XLSX/PDF; classificarBanco()
    │   └── pipelineCartao.js   ← RF-013/RF-014: parse fatura; filtrarCreditos(); aplicarMesFatura(); gerarProjecoes()
    └── utils/
        ├── formatters.js           ← formatarMoeda, formatarData, nomeMes, escHTML
        ├── helpers.js              ← dataHoje, normalizarStr, similaridade (Levenshtein)
        ├── validators.js           ← validarEmail, validarValor, validarData — funções de validação de input
        ├── pdfParser.js            ← RF-020: extrairTransacoesPDF() — extração via PDF.js
        ├── normalizadorTransacoes.js ← RF-013: parsing puro CSV/XLSX; normalização; chave dedup; inferência conta
        ├── deduplicador.js         ← RF-013: marcarLinhasDuplicatas() — matching exato + fuzzy + ajustes (sem Firestore)
        ├── ajusteDetector.js       ← NRF-002.2: detectarAjustesParciais() — marketplace/supermercado aware
        ├── categorizer.js          ← RF-022: categorizarTransacao() — por origem + histórico + palavras-chave
        ├── detectorOrigemArquivo.js ← RF-021: detectarOrigemArquivo() — tipo (banco/cartão) + banco/emissor
        └── bankFingerprintMap.js   ← RF-021: 15 bancos/emissores — filePatterns + keywords scoring
```

---

## Contas Padrão (CONTAS_PADRAO)

Seed automático via `garantirContasPadrao` (upsert — adiciona faltantes sem sobrescrever existentes):

| Emoji | Nome | Cor | Tipo |
|-------|------|-----|------|
| 💳 | Cartão de Crédito | `#7B1FA2` | cartao |
| 🟠 | Banco Itaú | `#EC6600` | banco |
| 🔴 | Banco Bradesco | `#D32F2F` | banco |
| 📊 | Banco XP | `#1565C0` | banco |
| 🔴 | Banco Santander | `#CC0000` | banco |
| 💼 | Banco BTG | `#B8860B` | banco |
| 💜 | Nubank | `#820AD1` | banco |
| 🟡 | Banco Inter | `#FF6B00` | banco |
| 🏛️ | Caixa Econômica | `#003399` | banco |
| 💛 | Banco do Brasil | `#FFCC00` | banco |
| 💵 | Dinheiro | `#2E7D32` | dinheiro |

---

## Fluxo de Dados

```
UI Event
  └── Page JS (ex: despesas.js)
        └── Controller (despesas.js) → gera chave_dedup, normaliza campos
              └── Service (database.js) → escreve no Firestore
                    └── onSnapshot → dispara callback
                          └── Page JS → re-renderiza UI (tempo real)
```

---

## Regras de Segurança (firestore.rules)

Princípios:
- Usuário autenticado acessa apenas o próprio perfil em `/usuarios/{userId}`
- Dados do grupo (`categorias`, `despesas`, `receitas`, `orcamentos`, `contas`, `parcelamentos`) só são acessíveis por membros do grupo via `isMemberOfGroup(grupoId)`
- `parcelamentos`: `allow delete: if false` — nunca deletados, apenas quitados por status
- Coleções `contas` e `receitas` exigem regras explícitas — Firestore nega por padrão qualquer coleção não declarada

---

## Inferência de Banco (NRF-004)

Resolução em 3 níveis ao importar transações:

1. **Coluna "Conta / Banco" do arquivo** → match parcial case-insensitive com NFD (ex: "Bradesco" → "Banco Bradesco")
2. **Palavras-chave na descrição** → mapa estático de ~16 bancos brasileiros (Itaú, Bradesco, Santander, BTG, XP, Nubank, Inter, C6, Caixa, BB, Sicoob…)
3. **Seletor global da tela** → fallback para a conta selecionada pelo usuário antes do upload

---

## Reconciliação de Parcelas (NRF-002)

Ao importar uma despesa parcelada já projetada:

1. **Match exato**: `chave_dedup` idêntica → `status: 'pago'` na projeção + `tipo: 'projecao_paga'`
2. **Fuzzy matching**: Similaridade Levenshtein ≥ 85% entre `descricao` + mesma faixa de valor (±5%) + mesmo mês → reconcilia mesmo sem chave exata
3. Projeção mantida no Firestore com `despesaRealId` apontando para a despesa importada
