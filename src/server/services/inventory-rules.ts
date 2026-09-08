export type InventoryMovementType = "ENTRADA" | "SAIDA" | "AJUSTE";

export class NegativeStockError extends Error {
  constructor() {
    super("Esta saída deixaria o estoque negativo.");
  }
}

/**
 * Calcula a nova quantidade após uma movimentação (item 22).
 * - ENTRADA: soma.
 * - SAIDA: subtrai — nunca permite ficar negativo (decisão registrada
 *   em DATABASE.md; se precisar corrigir um erro de contagem, use AJUSTE).
 * - AJUSTE: define o valor absoluto (correção de inventário).
 *
 * Função pura — sem I/O, sem Prisma.
 */
export function calculateNewQuantity(
  current: number,
  tipo: InventoryMovementType,
  quantidade: number,
): number {
  if (tipo === "ENTRADA") return current + quantidade;

  if (tipo === "SAIDA") {
    const next = current - quantidade;
    if (next < 0) throw new NegativeStockError();
    return next;
  }

  // AJUSTE define o valor absoluto — quantidade é o novo total, não um delta.
  return quantidade;
}

/** Item 22: "Gerar alerta: ESTOQUE ABAIXO DO MÍNIMO." Função pura. */
export function isBelowMinimum(quantidade: number, estoqueMinimo: number): boolean {
  return quantidade < estoqueMinimo;
}

/**
 * Item 21: só deve disparar a notificação de estoque baixo quando o
 * produto CRUZA a fronteira (estava acima, ficou abaixo) — evita
 * notificação repetida a cada movimentação enquanto o produto continua
 * abaixo do mínimo. Função pura.
 */
export function crossedBelowMinimumThreshold(
  quantidadeAnterior: number,
  quantidadeNova: number,
  estoqueMinimo: number,
): boolean {
  const wasAbove = !isBelowMinimum(quantidadeAnterior, estoqueMinimo);
  const isNowBelow = isBelowMinimum(quantidadeNova, estoqueMinimo);
  return wasAbove && isNowBelow;
}
