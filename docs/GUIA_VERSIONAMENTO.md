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

### Roadmap de Versões

| Versão | Milestone |
|--------|-----------|
| v0.1.0 | Autenticação Firebase |
| v0.2.0 | Sistema de Grupos |
| v0.3.0 | Categorias Editáveis |
| v0.4.0 | CRUD de Despesas |
| v0.5.0 | Dashboard de Orçamentos |
| v1.0.0 | Release Oficial |

## Workflow Completo

```
1. Criar Issue no GitHub
2. Mover para "In Progress" no Projects Board
3. git checkout -b feature/nome-da-feature
4. Desenvolver (commits frequentes e pequenos)
5. git push origin feature/nome-da-feature
6. Criar Pull Request → vincular issue: "Closes #XX"
7. Self-review
8. Merge para develop
9. Atualizar CHANGELOG.md
10. Fechar Issue
```

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
