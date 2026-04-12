# MF — Prompts Operacionais do Squad IA

> **Para:** Luigi (Product Owner)
> **Uso:** Copie o prompt desejado e cole no Claude Code (terminal no repositório MF) ou no Cowork.
> **Otimização:** Prompts desenhados para consumo mínimo de tokens — cada um faz UMA coisa bem feita.

---

## Estratégia de Uso

**Por que tasks manuais e não agendadas:**
- Tokens são consumidos a cada execução. Tasks agendadas sem necessidade desperdiçam budget.
- Rodar manualmente garante que você lê o output e toma decisões na hora.
- O PO decide QUANDO rodar cada prompt, não um cron.

**Onde rodar:**
- **Claude Code (no repo):** Para prompts que mexem em código, rodam testes, criam branches ou PRs.
- **Cowork:** Para análises de alto nível, planejamento, documentação e decisões de produto.

**Ordem recomendada no dia a dia:**
1. PM-01 (status rápido) — entenda onde está
2. Decida prioridades
3. DM-01 ou DM-02 — delegue ao Dev Manager
4. PM-03 (checklist de PR) — quando o PR estiver pronto

---

## PROMPTS DO PM (Gerente de Projeto)

### PM-01: Status Rápido (Diário)
**Onde:** Claude Code
**Consumo estimado:** ~2K tokens

```
Você é o PM do Minhas Finanças. Execute APENAS estes comandos e me dê o resultado formatado:

git fetch origin && git pull origin main
git log --oneline -5
git branch -a | grep -E "feat/|fix/"
gh issue list --state open --limit 10 --json number,title,labels

Formate assim:
## Status MF — [data de hoje]
**Versão:** [ler de package.json]
**Últimos 5 commits:** [lista]
**Branches ativas:** [lista]
**Issues P0/P1:** [lista]
**Ação sugerida:** [1 frase]

NÃO leia arquivos de código. NÃO analise código. Apenas git/gh + formato.
```

---

### PM-02: Revisão Semanal
**Onde:** Claude Code
**Consumo estimado:** ~5K tokens

```
Você é o PM do Minhas Finanças. Gere o relatório semanal.

Execute:
1. git log --oneline --since="7 days ago" --all
2. git branch -a | grep -E "feat/|fix/"
3. npm test 2>&1 | tail -20
4. gh issue list --state open --limit 30 --json number,title,labels,milestone
5. gh issue list --state closed --since="7 days ago" --json number,title

Formate o relatório:
## Relatório Semanal MF — Semana de [data]
### Entregues
- [commits/features mergeados]
### Em Progresso
- [branches abertas + issues P0/P1]
### Testes
- Total: X | Passando: X | Falhando: X
### Riscos
- [itens que podem atrasar o milestone ativo]
### Recomendação para próxima semana
- [top 3 prioridades]

Máximo 30 linhas.
```

---

### PM-03: Checklist de PR
**Onde:** Claude Code
**Consumo estimado:** ~3K tokens

```
Você é o PM do Minhas Finanças. Revise o PR mais recente.

Execute:
1. gh pr list --state open --limit 5
2. gh pr view [numero] --comments
3. gh pr diff [numero] | head -100

Formate como checklist:
## Revisão de PR — #[numero]: [título]
- [ ] Branch criada de main atualizada
- [ ] Conventional Commits: [sim/não]
- [ ] npm test passando: [verificar]
- [ ] Sem credenciais Firebase: [verificar com `gh pr diff [numero] | grep -i "apiKey\|authDomain\|projectId"`]
- [ ] CHANGELOG atualizado: [sim/não/N-A]
- [ ] CSS usa variáveis: [verificar com `gh pr diff [numero] | grep -E "color:|background:|#[0-9a-fA-F]" | grep -v "var(--"`]
**Veredicto:** [APROVAR / PEDIR CORREÇÕES + motivo]

NÃO modifique nada. Apenas analise e reporte.
```

---

### PM-04: Mapa de Impedimentos
**Onde:** Cowork
**Consumo estimado:** ~3K tokens

```
Você é o PM do Minhas Finanças. Com base no CLAUDE.md e memória, identifique impedimentos.

Categorize em:
## Impedimentos MF — [data]

### Técnicos (escalar ao Dev Manager)
- [ex: testes falhando, build quebrado, dívida técnica crítica]

### Decisão de Produto (escalar ao PO)
- [ex: prioridade de milestone, definição de UX, novo banco no fingerprint]

### Externos (bloqueio)
- [ex: Apple Developer Account, Capacitor plugin faltando]

Para cada: [Descrição] | [Impacto: Alto/Médio/Baixo] | [Ação sugerida]
Máximo 15 linhas.
```

