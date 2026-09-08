import { auth } from "@/server/auth";
import type { UserRole } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor() {
    super("Você precisa estar autenticado para realizar esta ação.");
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Você não possui permissão para realizar esta ação.");
  }
}

/** Garante que existe um usuário autenticado. Lança erro caso contrário. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

/**
 * Garante que o usuário autenticado possui um dos papéis informados.
 * Sempre validado no backend — nunca confiar apenas no frontend/middleware.
 */
export async function requireRole(...allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
