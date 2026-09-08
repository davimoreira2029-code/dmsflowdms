/**
 * Converte "HH:mm" em minutos desde a meia-noite. Retorna null para
 * entrada inválida ou vazia — quem chama decide o que fazer com null.
 */
function toMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Item 15: hora de término deve ser depois da hora de início. Função
 * pura — sem I/O, sem Prisma. Se qualquer um dos dois estiver ausente
 * ou for inválido, não bloqueia (o campo é opcional no schema) —
 * só bloqueia quando AMBOS estão presentes e a ordem está errada.
 */
export function isValidTimeRange(horaInicio: string | undefined, horaFim: string | undefined): boolean {
  const start = toMinutes(horaInicio);
  const end = toMinutes(horaFim);

  if (start === null || end === null) return true;
  return end > start;
}
