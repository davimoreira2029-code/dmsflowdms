import { describe, it, expect } from "vitest";
import { isTrialExpired, daysRemainingInTrial } from "@/server/services/billing-rules";

describe("isTrialExpired (server/services/billing-rules.ts)", () => {
  it("detecta trial vencido", () => {
    const trialEndsAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-02T00:00:00Z");
    expect(isTrialExpired(trialEndsAt, now)).toBe(true);
  });

  it("trial ainda dentro do prazo não está vencido", () => {
    const trialEndsAt = new Date("2026-01-10T00:00:00Z");
    const now = new Date("2026-01-02T00:00:00Z");
    expect(isTrialExpired(trialEndsAt, now)).toBe(false);
  });

  it("no exato momento do vencimento ainda não está expirado", () => {
    const trialEndsAt = new Date("2026-01-01T12:00:00Z");
    expect(isTrialExpired(trialEndsAt, trialEndsAt)).toBe(false);
  });
});

describe("daysRemainingInTrial (server/services/billing-rules.ts)", () => {
  it("calcula dias restantes corretamente", () => {
    const trialEndsAt = new Date("2026-01-08T00:00:00Z");
    const now = new Date("2026-01-01T00:00:00Z");
    expect(daysRemainingInTrial(trialEndsAt, now)).toBe(7);
  });

  it("nunca retorna negativo, mesmo com trial já vencido há tempos", () => {
    const trialEndsAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-02-01T00:00:00Z");
    expect(daysRemainingInTrial(trialEndsAt, now)).toBe(0);
  });

  it("retorna 0 no dia exato do vencimento", () => {
    const trialEndsAt = new Date("2026-01-01T00:00:00Z");
    expect(daysRemainingInTrial(trialEndsAt, trialEndsAt)).toBe(0);
  });
});
