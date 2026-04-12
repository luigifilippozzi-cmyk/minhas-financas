# Plano de Testes — RF-062: Cartoes de Credito como Contas Individuais

> **Versao:** v3.21.0 | **Data:** 2026-04-12 | **PR:** #128
> **Responsavel:** Dev Manager | **Status:** Pendente validacao manual

---

## Resumo da Feature

RF-062 transforma a conta unica generica "Cartao de Credito" em N contas individuais `tipo:'cartao'`, cada uma representando um cartao real da familia. Inclui CRUD de cartoes, migracao de dados legados, filtragem no import de fatura e auto-deteccao por emissor.

---

## Matriz de Cobertura

| Area | Testes Unitarios | Testes Manuais | Criticidade |
|------|:---:|:---:|:---:|
| modelConta + CONTAS_PADRAO | 16 testes (100% cov) | 4 TCs | Alta |
| migrarCartaoGenerico | 0 (Firestore) | 6 TCs | Alta |
| CRUD cartoes (contas.html) | 0 (UI) | 14 TCs | Alta |
| Banner de migracao | 0 (UI) | 4 TCs | Media |
| Fatura — seletor de cartao | 0 (UI) | 6 TCs | Alta |
| Import — filtragem + auto-detect | 0 (UI) | 8 TCs | Alta |
| Pipeline — projecoes | 5 testes | 2 TCs | Media |
| Backward compat | 0 (manual) | 4 TCs | Critica |
| Navbar | 0 (visual) | 2 TCs | Baixa |
| **Total** | **21 automatizados** | **50 manuais** | |

---

## Area 1: CRUD de Cartoes (contas.html)

### TC-001: Criar cartao minimo (apenas nome)
- **Pre-condicao:** Logado, pagina Contas aberta
- **Passos:**
  1. Clicar "+ Novo Cartao"
  2. Preencher nome: "Nubank Luigi"
  3. Clicar "Salvar"
- **Resultado esperado:** Cartao aparece na lista com emoji padrao (credit card), cor roxa, sem detalhes
- **Verificacao Firestore:** `tipo:'cartao'`, `ativa:true`, sem `_legado`

### TC-002: Criar cartao com todos os campos
- **Passos:**
  1. Clicar "+ Novo Cartao"
  2. Nome: "Itau Visa Ana"
  3. Emissor: Itau | Bandeira: Visa | Ultimos4: 5678
  4. Fechamento: 20 | Vencimento: 5
  5. Conta pagadora: Banco Itau | Titular: Ana
  6. Emoji: credit card | Cor: #EC6600
  7. Salvar
- **Resultado esperado:** Todos os campos visiveis na lista: "Itau . Visa . ****5678" + "Fecha: dia 20 | Vence: dia 5"

### TC-003: Editar cartao existente
- **Pre-condicao:** Cartao "Nubank Luigi" existe
- **Passos:**
  1. Clicar "Editar" no cartao
  2. Alterar nome para "Nubank Luigi Gold"
  3. Adicionar emissor: Nubank, bandeira: Mastercard
  4. Salvar
- **Resultado esperado:** Modal abre com dados pre-preenchidos, apos salvar mostra dados atualizados

### TC-004: Desativar cartao
- **Pre-condicao:** Cartao existe
- **Passos:**
  1. Clicar "Desativar"
  2. Confirmar no dialog
- **Resultado esperado:** Cartao some da lista (soft delete, `ativa:false` no Firestore)

### TC-005: Cancelar desativacao
- **Passos:** Clicar "Desativar" > Cancelar no dialog
- **Resultado esperado:** Cartao permanece na lista

### TC-006: Validacao campo obrigatorio
- **Passos:** Abrir modal > Deixar nome vazio > Salvar
- **Resultado esperado:** Form impede envio (campo required)

### TC-007: Ultimos4 — aceita apenas digitos
- **Passos:** Digitar "abcd" no campo "Ultimos 4 digitos"
- **Resultado esperado:** Campo aceita apenas numeros (pattern `\d{0,4}`)

### TC-008: Dia fechamento/vencimento — limites
- **Passos:** Tentar inserir 0 ou 32
- **Resultado esperado:** Input type=number com min=1 max=31 impede valores fora da faixa

