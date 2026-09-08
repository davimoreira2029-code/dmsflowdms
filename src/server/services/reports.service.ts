import { prisma } from "@/server/db";
import { isBelowMinimum } from "@/server/services/inventory-rules";

export interface ReportPeriodFilter {
  dataInicio?: Date;
  dataFim?: Date;
}

/** SERVIÇOS: realizados, pendentes, por período, por responsável, por status. */
export async function getServicesReport(companyId: string, filters: ReportPeriodFilter = {}) {
  const dateFilter =
    filters.dataInicio || filters.dataFim
      ? { ...(filters.dataInicio ? { gte: filters.dataInicio } : {}), ...(filters.dataFim ? { lte: filters.dataFim } : {}) }
      : undefined;

  const services = await prisma.service.findMany({
    where: { companyId, deletedAt: null, ...(dateFilter ? { data: dateFilter } : {}) },
    include: { responsavel: { select: { name: true } } },
    orderBy: { data: "desc" },
  });

  return services.map((s) => ({
    numero: s.numero,
    falecido: s.falecidoNome,
    tipo: s.tipo,
    data: new Intl.DateTimeFormat("pt-BR").format(s.data),
    status: s.status,
    responsavel: s.responsavel?.name ?? "—",
  }));
}

/** VEÍCULOS: KM, utilização, manutenção, movimentações. */
export async function getVehiclesReport(companyId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId, deletedAt: null },
    include: {
      _count: { select: { movements: true, maintenances: true } },
    },
    orderBy: { placa: "asc" },
  });

  return vehicles.map((v) => ({
    placa: v.placa,
    veiculo: `${v.marca ?? ""} ${v.modelo ?? ""}`.trim(),
    kmAtual: v.kmAtual,
    status: v.status,
    totalViagens: v._count.movements,
    totalManutencoes: v._count.maintenances,
  }));
}

/** ESTOQUE: estoque atual, entradas, saídas, produtos abaixo do mínimo. */
export async function getInventoryReport(companyId: string) {
  const products = await prisma.inventoryProduct.findMany({
    where: { companyId, deletedAt: null },
    include: { movements: { select: { tipo: true, quantidade: true } } },
    orderBy: { nome: "asc" },
  });

  return products.map((p) => {
    const entradas = p.movements.filter((m) => m.tipo === "ENTRADA").reduce((sum, m) => sum + m.quantidade, 0);
    const saidas = p.movements.filter((m) => m.tipo === "SAIDA").reduce((sum, m) => sum + m.quantidade, 0);

    return {
      produto: p.nome,
      categoria: p.categoria,
      quantidadeAtual: p.quantidade,
      estoqueMinimo: p.estoqueMinimo,
      abaixoDoMinimo: isBelowMinimum(p.quantidade, p.estoqueMinimo) ? "SIM" : "NÃO",
      totalEntradas: entradas,
      totalSaidas: saidas,
    };
  });
}

/** EQUIPE: tarefas, tarefas concluídas, tarefas atrasadas, produtividade operacional. */
export async function getTeamReport(companyId: string) {
  const users = await prisma.user.findMany({
    where: { companyId, status: "ACTIVE" },
    include: {
      tasksResponsavel: {
        where: { deletedAt: null },
        select: { status: true, prazo: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  return users.map((u) => {
    const tasks = u.tasksResponsavel;
    const concluidas = tasks.filter((t) => t.status === "CONCLUIDA").length;
    const atrasadas = tasks.filter(
      (t) => t.status !== "CONCLUIDA" && t.status !== "CANCELADA" && t.prazo && t.prazo < now,
    ).length;

    return {
      nome: u.name,
      totalTarefas: tasks.length,
      tarefasConcluidas: concluidas,
      tarefasAtrasadas: atrasadas,
      produtividade: tasks.length > 0 ? `${Math.round((concluidas / tasks.length) * 100)}%` : "—",
    };
  });
}

/** CHECKLISTS: concluídos, pendentes, atrasados. */
export async function getChecklistsReport(companyId: string) {
  const checklists = await prisma.serviceChecklist.findMany({
    where: { companyId },
    include: {
      template: { select: { nome: true } },
      service: { select: { numero: true, falecidoNome: true } },
      items: { select: { status: true, obrigatorio: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return checklists.map((c) => {
    const total = c.items.length;
    const concluidos = c.items.filter((i) => i.status === "CONCLUIDO").length;
    const pendentesObrigatorios = c.items.filter((i) => i.obrigatorio && i.status === "PENDENTE").length;

    return {
      checklist: c.template.nome,
      servico: `#${c.service.numero} — ${c.service.falecidoNome}`,
      totalItens: total,
      concluidos,
      pendentesObrigatorios,
      status: pendentesObrigatorios > 0 ? "PENDENTE" : "CONCLUÍDO",
    };
  });
}
