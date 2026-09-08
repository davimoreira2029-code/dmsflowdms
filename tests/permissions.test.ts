import { describe, it, expect } from "vitest";
import { hasPermission } from "@/server/permissions";

describe("Matriz de permissões (server/permissions.ts)", () => {
  it("SUPER_ADMIN tem todas as permissões", () => {
    expect(hasPermission("SUPER_ADMIN", "MANAGE_BILLING")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "DELETE")).toBe(true);
  });

  it("VISUALIZADOR só tem READ", () => {
    expect(hasPermission("VISUALIZADOR", "READ")).toBe(true);
    expect(hasPermission("VISUALIZADOR", "CREATE")).toBe(false);
    expect(hasPermission("VISUALIZADOR", "DELETE")).toBe(false);
    expect(hasPermission("VISUALIZADOR", "MANAGE_USERS")).toBe(false);
  });

  it("OPERACIONAL não gerencia usuários nem billing", () => {
    expect(hasPermission("OPERACIONAL", "MANAGE_USERS")).toBe(false);
    expect(hasPermission("OPERACIONAL", "MANAGE_BILLING")).toBe(false);
    expect(hasPermission("OPERACIONAL", "CREATE")).toBe(true);
  });

  it("GERENTE gerencia usuários mas não billing", () => {
    expect(hasPermission("GERENTE", "MANAGE_USERS")).toBe(true);
    expect(hasPermission("GERENTE", "MANAGE_BILLING")).toBe(false);
  });

  it("apenas SUPER_ADMIN e ADMIN_EMPRESA têm MANAGE_BILLING", () => {
    expect(hasPermission("SUPER_ADMIN", "MANAGE_BILLING")).toBe(true);
    expect(hasPermission("ADMIN_EMPRESA", "MANAGE_BILLING")).toBe(true);
    expect(hasPermission("GERENTE", "MANAGE_BILLING")).toBe(false);
    expect(hasPermission("SUPERVISOR", "MANAGE_BILLING")).toBe(false);
    expect(hasPermission("OPERACIONAL", "MANAGE_BILLING")).toBe(false);
    expect(hasPermission("VISUALIZADOR", "MANAGE_BILLING")).toBe(false);
  });
});
