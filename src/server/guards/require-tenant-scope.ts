import { requireAuth } from "@/server/guards/require-role";

export class NoCompanyContextError extends Error {
  constructor() {
    super("Esta ação exige um usuário vinculado a uma empresa.");
  }
}

/**
 * Garante que o usuário autenticado pertence a uma empresa (companyId
 * não nulo) e retorna esse contexto pronto para uso em repositórios.
 *
 * Existe para cobrir o caso de borda do SUPER_ADMIN: ele não pertence a
 * nenhuma empresa (`companyId: null` no schema), então rotas que operam
 * sobre dados de UMA empresa (ex.: `/api/companies/me`) devem rejeitá-lo
 * explicitamente em vez de deixar `companyId` vazar como `undefined`
 * para uma query do Prisma — o que poderia, no pior cenário, remover o
 * filtro de tenant de uma consulta mal escrita.
 */
export async function requireCompanyContext() {
  const user = await requireAuth();

  if (!user.companyId) {
    throw new NoCompanyContextError();
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
  };
}
