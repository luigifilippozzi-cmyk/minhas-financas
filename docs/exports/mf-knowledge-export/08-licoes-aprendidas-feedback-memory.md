# 08 — Lições Aprendidas e Feedback Memory

> Lições reais acumuladas pelo PO Assistant do MF ao longo de meses de operação. Cada lição virou **feedback memory** persistente — o agente passa a aplicar automaticamente em sessões futuras.

---

## 🟢 O que é Feedback Memory

O PO Assistant tem um sistema de memória persistente entre sessões (`memory/`). **Feedback memories** são uma categoria específica: anotações sobre como trabalhar — o que funciona, o que não, o que evitar.

Elas são gravadas em dois momentos:
1. **Após uma correção** — usuário diz "não faça assim" → agente registra
2. **Após uma confirmação não-óbvia** — usuário diz "exatamente, foi a escolha certa" → agente registra

Cada memory tem três partes essenciais:
- **Regra** — o que fazer / não fazer
- **Por quê** — incidente ou motivação
- **Como aplicar** — quando o gatilho dispara

Sem o "por quê", a regra vira ritual cego. Sem o "como aplicar", o agente não sabe quando ela vale.

---

## 🔵 As 3 lições aprendidas no MF (estado em 2026-04-21)

### Lição 1 — PowerShell here-strings com Markdown precisam ser single-quoted

**Regra:** ao gerar scripts PowerShell que contenham conteúdo Markdown (com backticks, `->`, ou `${}`), usar `@'...'@` (single-quoted) e `--body-file`, em vez de paste direto na linha de comando.

**Por quê:** o terminal pendurou em sessões anteriores quando triple-backticks de blocos de código Markdown eram pasteados como conteúdo de here-string `@"..."@` (double-quoted). PowerShell tentou interpolar, errou, ficou aguardando entrada com `>>` repetidos.

**Como aplicar:** sempre que o conteúdo a ser passado para `gh issue create`, `Add-Content` ou similar tiver:
- Triple backticks (blocos de código Markdown)
- Setas `->` ou `=>`
- Variáveis `${}` ou `$()` literais
- Caracteres especiais `@`, `$`, `` ` `` em texto

→ usar `@'...'@` + escrever em arquivo temporário + `--body-file <arquivo>`.

**Local da memória:** `feedback_powershell_here_strings.md`

---

### Lição 2 — Validar exit code de comandos antes de declarar sucesso

**Regra:** scripts PowerShell que invocam `gh`, `git` ou `npm` devem capturar `$LASTEXITCODE` e o output, e validar antes de imprimir "✅ concluído".

**Por quê:** scripts iniciais imprimiam "✅ Issue criada" sem checar — quando `gh` falhava por falta de label, o script seguia em frente. Resultado: PO acreditava que tinha 7 issues criadas; na verdade tinha 4.

**Como aplicar:**
- Atribuir saída a variável: `$saida = gh issue create ... 2>&1`
- Checar: `if ($LASTEXITCODE -ne 0) { Write-Host "Falha: $saida" -ForegroundColor Red; return }`
- Para extrair número de issue criada: `if ($saida -match "/issues/(\d+)") { $num = $Matches[1] }`
- Para guard de placeholders: `if ($titulo -like "SUBSTITUIR_*") { return }`

**Local da memória:** `feedback_powershell_verificar_exitcode.md`

---

### Lição 3 — Processos com execução humana devem ser passo-a-passo assistidos

**Regra:** quando o processo envolve execução manual pelo humano (PO copia script, roda no PowerShell, traz resultado), entregar **uma etapa por vez com pausa para feedback**, em vez de despejar todo o plano em bloco único.

**Por quê:** em sessão NRF-UX umbrella (2026-04-21), PO solicitou explicitamente: "vamos fazer o processo que neccessita de interações humanas de maneira assistida. nas próximas conversas elabore um passo a passo etapa a etapa e permita feedbacks responsivos". Bloco único anteriormente entregue gerou (a) terminal preso por triple-backticks, (b) confusão sobre qual etapa era qual, (c) impossibilidade de adaptar o plano com base no resultado da etapa anterior.

**Como aplicar:**
- Quebrar o trabalho em etapas numeradas curtas (3–6 etapas é o ideal)
- Entregar Etapa 1 — script + descrição do que esperar — e parar
- Aguardar PO trazer resultado antes de Etapa 2
- Ajustar próxima etapa com base no resultado real (não no esperado)
- No final, recapitular o que foi feito + atualizar memória persistente

**Local da memória:** `feedback_passo_a_passo_assistido.md`

---

## 🟢 Padrão de feedback memory bem escrita

```markdown
---
name: <nome-curto>
description: <gatilho — o que dispara aplicar esta regra>
type: feedback
---

<Regra em uma frase imperativa>

**Por quê:** <incidente ou motivação concreta>

**Como aplicar:** <quando e onde aplicar — gatilhos específicos>

**Exemplo positivo (opcional):** <caso real em que funcionou>

