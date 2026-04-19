# Design System — Minhas Finanças

Fonte única da verdade para decisões visuais do MF.

## Arquivos

- **`tokens.md`** — especificação humana (leia antes de qualquer task de UI).
- **`preview/`** — componentes renderizados isoladamente, funcionam como mini-Storybook.

> **Nota:** `src/css/variables.css` é a fonte técnica canônica dos tokens CSS.
> O arquivo `tokens.md` documenta semântica e uso; `variables.css` é a implementação.
> Não existe `tokens.css` separado — importe sempre `src/css/variables.css`.

## Como usar no app

O entry point já importa `variables.css`:

```css
/* src/css/main.css já importa variables.css — não duplicar */
/* Para consumir tokens em qualquer componente, use var(--color-*), var(--font-*), etc. */
```

Exemplo:

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
  font-family: var(--font-ui);
}

.valor-monetario {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  color: var(--color-expense); /* ou --color-income */
}
```

## Como contribuir

1. Qualquer mudança visual deve refletir primeiro em `src/css/variables.css`.
2. Atualizar a documentação em `tokens.md` na mesma sessão.
3. Novo componente canônico → adicionar seção em `tokens.md` §8 + preview em `preview/`.
4. Decisão de design controversa → registrar ADR em `.auto-memory/design-decisions.md`.

## Formalização

Este Design System foi formalizado na v3.34.0 a partir do NRF-UI-WARM (v3.32.0),
que entregou a identidade visual Warm Finance já em produção.
Ver `CHANGELOG.md` §[3.34.0] e `.auto-memory/design-decisions.md` para o ADR inicial.
