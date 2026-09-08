import { describe, it, expect } from "vitest";
import {
  calculateNewQuantity,
  isBelowMinimum,
  crossedBelowMinimumThreshold,
  NegativeStockError,
} from "@/server/services/inventory-rules";

describe("calculateNewQuantity (server/services/inventory-rules.ts)", () => {
  it("ENTRADA soma à quantidade atual", () => {
    expect(calculateNewQuantity(10, "ENTRADA", 5)).toBe(15);
  });

  it("SAIDA subtrai da quantidade atual", () => {
    expect(calculateNewQuantity(10, "SAIDA", 4)).toBe(6);
  });

  it("SAIDA que zera o estoque é permitida", () => {
    expect(calculateNewQuantity(10, "SAIDA", 10)).toBe(0);
  });

  it("SAIDA que deixaria o estoque negativo é BLOQUEADA", () => {
    expect(() => calculateNewQuantity(5, "SAIDA", 10)).toThrow(NegativeStockError);
  });

  it("AJUSTE define o valor absoluto, não soma nem subtrai", () => {
    expect(calculateNewQuantity(10, "AJUSTE", 3)).toBe(3);
    expect(calculateNewQuantity(0, "AJUSTE", 50)).toBe(50);
  });
});

describe("isBelowMinimum (server/services/inventory-rules.ts)", () => {
  it("detecta quantidade abaixo do mínimo", () => {
    expect(isBelowMinimum(2, 5)).toBe(true);
  });

  it("quantidade igual ao mínimo NÃO é abaixo do mínimo", () => {
    expect(isBelowMinimum(5, 5)).toBe(false);
  });

  it("quantidade acima do mínimo não dispara alerta", () => {
    expect(isBelowMinimum(10, 5)).toBe(false);
  });
});

describe("crossedBelowMinimumThreshold (server/services/inventory-rules.ts)", () => {
  it("detecta a transição de acima para abaixo do mínimo", () => {
    expect(crossedBelowMinimumThreshold(10, 3, 5)).toBe(true);
  });

  it("NÃO dispara de novo se já estava abaixo do mínimo (evita spam)", () => {
    expect(crossedBelowMinimumThreshold(3, 2, 5)).toBe(false);
  });

  it("não dispara se continua acima do mínimo", () => {
    expect(crossedBelowMinimumThreshold(10, 8, 5)).toBe(false);
  });

  it("não dispara ao se recuperar do abaixo do mínimo para acima", () => {
    expect(crossedBelowMinimumThreshold(2, 10, 5)).toBe(false);
  });
});