**Exemplo negativo (opcional):** <caso real em que falhou>
```

Sem o **Por quê**, futura-você não sabe se a regra ainda vale; sem o **Como aplicar**, não sabe quando atinge.

---

## 🟢 Quando registrar uma feedback memory

**Sempre que:**
1. O PO corrige sua abordagem ("não faça assim", "stop doing X")
2. O PO confirma uma escolha não-óbvia ("exatamente, era essa a escolha")
3. Um erro técnico surpreendeu (terminal preso, encoding quebrado, comando que falhou silenciosamente)
4. Uma decisão de processo emergiu da própria sessão (ex: "a partir de hoje, sempre passo-a-passo")

**Não registrar:**
- Padrões já presentes no `CLAUDE.md` ou na Bússola — duplica conhecimento
- Detalhes de uma única feature efêmera — não gera regra reutilizável
- "Use sempre Conventional Commits" — já é convenção do projeto, não memory

---

## 🟢 Como o PO consulta as memórias

No início de cada sessão (Cowork), o PO Assistant lê automaticamente o índice (`MEMORY.md`) e carrega as memories relevantes ao contexto. Isso significa:

- Se a sessão envolve criação de scripts → memories #1 e #2 estão ativas
- Se a sessão envolve ensino ao humano → memory #3 está ativa
- Memories ficam disponíveis para citação ("aplicando lição X")

---

## 🟡 Adaptação para outro projeto

O sistema de memória persistente já existe na infraestrutura do PO Assistant (Cowork). O PO do SSE herda automaticamente o mecanismo, mas começa com **zero memories**. À medida que sessões correm, novas lições viram memories.

**Atalho recomendado:** copiar as 3 memories do MF como ponto de partida — elas são genéricas o suficiente para qualquer projeto que use PowerShell + GitHub CLI + execução assistida.

```powershell
# Copiar memories do MF como bootstrap para o SSE
$origem = "C:\Users\luigi\AppData\Roaming\Claude\local-agent-mode-sessions\<sessao-mf>\memory"
$destino = "C:\Users\luigi\AppData\Roaming\Claude\local-agent-mode-sessions\<sessao-sse>\memory"

Copy-Item "$origem\feedback_powershell_here_strings.md" -Destination $destino
Copy-Item "$origem\feedback_powershell_verificar_exitcode.md" -Destination $destino
Copy-Item "$origem\feedback_passo_a_passo_assistido.md" -Destination $destino

# Atualizar MEMORY.md no destino com as 3 entradas
```

> Substitua `<sessao-mf>` e `<sessao-sse>` pelos UUIDs de sessão reais (Cowork mostra na pasta `local-agent-mode-sessions`).

---

## 🟢 Exemplos do tipo de aprendizado que vale memory

### ✅ Bom candidato (gera memory)

> "Não use `git add -A` em sessões de revisão — quase incluiu artefato gerado em commit acidentalmente em PR #X."

→ Vira memory: "Sempre `git add` arquivo a arquivo em sessões PO; nunca `-A`. Razão: incidente PR #X."

### ❌ Não vira memory

> "Hoje implementamos NRF-UX F2."

→ Não é regra. Vai para `project_mf_status.md` (estado), não para feedback memory.

### ✅ Bom candidato (decisão de processo)

> "A partir de agora, toda issue de UI tem que mencionar PUX aplicáveis no body."

→ Vira memory + atualização de template de issue.

---

## ⚠️ Anti-patterns

- **Memory que duplica regra inviolável** — se já está no CLAUDE.md, é dever do código/CI, não da memória do agente
- **Memory sem incidente concreto** — "evite código verboso" é poesia, não memory
- **Memory genérica demais** — "seja cuidadoso" não é aplicável
- **Acúmulo de 50+ memories** — vira ruído. Consolidar duplicadas, podar desatualizadas (skill `consolidate-memory`)

---

## 🟢 Ciclo de vida de uma memory

```
1. Incidente ou confirmação acontece
2. PO Assistant escreve memory no momento
3. Atualiza MEMORY.md (índice)
4. Em sessões futuras, é consultada quando o gatilho dispara
5. A cada N sessões, PO roda skill consolidate-memory:
   - Merge de duplicatas
   - Atualização de fatos obsoletos
   - Poda de irrelevantes
```

> No MF, consolidação foi rodada 0 vezes até agora (3 memories ainda fits in head). Quando passar de 10, rodar consolidate.

---

## 📌 Histórico no MF

| Data | Evento |
|---|---|
| 2026-04 | Memory #1 (here-strings) registrada após terminal preso 1ª vez |
| 2026-04 | Memory #2 (exit code) registrada após "✅ falso" em 7 issues |
| 2026-04-21 | Memory #3 (passo-a-passo) registrada após pedido explícito do PO |

---

## Referências cruzadas

- **01-governanca-squad.md** — onde o PO Assistant se encaixa
- **07-workflow-git-e-powershell.md** — padrões PowerShell que as memories #1 e #2 governam
- **09-checklist-adocao-sse.md** — passo 8 sugere copiar as 3 memories do MF como bootstrap
