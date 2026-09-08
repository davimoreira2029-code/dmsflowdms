import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listEmployees } from "@/server/services/employee.service";
import { hasPermission } from "@/server/permissions";
import { Badge } from "@/components/ui";
import { NewEmployeeForm } from "@/features/employees/new-employee-form";

export default async function EquipePage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const canViewSensitiveData = hasPermission(session.user.role, "MANAGE_USERS");
  const status = searchParams.status === "ATIVO" || searchParams.status === "INATIVO" ? searchParams.status : undefined;

  const employees = await listEmployees(
    session.user.companyId,
    { search: searchParams.search, status },
    canViewSensitiveData,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Equipe</h1>

      <form className="flex gap-3" method="GET">
        <input
          type="text"
          name="search"
          placeholder="Buscar por nome..."
          defaultValue={searchParams.search}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-md border border-neutral-200 px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
        <button type="submit" className="rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
          Filtrar
        </button>
      </form>

      {!canViewSensitiveData && (
        <p className="text-xs text-neutral-400">
          CPF exibido parcialmente — apenas usuários com permissão de gestão veem o dado completo.
        </p>
      )}

      {employees.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
          Nenhum funcionário encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">{e.nome}</td>
                  <td className="px-4 py-3 text-neutral-600">{e.cpf ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{e.cargo ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{e.setor ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={e.status === "ATIVO" ? "approved" : "neutral"}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Cadastrar funcionário
        </h2>
        <NewEmployeeForm />
      </section>
    </div>
  );
}
