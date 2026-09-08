import { prisma } from "@/server/db";
import { isValidKmRange } from "@/server/services/vehicle-rules";
import { notifyUser } from "@/server/services/notification.service";

export class VehicleNotFoundError extends Error {
  constructor() {
    super("Veículo não encontrado.");
  }
}

export class MovementNotFoundError extends Error {
  constructor() {
    super("Movimentação não encontrada.");
  }
}

export class InvalidKmRangeError extends Error {
  constructor() {
    super("O KM final não pode ser menor que o KM inicial.");
  }
}

export class MovementAlreadyClosedError extends Error {
  constructor() {
    super("Esta movimentação já foi encerrada.");
  }
}

export interface CreateVehicleInput {
  placa: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  kmAtual?: number;
  responsavelId?: string;
}

export async function listVehicles(companyId: string) {
  return prisma.vehicle.findMany({
    where: { companyId, deletedAt: null },
    include: { responsavel: { select: { id: true, name: true } } },
    orderBy: { placa: "asc" },
  });
}

export async function getVehicleDetail(id: string, companyId: string) {
  return prisma.vehicle.findFirst({
    where: { id, companyId },
    include: {
      responsavel: { select: { id: true, name: true } },
      movements: {
        orderBy: { data: "desc" },
        include: { motorista: { select: { id: true, name: true } } },
      },
      maintenances: {
        orderBy: { data: "desc" },
        include: { responsavel: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createVehicle(companyId: string, input: CreateVehicleInput) {
  return prisma.vehicle.create({
    data: { companyId, ...input },
  });
}

/**
 * Inicia uma viagem: cria a movimentação com KM final ainda vazio e
 * marca o veículo como EM_USO. `close` (abaixo) é quem fecha o ciclo.
 */
export async function startVehicleMovement(
  vehicleId: string,
  companyId: string,
  input: { motoristaId?: string; servicoId?: string; kmInicial: number; observacao?: string },
) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } });
  if (!vehicle) throw new VehicleNotFoundError();

  const [movement] = await prisma.$transaction([
    prisma.vehicleMovement.create({
      data: { vehicleId, companyId, ...input },
    }),
    prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "EM_USO" } }),
  ]);

  return movement;
}

/**
 * Encerra a viagem: valida KM final >= KM inicial (item 16), atualiza
 * o KM atual do veículo e devolve o status para DISPONÍVEL.
 */
export async function closeVehicleMovement(
  movementId: string,
  companyId: string,
  kmFinal: number,
) {
  const movement = await prisma.vehicleMovement.findFirst({ where: { id: movementId, companyId } });
  if (!movement) throw new MovementNotFoundError();
  if (movement.kmFinal !== null) throw new MovementAlreadyClosedError();

  if (!isValidKmRange(movement.kmInicial, kmFinal)) {
    throw new InvalidKmRangeError();
  }

  const [updatedMovement] = await prisma.$transaction([
    prisma.vehicleMovement.update({ where: { id: movementId }, data: { kmFinal } }),
    prisma.vehicle.update({
      where: { id: movement.vehicleId },
      data: { kmAtual: kmFinal, status: "DISPONIVEL" },
    }),
  ]);

  return updatedMovement;
}

export interface CreateMaintenanceInput {
  tipo: "PREVENTIVA" | "CORRETIVA";
  data?: Date;
  km?: number;
  descricao?: string;
  custoCentavos?: number;
  responsavelId?: string;
}

export async function createMaintenance(
  vehicleId: string,
  companyId: string,
  input: CreateMaintenanceInput,
) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } });
  if (!vehicle) throw new VehicleNotFoundError();

  // Manutenção agendada tira o veículo de circulação até ser concluída.
  const [maintenance] = await prisma.$transaction([
    prisma.vehicleMaintenance.create({
      data: { vehicleId, companyId, status: "AGENDADA", ...input },
    }),
    prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "MANUTENCAO" } }),
  ]);

  if (vehicle.responsavelId) {
    await notifyUser({
      companyId,
      userId: vehicle.responsavelId,
      tipo: "MANUTENCAO_VEICULO",
      titulo: "Manutenção de veículo registrada",
      mensagem: `${vehicle.placa} — ${input.tipo === "PREVENTIVA" ? "preventiva" : "corretiva"}`,
      entityType: "vehicle",
      entityId: vehicleId,
    });
  }

  return maintenance;
}

export async function completeMaintenance(maintenanceId: string, companyId: string) {
  const maintenance = await prisma.vehicleMaintenance.findFirst({
    where: { id: maintenanceId, companyId },
  });
  if (!maintenance) throw new Error("Manutenção não encontrada.");

  const [updated] = await prisma.$transaction([
    prisma.vehicleMaintenance.update({ where: { id: maintenanceId }, data: { status: "CONCLUIDA" } }),
    prisma.vehicle.update({ where: { id: maintenance.vehicleId }, data: { status: "DISPONIVEL" } }),
  ]);

  return updated;
}

/** Manutenções agendadas, mais próximas primeiro — usado no alerta do item 17. */
export async function listUpcomingMaintenances(companyId: string) {
  return prisma.vehicleMaintenance.findMany({
    where: { companyId, status: "AGENDADA" },
    include: { vehicle: { select: { id: true, placa: true } } },
    orderBy: { data: "asc" },
  });
}
