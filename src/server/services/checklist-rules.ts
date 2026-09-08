export type ChecklistItemStatusValue = "PENDENTE" | "CONCLUIDO" | "NAO_APLICAVEL";

export interface ChecklistItemForCheck {
  obrigatorio: boolean;
  status: ChecklistItemStatusValue;
}

/**
 * Verdade central do item 14: um serviço não pode ser finalizado
 * enquanto houver item OBRIGATÓRIO com status PENDENTE. Itens não
 * obrigatórios, ou marcados NÃO_APLICÁVEL, nunca bloqueiam.
 *
 * Função pura — não faz I/O, recebe a lista de itens já carregada.
 * Mora separada de `checklist.service.ts` (que importa Prisma) para
 * ser testável sem banco de dados.
 */
export function hasPendingRequiredItems(items: ChecklistItemForCheck[]): boolean {
  return items.some((item) => item.obrigatorio && item.status === "PENDENTE");
}

export function pendingRequiredCount(items: ChecklistItemForCheck[]): number {
  return items.filter((item) => item.obrigatorio && item.status === "PENDENTE").length;
}
