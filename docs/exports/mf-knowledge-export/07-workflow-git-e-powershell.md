# 07 — Workflow Git e Scripts PowerShell (MF como referência)

> Como PO, PM Agent e DM se comunicam via git + GitHub CLI + PowerShell. Foco em **scripts executáveis**, não em teoria.

---

## 🟢 Princípios do workflow

1. **Convenção sobre configuração** — Conventional Commits, branches nomeadas, PRs com template
2. **CI como primeira barreira** — se CI falhar, não há conversa
3. **Subagentes rodam localmente antes do PR** — não "depois vemos"
4. **Scripts reproduzíveis** — qualquer ação manual repetitiva vira PowerShell
5. **Memória persistente escrita após cada marco** — sessão termina com estado gravado

---

## 🟢 Convenções de branch

```
feat/MF-<issue>-<descricao-kebab>   ← nova funcionalidade
fix/MF-<issue>-<descricao-kebab>    ← correção de bug
refactor/MF-<issue>-<descricao>     ← sem mudança de comportamento
docs/MF-<issue>-<descricao>         ← documentação
chore/MF-<issue>-<descricao>        ← manutenção/build/CI
```

Exemplos reais do MF:
- `feat/MF-194-nrf-ux-f2-fraunces-bussola`
- `fix/MF-32-mesfatura-propagacao`
- `refactor/MF-100-auth-service`

> Usar sempre o prefixo `MF-` antes do número da issue (outro projeto: `SSE-123-...`). Facilita grep em múltiplos repos.

---

## 🟢 Conventional Commits (adaptado MF)

```
feat(escopo): descrição curta (vX.Y.Z)
fix(escopo): descrição curta
refactor(escopo): descrição
docs: descrição
style(css): descrição
test(escopo): descrição
chore: descrição
```

Escopos frequentes no MF: `auth`, `dashboard`, `despesas`, `receitas`, `categorias`, `orcamentos`, `importar`, `fatura`, `planejamento`, `pipelineCartao`, `pipelineBanco`, `database`, `design-system`, `ios`.

**Regra:** se `feat` ou `fix` toca código em `src/`, **incluir versão no commit** — `feat(dashboard): ENH-004 progressive disclosure (v3.29.0)`.

---

## 🟢 Fluxo padrão de uma feature (com agentes)

```
[PO Cowork] → cria issue via gh com body estruturado
              registra tarefa em .auto-memory/dm_tasks_pending.md
              registra tarefa em .auto-memory/pm_tasks_pending.md

[DM Claude Code] → lê dm_tasks_pending
                   git checkout -b feat/MF-194-...
                   implementa
                   npm test   ← test-runner
                   invoca subagentes conforme escopo
                   commit com escopo + versão
                   gh pr create com "Closes #194"

[CI] → roda testes + build + deploy preview

[PO Cowork] → lê PR, pede ajustes ou aprova
              gh pr review --approve
              gh pr merge --merge --delete-branch
              gh issue close #194

[PM Agent] → próxima sessão atualiza dashboard docs/mf-squad-dashboard.html
```

Tempo médio observado: feature pequena leva 1–2 sessões PO + 1–2 sessões DM, janela 1–3 dias.

---

## 🟢 Scripts PowerShell — padrão MF

> Todos seguem o mesmo formato: variáveis no topo, comentários por etapa, verificação ao final.

### Script 1 — Diagnóstico de abertura de sessão PO

```powershell
# DIAGNOSTICO COMPLETO — rodar antes de qualquer decisao de sessao
Set-Location "C:\Dev\minhas-financas"

Write-Host "=== Diagnostico PO ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

# 1. Versao
Write-Host "-- Versao --" -ForegroundColor Yellow
$v = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Versao local: v$v"

# 2. Testes (resumo rapido)
Write-Host "`n-- Testes --" -ForegroundColor Yellow
npm test 2>&1 | Select-String "Tests|passed|failed" | Select-Object -Last 3

# 3. Git
Write-Host "`n-- Git --" -ForegroundColor Yellow
git fetch origin --quiet
git log --oneline -5
$dirty = git status --porcelain
if ($dirty) {
    Write-Host "Working tree com alteracoes:" -ForegroundColor Red
    git status --short
} else {
    Write-Host "Working tree limpa" -ForegroundColor Green
}

# 4. PRs abertos
Write-Host "`n-- PRs abertos --" -ForegroundColor Yellow
gh pr list --state open --json number,title,headRefName

# 5. Issues abertas
Write-Host "`n-- Issues abertas --" -ForegroundColor Yellow
gh issue list --state open --limit 30 --json number,title | ConvertFrom-Json | Format-Table number, title -AutoSize

