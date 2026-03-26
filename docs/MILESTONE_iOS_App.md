# Milestone: App Mobile iOS — Minhas Finanças

> **Status:** ✅ Pronto para iniciar — Web estável em v2.3.0
> **Tipo:** Nova Funcionalidade (branch dedicado: `feat/ios-capacitor`)
> **Distribuição:** Privada via TestFlight → App Store (fase futura)
> **Stack:** Capacitor (Ionic) + Firebase JS SDK + capawesome-team/capacitor-firebase
> **Web base:** https://minhas-financas-285da.web.app (v2.3.0 — RF-001 a RF-019 implementados)

---

## Decisão de Estratégia

Após análise das quatro abordagens disponíveis, a estratégia adotada é **Capacitor**.

### Por que Capacitor?

| Critério | PWA | **Capacitor** ✅ | React Native | Flutter |
|---|---|---|---|---|
| Reuso do código atual | ~90% | **~90%** | 0% | 0% |
| Nova linguagem | Não | **Não (JS)** | Não (React) | Sim (Dart) |
| App real na App Store | Não | **Sim** | Sim | Sim |
| Background sync iOS | Não | **Sim (nativo)** | Sim | Sim |
| Push notifications | Parcial | **Completo** | Completo | Completo |
| Face ID / Biometria | Não | **Sim (plugin)** | Sim | Sim |
| TestFlight | Não | **Sim** | Sim | Sim |
| Mesmo código do web | Sim | **Sim** | Não | Não |
| Esforço estimado | 1–3 dias | **1–2 semanas** | 6–10 semanas | 8–14 semanas |

**Capacitor empacota o HTML/CSS/JS existente em uma shell iOS nativa via WKWebView.**
Não há reescrita. Bugs corrigidos no web chegam ao iOS com `npx cap sync`.

### Repos de Referência (Open Source)

