import { prisma } from "@/server/db";
import { hasPendingRequiredItems, pendingRequiredCount, type ChecklistItemStatusValue } from "@/server/services/checklist-rules";

async function recordServiceEvent(serviceId: string, companyId: string, tipo: string, userId: string) {
  await prisma.serviceEvent.create({ data: { serviceId, companyId, tipo, userId } });
}

export interface CreateTemplateInput {
  nome: string;
  descricao?: string;
  categoria?: string;
  itens: { descricao: string; ordem: number; obrigatorio: boolean }[];
}

export async function createChecklistTemplate(companyId: string, input: CreateTemplateInput) {
  return prisma.checklistTemplate.create({
    data: {
      companyId,
      nome: input.nome,
      descricao: input.descricao,
      categoria: input.categoria,
      items: { create: input.itens },
    },
    include: { items: true },
  });
}

export async function listChecklistTemplates(companyId: string) {
  return prisma.checklistTemplate.findMany({
    where: { companyId, ativo: true, deletedAt: null },
    include: { items: { orderBy: { ordem: "asc" } } },
    orderBy: { nome: "asc" },
  });
}

export class TemplateNotFoundError extends Error {
  constructor() {
    super("Modelo de checklist não encontrado.");
  }
}

export class ServiceNotFoundForChecklistError extends Error {
  constructor() {
    super("Serviço não encontrado.");
  }
}

/**
 * Aplica um template a um serviço, copiando (snapshot) descrição, ordem
 * e obrigatoriedade dos itens no momento da aplicação — se o template
 * for editado depois, checklists já aplicados não mudam retroativamente.
 */
export async function applyChecklistToService(
  serviceId: string,
  companyId: string,
  templateId: string,
  userId: string,
) {
  const [service, template] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, companyId } }),
    prisma.checklistTemplate.findFirst({
      where: { id: templateId, companyId },
      include: { items: { orderBy: { ordem: "asc" } } },
    }),
  ]);

  if (!service) throw new ServiceNotFoundForChecklistError();
  if (!template) throw new TemplateNotFoundError();

  const serviceChecklist = await prisma.serviceChecklist.create({
    data: {
      serviceId,
      companyId,
      templateId,
      items: {
        create: template.items.map((item) => ({
          descricao: item.descricao,
          ordem: item.ordem,
          obrigatorio: item.obrigatorio,
        })),
      },
    },
    include: { items: true },
  });

  await recordServiceEvent(serviceId, companyId, "CHECKLIST_INICIADO", userId);

  return serviceChecklist;
}

export class ChecklistItemNotFoundError extends Error {
  constructor() {
    super("Item de checklist não encontrado.");
  }
}

/**
 * Atualiza o status de um item de checklist. Ao concluir o ÚLTIMO item
 * obrigatório pendente de um checklist, dispara o evento
 * CHECKLIST_CONCLUIDO na timeline do serviço automaticamente.
 */
export async function updateChecklistItemStatus(
  itemId: string,
  companyId: string,
  userId: string,
  status: ChecklistItemStatusValue,
) {
  const item = await prisma.serviceChecklistItem.findFirst({
    where: { id: itemId, serviceChecklist: { companyId } },
    include: { serviceChecklist: true },
  });
  if (!item) throw new ChecklistItemNotFoundError();

  const updated = await prisma.serviceChecklistItem.update({
    where: { id: itemId },
    data: {
      status,
      userId,
      checkedAt: status === "PENDENTE" ? null : new Date(),
    },
  });

  const remainingItems = await prisma.serviceChecklistItem.findMany({
    where: { serviceChecklistId: item.serviceChecklistId },
    select: { obrigatorio: true, status: true },
  });

  if (!hasPendingRequiredItems(remainingItems)) {
    await recordServiceEvent(
      item.serviceChecklist.serviceId,
      companyId,
      "CHECKLIST_CONCLUIDO",
      userId,
    );
  }

  return updated;
}

export interface FinalizeCheck {
  canFinalize: boolean;
  pendingCount: number;
}

/** Usado por service.service.ts antes de permitir a transição para FINALIZADO. */
export async function checkCanFinalizeService(serviceId: string, companyId: string): Promise<FinalizeCheck> {
  const items = await prisma.serviceChecklistItem.findMany({
    where: { serviceChecklist: { serviceId, companyId } },
    select: { obrigatorio: true, status: true },
  });

  return {
    canFinalize: !hasPendingRequiredItems(items),
    pendingCount: pendingRequiredCount(items),
  };
}
