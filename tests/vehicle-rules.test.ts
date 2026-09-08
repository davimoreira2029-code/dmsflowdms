import { describe, it, expect } from "vitest";
import { isValidKmRange, calculateKmPercorrido } from "@/server/services/vehicle-rules";

describe("isValidKmRange (server/services/vehicle-rules.ts)", () => {
  it("aceita KM final maior que KM inicial", () => {
    expect(isValidKmRange(1000, 1050)).toBe(true);
  });

  it("aceita KM final igual ao KM inicial (viagem sem deslocamento registrado)", () => {
    expect(isValidKmRange(1000, 1000)).toBe(true);
  });

  it("REJEITA KM final menor que KM inicial — regra do item 16", () => {
    expect(isValidKmRange(1000, 900)).toBe(false);
  });

  it("aceita KM final ausente — viagem em andamento", () => {
    expect(isValidKmRange(1000, null)).toBe(true);
    expect(isValidKmRange(1000, undefined)).toBe(true);
  });
});

describe("calculateKmPercorrido (server/services/vehicle-rules.ts)", () => {
  it("calcula a diferença corretamente", () => {
    expect(calculateKmPercorrido(1000, 1050)).toBe(50);
  });

  it("retorna null quando a viagem ainda não terminou", () => {
    expect(calculateKmPercorrido(1000, null)).toBeNull();
    expect(calculateKmPercorrido(1000, undefined)).toBeNull();
  });

  it("retorna 0 quando não houve deslocamento", () => {
    expect(calculateKmPercorrido(1000, 1000)).toBe(0);
  });
});
