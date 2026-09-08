import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listVehicles } from "@/server/services/vehicle.service";
import { Badge } from "@/components/ui";
import { NewVehicleForm } from "@/features/vehicles/new-vehicle-form";

const STATUS_TONE: Record<string, "approved" | "pending" | "rejected" | "neutral"> = {
  DISPONIVEL: "approved",
  EM_USO: "pending",
  MANUTENCAO: "rejected",
  INATIVO: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  INATIVO: "Inativo",
};

export default async function VeiculosPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const vehicles = await listVehicles(session.user.companyId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Veículos</h1>

      {vehicles.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
          Nenhum veículo cadastrado ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">KM atual</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/veiculos/${v.id}`} className="font-medium text-navy-700 hover:underline">
                      {v.placa}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {v.marca} {v.modelo}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{v.kmAtual.toLocaleString("pt-BR")} km</td>
                  <td className="px-4 py-3 text-neutral-600">{v.responsavel?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[v.status] ?? "neutral"}>{STATUS_LABEL[v.status] ?? v.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Cadastrar veículo
        </h2>
        <NewVehicleForm />
      </section>
    </div>
  );
}