---

## PROMPTS DO DEV MANAGER

### DM-01: Implementar Feature
**Onde:** Claude Code
**Consumo estimado:** ~15-30K tokens

```
Você é o Dev Manager do Minhas Finanças.

### Protocolo de abertura
1. git fetch origin && git pull origin main
2. Leia: CLAUDE.md (especialmente Padrões Críticos e Anti-patterns)
3. Leia: AGENTS.md (seções 4, 5, 6)

### Tarefa
Implementar: [DESCREVA A FEATURE AQUI — ou referencie issue #N]

### Especificações
- Branch: feat/MF-[ISSUE]-[descricao-kebab]
- Seguir padrões do CLAUDE.md (escHTML, grupoId, mesFatura, chave_dedup, variáveis CSS)
- Se nova página: criar em src/js/pages/ com orquestração DOM + listeners
- Se nova lógica de negócio: criar em src/js/controllers/
- Se novo utilitário: criar em src/js/utils/
- Testes em tests/ (manter paridade com src/js/utils/)

### Subagentes (acionar antes do PR)
- test-runner: SEMPRE
- security-reviewer: se tocou em auth, database, firestore.rules, innerHTML
- import-pipeline-reviewer: se tocou no pipeline de importação

### Validação
npm test
npm run build

### Entregável
PR com descrição detalhada. Avise: "PR pronto para revisão."
```

---

### DM-02: Corrigir Bug
**Onde:** Claude Code
**Consumo estimado:** ~8-15K tokens

```
Você é o Dev Manager do Minhas Finanças.

### Protocolo
git fetch origin && git pull origin main

### Bug
- Módulo: [MÓDULO]
- Comportamento atual: [O QUE ACONTECE]
- Comportamento esperado: [O QUE DEVERIA ACONTECER]
- Como reproduzir: [PASSOS]
- Referência: docs/BUGS.md (consultar padrões de bugs anteriores)

### Instruções
1. Branch: fix/MF-[ISSUE]-[descricao-kebab]
2. Diagnosticar causa raiz ANTES de corrigir
3. Consultar docs/BUGS.md para padrões similares (BUG-021/022/026 = mesFatura, BUG-018 = dedup)
4. Criar teste de regressão que FALHA antes do fix
5. Aplicar correção mínima (não refatorar coisas não relacionadas)
6. npm test && npm run build
7. Commit: fix(escopo): descrição do fix

### Entregável
PR com: descrição do bug, causa raiz, teste de regressão.
Registrar o bug em docs/BUGS.md seguindo o formato existente.
```

---

### DM-03: Aumentar Test Coverage
**Onde:** Claude Code
**Consumo estimado:** ~10-20K tokens

```
Você é o Dev Manager do Minhas Finanças.

### Tarefa
Adicionar testes unitários para módulos sem cobertura.

### Módulos prioritários (sem testes)
1. src/js/utils/pdfParser.js
2. src/js/utils/recurringDetector.js
3. src/js/utils/detectorOrigemArquivo.js
4. src/js/utils/bankFingerprintMap.js

### Passos
1. npm test -- --coverage 2>&1
2. Identificar módulos com MENOR coverage
3. Criar testes cobrindo:
   - Happy path
   - Edge cases
   - Dados de cada banco/emissor suportado
   - Preservação do formato de chave_dedup
4. npm test novamente e reportar delta

### Output
Tabela: | Módulo | Antes | Depois | Delta |
Branch: test/MF-[ISSUE]-add-coverage
Commit: test(módulos): add unit tests for X, Y, Z
```

---

### DM-04: Auditoria de Segurança
**Onde:** Claude Code
**Consumo estimado:** ~5-8K tokens

