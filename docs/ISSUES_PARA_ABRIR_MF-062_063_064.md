# Issues para abrir no GitHub — RF-062 / RF-063 / RF-064

> Cole os blocos abaixo diretamente na UI do GitHub ou use o `gh issue create` sugerido no fim deste arquivo. O sandbox do agente não tem `gh` autenticado, então a criação é manual. Após abrir este arquivo pode ser deletado.

Labels sugeridos: `feat`, `alta-prioridade`, `rf-064-chain`

---

## Issue #MF-062 — RF-062: Cartões de Crédito como Contas Individuais

**Title:**
```
feat(contas): RF-062 — Cartões de Crédito como Contas Individuais
```

**Body:**
```markdown
## Resumo
Transforma a conta única genérica `'Cartão de Crédito'` em N contas individuais do tipo `'cartao'`, cada uma representando um cartão real da família. Modelagem pré-requisito para RF-064 (Reconciliação de Pagamento de Fatura).

## Contexto
Ver seção "Contexto: Cadeia Real de Pagamento de Fatura" em `docs/REQUISITOS_FUNCIONAIS.md`. Resolve o bloqueio atual: sem cartão como entidade de primeira classe, o RF-064 não consegue identificar qual cartão está sendo pago pelo débito no extrato bancário.

## Escopo
- Novos campos no modelo Conta quando `tipo === 'cartao'`: `bandeira`, `emissor`, `ultimos4`, `diaFechamento`, `diaVencimento`, `contaPagadoraId`, `titularPadraoId`
- CRUD de cartões em `contas.html` com seção dedicada
- Dropdown "Cartão" no import de fatura (`importar.html`) com auto-detecção via `emissor` + `bankFingerprintMap`
- Remoção de `'Cartão de Crédito'` genérico do `CONTAS_PADRAO`
- Migração `migrarCartaoGenerico()` idempotente em `app.js` + banner persistente em Contas para grupos legados
- Backward compat: despesas antigas continuam funcionando na conta legado

## Critérios de Aceitação
- [ ] `CONTAS_PADRAO` não contém mais a conta genérica "Cartão de Crédito"
- [ ] Grupo novo faz onboarding sem cartão genérico pré-criado
- [ ] Grupo existente com conta genérica + despesas antigas continua funcionando
- [ ] Banner de migração aparece para grupos legados e desaparece após criar ao menos um cartão real
- [ ] Modal de Contas tem seção dedicada a Cartões com todos os novos campos
- [ ] Import de fatura exige seleção de cartão
- [ ] Auto-detecção por emissor funciona para Itaú, Nubank, Bradesco, BTG, Santander, Inter
- [ ] `npm test` verde (231+ unitários, 26 integração)

## Dependências
- Nenhuma (pode rodar em paralelo com #MF-063)

## Bloqueia
- #MF-064

## Subagentes obrigatórios no PR
- test-runner
- import-pipeline-reviewer (pela mexida no fluxo de fatura — risco BUG-021/022/026)

## Referência
- `docs/REQUISITOS_FUNCIONAIS.md` — seção "RF-062: Cartões de Crédito como Contas Individuais"
```

---

## Issue #MF-063 — RF-063: Transferências Intra-Grupo (Settlement entre Membros)

**Title:**
```
feat(despesas): RF-063 — Transferências Intra-Grupo (Luigi ↔ Ana)
```

