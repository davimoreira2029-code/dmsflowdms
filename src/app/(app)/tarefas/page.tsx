import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listTasks } from "@/server/services/task.service";
import { Badge } from "@/components/ui";
import { NewTaskForm } from "@/features/tasks/new-task-form";

const PRIORITY_TONE: Record<string, "rejected" | "pending" | "approved" | "neutral"> = {
  URGENTE: "rejected",
  ALTA: "pending",
  NORMAL: "neutral",
  BAIXA: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function TarefasPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const tasks = await listTasks(session.user.companyId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Tarefas</h1>

      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
          Nenhuma tarefa cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/tarefas/${t.id}`}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              <div>
                <p className="font-medium text-navy-900">{t.titulo}</p>
                <p className="text-xs text-neutral-500">
                  {t.responsavel?.name ?? "Sem responsável"}
                  {t.prazo && ` — prazo ${new Intl.DateTimeFormat("pt-BR").format(t.prazo)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={PRIORITY_TONE[t.prioridade] ?? "neutral"}>{t.prioridade}</Badge>
                <span className="text-xs text-neutral-500">{STATUS_LABEL[t.status] ?? t.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Nova tarefa</h2>
        <NewTaskForm />
      </section>
    </div>
  );
}
