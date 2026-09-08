import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listRecentAuditLogs } from "@/server/services/platform-admin.service";

export default async function AdminLogsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const logs = await listRecentAuditLogs();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Logs de auditoria</h1>
      <p className="text-sm text-neutral-500">Últimas 100 ações registradas em toda a plataforma.</p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Ação</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Usuário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-2 text-neutral-500">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(log.createdAt)}
                </td>
                <td className="px-4 py-2 font-medium text-neutral-800">{log.action}</td>
                <td className="px-4 py-2 text-neutral-600">{log.company?.nomeFantasia ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-600">{log.user?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
