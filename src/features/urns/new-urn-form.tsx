"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export function NewUrnForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    modelo: "",
    fabricante: "",
    tamanho: "",
    material: "",
    quantidade: "0",
    estoqueMinimo: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/urns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setForm({ modelo: "", fabricante: "", tamanho: "", material: "", quantidade: "0", estoqueMinimo: "0" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" required value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="fabricante">Fabricante</Label>
          <Input id="fabricante" value={form.fabricante} onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="tamanho">Tamanho</Label>
          <Input id="tamanho" value={form.tamanho} onChange={(e) => setForm((f) => ({ ...f, tamanho: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="material">Material</Label>
          <Input id="material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="quantidade">Quantidade</Label>
          <Input id="quantidade" type="number" min={0} value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
          <Input id="estoqueMinimo" type="number" min={0} value={form.estoqueMinimo} onChange={(e) => setForm((f) => ({ ...f, estoqueMinimo: e.target.value }))} />
        </div>
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar urna"}
      </Button>
    </form>
  );
}
