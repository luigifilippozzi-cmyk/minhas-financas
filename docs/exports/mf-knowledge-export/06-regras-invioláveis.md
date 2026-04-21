# 06 — Regras Invioláveis — Contrato entre PO, DM e Subagentes

> As **Regras Invioláveis** são o contrato técnico do squad. Toda regra é uma frase imperativa + classificação **BLOQUEANTE** ou **ALERTA** + referência ao porquê. Vivem no `CLAUDE.md` (raiz do projeto) e são consultadas pelo DM antes de cada PR.

---

## 🟢 Por que existem

Sem regras invioláveis, o DM (e o PO em revisão) precisa lembrar caso-a-caso o que pode quebrar. Resultado: regressões silenciosas. Com regras invioláveis:

- **DM** sabe o que NÃO pode fazer mesmo sob pressão de prazo
- **Subagentes** têm critérios objetivos para bloquear ou aprovar
- **PO** revisa PR contra uma checklist conhecida
- **Onboarding de novo agente** é uma leitura só

---

## 🟢 Anatomia de uma Regra Inviolável

```
N. <Frase imperativa do que NÃO fazer>
   → BLOQUEANTE | ALERTA
   Razão: <breve histórico — bug que originou, princípio quebrado>
   Validação: <como o subagente detecta>
   Subagente responsável: <test-runner | security-reviewer | ux-reviewer | ...>
```

**Diferença crítica:**
- **BLOQUEANTE** — DM **não abre merge**. PR fica parado até correção.
- **ALERTA** — DM marca no PR, PO decide se merge mesmo assim.

---

## 🔵 Exemplo MF — As 14 Regras Invioláveis (estado em 2026-04-21)

> Estas são as regras vigentes no MF. Servem como **catálogo de exemplo** — outros projetos terão suas próprias regras conforme dores aparecerem.

### Regras de Integridade de Dados

**1.** `chave_dedup` foi alterada → ❌ BLOQUEANTE (quebra deduplicação histórica)
- Razão: dedup de imports usa esta chave; mudar formato apaga linhas históricas
- Validação: diff toca `normalizadorTransacoes.js`, `deduplicador.js` ou string template `chave_dedup`
- Subagente: `import-pipeline-reviewer`

**2.** `mesFatura` não propagado em despesa de cartão → ❌ BLOQUEANTE
- Razão: BUG-021/022/026/032 — fatura "some" se não tem mesFatura
- Validação: import de cartão sem `mesFatura: 'YYYY-MM'` em todas as linhas do lote
- Subagente: `import-pipeline-reviewer`

**3.** `isMovimentacaoReal()` não usado em agregado que filtra projeções → ❌ BLOQUEANTE
- Razão: RF-063 — projeções entram no saldo se não filtradas
- Validação: queries `where('tipo', '==', 'despesa')` sem helper
- Subagente: `import-pipeline-reviewer` ou revisão manual

### Regras de Identidade Visual

**4.** Cores hardcoded no CSS (não usa tokens de `variables.css`) → ❌ BLOQUEANTE
- Razão: PV4 — tokens são única fonte; quebra dark mode
- Validação: `git grep "#[0-9a-fA-F]{6}"` em `src/css/` fora de `variables.css`
- Subagente: `ux-reviewer`

**13.** Task de UI sem consultar `docs/DESIGN_SYSTEM.md` / tokens → ⚠️ ALERTA
- Razão: RF-070 — DS é referência canônica
- Validação: PR de UI sem menção ao DS no body
- Subagente: `ux-reviewer`

**14.** PR que toca `src/**/*.html`, `src/css/**/*.css` ou templates inline (`src/js/pages/*.js` com `innerHTML`) sem relatório do `ux-reviewer` anexado → ❌ BLOQUEANTE
- Razão: PUX1–PUX6 só são auditados se `ux-reviewer` é invocado
- Validação: PR front-end sem comentário "## UX Review — PR #N" no DM log
- Subagente: o próprio `ux-reviewer`

### Regras de Stack e Build

**5.** Firebase importado via CDN `gstatic.com` (não npm) → ❌ BLOQUEANTE
- Razão: NRF-iOS — Capacitor exige bundling npm
- Validação: `git grep "gstatic"` em `src/js/`
- Subagente: revisão manual ou regex no CI

### Regras de Multi-Tenant / Segurança

**6.** `grupoId` ausente em query Firestore → ❌ BLOQUEANTE
- Razão: dados vazam entre grupos (Luigi vê dados de Ana sem permissão)
- Validação: `query(collection(...), where('grupoId', '==', ...))` deve estar presente
- Subagente: `security-reviewer`

**7.** `innerHTML` sem `escHTML()` em dados do usuário → ❌ BLOQUEANTE (XSS)
- Razão: PRs #176, #181 corrigiram XSS — não pode reincidir
- Validação: `git grep "innerHTML"` cruzado com ausência de `escHTML(`
- Subagente: `security-reviewer`

### Regras de Modelo de Dados

**8.** Documento de `parcelamentos` deletado (deve ser `status: 'quitado'`) → ❌ BLOQUEANTE
- Razão: histórico de parcelamento é auditável; deleção quebra reconciliação
- Validação: `deleteDoc(...)` em coleção `parcelamentos`
- Subagente: `security-reviewer` ou revisão manual

