import { prisma } from "@/server/db";
import { getPeriodRange, type Period } from "@/lib/date-range";

export interface DashboardStats {
  services: {
    byStatus: Record<string, number>;
    total: number;
  };
  tasks: {
    pendentes: number;
    atrasadas: number;
  };
  team: {
    funcionariosAtivos: number;
  };
  vehicles: {
    byStatus: Record<string, number>;
  };
  inventory: {
    itensDisponiveis: number;
    itensAbaixoDoMinimo: number;
  };
  checklists: {
    pendentes: number;
    concluidos: number;
  };
}

/**
 * Agrega os números do dashboard (item 11). Toda consulta recebe
 * `companyId` obrigatório, seguindo o mesmo padrão de
 * `server/repositories/service.repository.ts` (Fase 4).
 */
export async function getDashboardStats(companyId: string, period: Period = "all"): Promise<DashboardStats> {
  const { start, end } = getPeriodRange(period);
  const dateFilter = start && end ? { gte: start, lte: end } : undefined;

  const [
    servicesGrouped,
    tasksPendentes,
    tasksAtrasadas,
    funcionariosAtivos,
    vehiclesGrouped,
    inventoryProducts,
    checklistPendentes,
    checklistConcluidos,
  ] = await Promise.all([
    prisma.service.groupBy({
      by: ["status"],
      where: { companyId, deletedAt: null, ...(dateFilter ? { data: dateFilter } : {}) },
      _count: true,
    }),
    prisma.task.count({
      where: { companyId, deletedAt: null, status: "A_FAZER" },
    }),
    prisma.task.count({
      where: {
        companyId,
        deletedAt: null,
        status: { notIn: ["CONCLUIDA", "CANCELADA"] },
        prazo: { lt: new Date() },
      },
    }),
    prisma.employee.count({
      where: { companyId, deletedAt: null, status: "ATIVO" },
    }),
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { companyId, deletedAt: null },
      _count: true,
    }),
    prisma.inventoryProduct.findMany({
      where: { companyId, deletedAt: null, ativo: true },
      select: { quantidade: true, estoqueMinimo: true },
    }),
    prisma.serviceChecklistItem.count({
      where: { status: "PENDENTE", serviceChecklist: { companyId } },
    }),
    prisma.serviceChecklistItem.count({
      where: { status: "CONCLUIDO", serviceChecklist: { companyId } },
    }),
  ]);

  const servicesByStatus: Record<string, number> = {};
  let servicesTotal = 0;
  for (const row of servicesGrouped) {
    servicesByStatus[row.status] = row._count;
    servicesTotal += row._count;
  }

  const vehiclesByStatus: Record<string, number> = {};
  for (const row of vehiclesGrouped) {
    vehiclesByStatus[row.status] = row._count;
  }

  // Comparação quantidade < estoqueMinimo não é expressável no `where`
  // do Prisma (compara duas colunas da mesma linha) sem SQL puro — como
  // o volume de produtos por empresa é pequeno no MVP, filtramos em
  // memória. Se a base de produtos crescer muito, trocar por
  // `$queryRaw` com a comparação direto no Postgres.
  const itensAbaixoDoMinimo = inventoryProducts.filter((p) => p.quantidade < p.estoqueMinimo).length;

  return {
    services: { byStatus: servicesByStatus, total: servicesTotal },
    tasks: { pendentes: tasksPendentes, atrasadas: tasksAtrasadas },
    team: { funcionariosAtivos },
    vehicles: { byStatus: vehiclesByStatus },
    inventory: { itensDisponiveis: inventoryProducts.length, itensAbaixoDoMinimo },
    checklists: { pendentes: checklistPendentes, concluidos: checklistConcluidos },
  };
}
