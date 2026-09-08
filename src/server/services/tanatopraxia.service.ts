import { prisma } from "@/server/db";
import { isValidTimeRange } from "@/server/services/tanatopraxia-rules";

export class ServiceNotFoundError extends Error {
  constructor() {
    super("Serviço não encontrado.");
  }
}

export class InvalidTimeRangeError extends Error {
  constructor() {
    super("A hora de término deve ser depois da hora de início.");
  }
}

export interface CreateTanatopraxiaInput {
  tipo: "NAO_REALIZAR" | "REALIZAR_TANATOPRAXIA" | "EMBALSAMAMENTO";
  responsavelId?: string;
  data?: Date;
  horaInicio?: string;
  horaFim?: string;
  procedimentos?: string;
  materiaisUtilizados?: string;
  observacoes?: string;
}

/**
 * Cria um novo registro de tanatopraxia (item 15). Histórico: cada
 * chamada cria um registro novo, nunca sobrescreve o anterior — o mais
 * recente é o "atual" para fins de exibição.
 */
export async function createTanatopraxiaRecord(
  serviceId: string,
  companyId: string,
  userId: string,
  input: CreateTanatopraxiaInput,
) {
  // findFirst com id + companyId juntos — mesmo padrão de isolamento
  // multi-tenant de todo o resto do projeto.
  const service = await prisma.service.findFirst({ where: { id: serviceId, companyId } });
  if (!service) throw new ServiceNotFoundError();

  if (!isValidTimeRange(input.horaInicio, input.horaFim)) {
    throw new InvalidTimeRangeError();
  }

  const record = await prisma.tanatopraxiaRecord.create({
    data: { serviceId, companyId, ...input },
  });

  await prisma.serviceEvent.create({
    data: { serviceId, companyId, tipo: "TANATOPRAXIA_REGISTRADA", userId },
  });

  return record;
}

export async function listTanatopraxiaRecords(serviceId: string, companyId: string) {
  return prisma.tanatopraxiaRecord.findMany({
    where: { serviceId, companyId },
    include: { responsavel: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
