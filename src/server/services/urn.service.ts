import { prisma } from "@/server/db";
import { isBelowMinimum } from "@/server/services/inventory-rules";

export class UrnNotFoundError extends Error {
  constructor() {
    super("Urna não encontrada.");
  }
}

export interface CreateUrnInput {
  modelo: string;
  fabricante?: string;
  tamanho?: string;
  material?: string;
  acabamento?: string;
  quantidade?: number;
  estoqueMinimo?: number;
}

export async function listUrns(companyId: string) {
  const urns = await prisma.urn.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { modelo: "asc" },
  });

  return urns.map((u) => ({ ...u, abaixoDoMinimo: isBelowMinimum(u.quantidade, u.estoqueMinimo) }));
}

export async function createUrn(companyId: string, input: CreateUrnInput) {
  return prisma.urn.create({ data: { companyId, ...input } });
}

/**
 * Atualiza a quantidade diretamente (sem histórico de movimentação —
 * diferente do Estoque de produtos, o schema de urnas (Fase 2) não tem
 * uma tabela de movimentações própria. Se precisar do mesmo rastro de
 * auditoria do Estoque, é um schema change futuro, não algo que force
 * agora sem necessidade confirmada.
 */
export async function updateUrnQuantity(id: string, companyId: string, quantidade: number) {
  const urn = await prisma.urn.findFirst({ where: { id, companyId } });
  if (!urn) throw new UrnNotFoundError();

  return prisma.urn.update({ where: { id }, data: { quantidade } });
}