### TC-009: Fechar modal pelo X
- **Passos:** Abrir modal > Clicar botao X
- **Resultado esperado:** Modal fecha sem salvar

### TC-010: Fechar modal clicando fora
- **Passos:** Abrir modal > Clicar na area escura fora do content
- **Resultado esperado:** Modal fecha sem salvar

### TC-011: Protecao XSS no nome
- **Passos:** Criar cartao com nome `<img src=x onerror=alert(1)>`
- **Resultado esperado:** Nome exibido como texto literal (escHTML), sem execucao de script

### TC-012: Lista vazia — empty state
- **Pre-condicao:** Grupo sem nenhum cartao
- **Resultado esperado:** Mensagem "Nenhum cartao cadastrado. Clique em '+ Novo Cartao' para adicionar."

### TC-013: Secao Contas Bancarias
- **Pre-condicao:** Grupo com contas padrao (Itau, Bradesco, etc.)
- **Resultado esperado:** Contas bancarias listadas na secao inferior com emoji/cor corretos

### TC-014: Contas bancarias nao tem botoes de acao
- **Resultado esperado:** Secao de bancos nao tem botao "Editar" ou "Desativar" (read-only display)

---

## Area 2: Migracao de Dados Legados

### TC-015: Banner aparece para grupo legado sem cartao real
- **Pre-condicao:** Grupo existente com conta "Cartao de Credito" (criada antes de v3.21.0)
- **Resultado esperado:** Banner amarelo visivel no topo: "Migracao necessaria: Seu grupo usa a conta generica..."

### TC-016: Banner desaparece apos criar cartao real
- **Pre-condicao:** Banner visivel (TC-015)
- **Passos:** Criar qualquer cartao real
- **Resultado esperado:** Banner desaparece automaticamente (listener ativo)

### TC-017: Banner nao aparece em grupo novo
- **Pre-condicao:** Grupo criado apos v3.21.0
- **Resultado esperado:** Banner oculto (nenhuma conta generica existe)

### TC-018: Conta legado aparece na secao bancaria com tag
- **Pre-condicao:** Grupo com conta migrada (_legado:true)
- **Resultado esperado:** "Cartao de Credito" aparece em "Contas Bancarias" com tag "legado" e opacidade 60%

---

## Area 3: Migracao no Boot (app.js + database.js)

### TC-019: migrarCartaoGenerico — primeira execucao
- **Pre-condicao:** Conta "Cartao de Credito" com `_legado: undefined`
- **Trigger:** Login no dashboard (app.js chama migrarCartaoGenerico)
- **Resultado esperado:** Conta marcada com `_legado: true` no Firestore

### TC-020: migrarCartaoGenerico — idempotente
- **Pre-condicao:** Conta ja com `_legado: true`
- **Trigger:** Login novamente
- **Resultado esperado:** Nenhuma alteracao (funcao retorna null)

### TC-021: migrarCartaoGenerico — grupo sem conta generica
- **Pre-condicao:** Grupo novo sem "Cartao de Credito"
- **Resultado esperado:** Funcao retorna null, sem erro no console

### TC-022: garantirContasPadrao — nao cria cartao generico
- **Pre-condicao:** Grupo novo, primeira vez
- **Resultado esperado:** 10 contas criadas (9 bancos + Dinheiro), nenhuma "Cartao de Credito"

### TC-023: temCartaoLegado — retorna true/false corretamente
- **Verificacao via console:** `temCartaoLegado(grupoId)` deve retornar `true` se existe conta com `_legado:true`

### TC-024: temCartaoReal — ignora legado e inativos
- **Verificacao via console:** `temCartaoReal(grupoId)` deve retornar `false` se so existem cartoes legado ou inativos

---

## Area 4: Fatura — Seletor de Cartao (fatura.js)

### TC-025: Dropdown mostra apenas tipo cartao
- **Pre-condicao:** Grupo com 3 bancos + 2 cartoes reais + 1 legado
- **Resultado esperado:** Dropdown "sel-cartao" mostra apenas 3 opcoes (2 reais + 1 legado)

### TC-026: Cartao legado marcado com "(legado)"
- **Pre-condicao:** Conta legado existe
- **Resultado esperado:** Opcao exibe "credit card Cartao de Credito (legado)"

