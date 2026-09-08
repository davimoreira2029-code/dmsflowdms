import { ForbiddenError } from "@/server/guards/require-role";
import { companyHasModule, type ModuleCode } from "@/server/services/module.service";

export class ModuleNotContractedError extends Error {
  constructor(code: string) {
    super(`Sua empresa não tem o módulo "${code}" contratado.`);
  }
}

/**
 * Garante que a empresa do contexto atual tem o módulo contratado e
 * ativo. Usar SEMPRE depois de `requireCompanyContext()` — este guard
 * não autentica nem resolve tenant, só checa a concessão do módulo.
 */
export async function requireModule(companyId: string, code: ModuleCode) {
  const enabled = await companyHasModule(companyId, code);
  if (!enabled) {
    throw new ModuleNotContractedError(code);
  }
}
