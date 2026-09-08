"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, FormMessage } from "@/components/ui";

const initialState = {
  tipo: "",
  data: "",
  hora: "",
  falecidoNome: "",
  local: "",
  destino: "",
  ornamentacao: "",
  observacoes: "",
};

export default function NovoServicoPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initialState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/services", {
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

    router.push(`/servicos/${json.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-navy-900">Novo serviço</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo de serviço</Label>
            <Input id="tipo" required value={form.tipo} onChange={(e) => update("tipo", e.target.value)} placeholder="Sepultamento, Cremação..." />
          </div>
          <div className="col-span-2">
            <Label htmlFor="falecidoNome">Nome do registro</Label>
            <Input id="falecidoNome" required value={form.falecidoNome} onChange={(e) => update("falecidoNome", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" required value={form.data} onChange={(e) => update("data", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="hora">Hora</Label>
            <Input id="hora" type="time" required value={form.hora} onChange={(e) => update("hora", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="local">Local</Label>
            <Input id="local" value={form.local} onChange={(e) => update("local", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="destino">Destino</Label>
            <Input id="destino" value={form.destino} onChange={(e) => update("destino", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Input id="observacoes" value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} />
          </div>
        </div>

        {error && <FormMessage tone="error">{error}</FormMessage>}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar serviço"}
          </Button>
          <Link href="/servicos">
            <Button type="button" variant="secondary">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