### TC-027: Auto-seleciona primeiro cartao real
- **Pre-condicao:** 1 cartao real + 1 legado
- **Resultado esperado:** Cartao real selecionado automaticamente (nao o legado)

### TC-028: Fallback para legado quando nao ha cartao real
- **Pre-condicao:** Apenas cartao legado
- **Resultado esperado:** Legado selecionado como fallback

### TC-029: Trocar cartao recarrega despesas
- **Passos:** Selecionar cartao A > Ver despesas > Selecionar cartao B
- **Resultado esperado:** Lista de despesas atualizada para cartao B

### TC-030: Selecao persiste ao navegar meses
- **Passos:** Selecionar cartao > Avancar mes > Voltar mes
- **Resultado esperado:** Mesmo cartao selecionado

---

## Area 5: Import de Fatura — Filtragem e Auto-Deteccao

### TC-031: Tipo "cartao" filtra dropdowns para cartoes reais
- **Pre-condicao:** Upload de arquivo detectado como fatura de cartao
- **Resultado esperado:** `sel-conta-global` mostra APENAS cartoes `tipo:'cartao'` nao-legado

### TC-032: Tipo "banco" mostra todas as contas
- **Pre-condicao:** Upload de extrato bancario
- **Resultado esperado:** `sel-conta-global` mostra todas as contas (bancos + dinheiro + cartoes)

### TC-033: Trocar tipo atualiza dropdown de contas
- **Passos:** Upload detectado como "cartao" > Mudar para "banco" no seletor
- **Resultado esperado:** Dropdown atualizado para mostrar todas as contas

### TC-034: Auto-deteccao por emissor — Itau
- **Pre-condicao:** Cartao "Itau Visa" com `emissor:'itau'` cadastrado
- **Passos:** Upload arquivo com nome/conteudo de Itau
- **Resultado esperado:** Cartao "Itau Visa" auto-selecionado no dropdown

### TC-035: Auto-deteccao por emissor — Nubank
- **Pre-condicao:** Cartao "Nubank Ana" com `emissor:'nubank'` cadastrado
- **Passos:** Upload arquivo Nubank
- **Resultado esperado:** Cartao "Nubank Ana" auto-selecionado

### TC-036: Auto-deteccao sem match — fallback
- **Pre-condicao:** Nenhum cartao com emissor compativel
- **Resultado esperado:** Nenhum cartao auto-selecionado, dropdown permanece em "-- sem conta --"

### TC-037: Selecao manual sobrescreve auto-deteccao
- **Pre-condicao:** Cartao A auto-selecionado
- **Passos:** Manualmente selecionar cartao B
- **Resultado esperado:** Cartao B aplicado a todas as linhas

### TC-038: Dropdowns por linha filtrados em modo cartao
- **Pre-condicao:** Import tipo "cartao" com preview de linhas
- **Resultado esperado:** Cada `sel-conta-linha` mostra apenas cartoes reais

---

## Area 6: Pipeline de Projecoes (pipelineCartao.js)

### TC-039: Projecoes propagam contaId
- **Pre-condicao:** Import de fatura com cartao "Nubank" selecionado, linha parcelada (ex: 01/06)
- **Resultado esperado:** As 5 projecoes futuras tem `contaId` = ID do cartao Nubank no Firestore

### TC-040: Projecoes propagam mesFatura
- **Pre-condicao:** Import com mesFatura "2026-04", linha parcelada
- **Resultado esperado:** Projecoes tem `mesFatura: '2026-04'` (nota: valor do mes de origem, nao incrementado)

---

## Area 7: Backward Compatibility (CRITICO)

### TC-041: Despesas antigas vinculadas ao cartao legado continuam visiveis
- **Pre-condicao:** Despesas existentes com `contaId` apontando para conta "Cartao de Credito" legado
- **Passos:** Abrir pagina Fatura > Selecionar cartao legado
- **Resultado esperado:** Despesas listadas normalmente, sem erro

### TC-042: Dashboard nao quebra com cartao legado
- **Pre-condicao:** Despesas com cartao legado no periodo atual
- **Resultado esperado:** Dashboard renderiza normalmente, valores corretos

