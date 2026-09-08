import { describe, it, expect } from "vitest";
import { buildServiceListWhere } from "@/server/services/service-rules";

describe("buildServiceListWhere (server/services/service.service.ts)", () => {
  const companyId = "company-a";

  it("sempre inclui companyId e deletedAt: null, mesmo sem filtros", () => {
    const where = buildServiceListWhere(companyId, {});
    expect(where.companyId).toBe(companyId);
    expect(where.deletedAt).toBeNull();
    expect(where.status).toBeUndefined();
  });

  it("aplica filtro de status quando informado", () => {
    const where = buildServiceListWhere(companyId, { status: "EM_ANDAMENTO" });
    expect(where.status).toBe("EM_ANDAMENTO");
  });

  it("aplica busca por nome com case-insensitive", () => {
    const where = buildServiceListWhere(companyId, { search: "Silva" }) as {
      falecidoNome: { contains: string; mode: string };
    };
    expect(where.falecidoNome).toEqual({ contains: "Silva", mode: "insensitive" });
  });

  it("ignora busca vazia ou só espaços", () => {
    const where = buildServiceListWhere(companyId, { search: "   " });
    expect(where.falecidoNome).toBeUndefined();
  });

  it("aplica intervalo de datas quando informado", () => {
    const dataInicio = new Date("2026-01-01");
    const dataFim = new Date("2026-01-31");
    const where = buildServiceListWhere(companyId, { dataInicio, dataFim }) as {
      data: { gte: Date; lte: Date };
    };
    expect(where.data.gte).toBe(dataInicio);
    expect(where.data.lte).toBe(dataFim);
  });

  it("NUNCA permite que companyId seja sobrescrito por filtros externos", () => {
    // Mesmo que um filtro malicioso tente incluir companyId, a função
    // sempre usa o parâmetro explícito — filtros não têm esse campo no
    // tipo ServiceListFilters, mas o teste documenta a garantia.
    const where = buildServiceListWhere("company-real", { status: "NOVO" });
    expect(where.companyId).toBe("company-real");
  });
});
