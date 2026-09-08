# Permissões — DMS FLOW

## Papéis (roles)

`SUPER_ADMIN` — acesso administrativo global, fora do tenant de
qualquer empresa (`company_id: null`).
`ADMIN_EMPRESA`, `GERENTE`, `SUPERVISOR`, `OPERACIONAL`,
`VISUALIZADOR` — escopados a uma empresa (`company_id` obrigatório).

## Matriz (server/permissions.ts)

| Permissão | SUPER_ADMIN | ADMIN_EMPRESA | GERENTE | SUPERVISOR | OPERACIONAL | VISUALIZADOR |
|---|---|---|---|---|---|---|
| READ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CREATE | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| UPDATE | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| EXPORT | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| MANAGE_SETTINGS | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| MANAGE_BILLING | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| MANAGE_VEHICLES / STOCK / SERVICES / CHECKLISTS / TASKS | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| MANAGE_REPORTS | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

Testado em `tests/permissions.test.ts` (5 casos).

## Decisão registrada: matriz estática, não RBAC dinâmico

As tabelas `roles`/`permissions`/`role_permissions`/`user_roles`
existem no schema desde a Fase 2, mas não são usadas — decisão final
tomada na Fase 5, documentada em `DATABASE.md`. Papéis customizados por
empresa (ex.: "Coordenador de Laboratório" com um conjunto próprio de
permissões) exigiriam ativar essas tabelas — não implementado.

## Onde a checagem acontece

Toda rota de API sensível chama `requirePermission(codigo)` no
backend, nunca só esconde botão na UI. Ver `server/guards/`.