### TC-043: Import de fatura com cartao legado (pre-v3.21.0)
- **Nota:** Contas legado NAO aparecem no dropdown de import (filtradas como `_legado`)
- **Resultado esperado:** Usuario e incentivado a criar cartao real para novos imports

### TC-044: Nenhuma perda de dados na migracao
- **Verificacao Firestore:** Apos login, verificar que:
  - Conta "Cartao de Credito" tem `_legado: true` (nao deletada)
  - Todas as despesas mantêm `contaId` original intacto
  - Nenhum documento de `parcelamentos` foi alterado

---

## Area 8: Navbar e Navegacao

### TC-045: Link "Contas" presente em todas as paginas
- **Passos:** Visitar cada pagina: Dashboard, Despesas, Receitas, Orcamentos, Categorias, Fatura, Fluxo de Caixa, Planejamento, Base de Dados, Contas
- **Resultado esperado:** Link "wallet Contas" presente na navbar de todas as 10 paginas

### TC-046: Link "Contas" ativo na pagina correta
- **Passos:** Abrir contas.html
- **Resultado esperado:** Link "Contas" com classe `btn-primary` (ativo), demais com `btn-outline`

---

## Area 9: Sincronizacao em Tempo Real

### TC-047: Criacao de cartao reflete em outra aba
- **Passos:**
  1. Abrir contas.html em 2 abas do navegador
  2. Criar cartao na aba 1
- **Resultado esperado:** Cartao aparece na aba 2 automaticamente (onSnapshot)

### TC-048: Desativacao reflete em outra aba
- **Passos:**
  1. Desativar cartao na aba 1
- **Resultado esperado:** Cartao desaparece da aba 2

---

## Area 10: Integracao Vite Build

### TC-049: Build de producao inclui contas.html
- **Comando:** `npm run build`
- **Resultado esperado:** `dist/contas.html` existe no output

### TC-050: Dev server serve contas.html
- **Comando:** `npm run dev`
- **Resultado esperado:** `http://localhost:5173/contas.html` carrega sem erro

---

## Sequencia Recomendada de Execucao

1. **Bloco 1 — Fundacao** (15 min): TC-019 a TC-024 (migracao), TC-049-050 (build)
2. **Bloco 2 — CRUD** (20 min): TC-001 a TC-014 (contas page)
3. **Bloco 3 — Banner** (5 min): TC-015 a TC-018
4. **Bloco 4 — Fatura** (10 min): TC-025 a TC-030
5. **Bloco 5 — Import** (15 min): TC-031 a TC-038
6. **Bloco 6 — Pipeline** (5 min): TC-039, TC-040
7. **Bloco 7 — Backward Compat** (10 min): TC-041 a TC-044 (CRITICO)
8. **Bloco 8 — Navegacao** (5 min): TC-045, TC-046
9. **Bloco 9 — Real-time** (5 min): TC-047, TC-048

**Tempo estimado total:** ~90 minutos

---

## Criterios de Aceite (da issue #125)

- [ ] `CONTAS_PADRAO` nao contem mais "Cartao de Credito" generico → TC-022
- [ ] Grupo novo faz onboarding sem cartao generico → TC-022
- [ ] Grupo existente com conta generica + despesas antigas funciona → TC-041, TC-044
- [ ] Banner de migracao aparece/desaparece corretamente → TC-015, TC-016
- [ ] Modal de Contas tem secao dedicada a Cartoes → TC-001 a TC-014
- [ ] Import de fatura exige selecao de cartao → TC-031
- [ ] Auto-deteccao por emissor funciona → TC-034, TC-035
- [ ] `npm test` verde (252 testes) → Automatizado (CI)

---

## Riscos Monitorados

| Risco | Mitigacao | TCs Relacionados |
|-------|-----------|-----------------|
| BUG-021/022/026: regressao mesFatura | import-pipeline-reviewer PASS | TC-040 |
| Despesas orfas pos-migracao | Conta legado NAO deletada | TC-041, TC-044 |
| NRF-010: Portador "Conjunto" quebra | Campo portador inalterado | Teste manual ad-hoc |
| XSS via nome de cartao | escHTML em todos os innerHTML | TC-011 |
