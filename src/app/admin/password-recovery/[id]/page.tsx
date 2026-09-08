import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getPasswordResetRequest } from "@/server/services/password-reset.service";
import { PasswordRecoveryActions } from "@/features/auth/password-recovery-actions";
import { Badge, toneForStatus } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  COMPLETED: "Concluída",
  EXPIRED: "Expirada",
  CANCELED: "Cancelada",
};

export default async function PasswordRecoveryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const request = await getPasswordResetRequest(params.id);
  if (!request) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-navy-900">Recuperação de senha</h1>

      <dl className="mb-8 grid grid-cols-2 gap-y-4 rounded-lg border border-neutral-200 p-5 text-sm">
        <dt className="text-neutral-500">Usuário</dt>
        <dd className="font-medium text-neutral-800">{request.user.name}</dd>

        <dt className="text-neutral-500">Empresa</dt>
        <dd className="font-medium text-neutral-800">{request.company?.nomeFantasia ?? "—"}</dd>

        <dt className="text-neutral-500">E-mail</dt>
        <dd className="font-medium text-neutral-800">{request.user.email}</dd>

        <dt className="text-neutral-500">Solicitado em</dt>
        <dd className="font-medium text-neutral-800">
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
            request.requestedAt,
          )}
        </dd>

        <dt className="text-neutral-500">Status</dt>
        <dd>
          <Badge tone={toneForStatus(request.status)}>{STATUS_LABEL[request.status]}</Badge>
        </dd>
      </dl>

      {request.status === "PENDING" ? (
        <PasswordRecoveryActions requestId={request.id} />
      ) : (
        <p className="text-sm text-neutral-500">Esta solicitação já foi processada.</p>
      )}
    </main>
  );
}
