import { prisma } from "@/server/db";

/**
 * ÚNICA exceção autorizada à regra "toda query filtra por companyId"
 * (Fase 4). Estas funções só podem ser chamadas depois de
 * `requireRole("SUPER_ADMIN")` — nunca expostas a rotas de tenant.
 */

export async function getPlatformDashboard() {
  const [totalCompanies, byStatus, totalUsers] = await Promise.all([
    prisma.company.count(),
    prisma.company.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) {
    statusCounts[row.status] = row._count;
  }

  return {
    totalCompanies,
    empresasAtivas: statusCounts.ACTIVE ?? 0,
    empresasEmTrial: statusCounts.TRIAL ?? 0,
    empresasSuspensas: statusCounts.SUSPENDED ?? 0,
    empresasCanceladas: statusCounts.CANCELED ?? 0,
    totalUsers,
  };
}

export async function listAllCompanies() {
  return prisma.company.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompanyDetail(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, status: true } },
      _count: { select: { services: true, vehicles: true, employees: true } },
    },
  });
}

export class CompanyNotFoundError extends Error {
  constructor() {
    super("Empresa não encontrada.");
  }
}

/** Bloqueia/reativa uma empresa. Ação exclusiva do Super Admin, sempre auditada pela rota. */
export async function setCompanyStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) throw new CompanyNotFoundError();

  return prisma.company.update({ where: { id }, data: { status } });
}

/** Logs recentes de toda a plataforma — para o item 28 ("visualizar logs"). */
export async function listRecentAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { nomeFantasia: true } },
      user: { select: { name: true, email: true } },
    },
  });
}
