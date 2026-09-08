import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasPermission } from "@/server/permissions";
import { CompanyBrandingForm } from "@/features/settings/company-branding-form";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const company = await prisma.company.findUnique({ where: { id: session.user.companyId } });
  if (!company) redirect("/login");

  const canViewAuditLogs = hasPermission(session.user.role, "MANAGE_SETTINGS");
  const auditLogs = canViewAuditLogs
    ? await prisma.auditLog.findMany({
        where: { companyId: session.user.companyId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Configurações</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Identidade da empresa
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          O nome e o logo aparecem para todos os usuários da sua empresa dentro da plataforma.
        </p>
        <CompanyBrandingForm initialNomeFantasia={company.nomeFantasia} initialLogoUrl={company.logoUrl} />
      </section>

      {canViewAuditLogs && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Log de atividades
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma atividade registrada ainda.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
                  <tr>
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Ação</th>
                    <th className="px-4 py-2">Usuário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-4 py-2 text-neutral-500">
                        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                          log.createdAt,
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-neutral-800">{log.action}</td>
                      <td className="px-4 py-2 text-neutral-600">{log.user?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
