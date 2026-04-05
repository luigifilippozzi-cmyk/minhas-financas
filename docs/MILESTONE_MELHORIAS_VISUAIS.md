# MILESTONE — Melhorias Visuais (Clean, Fluido e Intuitivo)

## Status
- **Estado:** Em andamento
- **Versão alvo:** v1.3.0
- **Janela sugerida:** 3 sprints (3 semanas)
- **Documento de acompanhamento:** este arquivo (checklist vivo)

## Objetivo do milestone
Elevar a qualidade visual e de usabilidade do produto com foco em:
1. reduzir ruído visual;
2. melhorar hierarquia de informação;
3. tornar navegação e ações mais intuitivas em desktop e mobile;
4. padronizar componentes para evolução sustentável.

## Escopo do milestone
### Incluído
- Refino visual do dashboard e páginas principais.
- Padronização de tipografia, espaçamento, ícones e estados.
- Melhorias de responsividade e microinterações.
- Revisão de estados de carregamento, vazio e erro.

### Fora de escopo (neste ciclo)
- Redesign completo de regras de negócio.
- Mudanças profundas de arquitetura front-end.
- Reescrita total de todas as telas legadas.

---

## Critérios de sucesso (Definition of Done do milestone)
- [x] Dashboard com nova hierarquia visual aplicada. *(Épico A — 2026-03-28)*
- [ ] Navegação principal simplificada e consistente.
- [ ] Padrão visual documentado (cores, tipografia, espaçamento, estados).
- [ ] Responsividade validada para mobile/tablet/desktop.
- [ ] Métricas mínimas atingidas (tempo de tarefa e redução de erro de navegação).

## KPIs de validação
- **Tempo para registrar despesa:** reduzir em **20%+**.
- **Erros de navegação:** reduzir em **15%+**.
- **Uso dos filtros do dashboard:** aumentar em **25%+**.
- **Satisfação de usabilidade (NPS interno):** atingir **>= 8/10**.

---

## Backlog do milestone (épicos e entregáveis)

### Épico A — Hierarquia e composição do dashboard ✅ *2026-03-28*
**Objetivo:** deixar informação crítica mais evidente em menos tempo de leitura.

- [x] Reorganizar dashboard em blocos: **KPI → Categorias → Gráficos**.
- [x] Destacar 4 KPIs principais no primeiro viewport.
- [x] Reduzir densidade visual no topo da tela.
- [x] Revisar pesos de títulos/subtítulos/cards.

**Entregável:** dashboard com escaneabilidade melhorada e foco em decisão rápida.

### Épico B — Sistema visual unificado ✅ *2026-04-04*
**Objetivo:** criar consistência entre páginas e componentes.

- [x] Padronizar paleta (primária, sucesso, alerta, crítico, neutros).
- [x] Definir tipografia base (H1/H2/corpo/legenda).
- [x] Aplicar grid de espaçamento em múltiplos de 8px.
- [x] Substituir emojis de ações por ícones consistentes (Lucide Icons).

**Entregável:** base visual coesa e reutilizável.

### Épico C — Fluidez e responsividade
**Objetivo:** melhorar experiência em diferentes tamanhos de tela.

- [ ] Ajustar breakpoints (mobile/tablet/desktop).
- [ ] Garantir layout de 1 coluna em mobile para áreas críticas.
- [ ] Preservar CTA principal visível em mobile (ex.: Nova Despesa).
- [ ] Melhorar filtros para uso por toque (barra rolável ou sheet).

**Entregável:** navegação fluida em telas pequenas e médias.

### Épico D — Feedback e microinterações *(parcial — 2026-04-05)*
**Objetivo:** aumentar previsibilidade e sensação de qualidade.

- [x] Implementar estados visuais de **carregando/vazio/erro** (`.empty-state`, `.error-state`).
- [x] Adotar skeleton loading para blocos de dados (`.skeleton`, `.skeleton-line`, `.skeleton-card`).
- [x] Definir transições curtas e consistentes (tokens `--transition` 160ms / `--transition-slow` 280ms + `.fade-in`).
- [x] Aplicar semáforo de orçamento (<70 / 70–89 / >=90 / >100 crítico).

**Entregável:** interface mais clara, estável e reativa.

---

## Plano por sprint

### Sprint 1 — Fundação visual
- [x] Simplificar navbar e hierarquia do dashboard.
- [x] Aplicar tokens de tipografia e espaçamento.
- [x] Validar contraste básico e leitura. *(2026-04-05 — `--color-text-muted` ajustado para Slate 500)*

### Sprint 2 — Responsividade e interação
- [ ] Ajustes mobile/tablet nas principais páginas.
- [ ] Estados de carregamento/vazio/erro.
- [ ] Microinterações (hover/focus/transições).

### Sprint 3 — Polimento e validação
- [ ] Ajustes finais orientados por uso real.
- [ ] Rodada de validação com KPIs definidos.
- [ ] Fechamento do milestone e lições aprendidas.

---

## Riscos e mitigação
- **Risco:** mudanças visuais sem impacto real em produtividade.  
  **Mitigação:** medir KPIs antes/depois e ajustar por evidência.

- **Risco:** inconsistência entre páginas novas e antigas.  
  **Mitigação:** checklist de padrões visuais por tela tocada.

- **Risco:** regressão de usabilidade em mobile.  
  **Mitigação:** validação obrigatória em viewport mobile por sprint.

## Governança do milestone
- Atualizar este checklist a cada entrega relevante.
- Toda PR visual deve referenciar ao menos 1 item deste milestone.
- Encerrar milestone apenas quando critérios de sucesso e KPIs mínimos forem avaliados.
