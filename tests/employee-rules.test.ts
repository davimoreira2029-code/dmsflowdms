import { describe, it, expect } from "vitest";
import { maskCpf } from "@/server/services/employee-rules";

describe("maskCpf (server/services/employee-rules.ts)", () => {
  it("mascara todos os dígitos exceto os últimos 2", () => {
    expect(maskCpf("123.456.789-01")).toBe("***.***.***-01");
  });

  it("funciona com CPF sem formatação", () => {
    expect(maskCpf("12345678901")).toBe("***.***.***-01");
  });

  it("retorna null para CPF ausente", () => {
    expect(maskCpf(null)).toBeNull();
    expect(maskCpf(undefined)).toBeNull();
  });

  it("nunca vaza mais que os últimos 2 dígitos", () => {
    const masked = maskCpf("111.222.333-44");
    expect(masked).not.toContain("111");
    expect(masked).not.toContain("222");
    expect(masked).not.toContain("333");
    expect(masked).toContain("44");
  });
});
