import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getVehicleDetail } from "@/server/services/vehicle.service";
import { Badge } from "@/components/ui";
import { VehicleMovements } from "@/features/vehicles/vehicle-movements";

const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  INATIVO: "Inativo",
};

export default async function VeiculoDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const vehicle = await getVehicleDetail(params.id, session.user.companyId);
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-navy-900">{vehicle.placa}</h1>
        <Badge tone="neutral">{STATUS_LABEL[vehicle.status] ?? vehicle.status}</Badge>
      </div>
      <p className="text-sm text-neutral-600">
        {vehicle.marca} {vehicle.modelo} — {vehicle.kmAtual.toLocaleString("pt-BR")} km
      </p>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Movimentações</h2>
        <VehicleMovements
          vehicleId={vehicle.id}
          kmAtual={vehicle.kmAtual}
          vehicleStatus={vehicle.status}
          movements={vehicle.movements}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Manutenções</h2>
        {vehicle.maintenances.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma manutenção registrada.</p>
        ) : (
          <ul className="space-y-2">
            {vehicle.maintenances.map((m) => (
              <li key={m.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <p className="font-medium text-navy-900">
                  {m.tipo === "PREVENTIVA" ? "Preventiva" : "Corretiva"} — {m.status}
                </p>
                {m.descricao && <p className="text-neutral-600">{m.descricao}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
