export type Period = "today" | "week" | "month" | "all";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Calcula o intervalo de datas para os filtros do dashboard (item 11:
 * hoje/semana/mês/período personalizado — "personalizado" é tratado
 * separadamente pela própria página, que já recebe datas explícitas).
 * `all` retorna `{ start: null, end: null }` — sem filtro de data.
 *
 * Função pura (sem I/O) de propósito: permite testar as fronteiras de
 * cada período sem precisar de banco de dados.
 */
export function getPeriodRange(period: Period, now: Date = new Date()): DateRange {
  if (period === "all") {
    return { start: null, end: null };
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "today") {
    return { start, end };
  }

  if (period === "week") {
    // Semana começando no domingo.
    start.setDate(start.getDate() - start.getDay());
    return { start, end };
  }

  // month
  start.setDate(1);
  return { start, end };
}
