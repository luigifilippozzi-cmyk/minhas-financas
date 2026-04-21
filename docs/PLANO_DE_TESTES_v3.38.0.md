# Relatório de Prontidão & Plano de Testes — v3.38.0

> **Emitido por:** PO Assistant (Cowork) — sessão 2026-04-20
> **Escopo:** Regressão end-to-end (15 páginas) + NRF-NAV Fases 1/2/3 + ENH-004/005 + RF-070 (DS)
> **Profundidade:** Smoke + Críticos (~36 TCs)
> **Entregável complementar:** `docs/PLANO_DE_TESTES_v3.38.0.xlsx` (checklist executável)

---

## 1. Sumário Executivo

A solução está em estado **verde para release** na versão **v3.38.0**. O milestone *UX & Gestão Patrimonial* foi fechado em 100% (15/15), 727 testes unitários + 26 de integração passam no CI, não há PRs pendentes nem violações das 13 Regras Invioláveis. A recomendação é executar um ciclo de **UAT guiado pelo checklist anexo antes do próximo incremento** (ENH-002 / ENH-004 do backlog §9 ou retomada do iOS), com foco especial na navegação reorganizada em 5 seções (Cockpit / Histórico / Transações / Futuro / Config) e na simplificação de `despesas.html`, por serem as áreas de maior impacto perceptual para Luigi e Ana.

Três áreas concentram 80% do risco residual: (1) **deep-links e quebra de memória muscular** após a reorganização da navbar, (2) **migração de tokens de Design System** em pontos que ainda podem ter cores pré-rebrand vestigiais e (3) **pipeline de importação**, que continua sendo a fronteira crítica onde as regras de `chave_dedup` e `mesFatura` operam — e é o único fluxo com dependência de arquivos reais dos bancos, portanto fora do alcance da suite unitária.

## 2. Mudanças Relevantes (baseline v3.35 → v3.38)

| Versão | Entregável | PR | Impacto em testes |
|---|---|---|---|
| v3.36.0 | **ENH-004** — progressive disclosure (1 badge + toggle ▾) em `despesas.js` | #185 | Muda listagem de despesas — afeta filtro, edição e perceção visual |
| v3.37.0 | **NRF-NAV Fase 2** — extração de `projecoesCartao.js`, seção Cockpit, nova âncora `fluxo-caixa.html#compromissos` | #187 | Cross-page: fatura → fluxo-caixa; `nav.js` sectionMap reescrito |
| v3.38.0 | **NRF-NAV Fase 3 (Opção B) + ENH-005** — header de despesas reduzido a Total+Contagem, remoção do widget Parcelamentos, DS tokens em `fluxo-caixa.html` e `components.css`, XSS hardening em `despesas.js` | #190 | Superfície visual da tela mais impactada pela versão atual |
| v3.38.0 | Tech debt — 29 testes para `pipelineBanco.js` (parsearLinhasPDF, classificarBanco) | #191 | Cobertura sobe para 727 testes; pipeline bancário agora tem rede de segurança |

**Nota arquitetural:** a Fase 2 introduziu um padrão novo — *módulo utilitário reutilizável com duas modalidades de consumo* (listener em tempo real + one-shot agregado). `projecoesCartao.js` deve ser verificado em ambos os modos de uso (`fatura.js` usa o modo listener; `fluxo-caixa.js` usa o modo agregado).

## 3. Revisão Arquitetural (estado atual)

A solução mantém o padrão MPA vanilla com 15 páginas HTML independentes e orquestração por página em `src/js/pages/`. Os pontos arquiteturais relevantes para o plano de testes:

**Ponto único de escrita Firestore.** Todas as operações de CRUD passam por `src/js/services/database.js`, o que concentra a aplicação das regras `grupoId`, `chave_dedup`, `mesFatura`. Qualquer teste que valide a inviolabilidade dessas regras deve exercitar caminhos que encostem em `database.js` — seja via UI (criar despesa manual, editar), seja via pipeline (importar arquivo).

**Pipeline de importação isolado.** `detectorOrigemArquivo → normalizadorTransacoes → deduplicador → ajusteDetector → pipelineBanco/pipelineCartao` é um fluxo linear que opera fora do `database.js` até a etapa final. Falhas neste pipeline não quebram o app; elas quebram *silenciosamente* a integridade dos dados. É a área mais sensível para UAT com arquivos reais.

**Real-time via onSnapshot.** Todas as páginas com listagem (despesas, receitas, fatura, fluxo-caixa, planejamento, patrimonio, dashboard) usam `onSnapshot` para sincronização. Isso significa que, se Luigi alterar um registro num tab aberto em Despesas, a view de Fluxo de Caixa num outro tab deve atualizar sem refresh — teste de sincronia é legítimo.

**Navegação.** `nav.js` lê o pathname, resolve a seção via `sectionMap`, abre o `<details>` correspondente e marca o sub-item ativo. Deep-links com querystring (`fatura.html?tab=projecoes`) têm tratamento especial para abrir seção Futuro em vez de Transações. Esse é um ponto de fragilidade conhecido que precisa ser testado explicitamente.

