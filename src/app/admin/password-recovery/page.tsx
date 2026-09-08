import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listPasswordResetRequests } from "@/server/services/password-reset.service";
import { Badge, toneForStatus } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  COMPLETED: "Concluída",
  EXPIRED: "Expirada",
  CANCELED: "Cancelada",
};

export default async function PasswordRecoveryListPage() {
  const session = await auth();

  // Dupla checagem: mesmo que o middleware já filtre, a página confirma de novo.
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const requests = await listPasswordResetRequests();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-navy-900">
        Solicitações de recuperação de senha
      </h1>
      <p className="mb-8 text-sm text-neutral-600">
        Somente o Super Admin pode aprovar ou rejeitar solicitações.
      </p>

      {requests.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-10 text-center text-sm text-neutral-500">
          Nenhuma solicitação registrada até o momento.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.user.name}</td>
                  <td className="px-4 py-3">{r.company?.nomeFantasia ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{r.user.email}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                      r.requestedAt,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(r.status)}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/password-recovery/${r.id}`}
                      className="font-medium text-navy-700 hover:underline"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
