"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

interface TanatopraxiaRecordView {
  id: string;
  tipo: string;
  data: string | Date | null;
  horaInicio: string | null;
  horaFim: string | null;
  procedimentos: string | null;
  observacoes: string | null;
  responsavel: { name: string } | null;
  createdAt: string | Date;
}

const TIPO_LABEL: Record<string, string> = {
  NAO_REALIZAR: "Não realizar",
  REALIZAR_TANATOPRAXIA: "Realizar tanatopraxia",
  EMBALSAMAMENTO: "Embalsamamento",
};

export function ServiceTanatopraxia({
  serviceId,
  records,
}: {
  serviceId: string;
  records: TanatopraxiaRecordView[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(records.length === 0);
  const [tipo, setTipo] = useState<"NAO_REALIZAR" | "REALIZAR_TANATOPRAXIA" | "EMBALSAMAMENTO">(
    "REALIZAR_TANATOPRAXIA",
  );
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [procedimentos, setProcedimentos] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/services/${serviceId}/tanatopraxia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, horaInicio, horaFim, procedimentos, observacoes }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setShowForm(false);
    setHoraInicio("");
    setHoraFim("");
    setProcedimentos("");
    setObservacoes("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {records.length > 0 && (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-navy-900">{TIPO_LABEL[r.tipo] ?? r.tipo}</p>
                <p className="text-xs text-neutral-400">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                    new Date(r.createdAt),
                  )}
                </p>
              </div>
              {(r.horaInicio || r.horaFim) && (
                <p className="mt-1 text-neutral-600">
                  {r.horaInicio ?? "—"} até {r.horaFim ?? "—"}
                </p>
              )}
              {r.procedimentos && <p className="mt-1 text-neutral-600">{r.procedimentos}</p>}
              {r.responsavel && <p className="mt-1 text-xs text-neutral-400">Responsável: {r.responsavel.name}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              {Object.entries(TIPO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {tipo !== "NAO_REALIZAR" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="horaInicio">Hora de início</Label>
                  <Input id="horaInicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="horaFim">Hora de término</Label>
                  <Input id="horaFim" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="procedimentos">Procedimentos realizados</Label>
                <Input id="procedimentos" value={procedimentos} onChange={(e) => setProcedimentos(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Input id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          {error && <FormMessage tone="error">{error}</FormMessage>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar registro"}
            </Button>
            {records.length > 0 && (
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          Novo registro
        </Button>
      )}
    </div>
  );
}
