# 09 — Checklist de Adoção no SSE (e em qualquer projeto novo)

> Roteiro passo a passo para o PO Agent do SSE importar este pacote de conhecimento. Ordem importa — cada passo depende dos anteriores.

---

## 🟢 Pré-requisitos

Antes de começar, o PO precisa ter:

- [ ] Repositório SSE inicializado em `C:\Dev\sse` (ou caminho equivalente)
- [ ] Acesso ao GitHub do projeto SSE
- [ ] PowerShell 5.1+ ou PowerShell 7+ instalado
- [ ] GitHub CLI (`gh`) autenticado
- [ ] Decisão tomada sobre stack (frontend, backend, persistência)
- [ ] Pelo menos 1 sessão dedicada (~2h) para a primeira leva de adoção

---

## 🟢 Fase 1 — Foundation (Sessão 1, ~2h)

### Passo 1 — Ler o pacote inteiro
- [ ] README.md (este pacote)
- [ ] 01-governanca-squad.md
- [ ] 02-subagente-ux-reviewer.md
- [ ] 03-principios-ux-pv-pux.md
- [ ] 04-design-system-warm-finance.md
- [ ] 05-bussola-produto-template.md
- [ ] 06-regras-invioláveis.md
- [ ] 07-workflow-git-e-powershell.md
- [ ] 08-licoes-aprendidas-feedback-memory.md

> Tempo estimado: 30–45 min de leitura.

### Passo 2 — Definir os 3 papéis do squad SSE
- [ ] Confirmar quem é o humano-PO (provavelmente Luigi)
- [ ] Decidir se PM Agent é necessário desde o início (opcional na primeira semana)
- [ ] Confirmar Dev Manager como executor único de código

### Passo 3 — Criar a Bússola do SSE (mínimo viável)
Usar o template do arquivo 05. Mínimo aceitável:
- [ ] §1 — Missão (1 parágrafo)
- [ ] §2 — Usuários (lista simples)
- [ ] §3 — Princípios de Produto (3–5 frases)
- [ ] §4 — Decisões Arquitetônicas (stack escolhida)
- [ ] §5 — Fora de escopo (lista curta)
- [ ] §9 — Ordem de Ataque (vazia inicialmente — preenchida na primeira sessão de planejamento)

Salvar como `C:\Dev\sse\docs\BUSSOLA_PRODUTO.md`.

### Passo 4 — Criar `CLAUDE.md` mínimo do SSE
- [ ] Identidade do projeto (nome, stack, usuários, repo)
- [ ] Comandos essenciais (`npm test`, `npm run dev`, etc.)
- [ ] Estrutura de arquivos (referência rápida)
- [ ] Convenções de código (naming, commits)
- [ ] Seção REGRAS INVIOLÁVEIS (pode começar vazia — primeira regra surge com primeiro incidente)

### Passo 5 — Criar estrutura `.auto-memory/` no SSE
```powershell
Set-Location "C:\Dev\sse"
New-Item -ItemType Directory -Path ".auto-memory" -Force | Out-Null
New-Item -ItemType Directory -Path ".auto-memory\proposals" -Force | Out-Null
New-Item -ItemType Directory -Path ".auto-memory\proposals\deltas" -Force | Out-Null
New-Item -ItemType Directory -Path ".auto-memory\proposals\issues" -Force | Out-Null
New-Item -ItemType Directory -Path ".auto-memory\archive" -Force | Out-Null

# Arquivo inicial de status
@'
# SSE — Status do Projeto

## Sessao YYYY-MM-DD — Bootstrap

### Estado inicial
- Versao: v0.1.0
- Stack: <stack escolhida>
- Squad: PO + DM (PM Agent posterior)

### Decisoes de fundacao
- Bussola criada
- Pacote MF Knowledge Export importado

### Proxima sessao
- Primeira feature de teste do squad
'@ | Set-Content ".auto-memory\project_sse_status.md" -Encoding UTF8

Write-Host "Estrutura .auto-memory criada" -ForegroundColor Green
```

---

## 🟢 Fase 2 — Squad e Subagentes (Sessão 2, ~2h)

### Passo 6 — Criar o prompt do PO Agent do SSE
Adaptar o prompt do PO MF (trocar nome, stack, milestones, prioridades).

- [ ] Salvar prompt no projeto Cowork "SSE PO Agent"
- [ ] Configurar com referência a `C:\Dev\sse` como workspace

