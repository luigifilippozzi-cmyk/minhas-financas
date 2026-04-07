# 💰 Minhas Finanças

> Aplicativo web de gestão financeira familiar com sincronização em tempo real via Firebase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)](https://firebase.google.com)
[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)]()
[![Font: Inter](https://img.shields.io/badge/Font-Inter-informational)](https://github.com/rsms/inter)
[![Design: shadcn/ui](https://img.shields.io/badge/Design-shadcn%2Fui-black)](https://github.com/shadcn-ui/ui)

## 📋 Sobre

**Minhas Finanças** é um Progressive Web App para gestão compartilhada de finanças entre casais e famílias. Permite registrar despesas, definir orçamentos mensais por categoria e acompanhar o gasto em tempo real entre os membros do grupo.

## ✨ Funcionalidades

- 🔐 Login e cadastro com Firebase Authentication
- 👨‍👩‍👧 Grupos familiares com código de convite
- 🏷️ Categorias personalizáveis (nome, emoji, cor)
- 💸 Registro e gestão de despesas (CRUD + exportação CSV)
- 📥 Registro e gestão de **receitas** por categoria (Salário, Freelance, Rendimentos…)
- 📊 Dashboard com orçamentos, receitas, saldo e alertas visuais
- 📈 Fluxo de Caixa anual com gráfico combinado (Chart.js) e visão orçamentária mês a mês
- 👫 Divisão de contas conjuntas com chips por usuário
- 🏦 Identificação de conta/banco por transação (Itaú, Bradesco, XP, Santander, BTG, Nubank, Inter, Caixa, BB, Cartão de Crédito…)
- 💳 **Fatura do Cartão de Crédito**: fechamento mensal automático com segregação por responsável, divisão 50/50 de conjuntas, projeções de parcelas futuras e exportação Excel
- 📤 Importação de extratos Excel/CSV com reconhecimento automático de banco, deduplicação e projeção de parcelas — inclui **template XLSX padronizado** (3 colunas: Data, Descrição, Valor) com classificação automática por sinal
- 🔄 Sincronização em tempo real entre membros (Firestore onSnapshot)

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org) (v18+)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Conta no [Firebase Console](https://console.firebase.google.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/minhas-financas.git
cd minhas-financas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Execute localmente
npm start
```

## 🏗️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Autenticação | Firebase Authentication |
| Banco de Dados | Cloud Firestore |
| Hospedagem | Firebase Hosting |
| Gráficos | [Chart.js v4](https://github.com/chartjs/Chart.js) (MIT) |
| Tipografia | [Inter](https://github.com/rsms/inter) via Google Fonts (SIL OFL) |
| Design System | Inspirado em [shadcn/ui](https://github.com/shadcn-ui/ui) (MIT) + [Tremor](https://github.com/tremorlabs/tremor) (Apache 2.0) |

## 📁 Estrutura do Projeto

```
minhas-financas/
├── .github/          # Templates de Issues e PRs
├── docs/             # Documentação do projeto
├── src/
│   ├── css/          # Estilos
│   ├── js/           # Lógica da aplicação
│   │   ├── config/   # Configuração Firebase
│   │   ├── services/ # Serviços (auth, database)
│   │   ├── models/   # Modelos de dados
│   │   ├── controllers/ # Controladores
│   │   └── utils/    # Utilitários
│   ├── assets/       # Imagens e ícones
│   ├── index.html    # Dashboard principal
│   └── login.html    # Tela de autenticação
├── firestore.rules   # Regras de segurança
└── firebase.json     # Configuração Firebase
```

## 🗺️ Roadmap

- [x] v1.0.0 — Autenticação, Grupos, Categorias, Despesas, Orçamentos, Dashboard
- [x] v1.1.0 — Importação de extratos, Recuperação de senha, Reconciliação fuzzy
- [x] v1.2.0 — Contas conjuntas (NRF-001), chips por usuário
- [x] v1.3.0 — Módulo de Receitas (RF-016) com dashboard e página de gestão
- [x] v1.4.0 — Fluxo de Caixa anual (NRF-003) com Chart.js, tabela e badges de situação
- [x] v1.5.0 — Redesign visual completo: Inter font, shadcn/ui + Tremor design system
- [x] v1.6.0 — NRF-004: Identificação de conta/banco por transação + seleção no import
- [x] v1.7.0 — NRF-005: Fatura do Cartão de Crédito (fechamento mensal, projeções)
- [x] v1.8.0 — NRF-008: Deduplicação de transações no import (chave única por transação)
- [x] v1.9.0 — NRF-002.1: Importação de fatura de cartão CSV nativo (parcelas, portador)
- [x] v2.0.0 — NRF-006: Detecção automática de tipo de extrato no upload
- [x] v2.1.0 — RF-017: Dashboard como tela inicial com gráficos (Chart.js)
- [x] v2.2.0 — RF-018: Centralização da base de dados (4 abas: Importar · Duplicatas · Gerenciar · Limpeza)
- [x] v2.3.0 — RF-019: Preenchimento automático de conta/banco no preview
- [x] v2.4.0 — RF-020: Classificação automática por sinal + importação de PDF bancário
- [x] v2.6.0 — RF-021: Motor de detecção e identificação de banco (15 bancos/emissores)
- [x] v3.0.0 — RF-013: Pipeline unificado de ingestão (pipelineCartao/pipelineBanco/deduplicador)
- [x] v3.1.0 — NRF-002.2: Detecção de ajustes parciais marketplace-aware
- [x] v3.2.0 — NRF-009: Responsável por transação no import (auto-atribuição portador)
- [x] v3.3.0 — RF-023: Edição em massa de transações — responsável dinâmico
- [x] v3.4.0 — NRF-010: Portador "Conjunto" no upload de fatura (divisão 50/50)
- [x] v3.5.0 — Fix NRF-002.2: ajustes parciais completamente inoperantes (BUG-017/018)
- [x] v3.6.0 — Fix importação: estornos importáveis, valores decimais corretos, última parcela incluída
- [x] v3.7.0 — Fix BUG-019: estornos marcados por padrão no preview (créditos da fatura)
- [x] v3.8.0 — Fix BUG-021/022: ciclo de faturamento modelado com campo `mesFatura`
- [x] v3.9.x — Correções BUG-023 a BUG-027: reconciliação de parcelas, propagação de `mesFatura`, suporte a extrato Bradesco (Crédito/Débito separados)
- [x] v3.10.0 — RF-024: Importação via template XLSX padronizado (3 colunas, classificação por sinal)
- [ ] v4.0.0 — App iOS via Capacitor (projeto paralelo em andamento)

## 🤝 Contribuindo

Este é um projeto de aprendizado open source. Contribuições são bem-vindas!

1. Fork o repositório
2. Crie sua branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

Feito com ❤️ por Luigi — São Paulo, Brasil
