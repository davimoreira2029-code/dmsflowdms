import { prisma } from "@/server/db";
import { maskCpf } from "@/server/services/employee-rules";

export interface EmployeeListFilters {
  search?: string;
  status?: "ATIVO" | "INATIVO";
}

/**
 * `canViewSensitiveData` controla se o CPF completo é retornado ou
 * mascarado (item 18). Quem chama (a rota de API) decide isso a partir
 * da permissão do usuário logado — nunca a função de negócio decide
 * sozinha, para manter a checagem de autorização visível e auditável
 * no ponto de entrada da requisição.
 */
export async function listEmployees(
  companyId: string,
  filters: EmployeeListFilters,
  canViewSensitiveData: boolean,
) {
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? { nome: { contains: filters.search, mode: "insensitive" as const } }
        : {}),
    },
    include: { turno: { select: { id: true, nome: true } } },
    orderBy: { nome: "asc" },
  });

  return employees.map((e) => ({
    ...e,
    cpf: canViewSensitiveData ? e.cpf : maskCpf(e.cpf),
  }));
}

export async function getEmployeeDetail(id: string, companyId: string, canViewSensitiveData: boolean) {
  const employee = await prisma.employee.findFirst({
    where: { id, companyId },
    include: { turno: true },
  });
  if (!employee) return null;

  return { ...employee, cpf: canViewSensitiveData ? employee.cpf : maskCpf(employee.cpf) };
}

export interface CreateEmployeeInput {
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  cargo?: string;
  setor?: string;
  turnoId?: string;
  dataAdmissao?: Date;
}

export async function createEmployee(companyId: string, input: CreateEmployeeInput) {
  return prisma.employee.create({
    data: { companyId, ...input },
  });
}
