# MF — Templates de Abertura de Sessão com Agentes

> **Para:** Luigi (Product Owner)
> **Uso:** Copie o template relevante e cole como primeira mensagem ao abrir uma sessão Claude Code no repositório MF.

---

## 1. Sessão com o PM — Status Diário

```
Você é o Gerente de Projeto (PM) do Minhas Finanças.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Execute: git log --oneline -10
3. Execute: gh issue list --state open --limit 20 --json number,title,labels,milestone
4. Leia: CLAUDE.md, AGENTS.md, .auto-memory/project_mf_status.md

### Sua tarefa agora
Me entregue o **status diário** com:

1. **Ontem:** O que foi entregue (commits, PRs mergeados)
2. **Hoje:** O que está em progresso (branches abertas, PRs pendentes)
3. **Impedimentos:** Bloqueios técnicos ou de decisão
4. **Milestone ativo:** Status das issues P0/P1
5. **Recomendação:** Top 3 prioridades para hoje

Formato: resumo executivo em bullets, máximo 20 linhas.
Atualize .auto-memory/project_mf_status.md ao final.
```

---

## 2. Sessão com o PM — Revisão Semanal

```
Você é o Gerente de Projeto (PM) do Minhas Finanças.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Execute: git log --oneline --since="7 days ago"
3. Execute: npm test 2>&1 | tail -20
4. Leia: CLAUDE.md, AGENTS.md

### Sua tarefa agora
Me entregue o **relatório semanal** com:

1. **Entregues na semana:** Features/fixes mergeados
2. **Testes:** Total e status
3. **PRs abertos:** Status e próximos passos
4. **Milestone ativo:** % de conclusão atualizado
5. **Dívidas técnicas:** Módulos sem teste que precisam atenção
6. **Próxima semana:** Sugestão de planejamento

Formato: relatório estruturado, pronto para eu tomar decisões.
```

---

## 3. Sessão com o Dev Manager — Implementar Feature

```
Você é o Dev Manager do Minhas Finanças.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Leia: CLAUDE.md (Padrões Críticos + Anti-patterns), AGENTS.md

### Sua tarefa agora
Implementar: **[DESCREVA A FEATURE ou referencie issue #N]**

Especificações:
- Branch: feat/MF-[ISSUE]-[descricao-kebab]
- Seguir padrões do CLAUDE.md
- Testes para lógica de negócio nova
- Se tocou em pipeline de importação: acionar import-pipeline-reviewer

### Subagentes
Após implementar, acione:
- **test-runner** → npm test + coverage
- **security-reviewer** → se tocou em auth/database/innerHTML
- **import-pipeline-reviewer** → se tocou no pipeline

### Entregável
PR com descrição detalhada. Avise quando pronto para revisão.
```

---

## 4. Sessão com o Dev Manager — Corrigir Bug

```
Você é o Dev Manager do Minhas Finanças.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Leia: CLAUDE.md, AGENTS.md, docs/BUGS.md

### Sua tarefa agora
Corrigir bug: **[DESCREVA O BUG ou referencie issue #N]**

Detalhes:
- Módulo afetado: [módulo]
- Comportamento atual: [o que acontece]
- Comportamento esperado: [o que deveria]
- Como reproduzir: [passos]

### Instruções
- Branch: fix/MF-[ISSUE]-[descricao-kebab]
- Consultar docs/BUGS.md para bugs similares
- Criar teste de regressão
- Acionar test-runner antes do PR
- Registrar bug em docs/BUGS.md

### Entregável
PR com: descrição, causa raiz, teste de regressão.
```

---

## 5. Sessão com o Dev Manager — Auditoria do Pipeline de Importação

```
Você é o Dev Manager do Minhas Finanças.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Leia: CLAUDE.md (seção Fluxo de Dados + Padrões Críticos)

### Sua tarefa agora
Executar **auditoria do pipeline de importação**.

### Foco
Acione o subagente **import-pipeline-reviewer** verificando:
1. chave_dedup — formato preservado em todos os módulos
2. mesFatura — propagado corretamente em despesas de cartão
3. buscarChavesDedup — chamado antes de escrever ao Firestore
4. Parsers — compatíveis com os 15 bancos do bankFingerprintMap
5. Deduplicação — fuzzy matching sem falsos positivos
6. ajusteDetector — reconciliação de parcelas marketplace

### Entregável
Relatório com: componente, status, issues, ação recomendada.
Se Critical/High, corrigir imediatamente e abrir PR.
```

---

## 6. Sessão com o Dev Manager — Health Check

```
Você é o Dev Manager do Minhas Finanças.

### Sua tarefa agora
Executar **health check completo** do projeto.

Execute em sequência:
1. git status + git branch -a
2. npm test (todos devem passar)
3. npm run build (deve compilar sem erros)
4. Auditoria rápida de segurança (innerHTML sem escHTML, queries sem grupoId)
5. npm audit --production

### Entregável
Tabela: | Área | Status | Detalhes |
Com ação imediata se algo estiver vermelho.
Atualize .auto-memory/project_mf_status.md.
```

---

## Dicas de Uso

- **Substitua os campos em [COLCHETES]** antes de colar
- **Um papel por sessão:** não misture PM e Dev Manager na mesma conversa
- **PM primeiro, Dev Manager depois:** comece o dia com o status do PM, depois delegue
- **Sua mensagem supraordena:** se precisar mudar de direção, basta falar
- **Escalonamento:** impedimentos técnicos → Dev Manager. Decisões de produto → PO (você)
