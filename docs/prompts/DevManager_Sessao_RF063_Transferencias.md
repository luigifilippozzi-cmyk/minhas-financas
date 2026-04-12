# Dev Manager — Sessão de Execução: RF-063 (Transferências Intra-Grupo)

> **Tipo:** Sessão de implementação de feature
> **Issue:** #126
> **Data de criação:** 2026-04-12
> **Criado por:** Luigi (PO)
> **Prioridade:** P0

---

## Instruções de Uso

Cole o conteúdo do prompt base (`docs/MF_Prompt_DevManager_Squad.md`) no início da sessão do Dev Manager no Claude Code, seguido deste complemento abaixo.

---

## COMPLEMENTO — Tarefa de Execução: RF-063

### Objetivo

Implementar a issue **#126** — introduzir o tipo `'transferencia_interna'` para representar movimentações financeiras entre membros do mesmo grupo familiar (Luigi ↔ Ana), filtrando-as dos agregados do dashboard.

**Esta é a segunda issue da cadeia P0 (RF-062 → RF-063 → RF-064).** Pode rodar em paralelo com RF-062 (#125).

### Contexto Técnico

Ler antes de implementar:
1. `docs/REQUISITOS_FUNCIONAIS.md` — seção "RF-063: Transferências Intra-Grupo"
2. `docs/REQUISITOS_FUNCIONAIS.md` — seção "Contexto: Cadeia Real de Pagamento de Fatura"
3. `docs/ISSUES_PARA_ABRIR_MF-062_063_064.md` — body completo da issue #126
4. `src/js/utils/pipelineBanco.js` — pipeline de importação bancária atual
5. `src/js/pages/dashboard.js` — agregados de gastos/receita do mês
6. `src/js/pages/despesas.js` e `receitas.js` — listagens e filtros
7. `src/js/services/database.js` — queries Firestore

### Problema que RF-063 Resolve

Hoje, uma PIX de R$ 1.750 do Luigi para a Ana aparece como:
- **Despesa** no extrato do Luigi (inflando "gastos do mês")
- **Receita** no extrato da Ana (inflando "receita do mês")

É líquido zero entre o casal. O dashboard exibe números inflados.

### Escopo de Implementação

#### 1. Novo tipo: `'transferencia_interna'`

Aplicável a **Despesa** e **Receita**. Coexiste com os tipos existentes:
- `'despesa'` — gasto real
- `'projecao'` — parcela futura projetada
- `'projecao_paga'` — projeção reconciliada
- **`'transferencia_interna'`** — movimentação intra-grupo (NOVO)

#### 2. Helper `isMovimentacaoReal(d)` em `utils/helpers.js`

```javascript
/**
 * Retorna true se a transação representa uma movimentação financeira real
 * (exclui projeções, transferências internas e pagamentos de fatura).
 * USAR EM TODOS OS AGREGADOS do dashboard, despesas, receitas, orçamentos,
 * planejamento e fluxo de caixa.
 */
export function isMovimentacaoReal(d) {
  return d.tipo === 'despesa' || d.tipo === 'receita';
  // RF-064 adicionará exclusão de 'pagamento_fatura' aqui
}
```

**CRÍTICO**: Migrar TODOS os filtros `tipo !== 'projecao'` existentes no código para usar `isMovimentacaoReal(d)`. Buscar em:
- `src/js/pages/dashboard.js`
- `src/js/pages/despesas.js`
- `src/js/pages/receitas.js`
- `src/js/pages/orcamentos.js`
- `src/js/pages/planejamento.js`
- `src/js/controllers/` (todos)

#### 3. Detector automático: `utils/detectorTransferenciaInterna.js`

Novo módulo no pipeline bancário com heurísticas:

1. **Regex de descritivo**: detectar padrões como:
   - `PIX ENVIADO`, `PIX RECEBIDO`, `TED ENVIADA`, `TED RECEBIDA`
   - `TRANSF P/`, `TRANSF DE`
2. **Match por nome de membro**: cruzar descritivo com nomes dos membros do grupo (`Luigi`, `Ana`, sobrenomes)
3. **Emparelhamento cruzado** via `contrapartidaId`: quando ambos os extratos estão importados, linkar despesa ↔ receita correspondente
4. **Status de reconciliação**: `'auto'` | `'manual'` | `'pendente_contraparte'`

#### 4. Integração no pipeline: `pipelineBanco.js`

Adicionar passo `detectarTransferenciasInternas()` **após** o deduplicador e **antes** do ajusteDetector. Ordem importa para RF-064 depois.

#### 5. Batch retroativo: `reconciliarTransferenciasPendentes(grupoId)`

Função em `services/database.js` ou `controllers/`:
- Busca todas as transações `statusReconciliacao === 'pendente_contraparte'`
- Tenta match cruzado por data ± 1 dia, valor, nomes
- Completa pares retroativamente

#### 6. Ação manual em `despesas.html` e `receitas.html`

- Botão "Marcar como transferência interna" no menu de ações da transação
- Modal simples: confirmar membro de destino/origem
- Ao marcar, criar `contrapartidaId` cruzado se a contraparte existir

#### 7. UI visual

- Badge "Transferência interna" no extrato (com ícone de seta bidirecional)
- Hint opcional `mesFaturaRelacionado` (etiqueta visual apenas, sem reconciliação oficial)

### Padrões Críticos a Seguir

- `escHTML()` em TODA inserção de dados do usuário via innerHTML — security-reviewer obrigatório
- `grupoId` em TODAS as queries Firestore
- `chave_dedup` — NÃO alterar o formato existente
- CSS: usar tokens de `variables.css`
- Conventional Commits: `feat(despesas): ...`
- Testes: manter 231+ passando + adicionar testes para detectorTransferenciaInterna e isMovimentacaoReal

### Branch e Workflow

```bash
git checkout main && git pull origin main
git checkout -b feat/MF-126-transferencias-intra-grupo

# ... implementar ...

npm test   # TODOS devem passar

# Subagentes OBRIGATÓRIOS antes do PR:
# 1. test-runner → npm test + coverage
# 2. import-pipeline-reviewer → mexida em pipelineBanco.js
# 3. security-reviewer → nova UI com escHTML

git add <arquivos específicos>
git commit -m "feat(despesas): RF-063 — transferências intra-grupo Luigi ↔ Ana (v3.22.0)"
git push -u origin feat/MF-126-transferencias-intra-grupo
gh pr create --title "feat(despesas): RF-063 — Transferências Intra-Grupo (#126)" \
  --body "Closes #126\n\n## Resumo\nNovo tipo transferencia_interna + helper isMovimentacaoReal + detector automático PIX/TED.\n\n## Checklist\n- [ ] Testes passando\n- [ ] test-runner acionado\n- [ ] import-pipeline-reviewer acionado\n- [ ] security-reviewer acionado\n- [ ] isMovimentacaoReal usado em todos os agregados\n- [ ] escHTML em toda UI nova"
```

### Critérios de Aceitação

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

### Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Regex de PIX/TED falso-positivo | Exigir match com nome de membro do grupo (2 heurísticas) |
| Filtros `tipo !== 'projecao'` não migrados | Grep exaustivo + test-runner para regressão |
| Impacto em pipelineBanco.js (BUG-021/022/026) | import-pipeline-reviewer obrigatório |
| Dados sensíveis (nomes) em innerHTML | security-reviewer obrigatório |

### Nota sobre Versionamento

Se RF-062 (#125) for mergeado antes desta PR, o bump de versão será v3.22.0. Se esta for mergeada primeiro, será v3.21.0. Verificar `package.json` antes do commit final.
