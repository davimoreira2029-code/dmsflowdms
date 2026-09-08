# Segurança — DMS FLOW

Este documento reflete o que está **realmente implementado**, não uma
lista de intenções.

## Autenticação

- Senha com hash `bcrypt` (custo 12) — nunca texto puro, em lugar nenhum.
- Sessão JWT (não em banco — Credentials Provider do Auth.js não suporta
  sessão em banco). Invalidação de sessão via contador `session_version`
  no usuário, conferido a cada requisição.
- Rate limiting: login limitado a 5 tentativas / 15 min por e-mail;
  recuperação de senha limitada a 3 solicitações / hora por e-mail
  (`server/rate-limit.ts`). **Limitação conhecida:** em memória do
  processo — não compartilhado entre múltiplas instâncias em produção
  com mais de um servidor. Trocar por Redis se escalar horizontalmente.
- Recuperação de senha controlada pelo Super Admin (não é o fluxo
  padrão de link automático) — ver `ARCHITECTURE.md`.
- Bloqueio de empresa (Super Admin) e trial vencido derrubam sessões
  ativas, não só impedem login novo.

## Autorização

- RBAC via matriz estática (`server/permissions.ts`) — testada
  (`tests/permissions.test.ts`).
- Toda rota de API sensível chama `requireAuth`/`requireRole`/
  `requirePermission` no backend — nunca confia só no middleware ou na
  UI escondendo botão.
- Middleware roda em duas configs separadas (Edge-safe vs. completa)
  para nunca expor bcrypt/Prisma ao Edge Runtime — ver `ARCHITECTURE.md`.

## Multi-tenant

- Toda tabela de domínio carrega `company_id`.
- `company_id` é **sempre** resolvido da sessão no servidor
  (`requireCompanyContext`), nunca de body/query/params da requisição.
- Busca por ID usa `id + companyId` juntos — registro de outro tenant
  nunca é confirmado como existente (404, nunca 403).
- Testado automaticamente em `tests/multi-tenancy.test.ts` (precisa de
  Postgres real para rodar).

## Validação de entrada

- Toda rota de API valida o payload com `zod` antes de processar.
- Mensagens de erro nunca vazam stack trace — sempre uma mensagem
  amigável (`{ success, data, error, message }`).

## Dados sensíveis

- CPF de funcionário mascarado por padrão (`***.***.***-12`), completo
  só para quem tem `MANAGE_USERS` (`server/services/employee-rules.ts`).
- Nenhuma auditoria (`audit_logs`) grava senha, hash, token ou o
  conteúdo integral de um logo em base64.
- Segredos (`.env`) nunca commitados — `.env.example` documenta as
  chaves sem valores reais.

## Pagamento

- Webhook de pagamento (`api/webhooks/payment`) valida assinatura
  contra `PAYMENT_GATEWAY_WEBHOOK_SECRET` — rejeita qualquer payload
  sem essa validação. Nunca confia em confirmação de pagamento vinda
  direto do frontend.

## Headers HTTP

Configurados em `next.config.js`: `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

**Pendente para produção:** Content-Security-Policy (CSP) e HSTS não
estão configurados ainda — recomendado adicionar antes do primeiro
deploy real, especialmente CSP dado que a aplicação renderiza HTML
vindo de usuário em alguns lugares (ex.: logo em base64, nomes de
produtos/serviços).

## O que ainda não existe (seja honesto sobre isso)

- CSRF: Next.js Route Handlers com cookies same-site mitigam boa parte,
  mas não há um token CSRF explícito implementado.
- 2FA/MFA: não implementado.
- Logs de segurança centralizados (SIEM): não implementado — só
  `audit_logs` no próprio Postgres.
- Testes de penetração: não realizados.
