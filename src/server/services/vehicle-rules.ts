/**
 * Item 16: "Impedir KM final inferior ao KM inicial." `kmFinal` ausente
 * significa viagem ainda em andamento — não é inválido, só incompleto.
 * Função pura, sem I/O.
 */
export function isValidKmRange(kmInicial: number, kmFinal: number | null | undefined): boolean {
  if (kmFinal === null || kmFinal === undefined) return true;
  return kmFinal >= kmInicial;
}

/** KM percorrido = KM final - KM inicial (item 16). Null se a viagem ainda não terminou. */
export function calculateKmPercorrido(kmInicial: number, kmFinal: number | null | undefined): number | null {
  if (kmFinal === null || kmFinal === undefined) return null;
  return kmFinal - kmInicial;
}
