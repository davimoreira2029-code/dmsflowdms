# Arquitetura — DMS FLOW

## Visão geral

DMS FLOW é um monolito modular construído em Next.js (App Router), servindo
tanto o frontend quanto a API (via Route Handlers). Essa escolha reduz a
superfície de infraestrutura do MVP sem impedir uma futura extração da API
para um serviço dedicado — a lógica de negócio já vive isolada em
`src/server/services`, independente do transporte HTTP.

## Camadas

```
Rota (app/api/**)       → validação de entrada (zod) + chamada ao service
server/guards           → autenticação, RBAC, isolamento de tenant
server/services         → regra de negócio, orquestração
server/repositories     → acesso a dados via Prisma, sempre escopado por company_id
```

Nenhuma rota acessa o Prisma diretamente. Nenhum repositório aceita um
`companyId` vindo de input do cliente — ele é sempre resolvido a partir da
sessão autenticada em `server/context.ts`.

## Multi-tenancy

Regra física, não apenas convencional:

1. Toda tabela de domínio tem `company_id`.
2. Todo repositório recebe `companyId` como parâmetro obrigatório, resolvido
   no servidor — nunca do body/query/params da requisição.
3. Busca por ID sempre filtra por `id + company_id`; se o registro pertence a
   outra empresa, o resultado é 404 (não 403), para não vazar existência.
4. Testes automatizados garantem que um usuário da Empresa B nunca acessa
   recursos da Empresa A (ver `TESTING.md`, a partir da Fase 18).

## Autenticação

Auth.js (Credentials Provider) com sessão persistida em banco via
`@auth/prisma-adapter` — permite invalidação imediata de sessão (bloqueio de
usuário/empresa) sem depender de expiração de JWT.

## Decisões e trade-offs

| Decisão | Alternativa considerada | Motivo da escolha |
|---|---|---|
| API via Route Handlers do Next.js | Backend Node separado (Express/Fastify) | Menos infraestrutura, sem CORS entre front/back, deploy único no MVP |
| Sessão em banco (Auth.js) | JWT stateless | Invalidação imediata de sessão é necessária para bloqueio de empresa/usuário |
| PostgreSQL + Prisma | Outro ORM / SQL cru | Migrations versionadas, type-safety ponta a ponta, suporte robusto a relações |

## Estrutura de pastas

Ver `README.md` para instruções de execução. A árvore completa de pastas
reflete a separação por domínio (`features/`) e por camada (`server/`),
evitando arquivos gigantes e lógica de negócio espalhada pelo frontend.

## Recuperação de senha controlada pelo Super Admin

Diferente do padrão de mercado (link automático por e-mail para o próprio
usuário), o DMS FLOW exige aprovação humana do `SUPER_ADMIN` para toda
redefinição de senha:

```
Usuário → /esqueci-senha → password_reset_requests (PENDING)
        → e-mail para ADMIN_EMAIL
        → Super Admin analisa em /admin/password-recovery
        → Aprova (define senha temporária) ou Rejeita
        → Se aprovar: must_change_password=true, session_version++
        → Usuário loga com a senha temporária → força troca em /change-password
        → Todas as etapas geram audit_logs
```

`session_version` é a peça que permite "invalidar sessões existentes"
sem sessão em banco: incrementado a cada redefinição administrativa, é
conferido a cada requisição no callback `jwt` do Auth.js (`server/auth.ts`)
— se o valor do token não bater com o do banco, a sessão é derrubada.

## Próximas fases

Ver seção "Ordem obrigatória de implementação" combinada com o usuário —
Fase 2 (Banco: schema completo, migrations, seed) é a próxima etapa.
