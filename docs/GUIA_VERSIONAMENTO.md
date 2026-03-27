# 📦 Guia de Versionamento — Minhas Finanças

## Conventional Commits

Todo commit deve seguir o padrão:

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional — mais detalhes]

[rodapé opcional — ex: Closes #12]
```

### Tipos de Commit

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `feat` | Nova funcionalidade | `feat(auth): adiciona login com Google` |
| `fix` | Correção de bug | `fix(despesas): corrige cálculo de total` |
| `docs` | Documentação | `docs(readme): atualiza instruções de instalação` |
| `style` | Formatação, sem mudança de lógica | `style(css): ajusta espaçamento do header` |
| `refactor` | Refatoração sem nova feat ou fix | `refactor(database): simplifica query de despesas` |
| `test` | Testes | `test(auth): adiciona teste de login inválido` |
| `chore` | Manutenção geral | `chore: atualiza dependências` |

## Semantic Versioning (SemVer)

Formato: `MAJOR.MINOR.PATCH` — ex: `v1.2.3`

| Campo | Quando incrementar |
|-------|-------------------|
| MAJOR | Mudanças incompatíveis com versões anteriores |
| MINOR | Nova funcionalidade compatível com versões anteriores |
| PATCH | Correção de bug compatível com versões anteriores |

### Histórico de Versões

| Versão | Data | Milestone |
|--------|------|-----------|
| v0.1.0 | 2026-01 | Autenticação Firebase |
| v0.2.0 | 2026-01 | Sistema de Grupos |
| v0.3.0 | 2026-01 | Categorias Editáveis |
| v0.4.0 | 2026-01 | CRUD de Despesas |
| v0.5.0 | 2026-01 | Dashboard de Orçamentos |
| v1.0.0 | 2026-02 | Release Oficial — RF-001 a RF-014 completos |
| v1.5.0 | 2026-02 | NRF-001 Contas Compartilhadas + NRF-003 Fluxo de Caixa |
| v1.8.0 | 2026-02 | NRF-005 Fatura do Cartão + NRF-004 Identificação de Conta |
| v1.9.0 | 2026-03 | NRF-002.1 CSV nativo de fatura + Reconciliação fuzzy |
| v2.0.0 | 2026-03 | NRF-006 Detecção automática de tipo de extrato |
| v2.1.0 | 2026-03 | RF-017 Dashboard com gráficos Chart.js |
| v2.2.0 | 2026-03 | RF-018 Base de Dados centralizada (4 abas) |
| v2.3.0 | 2026-03 | RF-019 Bug fix: Conta/Banco automático no preview |
| v2.4.0 | 2026-03 | RF-020 Importação PDF + classificação automática por sinal |
| v2.6.0 | 2026-03 | RF-021 Motor de detecção + identificação de banco/emissor |
| v2.6.1 | 2026-03 | RF-022 Categorização inteligente sensível à origem (banco) |
| v3.0.0 | 2026-03-26 | RF-013 Pipeline Unificado de Ingestão (4 módulos pipeline) |
| v3.0.1 | 2026-03-26 | Correção de 8 bugs (BUG-001 a BUG-008) identificados em auditoria |
| v3.0.2 | 2026-03-27 | Correção de 4 bugs (BUG-009 a BUG-012): parcelamento_id, chip erros, isNegativo, separador CSV |
| v3.1.0 | 2026-03-27 | NRF-002.2 Ajustes parciais marketplace/supermercado (iFood, Mambo, etc.) |
| v3.2.0 | 2026-03-27 | NRF-009 Responsável por Transação: auto-assign banco + seletor cartão |
| v3.3.0 | 2026-03-27 | RF-023 Edição em massa de responsável na aba Gerenciar |
| v3.4.0 | 2026-03-27 | NRF-010 Portador "Conjunto" no upload de fatura de cartão |

### Próximas Versões (Backlog)

| Versão | Milestone Planejado |
|--------|---------------------|
| v3.5.0 | App iOS via Capacitor (MILESTONE_iOS_App.md) |

## Workflow Completo

```
1. Criar Issue no GitHub (ou especificar RF no doc REQUISITOS_FUNCIONAIS)
2. Desenvolver diretamente na branch main (projeto pessoal, sem PRs)
3. git add <arquivos>
4. git commit -m "feat|fix|docs: descrição (vX.Y.Z)"
5. git push origin main
6. firebase deploy --only hosting
7. Atualizar CHANGELOG.md e REQUISITOS_FUNCIONAIS.md
8. Fechar Issue
```

> **Nota:** O projeto é de uso pessoal/familiar. O workflow simplificado (direto na `main` sem PRs) é intencional — velocidade de iteração tem prioridade sobre processo formal.

## Comandos Git Essenciais

```bash
git status                        # Ver estado atual
git add arquivo.js                # Adicionar arquivo específico
git add .                         # Adicionar todos os arquivos
git commit -m "feat: mensagem"    # Fazer commit
git push                          # Enviar para GitHub
git pull                          # Atualizar do GitHub
git log --oneline                 # Ver histórico resumido
git checkout -b feature/nome      # Criar nova branch
git checkout nome-branch          # Trocar de branch
git branch -a                     # Listar todas as branches
git merge nome-branch             # Fazer merge
```