**Body:**
```markdown
## Resumo
Introduz o tipo `'transferencia_interna'` para representar movimentações financeiras entre membros do mesmo grupo familiar (Luigi ↔ Ana). Essas movimentações são filtradas fora dos agregados de "gastos" e "receita" do mês, eliminando o double count atual de transferências PIX/TED internas.

## Contexto
Ver seção "Contexto: Cadeia Real de Pagamento de Fatura" em `docs/REQUISITOS_FUNCIONAIS.md`. Hoje, uma PIX de R$ 1.750 do Luigi para a Ana aparece como despesa no extrato do Luigi e como receita no extrato da Ana, inflando agregados brutos do dashboard mesmo sendo líquido zero.

## Escopo
- Novo `tipo: 'transferencia_interna'` aplicável a Despesa e Receita
- Helper `isMovimentacaoReal(d)` em `utils/helpers.js`
- Migração de todos os filtros `tipo !== 'projecao'` para o novo helper (dashboard, despesas, receitas, orçamentos, planejamento, fluxo de caixa)
- Detector automático `utils/detectorTransferenciaInterna.js` no pipeline bancário:
  - Regex de descritivo (PIX/TED enviado/recebido)
  - Match por nome de membro do grupo
  - Emparelhamento cruzado via `contrapartidaId`
  - `statusReconciliacao: 'auto' | 'manual' | 'pendente_contraparte'`
- Batch `reconciliarTransferenciasPendentes(grupoId)` para completar pares retroativamente
- Ação manual "🔁 Marcar como transferência interna" em despesas.html e receitas.html
- Hint opcional `mesFaturaRelacionado` (etiqueta visual, não é reconciliação oficial)
- Badge visual "🔁 Transferência interna" no extrato

## Critérios de Aceitação
- [ ] Novo tipo `'transferencia_interna'` é aceito por Despesa e Receita
- [ ] Helper `isMovimentacaoReal` é usado em todos os agregados
- [ ] Dashboard não soma transferências internas em "gastos" nem "receita" do mês
- [ ] Detector identifica PIX Luigi → Ana automaticamente
- [ ] Match com contraparte cria `contrapartidaId` cruzado quando ambos os extratos estão no banco
- [ ] Transferência sem par fica como `'pendente_contraparte'`
- [ ] Batch `reconciliarTransferenciasPendentes` completa pares retroativamente
- [ ] Ação manual permite marcar despesa/receita existente como transferência interna
- [ ] Badge visual aparece no extrato
- [ ] `npm test` verde

## Dependências
- Nenhuma (pode rodar em paralelo com #MF-062)

## Bloqueia
- #MF-064

## Subagentes obrigatórios no PR
- test-runner
- import-pipeline-reviewer (mexida em `pipelineBanco.js`)
- security-reviewer (nova UI com escHTML)

## Referência
- `docs/REQUISITOS_FUNCIONAIS.md` — seção "RF-063: Transferências Intra-Grupo"
```

---

## Issue #MF-064 — RF-064: Reconciliação de Pagamento de Fatura de Cartão

**Title:**
```
feat(fatura): RF-064 — Reconciliação de Pagamento de Fatura
```