## 4. Revisão UX/UI

A hierarquia de informação mudou substancialmente entre v3.32 e v3.38. A navbar agora tem 5 seções semânticas (Cockpit, Histórico, Transações, Futuro, Config) em vez de uma lista plana. A tela de Despesas foi deliberadamente reduzida a CRUD operacional — KPIs de portador, compartilhadas, Meu Bolso e parcelamentos foram movidos para o Cockpit (Dashboard + Planejamento) ou para a seção Futuro (Compromissos). A tela Fatura → Projeções ganhou um link sutil para o consolidado em Fluxo de Caixa.

Para o plano de testes, três consequências práticas. Primeira: a UAT precisa validar que Luigi e Ana conseguem encontrar as informações removidas de Despesas *sem consultar o PO* — se houver fricção, é um sinal de que falta um hint contextual na transição. Segunda: os tokens do Design System foram refinados em v3.38 (substituição de hex hardcoded em `fluxo-caixa.html` e do shadow de `btn-danger`) — inspeção visual é necessária porque nem todo desalinho produz teste automático. Terceira: o progressive disclosure da listagem de despesas (ENH-004) usa `<details>` nativo do HTML sem JS extra — comportamento em iOS Safari e em teclado (Tab + Enter) deve ser verificado.

## 5. Cobertura Atual de Testes

**Unitários (Vitest):** 727 testes distribuídos em 31 arquivos. Cobrem os utilitários críticos: `normalizadorTransacoes`, `deduplicador`, `ajusteDetector`, `reconciliadorFatura`, `detectorTransferenciaInterna`, `bankFingerprintMap`, `detectorOrigemArquivo`, `recurringDetector`, `pdfParser`, `forecastEngine`, `saldoRealPorConta`, `burnRateCalculator`, `chartColors`, `projecoesCartao`, `pipelineBanco`, além dos models (`Investimento`, `PassivoExtrajudicial`, `patrimonio`). O que está *ausente* da suite unitária: as páginas DOM-only (`categorias.js`, `contas.js`, `fatura.js`, `fluxo-caixa.js`, `grupo.js`, `index.js`, `orcamentos.js`, `planejamento.js`, `receitas.js`, `despesas.js`). Essas são exatamente as páginas que a UAT precisa cobrir com testes manuais.

**Integração (Firebase Emulator):** 26 testes cobrindo regras de segurança Firestore, CRUD de despesas e operações em lote. Rodam via `npm run test:integration` e requerem emulador ativo na porta 8080.

**Gap identificado:** não há teste end-to-end (Cypress/Playwright). Todo o fluxo cross-page — por exemplo, criar despesa em Despesas, verificar que aparece em Fluxo de Caixa, ver que afeta o Dashboard — depende de UAT manual. Este gap é deliberado (projeto solo, casal usuário) mas impõe rigor ao checklist.

## 6. Prontidão por Módulo

| Módulo | Páginas | Últ. alteração | Cobertura | Prontidão | Observação |
|---|---|---|---|---|---|
| Auth | `login.html`, `index.html` | v3.17.0 | Unit ✓ Integ ✓ | 🟢 Alta | Estável; baixo risco |
| Navegação | `nav.js` (em todos os HTMLs) | v3.37.0 | – | 🟡 Média | Mudança estrutural recente; deep-links merecem atenção |
| Cockpit — Dashboard | `dashboard.html` | v3.36.0 | Unit parcial | 🟢 Alta | Forecast, saldoReal, burnRate cobertos |
| Cockpit — Planejamento | `planejamento.html` | v3.37.0 | – | 🟡 Média | Migrado para dentro do Cockpit |
| Transações — Despesas | `despesas.html/js` | v3.38.0 | – | 🟡 Média | Maior refatoração visual desta série |
| Transações — Receitas | `receitas.html/js` | v3.20.0 | – | 🟢 Alta | Sem mudanças recentes |
| Transações — Fatura | `fatura.html/js` | v3.37.0 | Unit parcial | 🟡 Média | projecoesCartao extraído; testar ambos modos |
| Transações — Importar | `importar.html/js`, pipeline | v3.32.0 | Unit ✓ | 🟠 Alta-risco | Pipeline precisa de arquivo real para UAT |
| Transações — Base | `base-dados.html/js` | v3.25.0 | – | 🟢 Alta | Sem mudanças recentes |
| Futuro — Fluxo de Caixa | `fluxo-caixa.html/js` | v3.37.0 + v3.38.0 | Unit parcial | 🟡 Média | Nova seção Compromissos + tokens DS |
| Histórico — Patrimônio | `patrimonio.html/js` | v3.31.0 | Unit ✓ | 🟢 Alta | Investimento + PassivoExtrajudicial cobertos |
| Config — Orçamentos | `orcamentos.html/js` | v3.14.0 | – | 🟢 Alta | Sem mudanças recentes |
| Config — Categorias | `categorias.html/js` | v3.10.0 | – | 🟢 Alta | Sem mudanças recentes |
| Config — Contas | `contas.html/js` | v3.21.0 | – | 🟢 Alta | Seed padrão estável |
| Config — Grupo | `grupo.html/js` | v3.18.0 | Integ ✓ | 🟢 Alta | Regras Firestore cobertas |