# 6. Handoff pendente
Write-Host "`n-- Handoff pendente --" -ForegroundColor Yellow
if (Test-Path ".auto-memory\dm_tasks_pending.md") { Write-Host "DM: pendente" } else { Write-Host "DM: (vazio)" }
if (Test-Path ".auto-memory\pm_tasks_pending.md") { Write-Host "PM: pendente" } else { Write-Host "PM: (vazio)" }

Write-Host "`n=== Fim do diagnostico ===" -ForegroundColor Cyan
```

### Script 2 — Criar issue via `gh` com body Markdown complexo

```powershell
# Criar issue usando --body-file (evita problemas com backticks e flags)
Set-Location "C:\Dev\minhas-financas"

$titulo = "SUBSTITUIR_TITULO"

$corpoPath = "$env:TEMP\gh-issue-body.md"
@'
SUBSTITUIR_CORPO_MARKDOWN

## Criterios de aceite
- [ ] <CA1>
- [ ] <CA2>
'@ | Set-Content -Path $corpoPath -Encoding UTF8

$labels = "enhancement,prioridade: alta"
$milestone = ""  # vazio = sem milestone

if ($milestone) {
    gh issue create --title $titulo --body-file $corpoPath --label $labels --milestone $milestone
} else {
    gh issue create --title $titulo --body-file $corpoPath --label $labels
}

Remove-Item $corpoPath -Force
Write-Host "Issue criada" -ForegroundColor Green
```

> **Lição MF:** usar `@'...'@` (single-quoted here-string) + `--body-file` é crítico quando o conteúdo tem backticks ou `->` — PowerShell interpreta incorretamente com `@"..."@`.

### Script 3 — Registrar tarefa para DM em arquivo de handoff

```powershell
Set-Location "C:\Dev\minhas-financas"

$data = Get-Date -Format "yyyy-MM-dd"
$titulo = "SUBSTITUIR_TITULO"
$corpo = @'
SUBSTITUIR_CORPO
'@

$arquivo = ".auto-memory\dm_tasks_pending.md"
if (-not (Test-Path $arquivo)) { New-Item $arquivo -Force | Out-Null }

Add-Content $arquivo "`n## [$data] $titulo`n$corpo`n---" -Encoding UTF8
Write-Host "Tarefa registrada em $arquivo" -ForegroundColor Green
```

### Script 4 — Abrir PR após implementação

```powershell
# Rodar apos commits na branch de feature
Set-Location "C:\Dev\minhas-financas"

$issueNum = 0  # SUBSTITUIR
$titulo = "feat(escopo): descricao (#$issueNum)"
$corpoPath = "$env:TEMP\pr-body.md"

@'
## Resumo
<descricao>

## Subagentes invocados
- [x] test-runner: X testes passando
- [ ] security-reviewer: <relatorio ou N/A>
- [ ] ux-reviewer: <relatorio ou N/A>
- [ ] import-pipeline-reviewer: <relatorio ou N/A>

## Criterios de aceite
- [ ] <CA1>

Closes #ISSUE_NUM
'@ -replace "ISSUE_NUM", $issueNum | Set-Content -Path $corpoPath -Encoding UTF8

git push -u origin HEAD
gh pr create --title $titulo --body-file $corpoPath

Remove-Item $corpoPath -Force
Write-Host "PR criado" -ForegroundColor Green
```

### Script 5 — Revisar e mergear PR

```powershell
Set-Location "C:\Dev\minhas-financas"

$prNum = 0  # SUBSTITUIR

# Detalhes + CI
gh pr view $prNum
gh pr checks $prNum

# Revisar diff por palavras-chave criticas
gh pr diff $prNum | Select-String "innerHTML|deleteDoc|chave_dedup|gstatic|#[0-9a-fA-F]{6}" | Write-Host

# Confirmar visualmente antes de aprovar — execute as linhas abaixo em outra chamada
# gh pr review $prNum --approve --body "Aprovado. Regras invioláveis verificadas."
# gh pr merge $prNum --merge --delete-branch
# git checkout main
# git pull origin main
```

### Script 6 — Atualizar memória persistente ao fechar sessão

```powershell
Set-Location "C:\Dev\minhas-financas"

$entrada = @'
## Sessao YYYY-MM-DD — PO Assistant (Cowork)

### Estado na sessao
- Versao: vX.Y.Z
- Saude: VERDE

### Decisoes tomadas
1. <decisao>

### Issues criadas
- #N — titulo

### Proxima sessao — foco sugerido
- <foco>
'@

