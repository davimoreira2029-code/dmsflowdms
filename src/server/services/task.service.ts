import { prisma } from "@/server/db";
import { canChangeTaskStatus } from "@/server/services/task-rules";
import { notifyUser } from "@/server/services/notification.service";

export class TaskNotFoundError extends Error {
  constructor() {
    super("Tarefa não encontrada.");
  }
}

export class TaskStatusForbiddenError extends Error {
  constructor() {
    super("Você só pode alterar tarefas atribuídas a você, a menos que tenha permissão de gestão.");
  }
}

export interface TaskListFilters {
  status?: "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  responsavelId?: string;
}

export async function listTasks(companyId: string, filters: TaskListFilters = {}) {
  return prisma.task.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.responsavelId ? { responsavelId: filters.responsavelId } : {}),
    },
    include: {
      responsavel: { select: { id: true, name: true } },
      criador: { select: { id: true, name: true } },
    },
    orderBy: [{ prioridade: "desc" }, { prazo: "asc" }],
  });
}

export async function getTaskDetail(id: string, companyId: string) {
  return prisma.task.findFirst({
    where: { id, companyId },
    include: {
      responsavel: { select: { id: true, name: true } },
      criador: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export interface CreateTaskInput {
  titulo: string;
  descricao?: string;
  responsavelId?: string;
  prioridade?: "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
  dataInicio?: Date;
  prazo?: Date;
  servicoId?: string;
}

/** Cria a tarefa e, se houver responsável definido, notifica-o (item 21: TAREFA_ATRIBUIDA). */
export async function createTask(companyId: string, criadorId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: { companyId, criadorId, ...input },
  });

  if (input.responsavelId && input.responsavelId !== criadorId) {
    await notifyUser({
      companyId,
      userId: input.responsavelId,
      tipo: "TAREFA_ATRIBUIDA",
      titulo: "Nova tarefa atribuída a você",
      mensagem: task.titulo,
      entityType: "task",
      entityId: task.id,
    });
  }

  return task;
}

export async function changeTaskStatus(
  id: string,
  companyId: string,
  userId: string,
  hasManagePermission: boolean,
  status: "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA",
) {
  const task = await prisma.task.findFirst({ where: { id, companyId } });
  if (!task) throw new TaskNotFoundError();

  if (!canChangeTaskStatus(userId, task.responsavelId, hasManagePermission)) {
    throw new TaskStatusForbiddenError();
  }

  return prisma.task.update({ where: { id }, data: { status } });
}

export async function addTaskComment(id: string, companyId: string, userId: string, texto: string) {
  const task = await prisma.task.findFirst({ where: { id, companyId } });
  if (!task) throw new TaskNotFoundError();

  return prisma.taskComment.create({
    data: { taskId: id, companyId, userId, texto },
  });
}
