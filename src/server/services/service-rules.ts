export type ServiceStatusValue =
  | "NOVO"
  | "EM_PREPARACAO"
  | "EM_ANDAMENTO"
  | "AGUARDANDO"
  | "FINALIZADO"
  | "ARQUIVADO";

export interface ServiceListFilters {
  status?: ServiceStatusValue;
  search?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

/**
 * Monta o `where` da listagem de serviços. Função pura (sem I/O) —
 * mora neste arquivo separado de `service.service.ts` (que importa
 * Prisma) justamente para que testá-la não exija banco de dados nem
 * client gerado. `companyId` é sempre incluído e nunca sobrescrito.
 */
export function buildServiceListWhere(companyId: string, filters: ServiceListFilters) {
  const where: Record<string, unknown> = {
    companyId,
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search && filters.search.trim().length > 0) {
    where.falecidoNome = { contains: filters.search.trim(), mode: "insensitive" };
  }

  if (filters.dataInicio || filters.dataFim) {
    where.data = {
      ...(filters.dataInicio ? { gte: filters.dataInicio } : {}),
      ...(filters.dataFim ? { lte: filters.dataFim } : {}),
    };
  }

  return where;
}

export const VALID_TRANSITIONS: Record<ServiceStatusValue, ServiceStatusValue[]> = {
  NOVO: ["EM_PREPARACAO", "ARQUIVADO"],
  EM_PREPARACAO: ["EM_ANDAMENTO", "AGUARDANDO", "ARQUIVADO"],
  EM_ANDAMENTO: ["AGUARDANDO", "FINALIZADO", "ARQUIVADO"],
  AGUARDANDO: ["EM_ANDAMENTO", "FINALIZADO", "ARQUIVADO"],
  FINALIZADO: ["ARQUIVADO"],
  ARQUIVADO: [],
};

export function isValidStatusTransition(from: ServiceStatusValue, to: ServiceStatusValue): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
