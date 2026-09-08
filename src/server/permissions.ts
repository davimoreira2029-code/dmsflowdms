import type { UserRole } from "@prisma/client";

/**
 * Permissões granulares (item 27). Cada role do enum `UserRole` mapeia
 * para um conjunto fixo — decisão registrada em DATABASE.md: RBAC
 * dinâmico (papéis customizados por empresa) usaria as tabelas
 * `roles`/`permissions`/`role_permissions`, que já existem no schema
 * mas não são usadas nesta fase. Essa matriz estática é suficiente
 * para o MVP e evita um join extra em toda requisição autenticada.
 */
export const PERMISSION_CODES = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "MANAGE_USERS",
  "MANAGE_SETTINGS",
  "MANAGE_BILLING",
  "MANAGE_VEHICLES",
  "MANAGE_STOCK",
  "MANAGE_SERVICES",
  "MANAGE_CHECKLISTS",
  "MANAGE_TASKS",
  "MANAGE_REPORTS",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

const ALL_PERMISSIONS = new Set<PermissionCode>(PERMISSION_CODES);

const OPERATIONAL_MANAGE: PermissionCode[] = [
  "CREATE",
  "READ",
  "UPDATE",
  "MANAGE_VEHICLES",
  "MANAGE_STOCK",
  "MANAGE_SERVICES",
  "MANAGE_CHECKLISTS",
  "MANAGE_TASKS",
];

const ROLE_PERMISSIONS: Record<UserRole, Set<PermissionCode>> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN_EMPRESA: ALL_PERMISSIONS,
  GERENTE: new Set([...OPERATIONAL_MANAGE, "DELETE", "EXPORT", "MANAGE_REPORTS", "MANAGE_USERS"]),
  SUPERVISOR: new Set([...OPERATIONAL_MANAGE, "EXPORT", "MANAGE_REPORTS"]),
  OPERACIONAL: new Set(["CREATE", "READ", "UPDATE"]),
  VISUALIZADOR: new Set(["READ"]),
};

export function hasPermission(role: UserRole, code: PermissionCode): boolean {
  return ROLE_PERMISSIONS[role].has(code);
}

export function permissionsForRole(role: UserRole): PermissionCode[] {
  return Array.from(ROLE_PERMISSIONS[role]);
}
