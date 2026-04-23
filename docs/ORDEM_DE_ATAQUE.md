# Ordem de Ataque — Minhas Finanças

> Arquivo extraído da BUSSOLA_PRODUTO.md §9 em 2026-04-22.
> Propósito: manter separadamente a sequência operacional de entrega. BUSSOLA é reflexão estratégica estável; Ordem de Ataque muda a cada sessão PO.
> Fonte da verdade de priorização macro. Qualquer discrepância entre este arquivo e o backlog GitHub resolve-se por este arquivo.

> Atualizada em: 2026-04-23 (pós-v3.39.8, Proposta C concluída 100% ✅)

---

## Concluídos (até v3.39.8)

1. RF-067 Forecast 6 meses (v3.28.0, PR #168)
2. RF-068 Saldo Real por Conta (v3.29.0, PR #174)
3. RF-069 Burn Rate por Categoria (v3.30.0, commit 0ee3e18)
4. RF-066 Patrimônio Ativos/Passivos (v3.31.0, PR #178)
5. NRF-NAV F1 — Navbar 5 seções (v3.33.0, PR #180)
6. NRF-NAV F2 — projecoesCartao unificado (v3.37.0, PR #187)
7. NRF-NAV F3 — Simplificar despesas.html + ENH-005 tokens (v3.38.0, PR #190)
8. NRF-UX F1 — Visual foundation: hero tokens + dark cards (v3.39.0, PR #193)
9. NRF-UX F2 — Fraunces + ux-reviewer + Regra Inviolável #14 (v3.39.1, PR #201)
10. NRF-UX F3 — Remover emojis de chrome (v3.39.2, PR #202)
11. NRF-UX F4 — Unificar iconografia Lucide (v3.39.3, PR #203)
12. NRF-UX F5 — Skeletons e estados de loading (v3.39.4, PR #204)
13. NRF-UX F6 — Espaçamento e ritmo vertical (v3.39.5, PR #205)
14. NRF-UX F7 — Chart.js tokens + tabular-nums (v3.39.6, PR #206)
15. NRF-UX F8 — Microcopy e vocabulário (v3.39.7, PR #208)
16. Tech Debt — testes de controllers (v3.39.8, PR #209, +88 testes → 844 total)

## Concluídos — Proposta C (Higiene Estratégica) ✅

17. C5 — Remover §10 mobile.html da BUSSOLA (commit cb6717a) ✅
18. C1 — Sincronizar CLAUDE.md (commit cb6717a) ✅
19. C6 — Sincronizar memória PO (commit cb6717a) ✅
20. C2 — Refactor BUSSOLA (HISTORICO_DE_GAPS.md + ORDEM_DE_ATAQUE.md, commit fc61ce6) ✅
21. C4 — Varrer `alert(` e "Erro ao" — N/A: 0 ocorrências de `alert()` em src/ (2026-04-23 — DM) ✅
22. C3 — Regenerar PLANO_DE_TESTES_v3.39.8.xlsx + UAT (commit 750e297, 85 TCs) ✅

## Em execução — Polimento Visual v3.40.0 (decisão PO 2026-04-23)

> Milestone consolidado decidido após Proposta C. 3 PRs sequenciais, release MINOR ao final.
> Artefatos DM completos em `.auto-memory/dm_tasks_pending.md` (seção `[2026-04-23] Polimento Visual v3.40.0`).
> Handoff histórico em `.auto-memory/handoffs/handoff_dm_polimento_visual_v3400_2026-04-23.md`.
> **Ordem estrita: V3 → V2 → V1** (mais isolado → mais amplo). Bump de versão e CHANGELOG consolidado no PR 3.

23. V3 — ENH-007 Empty states em fatura.html e fluxo-caixa.html — **PR 1, sem bump**
24. V2 — RF-071 Chart.js series color tokens — **PR 2, sem bump**
25. V1 — ENH-006 Cockpit density mobile <414px — **PR 3, bump v3.40.0 + CHANGELOG consolidado**

## Candidatos ao milestone seguinte (após v3.40.0)

26. Alternativa A — Decisão Assistida (RF-072/073 — alertas inteligentes, cenários what-if)
27. Alternativa B — iOS Fase 2 (se Apple Dev Program ativar)

## ON HOLD

28. iOS App F2–F5 — aguarda Apple Developer Program

---

## Regras

- Cada fase NRF-UX ou Polimento Visual é um PR independente com relatório do `ux-reviewer` anexado (Regra Inviolável #14 do `CLAUDE.md`)
- Progresso rastreado no milestone GitHub ("Polimento Visual v3.40.0" a ser criado pelo DM antes do PR 1)
- Alteração nesta ordem requer sessão PO formal e registro em BUSSOLA §11
- Itens 26–27 permanecem como candidatos até PO escolher próximo milestone após Polimento Visual concluir
- Após merge dos 3 PRs do Polimento Visual: PO expande `docs/PLANO_DE_TESTES_v3.39.8.xlsx` → `v3.40.0.xlsx` e executa UAT

---

*Este arquivo é atualizado a cada sessão PO que altere priorização. Revisão recomendada: pelo menos 1x/sprint.*