**Body:**
```markdown
## Resumo
Introduz o tipo `'pagamento_fatura'` ligando a linha de débito no extrato bancário (PAG FATURA na conta pagadora) à fatura de cartão que ela liquida. Completa a modelagem da cadeia real Luigi → Ana → Cartão e elimina o double count entre compras da fatura e pagamento no extrato.

## Contexto
Ver seção "Contexto: Cadeia Real de Pagamento de Fatura" em `docs/REQUISITOS_FUNCIONAIS.md`. Hoje, uma fatura de R$ 3.500 com 40 compras + o PAG FATURA de R$ 3.500 no extrato são contados como R$ 7.000 de gastos. RF-064 resolve o double count na etapa 2 da cadeia (#MF-063 resolve a etapa 1).

## Escopo
- Novo `tipo: 'pagamento_fatura'` em despesas
- Atualizar helper `isMovimentacaoReal` (criado em #MF-063) para excluir `'pagamento_fatura'`
- Novo módulo `utils/reconciliadorFatura.js` com heurísticas:
  - Regex de descritivo (PAG FATURA)
  - Match por valor = total líquido do ciclo (`soma(despesas where mesFatura=X and contaCartaoId=Y and tipo='despesa') - soma(estornos)`)
  - Janela temporal ±5 dias úteis do `diaVencimento`
  - Match com `contaPagadoraId` do cartão
  - Score 0–100 → auto (≥90 e único) | pendente (60–89 ou múltiplos) | ignorado (<60)
- Novo passo `detectarPagamentoFatura()` em `pipelineBanco.js` **após** o detector de transferências internas (ordem importa)
- Nova aba "🔗 Reconciliação" em `fatura.html` com 4 seções:
  - Ciclos abertos
  - Ciclos fechados não pagos (alerta)
  - Ciclos pagos
  - Pagamentos pendentes
- Ações: Linkar / Ignorar / Desvincular / Registrar Manual
- Batch `reconciliarPagamentosPendentes(grupoId, diasAtras=90)` para reavaliar após import retroativo

## Critérios de Aceitação
- [ ] Novo tipo `'pagamento_fatura'` aceito pelo modelo Despesa
- [ ] Dashboard não soma `'pagamento_fatura'` em "gastos do mês"
- [ ] Pipeline detecta candidato por regex + valor + janela temporal + conta destino
- [ ] Auto-reconciliação silenciosa quando score ≥ 90 e candidato único
- [ ] Múltiplos candidatos → `'pendente'` para decisão manual
- [ ] Pagamento parcial detectado e marcado como `'parcial'`
- [ ] UI lista ciclos abertos/fechados/pagos/pendentes corretamente
- [ ] Ações Linkar/Ignorar/Desvincular/Registrar Manual funcionam
- [ ] Batch reavalia pendentes após import retroativo
- [ ] Linhas `'pagamento_fatura'` aparecem no extrato com badge visual
- [ ] Fatura mostra "ciclo liquidado em DD/MM/AAAA pelo débito X"
- [ ] **Cadeia Luigi → Ana → Cartão end-to-end nos testes de integração:**
  - Import do extrato do Luigi → PIX Ana vira `'transferencia_interna'`
  - Import do extrato da Ana → PIX recebido emparelha; PAG FATURA vira `'pagamento_fatura'`
  - Dashboard mostra R$ 3.500 (valor real), não R$ 8.750
- [ ] Cobertura ≥ 85% em `reconciliadorFatura.js`
- [ ] `npm test` verde

## Dependências
- #MF-062 (cartões como contas individuais)
- #MF-063 (helper `isMovimentacaoReal` + ordem de detecção no pipeline)

## Subagentes obrigatórios no PR
- test-runner
- import-pipeline-reviewer (alto risco BUG-021/022/026)
- security-reviewer (nova UI com escHTML)

## Referência
- `docs/REQUISITOS_FUNCIONAIS.md` — seção "RF-064: Reconciliação de Pagamento de Fatura de Cartão"
```

---

## Comando via gh CLI (terminal local)

```bash
cd C:\Dev\minhas-financas
gh auth status  # confirme que está autenticado

# Abrir #MF-062 e #MF-063 em paralelo (copie title/body manualmente da UI,
# ou use --body-file apontando para um trecho salvo em /tmp)

gh issue create \
  --title "feat(contas): RF-062 — Cartões de Crédito como Contas Individuais" \
  --label "feat,alta-prioridade"

gh issue create \
  --title "feat(despesas): RF-063 — Transferências Intra-Grupo (Luigi ↔ Ana)" \
  --label "feat,alta-prioridade"

# Abrir #MF-064 por último, substituindo os números reais das issues criadas acima
gh issue create \
  --title "feat(fatura): RF-064 — Reconciliação de Pagamento de Fatura" \
  --label "feat,alta-prioridade"
```

> Depois de criar as issues, atualize as referências cruzadas: o body de #MF-064 menciona `#MF-062` e `#MF-063`, mas os números reais podem ser diferentes (ex.: `#97`, `#98`, `#99`). Edite os bodies para refletir os números reais atribuídos.
