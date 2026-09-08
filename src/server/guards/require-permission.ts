import { requireAuth, ForbiddenError } from "@/server/guards/require-role";
import { hasPermission, type PermissionCode } from "@/server/permissions";

/** Garante que o usuário autenticado tem a permissão granular informada. */
export async function requirePermission(code: PermissionCode) {
  const user = await requireAuth();
  if (!hasPermission(user.role, code)) {
    throw new ForbiddenError();
  }
  return user;
}
