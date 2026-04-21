# 05 — Bússola de Produto — Estrutura e Template

> Como estruturar o documento estratégico que orienta o PO e os agentes. No MF chama-se `docs/BUSSOLA_PRODUTO.md`. É o **norte do produto** — toda decisão de priorização volta aqui.

---

## 🟢 O que é a Bússola

Um documento vivo que responde, em qualquer momento:

- **Por que o produto existe?** (missão, usuários, dor)
- **O que é "bom" aqui?** (princípios de produto, UX, visual)
- **Onde estamos indo?** (ordem de ataque, roadmap)
- **O que já ficou para trás?** (decisões arquitetônicas já tomadas)

Sem Bússola, o PO reescreve a estratégia a cada sessão. Com Bússola, cada sessão começa com o contrato já estabelecido.

---

## 🟢 Princípios de uma boa Bússola

1. **Uma única fonte** — não rasgue conhecimento entre 5 docs
2. **Seções numeradas e estáveis** — "Bússola §9" vira linguagem do squad
3. **Editável pelo PO, aprovada pelo PO** — agentes propõem patches, não aplicam sozinhos
4. **Contém o "por quê" das decisões** — não só o "quê"
5. **Tem uma seção de Ordem de Ataque sempre atualizada** — prioridade macro

---

## 🟢 Template de Bússola (estrutura sugerida — 12 seções)

```markdown
# Bússola de Produto — <Nome do Projeto>

## §1 — Missão e Visão
[Frase curta: o que o produto entrega a quem, e a que estado queremos chegar]

## §2 — Usuários e Jornadas Principais
[Quem usa, com que frequência, em que contextos; 3–5 jornadas críticas]

## §3 — Princípios de Produto
[5–8 princípios operativos do produto — ex: "Luigi e Ana devem confiar nos números sem auditoria manual"]

## §4 — Decisões Arquitetônicas Permanentes
[Decisões que não são reabertas sem evento extraordinário — stack, modelo de dados, isolamento multi-tenant]

## §5 — Limites de Escopo
[O que o produto NÃO faz e não fará — evita feature creep]

## §6 — Métricas de Saúde
[Como sabemos que está bem — latência, cobertura de testes, bugs em produção]

## §7 — Riscos Conhecidos
[Dívidas e riscos monitorados — ex: "Firestore single-region"]

## §8 — Roadmap de Médio Prazo
[Marcos dos próximos 3–6 meses]

## §9 — Ordem de Ataque Aprovada  ⭐
[Prioridade curta-médio prazo — lista numerada editável]

## §10 — Requisitos Funcionais (referência)
[Link para doc dedicado]

## §11 — Requisitos Não-Funcionais (NRF)
[Performance, segurança, acessibilidade, privacidade]

## §12 — Identidade Visual e UX  ⭐
  ### §12.1 — Paleta (PV1)
  ### §12.2 — Tipografia (PV2)
  ### §12.3 — Hero surfaces (PV3)
  ### §12.4 — Tokens e governança visual (PV4–PV6)
  ### §12.5 — Princípios de Experiência (PUX1–PUX6)  ⭐
  ### §12.6 — Motion e microcopy
```

> As seções marcadas com ⭐ são as mais consultadas no dia a dia e merecem atenção especial.

---

## 🟢 §9 — Ordem de Ataque (coração operacional)

Formato sugerido:

```markdown
## §9 — Ordem de Ataque Aprovada

Atualizada em: YYYY-MM-DD

### Em execução
1. **<Feature atual>** — #<issue> — DM trabalhando

### Próximas (sequência aprovada)
2. **<Próxima>** — #<issue> — <justificativa curta>
3. **<Próxima>** — #<issue> — <justificativa curta>

### Backlog próximo (aguarda decisão PO)
- **<Feature>** — #<issue> — <aberta em sessão YYYY-MM-DD>

### ON HOLD
- **<Feature>** — motivo + condição para destravar

### Concluídas recentes (últimas 10)
- ✅ **<Feature>** — #<issue> — PR #<pr> — vX.Y.Z
```

**Regra de ouro:** `§9` é reescrita ao final de toda sessão PO em que prioridades mudaram.

---

## 🟢 §12 — Identidade Visual e UX

Esta é a seção onde **PV1–PV6 e PUX1–PUX6** vivem (ver arquivo 03). É consultada por:

