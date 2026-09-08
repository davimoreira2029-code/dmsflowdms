import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listUrns } from "@/server/services/urn.service";
import { Badge } from "@/components/ui";
import { NewUrnForm } from "@/features/urns/new-urn-form";

export default async function UrnasPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const urns = await listUrns(session.user.companyId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Urnas</h1>

      {urns.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
          Nenhuma urna cadastrada ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Fabricante</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {urns.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">{u.modelo}</td>
                  <td className="px-4 py-3 text-neutral-600">{u.fabricante ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{u.material ?? "—"}</td>
                  <td className="px-4 py-3">{u.quantidade}</td>
                  <td className="px-4 py-3">
                    {u.abaixoDoMinimo && <Badge tone="rejected">Abaixo do mínimo</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Cadastrar urna
        </h2>
        <NewUrnForm />
      </section>
    </div>
  );
}
