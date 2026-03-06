# 🏗️ Arquitetura Técnica — Minhas Finanças

## Stack Tecnológico

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend | HTML5 + CSS3 + JS ES6+ | Sem frameworks — foco no aprendizado base |
| Autenticação | Firebase Authentication | Solução robusta, sem backend próprio |
| Banco de Dados | Cloud Firestore | NoSQL em tempo real, escalável |
| Hospedagem | Firebase Hosting | CDN global, HTTPS automático |

## Estrutura do Firestore

```
firestore/
├── usuarios/{userId}
│   ├── email: string
│   ├── nome: string
│   ├── grupoId: string
│   └── dataCriacao: timestamp
│
├── grupos/{grupoId}
│   ├── nome: string
│   ├── membros: [userId1, userId2]
│   ├── codigoConvite: string (6 chars)
│   └── dataCriacao: timestamp
│
├── categorias/{categoriaId}
│   ├── grupoId: string
│   ├── nome: string
│   ├── emoji: string
│   ├── cor: string (hex)
│   ├── orcamentoMensal: number
│   └── ativa: boolean
│
├── despesas/{despesaId}
│   ├── grupoId: string
│   ├── categoriaId: string
│   ├── usuarioId: string
│   ├── descricao: string
│   ├── valor: number
│   ├── data: timestamp
│   └── dataCriacao: timestamp
│
└── orcamentos/{orcamentoId}
    ├── grupoId: string
    ├── categoriaId: string
    ├── mes: number (1-12)
    ├── ano: number
    ├── valorLimite: number
    └── valorGasto: number (calculado)
```

## Categorias Padrão

Criadas automaticamente ao criar um novo grupo:

```javascript
[
  { nome: 'Alimentação', emoji: '🍔', cor: '#FF6B6B' },
  { nome: 'Transporte',  emoji: '🚗', cor: '#4ECDC4' },
  { nome: 'Saúde',       emoji: '🏥', cor: '#45B7D1' },
  { nome: 'Lazer',       emoji: '🎮', cor: '#FFA07A' },
  { nome: 'Educação',    emoji: '📚', cor: '#98D8C8' },
  { nome: 'Outros',      emoji: '📦', cor: '#95A5A6' },
]
```

## Estratégia de Branches

```
main          → produção (somente código estável)
└── develop   → desenvolvimento ativo
    ├── feature/auth-firebase
    ├── feature/grupos-familiares
    ├── feature/categorias-editaveis
    └── feature/sistema-orcamentos
```

## Fluxo de Dados

1. Usuário interage com a UI
2. Controller captura o evento
3. Service realiza a operação no Firestore
4. Listener do Firestore detecta mudança
5. UI é atualizada automaticamente (tempo real)

## Regras de Segurança

Veja `firestore.rules` na raiz do projeto. Princípios:
- Usuário autenticado só acessa seus próprios dados de perfil
- Dados do grupo (categorias, despesas, orçamentos) só são acessíveis por membros do grupo
- Validação tanto no client quanto no servidor (Firestore Rules)