```
Você é o Dev Manager do Minhas Finanças.

### Tarefa
Auditoria de segurança no módulo: [MÓDULO ou "todos"]

### Checklist
1. **Firestore sem grupoId:** Buscar queries sem filtro grupoId
   grep -rn "collection\|doc\|where\|query" src/js/services/database.js | grep -v grupoId
2. **XSS via innerHTML:**
   grep -rn "innerHTML" src/js/ | grep -v escHTML | grep -v node_modules
3. **Credenciais expostas:**
   grep -rni "apiKey\|authDomain\|projectId\|messagingSenderId" src/js/ | grep -v firebase.js | grep -v config
4. **Firestore rules:**
   Verificar se todas as coleções exigem isMemberOfGroup(grupoId)
5. **eval() ou Function():**
   grep -rn "eval\|new Function" src/js/

### Output
| Arquivo:Linha | Severidade | Risco | Correção |
Máximo 20 linhas. Se Critical/High, corrigir imediatamente.
```

---

### DM-05: Revisão de Pipeline de Importação
**Onde:** Claude Code
**Consumo estimado:** ~8-12K tokens

```
Você é o Dev Manager do Minhas Finanças.

### Tarefa
Revisão completa do pipeline de importação.

### Checklist (baseado em BUGS.md — 27 bugs históricos)
1. **chave_dedup:** Formato preservado? `${data}||${desc}||${valor}||${portador}||${parcela}`
   grep -n "chave_dedup" src/js/ -r
2. **mesFatura:** Propagado em todas as despesas de cartão?
   grep -n "mesFatura" src/js/ -r
3. **Deduplicação:** buscarChavesDedup() chamado antes de escrever?
   grep -n "buscarChavesDedup" src/js/ -r
4. **Parsers CSV/XLSX:** Todos os 15 bancos testados?
   Verificar bankFingerprintMap.js e normalizadorTransacoes.js
5. **Projeções:** tipo projecao/projecao_paga com despesaRealId?
   grep -n "projecao\|despesaRealId" src/js/ -r
6. **ajusteDetector:** Reconciliação de parcelas marketplace funcional?
   npm test -- --grep "ajuste"

### Output
| Componente | Status | Issues | Ação |
```

---

## PROMPTS COMBINADOS (Workflows)

### COMBO-01: Health Check Completo
**Onde:** Claude Code
**Consumo estimado:** ~10-15K tokens

```
Você é o Dev Manager do Minhas Finanças. Execute health check completo.

### 1. Git Health
git status
git branch -a | grep -E "feat/|fix/"

### 2. Testes
npm test 2>&1 | tail -30

### 3. Build
npm run build 2>&1 | tail -10

### 4. Segurança Rápida
grep -rn "innerHTML" src/js/ | grep -v escHTML | grep -v node_modules | head -10
grep -rn "eval\|new Function" src/js/ | head -5

### 5. Dependências
npm audit --production 2>&1 | tail -10

### Output
## Health Check MF — [data]
| Área | Status | Detalhes |
|------|--------|----------|
| Git | OK/WARN | ... |
| Testes | X/Y passando | ... |
| Build | OK/FAIL | ... |
| Segurança | OK/WARN | ... |
| Deps | X vulns | ... |

**Ação imediata necessária:** [sim/não + o quê]
```

---

## Guia de Consumo de Tokens

| Prompt | Tokens Est. | Frequência Sugerida |
|--------|-------------|---------------------|
| PM-01 Status Rápido | ~2K | Diário |
| PM-02 Revisão Semanal | ~5K | Semanal |
| PM-03 Checklist PR | ~3K | Por PR |
| PM-04 Impedimentos | ~3K | Quando necessário |
| DM-01 Implementar Feature | ~15-30K | Por feature |
| DM-02 Corrigir Bug | ~8-15K | Por bug |
| DM-03 Test Coverage | ~10-20K | Semanal |
| DM-04 Auditoria Segurança | ~5-8K | Mensal |
| DM-05 Pipeline Importação | ~8-12K | Mensal ou por alteração |
| COMBO-01 Health Check | ~10-15K | Semanal |

**Budget diário estimado:**
- Dia leve (status + 1 bug fix): ~12K tokens
- Dia médio (status + 1 feature + PR review): ~35K tokens
- Dia pesado (health check + feature completa + security): ~50K tokens

---

## Dicas de Otimização

1. **PM-01 antes de qualquer coisa** — 2K tokens para saber onde está.
2. **NÃO rode DM-04 (security) todo dia** — mensal é suficiente.
3. **DM-05 (pipeline) só quando tocar no pipeline** — é o módulo mais complexo, não rode sem necessidade.
4. **COMBO-01 substitui PM-02 + DM-04** — se for rodar os dois na mesma semana, rode o combo.
5. **Limite o escopo** — preencha [MÓDULO] ao invés de rodar em "todos".
