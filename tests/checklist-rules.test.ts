import { describe, it, expect } from "vitest";
import { hasPendingRequiredItems, pendingRequiredCount } from "@/server/services/checklist-rules";

describe("hasPendingRequiredItems (server/services/checklist-rules.ts)", () => {
  it("bloqueia quando há item obrigatório pendente", () => {
    expect(
      hasPendingRequiredItems([{ obrigatorio: true, status: "PENDENTE" }]),
    ).toBe(true);
  });

  it("não bloqueia quando o item obrigatório está concluído", () => {
    expect(
      hasPendingRequiredItems([{ obrigatorio: true, status: "CONCLUIDO" }]),
    ).toBe(false);
  });

  it("não bloqueia quando o item obrigatório foi marcado não aplicável", () => {
    expect(
      hasPendingRequiredItems([{ obrigatorio: true, status: "NAO_APLICAVEL" }]),
    ).toBe(false);
  });

  it("item NÃO obrigatório pendente nunca bloqueia", () => {
    expect(
      hasPendingRequiredItems([{ obrigatorio: false, status: "PENDENTE" }]),
    ).toBe(false);
  });

  it("lista vazia não bloqueia", () => {
    expect(hasPendingRequiredItems([])).toBe(false);
  });

  it("basta UM item obrigatório pendente entre vários para bloquear", () => {
    expect(
      hasPendingRequiredItems([
        { obrigatorio: true, status: "CONCLUIDO" },
        { obrigatorio: false, status: "PENDENTE" },
        { obrigatorio: true, status: "PENDENTE" },
      ]),
    ).toBe(true);
  });

  it("pendingRequiredCount conta certo, ignorando não obrigatórios", () => {
    expect(
      pendingRequiredCount([
        { obrigatorio: true, status: "PENDENTE" },
        { obrigatorio: true, status: "PENDENTE" },
        { obrigatorio: false, status: "PENDENTE" },
        { obrigatorio: true, status: "CONCLUIDO" },
      ]),
    ).toBe(2);
  });
});
