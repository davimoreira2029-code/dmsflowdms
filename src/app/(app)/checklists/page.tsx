import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listChecklistTemplates } from "@/server/services/checklist.service";
import { NewTemplateForm } from "@/features/checklists/new-template-form";
import ChecklistActions from "./ChecklistActions";

export default async function ChecklistsPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");
  const templates = await listChecklistTemplates(session.user.companyId);
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Checklists</h1>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Modelos cadastrados</h2>
        {templates.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">Nenhum modelo cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy-900">{t.nome}</p>
                    {t.categoria && <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">{t.categoria}</span>}
                  </div>
                  <ChecklistActions template={t} />
                </div>
                <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                  {t.items.map((item) => (
                    <li key={item.id}>☐ {item.descricao} {item.obrigatorio && <span className="text-xs text-neutral-400">(obrigatorio)</span>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Novo modelo</h2>
        <NewTemplateForm />
      </section>
    </div>
  );
}