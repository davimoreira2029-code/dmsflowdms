import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { getOnboardingStatus } from "@/server/services/onboarding.service";
import { StatCard } from "@/components/ui";
import { ServicesByStatusChart } from "@/features/dashboard/dashboard-charts";
import { OnboardingCard } from "@/features/dashboard/onboarding-card";
import type { Period } from "@/lib/date-range";

const PERIOD_LABEL: Record<Period, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  all: "Todo o período",
};

function isPeriod(value: string | undefined): value is Period {
  return value === "today" || value === "week" || value === "month" || value === "all";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const period: Period = isPeriod(searchParams.period) ? searchParams.period : "all";
  const [stats, onboarding] = await Promise.all([
    getDashboardStats(session.user.companyId, period),
    getOnboardingStatus(session.user.companyId),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <OnboardingCard steps={onboarding.steps} percent={onboarding.percent} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Dashboard</h1>
        <nav className="flex gap-1 rounded-md border border-neutral-200 bg-white p-1 text-sm">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <Link
              key={p}
              href={`/dashboard?period=${p}`}
              className={`rounded px-3 py-1.5 ${
                p === period ? "bg-navy-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {PERIOD_LABEL[p]}
            </Link>
          ))}
        </nav>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Serviços</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total no período" value={stats.services.total} />
          <StatCard label="Em andamento" value={stats.services.byStatus.EM_ANDAMENTO ?? 0} />
          <StatCard label="Aguardando" value={stats.services.byStatus.AGUARDANDO ?? 0} />
          <StatCard label="Finalizados" value={stats.services.byStatus.FINALIZADO ?? 0} />
        </div>
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
          <ServicesByStatusChart byStatus={stats.services.byStatus} />
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Equipe</h2>
          <div className="space-y-3">
            <StatCard label="Funcionários ativos" value={stats.team.funcionariosAtivos} />
            <StatCard label="Tarefas pendentes" value={stats.tasks.pendentes} />
            <StatCard label="Tarefas atrasadas" value={stats.tasks.atrasadas} hint={stats.tasks.atrasadas > 0 ? "Requer atenção" : undefined} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Veículos</h2>
          <div className="space-y-3">
            <StatCard label="Disponíveis" value={stats.vehicles.byStatus.DISPONIVEL ?? 0} />
            <StatCard label="Em uso" value={stats.vehicles.byStatus.EM_USO ?? 0} />
            <StatCard label="Manutenção" value={stats.vehicles.byStatus.MANUTENCAO ?? 0} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Estoque</h2>
          <div className="space-y-3">
            <StatCard label="Itens ativos" value={stats.inventory.itensDisponiveis} />
            <StatCard
              label="Abaixo do mínimo"
              value={stats.inventory.itensAbaixoDoMinimo}
              hint={stats.inventory.itensAbaixoDoMinimo > 0 ? "Repor estoque" : undefined}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Checklists</h2>
          <div className="space-y-3">
            <StatCard label="Pendentes" value={stats.checklists.pendentes} />
            <StatCard label="Concluídos" value={stats.checklists.concluidos} />
          </div>
        </div>
      </section>
    </div>
  );
}
