"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

interface NotificationView {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  createdAt: string | Date;
}

const TYPE_ICON: Record<string, string> = {
  NOVA_TAREFA: "📝",
  TAREFA_ATRIBUIDA: "📝",
  TAREFA_ATRASADA: "⏰",
  NOVO_SERVICO: "⚰️",
  SERVICO_FINALIZADO: "✅",
  CHECKLIST_PENDENTE: "📋",
  ESTOQUE_BAIXO: "📦",
  MANUTENCAO_VEICULO: "🚗",
};

export function NotificationList({ notifications }: { notifications: NotificationView[] }) {
  const router = useRouter();

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-neutral-200 px-6 py-10 text-center text-sm text-neutral-500">
        Nenhuma notificação por aqui.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={markAllRead}>
          Marcar todas como lidas
        </Button>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
              n.lida ? "border-neutral-200 bg-white" : "border-navy-200 bg-neutral-50"
            }`}
          >
            <span>{TYPE_ICON[n.tipo] ?? "🔔"}</span>
            <div className="flex-1">
              <p className={n.lida ? "text-neutral-600" : "font-medium text-navy-900"}>{n.titulo}</p>
              {n.mensagem && <p className="text-xs text-neutral-500">{n.mensagem}</p>}
              <p className="mt-1 text-xs text-neutral-400">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                  new Date(n.createdAt),
                )}
              </p>
            </div>
            {!n.lida && (
              <button onClick={() => markRead(n.id)} className="text-xs text-navy-700 hover:underline">
                Marcar como lida
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
