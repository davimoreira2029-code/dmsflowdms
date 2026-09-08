import { describe, it, expect } from "vitest";
import { getPeriodRange } from "@/lib/date-range";

describe("getPeriodRange (lib/date-range.ts)", () => {
  const reference = new Date("2026-08-19T15:30:00"); // uma quarta-feira

  it("'today' cobre só o dia de referência", () => {
    const { start, end } = getPeriodRange("today", reference);
    expect(start?.getDate()).toBe(19);
    expect(start?.getHours()).toBe(0);
    expect(end?.getDate()).toBe(19);
    expect(end?.getHours()).toBe(23);
  });

  it("'week' começa no domingo da semana de referência", () => {
    const { start } = getPeriodRange("week", reference);
    expect(start?.getDay()).toBe(0); // domingo
    expect(start!.getTime()).toBeLessThanOrEqual(reference.getTime());
  });

  it("'month' começa no dia 1 do mês de referência", () => {
    const { start } = getPeriodRange("month", reference);
    expect(start?.getDate()).toBe(1);
    expect(start?.getMonth()).toBe(reference.getMonth());
  });

  it("'all' não aplica filtro de data", () => {
    const { start, end } = getPeriodRange("all", reference);
    expect(start).toBeNull();
    expect(end).toBeNull();
  });
});
