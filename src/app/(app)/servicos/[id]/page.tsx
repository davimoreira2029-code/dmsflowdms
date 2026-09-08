import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getServiceDetail } from "@/server/services/service.service";
import { listChecklistTemplates } from "@/server/services/checklist.service";
import { Badge, toneForStatus } from "@/components/ui";
import { ServiceStatusActions } from "@/features/services/service-status-actions";
import { ServiceChecklists } from "@/features/checklists/service-checklists";
import { ServiceTanatopraxia } from "@/features/tanatopraxia/service-tanatopraxia";

const EVENT_LABEL: Record<string, string> = {
  SERVICO_CRIADO: "Serviço criado",
  RESPONSAVEL_ATRIBUIDO: "Responsável atribuído",
  VEICULO_ATRIBUIDO: "Veículo atribuído",
  MEMBRO_ATRIBUIDO: "Membro da equipe atribuído",
  CHECKLIST_INICIADO: "Checklist iniciado",
  CHECKLIST_CONCLUIDO: "Checklist concluído",
  STATUS_ALTERADO: "Status alterado",
  SERVICO_FINALIZADO: "Serviço finalizado",
  SERVICO_ARQUIVADO: "Serviço arquivado",
  TANATOPRAXIA_REGISTRADA: "Registro de tanatopraxia adicionado",
};

export default async function ServicoDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const service = await getServiceDetail(params.id, session.user.companyId);
  if (!service) notFound();

  const templates = await listChecklistTemplates(session.user.companyId);
  const appliedTemplateIds = new Set(service.checklists.map((c) => c.templateId));
  const availableTemplates = templates
    .filter((t) => !appliedTemplateIds.has(t.id))
    .map((t) => ({ id: t.id, nome: t.nome }));

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div>
        <p className="text-xs text-neutral-400">Serviço #{service.numero}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-navy-900">{service.falecidoNome}</h1>
          <Badge tone={toneForStatus(service.status)}>{service.status}</Badge>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
        <div>
          <p className="text-neutral-500">Tipo</p>
          <p className="font-medium text-neutral-800">{service.tipo}</p>
        </div>
        <div>
          <p className="text-neutral-500">Data / Hora</p>
          <p className="font-medium text-neutral-800">
            {new Intl.DateTimeFormat("pt-BR").format(service.data)} — {service.hora}
          </p>
        </div>
        <div>
          <p className="text-neutral-500">Responsável</p>
          <p className="font-medium text-neutral-800">{service.responsavel?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-neutral-500">Veículo</p>
          <p className="font-medium text-neutral-800">{service.veiculo?.placa ?? "—"}</p>
        </div>
        <div>
          <p className="text-neutral-500">Local</p>
          <p className="font-medium text-neutral-800">{service.local ?? "—"}</p>
        </div>
        <div>
          <p className="text-neutral-500">Destino</p>
          <p className="font-medium text-neutral-800">{service.destino ?? "—"}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Ações</h2>
        <ServiceStatusActions serviceId={service.id} currentStatus={service.status} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Checklists</h2>
        <ServiceChecklists
          serviceId={service.id}
          availableTemplates={availableTemplates}
          appliedChecklists={service.checklists}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Tanatopraxia</h2>
        <ServiceTanatopraxia serviceId={service.id} records={service.tanatopraxiaRecords} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Timeline</h2>
        <ol className="space-y-3 border-l-2 border-neutral-200 pl-4">
          {service.events.map((event) => (
            <li key={event.id} className="text-sm">
              <p className="font-medium text-neutral-800">{EVENT_LABEL[event.tipo] ?? event.tipo}</p>
              <p className="text-xs text-neutral-500">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(event.createdAt)}
                {event.user ? ` — ${event.user.name}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