- [`ionic-team/capacitor`](https://github.com/ionic-team/capacitor) — 12k+ ⭐ — runtime principal
- [`capawesome-team/capacitor-firebase`](https://github.com/capawesome-team/capacitor-firebase) — plugins nativos para Auth, Firestore, FCM, App Check
- [`robingenz/capacitor-firebase-plugin-demo`](https://github.com/robingenz/capacitor-firebase-plugin-demo) — demo completo Auth + Firestore + FCM
- [`riderx/awesome-capacitor`](https://github.com/riderx/awesome-capacitor) — lista curada de plugins

---

## Fases do Milestone

### Fase 0 — Pré-requisito: Bundler (Vite)
> **Capacitor requer um bundler.** O app atual usa ES modules sem build step.

**Tarefas:**
- [ ] Instalar Vite como bundler (`npm i -D vite`)
- [ ] Configurar `vite.config.js` para MPA (multi-page: dashboard, despesas, categorias, orçamentos, etc.)
- [ ] Garantir que `npm run build` gera `dist/` com todos os HTMLs funcionais
- [ ] Testar app localmente via `npm run dev` sem regressões
- [ ] Ajustar imports de Firebase SDK (CDN → npm)

**Esforço:** 2–4 dias
**Impacto no web:** nenhum — o deploy para Firebase Hosting continua igual, apenas `dist/` em vez de `src/`

---

### Fase 1 — Capacitor: Setup e iOS Platform
> App funcional no simulador iOS.

**Tarefas:**
- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/ios`
- [ ] `npx cap init "Minhas Finanças" "br.com.minhasfinancas"`
- [ ] `npx cap add ios`
- [ ] Configurar `capacitor.config.ts` (webDir: `dist`, server, schemes)
- [ ] Primeiro build: `npm run build && npx cap sync`
- [ ] Abrir no Xcode: `npx cap open ios`
- [ ] Testar no simulador iPhone (Safari/WKWebView)
- [ ] Ajustar safe areas (notch, home bar) via CSS `env(safe-area-inset-*)`

**Esforço:** 2–4 dias

---

### Fase 2 — Firebase Native Integration
> Substituir funcionalidades limitadas do WebView por plugins nativos.

**Plugins necessários:**
```bash
npm install @capawesome-team/capacitor-firebase-authentication
npm install @capawesome-team/capacitor-firebase-firestore
npm install @capawesome-team/capacitor-firebase-messaging  # push notifications
```

**Tarefas:**
- [ ] Adicionar `GoogleService-Info.plist` ao projeto Xcode (do Firebase Console)
- [ ] Configurar Firebase Authentication nativa (email/senha + Google Sign-In)
- [ ] Habilitar Face ID / Touch ID via `@capacitor/biometric-auth` (opcional fase 2)
- [ ] Configurar FCM para push notifications (alertas de orçamento)
- [ ] Testar login/logout no dispositivo físico
- [ ] Verificar sincronização Firestore em background

**Esforço:** 4–8 dias

---

### Fase 3 — Identidade Visual e UX Mobile
> Transformar em app nativo com aparência profissional.

**Tarefas:**
- [ ] Ícones do app (1024×1024 + variações) via `@capacitor/assets`
- [ ] Splash screen animada via `@capacitor/splash-screen`
- [ ] Ajustes de UX mobile: tamanho de toque, scroll, teclado numérico
- [ ] Dark Mode via `prefers-color-scheme` + Capacitor status bar
- [ ] Haptic feedback em ações críticas (`@capacitor/haptics`)
- [ ] Status bar nativa (`@capacitor/status-bar`)

**Esforço:** 3–5 dias

---

### Fase 4 — TestFlight (Distribuição Privada)
> App disponível para Luigi e Ana via TestFlight.

**Tarefas:**
- [ ] Inscrever no Apple Developer Program ($99/ano)
- [ ] Criar App ID e provisioning profile no App Store Connect
- [ ] Configurar signing no Xcode (Team, Bundle ID)
- [ ] Primeiro upload para TestFlight via Xcode Organizer
- [ ] Adicionar testadores internos (Luigi + Ana)
- [ ] Testar instalação e fluxo completo em dispositivos físicos
- [ ] Configurar Fastlane Match para CI/CD automático (GitHub Actions)

**Esforço:** 3–5 dias

---

### Fase 5 — Melhorias Nativas (Backlog)
> Funcionalidades exclusivas do app nativo, adicionadas incrementalmente.

- [ ] Face ID / Touch ID no login
- [ ] Notificações push: alerta quando orçamento atinge 80%
- [ ] Notificação quando a outra pessoa adiciona uma despesa conjunta
- [ ] Widget de tela inicial (iOS 16+ WidgetKit — requer Swift, fase futura)
- [ ] Exportar PDF do relatório mensal (`@capacitor/share` + print)
- [ ] Câmera para fotografar comprovantes (`@capacitor/camera`)
- [ ] App Store Connect: publicação pública (fase futura)

---

## Diagrama de Parallelismo

```
Branch: main (web)     ─────●─────●─────●─────●──────────────────────────►
                            NRF   NRF   fix   fix
Branch: feat/ios-app   ────────────────────────────●─────●─────●─────●──►
                                                  F0   F1+F2  F3   F4
```

- O branch `feat/ios-app` parte de `main` após as NRFs em andamento
- PRs do iOS não impactam o deploy web
- `npm run build && npx cap sync` mantém o iOS sempre em par com o web

---

## Requisitos

| Item | Detalhes |
|---|---|
| Apple Developer Program | $99/ano — necessário para TestFlight |
| Mac com Xcode | Xcode 15+ para compilar e assinar o IPA |
| Node.js 18+ | Para Vite + Capacitor CLI |
| iOS 15+ | Alvo mínimo recomendado |
| Dispositivos de teste | iPhone de Luigi + iPhone de Ana |

> **Alternativa sem Mac:** [Codemagic](https://codemagic.io) ou [Capgo Build](https://capgo.app) compilam na nuvem. Custo ~$15–25/mês durante a fase de setup.

---

## Timeline Estimada

| Fase | Esforço | Sequência |
|---|---|---|
| Fase 0: Vite bundler | 2–4 dias | Após NRFs finalizadas |
| Fase 1: Capacitor + iOS | 2–4 dias | Após Fase 0 |
| Fase 2: Firebase nativo | 4–8 dias | Após Fase 1 |
| Fase 3: UX mobile | 3–5 dias | Paralelo à Fase 2 |
| Fase 4: TestFlight | 3–5 dias | Após Fases 2+3 |
| **Total até TestFlight** | **~3–4 semanas** | — |

---

## Próximo Passo Imediato

Web app estável em **v2.3.0** (RF-001 a RF-019 implementados). Milestone iOS pronto para iniciar.

```bash
# Criar branch dedicado
git checkout -b feat/ios-capacitor

# Instalar Vite
npm install -D vite

# Criar vite.config.js para MPA
# Ver Fase 0 acima para detalhes
```

---

*Documento criado em março/2026 — baseado em análise de repositórios públicos e boas práticas da comunidade Capacitor/Firebase.*
