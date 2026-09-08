# DMS FLOW

Gestão operacional inteligente para empresas funerárias.

## Status

🚧 Fase 1 (base) e Fase 2 (banco de dados) concluídas. Nenhum módulo de
negócio (telas de serviços, veículos, etc.) implementado ainda — isso
começa na Fase 7. Veja `ARCHITECTURE.md` e `DATABASE.md` para os detalhes.

## Requisitos

- Node.js 20+
- Docker (para o PostgreSQL de desenvolvimento)

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# gere um AUTH_SECRET com: npx auth secret

# 3. Subir o banco de dados
docker compose up -d

# 4. Gerar o client do Prisma
npm run db:generate

# 5. Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Documentação

- `DATABASE.md` — modelo de dados completo, decisões de schema e como gerar migrations
- `ARCHITECTURE.md` — arquitetura e decisões técnicas
- `API.md` — documentação de endpoints (a partir da Fase 3 completa)
- `SECURITY.md`, `PERMISSIONS.md`, `BILLING.md`, `DEPLOY.md`,
  `ENVIRONMENT.md`, `TESTING.md` — adicionados progressivamente conforme
  as fases correspondentes forem implementadas.
