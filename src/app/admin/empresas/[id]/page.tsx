import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getCompanyDetail } from "@/server/services/platform-admin.service";
import { Badge } from "@/components/ui";
import { CompanyStatusAction } from "@/features/admin/company-status-action";

export default async function AdminEmpresaDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const company = await getCompanyDetail(params.id);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-navy-900">{company.nomeFantasia}</h1>
        <Badge tone="neutral">{company.status}</Badge>
      </div>
      <p className="text-sm text-neutral-600">{company.razaoSocial} — {company.cnpj}</p>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-neutral-500">Serviços</p>
          <p className="text-xl font-semibold text-navy-900">{company._count.services}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-neutral-500">Veículos</p>
          <p className="text-xl font-semibold text-navy-900">{company._count.vehicles}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-neutral-500">Funcionários</p>
          <p className="text-xl font-semibold text-navy-900">{company._count.employees}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Usuários</h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Papel</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {company.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 text-neutral-800">{u.name}</td>
                  <td className="px-4 py-2 text-neutral-600">{u.email}</td>
                  <td className="px-4 py-2 text-neutral-600">{u.role}</td>
                  <td className="px-4 py-2 text-neutral-600">{u.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Ações administrativas</h2>
        <CompanyStatusAction companyId={company.id} currentStatus={company.status} />
      </section>
    </div>
  );
}
