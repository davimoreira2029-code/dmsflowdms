"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, FormMessage } from "@/components/ui";

interface TemplateOption {
  id: string;
  nome: string;
}

interface ChecklistItem {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  status: "PENDENTE" | "CONCLUIDO" | "NAO_APLICAVEL";
}

interface AppliedChecklist {
  id: string;
  items: ChecklistItem[];
}

export function ServiceChecklists({
  serviceId,
  availableTemplates,
  appliedChecklists,
}: {
  serviceId: string;
  availableTemplates: TemplateOption[];
  appliedChecklists: AppliedChecklist[];
}) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyTemplate() {
    if (!selectedTemplate) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/services/${serviceId}/checklists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selectedTemplate }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setSelectedTemplate("");
    router.refresh();
  }

  async function toggleItem(itemId: string, currentStatus: string) {
    const nextStatus = currentStatus === "CONCLUIDO" ? "PENDENTE" : "CONCLUIDO";
    await fetch(`/api/checklist-items/${itemId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {appliedChecklists.map((checklist) => (
        <div key={checklist.id} className="rounded-lg border border-neutral-200 bg-white p-4">
          <ul className="space-y-2">
            {checklist.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.status === "CONCLUIDO"}
                  onChange={() => toggleItem(item.id, item.status)}
                />
                <span className={item.status === "CONCLUIDO" ? "text-neutral-400 line-through" : "text-neutral-800"}>
                  {item.descricao}
                </span>
                {item.obrigatorio && <span className="text-xs text-amber-600">obrigatório</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {availableTemplates.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">Selecione um checklist para aplicar...</option>
            {availableTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
          <Button variant="secondary" disabled={loading || !selectedTemplate} onClick={applyTemplate}>
            Aplicar
          </Button>
        </div>
      )}

      {error && <FormMessage tone="error">{error}</FormMessage>}
    </div>
  );
}
