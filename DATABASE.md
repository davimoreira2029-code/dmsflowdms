# Banco de Dados — DMS FLOW

Schema completo em `prisma/schema.prisma`. PostgreSQL, via Prisma ORM.

## Convenções

- Toda tabela de domínio carrega `company_id` (isolamento multi-tenant —
  ver `ARCHITECTURE.md`).
- IDs são UUID (`@default(uuid())`).
- `created_at`/`updated_at` em toda tabela mutável.
- **Soft delete** (`deleted_at`): `services`, `tasks`, `vehicles`,
  `employees`, `inventory_products`, `urns`, `checklist_templates`.
- Tabelas de log/histórico são **imutáveis**, sem soft delete:
  `service_events`, `audit_logs`, `vehicle_movements`, `payment_events`.
- Nomes de tabela e coluna em `snake_case` no banco (via `@map`/`@@map`),
  `camelCase` no código TypeScript (padrão Prisma).

## RBAC: decisão final (Fase 5)

`users.role` (enum) + uma **matriz estática em código** (`server/permissions.ts`,
`UserRole → Set<PermissionCode>`) é o mecanismo de permissão usado em toda a
plataforma. As tabelas `roles`, `permissions`, `role_permissions` e
`user_roles` (`RoleAssignment` no Prisma) continuam no schema, mas **não são
usadas** — ficam reservadas para uma eventual fase pós-MVP de papéis
customizados por empresa. A matriz estática foi escolhida por ser mais
simples, mais rápida (sem join extra por requisição) e ter 100% de cobertura
testada (`tests/permissions.test.ts`, 5 testes, roda sem banco).

## Módulos contratáveis (Fase 5)

`modules` é o catálogo fixo (Estoque, Veículos, Financeiro etc.) — só o
Super Admin altera via seed/migration. `company_modules` é a concessão por
empresa: **ausência de registro = módulo desativado** (concessão explícita,
não implícita). Todo cadastro novo recebe um conjunto padrão
(`grantDefaultModules`, em `server/services/module.service.ts`); a empresa
demo do seed recebe todos os módulos.

## Domínios e tabelas

| Domínio | Tabelas |
|---|---|
| Identidade / Tenancy | `companies`, `users`, `company_settings`, `settings` |
| RBAC granular (schema pronto, lógica na Fase 5) | `roles`, `permissions`, `role_permissions`, `user_roles` |
| Autenticação | `password_reset_requests` |
| Auditoria | `audit_logs` |
| Serviços funerários | `services`, `service_assignments`, `service_events` |
| Checklists | `checklist_templates`, `checklist_template_items`, `service_checklists`, `service_checklist_items` |
| Tanatopraxia | `tanatopraxia_records` |
| Veículos | `vehicles`, `vehicle_movements`, `vehicle_maintenance` |
| Equipe | `employees`, `shifts` |
| Estoque | `inventory_products`, `inventory_movements`, `urns` |
| Tarefas | `tasks`, `task_comments`, `task_attachments` |
| Notificações | `notifications` |
| Billing | `plans`, `subscriptions`, `payments`, `payment_events` |

## Notas de design por domínio

**Serviços (`services.numero`):** é um `autoincrement()` **global** do
Postgres, não reiniciado por empresa. Duas empresas diferentes não terão
ambas um serviço `numero=1`. Se for necessário numeração por empresa
começando do zero, isso exige um contador gerenciado em código
(`service.service.ts`, Fase 7) — decisão adiada de propósito para não
complicar o schema nesta fase.

**Checklists aplicados a serviços (`service_checklist_items.descricao`):**
é um *snapshot* do texto do template no momento em que o checklist foi
aplicado ao serviço. Se o administrador editar o template depois, serviços
já em andamento não são afetados retroativamente — preserva o histórico.

**Movimentação de veículos (`vehicle_movements`):** a regra "KM final não
pode ser menor que KM inicial" (item 16) é validada em código, não no
schema — o Prisma Schema Language não expressa `CHECK` constraints
condicionais nativamente. Pode ser adicionado depois via SQL puro numa
migration manual, se necessário.

**Anexos de tarefas (`task_attachments`):** a tabela guarda só metadados
(`storage_key`, `mime_type`, `size_bytes`). O arquivo em si vive em
storage compatível com S3 (item 37) — nunca é guardado como binário no
Postgres.

**Pagamentos (`payment_events`):** eventos crus do webhook do gateway,
imutáveis. O status de `payments`/`subscriptions` só muda depois que o
backend valida o evento (Fase 16) — nunca a partir de uma chamada direta
do frontend.

**Valores monetários** (`plans.preco_centavos`, `payments.valor_centavos`,
`vehicle_maintenance.custo_centavos`) são `Int` (centavos), não `Decimal`
— evita erro de ponto flutuante. Conversão para reais na apresentação.

**`companies.status` vs. `subscriptions.status`:** propositalmente
redundantes. `companies.status` é um cache rápido para checagens de acesso
sem join; `subscriptions.status` é a fonte de verdade do billing. A Fase 16
mantém os dois em sincronia a cada mudança.

## Como gerar as migrations

O binário do Prisma não pôde ser baixado no ambiente usado para o
desenvolvimento/auditoria (rede restrita — ver `ARCHITECTURE.md`). Rode
localmente:

```bash
npm run db:generate      # gera o client TypeScript a partir do schema
npm run db:migrate:dev   # cria e aplica a migration inicial
npm run db:seed          # popula Super Admin + dados de desenvolvimento
npm run db:studio        # opcional: interface visual do banco
```

`npm run db:migrate:dev` vai pedir um nome para a migration na primeira
execução — sugestão: `init_full_schema`.

## Dados de seed (desenvolvimento apenas)

Sempre roda (independente de `NODE_ENV`):
- 1 Super Admin, a partir de `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD` do `.env`

Bloqueado automaticamente se `NODE_ENV=production`. Cria também:
- 1 empresa "Funerária Demo" em trial
- 5 usuários demo (senha: `Demo@12345`) — Admin, Gerente, Supervisor, 2 Operacionais
- 5 veículos, 5 templates de checklist (com itens), 5 produtos de estoque,
  3 urnas
- 20 serviços e 10 tarefas fictícios
- 5 notificações de exemplo

O seed usa `upsert` nos registros com chave natural (e-mail, CNPJ, placa) —
pode rodar várias vezes sem duplicar esses registros. Serviços, tarefas e
notificações são recriados a cada execução (usam `create`).
