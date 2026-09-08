import { describe, it, expect } from "vitest";
import { createRateLimiter } from "@/server/rate-limit";

describe("createRateLimiter (server/rate-limit.ts)", () => {
  it("permite tentativas dentro do limite", () => {
    const limiter = createRateLimiter();
    expect(limiter.check("user@teste.com", 5, 60_000, 0)).toBe(true);
    expect(limiter.check("user@teste.com", 5, 60_000, 1000)).toBe(true);
    expect(limiter.check("user@teste.com", 5, 60_000, 2000)).toBe(true);
  });

  it("bloqueia após atingir o máximo de tentativas na janela", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) {
      limiter.check("user@teste.com", 5, 60_000, i * 1000);
    }
    expect(limiter.check("user@teste.com", 5, 60_000, 5000)).toBe(false);
  });

  it("libera de novo depois que a janela de tempo passa", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) {
      limiter.check("user@teste.com", 5, 60_000, i * 1000);
    }
    expect(limiter.check("user@teste.com", 5, 60_000, 61_000)).toBe(true);
  });

  it("chaves diferentes têm contadores independentes", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) {
      limiter.check("a@teste.com", 5, 60_000, i * 1000);
    }
    expect(limiter.check("a@teste.com", 5, 60_000, 5000)).toBe(false);
    expect(limiter.check("b@teste.com", 5, 60_000, 5000)).toBe(true);
  });

  it("reset() limpa o contador imediatamente", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) {
      limiter.check("user@teste.com", 5, 60_000, i * 1000);
    }
    limiter.reset("user@teste.com");
    expect(limiter.check("user@teste.com", 5, 60_000, 5000)).toBe(true);
  });
});
