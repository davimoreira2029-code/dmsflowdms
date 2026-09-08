import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db";
import { serviceRepository } from "@/server/repositories/service.repository";

/**
 * TESTE CRÍTICO DE MULTI-TENANCY (item 34/45 do comando original):
 *
 *   Criar Empresa A. Criar Empresa B.
 *   Criar um serviço na Empresa A.
 *   Tentar acessar esse serviço usando o contexto da Empresa B.
 *   O acesso deve ser negado (nesse caso: retornar null, não o registro).
 *
 * Requer PostgreSQL real via DATABASE_URL — não roda sem banco.
 */

describe("Isolamento multi-tenant — service.repository", () => {
  let companyA: { id: string };
  let companyB: { id: string };
  let serviceInCompanyA: { id: string };

  beforeAll(async () => {
    companyA = await prisma.company.create({
      data: {
        razaoSocial: "Empresa Teste A LTDA",
        nomeFantasia: "Empresa Teste A",
        cnpj: `TEST-A-${Date.now()}`,
        email: "a@teste.dev",
      },
    });

    companyB = await prisma.company.create({
      data: {
        razaoSocial: "Empresa Teste B LTDA",
        nomeFantasia: "Empresa Teste B",
        cnpj: `TEST-B-${Date.now()}`,
        email: "b@teste.dev",
      },
    });

    serviceInCompanyA = await prisma.service.create({
      data: {
        companyId: companyA.id,
        tipo: "Sepultamento",
        data: new Date(),
        hora: "09:00",
        falecidoNome: "Registro de teste",
      },
    });
  });

  afterAll(async () => {
    // Limpeza — ordem importa por causa das foreign keys.
    await prisma.service.deleteMany({ where: { companyId: { in: [companyA.id, companyB.id] } } });
    await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
    await prisma.$disconnect();
  });

  it("permite que a Empresa A acesse o próprio serviço", async () => {
    const found = await serviceRepository.findById(serviceInCompanyA.id, companyA.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(serviceInCompanyA.id);
  });

  it("NUNCA permite que a Empresa B acesse um serviço da Empresa A, mesmo sabendo o ID exato", async () => {
    const found = await serviceRepository.findById(serviceInCompanyA.id, companyB.id);
    expect(found).toBeNull();
  });

  it("a listagem da Empresa B nunca inclui serviços da Empresa A", async () => {
    const listB = await serviceRepository.list(companyB.id);
    expect(listB.find((s) => s.id === serviceInCompanyA.id)).toBeUndefined();
  });

  it("a listagem da Empresa A inclui o próprio serviço", async () => {
    const listA = await serviceRepository.list(companyA.id);
    expect(listA.find((s) => s.id === serviceInCompanyA.id)).toBeDefined();
  });
});
