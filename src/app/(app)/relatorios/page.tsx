import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import {
  getServicesReport,
  getVehiclesReport,
  getInventoryReport,
  getTeamReport,
  getChecklistsReport,
} from "@/server/services/reports.service";
import { ReportTable } from "@/features/reports/report-table";

const REPORT_TYPES = [
  { value: "servicos", label: "Serviços" },
  { value: "veiculos", label: "Veículos" },
  { value: "estoque", label: "Estoque" },
  { value: "equipe", label: "Equipe" },
  { value: "checklists", label: "Checklists" },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["value"];

function isReportType(value: string | undefined): value is ReportType {
  return REPORT_TYPES.some((r) => r.value === value);
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const tipo: ReportType = isReportType(searchParams.tipo) ? searchParams.tipo : "servicos";
  const companyId = session.user.companyId;

  const rows = await (async () => {
    switch (tipo) {
      case "servicos":
        return getServicesReport(companyId);
      case "veiculos":
        return getVehiclesReport(companyId);
      case "estoque":
        return getInventoryReport(companyId);
      case "equipe":
        return getTeamReport(companyId);
      case "checklists":
        return getChecklistsReport(companyId);
    }
  })();

  const label = REPORT_TYPES.find((r) => r.value === tipo)?.label ?? tipo;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Relatórios</h1>

      <nav className="flex flex-wrap gap-1 rounded-md border border-neutral-200 bg-white p-1 text-sm print:hidden">
        {REPORT_TYPES.map((r) => (
          <Link
            key={r.value}
            href={`/relatorios?tipo=${r.value}`}
            className={`rounded px-3 py-1.5 ${
              r.value === tipo ? "bg-navy-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{label}</h2>

      <ReportTable title={label} rows={rows} />
    </div>
  );
}
