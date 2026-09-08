import { prisma } from "@/server/db";

export interface CreateShiftInput {
  nome: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: string[];
}

export async function listShifts(companyId: string) {
  return prisma.shift.findMany({
    where: { companyId, ativo: true },
    orderBy: { nome: "asc" },
  });
}

export async function createShift(companyId: string, input: CreateShiftInput) {
  return prisma.shift.create({
    data: {
      companyId,
      nome: input.nome,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      diasSemana: input.diasSemana,
    },
  });
}
