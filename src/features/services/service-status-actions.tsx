"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, FormMessage } from "@/components/ui";

const NEXT_STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  NOVO: [{ value: "EM_PREPARACAO", label: "Iniciar preparação" }, { value: "ARQUIVADO", label: "Arquivar" }],
  EM_PREPARACAO: [
    { value: "EM_ANDAMENTO", label: "Marcar em andamento" },
    { value: "AGUARDANDO", label: "Marcar aguardando" },
    { value: "ARQUIVADO", label: "Arquivar" },
  ],
  EM_ANDAMENTO: [
    { value: "AGUARDANDO", label: "Marcar aguardando" },
    { value: "FINALIZADO", label: "Finalizar" },
    { value: "ARQUIVADO", label: "Arquivar" },
  ],
  AGUARDANDO: [
    { value: "EM_ANDAMENTO", label: "Retomar andamento" },
    { value: "FINALIZADO", label: "Finalizar" },
    { value: "ARQUIVADO", label: "Arquivar" },
  ],
  FINALIZADO: [{ value: "ARQUIVADO", label: "Arquivar" }],
  ARQUIVADO: [],
};

export function ServiceStatusActions({ serviceId, currentStatus }: { serviceId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = NEXT_STATUS_OPTIONS[currentStatus] ?? [];

  async function handleChange(status: string) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/services/${serviceId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    router.refresh();
  }

  if (options.length === 0) {
    return <p className="text-sm text-neutral-500">Este serviço está arquivado — sem mais ações disponíveis.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button key={opt.value} variant="secondary" disabled={loading} onClick={() => handleChange(opt.value)}>
            {opt.label}
          </Button>
        ))}
      </div>
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </div>
  );
}