### Passo 7 — Criar prompts de PM Agent e Dev Manager
- [ ] `docs/SSE_Prompt_DevManager_Squad.md` — adaptado do MF
- [ ] `docs/SSE_Prompt_PMAgent_Squad.md` — opcional na semana 1

### Passo 8 — Criar primeiro subagente: `test-runner`
Mesmo se ainda não há testes, instalar a infraestrutura mental.
- [ ] Criar `.claude/agents/test-runner.md` com prompt mínimo
- [ ] Adicionar Regra Inviolável implícita: "todo PR roda `test-runner` antes"

### Passo 9 — (Opcional, recomendado) Bootstrap das feedback memories
Copiar as 3 memories do MF para o SSE:
```powershell
$origemMF = "C:\Users\luigi\AppData\Roaming\Claude\local-agent-mode-sessions\<UUID-MF>\memory"
$destinoSSE = "C:\Users\luigi\AppData\Roaming\Claude\local-agent-mode-sessions\<UUID-SSE>\memory"

Copy-Item "$origemMF\feedback_powershell_here_strings.md" -Destination $destinoSSE
Copy-Item "$origemMF\feedback_powershell_verificar_exitcode.md" -Destination $destinoSSE
Copy-Item "$origemMF\feedback_passo_a_passo_assistido.md" -Destination $destinoSSE

# Atualizar MEMORY.md no SSE com as 3 entradas
```

---

## 🟢 Fase 3 — Identidade Visual e DS (Sessão 3, ~2h)

### Passo 10 — Decidir paleta primária do SSE (PV1)
- [ ] Cor primária + estado hover + sutil
- [ ] Neutros (light + dark)
- [ ] 4 semânticos (success, warning, danger, info)

### Passo 11 — Decidir tipografia (PV2)
- [ ] Fonte display
- [ ] Fonte UI
- [ ] (Opcional) Fonte mono

### Passo 12 — Criar `variables.css` (ou equivalente da stack)
Estrutura mínima do arquivo 04:
- [ ] Tokens de cor (paleta + semânticos)
- [ ] Tokens de espaço (escala 6–10 níveis)
- [ ] Tokens de raio
- [ ] Tokens de sombra
- [ ] Tokens de motion (duração + easing)
- [ ] Dark mode via tokens semânticos

### Passo 13 — Documentar PV1–PV6 + PUX1–PUX6 na Bússola §12
Copiar as definições do arquivo 03 para `BUSSOLA_PRODUTO.md` §12.5, adaptando exemplos ao SSE.

