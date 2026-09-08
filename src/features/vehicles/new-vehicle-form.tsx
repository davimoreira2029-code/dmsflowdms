"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export function NewVehicleForm() {
  const router = useRouter();
  const [form, setForm] = useState({ placa: "", marca: "", modelo: "", ano: "", kmAtual: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/vehicles", {
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

    setForm({ placa: "", marca: "", modelo: "", ano: "", kmAtual: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" required value={form.placa} onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="ano">Ano</Label>
          <Input id="ano" type="number" value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="kmAtual">KM atual</Label>
          <Input id="kmAtual" type="number" value={form.kmAtual} onChange={(e) => setForm((f) => ({ ...f, kmAtual: e.target.value }))} />
        </div>
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar veículo"}
      </Button>
    </form>
  );
}