- PO ao desenhar features
- DM ao implementar
- `ux-reviewer` ao revisar PR

No MF, a seção completa ocupa ~20 páginas e contém:

- Paleta hexadecimal + tokens semânticos
- Escala tipográfica + famílias
- Componentes canônicos com exemplos
- Cada PUX com definição + critérios verificáveis + anti-patterns

---

## 🟢 Processo de atualização da Bússola

**Regra:** Bússola é alterada **somente via patch aprovado pelo PO**.

Fluxo:
1. PO (ou outro agente) identifica necessidade de alteração
2. Escreve patch em `.auto-memory/proposals/bussola_patch_<escopo>.md`
3. PO revisa em sessão Cowork
4. DM aplica o patch em PR (pode vir junto com uma feature)
5. CHANGELOG.md marca "docs: atualização Bússola §X"
6. Merge — Bússola ganha uma versão minor

Nunca edite Bússola direto sem patch — perde rastreabilidade.

---

## 🔵 Exemplo MF — evolução da Bússola

| Data | Evento |
|---|---|
| Criação | §1–§11 escritas — versão 1.0 |
| 2026-03 | §12 adicionada (DS v1.0) |
| 2026-04-19 | §12 expandida com subseções 12.1–12.4 |
| 2026-04-20 | §9 reescrita (NRF-NAV F1 concluída, F2 priorizada) |
| 2026-04-21 | §12.5 (PUX1–PUX6) adicionada + §9 reescrita com NRF-UX F2–F8 |

---

## 🟡 Variação por contexto de projeto

| Contexto | Ajuste sugerido |
|---|---|
| Produto B2B com compliance forte | §11 ganha seção dedicada a auditoria/compliance |
| Produto com múltiplos personas | §2 se expande; cada jornada ganha sub-seção |
| App sem UI customizada (CLI/API) | §12 é minimalista; §11 ganha "DX" (developer experience) |
| Produto open-source | Adicionar §13 — Contribuição (como community entra) |

---

## ⚠️ Anti-patterns

- **Bússola desatualizada** — versão no topo diz "v1.0 — Q1 2025" em 2026-04. Trate como bug: atualizar § editadas.
- **Bússola duplicando README.md** — cada doc tem escopo: README é "como rodar", Bússola é "por que existe".
- **Bússola sem §9** — priorização vira fofoca. §9 é o coração operacional.
- **Bússola com 100 páginas** — ninguém lê. Se passou de 30, quebre em `docs/BUSSOLA_*.md` ou mova referências para docs dedicados.
- **Bússola editada direto em push** — perde processo. Sempre via patch.

---

## 🟢 Template mínimo para começar (copy-paste)

```markdown
# Bússola de Produto — <Projeto>

> Versão: 0.1 — YYYY-MM-DD

## §1 — Missão
<1 parágrafo>

## §2 — Usuários
- <persona 1>
- <persona 2>

## §3 — Princípios de Produto
1. <princípio 1>
2. <princípio 2>
3. <princípio 3>

## §4 — Decisões Arquitetônicas
- <decisão 1>: <stack/escolha>

## §5 — Fora de escopo
- <item>

## §6 — Métricas de Saúde
- <métrica>: <meta>

## §7 — Riscos
- <risco>: <mitigação>

## §8 — Roadmap
- Q<N>: <marco>

## §9 — Ordem de Ataque  ⭐
Atualizada em: YYYY-MM-DD

### Em execução
1. <feature atual>

### Próximas
2. <próxima>

## §10 — Requisitos Funcionais
Ver `docs/REQUISITOS_FUNCIONAIS.md`

## §11 — Requisitos Não-Funcionais
- Performance: <meta>
- Segurança: <contrato>

## §12 — Identidade Visual e UX
### §12.1 — Paleta
<tokens primários>
### §12.2 — Tipografia
<famílias + escala>
### §12.5 — Princípios de Experiência (PUX1–PUX6)
<ver arquivo 03 do pacote>
```

---

## Referências cruzadas

- **01-governanca-squad.md** — quem edita a Bússola (PO) e quem aplica patches (DM)
- **03-principios-ux-pv-pux.md** — conteúdo da §12.5
- **09-checklist-adocao-sse.md** — passo 3 do checklist é criar a Bússola