Legenda: 🟢 baixo risco, 🟡 risco médio (mudou recentemente), 🟠 alto risco (área sem cobertura automatizada suficiente).

## 7. Riscos e Gaps

**Risco 1 — Quebra de memória muscular.** Luigi e Ana formaram hábitos com a navbar plana anterior. A reorganização em 5 seções e o deslocamento de KPIs para o Cockpit podem gerar fricção não medida. *Mitigação:* incluir na UAT um TC de "tarefas cronometradas" — Luigi deve conseguir completar 5 tarefas (ver fatura atual, ver saldo real, criar despesa, ver projeção de mês futuro, abrir planejamento) em menos de 45 segundos sem guia.

**Risco 2 — Cores pré-rebrand vestigiais.** O PR #190 corrigiu `fluxo-caixa.html` e `components.css`, mas o sweep não é exaustivo. *Mitigação:* TC-DS-01 faz busca textual por hex hardcoded; se encontrar, abrir BUG-033.

**Risco 3 — mesFatura em pipeline de importação.** BUG-021/022/026/032 são recorrências deste mesmo vetor. *Mitigação:* sempre que UAT importar arquivo de cartão, TC-IMP-02 exige validar `mesFatura` em linhas duplicadas atualizadas.

**Risco 4 — Deep-links legados.** URLs salvas em favoritos antes da Fase 2 (por exemplo, `despesas.html` para ver parcelamentos) agora levam a uma tela "limpa" sem o widget esperado. *Mitigação:* decisão PO pendente — criar redirect ou banner de migração? Registrar como ENH-006 se confirmar atrito.

**Gap 1 — Ausência de E2E automatizado.** Cross-page flows dependem 100% de UAT. Recomendação para backlog: avaliar Playwright com 3-5 happy paths.

**Gap 2 — Suite não cobre pages DOM.** 10 das 15 páginas não têm teste unitário. É uma decisão consciente (ROI baixo) mas significa que o checklist UAT é o *único* safety net para regressões de UX.

**Gap 3 — iOS Fase 2 ON HOLD.** Testes em dispositivo real estão pausados. Quando o Apple Developer Program for ativado, adicionar ciclo de UAT específico para iOS (Safe areas, teclado, biometria, dark mode).

## 8. Estratégia de Execução

**Ambiente:** localhost (`npm run dev` + Vite HMR) contra Firestore em produção (mais próximo do uso real) ou contra emulador (`npm run emulate`) para cenários destrutivos (dedup, criar-deletar em massa). Recomendo abrir duas abas — uma "Luigi" e outra "Ana" — para validar sincronização em tempo real.

**Papéis.** Luigi executa o checklist técnico (TCs marcados como Crítico + Smoke). Ana executa um subconjunto de UX (se disponível) para captar fricção de usabilidade que o dono do código não percebe por viés. Caso Ana não participe, o PO assume os dois papéis em momentos separados, com ao menos 1 hora de pausa entre eles para reduzir o mesmo viés.

**Ordem sugerida.** Smoke primeiro (auth + navegação, TCs *AUTH-01..02, NAV-01..03*), seguido pelos fluxos críticos recentes (*DESP, FAT, FLUXO, DS*), depois CRUD estável (*REC, BASE, CAT, CONTA, ORC, PAT, GRUPO*), finalizando com invioláveis (*REG-01..03*). Em caso de falha, interromper e abrir bug antes de prosseguir — falhas em invioláveis são bloqueantes de release.

**Critérios de pronto (release v3.38.0 "assinado pelo PO"):**

- 36/36 TCs com status PASS ou N/A justificado
- Zero falhas em TCs de prioridade P0
- Suite automatizada continua verde (`npm test` + `npm run test:integration`)
- CHANGELOG.md reflete o que foi testado
- `project_mf_status.md` atualizado com resumo da sessão de UAT

## 9. Próximos Passos Recomendados

Após a execução do checklist, se tudo estiver verde, a recomendação é avançar para **ENH-004** ou **ENH-002** (§9 da Bússola — ambos P3 "polish operacional") enquanto o iOS Fase 2 permanece ON HOLD. Se a UAT encontrar fricção significativa em alguma das áreas amarelas da tabela §6 (navegação ou despesas), sugerir registrar como ENH-006 e priorizar acima de ENH-004/002. Em qualquer cenário, vale rodar esta mesma bateria após cada nova release MINOR; o custo é baixo (~2h) e o ganho de confiança é alto dado o gap de E2E automatizado.

---

**Anexo:** `docs/PLANO_DE_TESTES_v3.38.0.xlsx` — 36 casos de teste numerados, rastreáveis por módulo e prioridade, prontos para execução em sessão única de UAT.
