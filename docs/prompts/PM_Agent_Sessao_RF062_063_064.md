# PM Agent — Sessão de Acompanhamento: Cadeia RF-062/063/064

> **Tipo:** Sessão de monitoramento de milestone ativo
> **Data de criação:** 2026-04-12
> **Criado por:** Luigi (PO)

---

## Instruções de Uso

Cole o conteúdo do prompt base (`docs/MF_Prompt_PMAgent_Squad.md`) no início da sessão do PM Agent no Claude Code, seguido deste complemento abaixo.

---

## COMPLEMENTO — Nova Prioridade P0: Reconciliação Fatura ↔ Extrato

### Contexto para o PM Agent

A partir de 2026-04-12, o milestone ativo do projeto mudou. Os 42 RFs anteriores estão **100% concluídos**. A nova prioridade P0 é a **cadeia de reconciliação fatura ↔ extrato**, composta por 3 issues interdependentes:

| Issue | RF | Título | Status | Depende de |
|-------|-----|--------|--------|------------|
| #125 | RF-062 | Cartões de Crédito como Contas Individuais | Aberta | — |
| #126 | RF-063 | Transferências Intra-Grupo (Luigi ↔ Ana) | Aberta | — |
| #127 | RF-064 | Reconciliação de Pagamento de Fatura | Aberta | #125 + #126 |

**Grafo de dependência:**
```
#125 (RF-062) ──┐
                 ├──→ #127 (RF-064)
#126 (RF-063) ──┘
```

#125 e #126 podem rodar em paralelo. #127 só pode iniciar após ambos serem mergeados.

### O que o PM Agent deve monitorar neste milestone

1. **Progresso das 3 issues**: branches criadas? PRs abertos? CI verde? Mergeados?
2. **Subagentes acionados nos PRs**:
   - #125: test-runner + import-pipeline-reviewer (obrigatório)
   - #126: test-runner + import-pipeline-reviewer + security-reviewer (obrigatório)
   - #127: test-runner + import-pipeline-reviewer + security-reviewer (obrigatório)
3. **Riscos específicos**:
   - `mesFatura` — qualquer alteração no pipeline de fatura pode reintroduzir BUG-021/022/026
   - `chave_dedup` — o formato não pode ser alterado
   - `isMovimentacaoReal` — helper novo que precisa ser usado em TODOS os agregados (dashboard, despesas, receitas, orçamentos, planejamento, fluxo de caixa)
   - `grupoId` — todas as novas queries devem incluir filtro
4. **Testes**: baseline é 231 unitários + 26 integração. Cada PR deve manter ou aumentar.
5. **Ordem de merge**: #125 e #126 primeiro (qualquer ordem), #127 por último.

### Atualização do Dashboard

No dashboard (`docs/mf-squad-dashboard.html`), o milestone ativo deve ser atualizado para:

```
Milestone Ativo: Reconciliação Fatura ↔ Extrato (RF-062/063/064)
Progresso: 0/3 issues (0%)
```

### Atualização da Memória Persistente

Em `.auto-memory/project_mf_status.md`, garantir que a fila de prioridades reflita:
- P0: RF-062 (#125) + RF-063 (#126) em paralelo → RF-064 (#127) após ambos
- P1: iOS Fase 2 (#77–#80)
- P2: Tech debt + iOS Fases 3–5

### Métricas adicionais para este milestone

- **Velocidade esperada**: ~1 semana por issue (RF-062 e RF-063 em paralelo)
- **Estimativa de conclusão**: ~2–3 semanas para as 3 issues
- **Critério de "done" do milestone**: Teste de integração end-to-end da cadeia Luigi → Ana → Cartão passando, com dashboard exibindo R$ 3.500 (não R$ 8.750)

### Referências

- `docs/REQUISITOS_FUNCIONAIS.md` — seções RF-062, RF-063, RF-064 + "Contexto: Cadeia Real de Pagamento de Fatura"
- `docs/ISSUES_PARA_ABRIR_MF-062_063_064.md` — bodies completos das issues com critérios de aceitação
- `.auto-memory/project_mf_status.md` — estado persistente atualizado
