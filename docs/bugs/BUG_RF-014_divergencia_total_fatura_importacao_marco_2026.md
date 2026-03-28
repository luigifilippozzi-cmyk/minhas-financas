# [BUG] RF-014/NRF-002.1 — Divergência entre total da fatura oficial e total processado na aplicação (Março/2026)

## Status
- **Severidade:** Alta
- **Prioridade sugerida:** P1
- **Tipo:** Bug funcional (importação e fechamento de fatura)
- **Módulos afetados:** `importar.html` / `src/js/pages/importar.js` / `fatura.html`
- **Labels sugeridas (GitHub):** `bug`, `rf-014`, `nrf-002`, `nrf-006`, `alta-prioridade`
- **Milestone sugerida:** `RF-014 / Fatura Cartão`
- **Issue GitHub:** `PENDENTE_ABERTURA` (abrir em `/issues/new` com este conteúdo)

---

## Contexto

Ao importar a fatura oficial (`Fatura2026-04-05 (1)`) para o ciclo de **Março/2026**, o total e a composição de lançamentos na aplicação (`fatura-cartão-de-crédito-2026-03`) não batem com o extrato da operadora.

O problema é recorrente e já foi observado com diferença entre:
1. **Registros processados** pela aplicação (lista exportada/visualizada na fatura); e
2. **Extrato oficial** do cartão para o mesmo ciclo.

---

## Evidências principais recebidas

### 1) Registros processados pela aplicação (amostra recebida)
- Contém principalmente lançamentos com data de março/2026
- Mostra divisão por responsável (Ana / Luigi / Conjunta 50/50)
- Inclui `Parcela de Refinanciamento com Juros` (`01/02`) no valor de `10.366,26`
- Não apresenta diversos itens parcelados históricos exibidos no extrato oficial

### 2) Extrato oficial da operadora (Março/2026)
- Contém vários itens parcelados com **data de compra antiga** (2025 e início de 2026) cobrados no ciclo de março
- Contém também lançamentos negativos (estornos/créditos), ex:
  - `MERCADOLIVRE*22PRODUTOS -R$ 24,99`
  - `IFD*HNT COMERCIO HORTI -R$ 72,67`
- Contém linhas financeiras (`Pagamento de fatura`, `Credito de Refinanciamento...`) além de compras

---

## Hipótese técnica (causa provável)

### A) Créditos/estornos do cartão são descartados no modo `cartao`
No fluxo de importação, ao aplicar tipo `cartao`, linhas com `isCredito` viram erro e não são importadas:

```js
if (tipo === 'cartao') {
  _linhas.forEach((l) => { if (l.isCredito && !l.erro) l.erro = 'Crédito/estorno — não importado'; });
}
```

Isso pode causar divergência com o total oficial da fatura quando há estornos no ciclo.

### B) Linhas financeiras são removidas por regex antes do preview/import
Há exclusão explícita de linhas como `pagamento de fatura` e `credito de refinanciamento`:

```js
if (/pagamento de fatura|inclusao de pagamento|inclusão de pagamento|parcela de fatura rotativo|credito de refinanciamento/i.test(estabLow)) continue;
```

Dependendo da regra de negócio de conferência adotada, a exclusão pode ser correta para “compras”, mas não para reconciliação de total bruto da fatura.

### C) Reconciliação/deduplicação pode ocultar parcelas esperadas
O fluxo marca duplicatas e substituições de projeção antes da importação final. Em cenário de projeções pré-existentes, parte dos lançamentos pode não entrar como novo registro (fica desmarcado no preview por padrão), afetando a percepção de total processado.

---

## Passos para reproduzir (proposto)

1. Acessar `importar.html` com um grupo que já possua projeções/parcelamentos.
2. Importar o arquivo oficial `Fatura2026-04-05 (1)` no tipo `cartao`.
3. Selecionar mês de fatura `2026-03`.
4. Concluir importação padrão (sem marcar manualmente linhas com erro/duplicadas).
5. Abrir `fatura.html` no período março/2026 e comparar:
   - total da fatura no app
   - total do extrato oficial
   - contagem de linhas por tipo (avista/parcelada/estorno).

---

## Resultado esperado

- O app deve permitir uma conferência rastreável do total oficial, com clareza de quais linhas foram:
  - importadas como despesas;
  - ignoradas por regra (pagamento/crédito/refinanciamento);
  - tratadas como estorno;
  - marcadas como duplicadas/reconciliadas.

---

## Resultado obtido

- Persistem diferenças entre total da fatura oficial e total processado.
- Usuário não consegue reconciliar facilmente “o que entrou vs o que foi ignorado” no fluxo atual.

---

## Impacto

- Reduz confiança no fechamento da fatura.
- Pode gerar decisões financeiras incorretas por divergência de total.
- Aumenta esforço manual de auditoria linha a linha.

---

## Recomendação de correção (para agente implementador)

1. Adicionar modo de importação com **reconciliação contábil**:
   - `compras` (comportamento atual) e
   - `conferencia_fatura` (inclui estornos como ajuste negativo no resumo).
2. Exibir relatório pós-import com contadores:
   - importadas,
   - ignoradas por regra financeira,
   - estornos/créditos,
   - duplicadas,
   - reconciliadas por projeção.
3. Persistir um artefato de auditoria por importação (snapshot resumido).
4. Garantir export de conferência para facilitar comparação com operadora.

---

## Referências de código

- `src/js/pages/importar.js` — aplicação de tipo/cartão e descarte de créditos.
- `src/js/pages/importar.js` — filtro regex de linhas financeiras.
- `src/js/pages/importar.js` — deduplicação/reconciliação no preview.
