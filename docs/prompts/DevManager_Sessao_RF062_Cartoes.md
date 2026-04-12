# Dev Manager — Sessão de Execução: RF-062 (Cartões de Crédito como Contas Individuais)

> **Tipo:** Sessão de implementação de feature
> **Issue:** #125
> **Data de criação:** 2026-04-12
> **Criado por:** Luigi (PO)
> **Prioridade:** P0

---

## Instruções de Uso

Cole o conteúdo do prompt base (`docs/MF_Prompt_DevManager_Squad.md`) no início da sessão do Dev Manager no Claude Code, seguido deste complemento abaixo.

---

## COMPLEMENTO — Tarefa de Execução: RF-062

### Objetivo

Implementar a issue **#125** — transformar a conta genérica "Cartão de Crédito" (`CONTAS_PADRAO`) em N contas individuais do tipo `'cartao'`, cada uma representando um cartão real da família.

**Esta é a primeira issue da cadeia P0 (RF-062 → RF-063 → RF-064).** Pode rodar em paralelo com RF-063 (#126).

### Contexto Técnico

Ler antes de implementar:
1. `docs/REQUISITOS_FUNCIONAIS.md` — seção "RF-062: Cartões de Crédito como Contas Individuais"
2. `docs/REQUISITOS_FUNCIONAIS.md` — seção "Contexto: Cadeia Real de Pagamento de Fatura"
3. `docs/ISSUES_PARA_ABRIR_MF-062_063_064.md` — body completo da issue #125
4. `src/js/models/` — factory de Conta existente
5. `src/js/app.js` — `garantirContasPadrao()` e `CONTAS_PADRAO`
6. `src/js/utils/bankFingerprintMap.js` — emissores suportados
7. `src/js/pages/contas.js` — UI de contas atual
8. `src/js/pages/importar.js` — fluxo de importação de fatura

### Escopo de Implementação

#### 1. Modelo de Dados — Novos campos em Conta (`tipo === 'cartao'`)

```javascript
{
  tipo: 'cartao',           // novo tipo (existem 'corrente', 'poupanca', etc.)
  bandeira: 'visa',         // 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard'
  emissor: 'nubank',        // slug do emissor (match com bankFingerprintMap)
  ultimos4: '1234',         // últimos 4 dígitos (visual/dedup)
  diaFechamento: 3,         // dia do ciclo de fechamento (1-28)
  diaVencimento: 10,        // dia do vencimento da fatura (1-28)
  contaPagadoraId: 'xxx',   // ref para a conta corrente que paga esta fatura
  titularPadraoId: 'uid',   // ref para o membro do grupo titular (Luigi ou Ana)
}
```

#### 2. Alterações em `app.js`

- Remover "Cartão de Crédito" genérico de `CONTAS_PADRAO`
- Criar migração `migrarCartaoGenerico()` idempotente:
  - Se grupo tem conta genérica "Cartão de Crédito" COM despesas → manter como legado `ativa: true`
  - Se grupo tem conta genérica SEM despesas → marcar `ativa: false`
  - Flag `grupoData.cartaoMigrado = true` após executar
- Banner persistente em `contas.html` para grupos legados que ainda têm a conta genérica

#### 3. UI em `contas.html`

- Seção separada "Cartões de Crédito" com lista visual de cartões
- Modal de criar/editar cartão com campos: nome, bandeira, emissor, últimos 4, dia fechamento, dia vencimento, conta pagadora (dropdown de contas correntes), titular
- Card visual por cartão mostrando bandeira + emissor + últimos 4

#### 4. Pipeline de Importação — `importar.html`

- Quando tipo detectado = "fatura de cartão" → exibir dropdown "Qual cartão?"
- Auto-detecção: cruzar `emissor` do arquivo (via `detectorOrigemArquivo.js` + `bankFingerprintMap.js`) com cartões cadastrados
- Se match único → pré-selecionar. Se múltiplos → exigir seleção manual.
- `contaCartaoId` propagado para todas as despesas do lote importado

#### 5. Backward Compatibility

- Despesas antigas com `conta === 'Cartão de Crédito'` (string legado) continuam funcionando
- Queries de fatura devem suportar tanto o formato legado quanto o novo `contaCartaoId`
- **NUNCA** deletar a conta legado — só `ativa: false` quando migrada

### Padrões Críticos a Seguir

- `escHTML()` em TODA inserção de dados do usuário via innerHTML
- `grupoId` em TODAS as queries Firestore
- `mesFatura` SEMPRE propagado em despesas de cartão (BUG-021/022/026)
- CSS: usar tokens de `variables.css`, nunca hardcodar cores
- Conventional Commits: `feat(contas): ...`
- Testes: manter 231+ unitários passando, adicionar testes para o novo modelo

### Branch e Workflow

```bash
git checkout main && git pull origin main
git checkout -b feat/MF-125-cartoes-contas-individuais

# ... implementar ...

npm test   # TODOS devem passar

# Subagentes OBRIGATÓRIOS antes do PR:
# 1. test-runner → npm test + coverage
# 2. import-pipeline-reviewer → mexida no fluxo de fatura

git add <arquivos específicos>
git commit -m "feat(contas): RF-062 — cartões de crédito como contas individuais (v3.21.0)"
git push -u origin feat/MF-125-cartoes-contas-individuais
gh pr create --title "feat(contas): RF-062 — Cartões de Crédito como Contas Individuais (#125)" \
  --body "Closes #125\n\n## Resumo\nTransforma conta genérica em N cartões individuais.\n\n## Checklist\n- [ ] Testes passando\n- [ ] test-runner acionado\n- [ ] import-pipeline-reviewer acionado\n- [ ] Sem regressão em mesFatura\n- [ ] escHTML em toda UI nova"
```

### Critérios de Aceitação (copiar para checklist do PR)

- [ ] `CONTAS_PADRAO` não contém mais a conta genérica "Cartão de Crédito"
- [ ] Grupo novo faz onboarding sem cartão genérico pré-criado
- [ ] Grupo existente com conta genérica + despesas antigas continua funcionando
- [ ] Banner de migração aparece para grupos legados e desaparece após criar ao menos um cartão real
- [ ] Modal de Contas tem seção dedicada a Cartões com todos os novos campos
- [ ] Import de fatura exige seleção de cartão
- [ ] Auto-detecção por emissor funciona para Itaú, Nubank, Bradesco, BTG, Santander, Inter
- [ ] `npm test` verde (231+ unitários, 26 integração)

### Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Regressão mesFatura (BUG-021/022/026) | import-pipeline-reviewer obrigatório |
| Conta legado orphaned | Backward compat: queries suportam ambos formatos |
| bankFingerprintMap incompleto | Listar emissores suportados; novos emissores → escalar ao PO |
| Migração não-idempotente | Flag `cartaoMigrado` previne re-execução |