### Passo 14 — Criar subagente `ux-reviewer` para o SSE
- [ ] Salvar prompt em `docs/SSE_Prompt_UXReviewer_Squad.md` (ver arquivo 02)
- [ ] Adicionar Regra Inviolável correspondente no `CLAUDE.md` do SSE (versão da #14 do MF)

---

## 🟢 Fase 4 — Workflow e Operação (Sessão 4, ~1h)

### Passo 15 — Configurar GitHub
- [ ] Criar labels iniciais: `bug`, `enhancement`, `feature`, `docs`, `prioridade: alta/media/baixa`
- [ ] Criar template de issue (ver MF como referência)
- [ ] Criar template de PR (campos: subagentes invocados, critérios de aceite)

### Passo 16 — Setup CI mínimo
- [ ] GitHub Action: `npm test` em PR
- [ ] (Opcional) Deploy preview por PR

### Passo 17 — Primeira feature de teste do squad
Escolher uma feature pequena para validar o fluxo end-to-end:
1. PO cria issue via Cowork
2. DM implementa via Claude Code
3. `test-runner` + `ux-reviewer` (se UI) rodam
4. PR aberto, CI verde
5. PO revisa e mergeia
6. PO atualiza memória persistente

> Ao final, validar que cada papel funcionou e que a memória persistente está populada.

---

## 🟢 Fase 5 — Iteração contínua (semanas seguintes)

### Passo 18 — Adicionar subagentes conforme dores aparecem
Cada nova dor recorrente vira candidato a subagente. Seguir o padrão do arquivo 02:
1. Identificar dor recorrente
2. Listar critérios objetivos
3. Definir gatilho
4. Escrever prompt
5. Criar Regra Inviolável correspondente
6. Atualizar AGENTS.md
7. Notificar DM

### Passo 19 — Manter Bússola viva
- [ ] §9 atualizada ao final de cada sessão PO
- [ ] §12 atualizada quando DS evolui (versão minor)
- [ ] Outras seções revisitadas trimestralmente

### Passo 20 — Consolidar feedback memories
- [ ] Quando passar de 10 memories, rodar skill `consolidate-memory`
- [ ] Atualizar MEMORY.md (índice) em paralelo

---

## 🟢 Verificações de adoção bem-sucedida

### Após Fase 1 (Sessão 1)
- [ ] Pacote lido na íntegra
- [ ] Bússola mínima existe
- [ ] CLAUDE.md mínimo existe
- [ ] `.auto-memory/` populado

### Após Fase 2 (Sessão 2)
- [ ] PO Agent SSE configurado em Cowork
- [ ] Prompt do DM e do `test-runner` existem
- [ ] (Recomendado) 3 memories MF copiadas

### Após Fase 3 (Sessão 3)
- [ ] Paleta SSE em `variables.css` ou equivalente
- [ ] PV1–PV6 + PUX1–PUX6 escritos na Bússola
- [ ] `ux-reviewer` SSE criado
- [ ] Regra Inviolável #14 (ou equivalente) declarada

### Após Fase 4 (Sessão 4)
- [ ] Labels e templates GitHub configurados
- [ ] CI mínimo funcionando
- [ ] Primeira feature do squad mergeada
- [ ] Memória persistente populada com a sessão

### Após 1 mês de operação
- [ ] Pelo menos 1 nova feedback memory registrada
- [ ] Pelo menos 1 nova Regra Inviolável surgida de incidente
- [ ] Bússola §9 atualizada pelo menos 4 vezes
- [ ] Squad rodando sem PO escrever código

---

## 🟡 Ajustes prováveis vs MF

| Item | MF | Provável SSE |
|---|---|---|
| Stack | Vanilla JS + Vite + Firebase | (definir — pode ser React/Vue/Next) |
| Paleta | Warm Finance (terracota + ivory + carbon) | (própria) |
| Tipografia | Fraunces + Inter | (própria) |
| Pipeline crítico | Importação de transações | (a definir conforme domínio SSE) |
| Subagentes específicos | `import-pipeline-reviewer` | (provavelmente outro — depende do domínio) |
| Subagentes universais | `test-runner`, `security-reviewer`, `ux-reviewer` | Mesmos |
| Workflow git | Conventional Commits + feature branches + PR | Mesmo |
| Estrutura `.auto-memory/` | Mesma | Mesma |

---

## ⚠️ Sinais de adoção quebrada

- ❌ Após 2 semanas, PO ainda escreve código direto → revisar separação Cowork/Claude Code
- ❌ Bússola §9 não foi atualizada nenhuma vez → indica sessões PO não estão fechando bem
- ❌ Subagentes nunca foram invocados → revisar prompt do DM e Regras Invioláveis
- ❌ Memória persistente está vazia → indica que `.auto-memory/` não está integrado ao fluxo
- ❌ DS nunca cresce — sempre os mesmos componentes → squad não está aplicando PV/PUX

---

## 🟢 Suporte na adoção

**Se ficar travado em qualquer passo:**
1. Voltar ao arquivo correspondente do pacote
2. Consultar o "Exemplo MF" daquele tópico
3. Trazer dúvida para a próxima sessão PO Cowork — o PO Assistant já tem contexto MF

**Para gerar uma nova versão deste pacote:**
- Rodar a mesma sessão de exportação no MF (após mudanças significativas)
- Versionar como v1.1.0, v1.2.0, etc. em `docs/exports/mf-knowledge-export-v1.X.0/`

---

## 📌 Sucesso definido

> A adoção está bem-sucedida quando, **na sexta sessão do PO SSE**, você consegue rodar a sessão sem consultar este pacote — porque a estrutura virou ritmo natural.

---

## Referências cruzadas (volta ao pacote)

- **README.md** — overview e propósito
- **01-governanca-squad.md** — modelo PO/PM/DM/subagentes
- **02-subagente-ux-reviewer.md** — padrão de subagente
- **03-principios-ux-pv-pux.md** — princípios PV + PUX
- **04-design-system-warm-finance.md** — exemplo de DS
- **05-bussola-produto-template.md** — template de Bússola
- **06-regras-invioláveis.md** — contrato técnico
- **07-workflow-git-e-powershell.md** — execução prática
- **08-licoes-aprendidas-feedback-memory.md** — memória do PO Assistant
