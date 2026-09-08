import { prisma } from "@/server/db";

/**
 * Catálogo fixo de módulos (item 6). O código (`code`) é o identificador
 * estável usado em toda checagem — o `name` pode mudar sem quebrar nada.
 */
export const MODULE_CATALOG = [
  { code: "GESTAO_FUNERARIA", name: "Gestão Funerária" },
  { code: "GESTAO_PLANOS", name: "Gestão de Planos" },
  { code: "ASSOCIADOS", name: "Associados" },
  { code: "DEPENDENTES", name: "Dependentes" },
  { code: "ESTOQUE", name: "Estoque" },
  { code: "PRODUTOS", name: "Produtos" },
  { code: "VEICULOS", name: "Veículos" },
  { code: "EQUIPE", name: "Equipe" },
  { code: "FINANCEIRO", name: "Financeiro" },
  { code: "BALCAO_SERVICOS", name: "Balcão de Serviços" },
  { code: "RELATORIOS", name: "Relatórios" },
  { code: "DOCUMENTOS", name: "Documentos" },
  { code: "NOTIFICACOES", name: "Notificações" },
] as const;

export type ModuleCode = (typeof MODULE_CATALOG)[number]["code"];

/**
 * Conjunto padrão concedido no cadastro/trial (item 29 — equivalente ao
 * plano Starter). Billing (Fase 16) passa a decidir isso a partir do
 * plano contratado; até lá, todo cadastro novo recebe este conjunto.
 */
const DEFAULT_TRIAL_MODULES: ModuleCode[] = [
  "GESTAO_FUNERARIA",
  "BALCAO_SERVICOS",
  "NOTIFICACOES",
];

/** Garante que o catálogo de módulos existe no banco (idempotente). */
export async function ensureModuleCatalog() {
  for (const m of MODULE_CATALOG) {
    await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name },
      create: { code: m.code, name: m.name },
    });
  }
}

/** Concede o conjunto padrão de módulos a uma empresa recém-criada. */
export async function grantDefaultModules(companyId: string) {
  const modules = await prisma.module.findMany({
    where: { code: { in: DEFAULT_TRIAL_MODULES } },
  });

  await prisma.companyModule.createMany({
    data: modules.map((m) => ({ companyId, moduleId: m.id, enabled: true })),
    skipDuplicates: true,
  });
}

/** Concede TODOS os módulos do catálogo — usado no seed de demonstração. */
export async function grantAllModules(companyId: string) {
  const modules = await prisma.module.findMany();
  await prisma.companyModule.createMany({
    data: modules.map((m) => ({ companyId, moduleId: m.id, enabled: true })),
    skipDuplicates: true,
  });
}

/** Lista os módulos habilitados de uma empresa (para montar a navegação). */
export async function listEnabledModules(companyId: string): Promise<ModuleCode[]> {
  const rows = await prisma.companyModule.findMany({
    where: { companyId, enabled: true },
    include: { module: true },
  });
  return rows.map((r) => r.module.code as ModuleCode);
}

/**
 * Verdade central: uma empresa só tem acesso a um módulo se existir um
 * registro `company_modules` explícito com `enabled = true`. Ausência de
 * registro é DESATIVADO — modelo de concessão explícita.
 */
export async function companyHasModule(companyId: string, code: ModuleCode): Promise<boolean> {
  const moduleRow = await prisma.module.findUnique({ where: { code } });
  if (!moduleRow) return false;

  const grant = await prisma.companyModule.findUnique({
    where: { companyId_moduleId: { companyId, moduleId: moduleRow.id } },
  });
  return grant?.enabled ?? false;
}
