import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getTaskDetail } from "@/server/services/task.service";
import { Badge } from "@/components/ui";
import { TaskActions } from "@/features/tasks/task-actions";

export default async function TarefaDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const task = await getTaskDetail(params.id, session.user.companyId);
  if (!task) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-navy-900">{task.titulo}</h1>
          <Badge tone="neutral">{task.status}</Badge>
        </div>
        {task.descricao && <p className="mt-2 text-sm text-neutral-600">{task.descricao}</p>}
        <p className="mt-2 text-xs text-neutral-500">
          Responsável: {task.responsavel?.name ?? "—"} · Criado por {task.criador.name}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Ações</h2>
        <TaskActions taskId={task.id} currentStatus={task.status} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Comentários</h2>
        {task.comments.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum comentário ainda.</p>
        ) : (
          <ul className="space-y-3">
            {task.comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <p className="text-neutral-800">{c.texto}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {c.user.name} —{" "}
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(c.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
