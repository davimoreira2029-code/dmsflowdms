import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listServices } from "@/server/services/service.service";
import { Badge, toneForStatus } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  EM_PREPARACAO: "Em preparação",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO: "Aguardando",
  FINALIZADO: "Finalizado",
  ARQUIVADO: "Arquivado",
};

const STATUS_TONE_MAP: Record<string, "pending" | "approved" | "completed" | "neutral"> = {
  NOVO: "pending",
  EM_PREPARACAO: "pending",
  EM_ANDAMENTO: "approved",
  AGUARDANDO: "pending",
  FINALIZADO: "completed",
  ARQUIVADO: "neutral",
};

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const services = await listServices(session.user.companyId, {
    status: searchParams.status as never,
    search: searchParams.search,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Serviços</h1>
        <Link
          href="/servicos/novo"
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          Novo serviço
        </Link>
      </div>

      <form className="flex gap-3" method="GET">
        <input
          type="text"
          name="search"
          placeholder="Buscar por nome..."
          defaultValue={searchParams.search}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
          Filtrar
        </button>
      </form>

      {services.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-10 text-center text-sm text-neutral-500">
          Nenhum serviço encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-500">#{s.numero}</td>
                  <td className="px-4 py-3">
                    <Link href={`/servicos/${s.id}`} className="font-medium text-navy-700 hover:underline">
                      {s.falecidoNome}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.tipo}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Intl.DateTimeFormat("pt-BR").format(s.data)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{s.responsavel?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE_MAP[s.status] ?? toneForStatus(s.status)}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
