import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

interface RecordAuditInput {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Grava um evento de auditoria. Nunca deve receber senha, token ou
 * qualquer segredo em oldData/newData — os chamadores são responsáveis
 * por nunca passar esses campos adiante (ver password-reset.service.ts
 * para o padrão correto de uso).
 */
export async function recordAudit(input: RecordAuditInput) {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      oldData: input.oldData ?? undefined,
      newData: input.newData ?? undefined,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
