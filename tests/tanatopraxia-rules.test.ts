import { describe, it, expect } from "vitest";
import { isValidTimeRange } from "@/server/services/tanatopraxia-rules";

describe("isValidTimeRange (server/services/tanatopraxia-rules.ts)", () => {
  it("aceita hora de término depois da hora de início", () => {
    expect(isValidTimeRange("08:00", "10:30")).toBe(true);
  });

  it("rejeita hora de término igual à hora de início", () => {
    expect(isValidTimeRange("08:00", "08:00")).toBe(false);
  });

  it("rejeita hora de término antes da hora de início", () => {
    expect(isValidTimeRange("10:00", "08:00")).toBe(false);
  });

  it("não bloqueia quando um dos horários está ausente", () => {
    expect(isValidTimeRange(undefined, "10:00")).toBe(true);
    expect(isValidTimeRange("08:00", undefined)).toBe(true);
    expect(isValidTimeRange(undefined, undefined)).toBe(true);
  });

  it("não bloqueia quando o formato é inválido (deixa a validação de formato para outra camada)", () => {
    expect(isValidTimeRange("25:99", "10:00")).toBe(true);
    expect(isValidTimeRange("08:00", "abc")).toBe(true);
  });
});