$arquivo = ".auto-memory\project_mf_status.md"
Add-Content $arquivo $entrada -Encoding UTF8
Write-Host "Memoria atualizada" -ForegroundColor Green
```

---

## 🟢 Boas práticas PowerShell aprendidas no MF

### 1. Here-strings com Markdown/CLI precisa ser single-quoted

```powershell
# ❌ Quebra em conteudo com backticks ou ->
$x = @"
codigo: `npm test`
fluxo: A -> B
"@

# ✅ Preserva literalmente
$x = @'
codigo: `npm test`
fluxo: A -> B
'@
```

### 2. Validar exit code de `gh`, `git`, `npm`

```powershell
$saida = gh issue create --title "..." --body-file "..." 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha: $saida" -ForegroundColor Red
    return
}
# Extrair numero da issue criada
if ($saida -match "/issues/(\d+)") {
    $num = $Matches[1]
    Write-Host "Issue #$num criada" -ForegroundColor Green
}
```

### 3. Guard em placeholders

```powershell
$titulo = "SUBSTITUIR_TITULO"
if ($titulo -like "SUBSTITUIR_*") {
    Write-Host "Preencha as variaveis antes de rodar" -ForegroundColor Red
    return
}
```

### 4. Encoding UTF-8 explícito em `Set-Content` e `Add-Content`

```powershell
Set-Content -Path $arquivo -Value $conteudo -Encoding UTF8
Add-Content -Path $arquivo -Value $entrada -Encoding UTF8
```

Sem `-Encoding UTF8`, PowerShell 5.1 grava em Windows-1252 e quebra caracteres acentuados em ambientes mistos.

### 5. Preview de arquivo com encoding correto

```powershell
Get-Content $arquivo -Encoding UTF8 | Select-Object -First 10
```

---

## 🟢 Estrutura de `.auto-memory/`

Replicada do MF como padrão:

```
.auto-memory/
├── project_<projeto>_status.md       ← estado do projeto
├── pm_tasks_pending.md               ← tarefas para PM Agent
├── dm_tasks_pending.md               ← tarefas para Dev Manager
├── questions-to-po.md                ← perguntas pendentes
├── proposals/                        ← rascunhos (patches, prompts, deltas)
│   ├── <feature>.md
│   ├── deltas/                       ← blocos a colar em handoff files
│   └── issues/                       ← bodies de issues GitHub
└── archive/                          ← tarefas lidas, arquivadas por data
    ├── YYYY-MM-DD_pm_tasks_pending.md
    └── YYYY-MM-DD_dm_tasks_pending.md
```

---

## ⚠️ Anti-patterns observados no MF

- **Scripts sem variáveis no topo** — "edite aqui e ali" — erros de paste frequentes
- **Scripts sem validação de exit code** — "rodei, deu ✅ no final" mas falha silenciosa
- **Branches sem prefixo `feat/fix/docs`** — CI e hooks quebram
- **Commit direto na main fora das exceções permitidas** — perde `ux-reviewer` + CI
- **Memória persistente sem separador `---`** — vira texto ilegível em 3 meses
- **Scripts em PowerShell 5.1 sem `-Encoding UTF8`** — `á é ó` viram `Ã¡ Ã© Ã³`

---

## 🟡 Adaptação para outro SO / shell

Se o projeto adotante usa macOS/Linux, traduzir scripts para `bash`:

| PowerShell | Bash |
|---|---|
| `@'...'@` | `cat <<'EOF' ... EOF` |
| `Set-Content -Encoding UTF8` | `cat > arquivo` (UTF-8 default) |
| `Get-Content` | `cat` ou `head`/`tail` |
| `$LASTEXITCODE` | `$?` |
| `Write-Host -ForegroundColor` | `echo -e "\e[33m..."` |

Convenções (branch names, commits, memória persistente) são idênticas.

---

## 📌 Evolução do workflow no MF

| Marco | Mudança |
|---|---|
| Início | Commit direto na main, sem CI |
| +1 mês | GitHub Actions com `npm test` |
| +2 meses | Feature branches + PR obrigatório para `src/` |
| +3 meses | `gh` CLI adotado para scripts PO |
| 2026-04 | `.auto-memory/` como bridge entre Cowork e Claude Code |
| 2026-04-21 | `--body-file` adotado como default para issues com Markdown |

---

## Referências cruzadas

- **01-governanca-squad.md** — papéis que consomem estes scripts
- **06-regras-invioláveis.md** — regras validadas pelos scripts (ex: #7 `innerHTML`)
- **08-licoes-aprendidas-feedback-memory.md** — como os aprendizados acima viraram memória persistente
