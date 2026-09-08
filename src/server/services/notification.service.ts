import { prisma } from "@/server/db";

export const NOTIFICATION_TYPES = [
  "NOVA_TAREFA",
  "TAREFA_ATRIBUIDA",
  "TAREFA_ATRASADA",
  "NOVO_SERVICO",
  "SERVICO_FINALIZADO",
  "CHECKLIST_PENDENTE",
  "ESTOQUE_BAIXO",
  "MANUTENCAO_VEICULO",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreateNotificationInput {
  companyId: string;
  userId: string;
  tipo: NotificationType;
  titulo: string;
  mensagem?: string;
  entityType?: string;
  entityId?: string;
}

/** Cria uma notificação para um único usuário. */
export async function notifyUser(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      tipo: input.tipo,
      titulo: input.titulo,
      mensagem: input.mensagem,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}

/** Notifica todos os ADMIN_EMPRESA da empresa — usado para alertas gerenciais (ex.: estoque baixo). */
export async function notifyCompanyAdmins(
  companyId: string,
  tipo: NotificationType,
  titulo: string,
  mensagem?: string,
) {
  const admins = await prisma.user.findMany({
    where: { companyId, role: "ADMIN_EMPRESA", status: "ACTIVE" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({ companyId, userId: a.id, tipo, titulo, mensagem })),
  });
}

export async function listNotifications(companyId: string, userId: string, onlyUnread = false) {
  return prisma.notification.findMany({
    where: { companyId, userId, ...(onlyUnread ? { lida: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function countUnread(companyId: string, userId: string) {
  return prisma.notification.count({ where: { companyId, userId, lida: false } });
}

export class NotificationNotFoundError extends Error {
  constructor() {
    super("Notificação não encontrada.");
  }
}

/** Marca como lida — sempre escopada por companyId + userId, nunca só pelo id. */
export async function markAsRead(id: string, companyId: string, userId: string) {
  const notification = await prisma.notification.findFirst({ where: { id, companyId, userId } });
  if (!notification) throw new NotificationNotFoundError();

  return prisma.notification.update({ where: { id }, data: { lida: true } });
}

export async function markAllAsRead(companyId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { companyId, userId, lida: false },
    data: { lida: true },
  });
}
