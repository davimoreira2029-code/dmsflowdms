import { describe, it, expect } from "vitest";
import { isValidStatusTransition } from "@/server/services/service-rules";

describe("isValidStatusTransition (server/services/service.service.ts)", () => {
  it("permite NOVO -> EM_PREPARACAO", () => {
    expect(isValidStatusTransition("NOVO", "EM_PREPARACAO")).toBe(true);
  });

  it("permite qualquer status ativo -> ARQUIVADO", () => {
    expect(isValidStatusTransition("NOVO", "ARQUIVADO")).toBe(true);
    expect(isValidStatusTransition("EM_ANDAMENTO", "ARQUIVADO")).toBe(true);
    expect(isValidStatusTransition("FINALIZADO", "ARQUIVADO")).toBe(true);
  });

  it("NUNCA permite sair de ARQUIVADO — é estado terminal", () => {
    expect(isValidStatusTransition("ARQUIVADO", "NOVO")).toBe(false);
    expect(isValidStatusTransition("ARQUIVADO", "EM_ANDAMENTO")).toBe(false);
  });

  it("não permite pular direto de NOVO para FINALIZADO", () => {
    expect(isValidStatusTransition("NOVO", "FINALIZADO")).toBe(false);
  });

  it("permite ida e volta entre EM_ANDAMENTO e AGUARDANDO", () => {
    expect(isValidStatusTransition("EM_ANDAMENTO", "AGUARDANDO")).toBe(true);
    expect(isValidStatusTransition("AGUARDANDO", "EM_ANDAMENTO")).toBe(true);
  });

  it("FINALIZADO só pode ir para ARQUIVADO", () => {
    expect(isValidStatusTransition("FINALIZADO", "ARQUIVADO")).toBe(true);
    expect(isValidStatusTransition("FINALIZADO", "EM_ANDAMENTO")).toBe(false);
    expect(isValidStatusTransition("FINALIZADO", "NOVO")).toBe(false);
  });
});
