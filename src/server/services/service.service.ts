import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { checkCanFinalizeService } from "@/server/services/checklist.service";
import { notifyUser } from "@/server/services/notification.service";
import {
  buildServiceListWhere,
  isValidStatusTransition,
  type ServiceListFilters,
  type ServiceStatusValue,
} from "@/server/services/service-rules";

export type { ServiceListFilters, ServiceStatusValue };
export { buildServiceListWhere, isValidStatusTransition };

async function recordServiceEvent(serviceId: string, companyId: string, tipo: string, userId: string) {
  await prisma.serviceEvent.create({
    data: { serviceId, companyId, tipo, userId },
  });
}

export async function listServices(companyId: string, filters: ServiceListFilters = {}) {
  return prisma.service.findMany({
    where: buildServiceListWhere(companyId, filters) as Prisma.ServiceWhereInput,
    include: {
      responsavel: { select: { id: true, name: true } },
      veiculo: { select: { id: true, placa: true } },
      urna: { select: { id: true, modelo: true } },
    },
    orderBy: { data: "desc" },
  });
}

/** Busca por id + companyId juntos — mesmo padrão de service.repository.ts (Fase 4). */
export async function getServiceDetail(id: string, companyId: string) {
  return prisma.service.findFirst({
    where: { id, companyId },
    include: {
      responsavel: { select: { id: true, name: true } },
      veiculo: { select: { id: true, placa: true } },
      urna: { select: { id: true, modelo: true } },
      events: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
      checklists: {
        include: { items: { orderBy: { ordem: "asc" } } },
      },
      tanatopraxiaRecords: {
        include: { responsavel: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export interface CreateServiceInput {
  tipo: string;
  data: Date;
  hora: string;
  falecidoNome: string;
  responsavelId?: string;
  local?: string;
  destino?: string;
  veiculoId?: string;
  urnaId?: string;
  ornamentacao?: string;
  observacoes?: string;
}

export async function createService(companyId: string, userId: string, input: CreateServiceInput) {
  const service = await prisma.service.create({
    data: { companyId, ...input },
  });

  await recordServiceEvent(service.id, companyId, "SERVICO_CRIADO", userId);

  if (input.responsavelId) {
    await recordServiceEvent(service.id, companyId, "RESPONSAVEL_ATRIBUIDO", userId);
  }
  if (input.veiculoId) {
    await recordServiceEvent(service.id, companyId, "VEICULO_ATRIBUIDO", userId);
  }

  return service;
}

export class ServiceNotFoundError extends Error {
  constructor() {
    super("Serviço não encontrado.");
  }
}

export interface UpdateServiceInput {
  tipo?: string;
  data?: Date;
  hora?: string;
  falecidoNome?: string;
  responsavelId?: string | null;
  local?: string;
  destino?: string;
  veiculoId?: string | null;
  urnaId?: string | null;
  ornamentacao?: string;
  observacoes?: string;
}

export async function updateService(
  id: string,
  companyId: string,
  userId: string,
  input: UpdateServiceInput,
) {
  const existing = await prisma.service.findFirst({ where: { id, companyId } });
  if (!existing) throw new ServiceNotFoundError();

  const responsavelChanged =
    input.responsavelId !== undefined && input.responsavelId !== existing.responsavelId;
  const veiculoChanged = input.veiculoId !== undefined && input.veiculoId !== existing.veiculoId;

  const updated = await prisma.service.update({
    where: { id },
    data: input,
  });

  if (responsavelChanged && input.responsavelId) {
    await recordServiceEvent(id, companyId, "RESPONSAVEL_ATRIBUIDO", userId);
  }
  if (veiculoChanged && input.veiculoId) {
    await recordServiceEvent(id, companyId, "VEICULO_ATRIBUIDO", userId);
  }

  return updated;
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Não é possível mudar o status de ${from} para ${to}.`);
  }
}

export class ChecklistPendingError extends Error {
  constructor(pendingCount: number) {
    super(
      `Não é possível finalizar: ${pendingCount} item(ns) obrigatório(s) de checklist ainda pendente(s).`,
    );
  }
}

/**
 * Muda o status do serviço, validando a transição e registrando o
 * evento correspondente na timeline. `FINALIZADO` e `ARQUIVADO` geram
 * eventos com nome próprio (SERVICO_FINALIZADO / SERVICO_ARQUIVADO);
 * as demais transições geram um evento genérico STATUS_ALTERADO.
 *
 * `allowOverridePendingChecklist` (item 14: "salvo usuário com
 * permissão adequada") é decidido pelo chamador (rota de API) via
 * `hasPermission(role, "MANAGE_CHECKLISTS")` — a regra de permissão
 * fica no guard, não aqui; esta função só aplica a decisão.
 */
export async function changeServiceStatus(
  id: string,
  companyId: string,
  userId: string,
  newStatus: ServiceStatusValue,
  allowOverridePendingChecklist = false,
) {
  const existing = await prisma.service.findFirst({ where: { id, companyId } });
  if (!existing) throw new ServiceNotFoundError();

  const allowed = isValidStatusTransition(existing.status as ServiceStatusValue, newStatus);
  if (!allowed) {
    throw new InvalidStatusTransitionError(existing.status, newStatus);
  }

  if (newStatus === "FINALIZADO" && !allowOverridePendingChecklist) {
    const { canFinalize, pendingCount } = await checkCanFinalizeService(id, companyId);
    if (!canFinalize) {
      throw new ChecklistPendingError(pendingCount);
    }
  }

  const updated = await prisma.service.update({
    where: { id },
    data: { status: newStatus },
  });

  const eventType =
    newStatus === "FINALIZADO" ? "SERVICO_FINALIZADO" : newStatus === "ARQUIVADO" ? "SERVICO_ARQUIVADO" : "STATUS_ALTERADO";
  await recordServiceEvent(id, companyId, eventType, userId);

  if (newStatus === "FINALIZADO" && updated.responsavelId && updated.responsavelId !== userId) {
    await notifyUser({
      companyId,
      userId: updated.responsavelId,
      tipo: "SERVICO_FINALIZADO",
      titulo: "Serviço finalizado",
      mensagem: updated.falecidoNome,
      entityType: "service",
      entityId: id,
    });
  }

  return updated;
}

export async function addServiceAssignment(
  serviceId: string,
  companyId: string,
  actingUserId: string,
  assigneeUserId: string,
  funcao?: string,
) {
  const service = await prisma.service.findFirst({ where: { id: serviceId, companyId } });
  if (!service) throw new ServiceNotFoundError();

  const assignment = await prisma.serviceAssignment.create({
    data: { serviceId, companyId, userId: assigneeUserId, funcao },
  });

  await recordServiceEvent(serviceId, companyId, "MEMBRO_ATRIBUIDO", actingUserId);

  return assignment;
}
