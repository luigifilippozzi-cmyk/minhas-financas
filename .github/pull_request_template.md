## 📝 Descrição
<!-- Descreva as mudanças feitas neste PR -->

## 🎯 Issue Relacionada
<!-- Use "Closes #XX" para fechar a issue automaticamente ao fazer merge -->
Closes #

## 🔄 Tipo de Mudança
- [ ] 🐛 Bug fix (corrige um problema sem quebrar funcionalidades existentes)
- [ ] ✨ Nova funcionalidade (adiciona uma funcionalidade sem quebrar existentes)
- [ ] 💥 Breaking change (mudança que pode quebrar funcionalidades existentes)
- [ ] 📚 Documentação (mudanças apenas em documentação)
- [ ] 🎨 Style (formatação, sem mudança de lógica)
- [ ] ♻️ Refactor (refatoração sem nova funcionalidade ou correção de bug)

## ✅ Checklist
- [ ] Meu código segue as convenções do projeto
- [ ] Fiz self-review do meu próprio código
- [ ] O CHANGELOG.md foi atualizado
- [ ] `npm test` passando (851+ testes)
- [ ] Sem credenciais Firebase no diff

## 🎨 UI/CSS — Regra Inviolável #14 (pular se PR não toca HTML/CSS/innerHTML)
> Se este PR toca `src/**/*.html`, `src/css/**/*.css` ou templates inline em `src/js/pages/*.js` (innerHTML), preencher obrigatoriamente:

- [ ] **`ux-reviewer` acionado** — relatório PUX1–PUX6 anexado abaixo
- [ ] Tokens de `variables.css` usados — zero hex/rgb/rem hardcoded
- [ ] `escHTML()` em todo `innerHTML` com dados do usuário
- [ ] Testado em viewport 375px, 414px e desktop

### Relatório ux-reviewer (obrigatório se checkboxes acima marcados)
<!-- Cole aqui o output do subagente ux-reviewer -->

## 📸 Screenshots (se aplicável)
<!-- Adicione screenshots para mudanças visuais -->

## 📎 Notas Adicionais
<!-- Qualquer informação adicional relevante para os revisores -->
