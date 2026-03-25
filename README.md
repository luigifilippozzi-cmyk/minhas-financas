# 💰 Minhas Finanças

> Aplicativo web de gestão financeira familiar com sincronização em tempo real via Firebase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)](https://firebase.google.com)
[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)]()

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
- 📤 Importação de extratos Excel com deduplicação e projeção de parcelas
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
- [x] v1.2.0 — Contas conjuntas (NRF-001), chips por usuário, correção bug #90
- [x] v1.3.0 — Módulo de Receitas (RF-016) com dashboard e página de gestão
- [x] v1.4.0 — Fluxo de Caixa anual (NRF-003) com Chart.js, tabela e badges de situação
- [ ] v1.5.0 — Notificações de orçamento e alertas de saldo
- [ ] v2.0.0 — App iOS via Capacitor

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
