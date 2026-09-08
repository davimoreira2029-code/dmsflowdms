"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export function InventoryMovementForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA" | "AJUSTE">("ENTRADA");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/inventory/products/${productId}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, quantidade: Number(quantidade), motivo }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setQuantidade("");
    setMotivo("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="AJUSTE">Ajuste (define o total)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="quantidade">{tipo === "AJUSTE" ? "Novo total" : "Quantidade"}</Label>
          <Input id="quantidade" type="number" min={0} required value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="motivo">Motivo</Label>
        <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Registrando..." : "Registrar movimentação"}
      </Button>
    </form>
  );
}
