"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

interface PlanView {
  id: string;
  nome: string;
  precoCentavos: number;
  limiteUsuarios: number;
  ativo: boolean;
}

export function PlanEditRow({ plan }: { plan: PlanView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [preco, setPreco] = useState(String(plan.precoCentavos / 100));
  const [limite, setLimite] = useState(String(plan.limiteUsuarios));
  const [ativo, setAtivo] = useState(plan.ativo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        precoCentavos: Math.round(Number(preco) * 100),
        limiteUsuarios: Number(limite),
        ativo,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <tr>
        <td className="px-4 py-3 font-medium text-neutral-800">{plan.nome}</td>
        <td className="px-4 py-3 text-neutral-600">R$ {(plan.precoCentavos / 100).toFixed(2)}</td>
        <td className="px-4 py-3 text-neutral-600">{plan.limiteUsuarios}</td>
        <td className="px-4 py-3 text-neutral-600">{plan.ativo ? "Ativo" : "Inativo"}</td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)} className="text-navy-700 hover:underline">
            Editar
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-3 font-medium text-neutral-800">{plan.nome}</td>
      <td className="px-4 py-3">
        <Label htmlFor={`preco-${plan.id}`} className="sr-only">Preço</Label>
        <Input id={`preco-${plan.id}`} type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-24" />
      </td>
      <td className="px-4 py-3">
        <Input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-20" />
      </td>
      <td className="px-4 py-3">
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo
        </label>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={loading} onClick={save}>
            Salvar
          </Button>
          <button onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:underline">
            Cancelar
          </button>
        </div>
        {error && <div className="mt-1"><FormMessage tone="error">{error}</FormMessage></div>}
      </td>
    </tr>
  );
}
