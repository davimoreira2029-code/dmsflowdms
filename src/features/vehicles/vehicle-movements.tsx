"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

interface MovementView {
  id: string;
  kmInicial: number;
  kmFinal: number | null;
  data: string | Date;
  motorista: { name: string } | null;
  observacao: string | null;
}

export function VehicleMovements({
  vehicleId,
  kmAtual,
  movements,
  vehicleStatus,
}: {
  vehicleId: string;
  kmAtual: number;
  movements: MovementView[];
  vehicleStatus: string;
}) {
  const router = useRouter();
  const [kmInicial, setKmInicial] = useState(String(kmAtual));
  const [kmFinalDrafts, setKmFinalDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openMovement = movements.find((m) => m.kmFinal === null);

  async function startTrip(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/vehicles/${vehicleId}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kmInicial: Number(kmInicial) }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }
    router.refresh();
  }

  async function closeTrip(movementId: string) {
    const kmFinal = kmFinalDrafts[movementId];
    if (!kmFinal) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/vehicles/movements/${movementId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kmFinal: Number(kmFinal) }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!openMovement && vehicleStatus === "DISPONIVEL" && (
        <form onSubmit={startTrip} className="flex items-end gap-2 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex-1">
            <Label htmlFor="kmInicial">Iniciar viagem — KM inicial</Label>
            <Input id="kmInicial" type="number" value={kmInicial} onChange={(e) => setKmInicial(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading}>
            Iniciar
          </Button>
        </form>
      )}

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">KM inicial</th>
              <th className="px-4 py-2">KM final</th>
              <th className="px-4 py-2">Percorrido</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 text-neutral-600">
                  {new Intl.DateTimeFormat("pt-BR").format(new Date(m.data))}
                </td>
                <td className="px-4 py-2">{m.kmInicial.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2">
                  {m.kmFinal !== null ? (
                    m.kmFinal.toLocaleString("pt-BR")
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="KM final"
                        className="w-28"
                        value={kmFinalDrafts[m.id] ?? ""}
                        onChange={(e) => setKmFinalDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                      />
                      <Button
                        variant="secondary"
                        disabled={loading || !kmFinalDrafts[m.id]}
                        onClick={() => closeTrip(m.id)}
                      >
                        Encerrar
                      </Button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-neutral-600">
                  {m.kmFinal !== null ? `${(m.kmFinal - m.kmInicial).toLocaleString("pt-BR")} km` : "—"}
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
