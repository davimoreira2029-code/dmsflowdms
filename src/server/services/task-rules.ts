/**
 * Quem pode mudar o status de uma tarefa: o próprio responsável por
 * ela, ou quem tem a permissão de gestão (MANAGE_TASKS). Função pura —
 * recebe já resolvido se o chamador tem MANAGE_TASKS, não consulta nada.
 */
export function canChangeTaskStatus(
  userId: string,
  responsavelId: string | null,
  hasManagePermission: boolean,
): boolean {
  if (hasManagePermission) return true;
  return responsavelId !== null && responsavelId === userId;
}
