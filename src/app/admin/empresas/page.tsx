import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listAllCompanies } from "@/server/services/platform-admin.service";
import { Badge } from "@/components/ui";

const STATUS_TONE: Record<string, "approved" | "pending" | "rejected" | "neutral"> = {
  TRIAL: "pending",
  ACTIVE: "approved",
  PAST_DUE: "pending",
  SUSPENDED: "rejected",
  CANCELED: "neutral",
  EXPIRED: "neutral",
};

export default async function AdminEmpresasPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const companies = await listAllCompanies();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Empresas</h1>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3">Usuários</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-800">{c.nomeFantasia}</td>
                <td className="px-4 py-3 text-neutral-600">{c.cnpj}</td>
                <td className="px-4 py-3 text-neutral-600">{c._count.users}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/empresas/${c.id}`} className="text-navy-700 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