**9.** `deleteDoc` em lote sem `writeBatch` → ❌ BLOQUEANTE
- Razão: regras Firestore exigem batch atomicidade
- Validação: loop sobre array com `deleteDoc` solto
- Subagente: `security-reviewer`

**10.** `categoriaId` salvo como string sentinela `__tipo__*` → ❌ BLOQUEANTE
- Razão: BUG-031 — sentinelas eram silenciosamente quebradas em queries
- Validação: regex `__tipo__` em código de salvamento
- Subagente: `import-pipeline-reviewer`

### Regras de Processo

**11.** Commit sem Conventional Commits com escopo (`feat(escopo):`, `fix(escopo):`) → ⚠️ ALERTA
- Razão: changelog automático depende do formato
- Validação: lint de mensagem de commit no CI

**12.** Alteração em `src/js/` ou `src/css/` sem feature branch + PR → ⚠️ ALERTA
- Razão: rastreabilidade — direto na main não passa por `ux-reviewer`
- Validação: push direto na `main` tocando esses paths

---

## 🟢 Como criar a regra para o seu projeto

### Critério para nova regra inviolável

Crie uma regra inviolável quando todas forem verdadeiras:

1. **Já mordeu** — bug, incidente, regressão real (não suposição)
2. **Detecção é objetiva** — pode virar regex, grep ou checklist
3. **Custo do não-cumprir é alto** — perda de dados, quebra de UX, segurança
4. **Possível de validar antes do merge** — não só em produção

### Anti-pattern: regras invioláveis genéricas

❌ "Código deve ser limpo" — não é validável
❌ "Performance deve ser boa" — sem critério
❌ "Sempre testar" — already o padrão; não precisa ser inviolável

### Pattern: regras invioláveis específicas

✅ "Coverage de `import/` < 80% → BLOQUEANTE"
✅ "Query sem índice composto declarado em `firestore.indexes.json` → BLOQUEANTE"
✅ "Componente sem `data-testid` em PR de feature nova → ALERTA"

---

## 🟢 Onde declarar regras invioláveis

### Estrutura recomendada

```
CLAUDE.md
├── Identidade do Projeto
├── Comandos Essenciais
├── ...
└── REGRAS INVIOLÁVEIS  ← seção dedicada, numerada
    1. ...
    2. ...
    ...
```

E o prompt de cada subagente referencia explicitamente as regras pelas quais é responsável (ver arquivo 02 — exemplo do `ux-reviewer` responsável pela #14).

---

## 🟢 Como o DM aplica as regras

Antes de abrir PR, o DM:

1. Roda `test-runner` (regra implícita — todo PR)
2. Para cada arquivo no diff, identifica regras aplicáveis
3. Invoca subagentes correspondentes
4. Compila relatórios
5. **Se algum BLOQUEANTE foi violado** → corrige antes de abrir PR
6. **Se algum ALERTA** → marca no body do PR
7. Anexa relatórios dos subagentes ao PR
8. Notifica PO

---

## 🟢 Como o PO usa as regras na revisão

PO ao revisar PR:

1. Lê o body do PR
2. Confere que `ux-reviewer`, `security-reviewer` etc. produziram relatório quando aplicável
3. Procura ALERTAS marcados — decide se merge mesmo assim
4. Se nenhum BLOQUEANTE pendente → aprova

> Sem as regras, esta revisão é "olho vivo do PO" — escala mal e gera viés.

---

## ⚠️ Anti-patterns observados no MF

- **Regra criada e esquecida** — sem subagente vinculado, vira folclore. Toda regra deve ter "subagente responsável".
- **Regra de gosto pessoal** — "componentes devem ter no máximo 200 linhas" sem origem em incidente. Inviolável é para o que já doeu.
- **Regra que ninguém entende** — sem "Razão" + exemplo, agente novo não aplica. Documente o porquê.
- **20+ regras** — checklist longo demais vira ritual ignorado. MF está em 14 — limite operacional.

---

## 📌 Histórico das regras do MF

| Regra | Origem | Versão squad |
|---|---|---|
| #1 (chave_dedup) | Bug original de dedup quebrada (v1) | 1.0 |
| #2 (mesFatura) | BUG-021 (fatura sumiu de v3.x) | 2.0 |
| #4 (cores hardcoded) | NRF-UI-WARM, refactor doloroso | 2.5 |
| #6 (grupoId) | Auditoria de segurança em #100 | 2.5 |
| #7 (escHTML/XSS) | PR #176 + #181 (XSS encontrado) | 2.5 |
| #10 (categoriaId sentinela) | BUG-031 (queries silenciosamente vazias) | 3.0 |
| #14 (ux-reviewer obrigatório) | Sessão PO 2026-04-21 (NRF-UX umbrella) | 4.0 |

---

## Referências cruzadas

- **02-subagente-ux-reviewer.md** — exemplo completo de regra (#14) amarrada a subagente
- **01-governanca-squad.md** — onde subagentes encaixam no fluxo
- **07-workflow-git-e-powershell.md** — comandos para validar regras (`gh pr diff | Select-String "innerHTML"`)
