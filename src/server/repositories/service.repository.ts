import { prisma } from "@/server/db";

/**
 * Repositório de REFERÊNCIA para o padrão de isolamento multi-tenant.
 * Toda feature futura (Fase 6 em diante) deve seguir exatamente esta
 * forma: `companyId` é sempre o primeiro parâmetro, sempre obrigatório,
 * sempre resolvido no servidor a partir da sessão (nunca do
 * body/query/params da requisição) e sempre incluído na cláusula
 * `where` de toda query.
 *
 * `findById` busca por `id + companyId` juntos — se o registro existe
 * mas pertence a outra empresa, o resultado é `null` (equivalente a
 * "não existe"), nunca um erro de permissão. Isso evita vazar para um
 * usuário mal-intencionado a informação de que aquele ID existe em
 * outro tenant.
 */
export const serviceRepository = {
  findById(id: string, companyId: string) {
    return prisma.service.findFirst({
      where: { id, companyId },
    });
  },

  list(companyId: string) {
    return prisma.service.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },
};
