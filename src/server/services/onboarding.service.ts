import { prisma } from "@/server/db";

export interface OnboardingStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

/**
 * Item 10: assistente de configuração inicial. Em vez de um wizard
 * separado que duplicaria os formulários já existentes (Equipe,
 * Veículos, Estoque, Checklists), calcula o progresso real a partir do
 * banco e aponta para as telas que já fazem o trabalho.
 */
export async function getOnboardingStatus(companyId: string) {
  const [company, employeeCount, vehicleCount, productCount, checklistCount] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { endereco: true } }),
    prisma.employee.count({ where: { companyId, deletedAt: null } }),
    prisma.vehicle.count({ where: { companyId, deletedAt: null } }),
    prisma.inventoryProduct.count({ where: { companyId, deletedAt: null } }),
    prisma.checklistTemplate.count({ where: { companyId, deletedAt: null } }),
  ]);

  const steps: OnboardingStep[] = [
    { key: "empresa", label: "Confirmar dados da empresa", done: !!company?.endereco, href: "/configuracoes" },
    { key: "equipe", label: "Cadastrar funcionários", done: employeeCount > 0, href: "/equipe" },
    { key: "veiculos", label: "Cadastrar veículos", done: vehicleCount > 0, href: "/veiculos" },
    { key: "estoque", label: "Cadastrar produtos de estoque", done: productCount > 0, href: "/estoque" },
    { key: "checklists", label: "Configurar um modelo de checklist", done: checklistCount > 0, href: "/checklists" },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return { steps, percent };
}
